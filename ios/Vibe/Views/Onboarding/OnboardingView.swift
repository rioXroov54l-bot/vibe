import SwiftUI

struct InterestOption: Identifiable, Equatable {
    let id: Int
    let emoji: String
    let title: String
}

struct PersonalityOption: Identifiable, Equatable {
    let id: Int
    let emoji: String
    let title: String
}

struct OnboardingView: View {
    @EnvironmentObject private var appState: AppState

    @State private var step = 0
    @State private var selectedInterests: Set<Int> = []
    @State private var selectedPersonalities: Set<Int> = []
    @State private var bio = ""
    @State private var emoji = "😎"

    private let interests: [InterestOption] = [
        .init(id: 0, emoji: "🎵", title: "Music"),
        .init(id: 1, emoji: "🎬", title: "Movies"),
        .init(id: 2, emoji: "🎮", title: "Gaming"),
        .init(id: 3, emoji: "✈️", title: "Travel"),
        .init(id: 4, emoji: "🍔", title: "Food"),
        .init(id: 5, emoji: "🏋️", title: "Fitness"),
        .init(id: 6, emoji: "📸", title: "Photography"),
        .init(id: 7, emoji: "🎨", title: "Art"),
        .init(id: 8, emoji: "💻", title: "Technology"),
        .init(id: 9, emoji: "📚", title: "Books"),
        .init(id: 10, emoji: "⚽", title: "Sports"),
        .init(id: 11, emoji: "👗", title: "Fashion")
    ]

    private let personalities: [PersonalityOption] = [
        .init(id: 0, emoji: "🎨", title: "Creative"),
        .init(id: 1, emoji: "😂", title: "Funny"),
        .init(id: 2, emoji: "🧗", title: "Adventurous"),
        .init(id: 3, emoji: "🌊", title: "Calm"),
        .init(id: 4, emoji: "🗣️", title: "Social"),
        .init(id: 5, emoji: "🧠", title: "Intellectual")
    ]

    private let emojiOptions = ["😎", "🤖", "🧑‍🚀", "🧙", "🦊", "🐼", "👾", "🐱"]

