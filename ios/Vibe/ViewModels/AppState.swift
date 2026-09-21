import Foundation
import SwiftUI

enum AuthFlow: Equatable {
    case welcome
    case login
    case signup
    case otp(email: String, mode: OTPStep)
    case forgotPassword
    case resetPassword

    enum OTPStep: Equatable {
        case signup
        case login
    }
}

@MainActor
final class AppState: ObservableObject {
    @Published var session: AuthSession?
    @Published var profile: Profile?
    @Published var isLoading = true
    @Published var isBusy = false
    @Published var errorMessage: String?
    @Published var notice: String?
    @Published var authFlow: AuthFlow = .welcome
    @Published var isAuthenticated = false
    @Published var needsOnboarding = false
    @Published var recoveryTokenHash: String?
    @Published var rooms: [Room] = []
    @Published var activeRoomMessages: [Message] = []

    private let auth = AuthService()
    private let data = DataService()

    var userId: String? { session?.user.id ?? profile?.id }

    /// Restore a previous session from the Keychain on launch.
    func bootstrap() async {
        isLoading = true
        defer { isLoading = false }

        guard let tokens = SessionManager.shared.load() else {
            return
        }
        let accessToken = tokens.accessToken
        let refreshToken = tokens.refreshToken

        // Validate the cached access token; refresh it if it has expired.
        if let user = try? await auth.currentUser(token: accessToken) {
            let session = AuthSession(accessToken: accessToken, refreshToken: refreshToken, expiresIn: 3600, user: user)
            await completeAuthentication(session: session)
            return
        }

        if let refreshed = try? await auth.refreshSession(refreshToken: refreshToken) {
            persist(session: refreshed)
            await completeAuthentication(session: refreshed)
        } else {
            clearSession()
        }
    }

    // MARK: Auth actions

    func signUp(email: String, password: String, name: String) async {
        await run {
            let result = try await self.auth.signUp(email: email, password: password, name: name)
            if result.hasSession, let token = result.accessToken {
                let session = AuthSession(
                    accessToken: token,
                    refreshToken: result.refreshToken ?? "",
                    expiresIn: result.expiresIn ?? 3600,
                    user: result.user ?? AuthUser(id: result.id ?? "", email: email, userMetadata: nil)
                )
                self.persist(session: session)
                await self.completeAuthentication(session: session)
            } else {
                self.authFlow = .otp(email: email, mode: .signup)
            }
        }
    }

    func signIn(email: String, password: String) async {
        await run {
            let session = try await self.auth.signIn(email: email, password: password)
            self.persist(session: session)
            await self.completeAuthentication(session: session)
        }
    }

    func verifyOTP(email: String, token: String) async {
        await run {
            let session = try await self.auth.verifyOTP(email: email, token: token)
            self.persist(session: session)
            await self.completeAuthentication(session: session)
        }
    }

    func resendOTP(email: String, mode: AuthFlow.OTPStep) async {
        await run {
            try await self.auth.resendOTP(email: email, type: mode == .signup ? "signup" : "email")
            self.notice = "A new code has been sent to your email."
        }
    }

    func signInWithOTP(email: String) async {
        await run {
            try await self.auth.signInWithOTP(email: email)
            self.authFlow = .otp(email: email, mode: .login)
        }
    }

    func resetPasswordForEmail(email: String) async {
        await run {
            try await self.auth.resetPasswordForEmail(email: email)
            self.notice = "If that email is registered, a reset link has been sent."
        }
    }

    func updatePassword(_ password: String) async {
        await run {
            guard let token = self.session?.accessToken else {
                throw SupabaseError(message: "Your recovery session has expired. Request a new link.", code: "invalid_session", status: 401)
            }
            try await self.auth.updatePassword(password, token: token)
            self.clearSession()
            self.authFlow = .login
            self.notice = "Password updated. Sign in with your new password."
        }
    }

    func signOut() async {
        if let token = session?.accessToken {
            try? await auth.signOut(token: token)
        }
        clearSession()
    }

