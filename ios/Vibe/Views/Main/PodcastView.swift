import SwiftUI

/// Audio-room surface. Live multi-user voice streaming is not wired yet, so
/// this presents the room intent clearly and plays a local demo stream when
/// available.
struct PodcastView: View {
    private let episodes = [
        ("🎙️", "Late Night Talks", "12 min"),
        ("🎧", "Vibe Stories", "18 min"),
        ("🌙", "Midnight Sessions", "9 min"),
        ("💜", "On the Same Wavelength", "15 min")
    ]

    var body: some View {
        ZStack {
            VibeTheme.backgroundGradient.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Podcast")
                        .font(.system(size: 30, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    VStack(alignment: .leading, spacing: 12) {
                        Text("🔴 Live voice streaming is not enabled yet")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(VibeTheme.pink)
                        Text("Audio rooms are coming soon. Explore the demo episodes below.")
                            .font(.footnote)
                            .foregroundStyle(VibeTheme.textMuted)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 18).fill(VibeTheme.card.opacity(0.7)))

                    VStack(spacing: 12) {
                        ForEach(episodes, id: \.0) { episode in
                            episodeRow(episode)
                        }
                    }
                }
                .padding(20)
            }
        }
        .navigationTitle("Podcast")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func episodeRow(_ episode: (String, String, String)) -> some View {
        HStack(spacing: 14) {
            Text(episode.0).font(.title2)
            VStack(alignment: .leading, spacing: 4) {
                Text(episode.1)
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(episode.2)
                    .font(.caption)
                    .foregroundStyle(VibeTheme.textMuted)
            }
            Spacer()
            Image(systemName: "play.circle.fill")
                .font(.title)
                .foregroundStyle(VibeTheme.lavender)
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(VibeTheme.surface))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(VibeTheme.strokeStrong, lineWidth: 1))
    }
}
