import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var appState: AppState

    private let interestEmojis = ["🎵", "🎬", "🎮", "✈️", "🍔", "🏋️", "📸", "🎨", "💻", "📚", "⚽", "👗"]
    private let interestNames = ["Music", "Movies", "Gaming", "Travel", "Food", "Fitness", "Photography", "Art", "Technology", "Books", "Sports", "Fashion"]

    var body: some View {
        NavigationStack {
            ZStack {
                VibeTheme.backgroundGradient.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 24) {
                        header
                        interestsSection
                        actionsSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, 40)
                }
            }
            .toolbar(.hidden, for: .navigationBar)
        }
    }

    private var header: some View {
        VStack(spacing: 14) {
            Text(appState.profile?.emoji ?? "😎")
                .font(.system(size: 72))
                .padding(18)
                .background(
                    Circle()
                        .fill(VibeTheme.primary.opacity(0.25))
                        .overlay(Circle().stroke(VibeTheme.lavender.opacity(0.5), lineWidth: 2))
                )
                .shadow(color: VibeTheme.primary.opacity(0.5), radius: 20)

            VStack(spacing: 4) {
                Text(appState.profile?.displayName ?? appState.session?.user.displayName ?? "Vibe member")
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text(appState.session?.user.email ?? "")
                    .font(.subheadline)
                    .foregroundStyle(VibeTheme.textSecondary)
            }

            if let bio = appState.profile?.bio, !bio.isEmpty {
                Text(bio)
                    .font(.body)
                    .foregroundStyle(VibeTheme.textSecondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    @ViewBuilder
    private var interestsSection: some View {
        let interests = appState.profile?.interests ?? []
        if !interests.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                Text(L10n.interests)
                    .font(.title3.weight(.bold))
                    .foregroundStyle(.white)
                FlowLayout(spacing: 8) {
                    ForEach(interests, id: \.self) { id in
                        HStack(spacing: 6) {
                            Text(interestEmojis[safe: id] ?? "✨")
                            Text(interestNames[safe: id] ?? "")
                        }
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Capsule().fill(VibeTheme.primary.opacity(0.28)))
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var actionsSection: some View {
        VStack(spacing: 12) {
            Button {
                Task { await appState.signOut() }
            } label: {
                Text(L10n.signOut)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(VibeTheme.pink)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .stroke(VibeTheme.pink.opacity(0.5), lineWidth: 1.5)
                    )
            }
        }
    }
}
