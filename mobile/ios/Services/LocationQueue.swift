import Foundation

/// A location sample in the shape `POST /time/locations` expects.
struct LocationPoint: Codable, Equatable {
    var latitude: Double
    var longitude: Double
    var accuracy: Double?
    var speed: Double?
    var heading: Double?
    var batteryLevel: Double?
    var recordedAt: Date

    var json: JSONValue {
        ["latitude": .number(latitude), "longitude": .number(longitude),
         "accuracy": .optional(accuracy), "speed": .optional(speed), "heading": .optional(heading),
         "batteryLevel": .optional(batteryLevel), "recordedAt": .date(recordedAt)]
    }

    /// Great-circle distance in meters (haversine) — keeps this type free of CoreLocation so it
    /// can be unit-tested anywhere.
    func distance(to other: LocationPoint) -> Double {
        let radius = 6_371_000.0
        let lat1 = latitude * .pi / 180, lat2 = other.latitude * .pi / 180
        let dLat = (other.latitude - latitude) * .pi / 180
        let dLon = (other.longitude - longitude) * .pi / 180
        let a = sin(dLat / 2) * sin(dLat / 2) + cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2)
        return radius * 2 * atan2(sqrt(a), sqrt(1 - a))
    }
}

/// Contract rule 3: flush every `interval` seconds or after moving `distance` meters,
/// whichever comes first.
struct FlushPolicy: Equatable {
    var interval: TimeInterval = 60
    var distance: Double = 50

    func shouldFlush(now: Date, lastFlushAt: Date?, lastFlushedPoint: LocationPoint?, latest: LocationPoint?, pending: Int) -> Bool {
        guard pending > 0 else { return false }
        guard let lastFlushAt else { return true }
        if now.timeIntervalSince(lastFlushAt) >= interval { return true }
        if let latest, let lastFlushedPoint, latest.distance(to: lastFlushedPoint) >= distance { return true }
        return false
    }
}

/// Disk-backed FIFO of location points that survives app termination and offline periods.
final class LocationQueue: @unchecked Sendable {
    static let maxStoredPoints = 5_000

    private let fileURL: URL?
    private let lock = NSLock()
    private var points: [LocationPoint]

    /// - Parameter fileURL: where to persist; `nil` keeps the queue in memory (tests).
    init(fileURL: URL?) {
        self.fileURL = fileURL
        if let fileURL, let data = try? Data(contentsOf: fileURL),
           let stored = try? JSON.decoder.decode([LocationPoint].self, from: data) {
            points = stored
        } else {
            points = []
        }
    }

    static func defaultFileURL() -> URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("pending-locations.json")
    }

    var count: Int { lock.lock(); defer { lock.unlock() }; return points.count }
    var last: LocationPoint? { lock.lock(); defer { lock.unlock() }; return points.last }

    func append(_ point: LocationPoint) {
        lock.lock()
        points.append(point)
        // Never grow without bound if the device is offline for days: drop the oldest.
        if points.count > Self.maxStoredPoints { points.removeFirst(points.count - Self.maxStoredPoints) }
        persistLocked()
        lock.unlock()
    }

    func peek(max: Int) -> [LocationPoint] {
        lock.lock(); defer { lock.unlock() }
        return Array(points.prefix(max))
    }

    /// Removes the first `count` points (after the server accepted them).
    func removeFirst(_ count: Int) {
        lock.lock()
        points.removeFirst(min(count, points.count))
        persistLocked()
        lock.unlock()
    }

    func clear() {
        lock.lock()
        points.removeAll()
        persistLocked()
        lock.unlock()
    }

    private func persistLocked() {
        guard let fileURL else { return }
        if let data = try? JSON.encoder.encode(points) {
            try? data.write(to: fileURL, options: .atomic)
        }
    }
}
