import SwiftUI

// MARK: - Suppliers

struct SuppliersView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var editing: Supplier? = nil
    @State private var creating = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/admin/suppliers") as [Supplier] }) { suppliers in
            ListOrEmpty(items: suppliers, emptyTitle: "No suppliers", emptySymbol: "shippingbox") { supplier in
                Button { editing = supplier } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(supplier.name).font(.headline)
                        if let contact = supplier.contactName { Text(contact).font(.subheadline) }
                        if let materials = supplier.materials?.nilIfBlank { Text(materials).font(.caption).foregroundStyle(.secondary) }
                        ContactButtons(phone: supplier.phone, email: supplier.email).controlSize(.small)
                    }
                }
                .foregroundStyle(.primary)
                .swipeActions {
                    Button("Delete", role: .destructive) {
                        Task { try? await session.api.call(.delete, "/admin/suppliers/\(supplier.id)"); reload = UUID() }
                    }
                }
            }
        }
        .navigationTitle("Suppliers")
        .toolbar { Button { creating = true } label: { Image(systemName: "plus") } }
        .sheet(item: $editing, onDismiss: { reload = UUID() }) { SupplierEditor(supplier: $0) }
        .sheet(isPresented: $creating, onDismiss: { reload = UUID() }) { SupplierEditor(supplier: nil) }
    }
}

struct SupplierEditor: View {
    let supplier: Supplier?
    @EnvironmentObject private var session: Session
    @State private var name = ""
    @State private var contactName = ""
    @State private var phone = ""
    @State private var email = ""
    @State private var materials = ""
    @State private var notes = ""

    var body: some View {
        FormSheet(title: supplier == nil ? "New Supplier" : "Edit Supplier", canSave: name.nilIfBlank != nil) {
            let body: JSONValue = ["name": .string(name), "contactName": .string(contactName), "phone": .string(phone),
                                   "email": .string(email), "materials": .string(materials), "notes": .string(notes)]
            if let supplier { try await session.api.call(.put, "/admin/suppliers/\(supplier.id)", body: body) }
            else { try await session.api.call(.post, "/admin/suppliers", body: body) }
        } content: {
            TextField("Company name", text: $name)
            TextField("Contact name", text: $contactName)
            TextField("Phone", text: $phone).keyboardType(.phonePad)
            TextField("Email", text: $email).keyboardType(.emailAddress).textInputAutocapitalization(.never)
            TextField("Materials supplied", text: $materials)
            TextField("Notes", text: $notes, axis: .vertical)
        }
        .onAppear {
            guard let supplier else { return }
            name = supplier.name; contactName = supplier.contactName ?? ""; phone = supplier.phone ?? ""
            email = supplier.email ?? ""; materials = supplier.materials ?? ""; notes = supplier.notes ?? ""
        }
    }
}

// MARK: - Equipment + maintenance (mechanics)

struct EquipmentView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var creating = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/admin/equipment") as [Equipment] }) { items in
            ListOrEmpty(items: items, emptyTitle: "No equipment", emptySymbol: "wrench.and.screwdriver") { item in
                NavigationLink { EquipmentDetailView(equipmentId: item.id, initial: item) } label: { EquipmentRow(item: item) }
            }
        }
        .navigationTitle("Equipment")
        .toolbar {
            if session.can(.maintenanceManage) { Button { creating = true } label: { Image(systemName: "plus") } }
        }
        .sheet(isPresented: $creating, onDismiss: { reload = UUID() }) { EquipmentEditor(equipment: nil) }
    }
}

struct EquipmentRow: View {
    let item: Equipment
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(item.name).font(.headline)
                Spacer()
                StatusBadge(text: (item.status ?? "active").replacingOccurrences(of: "_", with: " ").capitalized,
                            color: item.status == "in_shop" ? .orange : item.status == "retired" ? .gray : .green)
            }
            Text([item.kind, item.identifier].compactMap { $0 }.joined(separator: " · ")).font(.caption).foregroundStyle(.secondary)
            if let due = item.nextDueAt {
                Label("Service due \(due.shortDate)", systemImage: "calendar.badge.exclamationmark")
                    .font(.caption).foregroundStyle(due < Date() ? .red : .secondary)
            }
        }
    }
}

struct EquipmentDetailView: View {
    let equipmentId: Int
    let initial: Equipment
    @EnvironmentObject private var session: Session
    @State private var item: Equipment? = nil
    @State private var editing = false
    @State private var logging = false

