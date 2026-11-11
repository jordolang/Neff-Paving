import Foundation

enum TimeEntryStatus: String, Codable, LenientStringEnum {
    case open, submitted, approved, rejected
    static var fallback: TimeEntryStatus { .open }
}

struct TimeEntry: Codable, Hashable, Identifiable {
    let id: Int
    var userId: Int
    var userName: String?
    var jobId: Int?
    var jobTitle: String?
    var clockIn: Date
    var clockOut: Date?
    var hours: DecimalString?
    var status: TimeEntryStatus
    var clockInLat: Double?
    var clockInLng: Double?
    var notes: String?
}

struct TimeStatus: Decodable {
    var clockedIn: Bool
    var entry: TimeEntry?
    var trackingRequired: Bool?
    var pingIntervalSeconds: Int?
}

enum TimeOffType: String, Codable, CaseIterable, Identifiable, LenientStringEnum {
    case vacation, sick, personal, unpaid
    static var fallback: TimeOffType { .personal }
    var id: String { rawValue }
}

enum ApprovalStatus: String, Codable, LenientStringEnum {
    case pending, approved, denied
    static var fallback: ApprovalStatus { .pending }
}

struct TimeOffRequest: Codable, Hashable, Identifiable {
    let id: Int
    var userId: Int
    var userName: String?
    var startDate: Date
    var endDate: Date
    var type: TimeOffType
    var reason: String?
    var status: ApprovalStatus
    var reviewedBy: PersonRef?
    var createdAt: Date?
}

struct PayStub: Codable, Hashable, Identifiable {
    let id: Int
    var periodStart: Date
    var periodEnd: Date
    var payDate: Date?
    var hours: DecimalString?
    var gross: DecimalString
    var deductions: DecimalString?
    var net: DecimalString
    var pdfUrl: URL?
}

struct TaxPaymentPrefs: Codable, Hashable {
    var filingStatus: String?
    var allowances: Int?
    var extraWithholding: DecimalString?
    var payMethod: String?
    var bankName: String?
    var accountLast4: String?
    var routingLast4: String?
}

struct CrewMember: Codable, Hashable, Identifiable {
    let id: Int
    var name: String
    var role: Role?
    var phone: String?
}

struct Crew: Codable, Hashable, Identifiable {
    let id: Int
    var name: String
    var lead: PersonRef?
    var members: [CrewMember]
    var color: String?
}

struct ScheduleEntry: Codable, Hashable, Identifiable {
    let id: Int
    var userId: Int?
    var userName: String?
    var crewId: Int?
    var jobId: Int?
    var jobTitle: String?
    var start: Date
    var end: Date
    var notes: String?
    var address: Address?
}

enum RaiseKind: String, Codable, CaseIterable, Identifiable, LenientStringEnum {
    case raise
    case positionChange = "position_change"
    static var fallback: RaiseKind { .raise }
    var id: String { rawValue }
    var displayName: String { self == .raise ? "Raise" : "Position Change" }
}

struct RaiseRequest: Codable, Hashable, Identifiable {
    let id: Int
    var userId: Int
    var userName: String?
    var kind: RaiseKind
    var currentRate: DecimalString?
    var requestedRate: DecimalString?
    var requestedPosition: Role?
    var justification: String?
    var status: ApprovalStatus
    var reviewNote: String?
    var createdAt: Date?
}

struct LiveLocation: Codable, Hashable, Identifiable {
    var userId: Int
    var name: String
    var role: Role?
    var avatarUrl: URL?
    var latitude: Double
    var longitude: Double
    var accuracy: Double?
    var speed: Double?
    var heading: Double?
    var batteryLevel: Double?
    var recordedAt: Date?
    var clockedInAt: Date?
    var currentJob: JobRef?

    var id: Int { userId }
}

struct TrailPoint: Codable, Hashable {
    var latitude: Double
    var longitude: Double
    var recordedAt: Date
}

struct RoleDefinition: Codable, Hashable, Identifiable {
    var key: Role
    var name: String
    var permissions: [String]
    var id: String { key.rawValue }
}

struct AdminDashboard: Decodable {
    var activeJobs: Int?
    var clockedIn: Int?
    var pendingEstimates: Int?
    var pendingTimeOff: Int?
    var overdueInvoices: Int?
    var revenueMtd: DecimalString?
}

struct PayrollRun: Codable, Hashable, Identifiable {
    let id: Int
    var periodStart: Date
    var periodEnd: Date
    var payDate: Date?
    var stubCount: Int?
    var gross: DecimalString?
    var net: DecimalString?
    var createdAt: Date?
}

struct Supplier: Codable, Hashable, Identifiable {
    let id: Int
    var name: String
    var contactName: String?
    var phone: String?
    var email: String?
    var materials: String?
    var notes: String?
}

struct MaintenanceRecord: Codable, Hashable, Identifiable {
    let id: Int
    var description: String
    var cost: DecimalString?
    var performedAt: Date?
    var nextDueAt: Date?
}

struct Equipment: Codable, Hashable, Identifiable {
    let id: Int
    var name: String
    var kind: String?
    var identifier: String?
    var status: String?
    var notes: String?
    var lastServiceAt: Date?
    var nextDueAt: Date?
    var maintenance: [MaintenanceRecord]?
}

struct JobPosting: Codable, Hashable, Identifiable {
    let id: Int
    var title: String
    var description: String?
    var payRange: String?
    var isOpen: Bool
    var createdAt: Date?
}

/// Row from `GET /admin/users`.
struct AdminUser: Codable, Hashable, Identifiable {
    let id: Int
    var email: String
    var name: String?
    var firstName: String?
    var lastName: String?
    var phone: String?
    var avatarUrl: URL?
    var role: Role
    var isActive: Bool?
    var closed: Bool?
    var payRate: DecimalString?
    var lastLoginAt: Date?

    var displayName: String {
        name?.nilIfBlank ?? [firstName, lastName].compactMap { $0 }.joined(separator: " ").nilIfBlank ?? email
    }
}

struct LocationUploadResult: Decodable {
    var accepted: Int?
    var rejected: Int?
}
