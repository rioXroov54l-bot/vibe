import Foundation

/// Categorized interests/hobbies with localized labels.
enum InterestData {
    private struct Category {
        let id: String
        let en: String
        let ar: String
        let items: [(String, String)]
    }

    static let categories: [OnboardingGroup] = raw.map { category in
        OnboardingGroup(
            id: category.id,
            titleEn: category.en,
            titleAr: category.ar,
            options: category.items.map { OnboardingOption(id: category.id + "." + $0.0, en: $0.0, ar: $0.1) },
            multiSelect: true
        )
    }

    static let allOptions: [OnboardingOption] = categories.flatMap(\.options)

    private static let raw: [Category] = [
        Category(id: "staying_in", en: "Staying in", ar: "البقاء في المنزل", items: [
            ("Reading", "القراءة"), ("Home Workout", "تمرين منزلي"), ("Binge-Watching TV shows", "مشاهدة المسلسلات"),
            ("Cooking", "الطبخ"), ("Gardening", "البستنة"), ("Online Games", "ألعاب أونلاين"),
            ("Online Shopping", "التسوق أونلاين"), ("Board Games", "ألعاب الطاولة"), ("Trivia", "ألعاب معلومات"), ("Baking", "الخبز")
        ]),
        Category(id: "tv_movies", en: "TV and movies", ar: "التلفزيون والأفلام", items: [
            ("British Soaps", "مسلسلات بريطانية"), ("Action movies", "أفلام أكشن"), ("Animated movies", "أفلام أنيميشن"),
            ("Crime shows", "مسلسلات الجريمة"), ("Fantasy shows", "مسلسلات فانتازيا"), ("Documentaries", "وثائقي"),
            ("Drama shows", "مسلسلات دراما"), ("Rom-coms", "كوميديا رومانسية"), ("Sports shows", "برامج رياضية"),
            ("Thriller films", "أفلام إثارة"), ("K-drama shows", "دراما كورية"), ("Indie films", "أفلام مستقلة"),
            ("Reality TV", "تلفزيون الواقع"), ("Movies", "أفلام"), ("Horror Movies", "أفلام رعب"), ("Sci-Fi", "خيال علمي")
        ]),
        Category(id: "going_out", en: "Going out", ar: "الخروج", items: [
            ("Car Boot Sales", "أسواق السيارات"), ("Festivals", "مهرجانات"), ("Escape Rooms", "غرف الهروب"),
            ("Bars", "بارات"), ("Thrifting", "تسوق مستعمل"), ("Museums", "متاحف"), ("Raves", "حفلات صاخبة"),
            ("Drive-in Cinema", "سينما السيارات"), ("Musical theater", "مسرح موسيقي"), ("Aquarium", "أكواريوم"),
            ("Cars", "سيارات"), ("Exhibition", "معارض"), ("Shopping", "تسوق"), ("House Parties", "حفلات منزلية"),
            ("Theater", "مسرح"), ("Pub Quiz", "مسابقات بار"), ("Bowling", "بولينج"), ("Motorcycles", "دراجات نارية"),
            ("Film Festival", "مهرجان أفلام"), ("Shisha", "شيشة"), ("Happy hour", "الساعة السعيدة"),
            ("Stand up comedy", "كوميديا ارتجالية"), ("Karaoke", "كاريوكي"), ("Nightlife", "حياة ليلية"),
            ("Art galleries", "معارض فنية"), ("Live Music", "موسيقى حية"), ("Bar Hopping", "تنقل بين البارات"),
            ("Parties", "حفلات"), ("Pubs", "حانات"), ("Rollerskating", "تزلج بالعجلات"), ("Concerts", "حفلات موسيقية"),
            ("Town Festivities", "احتفالات المدينة"), ("Cafe hopping", "تنقل بين المقاهي"), ("Clubbing", "نوادي")
        ]),
        Category(id: "creativity", en: "Creativity", ar: "الإبداع", items: [
            ("Tattoos", "وشم"), ("Freelancing", "عمل حر"), ("Photography", "تصوير"),
            ("Language Exchange", "تبادل لغات"), ("Cosplay", "كوسبلاي"), ("Content Creation", "صناعة محتوى")
        ]),
        Category(id: "fan_favorites", en: "Fan favorites", ar: "المفضلات", items: [
            ("Comic-con", "كوميك كون"), ("Harry Potter", "هاري بوتر"), ("90s Kid", "جيل التسعينات"),
            ("NBA", "الدوري الأمريكي"), ("MLB", "دوري البيسبول"), ("Manga", "مانجا"), ("Marvel", "مارفل"),
            ("Dungeons & Dragons", "زنزانات وتنانين")
        ]),
        Category(id: "food_drink", en: "Food and drink", ar: "الطعام والشراب", items: [
            ("Foodie", "عاشق الطعام"), ("Food tours", "جولات طعام"), ("Street Food", "طعام الشارع"),
            ("Plant-based", "نباتي"), ("Boba tea", "شاي الفقاعات"), ("Sweet treats", "حلويات"),
            ("Mocktails", "مشروبات غير كحولية"), ("Brunch", "فطور متأخر")
        ]),
        Category(id: "gaming", en: "Gaming", ar: "الألعاب", items: [
            ("E-Sports", "رياضات إلكترونية"), ("PlayStation", "بلايستيشن"), ("Fortnite", "فورتنايت"),
            ("Among Us", "أمونج أس"), ("Atari", "أتاري"), ("Xbox", "إكس بوكس"),
            ("League of Legends", "ليغ أوف ليجيندز"), ("Nintendo", "نينتندو")
        ]),
        Category(id: "outdoors", en: "Outdoors and adventure", ar: "الهواء الطلق والمغامرة", items: [
            ("Narrowboating", "قوارب ضيقة"), ("Skiing", "تزلج"), ("Snowboarding", "تزلج على الثلج"),
            ("Diving", "غوص"), ("Jetskiing", "جت سكي"), ("Nature", "طبيعة"), ("Walking tours", "جولات مشي"), ("Rowing", "تجديف")
        ]),
        Category(id: "social_content", en: "Social and content", ar: "التواصل والمحتوى", items: [
            ("Podcasts", "بودكاست"), ("Instagram", "إنستغرام"), ("X", "إكس"), ("SoundCloud", "ساوند كلاود"),
            ("Spotify", "سبوتيفاي"), ("Pinterest", "بينترست"), ("Social Media", "وسائل تواصل"), ("Memes", "ميمات")
        ]),
        Category(id: "sports_fitness", en: "Sports and fitness", ar: "الرياضة واللياقة", items: [
            ("Rugby", "رجبي"), ("Motor Sports", "رياضات محركات"), ("Football", "كرة قدم أمريكية"), ("Ice Hockey", "هوكي جليد"),
            ("Sports Shooting", "رماية"), ("Athletics", "ألعاب قوى"), ("Walking", "مشي"), ("Skating", "تزلج"),
            ("Beach sports", "رياضات شاطئ"), ("Fitness classes", "حصص لياقة"), ("Sports", "رياضة"), ("Gymnastics", "جمباز"),
            ("Hockey", "هوكي"), ("Basketball", "كرة سلة"), ("Running", "جري"), ("Boxing", "ملاكمة"),
            ("Pole Dancing", "رقص على العمود"), ("Car Racing", "سباق سيارات"), ("Padel", "بادل"), ("Equestrian", "فروسية"),
            ("Soccer", "كرة قدم"), ("Gym", "صالة رياضية"), ("Cricket", "كريكيت"), ("Skateboarding", "تزلج"),
            ("Tennis", "تنس"), ("Pilates", "بيلاتيس"), ("Cheerleading", "تشجيع"), ("Jogging", "هرولة"),
            ("Archery", "رماية سهام"), ("Crossfit", "كروس فيت"), ("Weightlifting", "رفع أثقال"), ("Wrestling", "مصارعة"),
            ("Marathon", "ماراثون"), ("Martial Arts", "فنون قتالية"), ("Volleyball", "كرة طائرة"), ("Climbing", "تسلق"),
            ("Cycling", "ركوب دراجات"), ("Swimming", "سباحة"), ("Table Tennis", "تنس طاولة"), ("Working out", "تمرين"),
            ("Baseball", "بيسبول"), ("Badminton", "ريشة طائرة")
        ]),
        Category(id: "music", en: "Music", ar: "الموسيقى", items: [
            ("Gospel music", "غوسبل"), ("Music bands", "فرق موسيقية"), ("Rock music", "روك"), ("Soul music", "سول"),
            ("Pop music", "بوب"), ("K-Pop", "كي بوب"), ("Punk rock", "بانك روك"), ("Jazz", "جاز"),
            ("House music", "هاوس"), ("EDM", "إلكترونية"), ("R&B", "آر أند بي"), ("Opera", "أوبرا"),
            ("Indie music", "مستقلة"), ("Alternative music", "بديلة"), ("Techno", "تكنو"), ("Folk music", "شعبية"),
            ("Latin music", "لاتينية"), ("Rap music", "راب"), ("Heavy Metal", "هيفي ميتال"), ("Funk music", "فانك"),
            ("Grime", "غرايم"), ("90s Britpop", "بريت بوب"), ("Hip Hop", "هيب هوب"), ("J-Pop", "جي بوب"),
            ("Reggaeton", "ريغيتون"), ("Country Music", "كانتري"), ("Electronic Music", "إلكترونية"),
            ("Trap Music", "تراب"), ("Music", "موسيقى")
        ])
    ]
}
