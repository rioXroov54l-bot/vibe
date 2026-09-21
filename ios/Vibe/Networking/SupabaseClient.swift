import Foundation

/// Central Supabase configuration. The publishable key is public by design;
/// no service-role key or secret is ever stored in the app.
enum SupabaseConfig {
    static let url = URL(string: "https://hsvcdyxelshvgofjvlim.supabase.co")!
    static let anonKey = "sb_publishable_BCp7IhSHgWkNqXFY0Tk1xA_SE3wIWTg"
    static let resetRedirectURL = "vibe://reset-password"
}

/// A typed error surfaced from Supabase or the network.
struct SupabaseError: Error, LocalizedError {
    let message: String
    let code: String?
    let status: Int

    var errorDescription: String? { message }
}

/// Thin native HTTP client for Supabase Auth, PostgREST and Storage.
/// Replicates the same request shape as the production Worker.
final class SupabaseClient {
    private let session: URLSession

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 20
        config.waitsForConnectivity = false
        self.session = URLSession(configuration: config)
    }

    private func request(
        _ path: String,
        method: String = "GET",
        token: String? = nil,
        body: Encodable? = nil,
        extraHeaders: [String: String] = [:]
    ) async throws -> (Data, HTTPURLResponse) {
        let urlString = SupabaseConfig.url.absoluteString + "/" + path
        guard let url = URL(string: urlString) else {
            throw SupabaseError(message: "Invalid server address.", code: "invalid_url", status: 0)
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        for (key, value) in extraHeaders {
            request.setValue(value, forHTTPHeaderField: key)
        }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }
        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                throw SupabaseError(message: "Invalid server response.", code: "invalid_response", status: 0)
            }
            return (data, http)
        } catch let error as SupabaseError {
            throw error
        } catch {
            let ns = error as NSError
            let message: String
            if ns.domain == NSURLErrorDomain {
                message = networkMessage(for: ns.code)
            } else {
                message = error.localizedDescription
            }
            throw SupabaseError(message: message, code: "unavailable", status: ns.code)
        }
    }

    private func networkMessage(for code: Int) -> String {
        switch code {
        case NSURLErrorCannotFindHost, NSURLErrorCannotConnectToHost, NSURLErrorDNSLookupFailed:
            return "Could not reach Vibe's server. Check your connection and try again."
        case NSURLErrorNotConnectedToInternet, NSURLErrorNetworkConnectionLost:
            return "You appear to be offline. Check your connection and try again."
        case NSURLErrorTimedOut:
            return "The request timed out. Please try again."
        default:
            return "A network error occurred. Please try again."
        }
    }

    /// Decode a successful JSON payload.
    func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        try JSONDecoder().decode(type, from: data)
    }

    /// Perform a request and decode the JSON result, mapping HTTP errors to SupabaseError.
    func send<T: Decodable>(
        _ path: String,
        method: String = "GET",
        token: String? = nil,
        body: Encodable? = nil,
        extraHeaders: [String: String] = [:]
    ) async throws -> T {
        let (data, http) = try await request(path, method: method, token: token, body: body, extraHeaders: extraHeaders)
        if (200..<300).contains(http.statusCode) {
            return try decode(T.self, from: data)
        }
        throw try error(from: data, status: http.statusCode)
    }

    /// Perform a request returning no decoded body.
    func sendNoContent(
        _ path: String,
        method: String = "POST",
        token: String? = nil,
        body: Encodable? = nil,
        extraHeaders: [String: String] = [:]
    ) async throws {
        let (data, http) = try await request(path, method: method, token: token, body: body, extraHeaders: extraHeaders)
        if (200..<300).contains(http.statusCode) { return }
        throw try error(from: data, status: http.statusCode)
    }

    private func error(from data: Data, status: Int) throws -> SupabaseError {
        struct Payload: Decodable {
            let msg: String?
            let message: String?
            let error: String?
            let errorDescription: String?
            let errorCode: String?
            let code: String?
            enum CodingKeys: String, CodingKey {
                case msg, message, error, code
                case errorDescription = "error_description"
                case errorCode = "error_code"
            }
        }
        if let payload = try? JSONDecoder().decode(Payload.self, from: data) {
            let raw = payload.msg ?? payload.message ?? payload.error ?? payload.errorDescription ?? "Request failed."
            let code = payload.errorCode ?? payload.code
            return SupabaseError(message: raw, code: code, status: status)
        }
        return SupabaseError(message: "Request failed with status \(status).", code: nil, status: status)
    }
}
