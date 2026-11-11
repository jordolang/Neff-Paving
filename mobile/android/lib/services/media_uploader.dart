import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api_client.dart';
import '../core/json.dart';

/// A photo/video waiting to be uploaded to a job.
class PendingUpload {
  const PendingUpload({
    required this.path,
    required this.endpoint,
    this.caption = '',
    this.latitude,
    this.longitude,
    this.statusUpdateId,
    required this.createdAt,
    this.attempts = 0,
  });

  factory PendingUpload.fromJson(Json j) => PendingUpload(
        path: asString(j['path']),
        endpoint: asString(j['endpoint']),
        caption: asString(j['caption']),
        latitude: asDouble(j['latitude']),
        longitude: asDouble(j['longitude']),
        statusUpdateId: asIntOrNull(j['statusUpdateId']),
        createdAt: asDate(j['createdAt']) ?? DateTime.now(),
        attempts: asInt(j['attempts']),
      );

  final String path;

  /// e.g. `/jobs/12/media` or `/portal/jobs/12/media`.
  final String endpoint;
  final String caption;
  final double? latitude, longitude;
  final int? statusUpdateId;
  final DateTime createdAt;
  final int attempts;

  PendingUpload retried() => PendingUpload(
        path: path,
        endpoint: endpoint,
        caption: caption,
        latitude: latitude,
        longitude: longitude,
        statusUpdateId: statusUpdateId,
        createdAt: createdAt,
        attempts: attempts + 1,
      );

  Json toJson() => {
        'path': path,
        'endpoint': endpoint,
        'caption': caption,
        'latitude': latitude,
        'longitude': longitude,
        'statusUpdateId': statusUpdateId,
        'createdAt': createdAt.toIso8601String(),
        'attempts': attempts,
      };
}

/// Uploads job media, queueing failures (offline job sites) and retrying
/// every two minutes and on app start.
class MediaUploader extends ChangeNotifier {
  MediaUploader(this._api);

  final ApiClient _api;
  static const _key = 'media_upload_queue_v1';
  final List<PendingUpload> _queue = [];
  Timer? _timer;
  bool _running = false;
  double? progress;

  List<PendingUpload> get queue => List.unmodifiable(_queue);

  Future<void> init() async {
    final raw = (await SharedPreferences.getInstance()).getString(_key);
    if (raw != null) {
      _queue
        ..clear()
        ..addAll((jsonDecode(raw) as List).whereType<Map>().map((m) => PendingUpload.fromJson(Map<String, dynamic>.from(m))));
    }
    _timer ??= Timer.periodic(const Duration(minutes: 2), (_) => retryPending());
    unawaited(retryPending());
  }

  /// Uploads now; on network/server failure queues it and returns false.
  /// Throws [ApiException] for errors retrying won't fix (403, 400).
  Future<bool> upload(PendingUpload item) async {
    try {
      await _send(item);
      return true;
    } on ApiException catch (e) {
      if (e.isRetryable || e.isUnauthorized) {
        _queue.add(item);
        await _save();
        notifyListeners();
        return false;
      }
      rethrow;
    }
  }

  Future<void> _send(PendingUpload item) async {
    progress = 0;
    notifyListeners();
    try {
      await _api.upload(
        item.endpoint,
        item.path,
        fields: {
          'caption': item.caption,
          'latitude': item.latitude,
          'longitude': item.longitude,
          'statusUpdateId': item.statusUpdateId,
        },
        onProgress: (s, t) {
          if (t > 0) {
            progress = s / t;
            notifyListeners();
          }
        },
      );
    } finally {
      progress = null;
      notifyListeners();
    }
  }

  Future<void> retryPending() async {
    if (_running || _queue.isEmpty) return;
    _running = true;
    try {
      final items = List.of(_queue);
      for (final item in items) {
        if (!File(item.path).existsSync()) {
          _queue.remove(item);
          continue;
        }
        try {
          await _send(item);
          _queue.remove(item);
        } on ApiException catch (e) {
          final idx = _queue.indexOf(item);
          if (!(e.isRetryable || e.isUnauthorized) || item.attempts >= 20) {
            _queue.removeAt(idx); // permanent failure
          } else {
            _queue[idx] = item.retried();
          }
          if (e.isNetwork) break;
        }
      }
    } finally {
      _running = false;
      await _save();
      notifyListeners();
    }
  }

  Future<void> clear() async {
    _queue.clear();
    await _save();
    notifyListeners();
  }

  Future<void> _save() async =>
      (await SharedPreferences.getInstance()).setString(_key, jsonEncode(_queue.map((e) => e.toJson()).toList()));

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
