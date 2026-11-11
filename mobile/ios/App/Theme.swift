import SwiftUI

/// Brand colors per company, keyed by `COMPANY_KEY`.
struct Theme {
    let primary: Color
    let onPrimary: Color
    let background: Color
    let surface: Color
    let secondary: Color
    let logoSymbol: String
    let tagline: String

    static let current = Theme.for(AppConfig.current.company)

    static func `for`(_ company: AppConfig.CompanyKey) -> Theme {
        switch company {
        case .neff:
            return Theme(primary: Color(hex: "#F5A400"), onPrimary: Color(hex: "#111111"),
                         background: Color(hex: "#121212"), surface: Color(hex: "#1E1E1E"),
                         secondary: Color(hex: "#FFD36B"), logoSymbol: "road.lanes",
                         tagline: "Paving Service + Support")
        case .muskingum:
            return Theme(primary: Color(hex: "#4E7A3A"), onPrimary: .white,
                         background: Color(hex: "#15190F"), surface: Color(hex: "#232A1B"),
                         secondary: Color(hex: "#A68A5B"), logoSymbol: "mountain.2.fill",
                         tagline: "Aggregates, Stone + Materials")
        case .austin:
            return Theme(primary: Color(hex: "#9E1B1B"), onPrimary: .white,
                         background: Color(hex: "#150D0D"), surface: Color(hex: "#241515"),
                         secondary: Color(hex: "#D9A441"), logoSymbol: "truck.box.fill",
                         tagline: "Hauling + Trucking")
        }
    }
}

extension Color {
    init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)
        let r, g, b: Double
        if cleaned.count == 6 {
            r = Double((value >> 16) & 0xFF) / 255
            g = Double((value >> 8) & 0xFF) / 255
            b = Double(value & 0xFF) / 255
        } else {
            r = 0.5; g = 0.5; b = 0.5
        }
        self.init(.sRGB, red: r, green: g, blue: b, opacity: 1)
    }
}

extension JobStatus {
    var color: Color {
        switch self {
        case .lead: return .gray
        case .estimating: return .purple
        case .scheduled: return .blue
        case .inProgress: return Theme.current.primary
        case .onHold: return .orange
        case .completed: return .green
        case .cancelled: return .red
        }
    }
}

extension EstimateStatus {
    var color: Color {
        switch self {
        case .requested: return .gray
        case .inReview: return .purple
        case .sent: return .blue
        case .accepted: return .green
        case .declined, .expired: return .red
        }
    }
}

extension InvoiceStatus {
    var color: Color {
        switch self {
        case .paid: return .green
        case .overdue: return .red
        case .partial: return .orange
        case .sent: return .blue
        case .draft, .void: return .gray
        }
    }
}

extension ApprovalStatus {
    var color: Color {
        switch self {
        case .pending: return .orange
        case .approved: return .green
        case .denied: return .red
        }
    }
}
