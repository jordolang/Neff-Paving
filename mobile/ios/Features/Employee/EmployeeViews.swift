import SwiftUI

// MARK: - Time sheets

struct TimesheetView: View {
    @EnvironmentObject private var session: Session
    @State private var weekStart = Calendar.current.dateInterval(of: .weekOfYear, for: Date())?.start ?? Date()
    @State private var reload = UUID()

    private var weekEnd: Date { Calendar.current.date(byAdding: .day, value: 7, to: weekStart) ?? weekStart }

    var body: some View {
        LoadableView(id: "\(weekStart)\(reload)", load: {
            try await session.api.get("/time/entries", query: ["from": DateFormats.day(weekStart), "to": DateFormats.day(weekEnd)]) as [TimeEntry]
        }) { entries in
            List {
                Section {
                    LabeledContent("Total hours") {
                        Text(entries.compactMap(\.hours).sum.twoDecimals).bold().monospacedDigit()
                    }
                }
                Section("Entries") {
                    if entries.isEmpty { Text("No time this week.").foregroundStyle(.secondary) }
                    ForEach(entries) { entry in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(entry.clockIn.formatted(.dateTime.weekday(.wide).month().day())).font(.headline)
                                Text("\(entry.clockIn.timeOnly) – \(entry.clockOut?.timeOnly ?? "now")")
                                    .font(.subheadline).foregroundStyle(.secondary)
                                if let notes = entry.notes?.nilIfBlank { Text(notes).font(.caption) }
                            }
                            Spacer()
                            VStack(alignment: .trailing) {
                                Text(entry.hours?.twoDecimals ?? "—").monospacedDigit()
                                StatusBadge(text: entry.status.rawValue.capitalized, color: color(for: entry.status))
                            }
                        }
                        .swipeActions {
                            if entry.status == .open && entry.clockOut != nil {
                                Button("Submit") {
                                    Task {
                                        try? await session.api.call(.post, "/time/entries/\(entry.id)/submit")
                                        reload = UUID()
                                    }
                                }
                                .tint(.blue)
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Time Sheets")
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button { shiftWeek(-1) } label: { Image(systemName: "chevron.left") }
                Text(weekStart.formatted(.dateTime.month(.abbreviated).day())).font(.footnote)
                Button { shiftWeek(1) } label: { Image(systemName: "chevron.right") }
            }
        }
    }

    private func shiftWeek(_ delta: Int) {
        weekStart = Calendar.current.date(byAdding: .day, value: 7 * delta, to: weekStart) ?? weekStart
    }

    private func color(for status: TimeEntryStatus) -> Color {
        switch status {
        case .open: return .gray
        case .submitted: return .blue
        case .approved: return .green
        case .rejected: return .red
        }
    }
}

// MARK: - Schedule

struct MyScheduleView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        ScheduleListView(title: "My Schedule", path: "/schedule")
    }
}

/// Reusable two-week schedule list, grouped by day.
struct ScheduleListView: View {
    let title: String
    let path: String
    @EnvironmentObject private var session: Session
    @State private var start = Calendar.current.startOfDay(for: Date())

    var body: some View {
        let end = Calendar.current.date(byAdding: .day, value: 14, to: start) ?? start
        LoadableView(id: start, load: {
            try await session.api.get(path, query: ["from": DateFormats.day(start), "to": DateFormats.day(end)]) as [ScheduleEntry]
        }) { entries in
            let days = Dictionary(grouping: entries) { Calendar.current.startOfDay(for: $0.start) }
            if entries.isEmpty {
                ContentUnavailableView("Nothing scheduled", systemImage: "calendar")
            } else {
                List {
                    ForEach(days.keys.sorted(), id: \.self) { day in
                        Section(day.formatted(.dateTime.weekday(.wide).month().day())) {
                            ForEach(days[day] ?? []) { entry in ScheduleRow(entry: entry) }
                        }
                    }
                }
            }
        }
        .navigationTitle(title)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button { start = Calendar.current.date(byAdding: .day, value: -14, to: start) ?? start } label: { Image(systemName: "chevron.left") }
                Button("Today") { start = Calendar.current.startOfDay(for: Date()) }
                Button { start = Calendar.current.date(byAdding: .day, value: 14, to: start) ?? start } label: { Image(systemName: "chevron.right") }
            }
        }
    }
}

