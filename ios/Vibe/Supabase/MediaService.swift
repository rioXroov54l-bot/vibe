import Foundation

final class MediaService {
    private let backend = SupabaseService.shared

    func upload(
        data: Data,
        contentType: String,
        scope: String,
        target: String,
        accessToken: String
    ) async throws -> UploadedMedia {
        let safeScope = scope.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? scope
        let safeTarget = target.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? target
        return try await backend.upload(
            path: "/api/cloud/upload?scope=\(safeScope)&target=\(safeTarget)",
            data: data,
            contentType: contentType,
            token: accessToken
        )
    }
}
