import SwiftUI
import PhotosUI

/// Customer estimates: list, request + submission, accept/decline.
struct PortalEstimatesView: View {
    @EnvironmentObject private var session: Session
    @State private var reload = UUID()

    var body: some View {
        LoadableView(id: reload, load: { try await session.api.get("/portal/estimates") as [Estimate] }) { estimates in
            ListOrEmpty(items: estimates, emptyTitle: "No estimates", emptySymbol: "doc.text",
                        emptyMessage: "Tap + to request a free estimate.") { estimate in
                NavigationLink { PortalEstimateDetailView(estimate: estimate) { reload = UUID() } } label: {
                    EstimateRow(estimate: estimate)
                }
            }
        }
        .navigationTitle("Estimates")
        .toolbar {
            if session.can(.estimatesRequest) {
                NavigationLink { EstimateRequestView { reload = UUID() } } label: { Image(systemName: "plus") }
            }
        }
    }
}

struct EstimateRow: View {
    let estimate: Estimate
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(estimate.serviceType ?? "Estimate").font(.headline)
                Spacer()
                if let total = estimate.total { Text(total.currency).monospacedDigit() }
            }
            if let name = estimate.customerName { Text(name).font(.subheadline) }
            HStack {
                StatusBadge(text: estimate.status.displayName, color: estimate.status.color)
                if let created = estimate.createdAt { Text(created.shortDate).font(.caption).foregroundStyle(.secondary) }
            }
        }
    }
}

struct PortalEstimateDetailView: View {
    @State var estimate: Estimate
    var onChange: () -> Void = {}
    @EnvironmentObject private var session: Session

    var body: some View {
        List {
            Section {
                EstimateRow(estimate: estimate)
                InfoRow(label: "Address", value: estimate.serviceAddress?.formatted, symbol: "mappin")
                InfoRow(label: "Square feet", value: estimate.squareFeet?.plainString, symbol: "square.dashed")
                InfoRow(label: "Valid until", value: estimate.validUntil?.shortDate, symbol: "calendar")
                InfoRow(label: "Estimator", value: estimate.estimator?.name, symbol: "person")
            }
            if let description = estimate.description?.nilIfBlank { Section("Details") { Text(description) } }
            if let items = estimate.lineItems, !items.isEmpty {
                Section("Line Items") {
                    ForEach(items) { item in
                        LabeledContent(item.description) {
                            Text((item.total ?? item.computedTotal).currency).monospacedDigit()
                        }
                    }
                    LabeledContent("Total") { Text(estimate.total.currency).bold() }
                }
            }
            if let notes = estimate.notes?.nilIfBlank { Section("Notes") { Text(notes) } }
            if let media = estimate.media, !media.isEmpty { Section("Photos") { MediaGrid(media: media) } }
            if estimate.status == .requested || estimate.status == .inReview {
                Section {
                    MediaCaptureMenu(endpoint: "/portal/estimates/\(estimate.id)/photos", jobId: nil,
                                     allowsVideo: false, title: "Add Photos of the Area")
                }
            }
            if estimate.status == .sent {
                Section {
                    AsyncButton("Accept Estimate") { try await respond("accept") }
                    AsyncButton("Decline", role: .destructive) { try await respond("decline") }
                } footer: {
                    Text("Accepting lets the office schedule your project.")
                }
            }
        }
        .navigationTitle("Estimate")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func respond(_ action: String) async throws {
        estimate = try await session.api.post("/portal/estimates/\(estimate.id)/\(action)")
        onChange()
    }
}

/// Estimate request + submission with optional photos.
struct EstimateRequestView: View {
    var onSubmitted: () -> Void = {}

    @EnvironmentObject private var session: Session
    @Environment(\.dismiss) private var dismiss
    @State private var serviceType = "Asphalt Paving"
    @State private var description = ""
    @State private var address = Address()
    @State private var squareFeet = ""
    @State private var preferredDate = Date().addingTimeInterval(7 * 86_400)
    @State private var hasPreferredDate = false
    @State private var photoItems: [PhotosPickerItem] = []
    @State private var error: String? = nil
    @State private var submitting = false

    static let services = ["Asphalt Paving", "Sealcoating", "Crack Filling", "Patching / Repair", "Concrete",
                           "Line Striping", "Driveway", "Parking Lot", "Gravel / Stone Delivery", "Hauling", "Other"]

    var body: some View {
        Form {
            Section("Service") {
                Picker("Service", selection: $serviceType) { ForEach(Self.services, id: \.self) { Text($0) } }
                TextField("Describe the work", text: $description, axis: .vertical).lineLimit(3...8)
                TextField("Approx. square feet (optional)", text: $squareFeet).keyboardType(.decimalPad)
                Toggle("Preferred date", isOn: $hasPreferredDate)
                if hasPreferredDate { DatePicker("Date", selection: $preferredDate, in: Date()..., displayedComponents: .date) }
            }
            Section("Service Address") {
                AddressFields(address: $address)
                if let home = session.user?.address, !home.isEmpty {
                    Button("Use my profile address") { address = home }
                }
            }
            Section("Photos") {
                PhotosPicker(selection: $photoItems, maxSelectionCount: 10, matching: .images) {
                    Label(photoItems.isEmpty ? "Add photos" : "\(photoItems.count) photo(s) selected", systemImage: "photo")
                }
            }
            if let error { Section { Text(error).foregroundStyle(.red) } }
            Section {
                Button(action: submit) {
                    HStack {
                        if submitting { ProgressView() }
                        Text("Submit Request").bold()
                    }
                    .frame(maxWidth: .infinity)
                }
                .disabled(submitting || description.nilIfBlank == nil || address.line1?.nilIfBlank == nil)
            }
        }
        .navigationTitle("Request Estimate")
        .onAppear { if address.isEmpty, let home = session.user?.address { address = home } }
    }

    private func submit() {
        submitting = true
        error = nil
        Task {
            defer { submitting = false }
            do {
                let estimate: Estimate = try await session.api.post("/portal/estimates", body: [
                    "serviceType": .string(serviceType), "description": .string(description),
                    "serviceAddress": address.json,
                    "squareFeet": .optional(DecimalString(string: squareFeet)?.plainString),
                    "preferredDate": hasPreferredDate ? .day(preferredDate) : .null,
                ])
                for item in photoItems {
                    if let file = try? await MediaFiles.file(from: item) {
                        try? MediaUploader.shared.enqueue(fileURL: file, endpoint: "/portal/estimates/\(estimate.id)/photos", jobId: nil)
                        try? FileManager.default.removeItem(at: file)
                    }
                }
                onSubmitted()
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
        }
    }
}
