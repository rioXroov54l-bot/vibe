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
            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 16)], spacing: 16) {
                    ForEach(0..<12, id: \.self) { index in
                        RoundedRectangle(cornerRadius: 20)
                            .fill(.thinMaterial)
                            .frame(height: 190)
                            .overlay(Text("\(index + 1)").font(.largeTitle.bold()))
                    }
                }
                .padding()
            }
            .navigationTitle("Discover")
        }
    }
}

struct RoomsView: View {
    var body: some View {
        NavigationStack {
            List(1...6, id: \.self) { index in
                HStack {
                    Image(systemName: "person.3.fill")
                    Text("Room \(index)")
                }
            }
            .navigationTitle("Rooms")
        }
    }
}
