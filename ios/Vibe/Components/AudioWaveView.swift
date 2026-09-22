import SwiftUI

/// Animated audio waveform bars used on live room speakers.
struct AudioWaveView: View {
    var color: Color = VibeTheme.mint

    @State private var animate = false
    private let heights: [CGFloat] = [7, 15, 21, 12, 6]

    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<5, id: \.self) { index in
                Capsule()
                    .fill(color)
                    .frame(width: 3, height: animate ? heights[index] : 4)
                    .animation(
                        .easeInOut(duration: 0.45)
                            .repeatForever(autoreverses: true)
                            .delay(Double(index) * 0.09),
                        value: animate
                    )
            }
        }
        .frame(height: 22)
        .onAppear { animate = true }
    }
}
