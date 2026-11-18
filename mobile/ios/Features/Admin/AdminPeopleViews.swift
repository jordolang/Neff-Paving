import SwiftUI

// MARK: - Users + role elevation

struct UsersAdminView: View {
    @EnvironmentObject private var session: Session
    @State private var query = ""
    @State private var roleFilter: Role? = nil
    @State private var reload = UUID()
    @State private var editing: AdminUser? = nil

    var body: some View {
        LoadableView(id: "\(query)|\(roleFilter?.rawValue ?? "")|\(reload)", load: { () async throws -> [AdminUser] in
            try await Task.sleep(nanoseconds: query.isEmpty ? 0 : 300_000_000)
            return try await session.api.get("/admin/users", query: ["q": query.nilIfBlank, "role": roleFilter?.rawValue]) as [AdminUser]
        }) { users in
            ListOrEmpty(items: users, emptyTitle: "No users", emptySymbol: "person.crop.circle.badge.questionmark") { user in
                Button { editing = user } label: {
                    HStack {
                        AvatarView(url: user.avatarUrl, name: user.displayName, size: 36)
                        VStack(alignment: .leading) {
                            Text(user.displayName).font(.headline)
                            Text(user.email).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            StatusBadge(text: user.role.displayName, color: user.role.isInternal ? Theme.current.primary : .gray)
                            if user.isActive == false || user.closed == true { StatusBadge(text: "Inactive", color: .red) }
                        }
                    }
                }
                .foregroundStyle(.primary)
            }
        }
        .searchable(text: $query, prompt: "Name or email")
        .navigationTitle("Users + Roles")
        .toolbar {
            Menu {
                Button("All roles") { roleFilter = nil }
                ForEach(Role.allCases) { role in Button(role.displayName) { roleFilter = role } }
            } label: { Label(roleFilter?.displayName ?? "All", systemImage: "line.3.horizontal.decrease.circle") }
        }
        .sheet(item: $editing, onDismiss: { reload = UUID() }) { UserRoleEditor(user: $0) }
    }
}

/// Elevate/demote a user. Only a super admin may grant or revoke `admin` or touch a super admin.
struct UserRoleEditor: View {
    let user: AdminUser
    @EnvironmentObject private var session: Session
    @State private var role: Role = .customer
    @State private var active = true
    @State private var payRate: DecimalString = .zero
    @State private var ready = false

    private var canModify: Bool { session.can(.rolesAssign) && Role.canModify(target: user.role, actor: session.role) && user.id != session.user?.id }

    var body: some View {
        FormSheet(title: user.displayName, canSave: canModify || session.can(.usersManage) || session.can(.payrollManage)) {
            if canModify && role != user.role {
                var body: [String: JSONValue] = ["role": .string(role.rawValue)]
                if role.isInternal && session.can(.payrollManage) && payRate > .zero { body["payRate"] = .string(payRate.moneyString) }
                try await session.api.call(.put, "/admin/users/\(user.id)/role", body: .object(body))
            } else if session.can(.payrollManage), role.isInternal, payRate != (user.payRate ?? .zero) {
                try await session.api.call(.put, "/admin/users/\(user.id)/pay-rate", body: ["payRate": .string(payRate.moneyString)])
            }
            if session.can(.usersManage), active != (user.isActive ?? true), canModify || user.role == .customer {
                try await session.api.call(.put, "/admin/users/\(user.id)/active", body: ["active": .bool(active)])
            }
        } content: {
            Section {
                InfoRow(label: "Email", value: user.email)
                InfoRow(label: "Phone", value: user.phone)
                InfoRow(label: "Last sign-in", value: user.lastLoginAt?.shortDateTime)
            }
            Section {
                Picker("Role", selection: $role) {
                    ForEach(options) { Text($0.displayName).tag($0) }
                }
                .disabled(!canModify)
                if session.can(.payrollManage) && role.isInternal && ready {
                    DecimalField(title: "Hourly pay rate", value: $payRate)
                }
            } header: { Text("Role") } footer: {
                if !canModify {
                    Text(user.id == session.user?.id ? "You can't change your own role." : "Only the Super Admin can change this account.")
                } else {
                    Text("Elevating a customer to an internal role gives access to time sheets, clock-in (with location tracking), schedules and crews.")
                }
            }
            if session.can(.usersManage) {
                Section { Toggle("Account active", isOn: $active).disabled(!(canModify || user.role == .customer)) }
            }
        }
        .onAppear {
            role = user.role
            active = user.isActive ?? true
            payRate = user.payRate ?? .zero
            ready = true
        }
    }

