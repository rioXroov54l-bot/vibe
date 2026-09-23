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

            ZStack {
                content
                    .id(selectedTab)
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing).combined(with: .opacity),
                        removal: .scale(scale: 0.96).combined(with: .opacity)
                    ))
            }
            .animation(.spring(response: 0.36, dampingFraction: 0.86), value: selectedTab)

            LiquidGlassTabBar(selected: $selectedTab)
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

private struct LiquidGlassTabBar: View {
    @Binding var selected: MainTabView.Tab
    @EnvironmentObject private var localization: LocalizationManager
    @Namespace private var bubbleNamespace

    var body: some View {
        HStack(spacing: 0) {
            ForEach(MainTabView.Tab.allCases, id: \.rawValue) { tab in
                Button {
                    withAnimation(.spring(response: 0.5, dampingFraction: 0.78)) {
                        selected = tab
                    }
                } label: {
                    tabLabel(tab)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(
            Capsule()
                .fill(.regularMaterial)
                .overlay(Capsule().fill(Color.white.opacity(0.05)))
                .overlay(Capsule().stroke(Color.white.opacity(0.22), lineWidth: 1))
                .clipShape(Capsule())
                .shadow(color: .black.opacity(0.45), radius: 20, y: 10)
        )
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
    }

    private func tabLabel(_ tab: MainTabView.Tab) -> some View {
        ZStack {
            if selected == tab {
                GlassBubble()
                    .matchedGeometryEffect(id: "liquid-bubble", in: bubbleNamespace)
            }

            VStack(spacing: 4) {
                Image(systemName: tab.icon)
                    .font(.system(size: 20, weight: .semibold))
                    .symbolRenderingMode(.hierarchical)
                Text(title(for: tab))
                    .font(.caption2.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .foregroundStyle(selected == tab ? .white : .white.opacity(0.52))
        }
        .frame(maxWidth: .infinity)
        .frame(height: 54)
        .contentShape(Rectangle())
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

/// Floating frosted-glass bubble indicator that slides between tabs.
private struct GlassBubble: View {
    var body: some View {
        Capsule()
            .fill(.ultraThinMaterial)
            .overlay(
                Capsule().fill(
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.28),
                            Color.white.opacity(0.06)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            )
            .overlay(
                Capsule().stroke(
                LinearGradient(
                    colors: [
                        Color.white.opacity(0.55),
                        Color.white.opacity(0.16),
                        VibeTheme.lavender.opacity(0.35)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ),
                lineWidth: 1.2
            )
            )
            .shadow(color: VibeTheme.lavender.opacity(0.5), radius: 10, y: 0)
            .frame(width: 76, height: 48)
    }
}
