import SwiftUI

struct ResetPasswordView: View {
    @EnvironmentObject private var appState: AppState
    @State private var password = ""
    @State private var confirm = ""

    private var canSubmit: Bool {
        password.count >= 8 && password == confirm && !appState.isBusy
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
                        Text("New password").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                        SecureField("At least 8 characters", text: $password)
                            .vibeField()
                            .textContentType(.newPassword)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Confirm password").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                        SecureField("Re-enter password", text: $confirm)
                            .vibeField()
                            .textContentType(.newPassword)
                    }

                    if !password.isEmpty && password != confirm {
                        Text("Passwords do not match.")
                            .font(.footnote)
                            .foregroundStyle(VibeTheme.pink)
                    }

                    Button {
                        Task { await appState.updatePassword(password) }
                    } label: {
                        Text(appState.isBusy ? "Saving…" : "Save new password")
                            .vibePrimaryButton(canSubmit)
                    }
                    .disabled(!canSubmit)
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
            Text("New password")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text("Choose a new password for your account.")
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textSecondary)
        }
    }
}
