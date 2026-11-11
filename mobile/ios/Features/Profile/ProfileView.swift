import SwiftUI
import PhotosUI

/// Profile screen — the landing tab for every user. Name, address, contact, avatar,
/// notification preferences and the public-profile switch.
struct ProfileView: View {
    @EnvironmentObject private var session: Session
    @State private var draft = ProfileDraft()
    @State private var avatarItem: PhotosPickerItem? = nil
    @State private var uploadingAvatar = false
    @State private var showPassword = false
    @State private var savedMessage: String? = nil
    @State private var error: String? = nil

    var body: some View {
        Form {
            if let user = session.user {
                Section {
                    HStack(spacing: 16) {
                        ZStack(alignment: .bottomTrailing) {
                            AvatarView(url: user.avatarUrl, name: user.fullName, size: 80)
                            PhotosPicker(selection: $avatarItem, matching: .images) {
                                Image(systemName: uploadingAvatar ? "hourglass.circle.fill" : "camera.circle.fill")
                                    .font(.title2).symbolRenderingMode(.multicolor)
                            }
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text(user.fullName).font(.title3.bold())
                            Text(user.email).foregroundStyle(.secondary)
                            StatusBadge(text: user.role.displayName, color: Theme.current.primary)
                        }
                    }
                    .padding(.vertical, 4)
                }

                Section("Name") {
                    TextField("First name", text: $draft.firstName).textContentType(.givenName)
                    TextField("Last name", text: $draft.lastName).textContentType(.familyName)
                }

                Section("Contact") {
                    TextField("Phone", text: $draft.phone).keyboardType(.phonePad).textContentType(.telephoneNumber)
                    LabeledContent("Email", value: user.email)
                }

                Section("Address") {
                    TextField("Street", text: $draft.line1).textContentType(.streetAddressLine1)
                    TextField("Apt / Suite", text: $draft.line2).textContentType(.streetAddressLine2)
                    TextField("City", text: $draft.city).textContentType(.addressCity)
                    HStack {
                        TextField("State", text: $draft.state).textContentType(.addressState).frame(maxWidth: 80)
                        TextField("ZIP", text: $draft.zip).keyboardType(.numberPad).textContentType(.postalCode)
                    }
                }

                Section("Communications") {
                    Toggle("Push notifications", isOn: $draft.prefs.push)
                    Toggle("Email updates", isOn: $draft.prefs.email)
                    Toggle("Text messages", isOn: $draft.prefs.sms)
                }

                if !user.isInternal {
                    Section {
                        Toggle("Public profile", isOn: $draft.publicProfile)
                    } footer: {
                        Text("Lets other customers see the project photos you choose to share, with your first name and city.")
                    }
                }

                if let error { Section { Text(error).foregroundStyle(.red) } }

                Section {
                    AsyncButton("Save Changes") { try await save() }
                        .disabled(!draft.isDirty(comparedTo: user))
                    if let savedMessage { Text(savedMessage).foregroundStyle(.green).font(.footnote) }
                }

                Section("Account") {
                    if user.isInternal {
                        NavigationLink { MyActivityShortcutsView() } label: { Label("My Work Shortcuts", systemImage: "briefcase") }
                    }
                    Button { showPassword = true } label: { Label("Change Password", systemImage: "key") }
                    NavigationLink { NotificationsView() } label: { Label("Notifications", systemImage: "bell") }
                    AsyncButton(role: .destructive) { await session.signOut() } label: {
                        Label("Sign Out", systemImage: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
        }
        .navigationTitle("Profile")
        .onAppear { if let user = session.user { draft = ProfileDraft(user) } }
        .onChange(of: session.user) { _, user in if let user, !draft.isDirty(comparedTo: user) { draft = ProfileDraft(user) } }
        .onChange(of: avatarItem) { _, item in if let item { Task { await uploadAvatar(item) } } }
        .sheet(isPresented: $showPassword) { ChangePasswordView() }
        .refreshable { await session.reloadUser() }
    }

    private func save() async throws {
        error = nil
        let updated: User = try await session.api.put("/me", body: draft.json)
        session.update(user: updated)
        savedMessage = "Saved"
    }

    private func uploadAvatar(_ item: PhotosPickerItem) async {
        uploadingAvatar = true
        defer { uploadingAvatar = false; avatarItem = nil }
        do {
            guard let data = try await item.loadTransferable(type: Data.self), let image = UIImage(data: data),
                  let jpeg = image.resizedForAvatar().jpegData(compressionQuality: 0.85) else { return }
            let user: User = try await session.api.upload("/me/avatar", data: jpeg, fileName: "avatar.jpg", mimeType: "image/jpeg")
            session.update(user: user)
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct ProfileDraft: Equatable {
    var firstName = "", lastName = "", phone = ""
    var line1 = "", line2 = "", city = "", state = "OH", zip = ""
    var prefs = NotificationPrefs()
    var publicProfile = false

    init() {}

    init(_ user: User) {
        firstName = user.firstName
        lastName = user.lastName
        phone = user.phone ?? ""
        line1 = user.address?.line1 ?? ""
        line2 = user.address?.line2 ?? ""
        city = user.address?.city ?? ""
        state = user.address?.state ?? "OH"
        zip = user.address?.zip ?? ""
        prefs = user.notificationPrefs ?? NotificationPrefs()
        publicProfile = user.publicProfile ?? false
    }

    func isDirty(comparedTo user: User) -> Bool { self != ProfileDraft(user) }

    var json: JSONValue {
        ["firstName": .string(firstName), "lastName": .string(lastName), "phone": .optional(phone),
         "address": Address(line1: line1, line2: line2, city: city, state: state, zip: zip).json,
         "notificationPrefs": ["push": .bool(prefs.push), "email": .bool(prefs.email), "sms": .bool(prefs.sms)],
         "publicProfile": .bool(publicProfile)]
    }
}

struct ChangePasswordView: View {
    @EnvironmentObject private var session: Session
    @State private var current = ""
    @State private var new = ""
    @State private var confirm = ""

    var body: some View {
        FormSheet(title: "Change Password", canSave: !current.isEmpty && new.count >= 8 && new == confirm) {
            try await session.api.call(.put, "/me/password", body: ["currentPassword": .string(current), "newPassword": .string(new)])
        } content: {
            Section {
                SecureField("Current password", text: $current).textContentType(.password)
                SecureField("New password (8+ characters)", text: $new).textContentType(.newPassword)
                SecureField("Confirm new password", text: $confirm).textContentType(.newPassword)
            } footer: {
                Text("Signed in with Google? Leave the current password blank only if you've never set one.")
            }
        }
    }
}

/// Quick links for internal users ("Update Info" lives on the profile itself).
struct MyActivityShortcutsView: View {
    @EnvironmentObject private var session: Session
    var body: some View {
        List {
            if session.can(.timeClock) { NavigationLink("Clock In / Out") { ClockView() } }
            if session.can(.scheduleView) { NavigationLink("My Schedule") { MyScheduleView() } }
            if session.can(.paystubsViewOwn) { NavigationLink("Pay Stubs") { PayStubsView() } }
            if session.can(.timeoffRequest) { NavigationLink("Time Off") { TimeOffView() } }
            if session.can(.messagesSend) { NavigationLink("Message the Owners") { NewThreadView(defaultSubject: "", toRole: "admin") } }
        }
        .navigationTitle("Shortcuts")
    }
}

struct NotificationsView: View {
    @EnvironmentObject private var session: Session
    @EnvironmentObject private var push: PushNotifications
    @State private var reload = UUID()

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/notifications") as [AppNotification] }) { items in
            ListOrEmpty(items: items, emptyTitle: "No notifications", emptySymbol: "bell.slash") { item in
                Button {
                    Task {
                        try? await session.api.call(.post, "/notifications/\(item.id)/read")
                        if let jobId = item.jobId { push.openedJobId = jobId }
                        reload = UUID()
                    }
                } label: {
                    HStack(alignment: .top) {
                        Circle().fill(item.isRead ? .clear : Theme.current.primary).frame(width: 8, height: 8).padding(.top, 6)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.title).font(.headline)
                            if let body = item.body { Text(body).font(.subheadline).foregroundStyle(.secondary) }
                            if let date = item.createdAt { Text(date.relative).font(.caption).foregroundStyle(.secondary) }
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .navigationTitle("Notifications")
        .toolbar {
            AsyncButton("Mark All Read") {
                try await session.api.call(.post, "/notifications/read-all")
                reload = UUID()
            }
        }
    }
}

extension UIImage {
    func resizedForAvatar(maxDimension: CGFloat = 800) -> UIImage {
        let scale = min(1, maxDimension / max(size.width, size.height))
        guard scale < 1 else { return self }
        let target = CGSize(width: size.width * scale, height: size.height * scale)
        return UIGraphicsImageRenderer(size: target).image { _ in draw(in: CGRect(origin: .zero, size: target)) }
    }
}
