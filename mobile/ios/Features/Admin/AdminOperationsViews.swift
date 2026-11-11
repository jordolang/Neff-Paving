import SwiftUI

// MARK: - Dispatch

/// Dispatch a crew to a job: creates schedule entries for every member and notifies them.
struct DispatchView: View {
    @EnvironmentObject private var session: Session
    @State private var jobs: [Job] = []
    @State private var crews: [Crew] = []
    @State private var jobId: Int? = nil
    @State private var crewId: Int? = nil
    @State private var start = Calendar.current.date(bySettingHour: 7, minute: 0, second: 0, of: Date().addingTimeInterval(86_400)) ?? Date()
    @State private var end = Calendar.current.date(bySettingHour: 16, minute: 0, second: 0, of: Date().addingTimeInterval(86_400)) ?? Date()
    @State private var notes = ""
    @State private var result: String? = nil

    var body: some View {
        Form {
            Section("Job") {
                Picker("Job", selection: $jobId) {
                    Text("Select…").tag(Int?.none)
                    ForEach(jobs) { Text($0.title).tag(Int?.some($0.id)) }
                }
                if let job = jobs.first(where: { $0.id == jobId }), let address = job.serviceAddress?.formatted.nilIfBlank {
                    Text(address).font(.caption).foregroundStyle(.secondary)
                }
            }
            Section("Crew") {
                Picker("Crew", selection: $crewId) {
                    Text("Select…").tag(Int?.none)
                    ForEach(crews) { Text("\($0.name) (\($0.members.count))").tag(Int?.some($0.id)) }
                }
            }
            Section("When") {
                DatePicker("Start", selection: $start)
                DatePicker("End", selection: $end, in: start...)
                TextField("Notes for the crew", text: $notes, axis: .vertical)
            }
            if let result { Section { Label(result, systemImage: "checkmark.circle.fill").foregroundStyle(.green) } }
            Section {
                AsyncButton("Dispatch Crew") {
                    guard let jobId, let crewId else { return }
                    let response: JSONValue = try await session.api.post("/admin/dispatch", body: [
                        "jobId": .int(jobId), "crewId": .int(crewId), "start": .date(start), "end": .date(end), "notes": .string(notes),
                    ])
                    if case .array(let entries) = response {
                        result = "Dispatched — \(entries.count) schedule entr\(entries.count == 1 ? "y" : "ies") created and crew notified."
                    } else {
                        result = "Crew dispatched and notified."
                    }
                }
                .disabled(jobId == nil || crewId == nil)
            }
        }
        .navigationTitle("Dispatch")
        .task {
            let api = session.api
            async let j: [Job] = api.get("/jobs")
            async let c: [Crew] = api.get("/crews")
            jobs = ((try? await j) ?? []).filter { ![.completed, .cancelled].contains($0.status) }
            crews = (try? await c) ?? []
        }
    }
}

// MARK: - Schedule management

struct ScheduleAdminView: View {
    @EnvironmentObject private var session: Session
    @State private var start = Calendar.current.startOfDay(for: Date())
    @State private var reload = UUID()
    @State private var editing: ScheduleEntry? = nil
    @State private var creating = false

    var body: some View {
        let end = Calendar.current.date(byAdding: .day, value: 14, to: start) ?? start
        LoadableView(id: "\(start)\(reload)", load: {
            try await session.api.get("/calendar", query: ["from": DateFormats.day(start), "to": DateFormats.day(end)]) as [ScheduleEntry]
        }) { entries in
            ListOrEmpty(items: entries.sorted { $0.start < $1.start }, emptyTitle: "Nothing scheduled", emptySymbol: "calendar") { entry in
                Button { editing = entry } label: {
                    VStack(alignment: .leading) {
                        Text(entry.start.formatted(.dateTime.weekday().month().day())).font(.caption).foregroundStyle(.secondary)
                        ScheduleRow(entry: entry)
                    }
                }
                .foregroundStyle(.primary)
                .swipeActions {
                    Button("Delete", role: .destructive) {
                        Task {
                            try? await session.api.call(.delete, "/admin/schedule/\(entry.id)")
                            reload = UUID()
                        }
                    }
                }
            }
        }
        .navigationTitle("Manage Schedule")
        .toolbar {
            Button { start = Calendar.current.date(byAdding: .day, value: -14, to: start) ?? start } label: { Image(systemName: "chevron.left") }
            Button { start = Calendar.current.date(byAdding: .day, value: 14, to: start) ?? start } label: { Image(systemName: "chevron.right") }
            Button { creating = true } label: { Image(systemName: "plus") }
        }
        .sheet(item: $editing, onDismiss: { reload = UUID() }) { ScheduleEntryEditor(entry: $0) }
        .sheet(isPresented: $creating, onDismiss: { reload = UUID() }) { ScheduleEntryEditor(entry: nil) }
    }
}

