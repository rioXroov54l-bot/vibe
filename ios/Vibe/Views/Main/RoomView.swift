import SwiftUI

/// Live room stage with speakers, audience, and interactive controls.
struct RoomView: View {
    let room: Room

    @EnvironmentObject private var appState: AppState
    @State private var isMuted = false
    @State private var isHandRaised = false
    @State private var showingChat = false
    @State private var draft = ""

    private let speakers = ["😎", "🧑‍🚀", "🦊"]
    private let listeners = ["🐼", "🐱", "👾", "🧙", "🌙", "🎧", "✨", "🪩", "🎤", "💜", "🔥", "🎶"]

    var body: some View {
        ZStack {
            CosmicBackground()

            VStack(spacing: 0) {
                header
                ScrollView {
                    VStack(spacing: 22) {
                        stage
                        audience
                    }
                    .padding(20)
                }
                controlBar
            }
        }
        .navigationTitle(room.title)
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showingChat) {
            chatDrawer
        }
        .task {
            await appState.joinRoom(room.id)
            await appState.loadMessages(roomId: room.id)
        }
    }

    // MARK: Header

    private var header: some View {
        HStack {
            Text(room.kindEmoji).font(.title2)
            VStack(alignment: .leading, spacing: 2) {
                Text(room.title)
                    .font(.headline)
                    .foregroundStyle(.white)
                Text("\(listeners.count) listening")
                    .font(.caption)
                    .foregroundStyle(VibeTheme.mint)
            }
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    // MARK: Stage (speakers)

    private var stage: some View {
        VStack(spacing: 16) {
            HStack(spacing: 18) {
                ForEach(Array(speakers.enumerated()), id: \.offset) { index, emoji in
                    speakerAvatar(emoji, isHost: index == 0)
                }
            }
        }
        .padding(.vertical, 22)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(VibeTheme.card.opacity(0.55))
                .overlay(RoundedRectangle(cornerRadius: 24).stroke(VibeTheme.lavender.opacity(0.25), lineWidth: 1))
        )
    }

    private func speakerAvatar(_ emoji: String, isHost: Bool) -> some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(isHost ? VibeTheme.lavender : VibeTheme.primary.opacity(0.5), lineWidth: 2)
                    .frame(width: 72, height: 72)
                Text(emoji)
                    .font(.system(size: 38))
                    .frame(width: 62, height: 62)
                    .background(Circle().fill(VibeTheme.primary.opacity(0.3)))
                if isHost {
                    Text("👑")
                        .font(.system(size: 18))
                        .offset(x: 24, y: -28)
                }
            }
            Text(isHost ? "Host" : "Speaker")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(VibeTheme.textSecondary)
        }
    }

    // MARK: Audience

    private var audience: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Audience")
                .font(.headline.weight(.semibold))
                .foregroundStyle(.white)
            FlowLayout(spacing: 10) {
                ForEach(listeners, id: \.self) { emoji in
                    Text(emoji)
                        .font(.system(size: 28))
                        .frame(width: 52, height: 52)
                        .background(Circle().fill(VibeTheme.surface.opacity(0.8)))
                }
            }
        }
    }

    // MARK: Control bar

    private var controlBar: some View {
        HStack(spacing: 0) {
            controlButton(isHandRaised ? "hand.raised.fill" : "hand.raised", isHandRaised, VibeTheme.lavender) {
                isHandRaised.toggle()
            }
            controlButton(isMuted ? "mic.slash.fill" : "mic.fill", isMuted, VibeTheme.pink) {
                isMuted.toggle()
            }
            controlButton("gift.fill", false, VibeTheme.mint) {
                // send gift
            }
            controlButton("bubble.left.fill", showingChat, VibeTheme.cyan) {
                showingChat = true
            }
            Button {
                leave()
            } label: {
                Text(L10n.leave)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Capsule().fill(.white))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    private func controlButton(_ icon: String, _ active: Bool, _ color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(active ? .white : .white.opacity(0.7))
                .frame(width: 46, height: 46)
                .background(Circle().fill(active ? color.opacity(0.6) : .white.opacity(0.08)))
                .shadow(color: active ? color.opacity(0.6) : .clear, radius: 8)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: Chat drawer

    private var chatDrawer: some View {
        ZStack {
            CosmicBackground()
            VStack(spacing: 0) {
                Text(L10n.roomChat)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(.white)
                    .padding(.vertical, 16)

                ScrollView {
                    VStack(spacing: 12) {
                        if appState.activeRoomMessages.isEmpty {
                            Text("Start the conversation.")
                                .font(.footnote)
                                .foregroundStyle(VibeTheme.textMuted)
                                .padding(.top, 40)
                        } else {
                            ForEach(appState.activeRoomMessages) { message in
                                HStack {
                                    if message.senderId == appState.userId { Spacer(minLength: 40) }
                                    Text(message.content)
                                        .font(.body)
                                        .foregroundStyle(.white)
                                        .padding(.horizontal, 14)
                                        .padding(.vertical, 9)
                                        .background(RoundedRectangle(cornerRadius: 16).fill(message.senderId == appState.userId ? VibeTheme.primary.opacity(0.55) : VibeTheme.surface))
                                    if message.senderId != appState.userId { Spacer(minLength: 40) }
                                }
                            }
                        }
                    }
                    .padding(16)
                }

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
                            .font(.system(size: 30))
                            .foregroundStyle(VibeTheme.lavender)
                    }
                }
                .padding(12)
            }
        }
    }

    private func leave() {
        // In a real app this would notify the server; here we just pop back.
    }
}
