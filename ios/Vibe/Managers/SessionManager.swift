import Foundation
import Security

/// Manages the persisted authentication session using the Keychain.
/// Access and refresh tokens are the only secrets stored, written with
/// `kSecAttrAccessibleAfterFirstUnlock`.
final class SessionManager {
    static let shared = SessionManager()

    private let service = "com.vibe.social.auth"

    private enum Key {
        static let accessToken = "vibe.accessToken"
        static let refreshToken = "vibe.refreshToken"
    }

    func save(_ session: AuthSession) {
        save(session.accessToken, for: Key.accessToken)
        save(session.refreshToken, for: Key.refreshToken)
    }

    func load() -> (accessToken: String, refreshToken: String)? {
        guard let access = read(Key.accessToken), let refresh = read(Key.refreshToken) else {
            return nil
        }
        return (access, refresh)
    }

    func clear() {
        delete(Key.accessToken)
        delete(Key.refreshToken)
    }

    // MARK: Keychain primitives

    private func save(_ value: String, for key: String) {
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
        var attributes = query
        attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(attributes as CFDictionary, nil)
    }

    private func read(_ key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func delete(_ key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}
