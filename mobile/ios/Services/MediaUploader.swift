import Foundation
import Network

/// A photo/video waiting to be uploaded. Files are copied into Application Support so the
/// queue survives relaunches and offline periods.
struct PendingUpload: Codable, Identifiable, Equatable {
    var id = UUID()
    var endpoint: String          // e.g. "/jobs/12/media"
    var jobId: Int?
    var fileName: String          // file inside the uploads directory
    var mimeType: String
    var fields: [String: String]
    var attempts = 0
    var createdAt = Date()
    var lastError: String?
}

/// Retrying, disk-backed upload queue for job media (contract "Media capture").
@MainActor
final class MediaUploader: ObservableObject {
    static let shared = MediaUploader()

    @Published private(set) var pending: [PendingUpload] = []
    @Published private(set) var isUploading = false

    private let api: APIClient
    private let directory: URL
    private let manifestURL: URL
    private let monitor = NWPathMonitor()
    private var retryTask: Task<Void, Never>?

    init(api: APIClient = .shared) {
        self.api = api
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        directory = base.appendingPathComponent("PendingUploads", isDirectory: true)
        manifestURL = directory.appendingPathComponent("manifest.json")
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        if let data = try? Data(contentsOf: manifestURL),
           let stored = try? JSON.decoder.decode([PendingUpload].self, from: data) {
            pending = stored
        }
        monitor.pathUpdateHandler = { [weak self] path in
            guard path.status == .satisfied else { return }
            Task { @MainActor in self?.processQueue() }
        }
        monitor.start(queue: DispatchQueue(label: "media.path"))
    }

    func pendingCount(forJob jobId: Int) -> Int { pending.filter { $0.jobId == jobId }.count }

    /// Queues a file for upload. The source file is copied, so callers may delete it afterwards.
    func enqueue(fileURL: URL, endpoint: String, jobId: Int?, caption: String? = nil,
                 latitude: Double? = nil, longitude: Double? = nil, extraFields: [String: String] = [:]) throws {
        let ext = fileURL.pathExtension.isEmpty ? "jpg" : fileURL.pathExtension
        let name = "\(UUID().uuidString).\(ext)"
        try FileManager.default.copyItem(at: fileURL, to: directory.appendingPathComponent(name))
        var fields = extraFields
        if let caption = caption?.nilIfBlank { fields["caption"] = caption }
        if let latitude { fields["latitude"] = String(latitude) }
        if let longitude { fields["longitude"] = String(longitude) }
        pending.append(PendingUpload(endpoint: endpoint, jobId: jobId, fileName: name,
                                     mimeType: MultipartWriter.mimeType(for: fileURL), fields: fields))
        persist()
        processQueue()
    }

    func enqueue(data: Data, fileExtension: String, endpoint: String, jobId: Int?, caption: String? = nil,
                 latitude: Double? = nil, longitude: Double? = nil) throws {
        let temp = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).\(fileExtension)")
        try data.write(to: temp)
        defer { try? FileManager.default.removeItem(at: temp) }
        try enqueue(fileURL: temp, endpoint: endpoint, jobId: jobId, caption: caption, latitude: latitude, longitude: longitude)
    }

    func cancel(_ upload: PendingUpload) {
        try? FileManager.default.removeItem(at: directory.appendingPathComponent(upload.fileName))
        pending.removeAll { $0.id == upload.id }
        persist()
    }

    func processQueue() {
        guard !isUploading, !pending.isEmpty, api.isAuthenticated else { return }
        retryTask?.cancel()
        isUploading = true
        Task {
            defer { isUploading = false }
            var hadTransientFailure = false
            for item in pending {
                let file = directory.appendingPathComponent(item.fileName)
                guard FileManager.default.fileExists(atPath: file.path) else { remove(item); continue }
                do {
                    let _: Ignored = try await api.upload(item.endpoint, fileURL: file, fileName: item.fileName,
                                                          mimeType: item.mimeType, fields: item.fields)
                    remove(item)
                    NotificationCenter.default.post(name: .mediaUploaded, object: nil, userInfo: ["jobId": item.jobId as Any])
                } catch let error as APIError where error.isTransient || error == .sessionExpired {
                    update(item) { $0.attempts += 1; $0.lastError = error.localizedDescription }
                    hadTransientFailure = true
                    break
                } catch {
                    // Permanent rejection (403/400): keep for 3 attempts so the user sees the error, then drop.
                    update(item) { $0.attempts += 1; $0.lastError = error.localizedDescription }
                    if (pending.first { $0.id == item.id }?.attempts ?? 0) >= 3 { remove(item) }
                }
            }
            if hadTransientFailure { scheduleRetry() }
        }
    }

    private func scheduleRetry() {
        let attempts = pending.first?.attempts ?? 1
        let delay = min(300.0, pow(2.0, Double(attempts)) * 5)
        retryTask = Task {
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            guard !Task.isCancelled else { return }
            processQueue()
        }
    }

    private func remove(_ item: PendingUpload) {
        try? FileManager.default.removeItem(at: directory.appendingPathComponent(item.fileName))
        pending.removeAll { $0.id == item.id }
        persist()
    }

    private func update(_ item: PendingUpload, _ change: (inout PendingUpload) -> Void) {
        guard let index = pending.firstIndex(where: { $0.id == item.id }) else { return }
        change(&pending[index])
        persist()
    }

    private func persist() {
        if let data = try? JSON.encoder.encode(pending) { try? data.write(to: manifestURL, options: .atomic) }
    }
}

extension Notification.Name {
    static let mediaUploaded = Notification.Name("mediaUploaded")
}