struct ScheduleEntryEditor: View {
    let entry: ScheduleEntry?
    @EnvironmentObject private var session: Session
    @State private var userId: Int? = nil
    @State private var crewId: Int? = nil
    @State private var jobId: Int? = nil
    @State private var start = Date()
    @State private var end = Date().addingTimeInterval(8 * 3600)
    @State private var notes = ""
    @State private var people: [Contact] = []
    @State private var crews: [Crew] = []
    @State private var jobs: [Job] = []

    var body: some View {
        FormSheet(title: entry == nil ? "New Entry" : "Edit Entry", canSave: userId != nil || crewId != nil) {
            let body: JSONValue = [
                "userId": .optional(userId), "crewId": .optional(crewId), "jobId": .optional(jobId),
                "start": .date(start), "end": .date(end), "notes": .string(notes),
            ]
            if let entry {
                try await session.api.call(.put, "/admin/schedule/\(entry.id)", body: body)
            } else {
                try await session.api.call(.post, "/admin/schedule", body: body)
            }
        } content: {
            Picker("Employee", selection: $userId) {
                Text("—").tag(Int?.none)
                ForEach(people) { Text($0.name).tag(Int?.some($0.id)) }
            }
            Picker("Crew", selection: $crewId) {
                Text("—").tag(Int?.none)
                ForEach(crews) { Text($0.name).tag(Int?.some($0.id)) }
            }
            Picker("Job", selection: $jobId) {
                Text("—").tag(Int?.none)
                ForEach(jobs) { Text($0.title).tag(Int?.some($0.id)) }
            }
            DatePicker("Start", selection: $start)
            DatePicker("End", selection: $end, in: start...)
            TextField("Notes", text: $notes, axis: .vertical)
        }
        .task {
            if let entry {
                userId = entry.userId; crewId = entry.crewId; jobId = entry.jobId
                start = entry.start; end = entry.end; notes = entry.notes ?? ""
            }
            people = (try? await session.api.get("/contacts") as [Contact]) ?? []
            crews = (try? await session.api.get("/crews") as [Crew]) ?? []
            jobs = (try? await session.api.get("/jobs") as [Job]) ?? []
        }
    }
}

// MARK: - Crews (office/admin)

struct CrewsAdminView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var editing: Crew? = nil
    @State private var creating = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/admin/crews") as [Crew] }) { crews in
            ListOrEmpty(items: crews, emptyTitle: "No crews", emptySymbol: "person.3") { crew in
                Button { editing = crew } label: {
                    HStack {
                        Circle().fill(Color(hex: crew.color ?? "#888888")).frame(width: 12, height: 12)
                        VStack(alignment: .leading) {
                            Text(crew.name).font(.headline)
                            Text("Lead: \(crew.lead?.name ?? "—") · \(crew.members.map(\.name).joined(separator: ", "))")
                                .font(.caption).foregroundStyle(.secondary).lineLimit(2)
                        }
                    }
                }
                .foregroundStyle(.primary)
                .swipeActions {
                    Button("Delete", role: .destructive) {
                        Task {
                            try? await session.api.call(.delete, "/admin/crews/\(crew.id)")
                            reload = UUID()
                        }
                    }
                }
            }
        }
        .navigationTitle("Manage Crews")
        .toolbar { Button { creating = true } label: { Image(systemName: "plus") } }
        .sheet(item: $editing, onDismiss: { reload = UUID() }) { CrewEditor(crew: $0) { _ in } }
        .sheet(isPresented: $creating, onDismiss: { reload = UUID() }) { CrewEditor(crew: nil) { _ in } }
    }
}

