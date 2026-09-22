import SwiftUI

struct SignUpView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var localization: LocalizationManager
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var accepted = false

    private var canSubmit: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
            && !email.trimmingCharacters(in: .whitespaces).isEmpty
            && password.count >= 8
            && accepted
            && !appState.isBusy
    }

    var body: some View {
        ZStack {
            CosmicBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
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
            Text(L10n.startYourVibe)
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text(L10n.signupSubtitle)
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textSecondary)
        }
    }

    private var form: some View {
        VStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text(L10n.displayName).font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                TextField(L10n.displayNamePlaceholder, text: $name)
                    .vibeField()
                    .textContentType(.nickname)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(L10n.email).font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                TextField(L10n.emailPlaceholder, text: $email)
                    .vibeField()
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text(L10n.password).font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                SecureField(L10n.passwordHint, text: $password)
                    .vibeField()
                    .textContentType(.newPassword)
            }

            Toggle(isOn: $accepted) {
                Text(L10n.consent)
                    .font(.footnote)
                    .foregroundStyle(VibeTheme.textSecondary)
            }
            .tint(VibeTheme.primary)

            Button {
                Task {
                    await appState.signUp(
                        email: email.trimmingCharacters(in: .whitespaces),
                        password: password,
                        name: name.trimmingCharacters(in: .whitespaces)
                    )
                }
            } label: {
                Text(appState.isBusy ? L10n.creatingAccount : L10n.createAccount)
                    .vibePrimaryButton(canSubmit)
            }
            .disabled(!canSubmit)

            Button {
                appState.authFlow = .login
            } label: {
                Text(L10n.alreadyHaveAccount)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(VibeTheme.textPrimary)
            }
        }
    }
}
