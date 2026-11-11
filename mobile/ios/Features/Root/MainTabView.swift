import SwiftUI

/// Tabs built from the signed-in user's permissions. Every user lands on Profile first.
struct MainTabView: View {
    enum Tab: Hashable { case profile, admin, clock, jobs, projects, estimates, billing, schedule, more }

    @EnvironmentObject private var session: Session
    @EnvironmentObject private var push: PushNotifications
    @State private var selection: Tab = .profile

    var body: some View {
        let p = session.permissions
        TabView(selection: $selection) {
            NavigationStack { ProfileView() }
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }.tag(Tab.profile)

            if p.isAdminArea {
                NavigationStack { AdminDashboardView() }
                    .tabItem { Label("Admin", systemImage: "chart.bar.doc.horizontal") }.tag(Tab.admin)
            }
            if p.has(.timeClock) {
                NavigationStack { ClockView() }
                    .tabItem { Label("Clock", systemImage: "clock.badge.checkmark") }.tag(Tab.clock)
            }
            if p.canSeeJobs {
                NavigationStack { JobsListView() }
                    .tabItem { Label("Jobs", systemImage: "hammer") }.tag(Tab.jobs)
            }
            if p.has(.portalUse) && !session.isInternal {
                NavigationStack { PortalJobsView() }
                    .tabItem { Label("Projects", systemImage: "house.and.flag") }.tag(Tab.projects)
                NavigationStack { PortalEstimatesView() }
                    .tabItem { Label("Estimates", systemImage: "doc.text.magnifyingglass") }.tag(Tab.estimates)
                NavigationStack { BillingView() }
                    .tabItem { Label("Billing", systemImage: "creditcard") }.tag(Tab.billing)
            }
            if p.has(.scheduleView) && !p.isAdminArea {
                NavigationStack { MyScheduleView() }
                    .tabItem { Label("Schedule", systemImage: "calendar") }.tag(Tab.schedule)
            }
            NavigationStack { MoreMenuView() }
                .tabItem { Label("More", systemImage: "ellipsis.circle") }.tag(Tab.more)
        }
        .overlay(alignment: .top) { OfflineBanner() }
        .sheet(item: Binding(get: { push.openedJobId.map(JobLink.init) }, set: { push.openedJobId = $0?.id })) { link in
            NavigationStack {
                if session.isInternal { JobDetailView(jobId: link.id) } else { PortalJobDetailView(jobId: link.id) }
            }
        }
    }
}

struct JobLink: Identifiable { let id: Int }

private struct OfflineBanner: View {
    @EnvironmentObject private var session: Session
    var body: some View {
        if let banner = session.banner {
            Text(banner)
                .font(.footnote).padding(8).frame(maxWidth: .infinity)
                .background(.orange.opacity(0.9)).foregroundStyle(.black)
                .onTapGesture { session.banner = nil }
                .task { try? await Task.sleep(nanoseconds: 6_000_000_000); session.banner = nil }
        }
    }
}

