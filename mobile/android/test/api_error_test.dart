import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:neff_service/core/api_client.dart';

DioException err(int status, [Object? data]) {
  final req = RequestOptions(path: '/x');
  return DioException(
    requestOptions: req,
    response: Response(requestOptions: req, statusCode: status, data: data),
  );
}

void main() {
  test('uses the contract error envelope', () {
    final e = ApiException.fromDio(err(409, {
      'error': {'code': 'not_clocked_in', 'message': 'Clock in first'},
    }));
    expect(e.code, 'not_clocked_in');
    expect(e.isNotClockedIn, isTrue);
    expect(e.message, 'Clock in first');
    expect(e.status, 409);
  });

  test('falls back to status codes', () {
    expect(ApiException.fromDio(err(401)).isUnauthorized, isTrue);
    expect(ApiException.fromDio(err(403)).code, 'forbidden');
    expect(ApiException.fromDio(err(429)).code, 'rate_limited');
    expect(ApiException.fromDio(err(429)).isRetryable, isTrue);
    expect(ApiException.fromDio(err(500, '<html>')).code, 'server_error');
  });

  test('no response means network', () {
    final e = ApiException.fromDio(DioException(requestOptions: RequestOptions(path: '/x')));
    expect(e.isNetwork, isTrue);
    expect(e.isRetryable, isTrue);
  });
}
