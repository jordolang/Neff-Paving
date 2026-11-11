import Foundation

enum JobStatus: String, Codable, CaseIterable, Identifiable, LenientStringEnum {
    case lead, estimating, scheduled
    case inProgress = "in_progress"
    case onHold = "on_hold"
    case completed, cancelled

    static var fallback: JobStatus { .lead }
    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .lead: return "Lead"
        case .estimating: return "Estimating"
        case .scheduled: return "Scheduled"
        case .inProgress: return "In Progress"
        case .onHold: return "On Hold"
        case .completed: return "Completed"
        case .cancelled: return "Cancelled"
        }
    }
}

struct CrewRef: Codable, Hashable, Identifiable {
    let id: Int
    var name: String
}

struct JobRef: Codable, Hashable, Identifiable {
    let id: Int
    var title: String
}

struct Job: Codable, Hashable, Identifiable {
    let id: Int
    var title: String
    var description: String?
    var status: JobStatus
    var serviceAddress: Address?
    var latitude: Double?
    var longitude: Double?
    var customer: PersonRef?
    var crew: CrewRef?
    var scheduledStart: Date?
    var scheduledEnd: Date?
    var completedAt: Date?
    var estimateTotal: DecimalString?
    var progress: Int?
    var coverPhotoUrl: URL?
    var sharedPublicly: Bool?
    var createdAt: Date?

    var hasCoordinate: Bool { latitude != nil && longitude != nil }
}

enum MediaKind: String, Codable, LenientStringEnum {
    case photo, video
    static var fallback: MediaKind { .photo }
}

struct Media: Codable, Hashable, Identifiable {
    let id: Int
    var jobId: Int?
    var kind: MediaKind
    var url: URL
    var thumbnailUrl: URL?
    var caption: String?
    var isPublic: Bool?
    var uploadedBy: PersonRef?
    var latitude: Double?
    var longitude: Double?
    var createdAt: Date?

    var previewURL: URL { thumbnailUrl ?? url }
}

struct StatusUpdate: Codable, Hashable, Identifiable {
    let id: Int
    var jobId: Int
    var status: JobStatus
    var message: String?
    var author: PersonRef?
    var media: [Media]?
    var visibleToCustomer: Bool?
    var createdAt: Date?
}

struct JobLog: Codable, Hashable, Identifiable {
    let id: Int
    var jobId: Int
    var date: Date
    var notes: String?
    var hours: DecimalString?
    var materials: String?
    var weather: String?
    var author: PersonRef?
    var createdAt: Date?
}

struct LineItem: Codable, Hashable, Identifiable {
    var id = UUID()
    var description: String
    var quantity: DecimalString
    var unitPrice: DecimalString
    var total: DecimalString?

    enum CodingKeys: String, CodingKey { case description, quantity, unitPrice, total }

    init(description: String = "", quantity: DecimalString = 1, unitPrice: DecimalString = .zero) {
        self.description = description
        self.quantity = quantity
        self.unitPrice = unitPrice
        self.total = quantity * unitPrice
    }

    var computedTotal: DecimalString { quantity * unitPrice }

    var json: JSONValue {
        ["description": .string(description), "quantity": .string(quantity.plainString),
         "unitPrice": .string(unitPrice.moneyString), "total": .string(computedTotal.moneyString)]
    }
}

enum EstimateStatus: String, Codable, CaseIterable, Identifiable, LenientStringEnum {
    case requested
    case inReview = "in_review"
    case sent, accepted, declined, expired

    static var fallback: EstimateStatus { .requested }
    var id: String { rawValue }
    var displayName: String {
        switch self {
        case .inReview: return "In Review"
        default: return rawValue.capitalized
        }
    }
}

struct Estimate: Codable, Hashable, Identifiable {
    let id: Int
    var customerId: Int?
    var jobId: Int?
    var status: EstimateStatus
    var serviceType: String?
    var description: String?
    var serviceAddress: Address?
    var squareFeet: DecimalString?
    var lineItems: [LineItem]?
    var total: DecimalString?
    var validUntil: Date?
    var notes: String?
    var customerName: String?
    var estimator: PersonRef?
    var media: [Media]?
    var preferredDate: Date?
    var createdAt: Date?
}

enum InvoiceStatus: String, Codable, CaseIterable, LenientStringEnum {
    case draft, sent, paid, partial, overdue, void
    static var fallback: InvoiceStatus { .draft }
}

struct Invoice: Codable, Hashable, Identifiable {
    let id: Int
    var number: String?
    var customerId: Int?
    var customerName: String?
    var jobId: Int?
    var status: InvoiceStatus
    var issuedAt: Date?
    var dueAt: Date?
    var lineItems: [LineItem]?
    var subtotal: DecimalString?
    var tax: DecimalString?
    var total: DecimalString
    var balance: DecimalString?
    var payments: [Payment]?

    var amountDue: DecimalString { balance ?? total }
    var isPayable: Bool { [.sent, .partial, .overdue].contains(status) && amountDue > .zero }
}

struct Payment: Codable, Hashable, Identifiable {
    let id: Int
    var invoiceId: Int?
    var invoiceNumber: String?
    var amount: DecimalString
    var method: String?
    var status: String?
    var createdAt: Date?
}

struct CheckoutResponse: Decodable { let checkoutUrl: URL?; let payment: Payment? }

struct Review: Codable, Hashable, Identifiable {
    let id: Int
    var jobId: Int?
    var customer: PersonRef?
    var rating: Int
    var comment: String?
    var isPublished: Bool?
    var response: String?
    var createdAt: Date?
}

struct GalleryItem: Codable, Hashable, Identifiable {
    let id: Int
    var jobId: Int?
    var jobTitle: String?
    var customerName: String?
    var city: String?
    var media: [Media]
    var review: Review?
    var createdAt: Date?
}

struct CustomerSummary: Codable, Hashable, Identifiable {
    let id: Int
    var name: String?
    var firstName: String?
    var lastName: String?
    var email: String?
    var phone: String?
    var address: Address?
    var isActive: Bool?
    var closed: Bool?
    var jobCount: Int?

    var displayName: String {
        name ?? [firstName, lastName].compactMap { $0 }.joined(separator: " ").nilIfBlank ?? email ?? "Customer #\(id)"
    }
}

struct CustomerDetail: Decodable, Hashable, Identifiable {
    let id: Int
    var name: String?
    var firstName: String?
    var lastName: String?
    var email: String?
    var phone: String?
    var address: Address?
    var isActive: Bool?
    var closed: Bool?
    var jobs: [Job]?
    var estimates: [Estimate]?
    var invoices: [Invoice]?

    var displayName: String {
        name ?? [firstName, lastName].compactMap { $0 }.joined(separator: " ").nilIfBlank ?? email ?? "Customer #\(id)"
    }
}
