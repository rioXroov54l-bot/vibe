import Foundation
import SwiftUI

@MainActor
final class AppState: ObservableObject {
    @Published var isLoading = true
    @Published var session: SupabaseSession?
    @Published var profile: VibeProfile?
    @Published var isOnboardingComplete = false
    @Published var resetAccessToken: String?

    private let supabase = SupabaseService.shared
    private let keychain = KeychainStore.shared

    func restoreSession() async {
        isLoading = true
        defer { isLoading = false }
        guard let access = keychain.read("vibe.access_token"),
              let refresh = keychain.read("vibe.refresh_token"),
              let userID = keychain.read("vibe.user_id") else {
            session = nil
            return
        }
        session = SupabaseSession(accessToken: access, refreshToken: refresh, userID: userID)
        do {
            try await loadProfile()
        } catch {
            session = nil
            isOnboardingComplete = false
        }
    }

    func loadProfile() async throws {
        guard let token = session?.accessToken else { return }
        let response: ProfileResponse = try await supabase.request(
            path: "/api/cloud/profile",
            method: "GET",
            token: token
        )
        var loadedProfile = response.profile
        loadedProfile.username = response.account?.username ?? response.profile.username
        profile = loadedProfile
        isOnboardingComplete = true
    }

    func signOut() async {
        try? await supabase.requestNoContent(
            path: "/api/cloud/auth/logout",
            method: "POST",
            token: session?.accessToken
        )
        session = nil
        profile = nil
        isOnboardingComplete = false
    }

    private struct ProfileResponse: Decodable {
        let profile: VibeProfile
        let account: AccountProfile?
    }

    private struct AccountProfile: Decodable {
        let username: String?
    }
}
