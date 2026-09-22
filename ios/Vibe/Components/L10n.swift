import Foundation

/// Localized strings for the authentication flow (Arabic + English).
@MainActor
enum L10n {
    private static var ar: Bool { LocalizationManager.shared.isArabic }

    // Language toggle
    static var languageButton: String { ar ? "English" : "العربية" }

    // Welcome
    static var brandTagline: String { ar ? "أشخاص رائعون. علاقات أفضل." : "Good people. Better connections." }
    static var createAccount: String { ar ? "إنشاء حساب" : "Create account" }
    static var signIn: String { ar ? "تسجيل الدخول" : "Sign in" }
    static var needHelp: String { ar ? "هل تواجه مشكلة في تسجيل الدخول؟" : "Need help signing in?" }
    static var legalFooter: String { ar ? "بإنشاء حساب أو تسجيل الدخول، فإنك توافق على الشروط وسياسة الخصوصية." : "By creating an account or signing in, you agree to our Terms and Privacy Policy." }

    // Login
    static var welcomeBack: String { ar ? "أهلاً بعودتك" : "Welcome back" }
    static var signInSubtitle: String { ar ? "سجّل الدخول وواصل من حيث توقفت." : "Sign in and pick up where you left off." }
    static var email: String { ar ? "البريد الإلكتروني" : "Email" }
    static var emailPlaceholder: String { "name@example.com" }
    static var password: String { ar ? "كلمة المرور" : "Password" }
    static var passwordPlaceholder: String { ar ? "كلمة المرور" : "Your password" }
    static var forgotPassword: String { ar ? "نسيت كلمة المرور؟" : "Forgot password?" }
    static var signInWithCode: String { ar ? "الدخول برمز عبر البريد" : "Sign in with an email code" }
    static var newToVibe: String { ar ? "جديد على Vibe؟ أنشئ حساباً" : "New to Vibe? Create account" }
    static var signingIn: String { ar ? "جارٍ تسجيل الدخول…" : "Signing in…" }

    // Sign up
    static var startYourVibe: String { ar ? "ابدأ فايبك" : "Start your Vibe" }
    static var signupSubtitle: String { ar ? "أنشئ حسابك وخلّ فايبك يجمعك بناسك." : "Create your account and find your people." }
    static var displayName: String { ar ? "اسم العرض" : "Display name" }
    static var displayNamePlaceholder: String { ar ? "اسمك" : "Your name" }
    static var passwordHint: String { ar ? "٨ أحرف على الأقل" : "At least 8 characters" }
    static var consent: String { ar ? "عمري ١٨ عاماً أو أكثر وأوافق على الشروط والخصوصية وقواعد المجتمع." : "I am 18 or older and agree to the terms, privacy policy and community rules." }
    static var creatingAccount: String { ar ? "جارٍ إنشاء الحساب…" : "Creating account…" }
    static var alreadyHaveAccount: String { ar ? "لديك حساب؟ سجّل الدخول" : "Already have an account? Sign in" }

    // OTP
    static var enterCode: String { ar ? "أدخل رمز التحقق" : "Enter verification code" }
    static var codeSent: String { ar ? "أرسلنا رمزاً من ٦ أرقام إلى بريدك." : "We sent a 6-digit code to your email." }
    static var verifyContinue: String { ar ? "تحقق ومتابعة" : "Verify and continue" }
    static var verifying: String { ar ? "جارٍ التحقق…" : "Verifying…" }
    static var resendCode: String { ar ? "إعادة إرسال الرمز" : "Resend code" }
    static var resendIn: String { ar ? "يمكن إعادة الإرسال بعد %@ ثانية." : "You can resend in %@s" }

    // Forgot password
    static var letsGetYouBack: String { ar ? "خلّنا نرجّعك لحسابك…" : "Let's get you back in…" }
    static var forgotSubtitle: String { ar ? "أدخل البريد المرتبط بحسابك وسنرسل لك رابطاً آمناً لاستعادة الوصول." : "Enter the email associated with your account. We'll send you a secure link to regain access." }
    static var sendEmail: String { ar ? "إرسال البريد" : "Send email" }
    static var sending: String { ar ? "جارٍ الإرسال…" : "Sending…" }
    static var backToSignIn: String { ar ? "العودة لتسجيل الدخول" : "Back to sign in" }

