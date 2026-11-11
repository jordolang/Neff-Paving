import SwiftUI

/// Message threads (customer ↔ office, employee ↔ owners).
struct ThreadsView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var composing = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/threads") as [MessageThread] }) { threads in
            ListOrEmpty(items: threads, emptyTitle: "No messages", emptySymbol: "bubble.left.and.bubble.right") { thread in
                NavigationLink { ThreadView(thread: thread) } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(thread.subject).font(.headline).lineLimit(1)
                            Spacer()
                            if let count = thread.unreadCount, count > 0 {
                                Text("\(count)").font(.caption.bold()).padding(6)
                                    .background(Theme.current.primary, in: Circle()).foregroundStyle(Theme.current.onPrimary)
                            }
                        }
                        if let last = thread.lastMessage {
                            Text("\(last.sender?.name ?? "System"): \(last.body)").font(.subheadline).foregroundStyle(.secondary).lineLimit(2)
                        }
                        if let updated = thread.updatedAt { Text(updated.relative).font(.caption2).foregroundStyle(.secondary) }
                    }
                }
            }
        }
        .navigationTitle("Messages")
        .toolbar { Button { composing = true } label: { Image(systemName: "square.and.pencil") } }
        .sheet(isPresented: $composing, onDismiss: { reload = UUID() }) {
            NavigationStack { NewThreadView(defaultSubject: "") }
        }
    }
}

struct ThreadView: View {
    let thread: MessageThread
    @EnvironmentObject private var session: Session
    @State private var messages: [Message] = []
    @State private var draft = ""
    @State private var error: String? = nil

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(messages) { message in
                            MessageBubble(message: message, isMine: message.sender?.id == session.user?.id).id(message.id)
                        }
                    }
                    .padding()
                }
                .onChange(of: messages.count) { _, _ in
                    if let last = messages.last { withAnimation { proxy.scrollTo(last.id, anchor: .bottom) } }
                }
            }
            if let error { Text(error).font(.footnote).foregroundStyle(.red) }
            HStack {
                TextField("Message", text: $draft, axis: .vertical).lineLimit(1...5).textFieldStyle(.roundedBorder)
                AsyncButton(action: send) { Image(systemName: "paperplane.fill") }
                    .disabled(draft.nilIfBlank == nil)
            }
            .padding()
            .background(.bar)
        }
        .navigationTitle(thread.subject)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
        .task {
            // Light polling while the conversation is open.
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 20_000_000_000)
                await load()
            }
        }
    }

    private func load() async {
        do {
            messages = try await session.api.get("/threads/\(thread.id)/messages")
            messages.sort { ($0.createdAt ?? .distantPast) < ($1.createdAt ?? .distantPast) }
            error = nil
        } catch { self.error = error.localizedDescription }
    }

    private func send() async throws {
        let body = draft
        let message: Message = try await session.api.post("/threads/\(thread.id)/messages", body: ["body": .string(body)])
        draft = ""
        messages.append(message)
    }
}

struct MessageBubble: View {
    let message: Message
    let isMine: Bool

    var body: some View {
        HStack {
            if isMine { Spacer(minLength: 40) }
            VStack(alignment: isMine ? .trailing : .leading, spacing: 2) {
                if !isMine, let sender = message.sender { Text(sender.name).font(.caption2).foregroundStyle(.secondary) }
                Text(message.body)
                    .padding(10)
                    .background(isMine ? Theme.current.primary : Color.secondary.opacity(0.2), in: RoundedRectangle(cornerRadius: 14))
                    .foregroundStyle(isMine ? Theme.current.onPrimary : .primary)
                if let date = message.createdAt { Text(date.timeOnly).font(.caption2).foregroundStyle(.secondary) }
            }
            if !isMine { Spacer(minLength: 40) }
        }
    }
}

/// New conversation. Customers reach the office; employees can address the owners (`toRole: admin`).
struct NewThreadView: View {
    var defaultSubject: String
    var jobId: Int?
    var toRole: String?

    @EnvironmentObject private var session: Session
    @Environment(\.dismiss) private var dismiss
    @State private var subject = ""
    @State private var bodyText = ""
    @State private var recipient = "office_staff"
    @State private var created: MessageThread? = nil
    @State private var error: String? = nil

    init(defaultSubject: String, jobId: Int? = nil, toRole: String? = nil) {
        self.defaultSubject = defaultSubject
        self.jobId = jobId
        self.toRole = toRole
    }

    var body: some View {
        Form {
            if session.isInternal && toRole == nil {
                Picker("To", selection: $recipient) {
                    Text("Office").tag("office_staff")
                    Text("Owners").tag("admin")
                }
                .pickerStyle(.segmented)
            }
            TextField("Subject", text: $subject)
            TextField("Message", text: $bodyText, axis: .vertical).lineLimit(5...12)
            if let error { Text(error).foregroundStyle(.red) }
            AsyncButton("Send") {
                created = try await session.api.post("/threads", body: [
                    "subject": .string(subject), "body": .string(bodyText), "jobId": .optional(jobId),
                    "toRole": .string(toRole ?? recipient),
                ])
            }
            .disabled(subject.nilIfBlank == nil || bodyText.nilIfBlank == nil)
        }
        .navigationTitle("New Message")
        .onAppear { if subject.isEmpty { subject = defaultSubject }; if let toRole { recipient = toRole } }
        .navigationDestination(item: $created) { ThreadView(thread: $0) }
    }
}
