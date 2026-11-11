import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

enum HTTPMethod: String { case get = "GET", post = "POST", put = "PUT", delete = "DELETE" }

enum APIError: LocalizedError, Equatable {
    case http(status: Int, code: String, message: String)
    case transport(String)
    case decoding(String)
    case sessionExpired

    var errorDescription: String? {
        switch self {
        case .http(_, _, let message): return message
        case .transport(let message): return "Network problem: \(message)"
        case .decoding(let message): return "Unexpected response from the server. \(message)"
        case .sessionExpired: return "Your session expired. Please sign in again."
        }
    }

    var status: Int? { if case .http(let status, _, _) = self { return status }; return nil }
    var code: String? { if case .http(_, let code, _) = self { return code }; return nil }

    var isNotClockedIn: Bool { code == "not_clocked_in" || status == 409 }

    /// Transient errors are worth retrying later (offline queues).
    var isTransient: Bool {
        switch self {
        case .transport: return true
        case .http(let status, _, _): return status >= 500 || status == 408 || status == 429
        default: return false
        }
    }
}

private struct Envelope<T: Decodable>: Decodable { let data: T }
private struct ErrorEnvelope: Decodable {
    struct Body: Decodable { let code: String?; let message: String? }
    let error: Body?
    let message: String?
}

/// Async/await client for the v1 contract: adds `X-Company`, bearer auth, unwraps `{ data }`,
/// and transparently refreshes the access token once on a 401.
final class APIClient: @unchecked Sendable {
    static let shared: APIClient = {
        #if canImport(Security)
        return APIClient(config: .current, tokenStore: KeychainTokenStore())
        #else
        return APIClient(config: .current, tokenStore: InMemoryTokenStore())
        #endif
    }()

    let config: AppConfig
    let tokenStore: TokenStore
    private let session: URLSession
    private let refresher = RefreshCoordinator()

    /// Called (on an arbitrary thread) when refresh fails and the user must sign in again.
    var onSessionExpired: (@Sendable () -> Void)?

    init(config: AppConfig, tokenStore: TokenStore, session: URLSession = .shared) {
        self.config = config
        self.tokenStore = tokenStore
        self.session = session
    }

    var isAuthenticated: Bool { tokenStore.load() != nil }

    // MARK: Public helpers

    func get<T: Decodable>(_ path: String, query: [String: String?] = [:]) async throws -> T {
        try await request(.get, path, query: query, body: Optional<JSONValue>.none)
    }

    func post<T: Decodable>(_ path: String, body: JSONValue? = nil) async throws -> T {
        try await request(.post, path, body: body)
    }

    func put<T: Decodable>(_ path: String, body: JSONValue? = nil) async throws -> T {
        try await request(.put, path, body: body)
    }

    /// Fire-and-check call whose response body is not needed.
    func call(_ method: HTTPMethod, _ path: String, body: JSONValue? = nil) async throws {
        let _: Ignored = try await request(method, path, body: body)
    }

    func request<T: Decodable, Body: Encodable>(
        _ method: HTTPMethod, _ path: String, query: [String: String?] = [:], body: Body?, authenticated: Bool = true
    ) async throws -> T {
        let bodyData = try body.map { try JSON.encoder.encode($0) }
        let data = try await perform(authenticated: authenticated) { token in
            var request = try self.makeRequest(method, path, query: query, token: token)
            if let bodyData {
                request.httpBody = bodyData
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            }
            return request
        }
        return try Self.decode(T.self, from: data)
    }

    /// Multipart upload of a file on disk. The body is streamed from a temp file so large videos
    /// never have to fit in memory.
    func upload<T: Decodable>(
        _ path: String, fileURL: URL, fileName: String? = nil, mimeType: String, fields: [String: String] = [:]
    ) async throws -> T {
        let boundary = "Boundary-\(UUID().uuidString)"
        let bodyFile = try MultipartWriter.write(
            fileURL: fileURL, fileName: fileName ?? fileURL.lastPathComponent, mimeType: mimeType,
            fields: fields, boundary: boundary)
        defer { try? FileManager.default.removeItem(at: bodyFile) }
        let data = try await perform(authenticated: true, upload: bodyFile) { token in
            var request = try self.makeRequest(.post, path, query: [:], token: token)
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            request.timeoutInterval = 600
            return request
        }
        return try Self.decode(T.self, from: data)
    }