struct ScheduleRow: View {
    let entry: ScheduleEntry
    @EnvironmentObject private var session: Session

    var body: some View {
        let content = VStack(alignment: .leading, spacing: 4) {
            Text(entry.jobTitle ?? "Scheduled work").font(.headline)
            Text("\(entry.start.timeOnly) – \(entry.end.timeOnly)").font(.subheadline)
            if let name = entry.userName { Text(name).font(.caption).foregroundStyle(.secondary) }
            if let address = entry.address?.formatted.nilIfBlank { Text(address).font(.caption).foregroundStyle(.secondary) }
            if let notes = entry.notes?.nilIfBlank { Text(notes).font(.caption) }
        }
        if let jobId = entry.jobId, session.permissions.canSeeJobs {
            NavigationLink { JobDetailView(jobId: jobId) } label: { content }
        } else {
            content
        }
    }
}

// MARK: - Crews & contacts

struct CrewsView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        LoadableView(load: { try await session.api.get("/crews") as [Crew] }) { crews in
            ListOrEmpty(items: crews, emptyTitle: "No crews", emptySymbol: "person.3") { crew in
                NavigationLink { CrewDetailView(crew: crew) } label: {
                    HStack {
                        Circle().fill(Color(hex: crew.color ?? "#888888")).frame(width: 12, height: 12)
                        VStack(alignment: .leading) {
                            Text(crew.name).font(.headline)
                            Text("Lead: \(crew.lead?.name ?? "—") · \(crew.members.count) members").font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle("Crews")
    }
}

struct CrewDetailView: View {
    @State var crew: Crew
    @EnvironmentObject private var session: Session
    @State private var editing = false

    var body: some View {
        List {
            if let lead = crew.lead {
                Section("Crew Lead") {
                    Text(lead.name).font(.headline)
                    ContactButtons(phone: lead.phone, email: lead.email)
                }
            }
            Section("Members") {
                ForEach(crew.members) { member in
                    HStack {
                        VStack(alignment: .leading) {
                            Text(member.name)
                            Text(member.role?.displayName ?? "").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        if let url = ContactLinks.phone(member.phone) { Link(destination: url) { Image(systemName: "phone") } }
                    }
                }
            }
        }
        .navigationTitle(crew.name)
        .toolbar {
            if session.can(.crewsManage) { Button("Edit") { editing = true } }
        }
        .sheet(isPresented: $editing) { CrewEditor(crew: crew) { crew = $0 } }
    }
}

struct ContactsView: View {
    @EnvironmentObject private var session: Session
    @State private var search = ""

    var body: some View {
        LoadableView(load: { try await session.api.get("/contacts") as [Contact] }) { contacts in
            let filtered = search.isEmpty ? contacts : contacts.filter { $0.name.localizedCaseInsensitiveContains(search) }
            ListOrEmpty(items: filtered, emptyTitle: "No contacts", emptySymbol: "person.crop.rectangle") { contact in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(contact.name).font(.headline)
                        Spacer()
                        if let role = contact.role { StatusBadge(text: role.displayName, color: Theme.current.primary) }
                    }
                    ContactButtons(phone: contact.phone, email: contact.email).controlSize(.small)
                }
            }
            .searchable(text: $search)
        }
        .navigationTitle("Contacts")
    }
}

// MARK: - Time off

struct TimeOffView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var requesting = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/timeoff") as [TimeOffRequest] }) { requests in
            ListOrEmpty(items: requests, emptyTitle: "No time off requested", emptySymbol: "beach.umbrella") { request in
                TimeOffRow(request: request)
            }
        }
        .navigationTitle("Time Off")
        .toolbar { Button { requesting = true } label: { Image(systemName: "plus") } }
        .sheet(isPresented: $requesting, onDismiss: { reload = UUID() }) { TimeOffRequestForm() }
    }
}

struct TimeOffRow: View {
    let request: TimeOffRequest
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(request.userName ?? request.type.rawValue.capitalized).font(.headline)
                Spacer()
                StatusBadge(text: request.status.rawValue.capitalized, color: request.status.color)
            }
            Text("\(request.type.rawValue.capitalized): \(request.startDate.shortDate) – \(request.endDate.shortDate)").font(.subheadline)
            if let reason = request.reason?.nilIfBlank { Text(reason).font(.caption).foregroundStyle(.secondary) }
        }
    }
}

