import SwiftUI

struct WelcomeView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ZStack {
            VibeTheme.backgroundGradient.ignoresSafeArea()
            VibeTheme.glowGradient
                .frame(width: 360, height: 360)
                .offset(y: -140)

            VStack(spacing: 28) {
                Spacer()

                VStack(spacing: 12) {
                    Text("Vibe")
                        .font(.system(size: 54, weight: .black, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(colors: [VibeTheme.lavender, VibeTheme.pink],
                                           startPoint: .top, endPoint: .bottom)
                        )
                    Text("On the same wavelength.")
                        .font(.title3.weight(.medium))
                        .foregroundStyle(VibeTheme.textSecondary)
                }

                Spacer()

                VStack(spacing: 14) {
                    Button {
                        appState.authFlow = .signup
                    } label: {
                        Text("Create account")
                            .vibePrimaryButton()
                    }

                    Button {
                        appState.authFlow = .login
                    } label: {
                        Text("Sign in")
                            .font(.headline.weight(.semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 54)
                            .background(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .stroke(VibeTheme.strokeStrong, lineWidth: 1.5)
                            )
                    }

                    Button {
                        appState.authFlow = .forgotPassword
                    } label: {
                        Text("Trouble signing in?")
                            .font(.subheadline)
                            .foregroundStyle(VibeTheme.textSecondary)
                    }
                }
                .padding(.horizontal, 24)

                Text("By creating an account or signing in, you agree to our Terms and Privacy Policy.")
                    .font(.caption)
                    .foregroundStyle(VibeTheme.textMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 40)
                    .padding(.bottom, 24)
            }
        }
    }
}
