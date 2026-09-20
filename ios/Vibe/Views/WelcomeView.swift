import SwiftUI

struct WelcomeView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [Color(red: 0.42, green: 0.18, blue: 0.58), Color(red: 0.08, green: 0.05, blue: 0.13)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                VStack(spacing: 0) {
                    Spacer()
                    VStack(spacing: 8) {
                        Text("vibe")
                            .font(.system(size: 72, weight: .black, design: .rounded))
                            .tracking(-5)
                        Text("On the same wavelength.")
                            .font(.title3.weight(.semibold))
                            .opacity(0.8)
                    }
                    .foregroundStyle(.white)
                    Spacer()

                    VStack(spacing: 12) {
                        Text("By continuing, you agree to our Terms and Privacy Policy.")
                            .font(.footnote)
                            .foregroundStyle(.white.opacity(0.7))
                            .multilineTextAlignment(.center)

                        NavigationLink("Create account") { SignUpView() }
                            .buttonStyle(PrimaryAuthButtonStyle())

                        NavigationLink("Sign in") { SignInView() }
                            .buttonStyle(SecondaryAuthButtonStyle())

                        NavigationLink("Trouble signing in?") { RecoveryView() }
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.white.opacity(0.85))
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 28)
                }
            }
        }
    }
}

struct PrimaryAuthButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.black)
            .frame(maxWidth: .infinity)
            .frame(height: 58)
            .background(.white, in: Capsule())
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}

struct SecondaryAuthButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 58)
            .background(.white.opacity(0.08), in: Capsule())
            .overlay(Capsule().stroke(.white.opacity(0.7), lineWidth: 1.5))
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}
