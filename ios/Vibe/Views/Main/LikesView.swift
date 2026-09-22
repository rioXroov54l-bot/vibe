import SwiftUI

struct LikesView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ZStack {
                CosmicBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        Text(L10n.likes)
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)

                        VStack(spacing: 16) {
                            Text("💜")
                                .font(.system(size: 54))
                            Text("No likes yet")
                                .font(.headline)
                                .foregroundStyle(VibeTheme.textSecondary)
                            Text("When someone likes your profile or room, it shows up here.")
                                .font(.subheadline)
                                .foregroundStyle(VibeTheme.textMuted)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 70)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 110)
                }
            }
            .toolbar(.hidden, for: .navigationBar)
        }
    }
}
