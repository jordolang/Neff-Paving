import Foundation

/// Per-brand configuration injected through Info.plist build settings (see project.yml).
struct AppConfig {
    enum CompanyKey: String, CaseIterable {
        case neff, muskingum, austin
    }

    let company: CompanyKey
    let apiBaseURL: URL
    let googleClientID: String?
    let displayName: String

    static let current = AppConfig(bundle: .main)

    init(company: CompanyKey, apiBaseURL: URL, googleClientID: String?, displayName: String) {
        self.company = company
        self.apiBaseURL = apiBaseURL
        self.googleClientID = googleClientID
        self.displayName = displayName
    }

    init(bundle: Bundle) {
        let info = bundle.infoDictionary ?? [:]
        let key = (info["COMPANY_KEY"] as? String).flatMap(CompanyKey.init(rawValue:)) ?? .neff
        let base = (info["API_BASE_URL"] as? String).flatMap(URL.init(string:))
            ?? URL(string: "http://localhost:3000/api/v1")!
        let google = (info["GOOGLE_CLIENT_ID"] as? String).flatMap { $0.hasPrefix("REPLACE_ME") || $0.isEmpty ? nil : $0 }
        let name = (info["CFBundleDisplayName"] as? String) ?? AppConfig.defaultName(for: key)
        self.init(company: key, apiBaseURL: base, googleClientID: google, displayName: name)
    }

    static func defaultName(for key: CompanyKey) -> String {
        switch key {
        case .neff: return "Neff Paving"
        case .muskingum: return "Muskingum Materials"
        case .austin: return "Austin Trucking"
        }
    }
}
