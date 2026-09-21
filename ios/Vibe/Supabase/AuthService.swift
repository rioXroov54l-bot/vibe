import Foundation

@MainActor
final class AuthService: ObservableObject {
    @Published var session: SupabaseSession?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var pendingEmail: String?
    @Published var needsVerification = false

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
        print("Signup button pressed")
        print("Calling Supabase signup")
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let body = try JSONSerialization.data(withJSONObject: [
                "email": email,
                "password": password,
                "data": ["display_name": displayName]
            ])
            let _: SupabaseSignupResponse = try await backend.supabaseRequest(
                path: "/auth/v1/signup",
                method: "POST",
                body: body
            )
            pendingEmail = email
            needsVerification = true
            print("OTP email sent")
        } catch {
            errorMessage = error.localizedDescription
            print("Signup failed: \(error.localizedDescription)")
        }
    }

    func signIn(email: String, password: String) async {
        print("Signin button pressed")
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let body = try JSONEncoder().encode(["email": email, "password": password])
            let tokens: AuthTokenResponse = try await backend.supabaseRequest(
                path: "/auth/v1/token?grant_type=password",
                method: "POST",
                body: body
            )
            store(tokens)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func verifyOTP(email: String, token: String, kind: String = "signup") async {
        print("OTP verification started")
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let body = try JSONEncoder().encode(["email": email, "token": token, "type": "email"])
            let tokens: AuthTokenResponse = try await backend.supabaseRequest(
                path: "/auth/v1/verify",
                method: "POST",
                body: body
            )
            store(tokens)
            needsVerification = false
            pendingEmail = nil
            print("Signup completed")
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func requestRecovery(email: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let body = try JSONEncoder().encode([
                "email": email,
                "redirect_to": "vibe://reset-password"
            ])
            try await backend.supabaseRequestNoContent(path: "/auth/v1/recover", method: "POST", body: body)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func resendOTP(email: String, kind: String = "signup") async {
        print("Resend OTP requested")
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let body = try JSONEncoder().encode(["email": email, "type": kind])
            try await backend.supabaseRequestNoContent(path: "/auth/v1/resend", method: "POST", body: body)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func updatePassword(_ password: String, accessToken: String) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            let body = try JSONEncoder().encode(["password": password])
            try await backend.supabaseRequestNoContent(path: "/auth/v1/user", method: "PUT", body: body, token: accessToken)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func signOut() async {
        if let token = session?.accessToken {
            try? await backend.requestNoContent(
                path: "/api/cloud/auth/logout",
                method: "POST",
                token: token
            )
        }
        session = nil
        keychain.delete(Key.access)
        keychain.delete(Key.refresh)
        keychain.delete(Key.user)
    }

    func refreshSession() async {
        guard let refresh = keychain.read(Key.refresh) else { return }
        do {
            let tokens = try await backend.refreshSupabaseToken(refreshToken: refresh)
            session = SupabaseSession(
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                userID: tokens.user.id
            )
            keychain.save(tokens.accessToken, for: Key.access)
            keychain.save(tokens.refreshToken, for: Key.refresh)
            keychain.save(tokens.user.id, for: Key.user)
        } catch {
            session = nil
        }
    }

    private func store(_ tokens: AuthTokenResponse) {
        session = SupabaseSession(accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, userID: tokens.user.id)
        keychain.save(tokens.accessToken, for: Key.access)
        keychain.save(tokens.refreshToken, for: Key.refresh)
        keychain.save(tokens.user.id, for: Key.user)
    }
}

private struct SupabaseSignupResponse: Decodable {
    let id: String
    let email: String?
}
