import SwiftUI

struct WelcomeView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var localization: LocalizationManager

    var body: some View {
        ZStack {
            CosmicBackground()

            VStack(spacing: 0) {
                languageToggle

                Spacer()

                logo
                    .padding(.bottom, 18)
                tagline

                Spacer()

                actions
                    .padding(.bottom, 20)
                helpLink
                    .padding(.bottom, 10)
                legalFooter
                    .padding(.bottom, 28)
            }
            .padding(.horizontal, 26)
        }
    }

    private var languageToggle: some View {
        HStack {
            Spacer()
            Button {
                localization.toggle()
            } label: {
                Text(L10n.languageButton)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.9))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(Capsule().fill(.white.opacity(0.12)))
                    .overlay(Capsule().stroke(.white.opacity(0.15), lineWidth: 1))
            }
        }
        .padding(.top, 12)
    }

    private var logo: some View {
        Text("vibe ///")
            .font(.system(size: 54, weight: .black, design: .rounded))
            .foregroundStyle(.white)
            .shadow(color: Color(red: 0.62, green: 0.32, blue: 1.0).opacity(0.65), radius: 18, y: 0)
    }

    private var tagline: some View {
        Text(L10n.brandTagline)
            .font(.title3.weight(.medium))
            .foregroundStyle(.white.opacity(0.78))
            .multilineTextAlignment(.center)
    }

    private var actions: some View {
        VStack(spacing: 14) {
            Button {
                appState.authFlow = .signup
            } label: {
                Text(L10n.createAccount)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Capsule().fill(.white))
                    .shadow(color: .black.opacity(0.3), radius: 12, y: 5)
            }

            Button {
                appState.authFlow = .login
            } label: {
                Text(L10n.signIn)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Capsule().strokeBorder(.white.opacity(0.35), lineWidth: 1.5))
            }
        }
    }

    private var helpLink: some View {
        Button {
            appState.authFlow = .forgotPassword
        } label: {
            Text(L10n.needHelp)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.62))
        }
    }

    private var legalFooter: some View {
        Text(L10n.legalFooter)
            .font(.caption)
            .foregroundStyle(.white.opacity(0.38))
            .multilineTextAlignment(.center)
    }
}