// MARK: - Invoices + payments

struct InvoicesAdminView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var creating = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/admin/invoices") as [Invoice] }) { invoices in
            ListOrEmpty(items: invoices, emptyTitle: "No invoices", emptySymbol: "doc.richtext") { invoice in
                NavigationLink { AdminInvoiceDetailView(invoiceId: invoice.id) } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(invoice.number ?? "#\(invoice.id)").font(.headline)
                            Spacer()
                            Text(invoice.total.currency).monospacedDigit()
                        }
                        HStack {
                            Text(invoice.customerName ?? "").font(.subheadline)
                            Spacer()
                            StatusBadge(text: invoice.status.rawValue.capitalized, color: invoice.status.color)
                        }
                    }
                }
            }
        }
        .navigationTitle("Invoices")
        .toolbar { Button { creating = true } label: { Image(systemName: "plus") } }
        .sheet(isPresented: $creating, onDismiss: { reload = UUID() }) { InvoiceEditor(invoice: nil) }
    }
}

struct AdminInvoiceDetailView: View {
    let invoiceId: Int
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var editing = false
    @State private var recording = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/admin/invoices/\(invoiceId)") as Invoice }) { invoice in
            InvoiceDetailView(invoice: invoice)
                .safeAreaInset(edge: .bottom) {
                    HStack {
                        if invoice.status == .draft {
                            AsyncButton("Send") {
                                try await session.api.call(.post, "/admin/invoices/\(invoiceId)/send")
                                reload = UUID()
                            }
                            .buttonStyle(.borderedProminent)
                        }
                        if invoice.amountDue > .zero && invoice.status != .void {
                            Button("Record Payment") { recording = true }.buttonStyle(.bordered)
                        }
                        if invoice.status != .paid && invoice.status != .void {
                            Button("Edit") { editing = true }.buttonStyle(.bordered)
                        }
                    }
                    .padding().frame(maxWidth: .infinity).background(.bar)
                }
                .sheet(isPresented: $editing, onDismiss: { reload = UUID() }) { InvoiceEditor(invoice: invoice) }
                .sheet(isPresented: $recording, onDismiss: { reload = UUID() }) { RecordPaymentSheet(invoice: invoice) }
        }
    }
}

struct InvoiceEditor: View {
    let invoice: Invoice?
    @EnvironmentObject private var session: Session
    @State private var customerId: Int? = nil
    @State private var customers: [CustomerSummary] = []
    @State private var jobs: [Job] = []
    @State private var jobId: Int? = nil
    @State private var items: [LineItem] = [LineItem()]
    @State private var tax: DecimalString = .zero
    @State private var dueAt = Date().addingTimeInterval(30 * 86_400)
    @State private var voiding = false
    @State private var ready = false

