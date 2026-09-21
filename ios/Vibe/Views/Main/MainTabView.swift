import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            DiscoveryView()
                .tabItem { Label("Discover", systemImage: "sparkles") }
            RoomsView()
                .tabItem { Label("Rooms", systemImage: "person.3.fill") }
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
        }
        .tint(VibeTheme.lavender)
    }
}
