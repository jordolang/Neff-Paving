import 'dart:math' as math;

import '../core/json.dart';

/// One GPS fix, shaped like an item of `POST /time/locations` `points`.
class LocationPoint {
  const LocationPoint({
    required this.latitude,
    required this.longitude,
    this.accuracy,
    this.speed,
    this.heading,
    this.batteryLevel,
    required this.recordedAt,
  });

  factory LocationPoint.fromJson(Json j) => LocationPoint(
        latitude: asDouble(j['latitude']) ?? 0,
        longitude: asDouble(j['longitude']) ?? 0,
        accuracy: asDouble(j['accuracy']),
        speed: asDouble(j['speed']),
        heading: asDouble(j['heading']),
        batteryLevel: asDouble(j['batteryLevel']),
        recordedAt: DateTime.tryParse(asString(j['recordedAt']))?.toUtc() ?? DateTime.now().toUtc(),
      );

  final double latitude, longitude;
  final double? accuracy, speed, heading, batteryLevel;
  final DateTime recordedAt;

  Json toJson() => {
        'latitude': latitude,
        'longitude': longitude,
        if (accuracy != null) 'accuracy': accuracy,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
        if (batteryLevel != null) 'batteryLevel': batteryLevel,
        'recordedAt': recordedAt.toUtc().toIso8601String(),
      };
}

/// Great-circle distance in meters.
double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
  const r = 6371000.0;
  double rad(double d) => d * math.pi / 180;
  final dLat = rad(lat2 - lat1);
  final dLon = rad(lon2 - lon1);
  final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(rad(lat1)) * math.cos(rad(lat2)) * math.sin(dLon / 2) * math.sin(dLon / 2);
  return 2 * r * math.asin(math.min(1, math.sqrt(a)));
}

/// Pure batching logic for location uploads (no I/O, fully unit-tested).
///
/// Contract rule: send every `interval` (default 60 s) **or** every
/// `distance` (default 50 m) moved, whichever comes first, and keep points
/// queued while offline.
class LocationBatcher {
  LocationBatcher({
    this.interval = const Duration(seconds: 60),
    this.distance = 50,
    this.maxQueued = 5000,
    this.maxBatch = 500,
  });

  Duration interval;
  final double distance;

  /// Oldest points are dropped beyond this many to bound storage while offline.
  final int maxQueued;
  final int maxBatch;

  final List<LocationPoint> _pending = [];
  DateTime? lastFlushAt;
  LocationPoint? lastSentPoint;

  List<LocationPoint> get pending => List.unmodifiable(_pending);
  bool get isEmpty => _pending.isEmpty;
  int get length => _pending.length;

  void add(LocationPoint p) {
    _pending.add(p);
    if (_pending.length > maxQueued) {
      _pending.removeRange(0, _pending.length - maxQueued);
    }
  }

  /// Whether a flush is due at [now].
  bool shouldFlush(DateTime now) {
    if (_pending.isEmpty) return false;
    final last = lastFlushAt;
    if (last == null) return true; // first point after clock-in goes out at once
    if (now.difference(last) >= interval) return true;
    final anchor = lastSentPoint ?? _pending.first;
    final newest = _pending.last;
    return distanceMeters(anchor.latitude, anchor.longitude, newest.latitude, newest.longitude) >= distance;
  }

  /// Removes and returns up to [maxBatch] oldest points.
  List<LocationPoint> takeBatch() {
    final n = math.min(maxBatch, _pending.length);
    final batch = _pending.sublist(0, n);
    _pending.removeRange(0, n);
    return batch;
  }

  /// Records a successful send.
  void markSent(List<LocationPoint> batch, DateTime now) {
    lastFlushAt = now;
    if (batch.isNotEmpty) lastSentPoint = batch.last;
  }

  /// Puts a failed batch back at the front, preserving order.
  void requeue(List<LocationPoint> batch) {
    _pending.insertAll(0, batch);
    if (_pending.length > maxQueued) {
      _pending.removeRange(0, _pending.length - maxQueued);
    }
  }

  void clear() {
    _pending.clear();
    lastFlushAt = null;
    lastSentPoint = null;
  }

  List<Json> toJson() => _pending.map((p) => p.toJson()).toList();

  void restore(List<dynamic> raw) {
    _pending
      ..clear()
      ..addAll(raw.whereType<Map>().map((m) => LocationPoint.fromJson(Map<String, dynamic>.from(m))));
  }
}