/// Everything else, grouped and filtered by permission.
struct MoreMenuView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        let p = session.permissions
        List {
            Section("Stay in touch") {
                if p.has(.messagesSend) { link("Messages", "bubble.left.and.bubble.right") { ThreadsView() } }
                link("Notifications", "bell") { NotificationsView() }
                link("Contact \(AppConfig.current.displayName)", "phone.bubble") { CompanyContactView() }
            }

            Section("Community") {
                link("Project Gallery", "photo.on.rectangle.angled") { GalleryView() }
                link("Reviews", "star.bubble") { ReviewsView() }
            }

            if session.isInternal {
                Section("My Work") {
                    if p.has(.timeViewOwn) || p.has(.timeClock) { link("Time Sheets", "list.bullet.clipboard") { TimesheetView() } }
                    if p.has(.scheduleView) { link("My Schedule", "calendar") { MyScheduleView() } }
                    if p.has(.crewsView) { link("Crews", "person.3") { CrewsView() } }
                    if p.has(.contactsView) { link("Contacts", "person.crop.rectangle.stack") { ContactsView() } }
                    if p.has(.timeoffRequest) { link("Request Time Off", "beach.umbrella") { TimeOffView() } }
                    if p.has(.paystubsViewOwn) { link("Pay Stubs", "dollarsign.circle") { PayStubsView() } }
                    if p.has(.taxprefsEdit) { link("Tax + Payment Preferences", "building.columns") { TaxPrefsView() } }
                    if p.has(.raiseRequest) { link("Raise / Position Change", "arrow.up.right.circle") { RaiseRequestsView() } }
                }
            }

            if p.hasAny(.customersView, .estimatesCreate, .calendarView, .maintenanceView) {
                Section("Field + Office") {
                    if p.has(.customersView) { link("Customers", "person.2") { CustomersView() } }
                    if p.has(.estimatesCreate) { link("Estimates", "doc.text") { EstimatesManageView() } }
                    if p.has(.calendarView) { link("Calendar", "calendar.day.timeline.left") { CompanyCalendarView() } }
                    if p.has(.maintenanceView) { link("Equipment + Maintenance", "wrench.and.screwdriver") { EquipmentView() } }
                }
            }

            if p.isAdminArea || p.hasAny(.suppliersManage, .jobPostingsManage, .reviewsManage, .galleryManage, .rolesManage) {
                Section("Administration") {
                    if p.has(.trackingViewLive) { link("Live Crew Map", "map") { LiveMapView() } }
                    if p.has(.usersManage) { link("Users + Roles", "person.badge.key") { UsersAdminView() } }
                    if p.has(.rolesManage) { link("Role Permissions", "lock.shield") { RolesAdminView() } }
                    if p.has(.timeApprove) { link("Time Approvals", "checkmark.circle") { TimeApprovalsView() } }
                    if p.has(.timeoffApprove) { link("Time Off Requests", "calendar.badge.exclamationmark") { TimeOffApprovalsView() } }
                    if p.has(.raiseReview) { link("Raise Requests", "chart.line.uptrend.xyaxis") { RaiseReviewsView() } }
                    if p.has(.dispatchManage) { link("Dispatch Crews", "paperplane") { DispatchView() } }
                    if p.has(.scheduleManage) { link("Manage Schedule", "calendar.badge.plus") { ScheduleAdminView() } }
                    if p.has(.crewsManage) { link("Manage Crews", "person.3.sequence") { CrewsAdminView() } }
                    if p.has(.invoicesManage) { link("Invoices + Payments", "doc.richtext") { InvoicesAdminView() } }
                    if p.has(.payrollManage) { link("Payroll", "banknote") { PayrollView() } }
                    if p.has(.suppliersManage) { link("Suppliers", "shippingbox") { SuppliersView() } }
                    if p.has(.jobPostingsManage) { link("Job Postings", "megaphone") { JobPostingsView() } }
                    if p.has(.reviewsManage) { link("Review Moderation", "star.leadinghalf.filled") { ReviewsModerationView() } }
                    if p.has(.galleryManage) { link("Gallery Moderation", "photo.badge.checkmark") { MediaModerationView() } }
                }
            }

            Section {
                AsyncButton("Sign Out", role: .destructive) { await session.signOut() }
            }
        }
        .navigationTitle("More")
    }

    private func link<Destination: View>(_ title: String, _ symbol: String, @ViewBuilder destination: @escaping () -> Destination) -> some View {
        NavigationLink { destination() } label: { Label(title, systemImage: symbol) }
    }
}

/// Company phone/email/website from `GET /company`.
struct CompanyContactView: View {
    @EnvironmentObject private var session: Session

    var body: some View {
        LoadableView(load: { try await session.api.get("/company") as CompanyProfile }) { company in
            List {
                Section(company.name) {
                    InfoRow(label: "Phone", value: company.phone, symbol: "phone")
                    InfoRow(label: "Email", value: company.email, symbol: "envelope")
                    InfoRow(label: "Address", value: company.addressText, symbol: "mappin")
                    if let site = company.website, let url = URL(string: site) {
                        Link(destination: url) { Label(site, systemImage: "safari") }
                    }
                }
                Section { ContactButtons(phone: company.phone, email: company.email) }
                if session.can(.messagesSend) {
                    Section { NavigationLink("Send us a message") { NewThreadView(defaultSubject: "Question") } }
                }
            }
        }
        .navigationTitle("Contact Us")
    }
}
