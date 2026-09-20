import SwiftUI

struct OTPView: View {
    let email: String
    @State private var digits = Array(repeating: "", count: 6)
    @State private var resendSeconds = 60
    @FocusState private var focusedField: Int?
    @EnvironmentObject private var auth: AuthService

    var body: some View {
        ZStack {
            Color(.systemBackground).ignoresSafeArea()
            VStack(spacing: 24) {
                Text("Verify your account")
                    .font(.largeTitle.bold())
                Text("Enter the 6-digit code sent to your email.")
                    .foregroundStyle(.secondary)

                HStack(spacing: 10) {
                    ForEach(0..<6, id: \.self) { index in
                        TextField("", text: Binding(
                            get: { digits[index] },
                            set: { newValue in
                                let value = String(newValue.prefix(1)).filter(\.isNumber)
                                digits[index] = value
                                if !value.isEmpty, index < 5 {
                                    focusedField = index + 1
                                }
                            }
                        ))
                        .keyboardType(.numberPad)
                        .textContentType(.oneTimeCode)
                        .multilineTextAlignment(.center)
                        .font(.title2.bold())
                        .frame(maxWidth: .infinity)
                        .frame(minHeight: 58)
                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 14))
                        .focused($focusedField, equals: index)
                    }
                }

                Button {
                    Task { await auth.verifyOTP(email: email, token: digits.joined()) }
                } label: {
                    if auth.isLoading {
                        ProgressView()
                    } else {
                        Text("Verify")
                    }
                }
                    .buttonStyle(PrimaryAuthButtonStyle())
                    .disabled(digits.joined().count < 6)

                Button {
                    resendSeconds = 60
                    Task { await auth.resendOTP(email: email) }
                } label: {
                    Text(resendSeconds > 0 ? "Resend in \(resendSeconds)s" : "Resend code")
                }
                .disabled(resendSeconds > 0 || auth.isLoading)
            }
            .padding(24)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .onAppear {
            focusedField = 0
            Task {
                while resendSeconds > 0 {
                    try? await Task.sleep(nanoseconds: 1_000_000_000)
                    resendSeconds -= 1
                }
            }
        }
    }
}
