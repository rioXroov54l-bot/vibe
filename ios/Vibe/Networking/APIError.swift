import Foundation

/// A typed error surfaced from the network or Supabase, with a user-friendly
/// message and an optional backend error code.
struct SupabaseError: Error, LocalizedError {
    let message: String
    let code: String?
    let status: Int

    var errorDescription: String? { message }

    /// A user-friendly message for common Supabase Auth errors.
    var friendlyMessage: String {
        switch code {
        case "user_already_exists", "email_exists", "email_taken":
            return "This email is already registered. Try signing in instead."
        case "invalid_credentials":
            return "Incorrect email or password."
        case "email_not_confirmed":
            return "Please confirm your email address first."
        case "weak_password":
            return "Password is too weak. Use at least 8 characters with letters and numbers."
        case "invalid_email":
            return "Please enter a valid email address."
        case "over_email_send_rate_limit", "over_request_rate_limit", "rate_limited":
            return "Too many requests. Wait a moment and try again."
        case "invalid_code", "otp_expired":
            return "The verification code is invalid or expired. Request a new one."
        case "sign_in_required":
            return "Please sign in to continue."
        case "temporarily_unavailable", "unavailable":
            return "The service is temporarily unavailable. Try again shortly."
        default:
            if status == 429 { return "Too many requests. Wait a moment and try again." }
            if status >= 500 { return "The service is temporarily unavailable. Try again shortly." }
            return message
        }
    }
}
