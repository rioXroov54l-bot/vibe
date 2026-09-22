import SwiftUI

/// Full-screen pre-join preview with an anonymous listening option.
struct PreJoinView: View {
    let room: Room
    let memberCount: Int
    let onStart: () -> Void

    @State private var listenAnonymously = true

    private let speakers: [(emoji: String, name: String, role: String)] = [
        ("😎", "Ray", "Host"),
        ("🧑‍🚀", "Sam", "Co-host"),
        ("🦊", "Alex", "Speaker")
    ]

    var body: some View {
        ZStack {
            CosmicBackground()
            ScrollView {
                VStack(spacing: 24) {
                    header
                    speakersGrid
                    anonymousToggle
                    startButton
                }
                .padding(22)
            }
        }
    }

    private var header: some View {
        VStack(spacing: 8) {
            HStack(spacing: 8) {
                Circle()
                    .fill(Color.red)
                    .frame(width: 8, height: 8)
                Text(L10n.live)
                    .font(.caption.weight(.black))
                    .tracking(1.5)
                    .foregroundStyle(.red)
                Text("•")
                    .foregroundStyle(VibeTheme.textMuted)
                Text(String(format: L10n.listeningCount, memberCount))
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(VibeTheme.textSecondary)
            }
            Text(room.title)
                .font(.system(size: 26, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
            Text(room.categoryName)
                .font(.subheadline)
                .foregroundStyle(VibeTheme.lavender)
        }
    }

    private var speakersGrid: some View {
        VStack(spacing: 16) {
            HStack(spacing: 16) {
                ForEach(speakers, id: \.name) { speaker in
                    VStack(spacing: 8) {
                        ZStack {
                            Circle()
                                .stroke(speaker.role == "Host" ? VibeTheme.lavender : VibeTheme.strokeStrong, lineWidth: 2)
                                .frame(width: 66, height: 66)
                            Text(speaker.emoji)
                                .font(.system(size: 34))
                                .frame(width: 56, height: 56)
                                .background(Circle().fill(VibeTheme.primary.opacity(0.3)))
                            if speaker.role == "Host" {
                                Text("👑")
                                    .font(.system(size: 15))
                                    .offset(x: 22, y: -26)
                            }
                        }
                        Text(speaker.name)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.white)
                        Text(speaker.role)
                            .font(.caption2)
                            .foregroundStyle(VibeTheme.textMuted)
                    }
                }
            }
        }
        .padding(.vertical, 18)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(VibeTheme.card.opacity(0.55))
                .overlay(RoundedRectangle(cornerRadius: 20).stroke(VibeTheme.strokeStrong, lineWidth: 1))
        )
    }

    private var anonymousToggle: some View {
        VStack(alignment: .leading, spacing: 10) {
            Toggle(isOn: $listenAnonymously) {
                Text(L10n.listenAnonymously)
                    .font(.headline)
                    .foregroundStyle(.white)
            }
            .tint(VibeTheme.primary)

            Text(L10n.anonymousHelper)
                .font(.footnote)
                .foregroundStyle(VibeTheme.textSecondary)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(VibeTheme.surface.opacity(0.7))
                .overlay(RoundedRectangle(cornerRadius: 18).stroke(VibeTheme.strokeStrong, lineWidth: 1))
        )
    }

    private var startButton: some View {
        Button {
            onStart()
        } label: {
            Text(listenAnonymously ? L10n.startListeningAnonymously : L10n.joinTheVibe)
                .font(.headline.weight(.semibold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Capsule().fill(VibeTheme.primary))
        }
        .buttonStyle(PressableButtonStyle())
    }
}
