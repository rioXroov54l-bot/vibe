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
}
