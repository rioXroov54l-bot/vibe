import SwiftUI

struct ExploreView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var localization: LocalizationManager
    @State private var showingCreate = false
    @State private var selectedFilter = "all"
    @State private var joiningRoom: Room?
    @State private var showingPreJoin = false
    @State private var activeRoom: Room?

    private let filters = ["all", "hangouts", "music", "games", "languages", "discussions"]

    private var userName: String {
        appState.profile?.displayName ?? appState.session?.user.displayName ?? "Ray"
    }

    private var allRooms: [Room] {
        var seen = Set<String>()
        var result: [Room] = []
        for room in CoreRooms.all + appState.rooms {
            if seen.insert(room.id).inserted {
                result.append(room)
            }
        }
        return result
    }

    private var filteredRooms: [Room] {
        guard selectedFilter != "all" else { return allRooms }
        return allRooms.filter { room in
            room.categoryName.lowercased().contains(selectedFilter)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                CosmicBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        header
                        featuredBanner
                        quickHubs
                        filterChips
                        roomsFeed
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 110)
                }
                .refreshable { await appState.loadRooms() }
            }
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showingCreate) {
                CreateRoomView()
                    .presentationDetents([.medium, .large])
            }
            .sheet(isPresented: $showingPreJoin) {
                if let joiningRoom {
                    PreJoinView(room: joiningRoom, memberCount: appState.memberCounts[joiningRoom.id] ?? 0) {
                        showingPreJoin = false
                        activeRoom = joiningRoom
                    }
                    .presentationDetents([.large])
                }
            }
            .fullScreenCover(item: $activeRoom) { room in
                RoomView(room: room)
            }
        }
        .task { await appState.loadRooms() }
    }

    // MARK: Header

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text("vibe ///")
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                Text("\(L10n.goodVibes), \(userName) ✨")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(VibeTheme.textSecondary)
            }

            Spacer()

            Button {
                localization.toggle()
            } label: {
                Text(L10n.languageButton)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.9))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(Capsule().fill(.white.opacity(0.1)))
            }

            Button {
                showingCreate = true
            } label: {
                Image(systemName: "plus")
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(Circle().fill(VibeTheme.primary))
                    .shadow(color: VibeTheme.primary.opacity(0.5), radius: 8)
            }
        }
    }

    // MARK: Featured banner

    private var featuredBanner: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(L10n.onSameWavelength)
                .font(.caption.weight(.black))
                .tracking(2)
                .foregroundStyle(VibeTheme.lavender)
            Text(L10n.globalWatchParty)
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
            Button {
                // join
            } label: {
                Text(L10n.joinTheNight)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10)
                    .background(Capsule().fill(.white))
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(LinearGradient(colors: [VibeTheme.primary.opacity(0.55), VibeTheme.primaryDeep.opacity(0.4)], startPoint: .topLeading, endPoint: .bottomTrailing))
                .overlay(RoundedRectangle(cornerRadius: 22).stroke(VibeTheme.lavender.opacity(0.35), lineWidth: 1))
        )
    }

    // MARK: Quick hubs

    private var quickHubs: some View {
        HStack(spacing: 10) {
            NavigationLink { RoomsView(filterKind: "flash") } label: { hubLabel("⚡", L10n.flashRooms) }
            NavigationLink { CinemaView() } label: { hubLabel("🎬", L10n.vibeCinema) }
            NavigationLink { GamesView() } label: { hubLabel("🎮", L10n.gamesRooms) }
            NavigationLink { PodcastView() } label: { hubLabel("🎙️", L10n.echoStage) }
        }
        .buttonStyle(.plain)
    }

    private func hubLabel(_ emoji: String, _ title: String) -> some View {
        VStack(spacing: 6) {
            Text(emoji).font(.system(size: 26))
            Text(title)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(VibeTheme.surface.opacity(0.7))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(VibeTheme.strokeStrong, lineWidth: 1))
        )
    }

    // MARK: Filters

    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(filters, id: \.self) { filter in
                    Button {
                        selectedFilter = filter
                    } label: {
                        Text(filterLabel(filter))
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(selectedFilter == filter ? .black : .white.opacity(0.75))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Capsule().fill(selectedFilter == filter ? .white : .white.opacity(0.08)))
                    }
                }
            }
        }
    }

    private func filterLabel(_ id: String) -> String {
        switch id {
        case "all": return L10n.all
        case "hangouts": return L10n.hangouts
        case "music": return L10n.music
        case "games": return L10n.games
        case "languages": return L10n.languages
        default: return L10n.discussions
        }
    }

    // MARK: Rooms feed

    @ViewBuilder
    private var roomsFeed: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible())], spacing: 12) {
            ForEach(filteredRooms) { room in
                ExploreRoomCard(room: room, memberCount: appState.memberCounts[room.id] ?? 0) {
                    joiningRoom = room
                    showingPreJoin = true
                }
            }
        }
    }
}

/// Rich room card for the Explore feed.
private struct ExploreRoomCard: View {
    let room: Room
    let memberCount: Int
    let onJoin: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(room.title)
                .font(.headline.weight(.bold))
                .foregroundStyle(.white)
                .lineLimit(2)
                .minimumScaleFactor(0.8)

            Text(room.categoryName)
                .font(.caption.weight(.semibold))
                .foregroundStyle(VibeTheme.lavender)

            Spacer(minLength: 8)

            HStack {
                HStack(spacing: -8) {
                    ForEach(["😎", "🦊", "🐼"], id: \.self) { emoji in
                        Text(emoji)
                            .font(.system(size: 16))
                            .frame(width: 28, height: 28)
                            .background(Circle().fill(VibeTheme.primary.opacity(0.45)))
                            .overlay(Circle().stroke(VibeTheme.surface, lineWidth: 1))
                    }
                }
                Spacer()
                HStack(spacing: 3) {
                    Image(systemName: "headphones")
                        .font(.caption2)
                    Text("\(memberCount)")
                        .font(.caption.weight(.bold))
                }
                .foregroundStyle(VibeTheme.mint)
            }

            Button(action: onJoin) {
                HStack(spacing: 6) {
                    Text(L10n.joinTheVibe)
                    Image(systemName: "arrow.right")
                        .flipsForRightToLeftLayoutDirection(true)
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.black)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 11)
                .background(Capsule().fill(.white))
            }
            .buttonStyle(PressableButtonStyle())
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 205, alignment: .topLeading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(LinearGradient(colors: [VibeTheme.primaryDeep.opacity(0.7), VibeTheme.card.opacity(0.85)], startPoint: .top, endPoint: .bottom))
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(VibeTheme.strokeStrong, lineWidth: 1))
        )
    }
}
