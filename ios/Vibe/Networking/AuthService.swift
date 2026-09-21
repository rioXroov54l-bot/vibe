import Foundation

/// Result of a sign-up request. Either a session is returned immediately
/// (auto-confirm) or email confirmation is still required.
struct SignUpResult: Decodable {
    let accessToken: String?
    let refreshToken: String?
    let expiresIn: Int?
    let user: AuthUser?
    let id: String?
    let email: String?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case user, id, email
    }

    var hasSession: Bool { accessToken != nil }
}

/// Native Supabase Auth operations over URLSession.
final class AuthService {
    private let client = SupabaseClient()

    private struct SignUpBody: Encodable {
        let email: String
        let password: String
        let data: [String: String]
    }

    private struct CredentialsBody: Encodable {
        let email: String
        let password: String
    }

    private struct EmailBody: Encodable {
        let email: String
    }

    private struct VerifyBody: Encodable {
        let email: String
        let token: String
        let type: String
    }

    private struct ResendBody: Encodable {
        let email: String
        let type: String
    }

    private struct RefreshBody: Encodable {
        let refreshToken: String

        enum CodingKeys: String, CodingKey {
            case refreshToken = "refresh_token"
        }
    }

    private struct PasswordBody: Encodable {
        let password: String
    }

    private struct OTPBody: Encodable {
        let email: String
        let createUser: Bool

        enum CodingKeys: String, CodingKey {
            case email
            case createUser = "create_user"
        }
    }

    func signUp(email: String, password: String, name: String) async throws -> SignUpResult {
        try await client.send(
            "auth/v1/signup",
            method: "POST",
            body: SignUpBody(email: email, password: password, data: [
                "display_name": name,
                "community_accepted_at": ISO8601DateFormatter().string(from: Date())
            ])
        )
    }

    func signIn(email: String, password: String) async throws -> AuthSession {
        try await client.send(
            "auth/v1/token?grant_type=password",
            method: "POST",
            body: CredentialsBody(email: email, password: password)
        )
    }

    func verifyOTP(email: String, token: String) async throws -> AuthSession {
        try await client.send(
            "auth/v1/verify",
            method: "POST",
            body: VerifyBody(email: email, token: token, type: "email")
        )
    }

    func resendOTP(email: String, type: String = "signup") async throws {
        try await client.sendNoContent(
            "auth/v1/resend",
            method: "POST",
            body: ResendBody(email: email, type: type)
        )
    }

    func signInWithOTP(email: String) async throws {
        try await client.sendNoContent(
            "auth/v1/otp",
            method: "POST",
            body: OTPBody(email: email, createUser: false)
        )
    }

    func resetPasswordForEmail(email: String) async throws {
        let redirect = SupabaseConfig.resetRedirectURL
        let encoded = redirect.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? redirect
        try await client.sendNoContent(
            "auth/v1/recover?redirect_to=\(encoded)",
            method: "POST",
            body: EmailBody(email: email)
        )
    }

    func updatePassword(_ password: String, token: String) async throws {
        try await client.sendNoContent(
            "auth/v1/user",
            method: "PUT",
            token: token,
            body: PasswordBody(password: password)
        )
    }

    func signOut(token: String) async throws {
        try await client.sendNoContent(
            "auth/v1/logout?scope=local",
            method: "POST",
            token: token
        )
    }

    func refreshSession(refreshToken: String) async throws -> AuthSession {
        try await client.send(
            "auth/v1/token?grant_type=refresh_token",
            method: "POST",
            body: RefreshBody(refreshToken: refreshToken)
        )
    }

    func currentUser(token: String) async throws -> AuthUser {
        try await client.send("auth/v1/user", token: token)
    }
}
