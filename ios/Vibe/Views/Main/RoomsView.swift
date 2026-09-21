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
                                Text("No rooms here")
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
    @State private var kind = "voice"

    private let kinds = ["voice", "flash", "cinema", "game", "echo"]
    private let categories = ["Social", "Music", "Games", "Cinema", "Podcast"]

    var body: some View {
        NavigationStack {
            ZStack {
                VibeTheme.backgroundGradient.ignoresSafeArea()
                VStack(alignment: .leading, spacing: 18) {
                    Text("Create a room")
                        .font(.system(size: 26, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Room name").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                        TextField("e.g. Late night talk", text: $title)
                            .vibeField()
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Type").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                        Picker("Type", selection: $kind) {
                            ForEach(kinds, id: \.self) { kind in
                                Text(kind.capitalized).tag(kind)
                            }
                        }
                        .pickerStyle(.segmented)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Category").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                        Picker("Category", selection: $category) {
                            ForEach(1...5, id: \.self) { index in
                                Text(categories[index - 1]).tag(index)
                            }
                        }
                        .pickerStyle(.wheel)
                        .frame(height: 120)
                    }

                    Spacer()

                    Button {
                        Task {
                            await appState.createRoom(title: title.trimmingCharacters(in: .whitespaces), category: category, kind: kind)
                            dismiss()
                        }
                    } label: {
                        Text(appState.isBusy ? "Creating…" : "Create")
                            .vibePrimaryButton(!title.trimmingCharacters(in: .whitespaces).isEmpty && !appState.isBusy)
                    }
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || appState.isBusy)
                }
                .padding(20)
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }
}
