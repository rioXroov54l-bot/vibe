import SwiftUI
import AVKit

/// Vibe Cinema: shared media room with URL loading, invite, controls and chat.
struct CinemaView: View {
    @State private var urlString = ""
    @State private var player: AVPlayer?
    @State private var youtubeID: String?
    @State private var isMuted = false
    @State private var isHandRaised = false
    @State private var draft = ""
    @State private var chatMessages: [String] = []

    private let speakers = ["😎", "🧑‍🚀", "🦊"]

    var body: some View {
        ZStack {
            CosmicBackground()
            ScrollView {
                VStack(spacing: 14) {
                    mediaZone
                    urlBar
                    stageControls
                    chatZone
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 100)
            }
        }
        .navigationTitle(L10n.vibeCinema)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: Media player (priority width, top)

    @ViewBuilder
    private var mediaZone: some View {
        if let youtubeID {
            YouTubeWebView(videoID: youtubeID)
                .frame(height: 250)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(VibeTheme.strokeStrong, lineWidth: 1))
        } else if let player {
            VideoPlayer(player: player)
                .frame(height: 250)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(VibeTheme.strokeStrong, lineWidth: 1))
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

    // MARK: URL input + play + share

    private var urlBar: some View {
        HStack(spacing: 8) {
            TextField(L10n.pasteVideoLink, text: $urlString)
                .vibeField()
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .onSubmit { loadURL() }

            Button {
                loadURL()
            } label: {
                Text(L10n.play)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.black)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 13)
                    .background(Capsule().fill(.white))
            }
            .disabled(urlString.trimmingCharacters(in: .whitespaces).isEmpty)

            ShareLink(item: L10n.shareCinema + urlString) {
                Image(systemName: "square.and.arrow.up")
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 42, height: 42)
                    .background(Circle().fill(VibeTheme.primary))
            }
        }
    }

    // MARK: Stage controls + speakers

    private var stageControls: some View {
        HStack(spacing: 14) {
            ForEach(speakers, id: \.self) { emoji in
                Text(emoji)
                    .font(.system(size: 26))
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(VibeTheme.primary.opacity(0.3)))
            }
            Spacer()
            Button {
                isHandRaised.toggle()
            } label: {
                Image(systemName: isHandRaised ? "hand.raised.fill" : "hand.raised")
                    .font(.headline)
                    .foregroundStyle(isHandRaised ? .white : .white.opacity(0.7))
                    .frame(width: 42, height: 42)
                    .background(Circle().fill(isHandRaised ? VibeTheme.lavender.opacity(0.6) : .white.opacity(0.08)))
            }
            Button {
                isMuted.toggle()
            } label: {
                Image(systemName: isMuted ? "mic.slash.fill" : "mic.fill")
                    .font(.headline)
                    .foregroundStyle(isMuted ? VibeTheme.pink : .white.opacity(0.7))
                    .frame(width: 42, height: 42)
                    .background(Circle().fill(.white.opacity(0.08)))
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(VibeTheme.surface.opacity(0.7))
                .overlay(RoundedRectangle(cornerRadius: 16).stroke(VibeTheme.strokeStrong, lineWidth: 1))
        )
    }

    // MARK: Chat

    private var chatZone: some View {
        VStack(spacing: 10) {
            ScrollView {
                VStack(spacing: 10) {
                    if chatMessages.isEmpty {
                        Text(L10n.startConversation)
                            .font(.footnote)
                            .foregroundStyle(VibeTheme.textMuted)
                            .padding(.vertical, 12)
                    } else {
                        ForEach(chatMessages.indices, id: \.self) { index in
                            HStack {
                                if index % 2 == 0 { Spacer(minLength: 40) }
                                Text(chatMessages[index])
                                    .font(.body)
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 13)
                                    .padding(.vertical, 8)
                                    .background(RoundedRectangle(cornerRadius: 14).fill(index % 2 == 0 ? VibeTheme.primary.opacity(0.55) : VibeTheme.surface))
                                if index % 2 != 0 { Spacer(minLength: 40) }
                            }
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .frame(minHeight: 80, maxHeight: 180)

            HStack(spacing: 8) {
                TextField("Message", text: $draft, axis: .vertical)
                    .lineLimit(1...3)
                    .vibeField()
                Button {
                    let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !text.isEmpty else { return }
                    chatMessages.append(text)
                    draft = ""
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 30))
                        .foregroundStyle(VibeTheme.lavender)
                }
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(VibeTheme.surface.opacity(0.55))
        )
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
