import SwiftUI

struct SignUpView: View {
    @State private var displayName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var accepted = false
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

                    Toggle(isOn: $accepted) {
                        Text("I am 18 or older and agree to the terms and privacy policy.")
                            .font(.footnote)
                    }

                    Button {
                        Task { await auth.signUp(email: email, password: password, displayName: displayName) }
                    } label: {
                        if auth.isLoading {
                            ProgressView()
                        } else {
                            Text("Create account")
                        }
                    }
                    .buttonStyle(PrimaryAuthButtonStyle())
                    .disabled(!accepted)
                }
                .padding(24)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            }
        }
    }
}
