import SwiftUI

struct MainTabsView: View {
    var body: some View {
        TabView {
            DiscoverView()
                .tabItem { Label("Discover", systemImage: "sparkles") }
            ChatListView()
                .tabItem { Label("Chat", systemImage: "bubble.left.and.bubble.right") }
            RoomsView()
                .tabItem { Label("Rooms", systemImage: "person.3") }
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
        }
    }
}

struct DiscoverView: View {
    private let features: [(title: String, icon: String)] = [
        ("Rooms", "person.3"),
        ("Cinema Vibe", "film"),
        ("Live Podcast", "waveform"),
        ("Games", "gamecontroller"),
        ("Flash", "bolt"),
        ("Audio", "headphones"),
        ("Profiles", "person.crop.circle"),
        ("Messaging", "bubble.left.and.bubble.right"),
        ("Interactions", "heart")
    ]

    var body: some View {
        NavigationStack {
            List(features, id: \.title) { feature in
                NavigationLink {
                    featureDestination(feature.title)
                } label: {
                    Label(feature.title, systemImage: feature.icon)
                }
            }
            .navigationTitle("Discover")
        }
    }

    @ViewBuilder
    private func featureDestination(_ title: String) -> some View {
        switch title {
        case "Rooms":
            RoomsView()
        case "Profiles":
            ProfileView()
        case "Messaging":
            ChatListView()
        default:
            FeatureView(title: title)
        }
    }
}

struct FeatureView: View {
    let title: String

    var body: some View {
        ZStack {
            VibeBackground()
            VStack(spacing: 16) {
                VibeLogo(size: 58)
                Text(title)
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)
                Text("This Vibe experience is ready to connect.")
                    .foregroundStyle(.white.opacity(0.8))
            }
            .padding()
        }
    }
}

struct RoomsView: View {
    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "Rooms will appear here",
                systemImage: "person.3",
                description: Text("Join a room to start talking.")
            )
            .navigationTitle("Rooms")
        }
    }
}
