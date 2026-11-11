import SwiftUI

/// Jobs for crew leads / estimators / office / admins (assigned or all).
struct JobsListView: View {
    @EnvironmentObject private var session: Session
    @State private var scope: Scope = .mine
    @State private var status: JobStatus? = nil
    @State private var search = ""
    @State private var reload = UUID()
    @State private var creating = false

    enum Scope: String, CaseIterable, Identifiable { case mine = "My Jobs", all = "All Jobs"; var id: String { rawValue } }

    var body: some View {
        LoadableView(id: "\(scope)\(status?.rawValue ?? "")\(reload)", load: { () async throws -> [Job] in
            var query: [String: String?] = ["status": status?.rawValue]
            if scope == .mine || !session.can(.jobsViewAll) { query["mine"] = "1" }
            return try await session.api.get("/jobs", query: query) as [Job]
        }) { jobs in
            let filtered = search.isEmpty ? jobs : jobs.filter {
                $0.title.localizedCaseInsensitiveContains(search)
                    || ($0.customer?.name.localizedCaseInsensitiveContains(search) ?? false)
                    || ($0.serviceAddress?.formatted.localizedCaseInsensitiveContains(search) ?? false)
            }
            ListOrEmpty(items: filtered, emptyTitle: "No jobs", emptySymbol: "hammer") { job in
                NavigationLink { JobDetailView(jobId: job.id) } label: { JobRow(job: job) }
            }
            .searchable(text: $search, prompt: "Job, customer or address")
        }
        .navigationTitle("Jobs")
        .safeAreaInset(edge: .top) {
            VStack(spacing: 6) {
                if session.can(.jobsViewAll) {
                    Picker("Scope", selection: $scope) { ForEach(Scope.allCases) { Text($0.rawValue).tag($0) } }
                        .pickerStyle(.segmented)
                }
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        filterChip("All", selected: status == nil) { status = nil }
                        ForEach(JobStatus.allCases) { s in filterChip(s.displayName, selected: status == s) { status = s } }
                    }
                }
            }
            .padding(.horizontal).padding(.bottom, 6).background(.bar)
        }
        .toolbar {
            if session.can(.jobsManage) { Button { creating = true } label: { Image(systemName: "plus") } }
        }
        .sheet(isPresented: $creating, onDismiss: { reload = UUID() }) { JobEditor(job: nil) { _ in } }
    }

    private func filterChip(_ title: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(selected ? Theme.current.primary : Color.secondary.opacity(0.15), in: Capsule())
            .foregroundStyle(selected ? Theme.current.onPrimary : .primary)
    }
}

/// Field view of a job: customer data + contact, map/navigation, status updates, logs, media.
struct JobDetailView: View {
    let jobId: Int

    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var sheet: SheetKind? = nil

    enum SheetKind: Identifiable { case status, edit, log; var id: Self { self } }

    private struct Payload {
        var job: Job
        var timeline: [StatusUpdate]
        var media: [Media]
        var logs: [JobLog]
    }

