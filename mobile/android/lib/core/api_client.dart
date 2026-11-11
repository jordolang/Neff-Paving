import 'dart:async';

import 'package:dio/dio.dart';

import 'company_config.dart';
import 'json.dart';
import 'token_store.dart';

/// Error with a contract error code (`bad_request`, `unauthorized`,
/// `forbidden`, `not_found`, `conflict`, `not_clocked_in`, `server_error`)
/// or `network` when the request never reached the server.
class ApiException implements Exception {
  const ApiException(this.code, this.message, {this.status});

  final String code;
  final String message;
  final int? status;

  bool get isNetwork => code == 'network';
  bool get isUnauthorized => code == 'unauthorized' || status == 401;
  bool get isNotClockedIn => code == 'not_clocked_in';
  bool get isRetryable => isNetwork || code == 'server_error' || code == 'rate_limited';

  @override
  String toString() => message;

  static ApiException fromDio(DioException e) {
    final res = e.response;
    if (res == null) {
      return const ApiException('network', 'Cannot reach the server. Check your connection and try again.');
    }
    final body = res.data;
    final err = body is Map ? asMapOrNull(body['error']) : null;
    final status = res.statusCode ?? 0;
    final fallbackCode = switch (status) {
      400 => 'bad_request',
      401 => 'unauthorized',
      403 => 'forbidden',
      404 => 'not_found',
      409 => 'conflict',
      429 => 'rate_limited',
      _ => 'server_error',
    };
    final code = asString(err?['code'], fallbackCode);
    final message = asString(
      err?['message'],
      switch (code) {
        'unauthorized' => 'Please sign in again.',
        'forbidden' => "You don't have access to that.",
        'not_found' => 'Not found.',
        'not_clocked_in' => 'You are not clocked in.',
        'rate_limited' => 'Too many requests. Please wait a moment and try again.',
        _ => 'Something went wrong (HTTP $status).',
      },
    );
    return ApiException(code, message, status: status);
  }
}

/// A paginated-or-not list response: `{ data: [...], meta: { total } }`.
class ApiList {
  const ApiList(this.items, this.total);
  final List<Json> items;
  final int total;
}

/// Thin wrapper over Dio implementing the contract conventions: base URL,
/// `X-Company` tenant header, bearer auth, refresh-on-401 with a single
/// in-flight refresh, `{ data }` unwrapping and error mapping.
class ApiClient {
  ApiClient(this.config, this.tokens, {Dio? dio}) : _dio = dio ?? Dio() {
    _dio.options
      ..baseUrl = config.apiBaseUrl
      ..connectTimeout = const Duration(seconds: 15)
      ..receiveTimeout = const Duration(seconds: 60)
      ..headers['X-Company'] = config.key
      ..headers['Accept'] = 'application/json';
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = tokens.accessToken;
        if (token != null && token.isNotEmpty && options.extra['noAuth'] != true) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (e, handler) async {
        final req = e.requestOptions;
        final canRetry = e.response?.statusCode == 401 &&
            req.extra['noAuth'] != true &&
            req.extra['retried'] != true &&
            (tokens.refreshToken ?? '').isNotEmpty;
        if (!canRetry) return handler.next(e);
        final ok = await _refresh();
        if (!ok) {
          onSessionExpired?.call();
          return handler.next(e);
        }
        try {
          req.extra['retried'] = true;
          req.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
          final data = req.data;
          if (data is FormData) {
            // A consumed multipart body can't be re-sent; let the caller retry.
            return handler.next(e);
          }
          final res = await _dio.fetch<dynamic>(req);
          handler.resolve(res);
        } on DioException catch (retryErr) {
          handler.next(retryErr);
        }
      },
    ));
  }

  final CompanyConfig config;
  final TokenStore tokens;
  final Dio _dio;

  /// Called when the refresh token is rejected; the session layer signs out.
  void Function()? onSessionExpired;

  Future<bool>? _refreshing;

  Future<bool> _refresh() {
    return _refreshing ??= () async {
      try {
        final res = await _dio.post<dynamic>(
          '/auth/refresh',
          data: {'refreshToken': tokens.refreshToken},
          options: Options(extra: {'noAuth': true}),
        );
        final data = asMap(asMap(res.data)['data']);
        final access = asString(data['accessToken']);
        if (access.isEmpty) return false;
        await tokens.save(access: access, refresh: asStringOrNull(data['refreshToken']));
        return true;
      } on DioException {
        return false;
      } finally {
        _refreshing = null;
      }
    }();
  }

  Future<dynamic> _send(Future<Response<dynamic>> Function() call) async {
    try {
      final res = await call();
      final body = res.data;
      if (body is Map && body.containsKey('data')) return body['data'];
      return body;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  Options _opts(bool auth) => Options(extra: {'noAuth': !auth});

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.get<dynamic>(path, queryParameters: _clean(query)));

  Future<dynamic> post(String path, [Object? body, bool auth = true]) =>
      _send(() => _dio.post<dynamic>(path, data: body ?? const <String, dynamic>{}, options: _opts(auth)));

  Future<dynamic> put(String path, [Object? body]) =>
      _send(() => _dio.put<dynamic>(path, data: body ?? const <String, dynamic>{}));

  Future<dynamic> delete(String path) => _send(() => _dio.delete<dynamic>(path));

  /// GET returning `{ data: [...], meta }`.
  Future<ApiList> list(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await _dio.get<dynamic>(path, queryParameters: _clean(query));
      final body = asMap(res.data);
      final raw = body['data'];
      final items = raw is List ? raw.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : <Json>[];
      return ApiList(items, asInt(asMap(body['meta'])['total'], items.length));
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }

  /// Convenience: list and parse.
  Future<List<T>> listOf<T>(String path, T Function(Json) parse, {Map<String, dynamic>? query}) async =>
      (await list(path, query: query)).items.map(parse).toList();

  /// Multipart upload with the file in field `file`.
  Future<dynamic> upload(
    String path,
    String filePath, {
    Map<String, Object?> fields = const {},
    void Function(int sent, int total)? onProgress,
  }) async {
    final form = FormData.fromMap({
      for (final e in fields.entries)
        if (e.value != null) e.key: e.value.toString(),
      'file': await MultipartFile.fromFile(filePath, filename: filePath.split('/').last),
    });
    return _send(() => _dio.post<dynamic>(
          path,
          data: form,
          onSendProgress: onProgress,
          options: Options(sendTimeout: const Duration(minutes: 10), receiveTimeout: const Duration(minutes: 2)),
        ));
  }

  /// Absolute URL for a path the API returned relative (e.g. `/uploads/x.jpg`).
  String absoluteUrl(String url) {
    if (url.startsWith('http')) return url;
    final base = Uri.parse(config.apiBaseUrl);
    return base.replace(path: url.startsWith('/') ? url : '/$url', query: null).toString();
  }

  static Map<String, dynamic>? _clean(Map<String, dynamic>? q) {
    if (q == null) return null;
    final out = <String, dynamic>{};
    q.forEach((k, v) {
      if (v != null && v.toString().isNotEmpty) out[k] = v;
    });
    return out;
  }
}
