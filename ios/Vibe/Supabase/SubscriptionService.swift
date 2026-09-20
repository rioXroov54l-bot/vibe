import StoreKit

@MainActor
final class SubscriptionService: ObservableObject {
    @Published var products: [Product] = []
    @Published var activeSubscription: Subscription?

    private let backend = SupabaseService.shared

    func loadProducts() async {
        do {
            products = try await Product.products(for: ["vibe.premium.monthly"])
        } catch {
            products = []
        }
    }

    func purchase(_ product: Product) async throws {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await transaction.finish()
        case .pending:
            break
        case .userCancelled:
            break
        @unknown default:
            break
        }
    }

    func restorePurchases() async {
        try? await AppStore.sync()
    }

    func syncWithBackend(accessToken: String) async throws {
        let status: SubscriptionStatus = try await backend.request(
            path: "/api/cloud/subscription",
            method: "GET",
            token: accessToken
        )
        activeSubscription = status.active
    }

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw URLError(.cannotDecodeContentData)
        case .verified(let safe):
            return safe
        }
    }
}
