import SwiftUI

/// Bottom sheet that gates entry to private rooms.
struct PasscodeSheet: View {
    let room: Room
    let onUnlock: () -> Void

    @State private var passcode = ""
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            CosmicBackground()
            VStack(spacing: 18) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 34))
                    .foregroundStyle(Color(red: 1.0, green: 0.76, blue: 0.03))

                Text(L10n.privateRoom)
                    .font(.title3.weight(.bold))
                    .foregroundStyle(.white)

                Text(room.title)
                    .font(.subheadline)
                    .foregroundStyle(VibeTheme.textSecondary)
                    .lineLimit(1)

                SecureField(L10n.enterPasscode, text: $passcode)
                    .vibeField()
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.center)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(VibeTheme.pink)
                }

                Button {
                    if passcode == room.passcodeHash ?? "" {
                        onUnlock()
                    } else {
                        errorMessage = L10n.wrongPasscode
                    }
                } label: {
                    Text(L10n.unlock)
                        .font(.headline.weight(.semibold))
                        .foregroundStyle(.black)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Capsule().fill(.white))
                }
                .disabled(passcode.isEmpty)
            }
            .padding(22)
        }
    }
}
