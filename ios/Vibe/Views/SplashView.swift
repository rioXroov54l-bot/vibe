import SwiftUI

struct SplashView: View {
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 8) {
                Text("vibe")
                    .font(.system(size: 64, weight: .black, design: .rounded))
                    .tracking(-4)
                    .foregroundStyle(.white)
                Text("On the same wavelength.")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.7))
            }
        }
    }
}
