import SwiftUI

struct SignUpView: View {
    @State private var displayName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var accepted = false
    @State private var localError: String?
    @EnvironmentObject private var auth: AuthService

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Start your Vibe")
                        .font(.largeTitle.bold())
                    Text("Create your account and find your people.")
                        .foregroundStyle(.secondary)

                    AuthTextField(title: "Display name", text: $displayName, contentType: .name)
                    AuthTextField(title: "Email", text: $email, contentType: .emailAddress)
                    SecureField("Password", text: $password)
                        .textContentType(.newPassword)
                        .padding()
                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
                    SecureField("Confirm password", text: $confirmPassword)
                        .textContentType(.newPassword)
                        .padding()
                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))

                    Toggle(isOn: $accepted) {
                        Text("I am 18 or older and agree to the terms and privacy policy.")
                            .font(.footnote)
                    }

                    Button {
                        print("Signup flow: user entered information")
                        localError = nil
                        guard accepted else {
                            print("Signup flow: terms not accepted")
                            localError = "Please accept the terms and privacy policy."
                            return
                        }
                        guard password == confirmPassword else {
                            print("Signup flow: password mismatch")
                            localError = "Passwords do not match."
                            return
                        }
                        print("Signup flow: validation passed")
                        Task { await auth.signUp(email: email, password: password, displayName: displayName) }
                    } label: {
                        if auth.isLoading {
                            ProgressView()
                        } else {
                            Text("Create account")
                        }
                    }
                    .buttonStyle(PrimaryAuthButtonStyle())
                    .disabled(auth.isLoading)

                    if let error = localError ?? auth.errorMessage {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }
                .padding(24)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
        }
        .navigationDestination(isPresented: $auth.needsVerification) {
            if let email = auth.pendingEmail {
                OTPView(email: email)
            }
        }
    }
}