    var body: some View {
        let current = item ?? initial
        List {
            Section { EquipmentRow(item: current) }
            if let notes = current.notes?.nilIfBlank { Section("Notes") { Text(notes) } }
            InfoRow(label: "Last service", value: current.lastServiceAt?.shortDate, symbol: "wrench")
            Section("Maintenance History") {
                let records = current.maintenance ?? []
                if records.isEmpty { Text("No maintenance recorded.").foregroundStyle(.secondary) }
                ForEach(records) { record in
                    VStack(alignment: .leading, spacing: 2) {
                        HStack {
                            Text(record.performedAt.shortDate).font(.headline)
                            Spacer()
                            Text(record.cost.currency).monospacedDigit()
                        }
                        Text(record.description)
                        if let next = record.nextDueAt { Text("Next due \(next.shortDate)").font(.caption).foregroundStyle(.secondary) }
                    }
                }
            }
        }
        .navigationTitle(current.name)
        .toolbar {
            if session.can(.maintenanceManage) {
                Button { logging = true } label: { Label("Log Service", systemImage: "plus.circle") }
                Button("Edit") { editing = true }
            }
        }
        .task { await refresh() }
        .refreshable { await refresh() }
        .sheet(isPresented: $editing, onDismiss: { Task { await refresh() } }) { EquipmentEditor(equipment: current) }
        .sheet(isPresented: $logging, onDismiss: { Task { await refresh() } }) { MaintenanceForm(equipmentId: equipmentId) }
    }

    private func refresh() async {
        if let all: [Equipment] = try? await session.api.get("/admin/equipment") {
            item = all.first { $0.id == equipmentId }
        }
    }
}

struct EquipmentEditor: View {
    let equipment: Equipment?
    @EnvironmentObject private var session: Session
    @State private var name = ""
    @State private var kind = ""
    @State private var identifier = ""
    @State private var status = "active"
    @State private var notes = ""

    var body: some View {
        FormSheet(title: equipment == nil ? "New Equipment" : "Edit Equipment", canSave: name.nilIfBlank != nil) {
            let body: JSONValue = ["name": .string(name), "kind": .string(kind), "identifier": .string(identifier),
                                   "status": .string(status), "notes": .string(notes)]
            if let equipment { try await session.api.call(.put, "/admin/equipment/\(equipment.id)", body: body) }
            else { try await session.api.call(.post, "/admin/equipment", body: body) }
        } content: {
            TextField("Name (e.g. Paver #2)", text: $name)
            TextField("Type (paver, roller, dump truck…)", text: $kind)
            TextField("VIN / serial / unit #", text: $identifier)
            Picker("Status", selection: $status) {
                Text("Active").tag("active")
                Text("In Shop").tag("in_shop")
                Text("Retired").tag("retired")
            }
            TextField("Notes", text: $notes, axis: .vertical)
        }
        .onAppear {
            guard let equipment else { return }
            name = equipment.name; kind = equipment.kind ?? ""; identifier = equipment.identifier ?? ""
            status = equipment.status ?? "active"; notes = equipment.notes ?? ""
        }
    }
}

struct MaintenanceForm: View {
    let equipmentId: Int
    @EnvironmentObject private var session: Session
    @State private var description = ""
    @State private var cost: DecimalString = .zero
    @State private var performedAt = Date()
    @State private var hasNext = true
    @State private var nextDueAt = Date().addingTimeInterval(90 * 86_400)

    var body: some View {
        FormSheet(title: "Log Service", canSave: description.nilIfBlank != nil) {
            try await session.api.call(.post, "/admin/equipment/\(equipmentId)/maintenance", body: [
                "description": .string(description), "cost": .string(cost.moneyString),
                "performedAt": .day(performedAt), "nextDueAt": hasNext ? .day(nextDueAt) : .null,
            ])
        } content: {
            TextField("Work performed", text: $description, axis: .vertical).lineLimit(2...6)
            DecimalField(title: "Cost", value: $cost)
            DatePicker("Performed", selection: $performedAt, displayedComponents: .date)
            Toggle("Schedule next service", isOn: $hasNext)
            if hasNext { DatePicker("Next due", selection: $nextDueAt, displayedComponents: .date) }
        }
    }
}

// MARK: - Job postings

struct JobPostingsView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var editing: JobPosting? = nil
    @State private var creating = false

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/admin/job-postings") as [JobPosting] }) { postings in
            ListOrEmpty(items: postings, emptyTitle: "No job postings", emptySymbol: "megaphone") { posting in
                Button { editing = posting } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(posting.title).font(.headline)
                            Spacer()
                            StatusBadge(text: posting.isOpen ? "Open" : "Closed", color: posting.isOpen ? .green : .gray)
                        }
                        if let pay = posting.payRange { Text(pay).font(.subheadline) }
                    }
                }
                .foregroundStyle(.primary)
                .swipeActions {
                    Button("Delete", role: .destructive) {
                        Task { try? await session.api.call(.delete, "/admin/job-postings/\(posting.id)"); reload = UUID() }
                    }
                }
            }
        }
        .navigationTitle("Job Postings")
        .toolbar { Button { creating = true } label: { Image(systemName: "plus") } }
        .sheet(item: $editing, onDismiss: { reload = UUID() }) { JobPostingEditor(posting: $0) }
        .sheet(isPresented: $creating, onDismiss: { reload = UUID() }) { JobPostingEditor(posting: nil) }
    }
}

