import Foundation

struct Address: Codable, Hashable {
    var line1: String?
    var line2: String?
    var city: String?
    var state: String?
    var zip: String?

    init(line1: String? = nil, line2: String? = nil, city: String? = nil, state: String? = "OH", zip: String? = nil) {
        self.line1 = line1; self.line2 = line2; self.city = city; self.state = state; self.zip = zip
    }

    /// Single-line form for maps and labels.
    var formatted: String {
        let street = [line1, line2].compactMap { $0?.nilIfBlank }.joined(separator: " ")
        let cityLine = [city?.nilIfBlank, [state?.nilIfBlank, zip?.nilIfBlank].compactMap { $0 }.joined(separator: " ").nilIfBlank]
            .compactMap { $0 }.joined(separator: ", ")
        return [street.nilIfBlank, cityLine.nilIfBlank].compactMap { $0 }.joined(separator: ", ")
    }

    var isEmpty: Bool { formatted.isEmpty }

    var json: JSONValue {
        ["line1": .optional(line1), "line2": .optional(line2), "city": .optional(city),
         "state": .optional(state), "zip": .optional(zip)]
    }
}

extension String {
    var nilIfBlank: String? { trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : self }
}

/// Minimal reference to a person embedded in other payloads.
struct PersonRef: Codable, Hashable, Identifiable {
    let id: Int
    var name: String
    var role: Role?
    var phone: String?
    var email: String?
    var avatarUrl: URL?

    init(id: Int, name: String, role: Role? = nil, phone: String? = nil, email: String? = nil, avatarUrl: URL? = nil) {
        self.id = id; self.name = name; self.role = role; self.phone = phone; self.email = email; self.avatarUrl = avatarUrl
    }

    enum CodingKeys: String, CodingKey { case id, name, role, phone, email, avatarUrl }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(Int.self, forKey: .id)
        name = try c.decodeIfPresent(String.self, forKey: .name) ?? ""
        // Servers may send "" for an unknown role; treat that (and any unknown value) as nil here.
        let rawRole: String? = (try? c.decodeIfPresent(String.self, forKey: .role)) ?? nil
        role = rawRole.flatMap { Role(rawValue: $0) }
        phone = try c.decodeIfPresent(String.self, forKey: .phone)
        email = try c.decodeIfPresent(String.self, forKey: .email)
        avatarUrl = try? c.decodeIfPresent(URL.self, forKey: .avatarUrl)
    }
}

struct NotificationPrefs: Codable, Hashable {
    var push: Bool = true
    var email: Bool = true
    var sms: Bool = false
}

struct CompanyRef: Codable, Hashable {
    var key: String
    var name: String
    var primaryColor: String?
}

struct CompanyProfile: Decodable, Hashable {
    var key: String
    var name: String
    var phone: String?
    var email: String?
    var website: String?
    var primaryColor: String?
    var addressText: String?

    enum CodingKeys: String, CodingKey { case key, name, phone, email, website, primaryColor, address }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        key = try c.decode(String.self, forKey: .key)
        name = try c.decode(String.self, forKey: .name)
        phone = try c.decodeIfPresent(String.self, forKey: .phone)
        email = try c.decodeIfPresent(String.self, forKey: .email)
        website = try c.decodeIfPresent(String.self, forKey: .website)
        primaryColor = try c.decodeIfPresent(String.self, forKey: .primaryColor)
        // Address may be sent as a string or as an Address object.
        if let text = try? c.decodeIfPresent(String.self, forKey: .address) {
            addressText = text
        } else if let address = try? c.decodeIfPresent(Address.self, forKey: .address) {
            addressText = address.formatted
        } else {
            addressText = nil
        }
    }
}

struct User: Codable, Hashable, Identifiable {
    let id: Int
    var email: String
    var firstName: String
    var lastName: String
    var phone: String?
    var avatarUrl: URL?
    var address: Address?
    var role: Role
    var isInternal: Bool
    var permissions: [String]
    var company: CompanyRef?
    var notificationPrefs: NotificationPrefs?
    var publicProfile: Bool?
    var isActive: Bool?
    var createdAt: Date?

    var fullName: String { "\(firstName) \(lastName)".trimmingCharacters(in: .whitespaces) }
    var permissionSet: PermissionSet { PermissionSet(permissions) }
}

struct AuthResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let user: User
}

struct TokenPair: Codable, Equatable {
    let accessToken: String
    let refreshToken: String
}

struct ListMeta: Decodable { let total: Int? }

struct Contact: Codable, Hashable, Identifiable {
    let id: Int
    var name: String
    var role: Role?
    var phone: String?
    var email: String?
}

struct AppNotification: Codable, Hashable, Identifiable {
    let id: Int
    var type: String
    var title: String
    var body: String?
    var data: [String: JSONValue]?
    var readAt: Date?
    var createdAt: Date?

    var jobId: Int? { data?["jobId"]?.intValue }
    var isRead: Bool { readAt != nil }
}

struct Message: Codable, Hashable, Identifiable {
    let id: Int
    var threadId: Int
    var sender: PersonRef?
    var body: String
    var createdAt: Date?
}

struct MessageThread: Codable, Hashable, Identifiable {
    let id: Int
    var subject: String
    var jobId: Int?
    var participants: [PersonRef]?
    var lastMessage: Message?
    var unreadCount: Int?
    var updatedAt: Date?
}
