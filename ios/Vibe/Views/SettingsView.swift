import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            List {
                Section("Account") {
                    NavigationLink("Profile") { ProfileView() }
                    NavigationLink("Username") { UsernameEditorView() }
                }
                Section("Appearance") {
                    Text("Dark mode")
                }
                Section {
                    Button("Sign out") {
                        Task { await appState.signOut() }
                    }
                    .foregroundStyle(.red)
                }
            }
            .navigationTitle("Settings")
        }
    }
}
