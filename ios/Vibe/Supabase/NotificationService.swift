import Foundation

final class NotificationService {
    private let backend = SupabaseService.shared

    func registerDeviceToken(_ token: String, platform: String = "ios", accessToken: String) async throws {
        let body = try JSONEncoder().encode(DeviceTokenRegistration(token: token, platform: platform))
        try await backend.requestNoContent(
            path: "/api/cloud/device-token",
            method: "POST",
            body: body,
            token: accessToken
        )
    }

    func removeDeviceToken(_ token: String, accessToken: String) async throws {
        let safe = token.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? token
        try await backend.requestNoContent(
            path: "/api/cloud/device-token?token=\(safe)",
            method: "DELETE",
            token: accessToken
        )
    }

    func loadPreferences(accessToken: String) async throws -> NotificationPreferences {
        let response: PreferencesResponse = try await backend.request(
            path: "/api/cloud/notification-preferences",
            method: "GET",
            token: accessToken
        )
        return response.preferences
    }

    func savePreferences(_ preferences: NotificationPreferences, accessToken: String) async throws {
        let body = try JSONEncoder().encode(preferences)
        try await backend.requestNoContent(
            path: "/api/cloud/notification-preferences",
            method: "POST",
            body: body,
            token: accessToken
        )
    }
}

private struct PreferencesResponse: Decodable {
    let preferences: NotificationPreferences
}
