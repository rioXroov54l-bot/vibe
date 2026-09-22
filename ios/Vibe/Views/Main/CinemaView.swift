import SwiftUI
import AVKit

/// Vibe Cinema: shared media room with URL loading and a chat zone.
struct CinemaView: View {
    @State private var urlString = ""
    @State private var player: AVPlayer?

    var body: some View {
        ZStack {
            CosmicBackground()
            VStack(spacing: 16) {
                // Upper zone: player
                if let player {
                    VideoPlayer(player: player)
                        .frame(height: 250)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .stroke(VibeTheme.strokeStrong, lineWidth: 1)
                        )
                } else {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(VibeTheme.card.opacity(0.7))
                        .frame(height: 250)
                        .overlay(
                            VStack(spacing: 12) {
                                Image(systemName: "film.stack")
                                    .font(.system(size: 52))
                                    .foregroundStyle(VibeTheme.lavender)
                                Text(L10n.vibeCinema)
                                    .font(.headline)
                                    .foregroundStyle(.white)
                            }
                        )
                }

                // URL input
                HStack(spacing: 10) {
                    TextField(L10n.pasteVideoLink, text: $urlString)
                        .vibeField()
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                    Button {
                        loadURL()
                    } label: {
                        Text(L10n.play)
                            .font(.headline.weight(.semibold))
                            .foregroundStyle(.black)
                            .padding(.horizontal, 18)
                            .padding(.vertical, 14)
                            .background(Capsule().fill(.white))
                    }
                    .disabled(urlString.trimmingCharacters(in: .whitespaces).isEmpty)
                }

                // Lower zone: participants + chat hint
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 8) {
                        ForEach(["😎", "🧑‍🚀", "🦊", "🐼"], id: \.self) { emoji in
                            Text(emoji)
                                .font(.system(size: 24))
                                .frame(width: 42, height: 42)
                                .background(Circle().fill(VibeTheme.primary.opacity(0.3)))
                        }
                        Spacer()
                        Text("Watch together")
                            .font(.footnote)
                            .foregroundStyle(VibeTheme.textMuted)
                    }
                    Text("Supports direct MP4 / HLS video URLs. YouTube and Vimeo links are not yet playable natively.")
                        .font(.caption)
                        .foregroundStyle(VibeTheme.textMuted)
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(VibeTheme.surface.opacity(0.7))
                        .overlay(RoundedRectangle(cornerRadius: 18).stroke(VibeTheme.strokeStrong, lineWidth: 1))
                )

                Spacer()
            }
            .padding(20)
            .padding(.bottom, 90)
        }
        .navigationTitle(L10n.vibeCinema)
        .navigationBarTitleDisplayMode(.inline)
    }

    private func loadURL() {
        let trimmed = urlString.trimmingCharacters(in: .whitespaces)
        guard let url = URL(string: trimmed) else { return }
        player = AVPlayer(url: url)
        player?.play()
    }
}
