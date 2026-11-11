import Foundation
import SwiftUI

/// App-wide authentication and clock state.
@MainActor
final class Session: ObservableObject {
    enum Phase: Equatable { case launching, signedOut, signedIn }

    @Published private(set) var phase: Phase = .launching
    @Published private(set) var user: User? {
        didSet { Self.cache(user) }
    }
    @Published private(set) var clock: TimeStatus? = nil
    @Published var banner: String? = nil

    let api: APIClient
    let config: AppConfig

    init(api: APIClient = .shared) {
        self.api = api
        self.config = api.config
        api.onSessionExpired = { [weak self] in
            Task { @MainActor in await self?.handleExpired() }
        }
        _ = NotificationCenter.default.addObserver(forName: .clockStatusChanged, object: nil, queue: .main) { [weak self] _ in
            Task { @MainActor in await self?.refreshClock() }
        }
    }

    var permissions: PermissionSet { user?.permissionSet ?? PermissionSet([]) }
    func can(_ permission: Permission) -> Bool { permissions.has(permission) }
    func canAny(_ permissions: Permission...) -> Bool { self.permissions.hasAny(permissions) }
    var role: Role { user?.role ?? .customer }
    var isInternal: Bool { user?.isInternal ?? false }
    var isClockedIn: Bool { clock?.clockedIn ?? false }
    var activeJobId: Int? { clock?.entry?.jobId }

    // MARK: Lifecycle

    func bootstrap() async {
        guard api.isAuthenticated else { phase = .signedOut; return }
        do {
            user = try await api.get("/me")
            phase = .signedIn
            await afterSignIn()
        } catch APIError.sessionExpired {
            phase = .signedOut
        } catch {
            // Offline launch: keep the cached profile so field crews can still clock in later.
            if let cached = Self.cachedUser() {
                user = cached
                phase = .signedIn
                banner = "Offline — showing saved data."
                await refreshClock()
            } else {
                phase = .signedOut
                banner = error.localizedDescription
            }
        }
    }

    func login(email: String, password: String) async throws {
        let response = try await api.authenticate("/auth/login", body: ["email": .string(email), "password": .string(password)])
        await signedIn(response.user)
    }

    func signUp(email: String, password: String, firstName: String, lastName: String, phone: String?) async throws {
        let response = try await api.authenticate("/auth/signup", body: [
            "email": .string(email), "password": .string(password), "firstName": .string(firstName),
            "lastName": .string(lastName), "phone": .optional(phone),
        ])
        await signedIn(response.user)
    }

    func signInWithGoogle(idToken: String) async throws {
        let response = try await api.authenticate("/auth/google", body: ["idToken": .string(idToken)])
        await signedIn(response.user)
    }

    func forgotPassword(email: String) async throws {
        let _: Ignored = try await api.request(.post, "/auth/forgot-password", body: JSONValue.object(["email": .string(email)]), authenticated: false)
    }

    func resetPassword(token: String, newPassword: String) async throws {
        let _: Ignored = try await api.request(.post, "/auth/reset-password",
                                               body: JSONValue.object(["token": .string(token), "newPassword": .string(newPassword)]),
                                               authenticated: false)
    }

    func reloadUser() async {
        if let fresh: User = try? await api.get("/me") { user = fresh }
    }

    func update(user: User) { self.user = user }

    func signOut() async {
        await LocationTracker.shared.stop()
        await api.signOut()
        user = nil
        clock = nil
        phase = .signedOut
    }

    private func signedIn(_ user: User) async {
        self.user = user
        phase = .signedIn
        await afterSignIn()
    }

    private func afterSignIn() async {
        await PushNotifications.shared.requestAuthorization()
        await PushNotifications.shared.uploadToken()
        MediaUploader.shared.processQueue()
        await refreshClock()
    }

    private func handleExpired() async {
        await LocationTracker.shared.stop(discardPending: true)
        user = nil
        clock = nil
        phase = .signedOut
        banner = APIError.sessionExpired.localizedDescription
    }

    // MARK: Clock

    /// Syncs clock state with the server and starts/stops tracking to match (contract rule 1).
    func refreshClock() async {
        guard can(.timeClock) else {
            await LocationTracker.shared.stop(discardPending: true)
            return
        }
        guard let status: TimeStatus = try? await api.get("/time/status") else { return }
        clock = status
        if status.clockedIn {
            LocationTracker.shared.start(pingIntervalSeconds: status.pingIntervalSeconds)
        } else {
            await LocationTracker.shared.stop(discardPending: true)
        }
    }

    func clockIn(jobId: Int?) async throws {
        let fix = await LocationTracker.shared.currentLocation()
        let _: TimeEntry = try await api.post("/time/clock-in", body: [
            "latitude": .optional(fix?.coordinate.latitude),
            "longitude": .optional(fix?.coordinate.longitude),
            "jobId": .optional(jobId),
            "trackingConsent": true,
        ])
        await refreshClock()
    }

    func clockOut(notes: String?) async throws {
        let fix = await LocationTracker.shared.currentLocation()
        await LocationTracker.shared.flush(force: true)
        let _: TimeEntry = try await api.post("/time/clock-out", body: [
            "latitude": .optional(fix?.coordinate.latitude),
            "longitude": .optional(fix?.coordinate.longitude),
            "notes": .optional(notes),
        ])
        await LocationTracker.shared.stop(discardPending: true)
        await refreshClock()
    }

    // MARK: Offline cache

    private static let cachedUserKey = "session.cachedUser"

    private static func cache(_ user: User?) {
        if let user, let data = try? JSON.encoder.encode(user) {
            UserDefaults.standard.set(data, forKey: cachedUserKey)
        } else {
            UserDefaults.standard.removeObject(forKey: cachedUserKey)
        }
    }

    private static func cachedUser() -> User? {
        UserDefaults.standard.data(forKey: cachedUserKey).flatMap { try? JSON.decoder.decode(User.self, from: $0) }
    }

    // MARK: Tracking disclosure (contract rule 2)

    var hasAcceptedTrackingDisclosure: Bool {
        get { UserDefaults.standard.bool(forKey: disclosureKey) }
        set { UserDefaults.standard.set(newValue, forKey: disclosureKey); objectWillChange.send() }
    }

    private var disclosureKey: String { "tracking.disclosure.accepted.\(user?.id ?? 0)" }
}
