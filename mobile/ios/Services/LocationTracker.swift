import Foundation
import CoreLocation
import Network
import UIKit

/// Background location tracking for clocked-in internal users (contract "Location tracking rules").
///
/// - Starts only after a successful clock-in, stops on clock-out, sign-out or a `409 not_clocked_in`.
/// - Points are queued on disk and flushed in batches every `pingInterval` seconds or 50 m.
@MainActor
final class LocationTracker: NSObject, ObservableObject {
    static let shared = LocationTracker()

    @Published private(set) var isTracking = false
    @Published private(set) var authorization: CLAuthorizationStatus = .notDetermined
    @Published private(set) var lastFix: CLLocation? = nil
    @Published private(set) var pendingCount = 0

    private let manager = CLLocationManager()
    private let queue = LocationQueue(fileURL: LocationQueue.defaultFileURL())
    private let api: APIClient
    private var policy = FlushPolicy()
    private var lastFlushAt: Date?
    private var lastFlushedPoint: LocationPoint?
    private var isFlushing = false
    private var flushTimer: Timer?
    private let pathMonitor = NWPathMonitor()
    private var oneShotContinuations: [CheckedContinuation<CLLocation?, Never>] = []

    private static let trackingFlagKey = "location.tracking.active"

    init(api: APIClient = .shared) {
        self.api = api
        super.init()
        authorization = manager.authorizationStatus
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 10
        manager.activityType = .otherNavigation
        manager.pausesLocationUpdatesAutomatically = false
        pendingCount = queue.count
        pathMonitor.pathUpdateHandler = { [weak self] path in
            guard path.status == .satisfied else { return }
            Task { @MainActor in await self?.flush(force: true) }
        }
        pathMonitor.start(queue: DispatchQueue(label: "location.path"))
    }

    /// Whether tracking was on when the app was last terminated (resume after relaunch).
    var wasTrackingBeforeLaunch: Bool { UserDefaults.standard.bool(forKey: Self.trackingFlagKey) }

    // MARK: Permission

    func requestPermission() {
        switch manager.authorizationStatus {
        case .notDetermined: manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse: manager.requestAlwaysAuthorization()
        default: break
        }
    }

    var hasUsablePermission: Bool {
        [.authorizedAlways, .authorizedWhenInUse].contains(manager.authorizationStatus)
    }

    /// One-shot fix used for clock-in / clock-out / media uploads.
    func currentLocation(timeout: TimeInterval = 10) async -> CLLocation? {
        if let lastFix, Date().timeIntervalSince(lastFix.timestamp) < 30 { return lastFix }
        guard hasUsablePermission || manager.authorizationStatus == .notDetermined else { return nil }
        if manager.authorizationStatus == .notDetermined { manager.requestWhenInUseAuthorization() }
        return await withCheckedContinuation { continuation in
            oneShotContinuations.append(continuation)
            manager.requestLocation()
            Task { @MainActor in
                try? await Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
                self.resolveOneShots(with: self.lastFix)
            }
        }
    }

    // MARK: Tracking lifecycle

    func start(pingIntervalSeconds: Int?) {
        policy.interval = TimeInterval(pingIntervalSeconds ?? 60)
        guard !isTracking else { return }
        isTracking = true
        UserDefaults.standard.set(true, forKey: Self.trackingFlagKey)
        UIDevice.current.isBatteryMonitoringEnabled = true
        requestPermission()
        manager.allowsBackgroundLocationUpdates = true
        manager.showsBackgroundLocationIndicator = true
        manager.startUpdatingLocation()
        manager.startMonitoringSignificantLocationChanges()
        flushTimer?.invalidate()
        flushTimer = Timer.scheduledTimer(withTimeInterval: policy.interval, repeats: true) { [weak self] _ in
            Task { @MainActor in await self?.flush(force: true) }
        }
    }

    /// Stops tracking. Pending points are flushed first unless the server said we're off the clock.
    func stop(discardPending: Bool = false) async {
        guard isTracking || queue.count > 0 else { return }
        isTracking = false
        UserDefaults.standard.set(false, forKey: Self.trackingFlagKey)
        flushTimer?.invalidate()
        flushTimer = nil
        manager.stopUpdatingLocation()
        manager.stopMonitoringSignificantLocationChanges()
        manager.allowsBackgroundLocationUpdates = false
        if discardPending { queue.clear() } else { await flush(force: true) }
        pendingCount = queue.count
    }

    // MARK: Upload

    func flush(force: Bool = false) async {
        guard !isFlushing else { return }
        let shouldSend = force
            ? queue.count > 0
            : policy.shouldFlush(now: Date(), lastFlushAt: lastFlushAt, lastFlushedPoint: lastFlushedPoint,
                                 latest: queue.last, pending: queue.count)
        guard shouldSend else { return }
        isFlushing = true
        defer { isFlushing = false; pendingCount = queue.count }

        while queue.count > 0 {
            let batch = queue.peek(max: 200)
            do {
                try await api.call(.post, "/time/locations", body: ["points": .array(batch.map(\.json))])
                queue.removeFirst(batch.count)
                lastFlushAt = Date()
                lastFlushedPoint = batch.last
            } catch let error as APIError where error.isNotClockedIn {
                // Contract rule 1/5: the server is authoritative — stop and drop everything.
                await stop(discardPending: true)
                NotificationCenter.default.post(name: .clockStatusChanged, object: nil)
                return
            } catch let error as APIError where error.isTransient {
                return // keep queued; retried on next timer tick or reconnect
            } catch APIError.sessionExpired {
                await stop(discardPending: true)
                return
            } catch {
                queue.removeFirst(batch.count) // malformed batch — don't retry forever
            }
        }
    }

    private func record(_ location: CLLocation) {
        lastFix = location
        resolveOneShots(with: location)
        guard isTracking, location.horizontalAccuracy >= 0, location.horizontalAccuracy < 200 else { return }
        let battery = UIDevice.current.batteryLevel
        queue.append(LocationPoint(
            latitude: location.coordinate.latitude,
            longitude: location.coordinate.longitude,
            accuracy: location.horizontalAccuracy,
            speed: location.speed >= 0 ? location.speed : nil,
            heading: location.course >= 0 ? location.course : nil,
            batteryLevel: battery >= 0 ? Double(battery) : nil,
            recordedAt: location.timestamp))
        pendingCount = queue.count
        Task { await flush() }
    }

    private func resolveOneShots(with location: CLLocation?) {
        let pending = oneShotContinuations
        oneShotContinuations.removeAll()
        pending.forEach { $0.resume(returning: location) }
    }
}

extension LocationTracker: CLLocationManagerDelegate {
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        Task { @MainActor in locations.forEach(self.record) }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in self.resolveOneShots(with: self.lastFix) }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            self.authorization = status
            // Escalate to "Always" once "When In Use" is granted while on the clock.
            if status == .authorizedWhenInUse, self.isTracking { manager.requestAlwaysAuthorization() }
        }
    }
}

extension Notification.Name {
    static let clockStatusChanged = Notification.Name("clockStatusChanged")
}
