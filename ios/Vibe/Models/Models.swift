import Foundation

struct UserProfile: Codable, Identifiable {
    let id: String
    let displayName: String?
    let bio: String?
    let username: String?
    let avatarURL: String?
}

struct SubscriptionStatus: Codable {
    let subscriptions: [Subscription]
    let active: Subscription?
}

struct Subscription: Codable, Identifiable {
    let id: String
    let productID: String?
    let status: String?
    let expiryDate: Date?
}

struct NotificationPreferences: Codable {
    var pushEnabled = true
    var messages = true
    var likes = true
    var matches = true
    var security = true
    var premium = true
}

struct DeviceTokenRegistration: Codable {
    let token: String
    let platform: String
}
