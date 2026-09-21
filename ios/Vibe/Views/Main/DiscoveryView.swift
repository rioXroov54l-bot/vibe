import SwiftUI

struct DiscoveryView: View {
    @EnvironmentObject private var appState: AppState

    private let features: [(emoji: String, title: String, kind: String)] = [
        ("⚡", "Flash", "flash"),
        ("🎬", "Cinema", "cinema"),
        ("🎮", "Games", "game"),
        ("🎙️", "Echo", "echo")
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                VibeTheme.backgroundGradient.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        Text("Discover")
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)

                        featureGrid

                        Text("Rooms for you")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(.white)

                        roomsFeed
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, 40)
                }
                .refreshable { await appState.loadRooms() }
            }
            .toolbar(.hidden, for: .navigationBar)
        }
        .task { await appState.loadRooms() }
    }

    private var featureGrid: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 2), spacing: 12) {
            ForEach(features, id: \.title) { feature in
                NavigationLink {
                    featureDestination(feature.kind)
                } label: {
                    VStack(alignment: .leading, spacing: 18) {
                        Text(feature.emoji).font(.system(size: 30))
                        Text(feature.title)
                            .font(.headline)
                            .foregroundStyle(.white)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .frame(height: 96)
                    .padding(.horizontal, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .fill(LinearGradient(colors: [VibeTheme.card, VibeTheme.elevated],
                                                 startPoint: .topLeading, endPoint: .bottomTrailing))
                            .overlay(RoundedRectangle(cornerRadius: 18).stroke(VibeTheme.strokeStrong, lineWidth: 1))
                    )
                }
            }
        }
    }

    @ViewBuilder
    private func featureDestination(_ kind: String) -> some View {
        switch kind {
        case "cinema": CinemaView()
        case "game": GamesView()
        case "echo": PodcastView()
        default: RoomsView(filterKind: kind)
        }
    }

    @ViewBuilder
    private var roomsFeed: some View {
        if appState.rooms.isEmpty {
            VStack(spacing: 10) {
                Text("🌙").font(.system(size: 44))
                Text("No rooms yet")
                    .font(.headline)
                    .foregroundStyle(VibeTheme.textSecondary)
                Text("Create the first room and invite your people.")
                    .font(.footnote)
                    .foregroundStyle(VibeTheme.textMuted)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 40)
        } else {
            VStack(spacing: 12) {
                ForEach(appState.rooms) { room in
                    RoomCard(room: room)
                }
            }
        }
    }
}
