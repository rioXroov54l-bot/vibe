import SwiftUI

struct ForgotPasswordView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var localization: LocalizationManager
    @State private var email = ""

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespaces).isEmpty && !appState.isBusy
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

                    VStack(alignment: .leading, spacing: 6) {
                        Text(L10n.email).font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                        TextField(L10n.emailPlaceholder, text: $email)
                            .vibeField()
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                    }

                    Button {
                        Task { await appState.resetPasswordForEmail(email: email.trimmingCharacters(in: .whitespaces)) }
                    } label: {
                        Text(appState.isBusy ? L10n.sending : L10n.sendEmail)
                            .vibePrimaryButton(canSubmit)
                    }
                    .disabled(!canSubmit)

                    Button {
                        appState.authFlow = .login
                    } label: {
                        Text(L10n.backToSignIn)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(VibeTheme.textPrimary)
                    }
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
            Text(L10n.letsGetYouBack)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text(L10n.forgotSubtitle)
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textSecondary)
        }
    }
}
