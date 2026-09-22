import SwiftUI

/// Live room stage with speakers, audience, and interactive controls.
struct RoomView: View {
    let room: Room

    @EnvironmentObject private var appState: AppState
    @Environment(\.dismiss) private var dismiss
    @State private var isMuted = false
    @State private var isHandRaised = false
    @State private var showingChat = false
    @State private var draft = ""
    @State private var reactionEmoji: String?

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

            if let reactionEmoji {
                Text(reactionEmoji)
                    .font(.system(size: 54))
                    .transition(.scale.combined(with: .opacity))
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: reactionEmoji)
                    .offset(y: -220)
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
                Text(String(format: L10n.listening, listeners.count))
                    .font(.caption)
                    .foregroundStyle(VibeTheme.mint)
            }
            Spacer()
            Button {
                leave()
            } label: {
                Text(L10n.leave)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(Capsule().fill(.red))
            }
            .contentShape(Rectangle())
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
            Text(isHost ? L10n.host : L10n.speaker)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(VibeTheme.textSecondary)
            AudioWaveView()
        }
    }

    // MARK: Audience

    private var audience: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(L10n.audience)
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
            requestButton
            controlButton(isMuted ? "mic.slash.fill" : "mic.fill", isMuted, VibeTheme.pink) {
                isMuted.toggle()
            }
            ShareLink(item: "🎙️ Join my Vibe room: \(room.title)") {
                Image(systemName: "square.and.arrow.up")
                    .font(.system(size: 19, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.7))
                    .frame(width: 40, height: 40)
                    .background(Circle().fill(.white.opacity(0.08)))
            }
            .frame(maxWidth: .infinity)
            .contentShape(Rectangle())
            controlButton("gift.fill", false, VibeTheme.mint) {
                sendReaction()
            }
            controlButton("bubble.left.fill", showingChat, VibeTheme.cyan) {
                showingChat = true
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }

    /// Black circular "Request" button that toggles to a flashing amber cue.
    private var requestButton: some View {
        let amber = Color(red: 1.0, green: 0.76, blue: 0.03) // #FFC107
        return Button {
            isHandRaised.toggle()
        } label: {
            Image(systemName: "mic.fill")
                .font(.system(size: 19, weight: .semibold))
                .foregroundStyle(isHandRaised ? .black : .white)
                .frame(width: 42, height: 42)
                .background(Circle().fill(isHandRaised ? amber : .black))
                .overlay(Circle().stroke(.white.opacity(0.2), lineWidth: 1))
                .shadow(color: isHandRaised ? amber.opacity(0.8) : .clear, radius: 9)
                .scaleEffect(isHandRaised ? 1.06 : 1.0)
                .animation(.easeInOut(duration: 0.45).repeatForever(autoreverses: true), value: isHandRaised)
        }
        .frame(maxWidth: .infinity)
        .contentShape(Rectangle())
    }

    private func controlButton(_ icon: String, _ active: Bool, _ color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(active ? .white : .white.opacity(0.7))
                .frame(width: 40, height: 40)
                .background(Circle().fill(active ? color.opacity(0.6) : .white.opacity(0.08)))
                .shadow(color: active ? color.opacity(0.6) : .clear, radius: 8)
        }
        .frame(maxWidth: .infinity)
        .contentShape(Rectangle())
    }

    private func sendReaction() {
        let emojis = ["❤️", "🎁", "✨", "💜", "🔥"]
        reactionEmoji = emojis.randomElement()
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) {
            withAnimation(.easeOut(duration: 0.3)) { reactionEmoji = nil }
        }
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
                            Text(L10n.startConversation)
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
        // Atomic teardown: remove membership, purge state, then dismiss.
        Task {
            await appState.leaveRoom(room.id)
            appState.activeRoomMessages = []
            dismiss()
        }
    }
}
