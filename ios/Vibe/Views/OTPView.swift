import SwiftUI

struct OTPView: View {
    let email: String
    @State private var code = ""
    @EnvironmentObject private var auth: AuthService

    var body: some View {
        VStack(spacing: 24) {
            Text("Verify your account")
                .font(.largeTitle.bold())
            Text("Enter the 6-digit code sent to your email.")
                .foregroundStyle(.secondary)

            TextField("Code", text: $code)
                .keyboardType(.numberPad)
                .font(.largeTitle.weight(.bold))
                .multilineTextAlignment(.center)
                .tracking(8)
                .padding()
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18))

            Button {
                Task { await auth.verifyOTP(email: email, token: code) }
            } label: {
                if auth.isLoading {
                    ProgressView()
                } else {
                    Text("Verify")
                }
            }
                .buttonStyle(PrimaryAuthButtonStyle())
                .disabled(code.count < 6)
        }
        .padding(24)
    }
}
