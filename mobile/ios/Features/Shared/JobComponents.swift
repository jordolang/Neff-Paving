import SwiftUI
import MapKit

struct JobRow: View {
    let job: Job

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: job.coverPhotoUrl) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Image(systemName: "road.lanes").foregroundStyle(job.status.color)
            }
            .frame(width: 54, height: 54)
            .background(job.status.color.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 4) {
                Text(job.title).font(.headline)
                if let address = job.serviceAddress?.formatted.nilIfBlank {
                    Text(address).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                }
                HStack {
                    StatusBadge(text: job.status.displayName, color: job.status.color)
                    if let start = job.scheduledStart { Text(start.shortDate).font(.caption).foregroundStyle(.secondary) }
                }
            }
            Spacer(minLength: 0)
            if let progress = job.progress, job.status == .inProgress {
                Gauge(value: Double(progress), in: 0...100) { EmptyView() } currentValueLabel: { Text("\(progress)%") }
                    .gaugeStyle(.accessoryCircularCapacity).tint(Theme.current.primary).scaleEffect(0.7)
            }
        }
    }
}

/// Status updates newest-first, with attached media.
struct TimelineList: View {
    let updates: [StatusUpdate]
    var showVisibility = false

    var body: some View {
        if updates.isEmpty {
            Text("No updates yet.").foregroundStyle(.secondary)
        } else {
            ForEach(updates) { update in
                HStack(alignment: .top, spacing: 12) {
                    Circle().fill(update.status.color).frame(width: 10, height: 10).padding(.top, 6)
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            StatusBadge(text: update.status.displayName, color: update.status.color)
                            if showVisibility, update.visibleToCustomer == false {
                                StatusBadge(text: "Internal", color: .gray)
                            }
                            Spacer()
                            if let date = update.createdAt { Text(date.relative).font(.caption).foregroundStyle(.secondary) }
                        }
                        if let message = update.message?.nilIfBlank { Text(message) }
                        if let author = update.author {
                            Text("— \(author.name)\(author.role.map { ", \($0.displayName)" } ?? "")")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                        if let media = update.media, !media.isEmpty { MediaGrid(media: media) }
                    }
                }
                .padding(.vertical, 4)
            }
        }
    }
}

/// Small map of the service address with Navigate (Apple/Google) buttons.
struct JobLocationSection: View {
    let job: Job
    @State private var coordinate: CLLocationCoordinate2D? = nil
    @State private var position: MapCameraPosition = .automatic

    var body: some View {
        Section("Service Address") {
            if let address = job.serviceAddress?.formatted.nilIfBlank {
                Text(address).textSelection(.enabled)
            }
            if let coordinate {
                Map(position: $position) {
                    Marker(job.title, systemImage: "mappin", coordinate: coordinate).tint(Theme.current.primary)
                    UserAnnotation()
                }
                .frame(height: 180)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .listRowInsets(EdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8))
            }
            HStack {
                Button { NavigationHandoff.navigate(to: job, using: .apple) } label: {
                    Label("Apple Maps", systemImage: "car.fill")
                }
                Spacer()
                Button { NavigationHandoff.navigate(to: job, using: .google) } label: {
                    Label("Google Maps", systemImage: "location.north.line.fill")
                }
            }
            .buttonStyle(.borderless)
        }
        .task(id: job.id) {
            coordinate = await NavigationHandoff.coordinate(for: job)
            if let coordinate {
                position = .region(MKCoordinateRegion(center: coordinate, latitudinalMeters: 600, longitudinalMeters: 600))
            }
        }
    }
}

/// Full-screen map + navigation for a job ("Navigation Map for each account").
struct JobMapView: View {
    let job: Job
    @State private var coordinate: CLLocationCoordinate2D? = nil
    @State private var position: MapCameraPosition = .userLocation(fallback: .automatic)

    var body: some View {
        Map(position: $position) {
            if let coordinate { Marker(job.title, systemImage: "mappin", coordinate: coordinate).tint(Theme.current.primary) }
            UserAnnotation()
        }
        .mapControls {
            MapUserLocationButton()
            MapCompass()
        }
        .safeAreaInset(edge: .bottom) {
            VStack(alignment: .leading, spacing: 8) {
                Text(job.title).font(.headline)
                Text(job.serviceAddress?.formatted ?? "").font(.subheadline).foregroundStyle(.secondary)
                HStack {
                    Button { NavigationHandoff.navigate(to: job, using: .apple) } label: {
                        Label("Navigate", systemImage: "arrow.triangle.turn.up.right.diamond.fill").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    Button { NavigationHandoff.navigate(to: job, using: .google) } label: {
                        Text("Google Maps").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding().background(.regularMaterial)
        }
        .navigationTitle("Directions")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            coordinate = await NavigationHandoff.coordinate(for: job)
            if let coordinate {
                position = .region(MKCoordinateRegion(center: coordinate, latitudinalMeters: 2000, longitudinalMeters: 2000))
            }
        }
    }
}

/// Address editor used by estimate requests and job forms.
struct AddressFields: View {
    @Binding var address: Address

    var body: some View {
        TextField("Street", text: binding(\.line1))
        TextField("Apt / Suite", text: binding(\.line2))
        TextField("City", text: binding(\.city))
        HStack {
            TextField("State", text: binding(\.state)).frame(maxWidth: 80)
            TextField("ZIP", text: binding(\.zip)).keyboardType(.numberPad)
        }
    }

    private func binding(_ keyPath: WritableKeyPath<Address, String?>) -> Binding<String> {
        Binding(get: { address[keyPath: keyPath] ?? "" }, set: { address[keyPath: keyPath] = $0 })
    }
}

/// Editable list of estimate/invoice line items with a running total.
struct LineItemsEditor: View {
    @Binding var items: [LineItem]

    var body: some View {
        ForEach($items) { $item in
            VStack(alignment: .leading) {
                TextField("Description", text: $item.description)
                HStack {
                    DecimalField(title: "Qty", value: $item.quantity).frame(maxWidth: 70)
                    Text("×")
                    DecimalField(title: "Unit price", value: $item.unitPrice)
                    Spacer()
                    Text(item.computedTotal.currency).monospacedDigit()
                }
                .font(.subheadline)
            }
        }
        .onDelete { items.remove(atOffsets: $0) }
        Button { items.append(LineItem()) } label: { Label("Add line item", systemImage: "plus.circle") }
        LabeledContent("Total") { Text(items.map(\.computedTotal).sum.currency).bold().monospacedDigit() }
    }
}