    func upload<T: Decodable>(_ path: String, data: Data, fileName: String, mimeType: String, fields: [String: String] = [:]) async throws -> T {
        let temp = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + "-" + fileName)
        try data.write(to: temp)
        defer { try? FileManager.default.removeItem(at: temp) }
        return try await upload(path, fileURL: temp, fileName: fileName, mimeType: mimeType, fields: fields)
    }

    // MARK: Auth

    func authenticate(_ path: String, body: JSONValue) async throws -> AuthResponse {
        let response: AuthResponse = try await request(.post, path, body: body, authenticated: false)
        tokenStore.save(TokenPair(accessToken: response.accessToken, refreshToken: response.refreshToken))
        return response
    }

    func signOut() async {
        if let refresh = tokenStore.load()?.refreshToken {
            let _: Ignored? = try? await request(.post, "/auth/logout", body: JSONValue.object(["refreshToken": .string(refresh)]))
        }
        tokenStore.save(nil)
    }

    // MARK: Internals

    func makeURL(_ path: String, query: [String: String?] = [:]) throws -> URL {
        let trimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard var components = URLComponents(url: config.apiBaseURL.appendingPathComponent(trimmed), resolvingAgainstBaseURL: false) else {
            throw APIError.transport("Invalid URL \(path)")
        }
        let items = query.compactMap { key, value in value.map { URLQueryItem(name: key, value: $0) } }
            .sorted { $0.name < $1.name }
        if !items.isEmpty { components.queryItems = items }
        guard let url = components.url else { throw APIError.transport("Invalid URL \(path)") }
        return url
    }

    private func makeRequest(_ method: HTTPMethod, _ path: String, query: [String: String?], token: String?) throws -> URLRequest {
        var request = URLRequest(url: try makeURL(path, query: query))
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(config.company.rawValue, forHTTPHeaderField: "X-Company")
        if let token { request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization") }
        return request
    }

    private func perform(
        authenticated: Bool, upload: URL? = nil, build: @escaping (String?) throws -> URLRequest
    ) async throws -> Data {
        let token = authenticated ? tokenStore.load()?.accessToken : nil
        let (data, status) = try await send(build(token), upload: upload)
        if status == 401, authenticated, let current = tokenStore.load() {
            do {
                let fresh = try await refresher.refresh(current) { try await self.refreshTokens(current) }
                let (retryData, retryStatus) = try await send(build(fresh.accessToken), upload: upload)
                return try Self.check(retryData, status: retryStatus)
            } catch {
                tokenStore.save(nil)
                onSessionExpired?()
                throw APIError.sessionExpired
            }
        }
        return try Self.check(data, status: status)
    }

    private func refreshTokens(_ current: TokenPair) async throws -> TokenPair {
        var request = try makeRequest(.post, "/auth/refresh", query: [:], token: nil)
        request.httpBody = try JSON.encoder.encode(JSONValue.object(["refreshToken": .string(current.refreshToken)]))
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let (data, status) = try await send(request, upload: nil)
        let pair = try Self.decode(TokenPair.self, from: try Self.check(data, status: status))
        tokenStore.save(pair)
        return pair
    }

    private func send(_ request: URLRequest, upload: URL?) async throws -> (Data, Int) {
        do {
            let (data, response): (Data, URLResponse)
            if let upload {
                (data, response) = try await session.upload(for: request, fromFile: upload)
            } else {
                (data, response) = try await session.data(for: request)
            }
            return (data, (response as? HTTPURLResponse)?.statusCode ?? 0)
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.transport(error.localizedDescription)
        }
    }

    static func check(_ data: Data, status: Int) throws -> Data {
        guard (200..<300).contains(status) else {
            let envelope = try? JSONDecoder().decode(ErrorEnvelope.self, from: data)
            throw APIError.http(
                status: status,
                code: envelope?.error?.code ?? Self.defaultCode(for: status),
                message: envelope?.error?.message ?? envelope?.message ?? HTTPURLResponse.localizedString(forStatusCode: status).capitalized)
        }
        return data
    }

    static func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        if T.self == Ignored.self { return Ignored() as! T }
        do {
            if let envelope = try? JSON.decoder.decode(Envelope<T>.self, from: data) { return envelope.data }
            return try JSON.decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding(String(describing: error))
        }
    }

    private static func defaultCode(for status: Int) -> String {
        switch status {
        case 400: return "bad_request"
        case 401: return "unauthorized"
        case 403: return "forbidden"
        case 404: return "not_found"
        case 409: return "conflict"
        default: return "server_error"
        }
    }
}

/// Ensures concurrent 401s trigger a single refresh request.
private actor RefreshCoordinator {
    private var inFlight: Task<TokenPair, Error>?
    private var lastRefreshed: (from: String, to: TokenPair)?

    func refresh(_ current: TokenPair, using work: @escaping @Sendable () async throws -> TokenPair) async throws -> TokenPair {
        if let last = lastRefreshed, last.from == current.accessToken { return last.to }
        if let inFlight { return try await inFlight.value }
        let task = Task { try await work() }
        inFlight = task
        defer { inFlight = nil }
        let pair = try await task.value
        lastRefreshed = (current.accessToken, pair)
        return pair
    }
}

enum MultipartWriter {
    static func write(fileURL: URL, fileName: String, mimeType: String, fields: [String: String], boundary: String) throws -> URL {
        let output = FileManager.default.temporaryDirectory.appendingPathComponent("upload-\(UUID().uuidString)")
        _ = FileManager.default.createFile(atPath: output.path, contents: nil)
        let handle = try FileHandle(forWritingTo: output)
        defer { try? handle.close() }

        func write(_ string: String) { handle.write(Data(string.utf8)) }

        for (name, value) in fields.sorted(by: { $0.key < $1.key }) {
            write("--\(boundary)\r\nContent-Disposition: form-data; name=\"\(name)\"\r\n\r\n\(value)\r\n")
        }
        let safeName = fileName.replacingOccurrences(of: "\"", with: "")
        write("--\(boundary)\r\nContent-Disposition: form-data; name=\"file\"; filename=\"\(safeName)\"\r\nContent-Type: \(mimeType)\r\n\r\n")
        let input = try FileHandle(forReadingFrom: fileURL)
        defer { try? input.close() }
        while true {
            let chunk = input.readData(ofLength: 1 << 20)
            if chunk.isEmpty { break }
            handle.write(chunk)
        }
        write("\r\n--\(boundary)--\r\n")
        return output
    }

    static func mimeType(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "jpg", "jpeg": return "image/jpeg"
        case "png": return "image/png"
        case "heic": return "image/heic"
        case "mov": return "video/quicktime"
        case "mp4", "m4v": return "video/mp4"
        default: return "application/octet-stream"
        }
    }
}
