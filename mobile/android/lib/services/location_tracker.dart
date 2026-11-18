import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api_client.dart';
import 'location_queue.dart';

enum TrackingPermission { granted, foregroundOnly, denied, servicesOff }

/// Shares the employee's location ONLY while clocked in (contract
/// "Location tracking rules").
///
/// * Starts after a successful clock-in; stops on clock-out, sign-out, or
///   any `409 not_clocked_in` from `/time/locations`.
/// * Runs as an Android foreground service with an ongoing
///   "Clocked in — location shared" notification.
/// * Batches every 60 s / 50 m and persists unsent points across restarts.
class LocationTracker extends ChangeNotifier {
  LocationTracker(this._api, {required this.companyName});

  final ApiClient _api;
  final String companyName;
  final LocationBatcher _batcher = LocationBatcher();

  static const _queueKey = 'location_queue_v1';
  static const _activeKey = 'location_tracking_active';

  StreamSubscription<Position>? _sub;
  Timer? _timer;
  bool _flushing = false;
  bool _active = false;
  String? lastError;
  DateTime? lastSentAt;

  bool get isActive => _active;
  int get queued => _batcher.length;

  /// Asks for When-In-Use, then Always. Returns what we ended up with.
  static Future<TrackingPermission> ensurePermission() async {
    if (!await Geolocator.isLocationServiceEnabled()) return TrackingPermission.servicesOff;
    var p = await Geolocator.checkPermission();
    if (p == LocationPermission.denied) p = await Geolocator.requestPermission();
    if (p == LocationPermission.denied || p == LocationPermission.deniedForever) {
      return TrackingPermission.denied;
    }
    if (p == LocationPermission.whileInUse) {
      // Second prompt: Android sends the user to settings for "Allow all the time".
      final upgraded = await Geolocator.requestPermission();
      if (upgraded != LocationPermission.always) return TrackingPermission.foregroundOnly;
    }
    return TrackingPermission.granted;
  }

  static Future<Position?> currentPosition() async {
    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 20)),
      );
    } catch (_) {
      return Geolocator.getLastKnownPosition();
    }
  }

  /// Call once at app start with the server's `/time/status`.
  Future<void> resumeIfClockedIn({required bool clockedIn, int pingIntervalSeconds = 60}) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_queueKey);
    if (raw != null) _batcher.restore(jsonDecode(raw) as List<dynamic>);
    if (clockedIn) {
      await start(pingIntervalSeconds: pingIntervalSeconds);
    } else {
      // Off the clock: whatever is queued would be rejected, discard it.
      await _hardStop();
    }
  }

  Future<void> start({int pingIntervalSeconds = 60}) async {
    if (_active) return;
    _batcher.interval = Duration(seconds: pingIntervalSeconds.clamp(15, 600));
    _active = true;
    lastError = null;
    (await SharedPreferences.getInstance()).setBool(_activeKey, true);

    final settings = AndroidSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
      intervalDuration: const Duration(seconds: 15),
      foregroundNotificationConfig: ForegroundNotificationConfig(
        notificationTitle: 'Clocked in — location shared',
        notificationText: '$companyName can see your location until you clock out.',
        notificationChannelName: 'Clocked-in location sharing',
        setOngoing: true,
        enableWakeLock: true,
      ),
    );
    _sub = Geolocator.getPositionStream(locationSettings: settings).listen(
      _onPosition,
      onError: (Object e) {
        lastError = 'Location unavailable: $e';
        notifyListeners();
      },
    );
    _timer = Timer.periodic(const Duration(seconds: 20), (_) => flush());
    notifyListeners();
  }

  void _onPosition(Position p) {
    _batcher.add(LocationPoint(
      latitude: p.latitude,
      longitude: p.longitude,
      accuracy: p.accuracy,
      speed: p.speed >= 0 ? p.speed : null,
      heading: p.heading >= 0 ? p.heading : null,
      recordedAt: p.timestamp.toUtc(),
    ));
    _persist();
    if (_batcher.shouldFlush(DateTime.now())) flush();
  }

  /// Sends due points. `force` ignores the 60 s / 50 m rule (used at clock-out).
  Future<void> flush({bool force = false}) async {
    if (_flushing || _batcher.isEmpty) return;
    if (!force && !_batcher.shouldFlush(DateTime.now())) return;
    _flushing = true;
    try {
      while (!_batcher.isEmpty) {
        final batch = _batcher.takeBatch();
        try {
          await _api.post('/time/locations', {'points': batch.map((p) => p.toJson()).toList()});
          _batcher.markSent(batch, DateTime.now());
          lastSentAt = DateTime.now();
          lastError = null;
        } on ApiException catch (e) {
          if (e.isNotClockedIn || e.status == 409) {
            // Server says we're off the clock: stop immediately, drop points.
            await _hardStop();
            return;
          }
          _batcher.requeue(batch);
          lastError = e.isRetryable ? 'Offline — ${_batcher.length} points queued' : e.message;
          break;
        }
      }
    } finally {
      _flushing = false;
      await _persist();
      notifyListeners();
    }
  }

  /// Clock-out path: push what we have (still on the clock), then stop.
  Future<void> stopAfterFinalFlush() async {
    await flush(force: true);
    await _hardStop();
  }

  /// Sign-out / not-clocked-in path: stop and discard.
  Future<void> stop() => _hardStop();

  Future<void> _hardStop() async {
    await _sub?.cancel();
    _sub = null;
    _timer?.cancel();
    _timer = null;
    _active = false;
    _batcher.clear();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_queueKey);
    await prefs.setBool(_activeKey, false);
    notifyListeners();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_queueKey, jsonEncode(_batcher.toJson()));
  }

  @override
  void dispose() {
    _sub?.cancel();
    _timer?.cancel();
    super.dispose();
  }
}
