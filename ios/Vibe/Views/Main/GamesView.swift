import SwiftUI

/// A self-contained word-unscramble challenge, matching the web "word
/// challenges" interaction without requiring a backend.
struct GamesView: View {
    private let words = ["WAVE", "VIBE", "NEON", "PULSE", "GLOW", "ECHO", "MOOD", "BEAT", "NIGHT", "CROWD"]

    @State private var currentIndex = 0
    @State private var scrambled = ""
    @State private var answer = ""
    @State private var score = 0
    @State private var resultMessage: String?

    var body: some View {
        ZStack {
            VibeTheme.backgroundGradient.ignoresSafeArea()
            VStack(spacing: 24) {
                HStack {
                    Text(L10n.wordChallenge)
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    Spacer()
                    Text("\(score) pts")
                        .font(.headline.weight(.bold))
                        .foregroundStyle(VibeTheme.lavender)
                }

                VStack(spacing: 18) {
                    Text(L10n.unscrambleThis)
                        .font(.subheadline)
                        .foregroundStyle(VibeTheme.textSecondary)

                    Text(scrambled)
                        .font(.system(size: 42, weight: .black, design: .rounded))
                        .tracking(8)
                        .foregroundStyle(
                            LinearGradient(colors: [VibeTheme.lavender, VibeTheme.pink],
                                           startPoint: .top, endPoint: .bottom)
                        )

                    TextField("Your answer", text: $answer)
                        .vibeField()
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .font(.title3.weight(.semibold))
                        .multilineTextAlignment(.center)
                        .onSubmit { check() }

                    if let resultMessage {
                        Text(resultMessage)
                            .font(.footnote.weight(.medium))
                            .foregroundStyle(resultMessage == "Correct!" ? VibeTheme.mint : VibeTheme.pink)
                    }

                    Button {
                        check()
                    } label: {
                        Text(L10n.submit).vibePrimaryButton(!answer.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                    .disabled(answer.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .vibeCard()

                Button("Skip") {
                    next()
                }
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textSecondary)

                Spacer()
            }
            .padding(20)
        }
        .navigationTitle("Games")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { scramble() }
    }

    private func scramble() {
        let word = words[currentIndex]
        let characters = word.shuffled()
        scrambled = String(characters)
        answer = ""
        resultMessage = nil
    }

    private func check() {
        let trimmed = answer.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard trimmed == words[currentIndex] else {
            resultMessage = "Try again."
            return
        }
        score += 1
        resultMessage = "Correct!"
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { next() }
    }

    private func next() {
        currentIndex = (currentIndex + 1) % words.count
        scramble()
    }
}
