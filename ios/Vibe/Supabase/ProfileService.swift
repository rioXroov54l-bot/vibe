import Foundation

final class ProfileService {
    private let backend = SupabaseService.shared

    func usernameAvailable(_ username: String, token: String) async throws -> UsernameAvailability {
        let safe = username
            .lowercased()
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? ""
        return try await backend.request(
            path: "/api/cloud/username?q=\(safe)",
            method: "GET",
            token: token
        )
    }

    func updateUsername(_ username: String, token: String) async throws {
        let body = try JSONEncoder().encode(["username": username])
        try await backend.requestNoContent(
            path: "/api/cloud/username",
            method: "PATCH",
            body: body,
            token: token
        )
    }

    func updateProfile(displayName: String, bio: String, data: [String: Any], token: String) async throws {
        let body = try JSONSerialization.data(withJSONObject: [
            "display_name": displayName,
            "bio": bio,
            "data": data
        ])
        try await backend.requestNoContent(
            path: "/api/cloud/profile",
            method: "PATCH",
            body: body,
            token: token
        )
    }

    func uploadAvatar(_ data: Data, token: String, userID: String) async throws -> UploadedMedia {
        return try await backend.upload(
            path: "/api/cloud/upload?scope=profile&target=\(userID)",
            data: data,
            contentType: "image/jpeg",
            token: token
        )
    }
}

struct UsernameAvailability: Decodable {
    let available: Bool
    let username: String?
}

struct UploadedMedia: Decodable {
    let path: String
    let url: String
}
