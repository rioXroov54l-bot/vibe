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
                .task { await appState.bootstrap() }
        }
    }
}
