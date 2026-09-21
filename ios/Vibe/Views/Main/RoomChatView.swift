import SwiftUI

struct RoomChatView: View {
    let room: Room

    @EnvironmentObject private var appState: AppState
    @State private var draft = ""

    var body: some View {
        ZStack {
            VibeTheme.backgroundGradient.ignoresSafeArea()
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(spacing: 12) {
                            if appState.activeRoomMessages.isEmpty {
                                Text("Start the conversation.")
                                    .font(.footnote)
                                    .foregroundStyle(VibeTheme.textMuted)
                                    .padding(.top, 40)
                            } else {
                                ForEach(appState.activeRoomMessages) { message in
                                    bubble(message)
                                }
                            }
                        }
                        .padding(16)
                    }
                    .onChange(of: appState.activeRoomMessages.count) { _, _ in
                        if let last = appState.activeRoomMessages.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }

                composer
            }
        }
        .navigationTitle(room.title)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await appState.joinRoom(room.id)
            await appState.loadMessages(roomId: room.id)
        }
    }

    @ViewBuilder
    private func bubble(_ message: Message) -> some View {
        let mine = message.senderId == appState.userId
        HStack {
            if mine { Spacer(minLength: 50) }
            Text(message.content)
                .font(.body)
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(mine ? VibeTheme.primary.opacity(0.55) : VibeTheme.surface)
                )
            if !mine { Spacer(minLength: 50) }
        }
    }

    private var composer: some View {
        HStack(spacing: 10) {
            TextField("Message", text: $draft, axis: .vertical)
                .lineLimit(1...4)
                .vibeField()
            Button {
                let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !text.isEmpty else { return }
                draft = ""
                Task { await appState.sendMessage(roomId: room.id, body: text) }
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(VibeTheme.lavender)
            }
            .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(VibeTheme.surface.opacity(0.6))
    }
}
