import SwiftUI

struct ChatInboxView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ZStack {
                CosmicBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        Text(L10n.chat)
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)

                        if appState.rooms.isEmpty {
                            VStack(spacing: 16) {
                                Text("💬")
                                    .font(.system(size: 54))
                                Text(L10n.noConversations)
                                    .font(.headline)
                                    .foregroundStyle(VibeTheme.textSecondary)
                                Text(L10n.joinRoomToChat)
                                    .font(.subheadline)
                                    .foregroundStyle(VibeTheme.textMuted)
                                    .multilineTextAlignment(.center)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 70)
                        } else {
                            VStack(spacing: 12) {
                                ForEach(appState.rooms) { room in
                                    NavigationLink {
                                        RoomChatView(room: room)
                                    } label: {
                                        HStack(spacing: 14) {
                                            Text(room.kindEmoji)
                                                .font(.title2)
                                                .frame(width: 46, height: 46)
                                                .background(Circle().fill(VibeTheme.primary.opacity(0.3)))
                                            VStack(alignment: .leading, spacing: 3) {
                                                Text(room.title)
                                                    .font(.headline)
                                                    .foregroundStyle(.white)
                                                Text(room.categoryName)
                                                    .font(.caption)
                                                    .foregroundStyle(VibeTheme.textMuted)
                                            }
                                            Spacer()
                                            Image(systemName: "chevron.right")
                                                .font(.footnote)
                                                .foregroundStyle(VibeTheme.textMuted)
                                                .flipsForRightToLeftLayoutDirection(true)
                                        }
                                        .padding(14)
                                        .background(
                                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                                .fill(VibeTheme.surface.opacity(0.7))
                                                .overlay(RoundedRectangle(cornerRadius: 18).stroke(VibeTheme.strokeStrong, lineWidth: 1))
                                        )
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                    .padding(.bottom, 110)
                }
            }
            .toolbar(.hidden, for: .navigationBar)
        }
        .task { await appState.loadRooms() }
    }
}
