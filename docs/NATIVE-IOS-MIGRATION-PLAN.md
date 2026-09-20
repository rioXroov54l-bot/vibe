# Native iOS SwiftUI migration plan

Status: prepared for implementation after backend stabilization.

## Preserve

- Existing GitHub repository as source of truth.
- Existing Supabase project, data, migrations, RLS, Auth, and Storage.
- Existing Worker API gateway.
- Existing web application and deployment pipeline.

## Recommended architecture

- Add `ios/` to the existing repository; do not create a separate project.
- SwiftUI screens with UIKit components only where required.
- `URLSession` async/await API client calling the existing Worker endpoints.
- Keychain-backed authentication session.
- Supabase Swift SDK only where it complements the Worker, not as a
  replacement for server-side authorization.

Proposed structure:

```text
ios/
  Vibe.xcodeproj
  Vibe/
    App/
    Features/{Auth,Profile,Rooms,Chat,Media,Settings}
    Domain/{Models,UseCases,Repositories}
    Data/{Remote,Local,Mappers}
    Infrastructure/{Keychain,Networking,Media,Telemetry}
  Tests/
```

## Implementation order

1. Native target, signing, and project scaffold.
2. API client and Keychain session manager.
3. Authentication, onboarding, profile, settings.
4. Rooms, messaging, reactions, notifications, media.
5. Account deletion and data export.
6. Native media capture/playback with permission purpose strings.
7. TestFlight internal build.

## App Store prerequisites

- Bundle ID and Apple Developer team.
- Signing certificates and provisioning profiles.
- App icon and asset catalog.
- `Info.plist` purpose strings for camera and microphone only.
- Privacy manifest generated from the built binary.
- TestFlight and real-device QA.
- App Store Connect metadata, privacy answers, and age rating.

The current native gap is tracked in `docs/app-store/NATIVE_IOS_GAP.md`.
