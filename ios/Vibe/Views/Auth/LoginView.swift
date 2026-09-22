import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var localization: LocalizationManager
    @State private var email = ""
    @State private var password = ""

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespaces).isEmpty && !password.isEmpty && !appState.isBusy
    }

    var body: some View {
        ZStack {
            CosmicBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    if let notice = appState.notice {
                        NoticeView(text: notice)
                    }
                    if let error = appState.errorMessage {
                        ErrorView(text: error)
                    }
                    form
                }
                .padding(.horizontal, 24)
                .padding(.top, 40)
                .padding(.bottom, 40)
            }
            .scrollDismissesKeyboard(.interactively)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(L10n.welcomeBack)
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text(L10n.signInSubtitle)
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textSecondary)
        }
    }

    private var form: some View {
        VStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text(L10n.email).font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                TextField(L10n.emailPlaceholder, text: $email)
                    .vibeField()
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(L10n.password).font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                SecureField(L10n.passwordPlaceholder, text: $password)
                    .vibeField()
                    .textContentType(.password)
            }

            Button {
                Task { await appState.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password) }
            } label: {
                Text(appState.isBusy ? L10n.signingIn : L10n.signIn)
                    .vibePrimaryButton(canSubmit)
            }
            .disabled(!canSubmit)

            HStack {
                Spacer()
                Button(L10n.forgotPassword) {
                    appState.authFlow = .forgotPassword
                }
                .font(.subheadline)
                .foregroundStyle(VibeTheme.lavender)
            }

            Divider().overlay(VibeTheme.stroke)

            Button(L10n.signInWithCode) {
                guard !email.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                Task { await appState.signInWithOTP(email: email.trimmingCharacters(in: .whitespaces)) }
            }
            .font(.subheadline.weight(.medium))
            .foregroundStyle(VibeTheme.cyan)
            .disabled(appState.isBusy)

            Button {
                appState.authFlow = .signup
            } label: {
                Text(L10n.newToVibe)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(VibeTheme.textPrimary)
            }
        }
    }
}
