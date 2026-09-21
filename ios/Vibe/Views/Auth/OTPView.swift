import SwiftUI

struct OTPView: View {
    let email: String
    let mode: AuthFlow.OTPStep

    @EnvironmentObject private var appState: AppState
    @State private var code = ""
    @State private var resendCooldown = 0

    private let resendSeconds = 60
    private var isComplete: Bool { code.count == 6 && !appState.isBusy }

    var body: some View {
        ZStack {
            VibeTheme.backgroundGradient.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 22) {
                    header
                    if let notice = appState.notice {
                        NoticeView(text: notice)
                    }
                    if let error = appState.errorMessage {
                        ErrorView(text: error)
                    }
                    SixDigitCodeField(code: $code)
                    verifyButton
                    resendButton
                }
                .padding(.horizontal, 24)
                .padding(.top, 40)
                .padding(.bottom, 40)
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .task { startCooldown() }
    }

    private var header: some View {
        VStack(spacing: 8) {
            Text("Enter verification code")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text(email)
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textSecondary)
            Text("We sent a 6-digit code to your email.")
                .font(.footnote)
                .foregroundStyle(VibeTheme.textMuted)
        }
        .multilineTextAlignment(.center)
    }

    private var verifyButton: some View {
        Button {
            Task { await appState.verifyOTP(email: email, token: code) }
        } label: {
            Text(appState.isBusy ? "Verifying…" : "Verify and continue")
                .vibePrimaryButton(isComplete)
        }
        .disabled(!isComplete)
    }

    @ViewBuilder
    private var resendButton: some View {
        if resendCooldown > 0 {
            Text("You can resend in \(resendCooldown)s")
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textMuted)
        } else {
            Button("Resend code") {
                Task { await appState.resendOTP(email: email, mode: mode) }
            }
            .font(.subheadline.weight(.medium))
            .foregroundStyle(VibeTheme.lavender)
            .disabled(appState.isBusy)
        }
    }

    private func startCooldown() {
        resendCooldown = resendSeconds
        Task {
            while resendCooldown > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                resendCooldown -= 1
            }
        }
    }
}