struct JobPostingEditor: View {
    let posting: JobPosting?
    @EnvironmentObject private var session: Session
    @State private var title = ""
    @State private var description = ""
    @State private var payRange = ""
    @State private var isOpen = true

    var body: some View {
        FormSheet(title: posting == nil ? "New Posting" : "Edit Posting", canSave: title.nilIfBlank != nil) {
            let body: JSONValue = ["title": .string(title), "description": .string(description),
                                   "payRange": .string(payRange), "isOpen": .bool(isOpen)]
            if let posting { try await session.api.call(.put, "/admin/job-postings/\(posting.id)", body: body) }
            else { try await session.api.call(.post, "/admin/job-postings", body: body) }
        } content: {
            TextField("Title", text: $title)
            TextField("Pay range (e.g. $20–$26/hr)", text: $payRange)
            TextField("Description", text: $description, axis: .vertical).lineLimit(4...12)
            Toggle("Accepting applications", isOn: $isOpen)
        }
        .onAppear {
            guard let posting else { return }
            title = posting.title; description = posting.description ?? ""; payRange = posting.payRange ?? ""; isOpen = posting.isOpen
        }
    }
}

// MARK: - Reviews moderation

struct ReviewsModerationView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var responding: Review? = nil

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/admin/reviews") as [Review] }) { reviews in
            ListOrEmpty(items: reviews, emptyTitle: "No reviews", emptySymbol: "star") { review in
                VStack(alignment: .leading) {
                    ReviewRow(review: review)
                    HStack {
                        StatusBadge(text: review.isPublished == true ? "Published" : "Hidden", color: review.isPublished == true ? .green : .gray)
                        Spacer()
                        Button("Respond") { responding = review }.buttonStyle(.borderless)
                        Button(review.isPublished == true ? "Hide" : "Publish") {
                            Task {
                                try? await session.api.call(.put, "/admin/reviews/\(review.id)", body: ["isPublished": .bool(!(review.isPublished ?? false))])
                                reload = UUID()
                            }
                        }
                        .buttonStyle(.borderless)
                    }
                }
            }
        }
        .navigationTitle("Review Moderation")
        .sheet(item: $responding, onDismiss: { reload = UUID() }) { ReviewResponseForm(review: $0) }
    }
}

struct ReviewResponseForm: View {
    let review: Review
    @EnvironmentObject private var session: Session
    @State private var response = ""

    var body: some View {
        FormSheet(title: "Respond", canSave: true) {
            try await session.api.call(.put, "/admin/reviews/\(review.id)", body: ["response": .optional(response)])
        } content: {
            ReviewRow(review: review)
            TextField("Public response", text: $response, axis: .vertical).lineLimit(3...8)
        }
        .onAppear { response = review.response ?? "" }
    }
}

// MARK: - Gallery / media moderation

struct MediaModerationView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        LoadableView(load: { try await session.api.get("/jobs") as [Job] }) { jobs in
            ListOrEmpty(items: jobs, emptyTitle: "No jobs", emptySymbol: "photo") { job in
                NavigationLink { JobMediaModerationView(jobId: job.id) } label: {
                    HStack {
                        JobRow(job: job)
                        if job.sharedPublicly == true { Image(systemName: "globe").foregroundStyle(.green) }
                    }
                }
            }
        }
        .navigationTitle("Gallery Moderation")
    }
}

struct JobMediaModerationView: View {
    let jobId: Int
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/jobs/\(jobId)/media") as [Media] }) { media in
            ListOrEmpty(items: media, emptyTitle: "No media", emptySymbol: "photo") { item in
                HStack(spacing: 12) {
                    MediaThumbnail(media: item).frame(width: 72)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.caption?.nilIfBlank ?? "No caption").font(.subheadline)
                        Text("\(item.uploadedBy?.name ?? "") · \(item.createdAt.shortDate)").font(.caption).foregroundStyle(.secondary)
                        Toggle("Public", isOn: Binding(get: { item.isPublic ?? false }, set: { value in
                            Task {
                                try? await session.api.call(.put, "/admin/media/\(item.id)", body: ["isPublic": .bool(value)])
                                reload = UUID()
                            }
                        }))
                        .font(.caption)
                    }
                }
                .swipeActions {
                    Button("Delete", role: .destructive) {
                        Task { try? await session.api.call(.delete, "/admin/media/\(item.id)"); reload = UUID() }
                    }
                }
            }
        }
        .navigationTitle("Job Media")
    }
}
