import SwiftUI

struct ChatView: View {
    @State private var messages = [ChatMessage]()
    @State private var text = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    LazyVStack {
                        ForEach(messages) { message in
                            HStack {
                                if message.isMine { Spacer(minLength: 50) }
                                Text(message.text)
                                    .padding()
                                    .background(message.isMine ? Color.purple.opacity(0.8) : Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 18))
                                    .foregroundStyle(message.isMine ? .white : .primary)
                                if !message.isMine { Spacer(minLength: 50) }
                            }
                            .padding(.horizontal)
                        }
                    }
                }

                HStack {
                    TextField("Message", text: $text)
                        .padding()
                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 18))
                    Button("Send") {
                        guard !text.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                        messages.append(ChatMessage(id: UUID().uuidString, text: text, isMine: true))
                        text = ""
                    }
                }
                .padding()
            }
            .navigationTitle("Chat")
        }
    }
}

struct ChatMessage: Identifiable {
    let id: String
    let text: String
    let isMine: Bool
}
