import SwiftUI

struct RecoveryView: View {
    @State private var email = ""
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Let's get you back in...")
                    .font(.largeTitle.bold())
                Text("Enter the email associated with your account. We'll send you a verification link.")
                    .foregroundStyle(.secondary)
                AuthTextField(title: "Email", text: $email, contentType: .emailAddress)
                Button("Send email") {}
                    .buttonStyle(PrimaryAuthButtonStyle())
            }
            .padding(24)
        }
    }
}
