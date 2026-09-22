import SwiftUI

struct RoomsView: View {
    var filterKind: String?

    @EnvironmentObject private var appState: AppState
    @State private var showingCreate = false

    private var rooms: [Room] {
        guard let filterKind else { return appState.rooms }
        return appState.rooms.filter { $0.kind == filterKind }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                VibeTheme.backgroundGradient.ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 14) {
                        if rooms.isEmpty {
                            VStack(spacing: 10) {
                                Text("🔊").font(.system(size: 44))
                                Text(L10n.noRoomsHere)
                                    .font(.headline)
                                    .foregroundStyle(VibeTheme.textSecondary)
                            }
                            .padding(.vertical, 40)
                        } else {
                            ForEach(rooms) { room in
                                NavigationLink {
                                    RoomChatView(room: room)
                                } label: {
                                    RoomCard(room: room)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 12)
                    .padding(.bottom, 40)
                }
                .refreshable { await appState.loadRooms() }
            }
            .navigationTitle(filterKind == nil ? "Rooms" : filterKind!.capitalized)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                if filterKind == nil {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            showingCreate = true
                        } label: {
                            Image(systemName: "plus")
                        }
                    }
                }
            }
            .sheet(isPresented: $showingCreate) {
                CreateRoomView()
            }
        }
        .task { await appState.loadRooms() }
    }
}

struct CreateRoomView: View {
    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var category = 1
    @State private var kind = "flash"
    @State private var isPrivate = false
    @State private var passcode = ""

    private let roomTypes: [(kind: String, emoji: String, label: String)] = [
        ("flash", "⚡", L10n.flashRooms),
        ("cinema", "🎬", L10n.vibeCinema),
        ("game", "🎮", L10n.gamesRooms),
        ("echo", "🎙️", L10n.echoStage)
    ]
    var body: some View {
        NavigationStack {
            ZStack {
                CosmicBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        Text(L10n.createRoom)
                            .font(.system(size: 26, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)

                        if let error = appState.errorMessage {
                            Text(error)
                                .font(.footnote.weight(.medium))
                                .foregroundStyle(VibeTheme.pink)
                                .multilineTextAlignment(.leading)
                        }

                        // Room type quick-select cards
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                            ForEach(roomTypes, id: \.kind) { type in
                                Button {
                                    kind = type.kind
                                } label: {
                                    HStack(spacing: 8) {
                                        Text(type.emoji).font(.title3)
                                        Text(type.label)
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundStyle(.white)
                                            .lineLimit(1)
                                            .minimumScaleFactor(0.7)
                                        Spacer()
                                    }
                                    .padding(12)
                                    .background(
                                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                                            .fill(kind == type.kind ? VibeTheme.primary.opacity(0.5) : VibeTheme.surface.opacity(0.7))
                                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(kind == type.kind ? VibeTheme.lavender : VibeTheme.strokeStrong, lineWidth: 1))
                                    )
                                }
                                .buttonStyle(.plain)
                            }
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text(L10n.roomName).font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                            TextField("e.g. Late night talk", text: $title)
                                .vibeField()
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text(L10n.category).font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                            Picker("Category", selection: $category) {
                                ForEach(1...5, id: \.self) { index in
                                    Text(L10n.categoryLabel(index)).tag(index)
                                }
                            }
                            .pickerStyle(.wheel)
                            .frame(height: 120)
                        }

                        Toggle(isOn: $isPrivate) {
                            Text(L10n.makePrivate)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.white)
                        }
                        .tint(VibeTheme.primary)

                        if isPrivate {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(L10n.passcode).font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                                TextField("1234", text: $passcode)
                                    .vibeField()
                                    .keyboardType(.numberPad)
                            }
                        }

                        Button {
                            Task {
                                await appState.createRoom(
                                    title: title.trimmingCharacters(in: .whitespaces),
                                    category: category,
                                    kind: kind,
                                    isPrivate: isPrivate,
                                    passcode: passcode
                                )
                                dismiss()
                            }
                        } label: {
                            Text(appState.isBusy ? "Creating…" : L10n.createRoom)
                                .vibePrimaryButton(!title.trimmingCharacters(in: .whitespaces).isEmpty && !appState.isBusy)
                        }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || appState.isBusy)
                    }
                    .padding(20)
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
