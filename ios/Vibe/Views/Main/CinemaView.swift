import SwiftUI
import AVKit
import PhotosUI

/// Local video/audio playback without upload, matching the web Cinema room.
struct CinemaView: View {
    @State private var selectedItem: PhotosPickerItem?
    @State private var player: AVPlayer?

    var body: some View {
        ZStack {
            VibeTheme.backgroundGradient.ignoresSafeArea()
            VStack(spacing: 20) {
                if let player {
                    VideoPlayer(player: player)
                        .frame(height: 280)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .stroke(VibeTheme.strokeStrong, lineWidth: 1)
                        )
                } else {
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(VibeTheme.card)
                        .frame(height: 280)
                        .overlay(
                            VStack(spacing: 12) {
                                Image(systemName: "film.stack")
                                    .font(.system(size: 52))
                                    .foregroundStyle(VibeTheme.lavender)
                                Text("Pick a video to watch together")
                                    .font(.headline)
                                    .foregroundStyle(.white)
                            }
                        )
                }

                PhotosPicker(selection: $selectedItem, matching: .videos) {
                    Text("Choose a video")
                        .vibePrimaryButton()
                }

                Text("Vibe Cinema plays local video files on this device without uploading them.")
                    .font(.footnote)
                    .foregroundStyle(VibeTheme.textMuted)
                    .multilineTextAlignment(.center)

                Spacer()
            }
            .padding(20)
        }
        .navigationTitle("Cinema")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: selectedItem) { _, newItem in
            Task { await loadVideo(from: newItem) }
        }
    }

    @MainActor
    private func loadVideo(from item: PhotosPickerItem?) async {
        guard let item, let data = try? await item.loadTransferable(type: Data.self) else { return }
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("vibe-cinema-\(UUID().uuidString).mov")
        do {
            try data.write(to: url)
            player = AVPlayer(url: url)
            player?.play()
        } catch {
            player = nil
        }
    }
}
