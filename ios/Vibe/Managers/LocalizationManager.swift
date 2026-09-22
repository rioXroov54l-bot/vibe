import SwiftUI

enum AppLanguage: String {
    case english = "en"
    case arabic = "ar"
}

@MainActor
final class LocalizationManager: ObservableObject {
    static let shared = LocalizationManager()

    @Published var language: AppLanguage {
        didSet { UserDefaults.standard.set(language.rawValue, forKey: "app.language") }
    }

    init() {
        let stored = UserDefaults.standard.string(forKey: "app.language") ?? ""
        language = AppLanguage(rawValue: stored) ?? .english
    }

    var isArabic: Bool { language == .arabic }
    var layoutDirection: LayoutDirection { isArabic ? .rightToLeft : .leftToRight }

    func toggle() {
        language = isArabic ? .english : .arabic
    }
}
