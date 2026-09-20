import Foundation
import SwiftUI

@MainActor
final class AppState: ObservableObject {
    @Published var isLoading = true
    @Published var session: SupabaseSession?
    @Published var profile: VibeProfile?
    @Published var isOnboardingComplete = false

    private let supabase = SupabaseService.shared

    func restoreSession() async {
        isLoading = true
        defer { isLoading = false }
        do {
            session = try await supabase.restoreSession()
            if session != nil {
                try await loadProfile()
            }
        } catch {
            session = nil
        }
    }

    func loadProfile() async throws {
        guard let token = session?.accessToken else { return }
        let result: VibeProfile = try await supabase.request(
            path: "/api/cloud/profile",
            method: "GET",
            token: token
        )
        profile = result
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
}
