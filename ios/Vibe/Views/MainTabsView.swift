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
    var body: some View {
        NavigationStack {
            ContentUnavailableView(
                "No rooms yet",
                systemImage: "sparkles",
                description: Text("Rooms you join will appear here.")
            )
            .navigationTitle("Discover")
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
