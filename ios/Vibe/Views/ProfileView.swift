import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    Circle()
                        .fill(.thinMaterial)
                        .frame(width: 96, height: 96)
                        .overlay(Text("V").font(.largeTitle.bold()))

                    Text(appState.profile?.displayName ?? "Vibe member")
                        .font(.title.bold())

                    if let username = appState.profile?.username {
                        Text("@\(username)")
                            .foregroundStyle(.secondary)
                    }

                    Text(appState.profile?.bio ?? "Add a bio to introduce yourself.")
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                        .padding(.horizontal)
                }
                .padding()
            }
            .navigationTitle("Profile")
        }
    }
}
