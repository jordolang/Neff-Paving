import SwiftUI

// MARK: - Customers

struct CustomersView: View {
    @EnvironmentObject private var session: Session
    @State private var query = ""

    var body: some View {
        LoadableView(id: query, load: { () async throws -> [CustomerSummary] in
            try await Task.sleep(nanoseconds: query.isEmpty ? 0 : 300_000_000) // debounce typing
            return try await session.api.get("/customers", query: ["q": query.nilIfBlank]) as [CustomerSummary]
        }) { customers in
            ListOrEmpty(items: customers, emptyTitle: "No customers", emptySymbol: "person.2") { customer in
                NavigationLink { CustomerDetailView(customerId: customer.id) } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(customer.displayName).font(.headline)
                            if customer.closed == true { StatusBadge(text: "Closed", color: .gray) }
                        }
                        Text([customer.phone, customer.email].compactMap { $0 }.joined(separator: " · "))
                            .font(.caption).foregroundStyle(.secondary)
                        if let count = customer.jobCount { Text("\(count) job(s)").font(.caption2).foregroundStyle(.secondary) }
                    }
                }
            }
        }
        .searchable(text: $query, prompt: "Name, email or phone")
        .navigationTitle("Customers")
    }
}

struct CustomerDetailView: View {
    let customerId: Int
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var confirmClose = false
    @State private var confirmForce = false
    @State private var closeError: String? = nil
    @State private var newEstimate = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/customers/\(customerId)") as CustomerDetail }) { customer in
            List {
                Section {
                    HStack {
                        Text(customer.displayName).font(.title3.bold())
                        if customer.closed == true { StatusBadge(text: "Account Closed", color: .gray) }
                    }
                    InfoRow(label: "Phone", value: customer.phone, symbol: "phone")
                    InfoRow(label: "Email", value: customer.email, symbol: "envelope")
                    InfoRow(label: "Address", value: customer.address?.formatted, symbol: "mappin")
                    if session.can(.customersContact) { ContactButtons(phone: customer.phone, email: customer.email) }
                }
                Section("Jobs") {
                    ForEach(customer.jobs ?? []) { job in
                        NavigationLink { JobDetailView(jobId: job.id) } label: { JobRow(job: job) }
                    }
                    if (customer.jobs ?? []).isEmpty { Text("No jobs").foregroundStyle(.secondary) }
                }
                Section("Estimates") {
                    ForEach(customer.estimates ?? []) { estimate in
                        NavigationLink { EstimateEditor(estimate: estimate, customerId: customerId) } label: { EstimateRow(estimate: estimate) }
                    }
                    if session.can(.estimatesCreate) {
                        Button { newEstimate = true } label: { Label("New Estimate", systemImage: "plus") }
                    }
                }
                Section("Invoices") {
                    ForEach(customer.invoices ?? []) { invoice in
                        NavigationLink { InvoiceDetailView(invoice: invoice) } label: {
                            LabeledContent(invoice.number ?? "Invoice #\(invoice.id)") {
                                StatusBadge(text: invoice.status.rawValue.capitalized, color: invoice.status.color)
                            }
                        }
                    }
                }
                if session.can(.accountsClose) && customer.closed != true {
                    Section {
                        Button("Close Out Account", role: .destructive) { confirmClose = true }
                        if let closeError { Text(closeError).font(.footnote).foregroundStyle(.red) }
                    } footer: {
                        Text("Closing deactivates portal access. Accounts with unpaid invoices need confirmation.")
                    }
                }
            }
            .navigationTitle(customer.displayName)
        }
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $newEstimate, onDismiss: { reload = UUID() }) {
            NavigationStack { EstimateEditor(estimate: nil, customerId: customerId) }
        }
        .confirmationDialog("Close this account?", isPresented: $confirmClose, titleVisibility: .visible) {
            Button("Close Account", role: .destructive) { Task { await close(force: false) } }
        }
        .confirmationDialog("This customer has unpaid invoices.", isPresented: $confirmForce, titleVisibility: .visible) {
            Button("Close Anyway", role: .destructive) { Task { await close(force: true) } }
        } message: { Text(closeError ?? "") }
    }

    private func close(force: Bool) async {
        do {
            try await session.api.call(.post, "/admin/accounts/\(customerId)/close", body: ["force": .bool(force)])
            closeError = nil
            reload = UUID()
        } catch let error as APIError where error.status == 409 && !force {
            closeError = error.localizedDescription
            confirmForce = true
        } catch {
            closeError = error.localizedDescription
        }
    }
}