struct TimeOffRequestForm: View {
    @EnvironmentObject private var session: Session
    @State private var start = Date()
    @State private var end = Date()
    @State private var type: TimeOffType = .vacation
    @State private var reason = ""

    var body: some View {
        FormSheet(title: "Request Time Off", saveTitle: "Submit", canSave: end >= start) {
            let _: TimeOffRequest = try await session.api.post("/timeoff", body: [
                "startDate": .day(start), "endDate": .day(end), "type": .string(type.rawValue), "reason": .string(reason),
            ])
        } content: {
            Picker("Type", selection: $type) { ForEach(TimeOffType.allCases) { Text($0.rawValue.capitalized).tag($0) } }
            DatePicker("First day", selection: $start, displayedComponents: .date)
            DatePicker("Last day", selection: $end, in: start..., displayedComponents: .date)
            TextField("Reason", text: $reason, axis: .vertical).lineLimit(2...6)
        }
    }
}

// MARK: - Pay

struct PayStubsView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        LoadableView(load: { try await session.api.get("/paystubs") as [PayStub] }) { stubs in
            ListOrEmpty(items: stubs, emptyTitle: "No pay stubs yet", emptySymbol: "dollarsign.circle") { stub in
                NavigationLink { PayStubDetailView(stub: stub) } label: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text("\(stub.periodStart.shortDate) – \(stub.periodEnd.shortDate)").font(.headline)
                            Text("Paid \(stub.payDate.shortDate)").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(stub.net.currency).bold().monospacedDigit()
                    }
                }
            }
        }
        .navigationTitle("Pay Stubs")
    }
}

struct PayStubDetailView: View {
    let stub: PayStub
    var body: some View {
        List {
            Section("Pay Period") {
                InfoRow(label: "Period", value: "\(stub.periodStart.shortDate) – \(stub.periodEnd.shortDate)")
                InfoRow(label: "Pay date", value: stub.payDate?.shortDate)
                InfoRow(label: "Hours", value: stub.hours?.twoDecimals)
            }
            Section("Earnings") {
                InfoRow(label: "Gross", value: stub.gross.currency)
                InfoRow(label: "Deductions", value: stub.deductions.map { "−\($0.currency)" })
                LabeledContent("Net pay") { Text(stub.net.currency).bold() }
            }
            if let pdf = stub.pdfUrl {
                Section { Link(destination: pdf) { Label("View PDF", systemImage: "doc.richtext") } }
            }
        }
        .navigationTitle("Pay Stub")
    }
}

/// Tax + payment preferences. Full bank numbers are write-only; only last-4 come back.
struct TaxPrefsView: View {
    @EnvironmentObject private var session: Session
    @State private var prefs = TaxPaymentPrefs()
    @State private var accountNumber = ""
    @State private var routingNumber = ""
    @State private var extra: DecimalString = .zero
    @State private var loaded = false
    @State private var saved = false

    static let filingStatuses = ["single": "Single", "married": "Married", "head": "Head of Household"]

    var body: some View {
        Form {
            Section("Federal Withholding") {
                Picker("Filing status", selection: Binding(get: { prefs.filingStatus ?? "single" }, set: { prefs.filingStatus = $0 })) {
                    ForEach(Self.filingStatuses.keys.sorted(), id: \.self) { Text(Self.filingStatuses[$0] ?? $0).tag($0) }
                }
                Stepper("Allowances: \(prefs.allowances ?? 0)", value: Binding(get: { prefs.allowances ?? 0 }, set: { prefs.allowances = $0 }), in: 0...20)
                if loaded { DecimalField(title: "Extra withholding per check", value: $extra) }
            }
            Section {
                Picker("Pay method", selection: Binding(get: { prefs.payMethod ?? "direct_deposit" }, set: { prefs.payMethod = $0 })) {
                    Text("Direct deposit").tag("direct_deposit")
                    Text("Paper check").tag("check")
                }
                if prefs.payMethod != "check" {
                    TextField("Bank name", text: Binding(get: { prefs.bankName ?? "" }, set: { prefs.bankName = $0 }))
                    SecureField(prefs.routingLast4.map { "Routing ••••\($0) (enter to change)" } ?? "Routing number", text: $routingNumber)
                        .keyboardType(.numberPad)
                    SecureField(prefs.accountLast4.map { "Account ••••\($0) (enter to change)" } ?? "Account number", text: $accountNumber)
                        .keyboardType(.numberPad)
                }
            } header: { Text("Payment") } footer: {
                Text("Bank numbers are encrypted on our server and never shown again — only the last 4 digits.")
            }
            Section {
                AsyncButton("Save") { try await save() }
                if saved { Text("Saved").foregroundStyle(.green) }
            }
        }
        .navigationTitle("Tax + Payment")
        .task {
            if let loadedPrefs: TaxPaymentPrefs = try? await session.api.get("/tax-prefs") {
                prefs = loadedPrefs
                extra = loadedPrefs.extraWithholding ?? .zero
            }
            loaded = true
        }
    }

