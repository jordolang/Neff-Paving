import 'package:flutter_test/flutter_test.dart';
import 'package:neff_service/services/location_queue.dart';

LocationPoint p(double lat, double lng, DateTime t) => LocationPoint(latitude: lat, longitude: lng, recordedAt: t);

void main() {
  final t0 = DateTime.utc(2026, 11, 11, 12);

  test('first point after clock-in flushes immediately', () {
    final b = LocationBatcher();
    expect(b.shouldFlush(t0), isFalse); // empty
    b.add(p(39.94, -82.01, t0));
    expect(b.shouldFlush(t0), isTrue);
  });

  test('flushes after the interval elapses', () {
    final b = LocationBatcher(interval: const Duration(seconds: 60));
    b.markSent([p(39.94, -82.01, t0)], t0);
    b.add(p(39.94, -82.01, t0.add(const Duration(seconds: 10))));
    expect(b.shouldFlush(t0.add(const Duration(seconds: 30))), isFalse);
    expect(b.shouldFlush(t0.add(const Duration(seconds: 60))), isTrue);
  });

  test('flushes early once moved 50 m from the last sent point', () {
    final b = LocationBatcher(distance: 50);
    b.markSent([p(39.9400, -82.0100, t0)], t0);
    b.add(p(39.9402, -82.0100, t0)); // ~22 m north
    expect(b.shouldFlush(t0.add(const Duration(seconds: 5))), isFalse);
    b.add(p(39.9406, -82.0100, t0)); // ~67 m north
    expect(b.shouldFlush(t0.add(const Duration(seconds: 6))), isTrue);
  });

  test('takeBatch respects maxBatch and requeue preserves order', () {
    final b = LocationBatcher(maxBatch: 2);
    for (var i = 0; i < 5; i++) {
      b.add(p(i.toDouble(), 0, t0.add(Duration(seconds: i))));
    }
    final first = b.takeBatch();
    expect(first.map((e) => e.latitude), [0, 1]);
    expect(b.length, 3);
    b.requeue(first);
    expect(b.pending.map((e) => e.latitude), [0, 1, 2, 3, 4]);
  });

  test('offline queue is bounded, dropping oldest', () {
    final b = LocationBatcher(maxQueued: 3);
    for (var i = 0; i < 5; i++) {
      b.add(p(i.toDouble(), 0, t0));
    }
    expect(b.pending.map((e) => e.latitude), [2, 3, 4]);
  });

  test('persists and restores through JSON in contract shape', () {
    final b = LocationBatcher();
    b.add(LocationPoint(latitude: 39.9, longitude: -82.0, accuracy: 8, speed: 1.5, heading: 90, recordedAt: t0));
    final json = b.toJson();
    expect(json.single.keys, containsAll(['latitude', 'longitude', 'accuracy', 'speed', 'heading', 'recordedAt']));
    expect(json.single['recordedAt'], '2026-11-11T12:00:00.000Z');
    final c = LocationBatcher()..restore(json);
    expect(c.pending.single.latitude, 39.9);
    expect(c.pending.single.recordedAt, t0);
  });

  test('clear resets state', () {
    final b = LocationBatcher()..add(p(1, 1, t0));
    b.markSent([p(1, 1, t0)], t0);
    b.clear();
    expect(b.isEmpty, isTrue);
    expect(b.lastFlushAt, isNull);
  });

  test('haversine distance is sane', () {
    // 1 degree of latitude ≈ 111.2 km
    expect(distanceMeters(0, 0, 1, 0), closeTo(111195, 50));
    expect(distanceMeters(39.94, -82.01, 39.94, -82.01), 0);
  });
}
