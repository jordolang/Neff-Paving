import Foundation
import UIKit
import UserNotifications

/// APNs registration. The device token is sent to `POST /auth/device` whenever a user is
/// signed in (and re-sent after each sign-in).
@MainActor
final class PushNotifications: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    static let shared = PushNotifications()

    @Published private(set) var deviceToken: String? = nil
    /// Set when the user taps a notification that references a job.
    @Published var openedJobId: Int? = nil

    private static let tokenKey = "push.deviceToken"

    override init() {
        super.init()
        deviceToken = UserDefaults.standard.string(forKey: Self.tokenKey)
        UNUserNotificationCenter.current().delegate = self
    }

    func requestAuthorization() async {
        let granted = (try? await UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .badge, .sound])) ?? false
        if granted { UIApplication.shared.registerForRemoteNotifications() }
    }

    func didRegister(tokenData: Data) {
        let token = tokenData.map { String(format: "%02x", $0) }.joined()
        deviceToken = token
        UserDefaults.standard.set(token, forKey: Self.tokenKey)
        Task { await uploadToken() }
    }

    func uploadToken(api: APIClient = .shared) async {
        guard let deviceToken, api.isAuthenticated else { return }
        try? await api.call(.post, "/auth/device", body: ["token": .string(deviceToken), "platform": "ios"])
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .list]
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        let info = response.notification.request.content.userInfo
        let jobId = (info["jobId"] as? Int) ?? (info["jobId"] as? String).flatMap(Int.init)
        await MainActor.run { self.openedJobId = jobId }
    }
}
