import Foundation

/// A Supabase Auth session as returned by the token endpoint.
struct AuthSession: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
    let user: AuthUser

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case user
    }
}

/// A Supabase Auth user.
struct AuthUser: Codable, Identifiable {
    let id: String
    let email: String?
    let userMetadata: [String: JSONValue]?

    enum CodingKeys: String, CodingKey {
        case id, email
        case userMetadata = "user_metadata"
    }

    var displayName: String {
        userMetadata?["display_name"]?.stringValue ?? ""
    }
}

/// A lenient JSON value that can decode heterogeneous payloads.
enum JSONValue: Codable, Equatable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null; return }
        if let b = try? c.decode(Bool.self) { self = .bool(b); return }
        if let n = try? c.decode(Double.self) { self = .number(n); return }
        if let s = try? c.decode(String.self) { self = .string(s); return }
        if let a = try? c.decode([JSONValue].self) { self = .array(a); return }
        if let o = try? c.decode([String: JSONValue].self) { self = .object(o); return }
        throw DecodingError.dataCorruptedError(in: c, debugDescription: "Unsupported JSON value")
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let s): try c.encode(s)
        case .number(let n): try c.encode(n)
        case .bool(let b): try c.encode(b)
        case .object(let o): try c.encode(o)
        case .array(let a): try c.encode(a)
        case .null: try c.encodeNil()
        }
    }

    var stringValue: String? {
        if case .string(let s) = self { return s }
        return nil
    }

    var boolValue: Bool? {
        if case .bool(let b) = self { return b }
        return nil
    }

    var numberValue: Double? {
        if case .number(let n) = self { return n }
        return nil
    }
}

/// The `vibe_profiles` row plus its `data` JSON payload.
struct Profile: Codable, Identifiable {
    let id: String
    var displayName: String
    var bio: String
    var data: [String: JSONValue]

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case bio
        case data
    }

    var avatarPath: String? { data["avatar"]?.stringValue }
    var emoji: String { data["emoji"]?.stringValue ?? "😎" }
    var nature: [Int] { (data["nature"]?.asIntArray) ?? [] }
    var interests: [Int] { (data["interests"]?.asIntArray) ?? [] }
    var types: [Int] { (data["types"]?.asIntArray) ?? [] }
}

/// A `vibe_rooms` row.
struct Room: Codable, Identifiable {
    let id: String
    let ownerId: String
    let title: String
    let category: Int
    let kind: String
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case ownerId = "owner_id"
        case title, category, kind
        case createdAt = "created_at"
    }
}

/// A `vibe_messages` row.
struct Message: Codable, Identifiable {
    let id: String
    let senderId: String
    let roomId: String?
    let receiverId: String?
    let kind: String
    let content: String
    let objectPath: String?
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id
        case senderId = "sender_id"
        case roomId = "room_id"
        case receiverId = "receiver_id"
        case kind, content
        case objectPath = "object_path"
        case createdAt = "created_at"
    }
}

/// The `preferences` row that tracks onboarding completion and selections.
struct Preferences: Codable {
    let userId: String
    let selectedInterests: [JSONValue]?
    let personalityAnswers: [JSONValue]?
    let onboardingCompleted: Bool

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case selectedInterests = "selected_interests"
        case personalityAnswers = "personality_answers"
        case onboardingCompleted = "onboarding_completed"
    }
}

extension JSONValue {
    var asIntArray: [Int]? {
        guard case .array(let values) = self else { return nil }
        return values.compactMap { $0.numberValue.map(Int.init) }
    }
}
