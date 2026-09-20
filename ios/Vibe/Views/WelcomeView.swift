import SwiftUI

struct WelcomeView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                VibeBackground()

                VStack {
                    Spacer()
                    VStack(spacing: 18) {
                        VibeLogo(size: 86)
                        Text("Find your kind of people.")
                            .font(.title2.weight(.bold))
                            .foregroundStyle(.white)
                        Text("Join rooms, conversations, and shared moments built around your vibe.")
                            .font(.body)
                            .foregroundStyle(.white.opacity(0.7))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 28)
                    }
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
                    .padding(.bottom, 12)
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
            .frame(minHeight: 54)
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
            .frame(minHeight: 54)
            .background(.white.opacity(0.08), in: Capsule())
            .overlay(Capsule().stroke(.white.opacity(0.7), lineWidth: 1.5))
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
    }
}
