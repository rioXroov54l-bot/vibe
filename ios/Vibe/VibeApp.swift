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
    @EnvironmentObject private var authService: AuthService

    var body: some View {
        Group {
            if let resetToken = appState.resetAccessToken {
                ResetPasswordView(accessToken: resetToken)
            } else if appState.isLoading {
                SplashView()
            } else if authService.session == nil {
                WelcomeView()
            } else if !appState.isOnboardingComplete {
                OnboardingFlowView()
            } else {
                MainTabsView()
            }
        }
        .onChange(of: authService.session?.userID) { _, _ in
            guard authService.session != nil else { return }
            appState.session = authService.session
            Task {
                try? await appState.loadProfile()
            }
        }
        .task {
            await authService.restoreSession()
            if let session = authService.session {
                appState.session = session
                try? await appState.loadProfile()
                appState.isLoading = false
            } else {
                appState.isLoading = false
            }
        }
    }
}
