import Foundation

/// Four permanent core rooms that are always rendered in the Explore feed,
/// so the feed never evaluates to an empty state.
enum CoreRooms {
    static let all: [Room] = [
        Room(
            id: "10000000-0000-4000-8000-000000000001",
            ownerId: "00000000-0000-4000-8000-000000000000",
            title: "Late-night conversations",
            category: 1,
            kind: "voice",
            createdAt: "",
            isPrivate: false,
            passcodeHash: nil
        ),
        Room(
            id: "10000000-0000-4000-8000-000000000002",
            ownerId: "00000000-0000-4000-8000-000000000000",
            title: "A slower kind of night ♫",
            category: 5,
            kind: "cinema",
            createdAt: "",
            isPrivate: false,
            passcodeHash: nil
        ),
        Room(
            id: "10000000-0000-4000-8000-000000000003",
            ownerId: "00000000-0000-4000-8000-000000000000",
            title: "Game night with the crew 🎮",
            category: 3,
            kind: "game",
            createdAt: "",
            isPrivate: false,
            passcodeHash: nil
        ),
        Room(
            id: "10000000-0000-4000-8000-000000000004",
            ownerId: "00000000-0000-4000-8000-000000000000",
            title: "Voices worth hearing ✦",
            category: 2,
            kind: "echo",
            createdAt: "",
            isPrivate: false,
            passcodeHash: nil
        ),
        Room(
            id: "10000000-0000-4000-8000-000000000005",
            ownerId: "00000000-0000-4000-8000-000000000000",
            title: "Language exchange 🌍",
            category: 4,
            kind: "voice",
            createdAt: "",
            isPrivate: false,
            passcodeHash: nil
        )
    ]
}
