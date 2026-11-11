import SwiftUI
import CoreLocation

/// Clock in/out with the tracking disclosure (contract "Location tracking rules" 1–2).
struct ClockView: View {
    @EnvironmentObject private var session: Session
    @EnvironmentObject private var tracker: LocationTracker
    @State private var showDisclosure = false
    @State private var selectedJobId: Int? = nil
    @State private var jobs: [Job] = []
    @State private var notes = ""
    @State private var now = Date()

    private let ticker = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        List {
            Section {
                VStack(spacing: 12) {
                    Image(systemName: session.isClockedIn ? "clock.badge.checkmark.fill" : "clock")
                        .font(.system(size: 56))
                        .foregroundStyle(session.isClockedIn ? .green : .secondary)
                    Text(session.isClockedIn ? "Clocked In" : "Clocked Out").font(.title.bold())
                    if let entry = session.clock?.entry, session.isClockedIn {
                        Text("Since \(entry.clockIn.timeOnly)").foregroundStyle(.secondary)
                        Text(elapsed(since: entry.clockIn)).font(.system(.largeTitle, design: .monospaced))
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical)
            }

            if session.isClockedIn {
                Section {
                    Label(tracker.isTracking ? "Location shared with owners while clocked in" : "Starting location sharing…",
                          systemImage: tracker.isTracking ? "location.fill" : "location.slash")
                        .foregroundStyle(tracker.isTracking ? .green : .orange)
                    if tracker.authorization != .authorizedAlways {
                        Button("Allow “Always” location so tracking continues in the background") {
                            if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
                        }
                        .font(.footnote)
                    }
                    if tracker.pendingCount > 0 {
                        Text("\(tracker.pendingCount) location point(s) waiting to upload").font(.caption).foregroundStyle(.secondary)
                    }
                }
                if let jobId = session.activeJobId {
                    Section("Active Job") {
                        NavigationLink("Open active job") { JobDetailView(jobId: jobId) }
                        MediaCaptureMenu(endpoint: "/jobs/\(jobId)/media", jobId: jobId)
                    }
                }
                Section("Clock Out") {
                    TextField("Notes for your time sheet (optional)", text: $notes, axis: .vertical)
                    AsyncButton(role: .destructive) {
                        try await session.clockOut(notes: notes.nilIfBlank)
                        notes = ""
                    } label: {
                        Label("Clock Out", systemImage: "stop.circle.fill").frame(maxWidth: .infinity)
                    }
                }
            } else {
                Section("Job (optional)") {
                    Picker("Job", selection: $selectedJobId) {
                        Text("No specific job").tag(Int?.none)
                        ForEach(jobs) { Text($0.title).tag(Int?.some($0.id)) }
                    }
                }
                Section {
                    AsyncButton {
                        if session.hasAcceptedTrackingDisclosure {
                            try await clockIn()
                        } else {
                            showDisclosure = true
                        }
                    } label: {
                        Label("Clock In", systemImage: "play.circle.fill").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                } footer: {
                    Text("While you are clocked in, \(AppConfig.current.displayName) owners can see your location. Tracking stops when you clock out.")
                }
            }

            Section {
                NavigationLink { TimesheetView() } label: { Label("My Time Sheets", systemImage: "list.bullet.clipboard") }
            }
        }
        .navigationTitle("Time Clock")
        .onReceive(ticker) { now = $0 }
        .task {
            await session.refreshClock()
            if session.permissions.canSeeJobs {
                jobs = (try? await session.api.get("/jobs", query: ["mine": "1"]) as [Job]) ?? []
            }
        }
        .refreshable { await session.refreshClock() }
        .sheet(isPresented: $showDisclosure) {
            TrackingDisclosureSheet {
                session.hasAcceptedTrackingDisclosure = true
                try await clockIn()
            }
        }
    }

    private func clockIn() async throws {
        tracker.requestPermission()
        try await session.clockIn(jobId: selectedJobId)
    }

    private func elapsed(since start: Date) -> String {
        let seconds = max(0, Int(now.timeIntervalSince(start)))
        return String(format: "%d:%02d:%02d", seconds / 3600, (seconds % 3600) / 60, seconds % 60)
    }
}

/// Plain-language disclosure shown before the first clock-in (contract rule 2).
struct TrackingDisclosureSheet: View {
    let onAccept: () async throws -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Image(systemName: "location.circle.fill").font(.system(size: 64)).foregroundStyle(Theme.current.primary)
                    Text("Location sharing while on the clock").font(.title2.bold())
                    Text("While you are clocked in, \(AppConfig.current.displayName) owners can see your location. Tracking stops when you clock out.")
                    VStack(alignment: .leading, spacing: 10) {
                        Label("Only while clocked in — never on your own time.", systemImage: "clock")
                        Label("Used to dispatch crews and verify job-site time.", systemImage: "truck.box")
                        Label("You'll see a blue location indicator while it's active.", systemImage: "location.fill")
                        Label("Choose “Always Allow” so tracking works with the app in the background.", systemImage: "iphone")
                    }
                    .font(.callout)
                }
                .padding()
            }
            .safeAreaInset(edge: .bottom) {
                VStack(spacing: 8) {
                    AsyncButton {
                        try await onAccept()
                        dismiss()
                    } label: {
                        Text("I Understand — Clock In").bold().frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    Button("Not Now") { dismiss() }
                }
                .padding()
                .background(.bar)
            }
            .interactiveDismissDisabled()
        }
    }
}
