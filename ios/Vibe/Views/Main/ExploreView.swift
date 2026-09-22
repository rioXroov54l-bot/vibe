import SwiftUI

struct ExploreView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var localization: LocalizationManager
    @State private var showingCreate = false
    @State private var selectedFilter = "all"
    @State private var joiningRoom: Room?
    @State private var showingPreJoin = false
    @State private var activeRoom: Room?
    @State private var pendingPrivateRoom: Room?
    @State private var showingPasscode = false

    private let filters = ["all", "sessions", "music", "games", "languages", "discussions"]

    private var userName: String {
        appState.profile?.displayName ?? appState.session?.user.displayName ?? "Ray"
    }

    private var anchorRooms: [Room] {
        CoreRooms.all
    }

    private var dynamicRooms: [Room] {
        let coreIDs = Set(CoreRooms.all.map(\.id))
        return appState.rooms.filter { !coreIDs.contains($0.id) }
    }

    private var filteredRooms: [Room] {
        guard selectedFilter != "all" else { return dynamicRooms }
        return dynamicRooms.filter { $0.filterKey == selectedFilter }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                CosmicBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        header
                        featuredBanner
                        anchorRoomsSection
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
            .sheet(isPresented: $showingPasscode) {
                if let pendingPrivateRoom {
                    PasscodeSheet(room: pendingPrivateRoom) {
                        showingPasscode = false
                        joiningRoom = pendingPrivateRoom
                        showingPreJoin = true
                    }
                    .presentationDetents([.height(320)])
                }
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

    // MARK: Anchor rooms

    private var anchorRoomsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L10n.anchorRooms)
                .font(.headline.weight(.bold))
                .foregroundStyle(.white)
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible())], spacing: 12) {
                ForEach(anchorRooms) { room in
                    ExploreRoomCard(room: room, memberCount: appState.memberCounts[room.id] ?? 0) {
                        if room.isPrivate {
                            pendingPrivateRoom = room
                            showingPasscode = true
                        } else {
                            joiningRoom = room
                            showingPreJoin = true
                        }
                    }
                }
            }
        }
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
        case "sessions": return L10n.sessions
        case "music": return L10n.music
        case "games": return L10n.games
        case "languages": return L10n.languages
        default: return L10n.discussions
        }
    }

    // MARK: Rooms feed

    @ViewBuilder
    private var roomsFeed: some View {
        VStack(alignment: .leading, spacing: 12) {
            if filteredRooms.isEmpty {
                Text(L10n.noRoomsRightNow)
                    .font(.footnote)
                    .foregroundStyle(VibeTheme.textMuted)
                    .padding(.vertical, 12)
            } else {
                LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible())], spacing: 12) {
                    ForEach(filteredRooms) { room in
                        ExploreRoomCard(room: room, memberCount: appState.memberCounts[room.id] ?? 0) {
                            if room.isPrivate {
                                pendingPrivateRoom = room
                                showingPasscode = true
                            } else {
                                joiningRoom = room
                                showingPreJoin = true
                            }
                        }
                    }
                }
            }
        }
        .animation(.easeInOut(duration: 0.28), value: selectedFilter)
    }
}

/// Rich room card for the Explore feed.
private struct ExploreRoomCard: View {
    let room: Room
    let memberCount: Int
    let onJoin: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 6) {
                Text(room.title)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)
                Spacer(minLength: 0)
                if room.isPrivate {
                    Image(systemName: "lock.fill")
                        .font(.caption)
                        .foregroundStyle(Color(red: 1.0, green: 0.76, blue: 0.03)) // #FFC107
                }
            }

            Text(room.categoryName)
                .font(.caption2.weight(.bold))
                .foregroundStyle(VibeTheme.lavender)
                .padding(.horizontal, 9)
                .padding(.vertical, 4)
                .background(Capsule().fill(VibeTheme.primary.opacity(0.3)))

            Spacer(minLength: 8)

            HStack {
                HStack(spacing: -8) {
                    ForEach(["😎", "🦊", "🐼", "🐱"], id: \.self) { emoji in
                        Text(emoji)
                            .font(.system(size: 14))
                            .frame(width: 26, height: 26)
                            .background(Circle().fill(VibeTheme.primary.opacity(0.5)))
                            .overlay(Circle().stroke(VibeTheme.primaryDark, lineWidth: 1.5))
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
                    Text(L10n.joinRoom)
                    Image(systemName: "arrow.forward")
                        .font(.caption.weight(.bold))
                        .flipsForRightToLeftLayoutDirection(true)
                }
                .padding(.horizontal, 8)
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
                .fill(LinearGradient(
                    colors: [
                        Color(red: 46/255, green: 26/255, blue: 71/255),   // #2E1A47
                        Color(red: 21/255, green: 8/255, blue: 36/255)     // #150824
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                ))
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(VibeTheme.strokeStrong, lineWidth: 1))
        )
    }
}
