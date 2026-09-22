import SwiftUI
import AVKit

/// Vibe Cinema: paste a link and the media plays immediately.
struct CinemaView: View {
    @State private var urlString = ""
    @State private var player: AVPlayer?
    @State private var youtubeID: String?

    var body: some View {
        ZStack {
            CosmicBackground()
            VStack(spacing: 16) {
                mediaZone

                HStack(spacing: 10) {
                    TextField(L10n.pasteVideoLink, text: $urlString)
                        .vibeField()
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .onSubmit { loadURL() }
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

                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 8) {
                        ForEach(["😎", "🧑‍🚀", "🦊", "🐼"], id: \.self) { emoji in
                            Text(emoji)
                                .font(.system(size: 24))
                                .frame(width: 42, height: 42)
                                .background(Circle().fill(VibeTheme.primary.opacity(0.3)))
                        }
                        Spacer()
                        Text(L10n.watchTogether)
                            .font(.footnote)
                            .foregroundStyle(VibeTheme.textMuted)
                    }
                    Text(L10n.supportsLinks)
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

    @ViewBuilder
    private var mediaZone: some View {
        if let youtubeID {
            YouTubeWebView(videoID: youtubeID)
                .frame(height: 250)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(VibeTheme.strokeStrong, lineWidth: 1)
                )
        } else if let player {
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
    }

    private func loadURL() {
        let trimmed = urlString.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }

        if let id = youtubeVideoID(from: trimmed) {
            player = nil
            youtubeID = id
        } else if let url = URL(string: trimmed) {
            youtubeID = nil
            player = AVPlayer(url: url)
            player?.play()
        }
    }

    private func youtubeVideoID(from string: String) -> String? {
        guard let url = URL(string: string), let host = url.host else { return nil }
        let isYouTube = host.contains("youtube.com") || host.contains("youtu.be")
        guard isYouTube else { return nil }

        if host.contains("youtu.be"), !url.path.isEmpty {
            return String(url.path.dropFirst())
        }
        if let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let queryItems = components.queryItems,
           let v = queryItems.first(where: { $0.name == "v" })?.value {
            return v
        }
        return nil
    }
}
