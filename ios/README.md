# Vibe — Native iOS App

A native Swift/SwiftUI conversion of the Vibe platform. This is a real
SwiftUI application, not a web wrapper, using the same Supabase backend as the
web product.

## Requirements

- Xcode 16+ (verified with Xcode 26.6)
- iOS 17.0+

## Build

Open `Vibe.xcodeproj` in Xcode and run the `Vibe` scheme, or from the command line:

```sh
xcodebuild -project ios/Vibe.xcodeproj -scheme Vibe \
  -destination 'generic/platform=iOS' build CODE_SIGNING_ALLOWED=NO
```

Set your own Development Team and Bundle Identifier before running on a device.

## Structure

```
Vibe/
  App/            VibeApp entry point + AppState (session / navigation)
  Core/           VibeTheme design tokens
  Models/         Profile, Room, Message, AuthSession, AuthUser
  Networking/     SupabaseClient, AuthService, DataService, KeychainStore
  Views/
    Auth/         Welcome, Login, SignUp, OTP, Forgot/Reset password
    Onboarding/   Welcome → interests → personality → profile
    Main/         Discover, Rooms, Room chat, Profile
  Resources/      Info.plist + Assets.xcassets
```

## Architecture

- **MVVM / ObservableObject** — `AppState` is the single source of truth for
  authentication and navigation state.
- **Native Supabase** — a thin `URLSession` client (`SupabaseClient`) talks
  directly to Supabase Auth (`/auth/v1/*`) and PostgREST (`/rest/v1/*`), using
  the public publishable key. Session tokens are stored in the **Keychain**.
- **OTP is exactly 6 digits**, stored as a `String` so leading zeros are preserved.

## Supabase configuration

The backend configuration lives in `Networking/SupabaseClient.swift`:

- URL: `https://hsvcdyxelshvgofjvlim.supabase.co`
- Publishable (public) key: `sb_publishable_…` (no service-role key is present)

The password-reset deep link scheme is `vibe://reset-password`.

## Notes

- The asset catalog is intentionally empty (no App Icon yet). Add your 1024x1024
  app icon under `Assets.xcassets/AppIcon.appiconset` before App Store submission.
- For the full signup/OTP flow to deliver email, the Supabase Auth **SMTP email
  provider must be configured** in the dashboard (Authentication → Email).
