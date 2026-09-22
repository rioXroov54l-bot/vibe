import SwiftUI

struct MainTabView: View {
    enum Tab: Int, CaseIterable {
        case explore, likes, chat, profile

        var icon: String {
            switch self {
            case .explore: return "sparkles"
            case .likes: return "heart.fill"
            case .chat: return "bubble.left.and.bubble.right.fill"
            case .profile: return "person.fill"
            }
        }
    }

    @EnvironmentObject private var localization: LocalizationManager
    @State private var selectedTab: Tab = .explore

    var body: some View {
        ZStack(alignment: .bottom) {
            CosmicBackground()

            content

            GlassTabBar(selected: $selectedTab)
        }
        .ignoresSafeArea(.keyboard)
    }

    @ViewBuilder
    private var content: some View {
        switch selectedTab {
        case .explore: ExploreView()
        case .likes: LikesView()
        case .chat: ChatInboxView()
        case .profile: ProfileView()
        }
    }
}

private struct GlassTabBar: View {
    @Binding var selected: MainTabView.Tab

    var body: some View {
        HStack(spacing: 0) {
            ForEach(MainTabView.Tab.allCases, id: \.rawValue) { tab in
                Button {
                    selected = tab
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.icon)
                            .font(.system(size: 20, weight: .semibold))
                        Text(title(for: tab))
                            .font(.caption2.weight(.medium))
                    }
                    .foregroundStyle(selected == tab ? .white : .white.opacity(0.48))
                    .frame(maxWidth: .infinity)
                    .scaleEffect(selected == tab ? 1.06 : 1.0)
                    .shadow(color: selected == tab ? VibeTheme.lavender.opacity(0.7) : .clear, radius: 8)
                    .animation(.spring(response: 0.3, dampingFraction: 0.65), value: selected)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            Capsule()
                .fill(.ultraThinMaterial)
                .background(Capsule().fill(.black.opacity(0.45)))
                .overlay(Capsule().stroke(.white.opacity(0.14), lineWidth: 1))
        )
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private func title(for tab: MainTabView.Tab) -> String {
        switch tab {
        case .explore: return L10n.explore
        case .likes: return L10n.likes
        case .chat: return L10n.chat
        case .profile: return L10n.profile
        }
    }
}
