import SwiftUI

struct SignInView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @EnvironmentObject private var auth: AuthService

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Text("Welcome back")
                    .font(.largeTitle.bold())
                Text("Sign in to continue your Vibe experience.")
                    .foregroundStyle(.secondary)

                AuthTextField(title: "Email", text: $email, contentType: .emailAddress)
                VStack(alignment: .leading) {
                    Text("Password")
                        .font(.subheadline.weight(.semibold))
                    HStack {
                        if showPassword {
                            TextField("Password", text: $password)
                        } else {
                            SecureField("Password", text: $password)
                        }
                        Button { showPassword.toggle() } label: {
                            Image(systemName: showPassword ? "eye.slash" : "eye")
                        }
                    }
                    .padding()
                    .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
                }

                Button {
                    Task { await auth.signIn(email: email, password: password) }
                } label: {
                    if auth.isLoading {
                        ProgressView()
                    } else {
                        Text("Sign in")
                    }
                }
                .buttonStyle(PrimaryAuthButtonStyle())

                if let error = auth.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }
            }
            .padding(24)
        }
    }
}

struct AuthTextField: View {
    let title: String
    @Binding var text: String
    var contentType: UITextContentType?

    var body: some View {
        VStack(alignment: .leading) {
            Text(title)
                .font(.subheadline.weight(.semibold))
            TextField(title, text: $text)
                .textContentType(contentType)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .padding()
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
    }
}