    var body: some View {
        ZStack {
            VibeTheme.backgroundGradient.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 24) {
                    progress
                    content
                }
                .padding(.horizontal, 24)
                .padding(.top, 40)
                .padding(.bottom, 40)
            }
            .scrollDismissesKeyboard(.interactively)
        }
    }

    @ViewBuilder
    private var progress: some View {
        VStack(spacing: 12) {
            HStack {
                ForEach(0..<4, id: \.self) { index in
                    Capsule()
                        .fill(index <= step ? VibeTheme.primary : VibeTheme.strokeStrong)
                        .frame(height: 5)
                }
            }
            Text("VIBE SETUP · \(step + 1)/4")
                .font(.caption2.weight(.bold))
                .foregroundStyle(VibeTheme.textMuted)
        }
    }

    @ViewBuilder
    private var content: some View {
        switch step {
        case 0: welcomeStep
        case 1: interestsStep
        case 2: personalityStep
        default: profileStep
        }
    }

    private var welcomeStep: some View {
        VStack(spacing: 28) {
            VStack(spacing: 14) {
                Text("Welcome to Vibe")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Text("We want to understand your interests and personality to create your perfect experience.")
                    .font(.body)
                    .foregroundStyle(VibeTheme.textSecondary)
                    .multilineTextAlignment(.center)
            }

            ZStack {
                VibeTheme.glowGradient.frame(width: 260, height: 260)
                Text("🌊")
                    .font(.system(size: 90))
            }

            Button {
                advance()
            } label: {
                Text("Continue").vibePrimaryButton()
            }
        }
    }

    private var interestsStep: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Text("What are you into?")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Text("Pick as many as you like.")
                    .font(.subheadline)
                    .foregroundStyle(VibeTheme.textSecondary)
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 16), count: 3), spacing: 18) {
                ForEach(interests) { option in
                    InterestCircle(option: option, isSelected: selectedInterests.contains(option.id)) {
                        toggle(option.id, in: &selectedInterests)
                    }
                }
            }

            navigationButtons(enabled: !selectedInterests.isEmpty)
        }
    }

    private var personalityStep: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Text("What type of people do you enjoy meeting?")
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Text("Choose at least one.")
                    .font(.subheadline)
                    .foregroundStyle(VibeTheme.textSecondary)
            }

            VStack(spacing: 12) {
                ForEach(personalities) { option in
                    PersonalityCard(option: option, isSelected: selectedPersonalities.contains(option.id)) {
                        toggle(option.id, in: &selectedPersonalities)
                    }
                }
            }

            navigationButtons(enabled: !selectedPersonalities.isEmpty)
        }
    }

    private var profileStep: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Text("Your finishing touch")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Text("Add a short bio and pick an avatar.")
                    .font(.subheadline)
                    .foregroundStyle(VibeTheme.textSecondary)
            }

            HStack(spacing: 12) {
                ForEach(emojiOptions, id: \.self) { option in
                    Button {
                        emoji = option
                    } label: {
                        Text(option)
                            .font(.title)
                            .padding(10)
                            .background(
                                Circle()
                                    .fill(emoji == option ? VibeTheme.primary.opacity(0.35) : VibeTheme.surface)
                                    .overlay(Circle().stroke(emoji == option ? VibeTheme.lavender : VibeTheme.strokeStrong, lineWidth: 1.5))
                            )
                    }
                }
            }

            VStack(alignment: .leading, spacing: 6) {
                Text("About you").font(.footnote.weight(.medium)).foregroundStyle(VibeTheme.textSecondary)
                TextEditor(text: $bio)
                    .frame(minHeight: 110)
                    .padding(10)
                    .background(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(VibeTheme.surface)
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(VibeTheme.strokeStrong, lineWidth: 1))
                    )
                    .scrollContentBackground(.hidden)
                    .onChange(of: bio) { _, newValue in
                        if newValue.count > 160 { bio = String(newValue.prefix(160)) }
                    }
            }

            Button {
                finish()
            } label: {
                Text(appState.isBusy ? "Saving…" : "Enter Vibe")
                    .vibePrimaryButton(!appState.isBusy)
            }
            .disabled(appState.isBusy)

            Button {
                if step > 0 { step -= 1 }
            } label: {
                Text("Back").font(.subheadline).foregroundStyle(VibeTheme.textSecondary)
            }
        }
    }

    @ViewBuilder
    private func navigationButtons(enabled: Bool) -> some View {
        HStack(spacing: 12) {
            Button {
                if step > 0 { step -= 1 }
            } label: {
                Text("Back")
                    .font(.headline)
                    .foregroundStyle(VibeTheme.textSecondary)
                    .frame(maxWidth: 120)
                    .frame(height: 52)
                    .background(
                        RoundedRectangle(cornerRadius: 16).stroke(VibeTheme.strokeStrong, lineWidth: 1.5)
                    )
            }

            Button {
                advance()
            } label: {
                Text("Next").vibePrimaryButton(enabled)
            }
            .disabled(!enabled)
        }
    }

    private func advance() {
        if step < 3 { step += 1 }
    }

    private func toggle(_ id: Int, in set: inout Set<Int>) {
        if set.contains(id) { set.remove(id) } else { set.insert(id) }
    }

    private func finish() {
        Task {
            await appState.saveOnboarding(
                nature: selectedPersonalities.map(\.self),
                interests: selectedInterests.map(\.self),
                types: selectedPersonalities.map(\.self),
                bio: bio,
                emoji: emoji
            )
        }
    }
}

/// Tinder-style circular interest card.
private struct InterestCircle: View {
    let option: InterestOption
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Text(option.emoji)
                    .font(.system(size: 34))
                Text(option.title)
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
            .frame(width: 86, height: 86)
            .background(
                Circle()
                    .fill(isSelected ? VibeTheme.primary.opacity(0.32) : VibeTheme.surface)
            )
            .overlay(
                Circle()
                    .stroke(isSelected ? VibeTheme.lavender : VibeTheme.strokeStrong,
                            lineWidth: isSelected ? 2 : 1)
            )
            .shadow(color: isSelected ? VibeTheme.primary.opacity(0.7) : .clear, radius: isSelected ? 12 : 0)
            .scaleEffect(isSelected ? 1.06 : 1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isSelected)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(option.title)
        .accessibilityValue(isSelected ? "selected" : "not selected")
    }
}

private struct PersonalityCard: View {
    let option: PersonalityOption
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Text(option.emoji).font(.title3)
                Text(option.title)
                    .font(.headline)
                    .foregroundStyle(.white)
                Spacer()
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(isSelected ? VibeTheme.lavender : VibeTheme.textMuted)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(isSelected ? VibeTheme.primary.opacity(0.22) : VibeTheme.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(isSelected ? VibeTheme.lavender : VibeTheme.strokeStrong, lineWidth: 1)
            )
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(option.title)
        .accessibilityValue(isSelected ? "selected" : "not selected")
    }
}
