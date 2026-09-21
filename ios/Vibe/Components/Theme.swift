import SwiftUI

/// Vibe design tokens, preserved from the original web product.
enum VibeTheme {
    // Backgrounds
    static let background = Color(red: 0.071, green: 0.055, blue: 0.102)   // #120d1c
    static let surface = Color(red: 0.098, green: 0.090, blue: 0.129)       // #191721
    static let elevated = Color(red: 0.129, green: 0.106, blue: 0.169)      // #211b2b
    static let card = Color(red: 0.157, green: 0.102, blue: 0.231)          // #281a3b

    // Primary purple/violet
    static let primary = Color(red: 0.482, green: 0.208, blue: 0.733)       // #7b35bb
    static let primaryDeep = Color(red: 0.298, green: 0.114, blue: 0.471)   // #4c1d78
    static let primaryDark = Color(red: 0.141, green: 0.063, blue: 0.196)   // #241032
    static let lavender = Color(red: 0.725, green: 0.604, blue: 1.0)        // #b99aff
    static let violetLight = Color(red: 0.780, green: 0.643, blue: 1.0)     // #c79aff

    // Accents
    static let pink = Color(red: 0.961, green: 0.592, blue: 0.773)          // #f597c5
    static let cyan = Color(red: 0.502, green: 0.851, blue: 0.969)          // #80d9f7
    static let mint = Color(red: 0.624, green: 0.875, blue: 0.702)          // #9fdeb3
    static let spotifyGreen = Color(red: 0.118, green: 0.843, blue: 0.376)  // #1ed760

    static let textPrimary = Color.white
    static let textSecondary = Color.white.opacity(0.72)
    static let textMuted = Color.white.opacity(0.45)
    static let stroke = Color.white.opacity(0.10)
    static let strokeStrong = Color.white.opacity(0.18)

    static let brandGradient = LinearGradient(
        colors: [primary, primaryDeep, primaryDark],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let glowGradient = RadialGradient(
        colors: [violetLight.opacity(0.35), .clear],
        center: .center,
        startRadius: 0,
        endRadius: 180
    )

    static let backgroundGradient = LinearGradient(
        colors: [
            Color(red: 0.224, green: 0.149, blue: 0.294),   // #39264b
            background
        ],
        startPoint: .top,
        endPoint: .bottom
    )
}

extension View {
    /// Standard full-screen Vibe background.
    func vibeBackground() -> some View {
        self
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(VibeTheme.backgroundGradient.ignoresSafeArea())
            .preferredColorScheme(.dark)
    }

    /// Primary filled button.
    func vibePrimaryButton(_ enabled: Bool = true) -> some View {
        self
            .font(.headline.weight(.semibold))
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: 54)
            .background(VibeTheme.brandGradient)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .opacity(enabled ? 1 : 0.5)
    }

    /// Card surface.
    func vibeCard() -> some View {
        self
            .padding(20)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(VibeTheme.card.opacity(0.72))
                    .overlay(
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .stroke(VibeTheme.strokeStrong, lineWidth: 1)
                    )
            )
    }

    /// Standard text input field styling.
    func vibeField() -> some View {
        self
            .padding(.horizontal, 16)
            .padding(.vertical, 15)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(VibeTheme.surface)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .stroke(VibeTheme.strokeStrong, lineWidth: 1)
                    )
            )
            .foregroundStyle(VibeTheme.textPrimary)
            .autocorrectionDisabled()
            .textInputAutocapitalization(.never)
    }
}
