import SwiftUI

@main
struct VibeApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var authService = AuthService()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(authService)
                .onOpenURL { url in
                    guard url.scheme == "vibe", url.host == "reset-password" else { return }
                    let fragment = url.fragment ?? ""
                    let params = URLComponents(string: "?" + fragment)?.queryItems ?? []
                    let token = params.first(where: { $0.name == "access_token" })?.value
                    if let token {
                        appState.resetAccessToken = token
                    }
                }
        }
    }
}

private struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if let resetToken = appState.resetAccessToken {
                ResetPasswordView(accessToken: resetToken)
            } else if appState.isLoading {
                SplashView()
            } else if appState.session == nil {
                WelcomeView()
            } else if !appState.isOnboardingComplete {
                OnboardingFlowView()
            } else {
                MainTabsView()
            }
        }
        .task { await appState.restoreSession() }
    }
}
