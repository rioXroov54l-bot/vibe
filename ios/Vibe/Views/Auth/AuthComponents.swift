import SwiftUI

/// A prominent error banner used across the auth flow.
struct ErrorView: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(VibeTheme.pink)
            Text(text)
                .font(.footnote)
                .foregroundStyle(VibeTheme.textPrimary)
                .multilineTextAlignment(.leading)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(VibeTheme.pink.opacity(0.12))
        )
    }
}

/// An informational banner for non-error messages.
struct NoticeView: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(VibeTheme.mint)
            Text(text)
                .font(.footnote)
                .foregroundStyle(VibeTheme.textPrimary)
                .multilineTextAlignment(.leading)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(VibeTheme.mint.opacity(0.12))
        )
    }
}

/// A six-box numeric code input that keeps the value as a String,
/// preserving leading zeros.
struct SixDigitCodeField: View {
    @Binding var code: String
    @FocusState private var focused: Bool

    var body: some View {
        ZStack {
            TextField("", text: $code)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .focused($focused)
                .frame(width: 1, height: 1)
                .opacity(0.01)
                .onChange(of: code) { _, newValue in
                    code = String(newValue.filter(\.isNumber).prefix(6))
                }

            HStack(spacing: 10) {
                ForEach(0..<6, id: \.self) { index in
                    let character = character(at: index)
                    Text(character)
                        .font(.title2.bold())
                        .foregroundStyle(.white)
                        .frame(width: 46, height: 60)
                        .background(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(VibeTheme.surface)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(index == code.count ? VibeTheme.primary : VibeTheme.strokeStrong,
                                        lineWidth: index == code.count ? 2 : 1)
                        )
                }
            }
        }
        .frame(maxWidth: .infinity)
        .onTapGesture { focused = true }
        .onAppear { focused = true }
    }

    private func character(at index: Int) -> String {
        let array = Array(code)
        guard index < array.count else { return "" }
        return String(array[index])
    }
}
