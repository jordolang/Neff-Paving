import Foundation

/// Decoder/encoder configured for the API contract: camelCase keys, ISO-8601 timestamps
/// (with or without fractional seconds) and plain `yyyy-MM-dd` dates.
enum JSON {
    static let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let raw = try container.decode(String.self)
            if let date = DateFormats.parse(raw) { return date }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unrecognized date: \(raw)")
        }
        return decoder
    }()

    static let encoder: JSONEncoder = {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .custom { date, encoder in
            var container = encoder.singleValueContainer()
            try container.encode(DateFormats.timestamp(date))
        }
        return encoder
    }()
}

enum DateFormats {
    private static let fractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let plain: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    /// Calendar dates (`2026-12-24`) are interpreted in the device's time zone so they display on
    /// the same day the office entered them.
    private static let dayOnly: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    static func parse(_ raw: String) -> Date? {
        fractional.date(from: raw) ?? plain.date(from: raw) ?? dayOnly.date(from: String(raw.prefix(10)))
    }

    /// `2026-11-11T17:58:00Z`
    static func timestamp(_ date: Date) -> String { plain.string(from: date) }

    /// `2026-11-11`
    static func day(_ date: Date) -> String { dayOnly.string(from: date) }
}

/// Free-form JSON used for request bodies and for the occasional untyped response.
enum JSONValue: Codable, Hashable {
    case string(String)
    case number(Double)
    case int(Int)
    case bool(Bool)
    case array([JSONValue])
    case object([String: JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Int.self) { self = .int(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([JSONValue].self) { self = .array(value) }
        else { self = .object(try container.decode([String: JSONValue].self)) }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .int(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }

    /// Optional string helper: `nil` and empty strings become JSON `null`.
    static func optional(_ value: String?) -> JSONValue {
        guard let value, !value.trimmingCharacters(in: .whitespaces).isEmpty else { return .null }
        return .string(value)
    }

    static func optional(_ value: Int?) -> JSONValue { value.map(JSONValue.int) ?? .null }
    static func optional(_ value: Double?) -> JSONValue { value.map(JSONValue.number) ?? .null }
    static func date(_ value: Date?) -> JSONValue { value.map { .string(DateFormats.timestamp($0)) } ?? .null }
    static func day(_ value: Date?) -> JSONValue { value.map { .string(DateFormats.day($0)) } ?? .null }

    var intValue: Int? {
        switch self {
        case .int(let v): return v
        case .number(let v): return Int(v)
        case .string(let v): return Int(v)
        default: return nil
        }
    }

    var stringValue: String? {
        switch self {
        case .string(let v): return v
        case .int(let v): return String(v)
        case .number(let v): return String(v)
        case .bool(let v): return String(v)
        default: return nil
        }
    }

    subscript(key: String) -> JSONValue? {
        if case .object(let dict) = self { return dict[key] }
        return nil
    }
}

extension JSONValue: ExpressibleByStringLiteral, ExpressibleByIntegerLiteral, ExpressibleByBooleanLiteral,
    ExpressibleByFloatLiteral, ExpressibleByArrayLiteral, ExpressibleByDictionaryLiteral, ExpressibleByNilLiteral {
    init(stringLiteral value: String) { self = .string(value) }
    init(integerLiteral value: Int) { self = .int(value) }
    init(booleanLiteral value: Bool) { self = .bool(value) }
    init(floatLiteral value: Double) { self = .number(value) }
    init(arrayLiteral elements: JSONValue...) { self = .array(elements) }
    init(dictionaryLiteral elements: (String, JSONValue)...) {
        self = .object(Dictionary(elements, uniquingKeysWith: { _, last in last }))
    }
    init(nilLiteral: ()) { self = .null }
}

/// Decodes any payload and throws it away — for endpoints whose body we don't need.
struct Ignored: Decodable {
    init(from decoder: Decoder) throws {}
    init() {}
}

/// Enums backed by API strings that must not crash when the server adds a new value.
protocol LenientStringEnum: RawRepresentable, Decodable, CaseIterable where RawValue == String {
    static var fallback: Self { get }
}

extension LenientStringEnum {
    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = Self(rawValue: raw) ?? Self.fallback
    }
}