    private var options: [Role] {
        let assignable = Role.assignable(by: session.role)
        return assignable.contains(user.role) ? assignable : [user.role] + assignable
    }
}

// MARK: - Role permission editor

struct RolesAdminView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()

    private struct Payload { var roles: [RoleDefinition]; var all: [String] }

    var body: some View {
        LoadableView(id: reload, load: { () async throws -> Payload in
            let api = session.api
            async let roles: [RoleDefinition] = api.get("/admin/roles")
            async let all: [String] = api.get("/admin/permissions")
            return try await Payload(roles: roles, all: all)
        }) { payload in
            List(payload.roles) { role in
                NavigationLink {
                    RolePermissionsEditor(role: role, allPermissions: payload.all) { reload = UUID() }
                } label: {
                    LabeledContent(role.name) { Text("\(role.permissions.count)").monospacedDigit() }
                }
            }
        }
        .navigationTitle("Role Permissions")
    }
}

struct RolePermissionsEditor: View {
    let role: RoleDefinition
    let allPermissions: [String]
    let onSaved: () -> Void

    @EnvironmentObject private var session: Session
    @State private var selected = Set<String>()
    @State private var saved = false

    private var locked: Bool { role.key == .superAdmin }

    var body: some View {
        let groups = Dictionary(grouping: allPermissions) { String($0.split(separator: ".").first ?? "") }
        List {
            if locked {
                Section { Label("The Super Admin always has every permission.", systemImage: "lock.fill") }
            }
            ForEach(groups.keys.sorted(), id: \.self) { group in
                Section(group.replacingOccurrences(of: "_", with: " ").capitalized) {
                    ForEach(groups[group] ?? [], id: \.self) { permission in
                        Toggle(permission, isOn: Binding(
                            get: { selected.contains(permission) },
                            set: { on in if on { selected.insert(permission) } else { selected.remove(permission) } }))
                        .disabled(locked)
                        .font(.callout.monospaced())
                    }
                }
            }
        }
        .navigationTitle(role.name)
        .toolbar {
            if !locked {
                AsyncButton(saved ? "Saved" : "Save") {
                    try await session.api.call(.put, "/admin/roles/\(role.key.rawValue)",
                                               body: ["permissions": .array(selected.sorted().map(JSONValue.string))])
                    saved = true
                    onSaved()
                }
            }
        }
        .onAppear { selected = Set(role.permissions) }
        .onChange(of: selected) { _, _ in saved = false }
    }
}

// MARK: - Approvals

struct TimeApprovalsView: View {
    @EnvironmentObject private var session: Session
    @State private var status = "submitted"
    @State private var reload = UUID()

