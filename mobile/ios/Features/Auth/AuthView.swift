import SwiftUI
import GoogleSignIn

/// First screen on install: Log In, Sign Up, or Continue with Google.
struct AuthView: View {
    enum Mode: String, CaseIterable, Identifiable { case login = "Log In", signup = "Sign Up"; var id: String { rawValue } }

    @EnvironmentObject private var session: Session
    @State private var mode: Mode = .login
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var phone = ""
    @State private var error: String? = nil
    @State private var busy = false
    @State private var showForgot = false

    private let theme = Theme.current

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    header
                    Picker("Mode", selection: $mode) {
                        ForEach(Mode.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    VStack(spacing: 12) {
                        if mode == .signup {
                            HStack {
                                field("First name", text: $firstName).textContentType(.givenName)
                                field("Last name", text: $lastName).textContentType(.familyName)
                            }
                            field("Phone (optional)", text: $phone).textContentType(.telephoneNumber).keyboardType(.phonePad)
                        }
                        field("Email", text: $email)
                            .textContentType(.emailAddress).keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never).autocorrectionDisabled()
                        SecureField("Password", text: $password)
                            .textContentType(mode == .login ? .password : .newPassword)
                            .padding().background(theme.surface, in: RoundedRectangle(cornerRadius: 10))
                        if mode == .signup {
                            SecureField("Confirm password", text: $confirmPassword)
                                .textContentType(.newPassword)
                                .padding().background(theme.surface, in: RoundedRectangle(cornerRadius: 10))
                        }
                    }

                    if let error {
                        Text(error).font(.footnote).foregroundStyle(.red).multilineTextAlignment(.center)
                    }

                    Button(action: submit) {
                        HStack {
                            if busy { ProgressView().tint(theme.onPrimary) }
                            Text(mode == .login ? "Log In" : "Create Account").bold()
                        }
                        .frame(maxWidth: .infinity).padding()
                        .background(theme.primary, in: RoundedRectangle(cornerRadius: 12))
                        .foregroundStyle(theme.onPrimary)
                    }
                    .disabled(busy || !isValid)
                    .opacity(isValid ? 1 : 0.6)

                    HStack {
                        line
                        Text("or").foregroundStyle(.secondary)
                        line
                    }

                    Button(action: googleSignIn) {
                        Label("Continue with Google", systemImage: "g.circle.fill")
                            .frame(maxWidth: .infinity).padding()
                            .background(.white, in: RoundedRectangle(cornerRadius: 12))
                            .foregroundStyle(.black)
                    }
                    .disabled(busy || AppConfig.current.googleClientID == nil)

                    if mode == .login {
                        Button("Forgot password?") { showForgot = true }.font(.footnote)
                    }
                }
                .padding(24)
            }
            .background(theme.background.ignoresSafeArea())
            .foregroundStyle(.white)
            .sheet(isPresented: $showForgot) { ForgotPasswordView(initialEmail: email) }
            .onAppear { if let banner = session.banner { error = banner; session.banner = nil } }
        }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        VStack(spacing: 8) {
            Image(systemName: theme.logoSymbol).font(.system(size: 56)).foregroundStyle(theme.primary)
            Text(AppConfig.current.displayName).font(.largeTitle.bold())
            Text(theme.tagline).foregroundStyle(.secondary)
        }
        .padding(.top, 32)
    }

    private var line: some View { Rectangle().fill(.secondary.opacity(0.4)).frame(height: 1) }

    private func field(_ title: String, text: Binding<String>) -> some View {
        TextField(title, text: text)
            .padding()
            .background(theme.surface, in: RoundedRectangle(cornerRadius: 10))
    }

    private var isValid: Bool {
        let emailOK = email.contains("@") && email.contains(".")
        switch mode {
        case .login: return emailOK && !password.isEmpty
        case .signup:
            return emailOK && password.count >= 8 && password == confirmPassword
                && !firstName.trimmingCharacters(in: .whitespaces).isEmpty
                && !lastName.trimmingCharacters(in: .whitespaces).isEmpty
        }
    }

    private func submit() {
        error = nil
        busy = true
        Task {
            defer { busy = false }
            do {
                let cleanEmail = email.trimmingCharacters(in: .whitespaces).lowercased()
                switch mode {
                case .login:
                    try await session.login(email: cleanEmail, password: password)
                case .signup:
                    try await session.signUp(email: cleanEmail, password: password,
                                             firstName: firstName.trimmingCharacters(in: .whitespaces),
                                             lastName: lastName.trimmingCharacters(in: .whitespaces),
                                             phone: phone.nilIfBlank)
                }
            } catch {
                self.error = error.localizedDescription
            }
        }
    }

    private func googleSignIn() {
        error = nil
        guard let presenter = UIApplication.shared.topViewController else { return }
        busy = true
        Task {
            defer { busy = false }
            do {
                let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: presenter)
                guard let idToken = result.user.idToken?.tokenString else {
                    throw APIError.decoding("Google did not return an ID token.")
                }
                try await session.signInWithGoogle(idToken: idToken)
            } catch let gidError as GIDSignInError where gidError.code == .canceled {
                return
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}

struct ForgotPasswordView: View {
    let initialEmail: String
    @EnvironmentObject private var session: Session
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var token = ""
    @State private var newPassword = ""
    @State private var stage: Stage = .request
    @State private var message: String? = nil

    enum Stage { case request, reset, done }

    var body: some View {
        NavigationStack {
            Form {
                switch stage {
                case .request:
                    Section {
                        TextField("Email", text: $email)
                            .keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled()
                        AsyncButton("Send Reset Link") {
                            try await session.forgotPassword(email: email.trimmingCharacters(in: .whitespaces).lowercased())
                            message = "If an account exists for this email, we've sent a reset code."
                            stage = .reset
                        }
                        .disabled(!email.contains("@"))
                    } footer: {
                        Text("We'll email you a link with a reset code.")
                    }
                    Section { Button("I already have a reset code") { stage = .reset } }
                case .reset:
                    if let message { Section { Text(message).foregroundStyle(.secondary) } }
                    Section("Reset Code") {
                        TextField("Code from the email", text: $token)
                            .textInputAutocapitalization(.never).autocorrectionDisabled()
                        SecureField("New password (8+ characters)", text: $newPassword).textContentType(.newPassword)
                        AsyncButton("Set New Password") {
                            try await session.resetPassword(token: token.trimmingCharacters(in: .whitespacesAndNewlines),
                                                            newPassword: newPassword)
                            stage = .done
                        }
                        .disabled(token.nilIfBlank == nil || newPassword.count < 8)
                    }
                case .done:
                    Section {
                        Label("Password updated. You can log in now.", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
                        Button("Back to Log In") { dismiss() }
                    }
                }
            }
            .navigationTitle("Reset Password")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } } }
        }
        .onAppear { email = initialEmail }
    }
}

extension UIApplication {
    /// The front-most view controller, used to present Google Sign-In and Safari.
    var topViewController: UIViewController? {
        let scene = connectedScenes.compactMap { $0 as? UIWindowScene }.first { $0.activationState == .foregroundActive }
            ?? connectedScenes.compactMap { $0 as? UIWindowScene }.first
        var top = scene?.windows.first { $0.isKeyWindow }?.rootViewController
        while let presented = top?.presentedViewController { top = presented }
        return top
    }
}
