import Foundation

@MainActor
final class AuthService: ObservableObject {
    @Published var session: SupabaseSession?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let backend = SupabaseService.shared
    private let keychain = KeychainStore.shared

    private enum Key {
        static let access = "vibe.access_token"
        static let refresh = "vibe.refresh_token"
        static let user = "vibe.user_id"
    }

    func restoreSession() async {
        isLoading = true
        defer { isLoading = false }
        guard let access = keychain.read(Key.access),
              let refresh = keychain.read(Key.refresh),
              let userID = keychain.read(Key.user) else { return }
        session = SupabaseSession(accessToken: access, refreshToken: refresh, userID: userID)
    }

    func signUp(email: String, password: String, displayName: String) async {
        await authenticate(path: "/api/cloud/auth/signup", body: [
            "email": email,
            "password": password,
            "name": displayName,
            "accepted": true
        ])
    }

    func signIn(email: String, password: String) async {
        await authenticate(path: "/api/cloud/auth/login", body: [
            "email": email,
            "password": password
        ])
    }

    private func authenticate(path: String, body: [String: Any]) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let data = try JSONSerialization.data(withJSONObject: body)
            let response: AuthResponse = try await backend.request(
                path: path,
                method: "POST",
                body: data
            )
            if response.confirmationRequired {
                return
            }
            if let token = response.accessToken,
               let refresh = response.refreshToken,
               let userID = response.userID {
                session = SupabaseSession(accessToken: token, refreshToken: refresh, userID: userID)
                keychain.save(token, for: Key.access)
                keychain.save(refresh, for: Key.refresh)
                keychain.save(userID, for: Key.user)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct AuthResponse: Decodable {
    let ok: Bool
    let confirmationRequired: Bool
    let accessToken: String?
    let refreshToken: String?
    let userID: String?

    enum CodingKeys: String, CodingKey {
        case ok
        case confirmationRequired = "confirmation_required"
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case userID = "user_id"
    }
}
