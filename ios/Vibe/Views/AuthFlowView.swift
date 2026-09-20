import SwiftUI

struct AuthFlowView: View {
    let mode: AuthMode

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(mode == .signUp ? "Start your Vibe" : "Welcome back")
                    .font(.largeTitle.bold())
                Text(mode == .signUp ? "Create your account and find your people." : "Sign in to continue your Vibe experience.")
                    .font(.body)
                    .foregroundStyle(.secondary)

                TextField("Email", text: .constant(""))
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .padding()
                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))

                SecureField("Password", text: .constant(""))
                    .textContentType(mode == .signUp ? .newPassword : .password)
                    .padding()
                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))

                Button(mode == .signUp ? "Create account" : "Sign in") {}
                    .buttonStyle(PrimaryAuthButtonStyle())
            }
            .padding(24)
        }
    }
}

enum AuthMode {
    case signUp
    case signIn
}
