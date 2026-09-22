import SwiftUI

/// Premium deep-space night background used across the authentication flow.
struct CosmicBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.16, green: 0.07, blue: 0.24),
                    Color(red: 0.06, green: 0.03, blue: 0.12),
                    Color.black
                ],
                startPoint: .top,
                endPoint: .bottom
            )

            RadialGradient(
                colors: [Color(red: 0.55, green: 0.25, blue: 0.85).opacity(0.24), .clear],
                center: .topLeading,
                startRadius: 0,
                endRadius: 420
            )

            RadialGradient(
                colors: [Color(red: 0.28, green: 0.14, blue: 0.55).opacity(0.18), .clear],
                center: .bottomTrailing,
                startRadius: 0,
                endRadius: 520
            )
        }
        .ignoresSafeArea()
    }
}