// MARK: - Estimates (estimators / office / crew leads)

struct EstimatesManageView: View {
    @EnvironmentObject private var session: Session
    @State private var status: EstimateStatus? = nil
    @State private var reload = UUID()
    @State private var creating = false

    var body: some View {
        LoadableView(id: "\(status?.rawValue ?? "all")\(reload)", load: {
            try await session.api.get("/estimates", query: ["status": status?.rawValue]) as [Estimate]
        }) { estimates in
            ListOrEmpty(items: estimates, emptyTitle: "No estimates", emptySymbol: "doc.text") { estimate in
                NavigationLink { EstimateEditor(estimate: estimate, customerId: estimate.customerId) } label: { EstimateRow(estimate: estimate) }
            }
        }
        .navigationTitle("Estimates")
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Menu {
                    Button("All") { status = nil }
                    ForEach(EstimateStatus.allCases) { s in Button(s.displayName) { status = s } }
                } label: { Label(status?.displayName ?? "All", systemImage: "line.3.horizontal.decrease.circle") }
            }
            ToolbarItem(placement: .topBarTrailing) { Button { creating = true } label: { Image(systemName: "plus") } }
        }
        .sheet(isPresented: $creating, onDismiss: { reload = UUID() }) {
            NavigationStack { EstimateEditor(estimate: nil, customerId: nil) }
        }
    }
}

/// Create (`POST /estimates`) or update (`PUT /estimates/:id`) an estimate with line items, then send.
struct EstimateEditor: View {
    let estimate: Estimate?
    let customerId: Int?

    @EnvironmentObject private var session: Session
    @Environment(\.dismiss) private var dismiss
    @State private var current: Estimate? = nil
    @State private var selectedCustomer: Int? = nil
    @State private var customers: [CustomerSummary] = []
    @State private var serviceType = "Asphalt Paving"
    @State private var description = ""
    @State private var address = Address()
    @State private var lineItems: [LineItem] = [LineItem()]
    @State private var validUntil = Date().addingTimeInterval(30 * 86_400)
    @State private var notes = ""
    @State private var status: EstimateStatus = .inReview
    @State private var message: String? = nil

    var body: some View {
        Form {
            if current == nil && customerId == nil {
                Section("Customer") {
                    Picker("Customer", selection: $selectedCustomer) {
                        Text("Select…").tag(Int?.none)
                        ForEach(customers) { Text($0.displayName).tag(Int?.some($0.id)) }
                    }
                }
            }
            Section("Work") {
                Picker("Service", selection: $serviceType) {
                    ForEach(EstimateRequestView.services, id: \.self) { Text($0) }
                }
                TextField("Description", text: $description, axis: .vertical).lineLimit(2...6)
                if let requested = current?.preferredDate { LabeledContent("Customer's preferred date", value: requested.shortDate) }
            }
            if current == nil { Section("Service Address") { AddressFields(address: $address) } }
            Section("Line Items") { LineItemsEditor(items: $lineItems) }
            Section("Terms") {
                DatePicker("Valid until", selection: $validUntil, displayedComponents: .date)
                TextField("Notes to customer", text: $notes, axis: .vertical).lineLimit(2...6)
                if current != nil {
                    Picker("Status", selection: $status) { ForEach(EstimateStatus.allCases) { Text($0.displayName).tag($0) } }
                }
            }
            if let media = current?.media, !media.isEmpty { Section("Customer Photos") { MediaGrid(media: media) } }
            if let message { Section { Text(message).foregroundStyle(.secondary) } }
            Section {
                AsyncButton("Save") { try await save() }
                if let current, current.status != .accepted {
                    AsyncButton("Save + Send to Customer") {
                        try await save()
                        self.current = try await session.api.post("/estimates/\(current.id)/send")
                        message = "Sent to customer."
                    }
                }
            }
        }
        .navigationTitle(current == nil ? "New Estimate" : "Estimate #\(current?.id ?? 0)")
        .toolbar {
            if estimate == nil { ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } } }
        }
        .task {
            if let estimate { apply(estimate) }
            if customerId == nil && estimate == nil {
                customers = (try? await session.api.get("/customers") as [CustomerSummary]) ?? []
            }
        }
    }

    private func apply(_ e: Estimate) {
        current = e
        serviceType = e.serviceType ?? serviceType
        description = e.description ?? ""
        address = e.serviceAddress ?? Address()
        lineItems = (e.lineItems?.isEmpty == false) ? e.lineItems! : [LineItem()]
        validUntil = e.validUntil ?? validUntil
        notes = e.notes ?? ""
        status = e.status == .requested ? .inReview : e.status
    }

    private func save() async throws {
        let items = lineItems.filter { $0.description.nilIfBlank != nil }
        let body: [String: JSONValue] = [
            "serviceType": .string(serviceType), "description": .string(description),
            "lineItems": .array(items.map(\.json)), "total": .string(items.map(\.computedTotal).sum.moneyString),
            "validUntil": .day(validUntil), "notes": .string(notes),
        ]
        if let current {
            var update = body
            update["status"] = .string(status.rawValue)
            apply(try await session.api.put("/estimates/\(current.id)", body: .object(update)))
        } else {
            guard let customer = customerId ?? selectedCustomer else { throw APIError.http(status: 400, code: "bad_request", message: "Choose a customer.") }
            var create = body
            create["customerId"] = .int(customer)
            create["serviceAddress"] = address.json
            apply(try await session.api.post("/estimates", body: .object(create)))
        }
        message = "Saved."
    }
}

