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

    /// Live participant counts per room, read from the membership table.
    func fetchMemberCounts(token: String) async throws -> [String: Int] {
        struct MemberRow: Decodable {
            let roomId: String
            enum CodingKeys: String, CodingKey { case roomId = "room_id" }
        }
        let rows: [MemberRow] = try await client.send("rest/v1/vibe_members?select=room_id", token: token)
        var counts: [String: Int] = [:]
        for row in rows {
            counts[row.roomId, default: 0] += 1
        }
        return counts
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
        selectedInterests: [String],
        personalityAnswers: [String: JSONValue],
        completed: Bool,
        token: String
    ) async throws {
        let body: [String: JSONValue] = [
            "user_id": .string(userId),
            "selected_interests": .array(selectedInterests.map { .string($0) }),
            "personality_answers": .object(personalityAnswers),
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

    /// Mark onboarding complete on the new `profiles` row. The live database's
    /// RLS policies (e.g. `onboarding_required` on `messages`) read this.
    func completeOnboarding(userId: String, token: String) async throws {
        let body: [String: JSONValue] = [
            "onboarding_step": .number(3),
            "onboarding_completed_at": .string(ISO8601DateFormatter().string(from: Date()))
        ]
        try await client.sendNoContent(
            "rest/v1/profiles?id=eq.\(userId)",
            method: "PATCH",
            token: token,
            body: body
        )
    }

    /// Persist onboarding selections to `user_interests`. The live database's
    /// RLS policies require rows in each of `nature`, `interests` and `types`.
    func saveInterests(userId: String, nature: [Int], interests: [Int], types: [Int], token: String) async throws {
        let groups: [(String, [Int])] = [
            ("nature", nature),
            ("interests", interests),
            ("types", types)
        ]
        for (category, values) in groups {
            for value in values {
                let body: [String: JSONValue] = [
                    "user_id": .string(userId),
                    "category": .string(category),
                    "value": .number(Double(value))
                ]
                try await client.sendNoContent(
                    "rest/v1/user_interests",
                    method: "POST",
                    token: token,
                    body: body,
                    extraHeaders: ["Prefer": "return=minimal,resolution=ignore-duplicates"]
                )
            }
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
