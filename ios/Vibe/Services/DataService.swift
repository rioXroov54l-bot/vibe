import Foundation

/// Native PostgREST data access for profiles, rooms and messages.
/// Table/column names mirror the live Supabase schema in db/supabase-schema.sql.
final class DataService {
    private let client = SupabaseClient()

    // MARK: Profile

    func fetchProfile(id: String, token: String) async throws -> Profile {
        let rows: [Profile] = try await client.send(
            "rest/v1/vibe_profiles?id=eq.\(id)",
            token: token
        )
        guard let profile = rows.first else {
            throw SupabaseError(message: "Profile not found.", code: "profile_not_found", status: 404)
        }
        return profile
    }

    /// Create or update the profile row for a user.
    func upsertProfile(id: String, displayName: String, bio: String, data: [String: JSONValue], token: String) async throws {
        let body: [String: JSONValue] = [
            "display_name": .string(displayName),
            "bio": .string(bio),
            "data": .object(data)
        ]
        // The live database grants UPDATE (not INSERT) on vibe_profiles, and a
        // trigger already creates the profile row at signup, so update via PATCH.
        let rows: [Profile] = try await client.send(
            "rest/v1/vibe_profiles?id=eq.\(id)",
            method: "PATCH",
            token: token,
            body: body,
            extraHeaders: ["Prefer": "return=representation"]
        )
        guard !rows.isEmpty else {
            throw SupabaseError(message: "Profile could not be updated.", code: "update_failed", status: 404)
        }
    }

    // MARK: Rooms

    func fetchRooms(token: String) async throws -> [Room] {
        try await client.send(
            "rest/v1/vibe_rooms?order=created_at.desc&limit=100",
            token: token
        )
    }

    func createRoom(ownerId: String, title: String, category: Int, kind: String, token: String) async throws -> Room {
        let body: [String: JSONValue] = [
            "owner_id": .string(ownerId),
            "title": .string(title),
            "category": .number(Double(category)),
            "kind": .string(kind)
        ]
        let rows: [Room] = try await client.send(
            "rest/v1/vibe_rooms",
            method: "POST",
            token: token,
            body: body,
            extraHeaders: ["Prefer": "return=representation"]
        )
        guard let room = rows.first else {
            throw SupabaseError(message: "Room was not created.", code: "create_failed", status: 500)
        }
        return room
    }

    func joinRoom(roomId: String, userId: String, token: String) async throws {
        let body: [String: JSONValue] = [
            "room_id": .string(roomId),
            "user_id": .string(userId)
        ]
        try await client.sendNoContent(
            "rest/v1/vibe_members",
            method: "POST",
            token: token,
            body: body,
            extraHeaders: ["Prefer": "return=minimal,resolution=ignore-duplicates"]
        )
    }

    // MARK: Messages

    func fetchMessages(roomId: String, token: String) async throws -> [Message] {
        try await client.send(
            "rest/v1/messages?room_id=eq.\(roomId)&order=created_at.desc&limit=60",
            token: token
        )
    }

    func sendRoomMessage(authorId: String, roomId: String, body: String, token: String) async throws -> Message {
        let payload: [String: JSONValue] = [
            "sender_id": .string(authorId),
            "room_id": .string(roomId),
            "kind": .string("text"),
            "content": .string(body)
        ]
        let rows: [Message] = try await client.send(
            "rest/v1/messages",
            method: "POST",
            token: token,
            body: payload,
            extraHeaders: ["Prefer": "return=representation"]
        )
        guard let message = rows.first else {
            throw SupabaseError(message: "Message was not sent.", code: "send_failed", status: 500)
        }
        return message
    }

    // MARK: Preferences / onboarding

    func fetchPreferences(userId: String, token: String) async throws -> Preferences? {
        let rows: [Preferences] = try await client.send(
            "rest/v1/preferences?user_id=eq.\(userId)",
            token: token
        )
        return rows.first
    }

    func upsertPreferences(
        userId: String,
        selectedInterests: [Int],
        personalityAnswers: [Int],
        completed: Bool,
        token: String
    ) async throws {
        let body: [String: JSONValue] = [
            "user_id": .string(userId),
            "selected_interests": .array(selectedInterests.map { .number(Double($0)) }),
            "personality_answers": .array(personalityAnswers.map { .number(Double($0)) }),
            "onboarding_completed": .bool(completed)
        ]
        let rows: [Preferences] = try await client.send(
            "rest/v1/preferences",
            method: "POST",
            token: token,
            body: body,
            extraHeaders: ["Prefer": "return=representation,resolution=merge-duplicates"]
        )
        if rows.isEmpty {
            throw SupabaseError(message: "Preferences could not be saved.", code: "save_failed", status: 500)
        }
    }

    // MARK: People

    func fetchPeople(excluding id: String, token: String) async throws -> [Profile] {
        try await client.send(
            "rest/v1/vibe_profiles?select=id,display_name,bio,data&id=neq.\(id)&limit=50",
            token: token
        )
    }
}
