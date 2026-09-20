import SwiftUI

@main
struct VibeApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
        }
    }
}

private struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if appState.isLoading {
                SplashView()
            } else if appState.session == nil {
                WelcomeView()
            } else if !appState.isOnboardingComplete {
                OnboardingView()
            } else {
                MainTabView()
            }
        }
        .task { await appState.restoreSession() }
    }
}