    // Reset password
    static var newPassword: String { ar ? "كلمة مرور جديدة" : "New password" }
    static var confirmPassword: String { ar ? "تأكيد كلمة المرور" : "Confirm password" }
    static var chooseNewPassword: String { ar ? "اختر كلمة مرور جديدة لحسابك." : "Choose a new password for your account." }
    static var saveNewPassword: String { ar ? "حفظ كلمة المرور الجديدة" : "Save new password" }
    static var saving: String { ar ? "جارٍ الحفظ…" : "Saving…" }
    static var passwordsDontMatch: String { ar ? "كلمتا المرور غير متطابقتين." : "Passwords do not match." }

    // Onboarding
    static var next: String { ar ? "التالي" : "Next" }
    static var back: String { ar ? "رجوع" : "Back" }
    static var skip: String { ar ? "تخطي" : "Skip" }
    static var showMore: String { ar ? "عرض المزيد" : "Show more" }
    static var showLess: String { ar ? "عرض أقل" : "Show less" }
    static var lifestyleTitle: String { ar ? "دعنا نتحدث عن نمط حياتك" : "Let's talk lifestyle habits" }
    static var lifestyleSubtitle: String { ar ? "هل تتطابق عاداتهم مع عاداتك؟ ابدأ أنت أولاً." : "Do their habits match yours? You go first." }
    static var personalityTitle: String { ar ? "ما الذي يجعلك مميزاً حقاً؟" : "What else makes you-you?" }
    static var personalitySubtitle: String { ar ? "لا تتردد. الأصالة تجذب الأصالة." : "Don't hold back. Authenticity attracts authenticity." }
    static var interestsTitle: String { ar ? "ما هي اهتماماتك؟" : "What are you into?" }
    static var interestsSubtitle: String { ar ? "اختر 3 اهتمامات على الأقل للعثور على أشخاص يشاركونك نفس الاهتمامات." : "Choose at least 3 interests to find people who like similar things." }
    static var selectAtLeastThree: String { ar ? "اختر 3 اهتمامات على الأقل." : "Select at least 3 interests." }
    static var selectedCount: String { ar ? "تم اختيار %d من 3" : "%d of 3 selected" }

