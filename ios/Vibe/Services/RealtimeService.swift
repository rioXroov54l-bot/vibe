import Foundation

/// Singleton WebSocket manager for Supabase Realtime with automatic
/// exponential-backoff reconnection and re-subscription.
@MainActor
final class RealtimeService {
    static let shared = RealtimeService()

    private var webSocket: URLSessionWebSocketTask?
    private var token: String?
    private var shouldReconnect = false
    private var retryAttempt = 0
    private var messageHandler: ((Message) -> Void)?
    private var roomHandler: ((Room) -> Void)?
    private var roomDeletedHandler: ((String) -> Void)?
    private var memberHandler: ((String, Bool) -> Void)?

    private var subscribedTables: Set<String> = []

    private var url: URL? {
        let anon = SupabaseConfig.anonKey
        return URL(string: "wss://hsvcdyxelshvgofjvlim.supabase.co/realtime/v1/websocket?apikey=\(anon)&vsn=1.0.0")
    }

    func connect(token: String) {
        self.token = token
        shouldReconnect = true
        retryAttempt = 0
        openSocket()
    }

    func disconnect() {
        shouldReconnect = false
        retryAttempt = 0
        webSocket?.cancel(with: .goingAway, reason: nil)
        webSocket = nil
    }

    func subscribeToMessages(_ handler: @escaping (Message) -> Void) {
        messageHandler = handler
        joinTable("messages", event: "INSERT")
    }

    /// Listen for room inserts and deletes so the lobby feed stays in sync
    /// without manual pull-to-refresh (e.g. `room:expired` eviction).
    func subscribeToRooms(onInsert: @escaping (Room) -> Void, onDelete: @escaping (String) -> Void) {
        roomHandler = onInsert
        roomDeletedHandler = onDelete
        joinTable("vibe_rooms", event: "*")
    }

    /// Track presence: member joins/leaves so live listener counts update.
    func subscribeToMembers(_ handler: @escaping (String, Bool) -> Void) {
        memberHandler = handler
        joinTable("vibe_members", event: "*")
    }

    // MARK: Connection

    private func openSocket() {
        guard let url else { return }
        let session = URLSession(configuration: .default)
        webSocket = session.webSocketTask(with: url)
        webSocket?.resume()
        for table in subscribedTables {
            let event = table == "messages" ? "INSERT" : "*"
            sendJoin(table: table, event: event)
        }
        receive()
    }

    private func joinTable(_ table: String, event: String) {
        subscribedTables.insert(table)
        if webSocket != nil {
            sendJoin(table: table, event: event)
        }
    }

    private func sendJoin(table: String, event: String) {
        let topic = "realtime:public:\(table)"
        let config: [[String: String]] = [["event": event, "schema": "public", "table": table]]
        var payload: [String: Any] = ["config": ["postgres_changes": config]]
        if let token { payload["access_token"] = token }
        let join: [String: Any] = [
            "topic": topic,
            "event": "phoenix_join",
            "payload": payload,
            "ref": "\(retryAttempt)"
        ]
        send(json: join)
    }

    private func receive() {
        webSocket?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let message):
                self.handle(message)
                self.retryAttempt = 0
                self.receive()
            case .failure:
                self.handleDisconnect()
            }
        }
    }

    private func handleDisconnect() {
        guard shouldReconnect else { return }
        retryAttempt += 1
        let seconds = min(pow(2.0, Double(retryAttempt)), 64.0)
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { [weak self] in
            self?.openSocket()
        }
    }

    // MARK: Incoming events

    private func handle(_ message: URLSessionWebSocketTask.Message) {
        let text: String?
        switch message {
        case .string(let s): text = s
        case .data(let d): text = String(data: d, encoding: .utf8)
        @unknown default: text = nil
        }
        guard let text,
              let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              json["event"] as? String == "postgres_changes",
              let payload = json["payload"] as? [String: Any],
              let dataPayload = payload["data"] as? [String: Any],
              let table = dataPayload["table"] as? String else { return }

        let type = (dataPayload["type"] as? String)?.uppercased() ?? "INSERT"
        let record = dataPayload["record"] as? [String: Any] ?? dataPayload["new"] as? [String: Any]
        let oldRecord = dataPayload["old_record"] as? [String: Any] ?? dataPayload["old"] as? [String: Any]

        switch table {
        case "messages":
            if type == "INSERT", let record, let message = decodeMessage(record) {
                messageHandler?(message)
            }
        case "vibe_rooms":
            if type == "DELETE", let oldRecord, let id = oldRecord["id"] as? String {
                roomDeletedHandler?(id)
            } else if type == "INSERT", let record, let room = decodeRoom(record) {
                roomHandler?(room)
            }
        case "vibe_members":
            if let record = record ?? oldRecord, let roomId = record["room_id"] as? String {
                memberHandler?(roomId, type == "INSERT")
            }
        default:
            break
        }
    }

    private func decodeMessage(_ dict: [String: Any]) -> Message? {
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

    private func decodeRoom(_ dict: [String: Any]) -> Room? {
        guard let id = dict["id"] as? String,
              let ownerId = dict["owner_id"] as? String,
              let title = dict["title"] as? String else { return nil }
        return Room(
            id: id,
            ownerId: ownerId,
            title: title,
            category: dict["category"] as? Int ?? 1,
            kind: dict["kind"] as? String ?? "voice",
            createdAt: dict["created_at"] as? String ?? "",
            isPrivate: dict["is_private"] as? Bool ?? false,
            passcodeHash: dict["passcode_hash"] as? String
        )
    }

    private func send(json: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: json),
              let text = String(data: data, encoding: .utf8) else { return }
        webSocket?.send(.string(text)) { _ in }
    }
}
