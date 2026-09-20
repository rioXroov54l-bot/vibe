import SwiftUI

enum OnboardingStep: Int, CaseIterable {
    case welcome
    case identity
    case interests
    case profile
    case review
}

@MainActor
final class OnboardingViewModel: ObservableObject {
    @Published var step: OnboardingStep = .welcome
    @Published var displayName = ""
    @Published var username = ""
    @Published var bio = ""
    @Published var nature: [Int] = []
    @Published var interests: [Int] = []
    @Published var types: [Int] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let profileService = ProfileService()
    private let backend = SupabaseService.shared

    var canContinue: Bool {
        switch step {
        case .welcome:
            return true
        case .identity:
            return !displayName.trimmingCharacters(in: .whitespaces).isEmpty
                && username.count >= 3
        case .interests:
            return !interests.isEmpty
        case .profile:
            return !bio.trimmingCharacters(in: .whitespaces).isEmpty
        case .review:
            return true
        }
    }

    func next() {
        guard let current = OnboardingStep(rawValue: step.rawValue + 1) else { return }
        step = current
    }

    func back() {
        guard let previous = OnboardingStep(rawValue: step.rawValue - 1) else { return }
        step = previous
    }

    func finish(accessToken: String, appState: AppState) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            try await profileService.updateUsername(username.lowercased(), token: accessToken)
            try await profileService.updateProfile(
                displayName: displayName,
                bio: bio,
                data: ["nature": nature, "interests": interests, "types": types],
                token: accessToken
            )
            let step1 = try JSONSerialization.data(withJSONObject: ["step": 1, "values": nature])
            try await backend.requestNoContent(path: "/api/cloud/onboarding", method: "POST", body: step1, token: accessToken)
            let step2 = try JSONSerialization.data(withJSONObject: ["step": 2, "values": interests, "types": types])
            try await backend.requestNoContent(path: "/api/cloud/onboarding", method: "POST", body: step2, token: accessToken)
            let step3 = try JSONSerialization.data(withJSONObject: ["step": 3])
            try await backend.requestNoContent(path: "/api/cloud/onboarding", method: "POST", body: step3, token: accessToken)
            try await appState.loadProfile()
            appState.isOnboardingComplete = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct OnboardingFlowView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var model = OnboardingViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ProgressView(value: Double(model.step.rawValue + 1), total: Double(OnboardingStep.allCases.count))
                    .tint(.purple)
                    .padding()

                Group {
                    switch model.step {
                    case .welcome:
                        welcomeStep
                    case .identity:
                        identityStep
                    case .interests:
                        interestsStep
                    case .profile:
                        profileStep
                    case .review:
                        reviewStep
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                bottomBar
            }
            .background(Color(.systemGroupedBackground))
        }
    }

    private var welcomeStep: some View {
        VStack(spacing: 18) {
            Text("Welcome to Vibe")
                .font(.largeTitle.bold())
            Text("Find your kind of people. Complete a few steps to personalize your experience.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 28)
        }
    }

    private var identityStep: some View {
        Form {
            Section("Identity") {
                TextField("Display name", text: $model.displayName)
                TextField("Username", text: $model.username)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
        }
    }

    private var interestsStep: some View {
        VStack(spacing: 16) {
            Text("Choose your interests")
                .font(.title2.bold())
            ForEach(["Music", "Games", "Languages", "Art", "Fitness", "Travel"], id: \.self) { interest in
                Button {
                    let index = ["Music", "Games", "Languages", "Art", "Fitness", "Travel"].firstIndex(of: interest) ?? 0
                    if model.interests.contains(index) {
                        model.interests.removeAll { $0 == index }
                    } else {
                        model.interests.append(index)
                    }
                } label: {
                    HStack {
                        Text(interest)
                        Spacer()
                        if model.interests.contains(["Music", "Games", "Languages", "Art", "Fitness", "Travel"].firstIndex(of: interest) ?? 0) {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.purple)
                        }
                    }
                    .padding()
                    .background(.background, in: RoundedRectangle(cornerRadius: 14))
                }
            }
        }
        .padding()
    }

    private var profileStep: some View {
        Form {
            Section("About you") {
                TextEditor(text: $model.bio)
                    .frame(height: 120)
            }
        }
    }

    private var reviewStep: some View {
        List {
            Section("Review") {
                LabeledContent("Name", value: model.displayName)
                LabeledContent("Username", value: "@\(model.username.lowercased())")
                LabeledContent("Interests", value: "\(model.interests.count) selected")
            }
        }
    }

    private var bottomBar: some View {
        HStack {
            if model.step != .welcome {
                Button("Back") { model.back() }
                    .buttonStyle(.bordered)
            }

            Spacer()

            if model.step == .review {
                Button {
                    guard let token = appState.session?.accessToken else { return }
                    Task { await model.finish(accessToken: token, appState: appState) }
                } label: {
                    if model.isLoading {
                        ProgressView()
                    } else {
                        Text("Finish")
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(model.isLoading)
            } else {
                Button("Continue") { model.next() }
                    .buttonStyle(.borderedProminent)
                    .disabled(!model.canContinue)
            }
        }
        .padding()
        .background(.bar)
    }
}
