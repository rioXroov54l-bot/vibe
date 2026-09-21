import SwiftUI

struct ResetPasswordView: View {
    let accessToken: String
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showPassword = false
    @State private var errorMessage: String?
    @State private var success = false
    @EnvironmentObject private var auth: AuthService

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Reset password")
                        .font(.largeTitle.bold())
                    Text("Choose a new password for your Vibe account.")
                        .foregroundStyle(.secondary)

                    VStack(alignment: .leading) {
                        Text("New password")
                            .font(.subheadline.weight(.semibold))
                        HStack {
                            if showPassword {
                                TextField("New password", text: $password)
                            } else {
                                SecureField("New password", text: $password)
                            }
                            Button { showPassword.toggle() } label: {
                                Image(systemName: showPassword ? "eye.slash" : "eye")
                            }
                        }
                        .padding()
                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
                    }

                    SecureField("Confirm new password", text: $confirmPassword)
                        .textContentType(.newPassword)
                        .padding()
                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))

                    Button {
                        guard password == confirmPassword else {
                            errorMessage = "Passwords do not match."
                            return
                        }
                        Task {
                            await auth.updatePassword(password, accessToken: accessToken)
                            if auth.errorMessage == nil {
                                success = true
                            }
                        }
                    } label: {
                        if auth.isLoading {
                            ProgressView()
                        } else {
                            Text("Update password")
                        }
                    }
                    .buttonStyle(PrimaryAuthButtonStyle())

                    if let error = errorMessage ?? auth.errorMessage {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    if success {
                        Text("Password updated successfully.")
                            .foregroundStyle(.green)
                        NavigationLink("Return to sign in") {
                            SignInView()
                        }
                        .buttonStyle(PrimaryAuthButtonStyle())
                    }
                }
                .padding(24)
            }
        }
    }
}
