import SwiftUI

struct ChatListView: View {
    @State private var conversations: [Conversation] = []

    var body: some View {
        NavigationStack {
            List(conversations) { conversation in
                NavigationLink {
                    ChatView()
                } label: {
                    HStack {
                        Circle()
                            .fill(.thinMaterial)
                            .frame(width: 48, height: 48)
                            .overlay(Text(String(conversation.peerName?.prefix(1) ?? "V")))
                        VStack(alignment: .leading) {
                            Text(conversation.peerName ?? "Vibe member")
                                .font(.headline)
                            Text(conversation.lastMessage ?? "No messages yet")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                    }
                }
            }
            .navigationTitle("Chat")
        }
    }
}