    // Main app
    static var explore: String { ar ? "استكشف" : "Explore" }
    static var likes: String { ar ? "الإعجابات" : "Likes" }
    static var chat: String { ar ? "الدردشة" : "Chat" }
    static var profile: String { ar ? "الملف الشخصي" : "Profile" }
    static var goodVibes: String { ar ? "أجواء رائعة" : "Good vibes" }
    static var onSameWavelength: String { ar ? "على نفس الموجة" : "ON THE SAME WAVELENGTH" }
    static var joinTheNight: String { ar ? "انضم لليلة ←" : "Join the night ←" }
    static var flashRooms: String { ar ? "رومات فلاش" : "Flash Rooms" }
    static var vibeCinema: String { ar ? "سينما فايب" : "Vibe Cinema" }
    static var gamesRooms: String { ar ? "رومات الألعاب" : "Games Rooms" }
    static var echoStage: String { ar ? "مسرح إيكو" : "Echo Stage" }
    static var all: String { ar ? "الكل" : "All" }
    static var hangouts: String { ar ? "جلسات" : "Hangouts" }
    static var sessions: String { ar ? "جلسات" : "Sessions" }
    static var anchorRooms: String { ar ? "الغرف الأساسية" : "Anchor rooms" }
    static var music: String { ar ? "موسيقى" : "Music" }
    static var games: String { ar ? "ألعاب" : "Games" }
    static var languages: String { ar ? "لغات" : "Languages" }
    static var discussions: String { ar ? "نقاشات" : "Discussions" }
    static var joinTheVibe: String { ar ? "انضم للفايب ←" : "Join the vibe ←" }
    static var joinRoom: String { ar ? "انضم لروم" : "Join Room" }
    static var createRoom: String { ar ? "أنشئ غرفة" : "Create a room" }
    static var raiseHand: String { ar ? "ارفع اليد" : "Raise hand" }
    static var mute: String { ar ? "كتم" : "Mute" }
    static var unmute: String { ar ? "إلغاء الكتم" : "Unmute" }
    static var gift: String { ar ? "هدية" : "Gift" }
    static var leave: String { ar ? "مغادرة ←" : "Leave ←" }
    static var roomChat: String { ar ? "دردشة الغرفة" : "Room chat" }
    static var pasteVideoLink: String { ar ? "الصق رابط يوتيوب أو فيديو هنا..." : "Paste YouTube or video link here..." }
    static var play: String { ar ? "تشغيل" : "Play" }
    static var noConversations: String { ar ? "لا توجد محادثات بعد" : "No conversations yet" }
    static var joinRoomToChat: String { ar ? "انضم لغرفة أو ابدأ محادثة لرؤية الرسائل هنا." : "Join a room or start a chat to see messages here." }
    static var watchTogether: String { ar ? "شاهدوا معاً" : "Watch together" }
    static var supportsLinks: String { ar ? "يدعم روابط يوتيوب وروابط الفيديو المباشر MP4 / HLS." : "Supports YouTube and direct MP4 / HLS video URLs." }
    static var globalWatchParty: String { ar ? "حفلة المشاهدة العالمية" : "Vibe global watch party" }
    static var noRoomsRightNow: String { ar ? "لا توجد غرف الآن" : "No rooms right now" }
    static var wordChallenge: String { ar ? "تحدي الكلمات" : "Word Challenge" }
    static var unscrambleThis: String { ar ? "أعد ترتيب هذه الكلمة" : "Unscramble this word" }
    static var submit: String { ar ? "إرسال" : "Submit" }
    static var noLikesYet: String { ar ? "لا توجد إعجابات بعد" : "No likes yet" }
    static var likesHint: String { ar ? "عندما يعجب شخص بملفك أو غرفتك، سيظهر هنا." : "When someone likes your profile or room, it shows up here." }
    static var interests: String { ar ? "الاهتمامات" : "Interests" }
    static var signOut: String { ar ? "تسجيل الخروج" : "Sign out" }
    static var host: String { ar ? "المضيف" : "Host" }
    static var speaker: String { ar ? "متحدث" : "Speaker" }
    static var audience: String { ar ? "الجمهور" : "Audience" }
    static var listening: String { ar ? "%d يستمعون" : "%d listening" }
    static var startConversation: String { ar ? "ابدأ المحادثة." : "Start the conversation." }
    static var noRoomsHere: String { ar ? "لا توجد غرف هنا" : "No rooms here" }
    static var roomName: String { ar ? "اسم الغرفة" : "Room name" }
    static var type: String { ar ? "النوع" : "Type" }
    static var category: String { ar ? "التصنيف" : "Category" }
    static var liveVoiceNotEnabled: String { ar ? "🔴 البث الصوتي المباشر غير مفعّل بعد" : "🔴 Live voice streaming is not enabled yet" }
    static var audioRoomsComingSoon: String { ar ? "الغرف الصوتية قادمة قريباً. استكشف الحلقات التجريبية أدناه." : "Audio rooms are coming soon. Explore the demo episodes below." }
    static var shareCinema: String { ar ? "🎬 انضم لي في سينما فايب! " : "🎬 Join me in Vibe Cinema! " }
    static var live: String { ar ? "مباشر" : "LIVE" }
    static var listeningCount: String { ar ? "%d يستمعون" : "%d listening" }
    static var listenAnonymously: String { ar ? "استمع بشكل مجهول" : "Listen anonymously" }
    static var anonymousHelper: String { ar ? "أثناء الاستماع المجهول، لن تكون مرئياً ولن تتمكن من التحدث أو إرسال التفاعلات." : "While listening anonymously, you will not be visible, able to speak, or send reactions." }
    static var startListeningAnonymously: String { ar ? "ابدأ الاستماع بشكل مجهول" : "Start listening anonymously" }
    static var request: String { ar ? "طلب" : "Request" }
    static var listener: String { ar ? "مستمع" : "Listener" }
    static var listeningAnonymouslyStatus: String { ar ? "أنت تستمع بشكل مجهول" : "You are listening anonymously" }
    static var privateRoom: String { ar ? "غرفة خاصة" : "Private room" }
    static var enterPasscode: String { ar ? "أدخل رمز الدخول" : "Enter passcode" }
    static var wrongPasscode: String { ar ? "رمز الدخول غير صحيح" : "Incorrect passcode" }
    static var unlock: String { ar ? "فتح" : "Unlock" }
    static var makePrivate: String { ar ? "اجعلها خاصة" : "Make private" }
    static var passcode: String { ar ? "رمز الدخول" : "Passcode" }
}
