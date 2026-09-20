import SwiftUI

struct UsernameEditorView: View {
    @EnvironmentObject private var appState: AppState
    @State private var username = ""
    @State private var available: Bool?

    var body: some View {
        Form {
            Section("Username") {
                TextField("username", text: $username)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                if let available {
                    Label(available ? "Available" : "Already taken", systemImage: available ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundStyle(available ? .green : .red)
                }
            }
        }
    }
}
