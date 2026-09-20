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
    var username: String?

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case bio
        case username
    }
}

final class SupabaseService {
    static let shared = SupabaseService()
    private let apiBaseURL: URL
    private let supabaseBaseURL: URL
    private let anonKey: String
    private let session: URLSession

    private init() {
        let apiString = Bundle.main.object(forInfoDictionaryKey: "VIBE_API_URL") as? String ?? ""
        let supabaseString = Bundle.main.object(forInfoDictionaryKey: "VIBE_SUPABASE_URL") as? String ?? ""
        let anonFromBundle = Bundle.main.object(forInfoDictionaryKey: "VIBE_SUPABASE_ANON_KEY") as? String ?? ""
        apiBaseURL = URL(string: apiString.isEmpty ? "https://vibe-social-nights.bb0949.chatgpt.site" : apiString)
            ?? URL(string: "https://vibe-social-nights.bb0949.chatgpt.site")!
        supabaseBaseURL = URL(string: supabaseString.isEmpty ? "https://hsvcdyxelshvgofjvlim.supabase.co" : supabaseString)
            ?? URL(string: "https://hsvcdyxelshvgofjvlim.supabase.co")!
        anonKey = anonFromBundle.isEmpty ? "sb_publishable_BCp7IhSHgWkNqXFY0Tk1xA_SE3wIWTg" : anonFromBundle
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
        do {
            var request = URLRequest(url: URL(string: path, relativeTo: apiBaseURL) ?? apiBaseURL)
            request.httpMethod = method
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue(anonKey, forHTTPHeaderField: "apikey")
            if let token {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            request.httpBody = body
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                print("SupabaseService request failed for \(path)")
                throw URLError(.badServerResponse)
            }
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            print("SupabaseService request error for \(path): \(error.localizedDescription)")
            throw error
        }
    }

    func refreshSupabaseToken(refreshToken: String) async throws -> AuthTokenResponse {
        var request = URLRequest(url: supabaseBaseURL.appendingPathComponent("auth/v1/token"))
        request.httpMethod = "POST"
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpBody = "grant_type=refresh_token&refresh_token=\(refreshToken)"
            .data(using: .utf8)
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw URLError(.userAuthenticationRequired)
        }
        return try JSONDecoder().decode(AuthTokenResponse.self, from: data)
    }

    func requestNoContent(
        path: String,
        method: String = "POST",
        body: Data? = nil,
        token: String? = nil
    ) async throws {
        do {
            var request = URLRequest(url: URL(string: path, relativeTo: apiBaseURL) ?? apiBaseURL)
            request.httpMethod = method
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue(anonKey, forHTTPHeaderField: "apikey")
            if let token {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            request.httpBody = body
            let (_, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                print("SupabaseService request failed for \(path)")
                throw URLError(.badServerResponse)
            }
        } catch {
            print("SupabaseService request error for \(path): \(error.localizedDescription)")
            throw error
        }
    }

    func upload<T: Decodable>(
        path: String,
        data: Data,
        contentType: String,
        token: String
    ) async throws -> T {
        do {
            var request = URLRequest(url: URL(string: path, relativeTo: apiBaseURL) ?? apiBaseURL)
            request.httpMethod = "POST"
            request.setValue(contentType, forHTTPHeaderField: "Content-Type")
            request.setValue(anonKey, forHTTPHeaderField: "apikey")
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.httpBody = data
            let (responseData, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
                print("SupabaseService upload failed for \(path)")
                throw URLError(.badServerResponse)
            }
            return try JSONDecoder().decode(T.self, from: responseData)
        } catch {
            print("SupabaseService upload error for \(path): \(error.localizedDescription)")
            throw error
        }
    }
}

struct AuthTokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let user: SupabaseUser

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case user
    }
}

struct SupabaseUser: Decodable {
    let id: String
    let email: String?
}
