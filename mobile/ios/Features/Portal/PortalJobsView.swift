import SwiftUI

/// Customer job history.
struct PortalJobsView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        LoadableView(load: { try await session.api.get("/portal/jobs") as [Job] }) { jobs in
            ListOrEmpty(items: jobs, emptyTitle: "No projects yet", emptySymbol: "house",
                        emptyMessage: "Request an estimate to get started.") { job in
                NavigationLink { PortalJobDetailView(jobId: job.id) } label: { JobRow(job: job) }
            }
        }
        .navigationTitle("My Projects")
        .toolbar {
            if session.can(.estimatesRequest) {
                NavigationLink { EstimateRequestView() } label: { Label("Request Estimate", systemImage: "plus") }
            }
        }
    }
}

/// Customer view of one job: status, timeline, photos, sharing, review, contact.
struct PortalJobDetailView: View {
    let jobId: Int

    @EnvironmentObject private var session: Session
    @State private var reload = UUID()
    @State private var showReview = false

    private struct Payload {
        var job: Job
        var timeline: [StatusUpdate]
        var media: [Media]
    }

    var body: some View {
        LoadableView(id: reload, load: load) { payload in
            List {
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(payload.job.title).font(.title2.bold())
                        HStack {
                            StatusBadge(text: payload.job.status.displayName, color: payload.job.status.color)
                            if let crew = payload.job.crew { Text(crew.name).font(.caption).foregroundStyle(.secondary) }
                        }
                        if let progress = payload.job.progress {
                            ProgressView(value: Double(progress), total: 100) { Text("Progress \(progress)%").font(.caption) }
                        }
                        if let description = payload.job.description?.nilIfBlank { Text(description).foregroundStyle(.secondary) }
                    }
                    InfoRow(label: "Scheduled", value: scheduleText(payload.job), symbol: "calendar")
                    InfoRow(label: "Completed", value: payload.job.completedAt?.shortDate, symbol: "checkmark.seal")
                    InfoRow(label: "Estimate", value: payload.job.estimateTotal?.currency, symbol: "dollarsign")
                }

                if payload.job.serviceAddress != nil { JobLocationSection(job: payload.job) }

                Section("Project Timeline") { TimelineList(updates: payload.timeline) }

                Section {
                    if payload.media.isEmpty {
                        Text("Photos from your project will appear here.").foregroundStyle(.secondary)
                    } else {
                        MediaGrid(media: payload.media)
                    }
                    PendingUploadsBanner(jobId: jobId)
                    MediaCaptureMenu(endpoint: "/portal/jobs/\(jobId)/media", jobId: jobId, title: "Add My Photos")
                } header: { Text("Photos") }

                Section {
                    if session.can(.galleryPublish) {
                        Toggle("Share my project photos publicly", isOn: Binding(
                            get: { payload.job.sharedPublicly ?? false },
                            set: { share in Task { await setShared(share) } }))
                    }
                    if session.can(.reviewsWrite) && payload.job.status == .completed {
                        Button { showReview = true } label: { Label("Leave a Review", systemImage: "star.bubble") }
                    }
                    if session.can(.messagesSend) {
                        NavigationLink { NewThreadView(defaultSubject: "About: \(payload.job.title)", jobId: jobId) } label: {
                            Label("Message the Office", systemImage: "bubble.left")
                        }
                    }
                } footer: {
                    Text("Shared photos appear in the Project Gallery for other customers.")
                }
            }
            .sheet(isPresented: $showReview) { ReviewComposer(jobId: jobId) }
        }
        .navigationTitle("Project")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func load() async throws -> Payload {
        let api = session.api
        async let job: Job = api.get("/portal/jobs/\(jobId)")
        async let timeline: [StatusUpdate] = api.get("/portal/jobs/\(jobId)/timeline")
        async let media: [Media] = api.get("/portal/jobs/\(jobId)/media")
        return try await Payload(job: job, timeline: timeline, media: media)
    }

    private func setShared(_ share: Bool) async {
        try? await session.api.call(.post, "/portal/jobs/\(jobId)/share", body: ["share": .bool(share)])
        reload = UUID()
    }

    private func scheduleText(_ job: Job) -> String? {
        guard let start = job.scheduledStart else { return nil }
        guard let end = job.scheduledEnd else { return start.shortDate }
        return "\(start.shortDate) – \(end.shortDate)"
    }
}

struct ReviewComposer: View {
    let jobId: Int
    @EnvironmentObject private var session: Session
    @State private var rating = 5
    @State private var comment = ""

    var body: some View {
        FormSheet(title: "Leave a Review", saveTitle: "Submit", canSave: rating > 0) {
            let _: Review = try await session.api.post("/portal/jobs/\(jobId)/review",
                                                      body: ["rating": .int(rating), "comment": .string(comment)])
        } content: {
            Section("Rating") { StarRating(rating: $rating).font(.title) }
            Section("Comments") { TextField("How did we do?", text: $comment, axis: .vertical).lineLimit(4...10) }
        }
    }
}

/// Public gallery of projects other customers chose to share.
struct GalleryView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        LoadableView(load: { try await session.api.get("/gallery") as [GalleryItem] }) { items in
            if items.isEmpty {
                ContentUnavailableView("No shared projects yet", systemImage: "photo.on.rectangle")
            } else {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 20) {
                        ForEach(items) { item in
                            VStack(alignment: .leading, spacing: 8) {
                                Text(item.jobTitle ?? "Project").font(.headline)
                                Text([item.customerName, item.city].compactMap { $0 }.joined(separator: " · "))
                                    .font(.caption).foregroundStyle(.secondary)
                                MediaGrid(media: item.media)
                                if let review = item.review {
                                    HStack { StarRating(rating: .constant(review.rating), editable: false) }
                                    if let comment = review.comment { Text("“\(comment)”").italic() }
                                }
                            }
                            .padding().background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Project Gallery")
    }
}

struct ReviewsView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        LoadableView(load: { try await session.api.get("/reviews") as [Review] }) { reviews in
            ListOrEmpty(items: reviews, emptyTitle: "No reviews yet", emptySymbol: "star") { review in
                ReviewRow(review: review)
            }
        }
        .navigationTitle("Reviews")
    }
}

struct ReviewRow: View {
    let review: Review
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                StarRating(rating: .constant(review.rating), editable: false).font(.caption)
                Spacer()
                if let date = review.createdAt { Text(date.shortDate).font(.caption).foregroundStyle(.secondary) }
            }
            if let comment = review.comment?.nilIfBlank { Text(comment) }
            if let name = review.customer?.name { Text("— \(name)").font(.caption).foregroundStyle(.secondary) }
            if let response = review.response?.nilIfBlank {
                Text("Response: \(response)").font(.callout).padding(8)
                    .background(Theme.current.primary.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
            }
        }
    }
}