    private func save() async throws {
        var body: [String: JSONValue] = [
            "filingStatus": .string(prefs.filingStatus ?? "single"),
            "allowances": .int(prefs.allowances ?? 0),
            "extraWithholding": .string(extra.moneyString),
            "payMethod": .string(prefs.payMethod ?? "direct_deposit"),
            "bankName": .optional(prefs.bankName),
        ]
        if let account = accountNumber.nilIfBlank { body["accountNumber"] = .string(account) }
        if let routing = routingNumber.nilIfBlank { body["routingNumber"] = .string(routing) }
        prefs = try await session.api.put("/tax-prefs", body: .object(body))
        accountNumber = ""
        routingNumber = ""
        saved = true
    }
}

// MARK: - Raise / position change

struct RaiseRequestsView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var composing = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/raise-requests") as [RaiseRequest] }) { requests in
            ListOrEmpty(items: requests, emptyTitle: "No requests", emptySymbol: "arrow.up.right.circle") { request in
                RaiseRow(request: request)
            }
        }
        .navigationTitle("Raise + Position")
        .toolbar { Button { composing = true } label: { Image(systemName: "plus") } }
        .sheet(isPresented: $composing, onDismiss: { reload = UUID() }) { RaiseRequestForm() }
    }
}

struct RaiseRow: View {
    let request: RaiseRequest
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(request.userName ?? request.kind.displayName).font(.headline)
                Spacer()
                StatusBadge(text: request.status.rawValue.capitalized, color: request.status.color)
            }
            if request.kind == .raise {
                Text("\(request.currentRate?.currency ?? "—")/hr → \(request.requestedRate?.currency ?? "—")/hr").font(.subheadline)
            } else {
                Text("Position: \(request.requestedPosition?.displayName ?? "—")").font(.subheadline)
            }
            if let text = request.justification?.nilIfBlank { Text(text).font(.caption).foregroundStyle(.secondary) }
            if let note = request.reviewNote?.nilIfBlank { Text("Note: \(note)").font(.caption).italic() }
        }
    }
}

struct RaiseRequestForm: View {
    @EnvironmentObject private var session: Session
    @State private var kind: RaiseKind = .raise
    @State private var rate: DecimalString = .zero
    @State private var position: Role = .crewLead
    @State private var justification = ""

    var body: some View {
        FormSheet(title: "New Request", saveTitle: "Submit",
                  canSave: justification.nilIfBlank != nil && (kind == .positionChange || rate > .zero)) {
            let _: RaiseRequest = try await session.api.post("/raise-requests", body: [
                "kind": .string(kind.rawValue),
                "requestedRate": kind == .raise ? .string(rate.moneyString) : .null,
                "requestedPosition": kind == .positionChange ? .string(position.rawValue) : .null,
                "justification": .string(justification),
            ])
        } content: {
            Picker("Request", selection: $kind) { ForEach(RaiseKind.allCases) { Text($0.displayName).tag($0) } }
                .pickerStyle(.segmented)
            if kind == .raise {
                DecimalField(title: "Requested hourly rate", value: $rate)
            } else {
                Picker("Position", selection: $position) {
                    ForEach(Role.allCases.filter { ![.superAdmin, .admin, .customer].contains($0) }) { Text($0.displayName).tag($0) }
                }
            }
            Section("Why?") { TextField("Tell the owners why", text: $justification, axis: .vertical).lineLimit(4...10) }
        }
    }
}
