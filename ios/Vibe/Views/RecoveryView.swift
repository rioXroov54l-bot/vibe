import SwiftUI

struct RecoveryView: View {
    @State private var email = ""
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
                    Button {
                        Task { await auth.requestRecovery(email: email) }
                    } label: {
                        if auth.isLoading {
                            ProgressView()
                        } else {
                            Text("Send email")
                        }
                    }
                    .buttonStyle(PrimaryAuthButtonStyle())
                    .disabled(email.isEmpty)
                }
                .padding(24)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
        }
    }
}
