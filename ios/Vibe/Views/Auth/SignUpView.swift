import SwiftUI

struct SignUpView: View {
    @EnvironmentObject private var appState: AppState
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
            VibeTheme.backgroundGradient.ignoresSafeArea()
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
            Text("Start your Vibe")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text("Create your account and find your people.")
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textSecondary)
        }
    }

    private var form: some View {
        VStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Display name").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                TextField("Your name", text: $name)
                    .vibeField()
                    .textContentType(.nickname)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Email").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                TextField("name@example.com", text: $email)
                    .vibeField()
                    .keyboardType(.emailAddress)
                    .textContentType(.emailAddress)
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("Password").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                SecureField("At least 8 characters", text: $password)
                    .vibeField()
                    .textContentType(.newPassword)
            }

            Toggle(isOn: $accepted) {
                Text("I am 18 or older and agree to the terms, privacy policy and community rules.")
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
                Text(appState.isBusy ? "Creating account…" : "Create account")
                    .vibePrimaryButton(canSubmit)
            }
            .disabled(!canSubmit)

            Button {
                appState.authFlow = .login
            } label: {
                Text("Already have an account? Sign in")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(VibeTheme.textPrimary)
            }
        }
    }
}
