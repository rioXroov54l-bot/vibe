import SwiftUI

struct RoomCard: View {
    let room: Room

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(room.kindEmoji)
                    .font(.title2)
                VStack(alignment: .leading, spacing: 2) {
                    Text(room.title)
                        .font(.headline)
                        .foregroundStyle(.white)
                    Text(room.categoryName)
                        .font(.caption)
                        .foregroundStyle(VibeTheme.textMuted)
                }
                Spacer()
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(VibeTheme.card.opacity(0.7))
                .overlay(RoundedRectangle(cornerRadius: 18).stroke(VibeTheme.strokeStrong, lineWidth: 1))
        )
    }
}

extension Room {
    var kindEmoji: String {
        switch kind {
        case "flash": return "⚡"
        case "cinema": return "🎬"
        case "game": return "🎮"
        case "echo": return "🎙️"
        default: return "🔊"
        }
    }

    var categoryName: String {
        switch category {
        case 1: return "Social"
        case 2: return "Music"
        case 3: return "Games"
        case 4: return "Cinema"
        case 5: return "Podcast"
        default: return "Social"
        }
    }
}
