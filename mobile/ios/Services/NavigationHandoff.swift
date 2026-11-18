import Foundation
import MapKit
import UIKit

/// Hands turn-by-turn navigation to Apple Maps or Google Maps (contract "Navigation").
enum NavigationHandoff {
    enum Provider: String, CaseIterable, Identifiable {
        case apple = "Apple Maps", google = "Google Maps"
        var id: String { rawValue }
    }

    static var googleMapsInstalled: Bool {
        URL(string: "comgooglemaps://").map(UIApplication.shared.canOpenURL) ?? false
    }

    static func destinationQuery(address: Address?, latitude: Double?, longitude: Double?) -> String {
        if let latitude, let longitude { return "\(latitude),\(longitude)" }
        return address?.formatted ?? ""
    }

    static func url(for provider: Provider, address: Address?, latitude: Double?, longitude: Double?) -> URL? {
        let destination = destinationQuery(address: address, latitude: latitude, longitude: longitude)
        guard !destination.isEmpty,
              let encoded = destination.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else { return nil }
        switch provider {
        case .apple:
            return URL(string: "maps://?daddr=\(encoded)&dirflg=d")
        case .google:
            return googleMapsInstalled
                ? URL(string: "comgooglemaps://?daddr=\(encoded)&directionsmode=driving")
                : URL(string: "https://www.google.com/maps/dir/?api=1&destination=\(encoded)&travelmode=driving")
        }
    }

    @MainActor
    static func navigate(to job: Job, using provider: Provider = .apple) {
        navigate(title: job.title, address: job.serviceAddress, latitude: job.latitude, longitude: job.longitude, using: provider)
    }

    @MainActor
    static func navigate(title: String, address: Address?, latitude: Double?, longitude: Double?, using provider: Provider = .apple) {
        if provider == .apple, let latitude, let longitude {
            let item = MKMapItem(placemark: MKPlacemark(coordinate: CLLocationCoordinate2D(latitude: latitude, longitude: longitude)))
            item.name = title
            item.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving])
            return
        }
        if let url = url(for: provider, address: address, latitude: latitude, longitude: longitude) {
            UIApplication.shared.open(url)
        }
    }

    /// Geocodes the service address when the job has no coordinates.
    static func coordinate(for job: Job) async -> CLLocationCoordinate2D? {
        if let lat = job.latitude, let lng = job.longitude { return CLLocationCoordinate2D(latitude: lat, longitude: lng) }
        guard let text = job.serviceAddress?.formatted, !text.isEmpty else { return nil }
        let placemarks = try? await CLGeocoder().geocodeAddressString(text)
        return placemarks?.first?.location?.coordinate
    }
}

/// Phone / SMS / email links for contacting customers and coworkers.
enum ContactLinks {
    static func phone(_ number: String?) -> URL? { digits(number).flatMap { URL(string: "tel:\($0)") } }
    static func sms(_ number: String?) -> URL? { digits(number).flatMap { URL(string: "sms:\($0)") } }
    static func email(_ address: String?) -> URL? { address?.nilIfBlank.flatMap { URL(string: "mailto:\($0)") } }

    private static func digits(_ number: String?) -> String? {
        let filtered = (number ?? "").filter { $0.isNumber || $0 == "+" }
        return filtered.isEmpty ? nil : filtered
    }
}
