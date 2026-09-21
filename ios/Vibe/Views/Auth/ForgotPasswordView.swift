import SwiftUI

struct ForgotPasswordView: View {
    @EnvironmentObject private var appState: AppState
    @State private var email = ""

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespaces).isEmpty && !appState.isBusy
    }

    var body: some View {
        ZStack {
            VibeTheme.backgroundGradient.ignoresSafeArea()
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
                        Text("Email").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                        TextField("name@example.com", text: $email)
                            .vibeField()
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                    }

                    Button {
                        Task { await appState.resetPasswordForEmail(email: email.trimmingCharacters(in: .whitespaces)) }
                    } label: {
                        Text(appState.isBusy ? "Sending…" : "Send email")
                            .vibePrimaryButton(canSubmit)
                    }
                    .disabled(!canSubmit)

                    Button {
                        appState.authFlow = .login
                    } label: {
                        Text("Back to sign in")
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
            Text("Let's get you back in…")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text("Enter the email associated with your account. We'll send you a secure link to regain access.")
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textSecondary)
        }
    }
}
