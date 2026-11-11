import Foundation

/// A decimal value transported as a string (`"1250.00"`) per the API contract. Also accepts
/// JSON numbers for robustness. Used for money, hours, quantities and square footage.
struct DecimalString: Codable, Hashable, Comparable, ExpressibleByIntegerLiteral, ExpressibleByStringLiteral {
    var value: Decimal

    init(_ value: Decimal) { self.value = value }

    init?(string: String) {
        let cleaned = string
            .replacingOccurrences(of: "$", with: "")
            .replacingOccurrences(of: ",", with: "")
            .trimmingCharacters(in: .whitespaces)
        guard !cleaned.isEmpty, let decimal = Decimal(string: cleaned, locale: Locale(identifier: "en_US_POSIX")) else {
            return nil
        }
        self.value = decimal
    }

    init(integerLiteral value: Int) { self.value = Decimal(value) }
    init(stringLiteral value: String) { self.value = DecimalString(string: value)?.value ?? 0 }

    static let zero = DecimalString(0)

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let string = try? container.decode(String.self) {
            guard let parsed = DecimalString(string: string) else {
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Not a decimal: \(string)")
            }
            self = parsed
        } else {
            self.value = Decimal(try container.decode(Double.self))
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(plainString)
    }

    /// `1250.5` → `"1250.50"` when money-like, otherwise the shortest exact representation.
    var plainString: String { NSDecimalNumber(decimal: value).stringValue }

    var moneyString: String { Self.moneyFormatter.string(from: NSDecimalNumber(decimal: value)) ?? plainString }

    /// `$1,250.00`
    var currency: String { Self.currencyFormatter.string(from: NSDecimalNumber(decimal: value)) ?? "$\(plainString)" }

    /// `7.5` hours → `7.50`
    var twoDecimals: String { moneyString }

    var doubleValue: Double { NSDecimalNumber(decimal: value).doubleValue }

    static func < (lhs: DecimalString, rhs: DecimalString) -> Bool { lhs.value < rhs.value }
    static func + (lhs: DecimalString, rhs: DecimalString) -> DecimalString { DecimalString(lhs.value + rhs.value) }
    static func * (lhs: DecimalString, rhs: DecimalString) -> DecimalString { DecimalString(lhs.value * rhs.value) }

    private static let currencyFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.locale = Locale(identifier: "en_US")
        formatter.currencyCode = "USD"
        return formatter
    }()

    private static let moneyFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.usesGroupingSeparator = false
        formatter.minimumFractionDigits = 2
        formatter.maximumFractionDigits = 2
        return formatter
    }()
}

extension Sequence where Element == DecimalString {
    var sum: DecimalString { reduce(.zero, +) }
}
