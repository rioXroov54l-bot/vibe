import Foundation

/// A typed error surfaced from the network or Supabase, with a user-friendly
/// message and an optional backend error code.
struct SupabaseError: Error, LocalizedError {
    let message: String
    let code: String?
    let status: Int

    var errorDescription: String? { message }
}
