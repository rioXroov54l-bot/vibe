import Foundation

struct SupabaseSession: Codable {
    let accessToken: String
    let refreshToken: String
    let userID: String
}

struct VibeProfile: Codable {
    let id: String
    let displayName: String?
    let bio: String?
}

final class SupabaseService {
    static let shared = SupabaseService()
    private let baseURL: URL
    private let anonKey: String
    private let session: URLSession

    private init() {
        let urlString = Bundle.main.object(forInfoDictionaryKey: "VIBE_SUPABASE_URL") as? String ?? ""
        baseURL = URL(string: urlString) ?? URL(string: "https://example.invalid")!
        anonKey = Bundle.main.object(forInfoDictionaryKey: "VIBE_SUPABASE_ANON_KEY") as? String ?? ""
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        session = URLSession(configuration: config)
    }

    func restoreSession() async throws -> SupabaseSession? {
        return nil
    }

    func request<T: Decodable>(
        path: String,
        method: String = "GET",
        body: Data? = nil,
        token: String? = nil
    ) async throws -> T {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        request.httpBody = body
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
