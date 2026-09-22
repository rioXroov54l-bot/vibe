import Foundation

/// A single selectable onboarding option (localized).
struct OnboardingOption: Identifiable, Hashable {
    let id: String
    let en: String
    let ar: String

    var localized: String { LocalizationManager.shared.isArabic ? ar : en }
}

/// A titled group of selectable options.
struct OnboardingGroup: Identifiable {
    let id: String
    let titleEn: String
    let titleAr: String
    let options: [OnboardingOption]
    let multiSelect: Bool

    var localizedTitle: String { LocalizationManager.shared.isArabic ? titleAr : titleEn }
}

enum LifestyleData {
    static let groups: [OnboardingGroup] = [
        OnboardingGroup(
            id: "drinking",
            titleEn: "How often do you drink?",
            titleAr: "كم مرة تشرب؟",
            options: [
                OnboardingOption(id: "not_for_me", en: "Not for me", ar: "ليس لي"),
                OnboardingOption(id: "sober", en: "Sober", ar: "ممتنع"),
                OnboardingOption(id: "sober_curious", en: "Sober curious", ar: "أستكشف الامتناع"),
                OnboardingOption(id: "special_occasions", en: "On special occasions", ar: "في المناسبات الخاصة"),
                OnboardingOption(id: "socially_weekends", en: "Socially on weekends", ar: "اجتماعياً في نهاية الأسبوع"),
                OnboardingOption(id: "most_nights", en: "Most Nights", ar: "معظم الليالي")
            ],
            multiSelect: false
        ),
        OnboardingGroup(
            id: "smoking",
            titleEn: "How often do you smoke?",
            titleAr: "كم مرة تدخن؟",
            options: [
                OnboardingOption(id: "social_smoker", en: "Social smoker", ar: "مدخن اجتماعي"),
                OnboardingOption(id: "smoker_drinking", en: "Smoker when drinking", ar: "أدخن عند الشرب"),
                OnboardingOption(id: "non_smoker", en: "Non-smoker", ar: "غير مدخن"),
                OnboardingOption(id: "smoker", en: "Smoker", ar: "مدخن"),
                OnboardingOption(id: "trying_quit", en: "Trying to quit", ar: "أحاول الإقلاع")
            ],
            multiSelect: false
        ),
        OnboardingGroup(
            id: "workout",
            titleEn: "Do you workout?",
            titleAr: "هل تتمرن؟",
            options: [
                OnboardingOption(id: "everyday", en: "Everyday", ar: "يومياً"),
                OnboardingOption(id: "often", en: "Often", ar: "غالباً"),
                OnboardingOption(id: "sometimes", en: "Sometimes", ar: "أحياناً"),
                OnboardingOption(id: "gym_rat", en: "Gym rat", ar: "مدمن صالة رياضية"),
                OnboardingOption(id: "occasionally", en: "Occasionally", ar: "من حين لآخر"),
                OnboardingOption(id: "never", en: "Never", ar: "أبداً")
            ],
            multiSelect: false
        ),
        OnboardingGroup(
            id: "pets",
            titleEn: "Do you have any pets?",
            titleAr: "هل لديك حيوانات أليفة؟",
            options: [
                OnboardingOption(id: "dog", en: "Dog", ar: "كلب"),
                OnboardingOption(id: "cat", en: "Cat", ar: "قطة"),
                OnboardingOption(id: "reptile", en: "Reptile", ar: "زواحف"),
                OnboardingOption(id: "amphibian", en: "Amphibian", ar: "برمائيات"),
                OnboardingOption(id: "bird", en: "Bird", ar: "طائر"),
                OnboardingOption(id: "fish", en: "Fish", ar: "سمك"),
                OnboardingOption(id: "love_but_dont_have", en: "Don't have but love", ar: "لا أملك لكن أحبهم"),
                OnboardingOption(id: "other", en: "Other", ar: "أخرى"),
                OnboardingOption(id: "turtle", en: "Turtle", ar: "سلحفاة"),
                OnboardingOption(id: "hamster", en: "Hamster", ar: "هامستر"),
                OnboardingOption(id: "rabbit", en: "Rabbit", ar: "أرنب"),
                OnboardingOption(id: "pet_free", en: "Pet-free", ar: "بلا حيوانات أليفة"),
                OnboardingOption(id: "all_pets", en: "All the pets", ar: "كل الحيوانات"),
                OnboardingOption(id: "want_pet", en: "Want a pet", ar: "أريد حيواناً"),
                OnboardingOption(id: "allergic", en: "Allergic to pets", ar: "حساسية من الحيوانات")
            ],
            multiSelect: true
        )
    ]
}

enum PersonalityData {
    static let groups: [OnboardingGroup] = [
        OnboardingGroup(
            id: "communication",
            titleEn: "What is your communication style?",
            titleAr: "ما هو أسلوب تواصلك؟",
            options: [
                OnboardingOption(id: "big_texter", en: "Big time texter", ar: "أحب المراسلة كثيراً"),
                OnboardingOption(id: "phone_caller", en: "Phone caller", ar: "أفضّل المكالمات"),
                OnboardingOption(id: "video_chatter", en: "Video chatter", ar: "مكالمات الفيديو"),
                OnboardingOption(id: "bad_texter", en: "Bad texter", ar: "لا أجيد المراسلة"),
                OnboardingOption(id: "in_person", en: "Better in person", ar: "أفضّل اللقاء شخصياً")
            ],
            multiSelect: false
        ),
        OnboardingGroup(
            id: "love_language",
            titleEn: "How do you receive love?",
            titleAr: "كيف تستقبل الحب؟",
            options: [
                OnboardingOption(id: "gestures", en: "Thoughtful gestures", ar: "لفتات مدروسة"),
                OnboardingOption(id: "presents", en: "Presents", ar: "الهدايا"),
                OnboardingOption(id: "touch", en: "Touch", ar: "اللمس"),
                OnboardingOption(id: "compliments", en: "Compliments", ar: "الإطراء"),
                OnboardingOption(id: "time", en: "Time together", ar: "الوقت معاً")
            ],
            multiSelect: false
        ),
        OnboardingGroup(
            id: "zodiac",
            titleEn: "What is your zodiac sign?",
            titleAr: "ما هو برجك الفلكي؟",
            options: [
                OnboardingOption(id: "capricorn", en: "Capricorn", ar: "الجدي"),
                OnboardingOption(id: "aquarius", en: "Aquarius", ar: "الدلو"),
                OnboardingOption(id: "pisces", en: "Pisces", ar: "الحوت"),
                OnboardingOption(id: "aries", en: "Aries", ar: "الحمل"),
                OnboardingOption(id: "taurus", en: "Taurus", ar: "الثور"),
                OnboardingOption(id: "gemini", en: "Gemini", ar: "الجوزاء"),
                OnboardingOption(id: "cancer", en: "Cancer", ar: "السرطان"),
                OnboardingOption(id: "leo", en: "Leo", ar: "الأسد"),
                OnboardingOption(id: "virgo", en: "Virgo", ar: "العذراء"),
                OnboardingOption(id: "libra", en: "Libra", ar: "الميزان"),
                OnboardingOption(id: "scorpio", en: "Scorpio", ar: "العقرب"),
                OnboardingOption(id: "sagittarius", en: "Sagittarius", ar: "القوس")
            ],
            multiSelect: false
        )
    ]
}
