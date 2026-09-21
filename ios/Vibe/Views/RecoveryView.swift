import SwiftUI

struct RecoveryView: View {
    @State private var email = ""
    @State private var success = false
    @State private var localError: String?
    @FocusState private var emailFocused: Bool
    @EnvironmentObject private var auth: AuthService

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Let's get you back in...")
                        .font(.largeTitle.bold())
                    Text("Enter the email associated with your account. We'll send you a verification link.")
                        .foregroundStyle(.secondary)
                    AuthTextField(title: "Email", text: $email, contentType: .emailAddress)
                        .focused($emailFocused)
                    Button {
                        localError = nil
                        emailFocused = false
                        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard isValidEmail(trimmed) else {
                            localError = "Enter a valid email address."
                            return
                        }
                        print("Recovery button pressed")
                        print("Email captured")
                        print("Reset request started")
                        Task {
                            await auth.requestRecovery(email: trimmed)
                            if auth.errorMessage == nil {
                                success = true
                            }
                        }
                    } label: {
                        if auth.isLoading {
                            ProgressView()
                        } else {
                            Text("Send email")
                        }
                    }
                    .buttonStyle(PrimaryAuthButtonStyle())
                    .disabled(auth.isLoading)

                    if let error = localError ?? auth.errorMessage {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    if success {
                        Text("If this email is registered, a recovery link has been sent.")
                            .foregroundStyle(.green)
                    }
                }
                .padding(24)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
        }
    }

    private func isValidEmail(_ value: String) -> Bool {
        let pattern = #"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        return value.range(of: pattern, options: .regularExpression) != nil
    }
}
