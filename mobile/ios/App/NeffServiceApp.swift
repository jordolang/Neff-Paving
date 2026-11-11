import SwiftUI
import GoogleSignIn

@main
struct NeffServiceApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var session = Session()
    @StateObject private var tracker = LocationTracker.shared
    @StateObject private var uploader = MediaUploader.shared
    @StateObject private var push = PushNotifications.shared

    var body: some Scene {
        WindowGroup {
            AppRootView()
                .environmentObject(session)
                .environmentObject(tracker)
                .environmentObject(uploader)
                .environmentObject(push)
                .tint(Theme.current.primary)
                .onOpenURL { url in _ = GIDSignIn.sharedInstance.handle(url) }
        }
    }
}

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        if let clientID = AppConfig.current.googleClientID {
            GIDSignIn.sharedInstance.configuration = GIDConfiguration(clientID: clientID)
        }
        // Relaunched in the background by a location event while clocked in: resume tracking
        // immediately; Session.bootstrap will confirm with the server.
        if launchOptions?[.location] != nil || LocationTracker.shared.wasTrackingBeforeLaunch {
            Task { @MainActor in LocationTracker.shared.start(pingIntervalSeconds: nil) }
        }
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Task { @MainActor in PushNotifications.shared.didRegister(tokenData: deviceToken) }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("APNs registration failed: \(error.localizedDescription)")
    }
}

struct AppRootView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        Group {
            switch session.phase {
            case .launching:
                SplashView()
            case .signedOut:
                AuthView()
            case .signedIn:
                MainTabView()
            }
        }
        .task { await session.bootstrap() }
        .animation(.default, value: session.phase)
    }
}

struct SplashView: View {
    var body: some View {
        ZStack {
            Theme.current.background.ignoresSafeArea()
            VStack(spacing: 16) {
                Image(systemName: Theme.current.logoSymbol)
                    .font(.system(size: 64))
                    .foregroundStyle(Theme.current.primary)
                Text(AppConfig.current.displayName).font(.title.bold()).foregroundStyle(.white)
                ProgressView().tint(Theme.current.primary)
            }
        }
    }
}