    var body: some View {
        FormSheet(title: invoice == nil ? "New Invoice" : "Edit Invoice", canSave: invoice != nil || customerId != nil) {
            let lines = items.filter { $0.description.nilIfBlank != nil }
            if let invoice {
                var body: [String: JSONValue] = ["lineItems": .array(lines.map(\.json)), "tax": .string(tax.moneyString), "dueAt": .date(dueAt)]
                if voiding { body["status"] = "void" }
                try await session.api.call(.put, "/admin/invoices/\(invoice.id)", body: .object(body))
            } else if let customerId {
                try await session.api.call(.post, "/admin/invoices", body: [
                    "customerId": .int(customerId), "jobId": .optional(jobId), "lineItems": .array(lines.map(\.json)),
                    "tax": .string(tax.moneyString), "dueAt": .date(dueAt),
                ])
            }
        } content: {
            if invoice == nil {
                Section("Bill To") {
                    Picker("Customer", selection: $customerId) {
                        Text("Select…").tag(Int?.none)
                        ForEach(customers) { Text($0.displayName).tag(Int?.some($0.id)) }
                    }
                    Picker("Job", selection: $jobId) {
                        Text("None").tag(Int?.none)
                        ForEach(jobs) { Text($0.title).tag(Int?.some($0.id)) }
                    }
                }
            }
            Section("Items") { LineItemsEditor(items: $items) }
            Section {
                if ready { DecimalField(title: "Tax", value: $tax) }
                DatePicker("Due", selection: $dueAt, displayedComponents: .date)
                LabeledContent("Grand total", value: (items.map(\.computedTotal).sum + tax).currency)
            }
            if invoice != nil { Section { Toggle("Void this invoice", isOn: $voiding) } }
        }
        .task {
            if let invoice {
                items = invoice.lineItems?.isEmpty == false ? invoice.lineItems! : [LineItem()]
                tax = invoice.tax ?? .zero
                dueAt = invoice.dueAt ?? dueAt
            } else {
                customers = (try? await session.api.get("/customers") as [CustomerSummary]) ?? []
            }
            ready = true
        }
        .onChange(of: customerId) { _, id in
            guard let id else { jobs = []; return }
            Task { jobs = ((try? await session.api.get("/customers/\(id)") as CustomerDetail)?.jobs) ?? [] }
        }
    }
}

struct RecordPaymentSheet: View {
    let invoice: Invoice
    @EnvironmentObject private var session: Session
    @State private var amount: DecimalString = .zero
    @State private var method = "check"

    var body: some View {
        FormSheet(title: "Record Payment", canSave: amount > .zero) {
            let _: Payment = try await session.api.post("/admin/payments", body: [
                "invoiceId": .int(invoice.id), "amount": .string(amount.moneyString), "method": .string(method),
            ])
        } content: {
            LabeledContent("Balance", value: invoice.amountDue.currency)
            DecimalField(title: "Amount", value: $amount)
            Picker("Method", selection: $method) {
                Text("Check").tag("check")
                Text("Cash").tag("cash")
                Text("Card").tag("card")
                Text("ACH").tag("ach")
            }
        }
        .onAppear { amount = invoice.amountDue }
    }
}

// MARK: - Payroll

struct PayrollView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var creating = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/admin/payroll/runs") as [PayrollRun] }) { runs in
            ListOrEmpty(items: runs, emptyTitle: "No payroll runs", emptySymbol: "banknote",
                        emptyMessage: "Runs generate pay stubs from approved time.") { run in
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(run.periodStart.shortDate) – \(run.periodEnd.shortDate)").font(.headline)
                    HStack {
                        Text("\(run.stubCount ?? 0) stubs")
                        Spacer()
                        Text("Gross \(run.gross.currency) · Net \(run.net.currency)").monospacedDigit()
                    }
                    .font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .navigationTitle("Payroll")
        .toolbar { Button { creating = true } label: { Label("Run Payroll", systemImage: "plus") } }
        .sheet(isPresented: $creating, onDismiss: { reload = UUID() }) { PayrollRunForm() }
    }
}

struct PayrollRunForm: View {
    @EnvironmentObject private var session: Session
    @State private var periodStart = Calendar.current.date(byAdding: .day, value: -14, to: Date()) ?? Date()
    @State private var periodEnd = Date()
    @State private var payDate = Date().addingTimeInterval(3 * 86_400)

    var body: some View {
        FormSheet(title: "Run Payroll", saveTitle: "Generate", canSave: periodEnd >= periodStart) {
            let _: PayrollRun = try await session.api.post("/admin/payroll/runs", body: [
                "periodStart": .day(periodStart), "periodEnd": .day(periodEnd), "payDate": .day(payDate),
            ])
        } content: {
            Section {
                DatePicker("Period start", selection: $periodStart, displayedComponents: .date)
                DatePicker("Period end", selection: $periodEnd, in: periodStart..., displayedComponents: .date)
                DatePicker("Pay date", selection: $payDate, displayedComponents: .date)
            } footer: {
                Text("Pay stubs are generated from approved time entries in this period at each employee's pay rate.")
            }
        }
    }
}