    var body: some View {
        LoadableView(id: reload, load: load) { payload in
            let job = payload.job
            List {
                Section {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(job.title).font(.title2.bold())
                        HStack {
                            StatusBadge(text: job.status.displayName, color: job.status.color)
                            if let crew = job.crew { StatusBadge(text: crew.name, color: .blue) }
                        }
                        if let progress = job.progress { ProgressView(value: Double(progress), total: 100) }
                        if let description = job.description?.nilIfBlank { Text(description).foregroundStyle(.secondary) }
                    }
                    InfoRow(label: "Start", value: job.scheduledStart?.shortDateTime, symbol: "calendar")
                    InfoRow(label: "End", value: job.scheduledEnd?.shortDateTime, symbol: "calendar.badge.clock")
                    InfoRow(label: "Estimate", value: job.estimateTotal?.currency, symbol: "dollarsign")
                }

                if let customer = job.customer, session.can(.customersView) {
                    Section("Customer") {
                        if session.can(.customersView) {
                            NavigationLink { CustomerDetailView(customerId: customer.id) } label: { Text(customer.name).font(.headline) }
                        }
                        InfoRow(label: "Phone", value: customer.phone)
                        InfoRow(label: "Email", value: customer.email)
                        if session.can(.customersContact) { ContactButtons(phone: customer.phone, email: customer.email) }
                    }
                }

                JobLocationSection(job: job)
                Section { NavigationLink { JobMapView(job: job) } label: { Label("Open Navigation Map", systemImage: "map") } }

                Section {
                    if session.can(.jobsStatusUpdate) {
                        Button { sheet = .status } label: { Label("Post Status Update", systemImage: "megaphone") }
                    }
                    if session.can(.jobsEdit) {
                        Button { sheet = .edit } label: { Label("Edit Job Details", systemImage: "pencil") }
                    }
                    if session.can(.jobsMediaUpload) {
                        MediaCaptureMenu(endpoint: "/jobs/\(jobId)/media", jobId: jobId)
                        PendingUploadsBanner(jobId: jobId)
                    }
                } header: { Text("Actions") }

                Section("Timeline") { TimelineList(updates: payload.timeline, showVisibility: true) }

                Section {
                    if payload.media.isEmpty { Text("No photos or videos yet.").foregroundStyle(.secondary) }
                    else { MediaGrid(media: payload.media) }
                    if session.can(.galleryManage) {
                        NavigationLink("Moderate media") { JobMediaModerationView(jobId: jobId) }
                    }
                } header: { Text("Photos + Video (\(payload.media.count))") }

                if session.can(.joblogsView) {
                    Section {
                        ForEach(payload.logs) { log in JobLogRow(log: log) }
                        if payload.logs.isEmpty { Text("No logs yet.").foregroundStyle(.secondary) }
                        if session.can(.joblogsEdit) {
                            Button { sheet = .log } label: { Label("Add Daily Log", systemImage: "square.and.pencil") }
                        }
                    } header: { Text("Job Logs") }
                }
            }
            .sheet(item: $sheet, onDismiss: { reload = UUID() }) { kind in
                switch kind {
                case .status: StatusUpdateComposer(job: job)
                case .edit: JobEditor(job: job) { _ in }
                case .log: JobLogEditor(jobId: jobId)
                }
            }
        }
        .navigationTitle("Job")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func load() async throws -> Payload {
        let api = session.api
        let canViewLogs = session.can(.joblogsView)
        async let job: Job = api.get("/jobs/\(jobId)")
        async let timeline: [StatusUpdate] = api.get("/jobs/\(jobId)/timeline")
        async let media: [Media] = api.get("/jobs/\(jobId)/media")
        let logs: [JobLog] = canViewLogs ? ((try? await api.get("/jobs/\(jobId)/logs")) ?? []) : []
        return try await Payload(job: job, timeline: timeline, media: media, logs: logs)
    }
}

struct JobLogRow: View {
    let log: JobLog
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(log.date.shortDate).font(.headline)
                Spacer()
                if let hours = log.hours { Text("\(hours.twoDecimals) h").monospacedDigit() }
            }
            if let notes = log.notes?.nilIfBlank { Text(notes) }
            if let materials = log.materials?.nilIfBlank { Label(materials, systemImage: "shippingbox").font(.caption) }
            if let weather = log.weather?.nilIfBlank { Label(weather, systemImage: "cloud.sun").font(.caption) }
            if let author = log.author { Text("— \(author.name)").font(.caption).foregroundStyle(.secondary) }
        }
    }
}

/// Publish a status update; `completed` notifies the customer and owners server-side.
struct StatusUpdateComposer: View {
    let job: Job
    @EnvironmentObject private var session: Session
    @State private var status: JobStatus = .inProgress
    @State private var message = ""
    @State private var visibleToCustomer = true

    var body: some View {
        FormSheet(title: "Status Update", saveTitle: "Publish", canSave: message.nilIfBlank != nil || status != job.status) {
            let update: StatusUpdate = try await session.api.post("/jobs/\(job.id)/status", body: [
                "status": .string(status.rawValue), "message": .string(message), "visibleToCustomer": .bool(visibleToCustomer),
            ])
            _ = update
        } content: {
            Picker("Status", selection: $status) { ForEach(JobStatus.allCases) { Text($0.displayName).tag($0) } }
            TextField("What's happening on the job?", text: $message, axis: .vertical).lineLimit(3...8)
            Toggle("Visible to customer", isOn: $visibleToCustomer)
            if status == .completed {
                Label("Marking complete notifies the customer and the owners.", systemImage: "bell.badge").font(.footnote)
            }
        }
        .onAppear { status = job.status }
    }
}

