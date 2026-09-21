import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var appState: AppState
    @State private var email = ""
    @State private var password = ""

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespaces).isEmpty && !password.isEmpty && !appState.isBusy
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
            Text("Welcome back")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text("Sign in and pick up where you left off.")
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textSecondary)
        }
    }

    private var form: some View {
        VStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Email").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                TextField("name@example.com", text: $email)
                    .vibeField()
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Password").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                SecureField("Your password", text: $password)
                    .vibeField()
                    .textContentType(.password)
            }

            Button {
                Task { await appState.signIn(email: email.trimmingCharacters(in: .whitespaces), password: password) }
            } label: {
                Text(appState.isBusy ? "Signing in…" : "Sign in")
                    .vibePrimaryButton(canSubmit)
            }
            .disabled(!canSubmit)

            HStack {
                Spacer()
                Button("Forgot password?") {
                    appState.authFlow = .forgotPassword
                }
                .font(.subheadline)
                .foregroundStyle(VibeTheme.lavender)
            }

            Divider().overlay(VibeTheme.stroke)

            Button("Sign in with an email code") {
                guard !email.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                Task { await appState.signInWithOTP(email: email.trimmingCharacters(in: .whitespaces)) }
            }
            .font(.subheadline.weight(.medium))
            .foregroundStyle(VibeTheme.cyan)
            .disabled(appState.isBusy)

            Button {
                appState.authFlow = .signup
            } label: {
                Text("New to Vibe? Create account")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(VibeTheme.textPrimary)
            }
        }
    }
}
