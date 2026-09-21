import SwiftUI

enum OnboardingStep: Int, CaseIterable {
    case welcome
    case identity
    case interests
    case personality
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
    @Published var personality: [String] = []
    @Published var favoriteActivities = ""
    @Published var communityPreference = ""
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
        case .personality:
            return !personality.isEmpty
        case .profile:
            return !favoriteActivities.trimmingCharacters(in: .whitespaces).isEmpty
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
                data: [
                    "nature": nature,
                    "interests": interests,
                    "types": types,
                    "personality": personality,
                    "favorite_activities": favoriteActivities,
                    "community_preference": communityPreference
                ],
                token: accessToken
            )
            let step1 = try JSONSerialization.data(withJSONObject: ["step": 1, "values": nature])
            try await backend.requestNoContent(path: "/api/cloud/onboarding", method: "POST", body: step1, token: accessToken)
            let step2 = try JSONSerialization.data(withJSONObject: ["step": 2, "values": interests, "types": types])
            try await backend.requestNoContent(path: "/api/cloud/onboarding", method: "POST", body: step2, token: accessToken)
            let step3 = try JSONSerialization.data(withJSONObject: ["step": 3])
            try await backend.requestNoContent(path: "/api/cloud/onboarding", method: "POST", body: step3, token: accessToken)
            let preferences = try JSONSerialization.data(withJSONObject: [
                "selected_interests": interests,
                "personality_answers": personality,
                "onboarding_completed": true
            ])
            try await backend.requestNoContent(path: "/api/cloud/preferences", method: "POST", body: preferences, token: accessToken)
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

    private let interestOptions: [(emoji: String, title: String)] = [
        ("🎵", "Music"),
        ("🎬", "Movies"),
        ("🎮", "Gaming"),
        ("✈️", "Travel"),
        ("🍔", "Food"),
        ("🏋️", "Fitness"),
        ("📸", "Photography"),
        ("🎨", "Art"),
        ("💻", "Technology"),
        ("📚", "Books"),
        ("⚽", "Sports"),
        ("👗", "Fashion")
    ]

    private let personalityOptions = [
        "Creative",
        "Funny",
        "Adventurous",
        "Calm",
        "Social",
        "Intellectual"
    ]

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
                    case .personality:
                        personalityStep
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
        ZStack {
            VibeBackground()
            VStack(spacing: 22) {
                VibeLogo(size: 68)
                Text("Welcome to Vibe")
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)
                Text("We want to understand your interests and personality to create your perfect experience.")
                    .font(.body)
                    .foregroundStyle(.white.opacity(0.82))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
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
        ScrollView {
            VStack(spacing: 18) {
                Text("Choose your interests")
                    .font(.title2.bold())
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 92), spacing: 16)], spacing: 18) {
                    ForEach(Array(interestOptions.enumerated()), id: \.offset) { index, item in
                        let selected = model.interests.contains(index)
                        Button {
                            withAnimation(.spring(response: 0.28, dampingFraction: 0.7)) {
                                if selected {
                                    model.interests.removeAll { $0 == index }
                                } else {
                                    model.interests.append(index)
                                }
                            }
                        } label: {
                            VStack(spacing: 8) {
                                Text(item.emoji)
                                    .font(.system(size: 34))
                                Text(item.title)
                                    .font(.caption.weight(.semibold))
                                    .lineLimit(1)
                            }
                            .frame(width: 92, height: 92)
                            .background(
                                selected ? Color.purple.opacity(0.22) : Color(.secondarySystemBackground),
                                in: Circle()
                            )
                            .overlay(
                                Circle().stroke(
                                    selected ? Color.purple : Color.clear,
                                    lineWidth: 3
                                )
                            )
                            .shadow(
                                color: selected ? Color.purple.opacity(0.8) : Color.clear,
                                radius: selected ? 10 : 0
                            )
                            .scaleEffect(selected ? 1.06 : 1.0)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding()
        }
    }

    private var profileStep: some View {
        Form {
            Section("About you") {
                TextEditor(text: $model.bio)
                    .frame(height: 90)
            }
            Section("Favorite activities") {
                TextField("e.g. Music, hiking, gaming", text: $model.favoriteActivities)
            }
            Section("Community preferences") {
                TextField("e.g. Calm and friendly rooms", text: $model.communityPreference)
            }
        }
    }

    private var personalityStep: some View {
        ScrollView {
            VStack(spacing: 18) {
                Text("What type of people do you enjoy meeting?")
                    .font(.title2.bold())
                    .multilineTextAlignment(.center)

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 14)], spacing: 14) {
                    ForEach(personalityOptions, id: \.self) { option in
                        let selected = model.personality.contains(option)
                        Button {
                            withAnimation(.spring(response: 0.28, dampingFraction: 0.7)) {
                                if selected {
                                    model.personality.removeAll { $0 == option }
                                } else {
                                    model.personality.append(option)
                                }
                            }
                        } label: {
                            Text(option)
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 18)
                                .background(
                                    selected ? Color.purple.opacity(0.22) : Color(.secondarySystemBackground),
                                    in: RoundedRectangle(cornerRadius: 18)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 18)
                                        .stroke(selected ? Color.purple : Color.clear, lineWidth: 2)
                                )
                                .shadow(
                                    color: selected ? Color.purple.opacity(0.6) : Color.clear,
                                    radius: selected ? 8 : 0
                                )
                                .scaleEffect(selected ? 1.04 : 1.0)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding()
        }
    }

    private var reviewStep: some View {
        List {
            Section("Review") {
                Text("Your Vibe is ready")
                    .font(.title2.bold())
                LabeledContent("Name", value: model.displayName)
                LabeledContent("Username", value: "@\(model.username.lowercased())")
                LabeledContent("Interests", value: "\(model.interests.count) selected")
                LabeledContent("Personality", value: "\(model.personality.count) selected")
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
                        Text("Enter Vibe")
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(model.isLoading)
            } else {
                Button("Continue") { model.next() }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .disabled(!model.canContinue)
            }
        }
        .padding()
        .background(.bar)
    }
}
