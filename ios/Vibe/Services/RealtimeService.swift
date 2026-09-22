import Foundation

/// Supabase Realtime (WebSocket) client for live message updates.
@MainActor
final class RealtimeService {
    private var webSocket: URLSessionWebSocketTask?
    private var onMessage: ((Message) -> Void)?
    private var refCounter = 0

    func connect(token: String, onMessage: @escaping (Message) -> Void) {
        self.onMessage = onMessage
        let anon = SupabaseConfig.anonKey
        let urlString = "wss://hsvcdyxelshvgofjvlim.supabase.co/realtime/v1/websocket?apikey=\(anon)&vsn=1.0.0"
        guard let url = URL(string: urlString) else { return }
        let session = URLSession(configuration: .default)
        webSocket = session.webSocketTask(with: url)
        webSocket?.resume()
        subscribeToMessages(token: token)
        receive()
    }

    func disconnect() {
        webSocket?.cancel(with: .goingAway, reason: nil)
        webSocket = nil
        onMessage = nil
    }

    private func subscribeToMessages(token: String) {
        let join: [String: Any] = [
            "topic": "realtime:public:messages",
            "event": "phoenix_join",
            "payload": [
                "access_token": token,
                "config": [
                    "postgres_changes": [
                        ["event": "INSERT", "schema": "public", "table": "messages"]
                    ]
                ]
            ],
            "ref": "\(nextRef())"
        ]
        send(json: join)
    }

    private func receive() {
        webSocket?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.handle(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self.handle(text)
                    }
                @unknown default:
                    break
                }
                self.receive()
            case .failure:
                break
            }
        }
    }

    private func handle(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              json["event"] as? String == "postgres_changes",
              let payload = json["payload"] as? [String: Any],
              let dataPayload = payload["data"] as? [String: Any],
              let new = dataPayload["new"] as? [String: Any] else { return }
        guard let message = decode(new) else { return }
        onMessage?(message)
    }

    private func decode(_ dict: [String: Any]) -> Message? {
        guard let id = dict["id"] as? String,
              let senderId = dict["sender_id"] as? String else { return nil }
        return Message(
            id: id,
            senderId: senderId,
            roomId: dict["room_id"] as? String,
            receiverId: dict["receiver_id"] as? String,
            kind: dict["kind"] as? String ?? "text",
            content: dict["content"] as? String ?? "",
            objectPath: dict["object_path"] as? String,
            createdAt: dict["created_at"] as? String ?? ""
        )
    }

    private func send(json: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: json),
              let text = String(data: data, encoding: .utf8) else { return }
        webSocket?.send(.string(text)) { _ in }
    }

    private func nextRef() -> Int {
        refCounter += 1
        return refCounter
    }
}
