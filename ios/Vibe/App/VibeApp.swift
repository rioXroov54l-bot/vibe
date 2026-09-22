import SwiftUI

@main
struct VibeApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var localization = LocalizationManager.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(localization)
                .environment(\.layoutDirection, localization.layoutDirection)
                .task {
                    if ProcessInfo.processInfo.arguments.contains("-UITestAutoLogin") {
                        appState.isLoading = false
                        await appState.signIn(email: "vibe.devtest@vibeapp.dev", password: "VibeDevTest123!")
                    } else {
                        await appState.bootstrap()
                    }
                }
        }
    }
}