/// Create (`jobs.manage`) or edit (`jobs.edit`) a job.
struct JobEditor: View {
    let job: Job?
    let onSaved: (Job) -> Void

    @EnvironmentObject private var session: Session
    @State private var title = ""
    @State private var description = ""
    @State private var address = Address()
    @State private var customerId: Int? = nil
    @State private var crewId: Int? = nil
    @State private var hasSchedule = false
    @State private var start = Date()
    @State private var end = Date().addingTimeInterval(8 * 3600)
    @State private var estimate: DecimalString = .zero
    @State private var progress = 0.0
    @State private var customers: [CustomerSummary] = []
    @State private var crews: [Crew] = []
    @State private var loaded = false

    var body: some View {
        FormSheet(title: job == nil ? "New Job" : "Edit Job", canSave: title.nilIfBlank != nil && (job != nil || customerId != nil)) {
            var body: [String: JSONValue] = [
                "title": .string(title), "description": .string(description), "serviceAddress": address.json,
                "crewId": .optional(crewId), "estimateTotal": .string(estimate.moneyString), "progress": .int(Int(progress)),
                "scheduledStart": hasSchedule ? .date(start) : .null, "scheduledEnd": hasSchedule ? .date(end) : .null,
            ]
            let saved: Job
            if let job {
                saved = try await session.api.put("/jobs/\(job.id)", body: .object(body))
            } else {
                body["customerId"] = .optional(customerId)
                saved = try await session.api.post("/jobs", body: .object(body))
            }
            onSaved(saved)
        } content: {
            Section("Job") {
                TextField("Title", text: $title)
                TextField("Description", text: $description, axis: .vertical).lineLimit(2...6)
                if loaded { DecimalField(title: "Estimate total", value: $estimate) }
                if job != nil {
                    VStack(alignment: .leading) {
                        Text("Progress \(Int(progress))%")
                        Slider(value: $progress, in: 0...100, step: 5)
                    }
                }
            }
            if job == nil {
                Section("Customer") {
                    Picker("Customer", selection: $customerId) {
                        Text("Select…").tag(Int?.none)
                        ForEach(customers) { Text($0.displayName).tag(Int?.some($0.id)) }
                    }
                }
            }
            Section("Crew") {
                Picker("Crew", selection: $crewId) {
                    Text("Unassigned").tag(Int?.none)
                    ForEach(crews) { Text($0.name).tag(Int?.some($0.id)) }
                }
            }
            Section("Schedule") {
                Toggle("Scheduled", isOn: $hasSchedule)
                if hasSchedule {
                    DatePicker("Start", selection: $start)
                    DatePicker("End", selection: $end, in: start...)
                }
            }
            Section("Service Address") { AddressFields(address: $address) }
        }
        .task {
            if let job {
                title = job.title
                description = job.description ?? ""
                address = job.serviceAddress ?? Address()
                crewId = job.crew?.id
                estimate = job.estimateTotal ?? .zero
                progress = Double(job.progress ?? 0)
                if let s = job.scheduledStart { hasSchedule = true; start = s; end = job.scheduledEnd ?? s.addingTimeInterval(8 * 3600) }
            }
            loaded = true
            crews = (try? await session.api.get("/crews") as [Crew]) ?? []
            if job == nil, session.can(.customersView) {
                customers = (try? await session.api.get("/customers") as [CustomerSummary]) ?? []
            }
        }
    }
}

struct JobLogEditor: View {
    let jobId: Int
    @EnvironmentObject private var session: Session
    @State private var date = Date()
    @State private var notes = ""
    @State private var hours: DecimalString = 8
    @State private var materials = ""
    @State private var weather = ""

    var body: some View {
        FormSheet(title: "Daily Log", canSave: notes.nilIfBlank != nil) {
            let _: JobLog = try await session.api.post("/jobs/\(jobId)/logs", body: [
                "date": .day(date), "notes": .string(notes), "hours": .string(hours.plainString),
                "materials": .string(materials), "weather": .string(weather),
            ])
        } content: {
            DatePicker("Date", selection: $date, displayedComponents: .date)
            TextField("Work performed", text: $notes, axis: .vertical).lineLimit(3...10)
            DecimalField(title: "Crew hours", value: $hours)
            TextField("Materials used (e.g. 12 tons 304)", text: $materials)
            TextField("Weather", text: $weather)
        }
    }
}
