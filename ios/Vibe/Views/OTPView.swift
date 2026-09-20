import SwiftUI

struct OTPView: View {
    @State private var code = ""
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

            Button("Verify") {}
                .buttonStyle(PrimaryAuthButtonStyle())
        }
        .padding(24)
    }
}
