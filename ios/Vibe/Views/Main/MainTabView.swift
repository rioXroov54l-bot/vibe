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
    @Namespace private var bubbleNamespace

    var body: some View {
        HStack(spacing: 0) {
            ForEach(MainTabView.Tab.allCases, id: \.rawValue) { tab in
                Button {
                    withAnimation(.spring(response: 0.42, dampingFraction: 0.72)) {
                        selected = tab
                    }
                } label: {
                    tabLabel(tab)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 9)
        .background(
            Capsule()
                .fill(.ultraThinMaterial)
                .background(Capsule().fill(.black.opacity(0.48)))
                .overlay(Capsule().stroke(.white.opacity(0.16), lineWidth: 1))
                .shadow(color: .black.opacity(0.35), radius: 18, y: 8)
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

            VStack(spacing: 3) {
                Image(systemName: tab.icon)
                    .font(.system(size: 19, weight: .semibold))
                    .symbolRenderingMode(.hierarchical)
                Text(title(for: tab))
                    .font(.caption2.weight(.semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .foregroundStyle(selected == tab ? .white : .white.opacity(0.5))
        }
        .frame(maxWidth: .infinity)
        .frame(height: 52)
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

/// Floating glass bubble indicator with an iridescent (holographic) border.
private struct GlassBubble: View {
    var body: some View {
        Capsule()
            .fill(.ultraThinMaterial)
            .background(
                Capsule().fill(
                    LinearGradient(
                        colors: [
                            Color.white.opacity(0.22),
                            Color.white.opacity(0.05),
                            Color.white.opacity(0.11)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            )
            .overlay(iridescentBorder)
            .overlay(specularHighlight)
            .shadow(color: VibeTheme.lavender.opacity(0.55), radius: 13, y: 0)
            .shadow(color: VibeTheme.primary.opacity(0.35), radius: 22, y: 0)
            .frame(width: 72, height: 50)
    }

    private var iridescentBorder: some View {
        Capsule()
            .stroke(
                AngularGradient(
                    colors: [
                        VibeTheme.lavender,
                        VibeTheme.pink,
                        VibeTheme.cyan,
                        VibeTheme.mint,
                        VibeTheme.lavender
                    ],
                    center: .center,
                    startAngle: .degrees(0),
                    endAngle: .degrees(360)
                ),
                lineWidth: 1.5
            )
    }

    private var specularHighlight: some View {
        Capsule()
            .stroke(.white.opacity(0.32), lineWidth: 0.8)
            .padding(1)
    }
}
