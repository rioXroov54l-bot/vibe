import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ZStack {
            if appState.isLoading {
                LaunchView()
            } else if appState.isAuthenticated {
                if appState.needsOnboarding {
                    OnboardingView()
                } else {
                    MainTabView()
                }
            } else {
                authRoot
            }
        }
        .onOpenURL { url in
            appState.handleDeepLink(url)
        }
        .animation(.easeInOut(duration: 0.25), value: appState.isAuthenticated)
    }

    @ViewBuilder
    private var authRoot: some View {
        switch appState.authFlow {
        case .welcome:
            WelcomeView()
        case .login:
            LoginView()
        case .signup:
            SignUpView()
        case .otp(let email, let mode):
            OTPView(email: email, mode: mode)
        case .forgotPassword:
            ForgotPasswordView()
        case .resetPassword:
            ResetPasswordView()
        }
    }
}

/// Splash / launch screen shown while restoring the session.
struct LaunchView: View {
    var body: some View {
        ZStack {
            VibeTheme.backgroundGradient.ignoresSafeArea()
            VibeTheme.glowGradient
                .frame(width: 320, height: 320)
            VStack(spacing: 16) {
                Text("Vibe")
                    .font(.system(size: 44, weight: .black, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [VibeTheme.lavender, VibeTheme.pink],
                                       startPoint: .top, endPoint: .bottom)
                    )
                Text("On the same wavelength")
                    .font(.subheadline)
                    .foregroundStyle(VibeTheme.textSecondary)
            }
        }
        .preferredColorScheme(.dark)
    }
}