    var body: some View {
        let from = Calendar.current.date(byAdding: .day, value: -31, to: Date()) ?? Date()
        LoadableView(id: "\(status)\(reload)", load: {
            try await session.api.get("/admin/time", query: ["status": status, "from": DateFormats.day(from), "to": DateFormats.day(Date().addingTimeInterval(86_400))]) as [TimeEntry]
        }) { entries in
            ListOrEmpty(items: entries, emptyTitle: "Nothing to review", emptySymbol: "checkmark.circle") { entry in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(entry.userName ?? "User #\(entry.userId)").font(.headline)
                        Spacer()
                        Text("\(entry.hours?.twoDecimals ?? "—") h").monospacedDigit()
                    }
                    Text("\(entry.clockIn.shortDateTime) – \(entry.clockOut?.timeOnly ?? "open")").font(.subheadline)
                    if let job = entry.jobTitle { Label(job, systemImage: "hammer").font(.caption) }
                    if let notes = entry.notes?.nilIfBlank { Text(notes).font(.caption).foregroundStyle(.secondary) }
                }
                .swipeActions(edge: .trailing) {
                    if entry.status == .submitted || entry.status == .open {
                        Button("Approve") { act(entry.id, "approve") }.tint(.green)
                        Button("Reject") { act(entry.id, "reject") }.tint(.red)
                    }
                }
            }
        }
        .navigationTitle("Time Approvals")
        .safeAreaInset(edge: .top) {
            Picker("Status", selection: $status) {
                Text("Submitted").tag("submitted")
                Text("Open").tag("open")
                Text("Approved").tag("approved")
                Text("Rejected").tag("rejected")
            }
            .pickerStyle(.segmented).padding(.horizontal).background(.bar)
        }
    }

    private func act(_ id: Int, _ action: String) {
        Task {
            try? await session.api.call(.post, "/admin/time/\(id)/\(action)")
            reload = UUID()
        }
    }
}

struct TimeOffApprovalsView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var status = "pending"

    var body: some View {
        LoadableView(id: "\(status)\(reload)", load: { try await session.api.get("/admin/timeoff", query: ["status": status]) as [TimeOffRequest] }) { requests in
            ListOrEmpty(items: requests, emptyTitle: "No requests", emptySymbol: "calendar") { request in
                TimeOffRow(request: request)
                    .swipeActions {
                        if request.status == .pending {
                            Button("Approve") { act(request.id, "approve") }.tint(.green)
                            Button("Deny") { act(request.id, "deny") }.tint(.red)
                        }
                    }
            }
        }
        .navigationTitle("Time Off")
        .safeAreaInset(edge: .top) {
            Picker("Status", selection: $status) {
                Text("Pending").tag("pending")
                Text("Approved").tag("approved")
                Text("Denied").tag("denied")
            }
            .pickerStyle(.segmented).padding(.horizontal).background(.bar)
        }
    }

    private func act(_ id: Int, _ action: String) {
        Task {
            try? await session.api.call(.post, "/admin/timeoff/\(id)/\(action)")
            reload = UUID()
        }
    }
}

struct RaiseReviewsView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var reviewing: RaiseRequest? = nil

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/admin/raise-requests") as [RaiseRequest] }) { requests in
            ListOrEmpty(items: requests, emptyTitle: "No requests", emptySymbol: "chart.line.uptrend.xyaxis") { request in
                Button { if request.status == .pending { reviewing = request } } label: { RaiseRow(request: request) }
                    .foregroundStyle(.primary)
            }
        }
        .navigationTitle("Raise Requests")
        .sheet(item: $reviewing, onDismiss: { reload = UUID() }) { RaiseDecisionSheet(request: $0) }
    }
}

struct RaiseDecisionSheet: View {
    let request: RaiseRequest
    @EnvironmentObject private var session: Session
    @Environment(\.dismiss) private var dismiss
    @State private var note = ""

    var body: some View {
        NavigationStack {
            Form {
                RaiseRow(request: request)
                TextField("Note to employee", text: $note, axis: .vertical).lineLimit(2...6)
                AsyncButton("Approve") { try await decide("approve") }
                AsyncButton("Deny", role: .destructive) { try await decide("deny") }
            }
            .navigationTitle("Review Request")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
    }

    private func decide(_ action: String) async throws {
        try await session.api.call(.post, "/admin/raise-requests/\(request.id)/\(action)", body: ["note": .string(note)])
        dismiss()
    }
}
