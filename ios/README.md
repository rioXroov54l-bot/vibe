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
  App/            VibeApp entry point
  Models/         Profile, Room, Message, AuthSession, AuthUser
  ViewModels/     AppState (root observable / navigation state)
  Services/       AuthService, DataService (business logic)
  Managers/       SessionManager (Keychain session persistence)
  Supabase/       SupabaseClient (Auth + PostgREST HTTP client)
  Networking/     APIError (typed error model)
  Components/     Theme, AuthComponents, FlowLayout, RoomCard
  Views/
    Auth/         Welcome, Login, SignUp, OTP, Forgot/Reset password
    Onboarding/   Welcome → interests → personality → profile
    Main/         Discover, Rooms, Chat, Cinema, Podcast, Games, Profile
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

- The asset catalog is intentionally empty (no App Icon yet). It is currently
  not referenced by the generated project, so the CLI build does not require a
  simulator runtime. To enable it, add your 1024x1024 app icon under
  `Assets.xcassets/AppIcon.appiconset` and drag `Assets.xcassets` into the Xcode
  project navigator (or add it back to `ios/gen_project.py`), then set
  `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon`.
- For the full signup/OTP flow to deliver email, the Supabase Auth **SMTP email
  provider must be configured** in the dashboard (Authentication → Email).