    /// Handle an incoming recovery deep link (vibe://reset-password#access_token=…).
    func handleDeepLink(_ url: URL) {
        guard url.scheme == "vibe" else { return }
        let fragment = url.fragment ?? url.query ?? ""
        var components = URLComponents()
        components.query = fragment
        guard let items = components.queryItems else { return }
        var dict: [String: String] = [:]
        for item in items {
            if let value = item.value {
                dict[item.name] = value
            }
        }
        guard let accessToken = dict["access_token"], let refreshToken = dict["refresh_token"] else { return }

        // Establish a recovery session so ResetPasswordView can update the password.
        let placeholder = AuthUser(id: "", email: nil, userMetadata: nil)
        session = AuthSession(accessToken: accessToken, refreshToken: refreshToken, expiresIn: 3600, user: placeholder)
        persist(session: session!)
        isAuthenticated = false
        authFlow = .resetPassword
        needsOnboarding = false
    }

    // MARK: Session + profile

    private func completeAuthentication(session: AuthSession) async {
        self.session = session
        self.isAuthenticated = true
        self.errorMessage = nil
        self.notice = nil

        do {
            let profile = try await data.fetchProfile(id: session.user.id, token: session.accessToken)
            self.profile = profile
            let prefs = try? await data.fetchPreferences(userId: session.user.id, token: session.accessToken)
            self.needsOnboarding = !(prefs?.onboardingCompleted ?? false)
            self.authFlow = .welcome
        } catch {
            // A brand-new account has no profile row yet; onboarding is required.
            self.profile = nil
            self.needsOnboarding = true
            self.authFlow = .welcome
        }
    }

    func saveOnboarding(nature: [Int], interests: [Int], types: [Int], bio: String, emoji: String) async {
        await run {
            guard let session = self.session else { return }
            let id = session.user.id
            let name: String
            if let existing = self.profile?.displayName, !existing.isEmpty {
                name = existing
            } else if !session.user.displayName.isEmpty {
                name = session.user.displayName
            } else {
                name = "Vibe member"
            }
            let dataPayload: [String: JSONValue] = [
                "emoji": .string(emoji),
                "avatar": .string(self.profile?.avatarPath ?? ""),
                "gallery": .array([]),
                "link": .string(""),
                "prompts": .array([]),
                "useGallery": .bool(false)
            ]
            try await self.data.upsertProfile(id: id, displayName: name, bio: bio, data: dataPayload, token: session.accessToken)
            try await self.data.upsertPreferences(
                userId: id,
                selectedInterests: interests,
                personalityAnswers: types,
                completed: true,
                token: session.accessToken
            )
            let profile = Profile(id: id, displayName: name, bio: bio, data: dataPayload)
            self.profile = profile
            self.needsOnboarding = false
        }
    }

    // MARK: Social

    func loadRooms() async {
        guard let token = session?.accessToken else { return }
        do {
            rooms = try await data.fetchRooms(token: token)
        } catch {
            // Non-fatal: keep the last-known list.
        }
    }

    func createRoom(title: String, category: Int, kind: String) async {
        guard let token = session?.accessToken, let id = userId else { return }
        await run {
            _ = try await self.data.createRoom(ownerId: id, title: title, category: category, kind: kind, token: token)
            await self.loadRooms()
        }
    }

    func joinRoom(_ roomId: String) async {
        guard let token = session?.accessToken, let id = userId else { return }
        do {
            try await data.joinRoom(roomId: roomId, userId: id, token: token)
        } catch {
            // Membership may already exist; ignore duplicate-join errors.
        }
    }

    func loadMessages(roomId: String) async {
        guard let token = session?.accessToken else { return }
        do {
            activeRoomMessages = try await data.fetchMessages(roomId: roomId, token: token).reversed()
        } catch {
            activeRoomMessages = []
        }
    }

    func sendMessage(roomId: String, body: String) async {
        guard let token = session?.accessToken, let id = userId else { return }
        await run {
            let message = try await self.data.sendRoomMessage(authorId: id, roomId: roomId, body: body, token: token)
            self.activeRoomMessages.append(message)
        }
    }

    // MARK: Helpers

    private func persist(session: AuthSession) {
        SessionManager.shared.save(session)
    }

    private func clearSession() {
        session = nil
        profile = nil
        isAuthenticated = false
        needsOnboarding = false
        authFlow = .welcome
        SessionManager.shared.clear()
    }

    /// Run an async task, showing a busy state and surfacing errors.
    private func run(_ operation: @escaping () async throws -> Void) async {
        isBusy = true
        errorMessage = nil
        notice = nil
        defer { isBusy = false }
        do {
            try await operation()
        } catch {
            errorMessage = (error as? SupabaseError)?.message ?? error.localizedDescription
        }
    }
}
