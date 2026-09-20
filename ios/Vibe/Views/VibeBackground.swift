import SwiftUI

struct VibeBackground: View {
    @State private var animate = false

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.20, green: 0.07, blue: 0.38),
                    Color(red: 0.08, green: 0.03, blue: 0.16),
                    Color(red: 0.04, green: 0.02, blue: 0.08)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Circle()
                .fill(Color.purple.opacity(0.38))
                .frame(width: 320, height: 320)
                .blur(radius: 50)
                .offset(x: animate ? -100 : -40, y: animate ? -240 : -170)

            Circle()
                .fill(Color(red: 0.55, green: 0.28, blue: 1.0).opacity(0.28))
                .frame(width: 280, height: 280)
                .blur(radius: 55)
                .offset(x: animate ? 120 : 50, y: animate ? 250 : 180)
        }
        .ignoresSafeArea()
        .onAppear {
            withAnimation(.easeInOut(duration: 5).repeatForever(autoreverses: true)) {
                animate = true
            }
        }
    }
}
