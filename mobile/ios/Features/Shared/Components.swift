import SwiftUI
import AVKit

// MARK: - Loading

/// Loads a value asynchronously and renders it, with progress, error + retry and pull-to-refresh.
/// Change `id` to force a reload (e.g. after a save).
struct LoadableView<Value, Content: View>: View {
    var id: AnyHashable = 0
    let load: () async throws -> Value
    @ViewBuilder var content: (Value) -> Content

    @State private var value: Value? = nil
    @State private var error: Error? = nil

    var body: some View {
        Group {
            if let value {
                content(value)
            } else if let error {
                ContentUnavailableView {
                    Label("Couldn't load", systemImage: "exclamationmark.triangle")
                } description: {
                    Text(error.localizedDescription)
                } actions: {
                    Button("Try Again") { Task { await reload() } }.buttonStyle(.borderedProminent)
                }
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .task(id: id) { await reload() }
        .refreshable { await reload() }
        .onReceive(NotificationCenter.default.publisher(for: .mediaUploaded)) { _ in Task { await reload() } }
    }

    private func reload() async {
        do {
            value = try await load()
            error = nil
        } catch is CancellationError {
        } catch {
            if value == nil { self.error = error }
        }
    }
}

/// A list that shows an empty state when there are no rows.
struct ListOrEmpty<Item: Identifiable, Row: View>: View {
    let items: [Item]
    var emptyTitle = "Nothing here yet"
    var emptySymbol = "tray"
    var emptyMessage: String?
    @ViewBuilder var row: (Item) -> Row

    var body: some View {
        if items.isEmpty {
            ScrollView {
                ContentUnavailableView(emptyTitle, systemImage: emptySymbol, description: emptyMessage.map { Text($0) })
                    .padding(.top, 60)
            }
        } else {
            List(items) { row($0) }
        }
    }
}

// MARK: - Buttons & errors

/// Runs an async throwing action, shows a spinner while running and surfaces errors in an alert.
struct AsyncButton<Label: View>: View {
    var role: ButtonRole?
    let action: () async throws -> Void
    @ViewBuilder var label: () -> Label

    @State private var running = false
    @State private var error: String? = nil

    init(role: ButtonRole? = nil, action: @escaping () async throws -> Void, @ViewBuilder label: @escaping () -> Label) {
        self.role = role
        self.action = action
        self.label = label
    }

    var body: some View {
        Button(role: role) {
            guard !running else { return }
            running = true
            Task {
                defer { running = false }
                do { try await action() } catch { self.error = error.localizedDescription }
            }
        } label: {
            HStack(spacing: 8) {
                if running { ProgressView() }
                label()
            }
        }
        .disabled(running)
        .alert("Something went wrong", isPresented: Binding(get: { error != nil }, set: { if !$0 { error = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(error ?? "")
        }
    }
}

extension AsyncButton where Label == Text {
    init(_ title: String, role: ButtonRole? = nil, action: @escaping () async throws -> Void) {
        self.init(role: role, action: action) { Text(title) }
    }
}

/// Wraps a form in a navigation stack with Cancel / Save, running an async save.
struct FormSheet<Content: View>: View {
    let title: String
    var saveTitle = "Save"
    var canSave = true
    let onSave: () async throws -> Void
    @ViewBuilder var content: () -> Content

    @Environment(\.dismiss) private var dismiss
    @State private var saving = false
    @State private var error: String? = nil

    var body: some View {
        NavigationStack {
            Form {
                if let error {
                    Section { Label(error, systemImage: "exclamationmark.triangle").foregroundStyle(.red) }
                }
                content()
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    if saving {
                        ProgressView()
                    } else {
                        Button(saveTitle) {
                            saving = true
                            Task {
                                defer { saving = false }
                                do { try await onSave(); dismiss() } catch { self.error = error.localizedDescription }
                            }
                        }
                        .disabled(!canSave)
                    }
                }
            }
            .interactiveDismissDisabled(saving)
        }
    }
}

// MARK: - Display helpers

struct StatusBadge: View {
    let text: String
    var color: Color = .gray

    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(color.opacity(0.18), in: Capsule())
            .foregroundStyle(color)
    }
}

struct AvatarView: View {
    let url: URL?
    let name: String
    var size: CGFloat = 40

    var body: some View {
        AsyncImage(url: url) { image in
            image.resizable().scaledToFill()
        } placeholder: {
            ZStack {
                Circle().fill(Theme.current.primary.opacity(0.25))
                Text(initials).font(.system(size: size * 0.4, weight: .semibold)).foregroundStyle(Theme.current.primary)
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
    }

    private var initials: String {
        name.split(separator: " ").prefix(2).compactMap { $0.first }.map(String.init).joined().uppercased()
    }
}

struct InfoRow: View {
    let label: String
    let value: String?
    var symbol: String?

    var body: some View {
        if let value = value?.nilIfBlank {
            LabeledContent {
                Text(value).multilineTextAlignment(.trailing)
            } label: {
                if let symbol { Label(label, systemImage: symbol) } else { Text(label) }
            }
        }
    }
}

struct StarRating: View {
    @Binding var rating: Int
    var editable = true

    var body: some View {
        HStack(spacing: 4) {
            ForEach(1...5, id: \.self) { star in
                Image(systemName: star <= rating ? "star.fill" : "star")
                    .foregroundStyle(.yellow)
                    .onTapGesture { if editable { rating = star } }
            }
        }
        .accessibilityElement()
        .accessibilityLabel("\(rating) of 5 stars")
    }
}

/// Call / text / email buttons for a person.
struct ContactButtons: View {
    let phone: String?
    let email: String?
    @Environment(\.openURL) private var openURL

    var body: some View {
        HStack(spacing: 12) {
            if let url = ContactLinks.phone(phone) {
                Button { openURL(url) } label: { Label("Call", systemImage: "phone.fill") }
            }
            if let url = ContactLinks.sms(phone) {
                Button { openURL(url) } label: { Label("Text", systemImage: "message.fill") }
            }
            if let url = ContactLinks.email(email) {
                Button { openURL(url) } label: { Label("Email", systemImage: "envelope.fill") }
            }
        }
        .buttonStyle(.bordered)
        .labelStyle(.titleAndIcon)
    }
}

// MARK: - Media

struct MediaGrid: View {
    let media: [Media]
    var onSelect: ((Media) -> Void)?
    @State private var selected: Media? = nil

    private let columns = [GridItem(.adaptive(minimum: 100), spacing: 4)]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 4) {
            ForEach(media) { item in
                Button { if let onSelect { onSelect(item) } else { selected = item } } label: {
                    MediaThumbnail(media: item)
                }
                .buttonStyle(.plain)
            }
        }
        .fullScreenCover(item: $selected) { MediaViewer(media: $0) }
    }
}

struct MediaThumbnail: View {
    let media: Media

    var body: some View {
        Color.secondary.opacity(0.15)
            .aspectRatio(1, contentMode: .fit)
            .overlay {
                AsyncImage(url: media.previewURL) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Image(systemName: media.kind == .video ? "video" : "photo").foregroundStyle(.secondary)
                }
            }
            .overlay(alignment: .bottomTrailing) {
                if media.kind == .video {
                    Image(systemName: "play.circle.fill").font(.title2).foregroundStyle(.white).padding(4)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 6))
    }
}

struct MediaViewer: View {
    let media: Media
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                if media.kind == .video {
                    VideoPlayer(player: AVPlayer(url: media.url))
                } else {
                    AsyncImage(url: media.url) { image in
                        image.resizable().scaledToFit()
                    } placeholder: { ProgressView() }
                }
            }
            .overlay(alignment: .bottom) {
                if let caption = media.caption?.nilIfBlank {
                    Text(caption).padding().frame(maxWidth: .infinity).background(.ultraThinMaterial)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } }
                ToolbarItem(placement: .topBarLeading) { ShareLink(item: media.url) }
            }
        }
    }
}

// MARK: - Formatting

extension Date {
    var shortDate: String { formatted(date: .abbreviated, time: .omitted) }
    var shortDateTime: String { formatted(date: .abbreviated, time: .shortened) }
    var timeOnly: String { formatted(date: .omitted, time: .shortened) }
    var relative: String { formatted(.relative(presentation: .named)) }
}

extension Optional where Wrapped == Date {
    var shortDate: String { self?.shortDate ?? "—" }
    var shortDateTime: String { self?.shortDateTime ?? "—" }
}

extension Optional where Wrapped == DecimalString {
    var currency: String { self?.currency ?? "—" }
}

/// Text field for decimal input bound to a `DecimalString`.
struct DecimalField: View {
    let title: String
    @Binding var value: DecimalString
    @State private var text = ""

    var body: some View {
        TextField(title, text: $text)
            .keyboardType(.decimalPad)
            .onAppear { text = value == .zero ? "" : value.plainString }
            .onChange(of: text) { _, new in value = DecimalString(string: new) ?? .zero }
    }
}
