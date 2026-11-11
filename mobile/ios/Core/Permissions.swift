import Foundation

/// Roles, highest authority first. A user holds exactly one role per company.
enum Role: String, Codable, CaseIterable, Identifiable, LenientStringEnum {
    case superAdmin = "super_admin"
    case admin
    case officeStaff = "office_staff"
    case estimator
    case crewLead = "crew_lead"
    case mechanic
    case employee
    case customer

    static var fallback: Role { .customer }
    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .superAdmin: return "Super Admin"
        case .admin: return "Admin"
        case .officeStaff: return "Office Staff"
        case .estimator: return "Estimator"
        case .crewLead: return "Crew Lead"
        case .mechanic: return "Mechanic"
        case .employee: return "Employee"
        case .customer: return "Customer"
        }
    }

    /// Lower is more powerful.
    var rank: Int { Role.allCases.firstIndex(of: self) ?? Role.allCases.count }

    var isInternal: Bool { self != .customer }

    /// Roles `actor` may assign to (or remove from) another user, per the contract:
    /// only a super admin may grant or revoke `admin`, and nobody but a super admin touches a super admin.
    static func assignable(by actor: Role) -> [Role] {
        switch actor {
        case .superAdmin: return Role.allCases
        case .admin: return Role.allCases.filter { $0 != .superAdmin && $0 != .admin }
        default: return []
        }
    }

    /// Whether `actor` may change the role of a user who currently has `target`.
    static func canModify(target: Role, actor: Role) -> Bool {
        switch actor {
        case .superAdmin: return true
        case .admin: return target != .superAdmin && target != .admin
        default: return false
        }
    }
}

/// Every permission string in the contract. The server is the source of truth; clients use
/// these only to decide which screens to show.
enum Permission: String, Codable, CaseIterable {
    case portalUse = "portal.use"
    case jobsViewOwn = "jobs.view_own"
    case estimatesRequest = "estimates.request"
    case invoicesViewOwn = "invoices.view_own"
    case paymentsMake = "payments.make"
    case reviewsWrite = "reviews.write"
    case galleryPublish = "gallery.publish"
    case messagesSend = "messages.send"
    case timeClock = "time.clock"
    case timeViewOwn = "time.view_own"
    case timeoffRequest = "timeoff.request"
    case paystubsViewOwn = "paystubs.view_own"
    case scheduleView = "schedule.view"
    case crewsView = "crews.view"
    case joblogsView = "joblogs.view"
    case raiseRequest = "raise.request"
    case taxprefsEdit = "taxprefs.edit"
    case contactsView = "contacts.view"
    case joblogsEdit = "joblogs.edit"
    case jobsStatusUpdate = "jobs.status_update"
    case jobsViewAssigned = "jobs.view_assigned"
    case jobsEdit = "jobs.edit"
    case jobsMediaUpload = "jobs.media_upload"
    case customersView = "customers.view"
    case customersContact = "customers.contact"
    case crewsManage = "crews.manage"
    case estimatesCreate = "estimates.create"
    case estimatesManage = "estimates.manage"
    case calendarView = "calendar.view"
    case maintenanceView = "maintenance.view"
    case maintenanceManage = "maintenance.manage"
    case jobsViewAll = "jobs.view_all"
    case jobsManage = "jobs.manage"
    case invoicesManage = "invoices.manage"
    case payrollManage = "payroll.manage"
    case timeViewAll = "time.view_all"
    case timeApprove = "time.approve"
    case timeoffApprove = "timeoff.approve"
    case scheduleManage = "schedule.manage"
    case calendarManage = "calendar.manage"
    case dispatchManage = "dispatch.manage"
    case customersManage = "customers.manage"
    case suppliersManage = "suppliers.manage"
    case reviewsManage = "reviews.manage"
    case galleryManage = "gallery.manage"
    case jobPostingsManage = "job_postings.manage"
    case bookkeepingManage = "bookkeeping.manage"
    case emailsManage = "emails.manage"
    case formsPrint = "forms.print"
    case raiseReview = "raise.review"
    case accountsClose = "accounts.close"
    case trackingViewLive = "tracking.view_live"
    case usersManage = "users.manage"
    case rolesAssign = "roles.assign"
    case rolesManage = "roles.manage"
}

/// The set of permissions a signed-in user holds, with convenience checks.
struct PermissionSet: Equatable {
    let raw: Set<String>

    init(_ strings: [String]) { raw = Set(strings) }

    func has(_ permission: Permission) -> Bool { raw.contains(permission.rawValue) }
    func hasAny(_ permissions: Permission...) -> Bool { permissions.contains(where: has) }
    func hasAny(_ permissions: [Permission]) -> Bool { permissions.contains(where: has) }

    var canSeeJobs: Bool { hasAny(.jobsViewAssigned, .jobsViewAll) }
    var isAdminArea: Bool {
        hasAny(.usersManage, .trackingViewLive, .timeApprove, .timeoffApprove, .invoicesManage,
               .payrollManage, .dispatchManage, .rolesManage, .raiseReview)
    }
}
