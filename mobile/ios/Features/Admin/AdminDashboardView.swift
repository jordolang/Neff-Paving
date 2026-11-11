import SwiftUI
import MapKit

struct AdminDashboardView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        LoadableView(load: { try await session.api.get("/admin/dashboard") as AdminDashboard }) { stats in
            List {
                Section {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        StatTile(title: "Active Jobs", value: "\(stats.activeJobs ?? 0)", symbol: "hammer.fill")
                        StatTile(title: "Clocked In", value: "\(stats.clockedIn ?? 0)", symbol: "person.badge.clock.fill")
                        StatTile(title: "Pending Estimates", value: "\(stats.pendingEstimates ?? 0)", symbol: "doc.text.fill")
                        StatTile(title: "Time Off Requests", value: "\(stats.pendingTimeOff ?? 0)", symbol: "beach.umbrella.fill")
                        StatTile(title: "Overdue Invoices", value: "\(stats.overdueInvoices ?? 0)", symbol: "exclamationmark.triangle.fill")
                        StatTile(title: "Revenue MTD", value: stats.revenueMtd?.currency ?? "$0.00", symbol: "dollarsign.circle.fill")
                    }
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }
                if session.can(.trackingViewLive) {
                    Section {
                        NavigationLink { LiveMapView() } label: { Label("Live Crew Map", systemImage: "map.fill").font(.headline) }
                    }
                }
                Section("Quick Actions") {
                    if session.can(.dispatchManage) { NavigationLink { DispatchView() } label: { Label("Dispatch a Crew", systemImage: "paperplane") } }
                    if session.can(.timeApprove) { NavigationLink { TimeApprovalsView() } label: { Label("Approve Time", systemImage: "checkmark.circle") } }
                    if session.can(.timeoffApprove) { NavigationLink { TimeOffApprovalsView() } label: { Label("Time Off Requests", systemImage: "calendar.badge.exclamationmark") } }
                    if session.can(.estimatesCreate) { NavigationLink { EstimatesManageView() } label: { Label("Estimates", systemImage: "doc.text") } }
                    if session.can(.invoicesManage) { NavigationLink { InvoicesAdminView() } label: { Label("Invoices", systemImage: "doc.richtext") } }
                    if session.can(.usersManage) { NavigationLink { UsersAdminView() } label: { Label("Users + Roles", systemImage: "person.badge.key") } }
                }
            }
        }
        .navigationTitle("Dashboard")
    }
}

struct StatTile: View {
    let title: String
    let value: String
    let symbol: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: symbol).foregroundStyle(Theme.current.primary)
            Text(value).font(.title2.bold()).monospacedDigit().minimumScaleFactor(0.6).lineLimit(1)
            Text(title).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

/// Live map of everyone currently clocked in. Refreshes every 15 s; tap a person to see today's trail.
struct LiveMapView: View {
    @EnvironmentObject private var session: Session
    @State private var people: [LiveLocation] = []
    @State private var selected: LiveLocation? = nil
    @State private var trail: [TrailPoint] = []
    @State private var position: MapCameraPosition = .automatic
    @State private var error: String? = nil
    @State private var lastRefresh: Date? = nil
    @State private var showList = false

    var body: some View {
        Map(position: $position, selection: Binding(get: { selected?.userId }, set: { id in select(people.first { $0.userId == id }) })) {
            ForEach(people) { person in
                Annotation(person.name, coordinate: CLLocationCoordinate2D(latitude: person.latitude, longitude: person.longitude)) {
                    AvatarView(url: person.avatarUrl, name: person.name, size: 36)
                        .overlay(Circle().stroke(person.userId == selected?.userId ? Theme.current.primary : .white, lineWidth: 3))
                        .shadow(radius: 3)
                }
                .tag(person.userId)
            }
            if trail.count > 1 {
                MapPolyline(coordinates: trail.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) })
                    .stroke(Theme.current.primary, lineWidth: 4)
            }
        }
        .mapControls {
            MapCompass()
            MapScaleView()
        }
        .safeAreaInset(edge: .bottom) {
            if let selected {
                LiveLocationCard(person: selected, trailPoints: trail.count) { self.selected = nil; trail = [] }
            } else {
                HStack {
                    Label("\(people.count) clocked in", systemImage: "person.2.fill")
                    Spacer()
                    if let lastRefresh { Text("Updated \(lastRefresh.timeOnly)").font(.caption).foregroundStyle(.secondary) }
                }
                .padding().background(.regularMaterial)
            }
        }
        .overlay(alignment: .top) {
            if let error { Text(error).font(.footnote).padding(8).background(.red.opacity(0.85), in: Capsule()).padding() }
        }
        .navigationTitle("Live Crew Map")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            Button { showList = true } label: { Image(systemName: "list.bullet") }
            Button { position = .automatic } label: { Image(systemName: "scope") }
        }
        .sheet(isPresented: $showList) {
            NavigationStack {
                List(people) { person in
                    Button {
                        showList = false
                        select(person)
                    } label: {
                        HStack {
                            AvatarView(url: person.avatarUrl, name: person.name, size: 32)
                            VStack(alignment: .leading) {
                                Text(person.name)
                                Text(person.currentJob?.title ?? person.role?.displayName ?? "").font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            if let at = person.recordedAt { Text(at.relative).font(.caption2).foregroundStyle(.secondary) }
                        }
                    }
                    .foregroundStyle(.primary)
                }
                .navigationTitle("Clocked In")
            }
            .presentationDetents([.medium, .large])
        }
        .task {
            while !Task.isCancelled {
                await refresh()
                try? await Task.sleep(nanoseconds: 15_000_000_000)
            }
        }
    }

    private func refresh() async {
        do {
            people = try await session.api.get("/admin/tracking/live")
            lastRefresh = Date()
            error = nil
            if let current = selected { selected = people.first { $0.userId == current.userId } }
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func select(_ person: LiveLocation?) {
        selected = person
        trail = []
        guard let person else { return }
        withAnimation {
            position = .region(MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: person.latitude, longitude: person.longitude),
                latitudinalMeters: 3000, longitudinalMeters: 3000))
        }
        Task {
            trail = (try? await session.api.get("/admin/tracking/\(person.userId)/trail",
                                                query: ["date": DateFormats.day(Date())]) as [TrailPoint]) ?? []
        }
    }
}

struct LiveLocationCard: View {
    let person: LiveLocation
    let trailPoints: Int
    let onClose: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                AvatarView(url: person.avatarUrl, name: person.name, size: 40)
                VStack(alignment: .leading) {
                    Text(person.name).font(.headline)
                    Text(person.role?.displayName ?? "").font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Button(action: onClose) { Image(systemName: "xmark.circle.fill").font(.title2) }.foregroundStyle(.secondary)
            }
            if let job = person.currentJob { Label(job.title, systemImage: "hammer") }
            HStack(spacing: 16) {
                if let since = person.clockedInAt { Label("In since \(since.timeOnly)", systemImage: "clock") }
                if let seen = person.recordedAt { Label(seen.relative, systemImage: "location") }
            }
            .font(.caption)
            HStack(spacing: 16) {
                if let speed = person.speed, speed > 0 { Label(String(format: "%.0f mph", speed * 2.23694), systemImage: "speedometer") }
                if let battery = person.batteryLevel { Label("\(Int(battery * 100))%", systemImage: "battery.75") }
                Label("\(trailPoints) trail points today", systemImage: "point.topleft.down.to.point.bottomright.curvepath")
            }
            .font(.caption).foregroundStyle(.secondary)
        }
        .padding()
        .background(.regularMaterial)
    }
}
