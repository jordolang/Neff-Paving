import Foundation
#if canImport(Security)
import Security
#endif

/// Persists the access/refresh token pair. Production builds use the Keychain; tests and
/// previews can inject `InMemoryTokenStore`.
protocol TokenStore: AnyObject {
    func load() -> TokenPair?
    func save(_ tokens: TokenPair?)
}

final class InMemoryTokenStore: TokenStore {
    private var tokens: TokenPair?
    private let lock = NSLock()
    init(_ tokens: TokenPair? = nil) { self.tokens = tokens }
    func load() -> TokenPair? { lock.lock(); defer { lock.unlock() }; return tokens }
    func save(_ tokens: TokenPair?) { lock.lock(); self.tokens = tokens; lock.unlock() }
}

#if canImport(Security)
final class KeychainTokenStore: TokenStore {
    private let service: String
    private let account = "auth-tokens"
    private let lock = NSLock()
    private var cache: TokenPair??

    init(service: String = (Bundle.main.bundleIdentifier ?? "com.neffpaving.app") + ".auth") {
        self.service = service
    }

    func load() -> TokenPair? {
        lock.lock(); defer { lock.unlock() }
        if let cache { return cache }
        var query = baseQuery
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess, let data = item as? Data,
              let tokens = try? JSONDecoder().decode(TokenPair.self, from: data) else {
            cache = .some(nil)
            return nil
        }
        cache = .some(tokens)
        return tokens
    }

    func save(_ tokens: TokenPair?) {
        lock.lock(); defer { lock.unlock() }
        cache = .some(tokens)
        SecItemDelete(baseQuery as CFDictionary)
        guard let tokens, let data = try? JSONEncoder().encode(tokens) else { return }
        var attributes = baseQuery
        attributes[kSecValueData as String] = data
        // Readable after first unlock so background location uploads can authenticate.
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(attributes as CFDictionary, nil)
    }

    private var baseQuery: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: service,
         kSecAttrAccount as String: account]
    }
}
#endif
