import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject private var appState: AppState
    @EnvironmentObject private var localization: LocalizationManager

    @State private var step = 0
    @State private var selections: [String: Set<String>] = [:]
    @State private var expandedCategories: Set<String> = []
    @State private var onboardingError: String?

    private var groups: [OnboardingGroup] {
        switch step {
        case 0: return LifestyleData.groups
        case 1: return PersonalityData.groups
        default: return InterestData.categories
        }
    }

    private var selectedInterestCount: Int {
        InterestData.categories.reduce(0) { $0 + (selections[$1.id]?.count ?? 0) }
    }

    var body: some View {
        ZStack {
            CosmicBackground()

            VStack(spacing: 0) {
                header
                ScrollView {
                    VStack(alignment: .leading, spacing: 26) {
                        titleBlock
                        if step == 2 {
                            interestsContent
                        } else {
                            chipsContent
                        }
                    }
                    .padding(.horizontal, 22)
                    .padding(.top, 16)
                    .padding(.bottom, 24)
                }
                footer
            }
        }
        .navigationBarBackButtonHidden(true)
    }

    // MARK: Header

    private var header: some View {
        HStack {
            Button {
                goBack()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.85))
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(.white.opacity(0.08)))
                    .flipsForRightToLeftLayoutDirection(true)
            }

            Spacer()
            progressBar
            Spacer()

            Color.clear.frame(width: 36, height: 36)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    private var progressBar: some View {
        HStack(spacing: 6) {
            ForEach(0..<3, id: \.self) { index in
                Capsule()
                    .fill(index <= step ? VibeTheme.lavender : .white.opacity(0.16))
                    .frame(height: 5)
            }
        }
        .padding(.horizontal, 8)
    }

    // MARK: Title

    private var titleBlock: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(currentTitle)
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            Text(currentSubtitle)
                .font(.subheadline)
                .foregroundStyle(VibeTheme.textSecondary)
            if step == 2 {
                Text(String(format: L10n.selectedCount, selectedInterestCount))
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(selectedInterestCount >= 3 ? VibeTheme.mint : VibeTheme.pink)
            }
        }
    }

    private var currentTitle: String {
        switch step {
        case 0: return L10n.lifestyleTitle
        case 1: return L10n.personalityTitle
        default: return L10n.interestsTitle
        }
    }

    private var currentSubtitle: String {
        switch step {
        case 0: return L10n.lifestyleSubtitle
        case 1: return L10n.personalitySubtitle
        default: return L10n.interestsSubtitle
        }
    }

    // MARK: Content

    private var chipsContent: some View {
        VStack(alignment: .leading, spacing: 24) {
            ForEach(groups) { group in
                OptionGroupView(group: group, selection: selectionBinding(for: group.id))
            }
        }
    }

    private var interestsContent: some View {
        VStack(alignment: .leading, spacing: 20) {
            ForEach(groups) { group in
                InterestCategoryView(
                    group: group,
                    selection: selectionBinding(for: group.id),
                    isExpanded: expandedCategories.contains(group.id),
                    onToggleExpand: { toggleExpand(group.id) }
                )
            }
        }
    }

    private func selectionBinding(for groupId: String) -> Binding<Set<String>> {
        Binding(
            get: { selections[groupId] ?? [] },
            set: { selections[groupId] = $0 }
        )
    }

    // MARK: Footer

    private var footer: some View {
        VStack(spacing: 10) {
            if let error = onboardingError ?? appState.errorMessage {
                Text(error)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(VibeTheme.pink)
                    .multilineTextAlignment(.center)
            }
            Button {
                goNext()
            } label: {
                Text(L10n.next)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(Capsule().fill(.white))
            }
            .buttonStyle(PressableButtonStyle())
        }
        .padding(.horizontal, 22)
        .padding(.vertical, 16)
        .zIndex(1)
    }

    private func goNext() {
        if step == 2 && selectedInterestCount < 3 {
            onboardingError = L10n.selectAtLeastThree
            return
        }
        onboardingError = nil
        if step < 2 {
            step += 1
        } else {
            finish()
        }
    }

    // MARK: Actions

    private func goBack() {
        if step > 0 {
            step -= 1
        } else {
            appState.authFlow = .welcome
        }
    }

    private func toggleExpand(_ id: String) {
        if expandedCategories.contains(id) { expandedCategories.remove(id) } else { expandedCategories.insert(id) }
    }

    private func finish() {
        var lifestyle: [String: [String]] = [:]
        var personality: [String: [String]] = [:]
        for group in LifestyleData.groups {
            lifestyle[group.id] = (selections[group.id] ?? []).compactMap { id in group.options.first(where: { $0.id == id })?.en }
        }
        for group in PersonalityData.groups {
            personality[group.id] = (selections[group.id] ?? []).compactMap { id in group.options.first(where: { $0.id == id })?.en }
        }
        let interests = InterestData.categories
            .flatMap { $0.options }
            .filter { selections[$0.id.split(separator: ".").first.map(String.init) ?? ""]?.contains($0.id) == true }
            .map(\.en)

        Task {
            await appState.saveOnboarding(
                lifestyle: lifestyle,
                personality: personality,
                interests: interests,
                bio: "",
                emoji: "😎"
            )
        }
    }
}

// MARK: - Reusable option group

private struct OptionGroupView: View {
    let group: OnboardingGroup
    @Binding var selection: Set<String>

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(group.localizedTitle)
                .font(.headline.weight(.semibold))
                .foregroundStyle(.white)
            ChipFlow(group: group, selection: $selection)
        }
    }
}

private struct ChipFlow: View {
    let group: OnboardingGroup
    @Binding var selection: Set<String>

    var body: some View {
        FlowLayout(spacing: 8) {
            ForEach(group.options) { option in
                ChipView(
                    label: option.localized,
                    isSelected: selection.contains(option.id)
                ) {
                    if group.multiSelect {
                        if selection.contains(option.id) { selection.remove(option.id) } else { selection.insert(option.id) }
                    } else {
                        selection = [option.id]
                    }
                }
            }
        }
    }
}

private struct ChipView: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(isSelected ? .white : .white.opacity(0.8))
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Capsule().fill(isSelected ? VibeTheme.primary.opacity(0.7) : .white.opacity(0.08)))
                .overlay(Capsule().stroke(isSelected ? VibeTheme.lavender : .white.opacity(0.16), lineWidth: 1))
                .animation(.spring(response: 0.25, dampingFraction: 0.7), value: isSelected)
        }
        .buttonStyle(.plain)
    }
}

private struct InterestCategoryView: View {
    let group: OnboardingGroup
    @Binding var selection: Set<String>
    let isExpanded: Bool
    let onToggleExpand: () -> Void

    private let collapsedCount = 8

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(group.localizedTitle)
                .font(.headline.weight(.semibold))
                .foregroundStyle(.white)

            FlowLayout(spacing: 8) {
                ForEach(visibleOptions) { option in
                    ChipView(label: option.localized, isSelected: selection.contains(option.id)) {
                        if selection.contains(option.id) { selection.remove(option.id) } else { selection.insert(option.id) }
                    }
                }
            }

            if group.options.count > collapsedCount {
                Button(isExpanded ? L10n.showLess : L10n.showMore) {
                    onToggleExpand()
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(VibeTheme.lavender)
            }
        }
    }

    private var visibleOptions: [OnboardingOption] {
        isExpanded ? group.options : Array(group.options.prefix(collapsedCount))
    }
}

/// Provides instant scale + opacity feedback on press for touch reliability.
struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .animation(.spring(response: 0.22, dampingFraction: 0.7), value: configuration.isPressed)
    }
}
