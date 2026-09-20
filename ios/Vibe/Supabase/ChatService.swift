import Foundation

struct Conversation: Decodable, Identifiable {
    let id: String
    let peerName: String?
    let lastMessage: String?
}

struct ChatMessagePayload: Decodable, Identifiable {
    let id: String
    let body: String
    let createdAt: String
    let authorID: String

    enum CodingKeys: String, CodingKey {
        case id
        case body
        case createdAt = "created_at"
        case authorID = "author_id"
    }
}

final class ChatService {
    private let backend = SupabaseService.shared

    func inbox(token: String) async throws -> [ChatMessagePayload] {
        let response: InboxResponse = try await backend.request(
            path: "/api/cloud/inbox",
            method: "GET",
            token: token
        )
        return response.messages
    }

    func messages(peerID: String, token: String) async throws -> [ChatMessagePayload] {
        let response: MessagesResponse = try await backend.request(
            path: "/api/cloud/messages?peer=\(peerID)",
            method: "GET",
            token: token
        )
        return response.messages
    }

    func send(text: String, peerID: String, token: String) async throws {
        let body = try JSONEncoder().encode(["recipient_id": peerID, "body": text])
        try await backend.requestNoContent(
            path: "/api/cloud/messages",
            method: "POST",
            body: body,
            token: token
        )
    }
}

private struct InboxResponse: Decodable {
    let messages: [ChatMessagePayload]
}

private struct MessagesResponse: Decodable {
    let messages: [ChatMessagePayload]
}
