import SwiftUI

struct SplashView: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.20, green: 0.07, blue: 0.38),
                    Color(red: 0.06, green: 0.03, blue: 0.12)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            VStack(spacing: 12) {
                VibeLogo(size: 76)
                Text("On the same wavelength.")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.82))
            }
        }
    }
}

struct VibeLogo: View {
    var size: CGFloat

    var body: some View {
        HStack(spacing: 5) {
            Text("vibe")
                .font(.system(size: size, weight: .black, design: .rounded))
                .tracking(-size * 0.065)
                .foregroundStyle(.white)
            VStack(alignment: .leading, spacing: 4) {
                Capsule().fill(.white.opacity(0.95)).frame(width: size * 0.11, height: size * 0.32)
                Capsule().fill(.white.opacity(0.72)).frame(width: size * 0.11, height: size * 0.24)
                Capsule().fill(.white.opacity(0.45)).frame(width: size * 0.11, height: size * 0.16)
            }
        }
    }
}
