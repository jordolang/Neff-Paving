import SwiftUI
import PhotosUI
import UIKit
import UniformTypeIdentifiers

/// What the camera returned.
enum CapturedMedia {
    case photo(UIImage)
    case video(URL)
}

/// UIImagePickerController wrapper that captures photos *and* videos from the camera.
struct CameraPicker: UIViewControllerRepresentable {
    var allowsVideo = true
    let onCapture: (CapturedMedia) -> Void
    @Environment(\.dismiss) private var dismiss

    static var isAvailable: Bool { UIImagePickerController.isSourceTypeAvailable(.camera) }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = Self.isAvailable ? .camera : .photoLibrary
        picker.mediaTypes = allowsVideo ? [UTType.image.identifier, UTType.movie.identifier] : [UTType.image.identifier]
        picker.videoQuality = .typeHigh
        picker.videoMaximumDuration = 300
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraPicker
        init(_ parent: CameraPicker) { self.parent = parent }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let url = info[.mediaURL] as? URL {
                parent.onCapture(.video(url))
            } else if let image = (info[.editedImage] ?? info[.originalImage]) as? UIImage {
                parent.onCapture(.photo(image))
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) { parent.dismiss() }
    }
}

/// Transferable wrapper so PhotosPicker can hand us videos as files.
struct PickedMovie: Transferable {
    let url: URL

    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(contentType: .movie) { movie in
            SentTransferredFile(movie.url)
        } importing: { received in
            let destination = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString)
                .appendingPathExtension(received.file.pathExtension.isEmpty ? "mov" : received.file.pathExtension)
            try FileManager.default.copyItem(at: received.file, to: destination)
            return PickedMovie(url: destination)
        }
    }
}

enum MediaFiles {
    /// Writes a JPEG to a temp file.
    static func jpegFile(_ image: UIImage, quality: CGFloat = 0.85) throws -> URL {
        guard let data = image.jpegData(compressionQuality: quality) else { throw APIError.decoding("Could not encode image") }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString).appendingPathExtension("jpg")
        try data.write(to: url)
        return url
    }

    /// Converts a PhotosPicker item to a local file (image as JPEG, video as movie file).
    static func file(from item: PhotosPickerItem) async throws -> URL? {
        if item.supportedContentTypes.contains(where: { $0.conforms(to: .movie) }) {
            return try await item.loadTransferable(type: PickedMovie.self)?.url
        }
        guard let data = try await item.loadTransferable(type: Data.self), let image = UIImage(data: data) else { return nil }
        return try jpegFile(image)
    }
}

/// "Add photo/video" menu that captures media and queues it for upload to a job (or estimate).
/// Uploads carry the device location and retry automatically when offline.
struct MediaCaptureMenu: View {
    let endpoint: String
    let jobId: Int?
    var allowsVideo = true
    var title = "Add Photos / Video"

    @EnvironmentObject private var uploader: MediaUploader
    @State private var showCamera = false
    @State private var showCaption = false
    @State private var pickerItems: [PhotosPickerItem] = []
    @State private var caption = ""
    @State private var stagedFiles: [URL] = []
    @State private var error: String? = nil

    var body: some View {
        Menu {
            Button { showCamera = true } label: { Label(allowsVideo ? "Take Photo or Video" : "Take Photo", systemImage: "camera") }
                .disabled(!CameraPicker.isAvailable)
            PhotosPicker(selection: $pickerItems, maxSelectionCount: 20,
                         matching: allowsVideo ? .any(of: [.images, .videos]) : .images) {
                Label("Choose from Library", systemImage: "photo.on.rectangle")
            }
        } label: {
            Label(title, systemImage: "camera.fill")
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker(allowsVideo: allowsVideo) { captured in
                do {
                    switch captured {
                    case .photo(let image): stagedFiles = [try MediaFiles.jpegFile(image)]
                    case .video(let url): stagedFiles = [url]
                    }
                    showCaption = true
                } catch { self.error = error.localizedDescription }
            }
            .ignoresSafeArea()
        }
        .onChange(of: pickerItems) { _, items in
            guard !items.isEmpty else { return }
            Task {
                var files: [URL] = []
                for item in items { if let url = try? await MediaFiles.file(from: item) { files.append(url) } }
                pickerItems = []
                stagedFiles = files
                if !files.isEmpty { showCaption = true }
            }
        }
        .alert("Add a caption", isPresented: $showCaption) {
            TextField("Caption (optional)", text: $caption)
            Button("Upload") { Task { await enqueue() } }
            Button("Cancel", role: .cancel) { stagedFiles = [] }
        } message: {
            Text("\(stagedFiles.count) item(s) will upload to this project.")
        }
        .alert("Upload failed", isPresented: Binding(get: { error != nil }, set: { if !$0 { error = nil } })) {
            Button("OK", role: .cancel) {}
        } message: { Text(error ?? "") }
    }

    private func enqueue() async {
        let fix = await LocationTracker.shared.currentLocation(timeout: 5)
        for file in stagedFiles {
            do {
                try uploader.enqueue(fileURL: file, endpoint: endpoint, jobId: jobId, caption: caption,
                                     latitude: fix?.coordinate.latitude, longitude: fix?.coordinate.longitude)
                try? FileManager.default.removeItem(at: file)
            } catch { self.error = error.localizedDescription }
        }
        stagedFiles = []
        caption = ""
    }
}

/// Shows queued uploads for a job.
struct PendingUploadsBanner: View {
    let jobId: Int
    @EnvironmentObject private var uploader: MediaUploader

    var body: some View {
        let count = uploader.pendingCount(forJob: jobId)
        if count > 0 {
            Label("\(count) upload(s) waiting — will retry automatically", systemImage: "icloud.and.arrow.up")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
    }
}