// MARK: - Calendar

struct CompanyCalendarView: View {
    var body: some View { ScheduleListView(title: "Calendar", path: "/calendar") }
}

// MARK: - Crew member editing

/// Crew leads edit members via `PUT /crews/:id/members`; office/admin use `PUT /admin/crews/:id`.
struct CrewEditor: View {
    let crew: Crew?
    let onSaved: (Crew) -> Void

    @EnvironmentObject private var session: Session
    @State private var name = ""
    @State private var color = "#F5A400"
    @State private var leadId: Int? = nil
    @State private var memberIds = Set<Int>()
    @State private var people: [Contact] = []

    private var isOfficeEditor: Bool { session.role.rank <= Role.officeStaff.rank }

    var body: some View {
        FormSheet(title: crew == nil ? "New Crew" : "Edit Crew", canSave: name.nilIfBlank != nil) {
            let saved: Crew
            let ids = JSONValue.array(memberIds.sorted().map(JSONValue.int))
            if isOfficeEditor {
                let body: JSONValue = ["name": .string(name), "leadId": .optional(leadId), "memberIds": ids, "color": .string(color)]
                if let crew {
                    saved = try await session.api.put("/admin/crews/\(crew.id)", body: body)
                } else {
                    saved = try await session.api.post("/admin/crews", body: body)
                }
            } else if let crew {
                saved = try await session.api.put("/crews/\(crew.id)/members", body: ["memberIds": ids])
            } else {
                return
            }
            onSaved(saved)
        } content: {
            if isOfficeEditor {
                Section("Crew") {
                    TextField("Name", text: $name)
                    TextField("Color (hex)", text: $color)
                    Picker("Crew lead", selection: $leadId) {
                        Text("None").tag(Int?.none)
                        ForEach(people) { Text($0.name).tag(Int?.some($0.id)) }
                    }
                }
            }
            Section("Members") {
                ForEach(people) { person in
                    Button {
                        if memberIds.contains(person.id) { memberIds.remove(person.id) } else { memberIds.insert(person.id) }
                    } label: {
                        HStack {
                            Text(person.name)
                            Text(person.role?.displayName ?? "").font(.caption).foregroundStyle(.secondary)
                            Spacer()
                            if memberIds.contains(person.id) { Image(systemName: "checkmark").foregroundStyle(Theme.current.primary) }
                        }
                    }
                    .foregroundStyle(.primary)
                }
            }
        }
        .task {
            if let crew {
                name = crew.name
                color = crew.color ?? color
                leadId = crew.lead?.id
                memberIds = Set(crew.members.map(\.id))
            }
            people = (try? await session.api.get("/contacts") as [Contact]) ?? []
        }
    }
}
