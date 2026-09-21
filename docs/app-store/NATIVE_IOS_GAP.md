# Native iOS Submission Gap

Status: **App Store submission BLOCKED pending native validation.**

## Repository evidence (2026-09-21)

The native iOS target now exists at `ios/Vibe.xcodeproj/project.pbxproj`.
SwiftUI sources, `ios/Vibe/Info.plist`, a Keychain implementation, an asset
catalog, and `ios/Vibe/PrivacyInfo.xcprivacy` are present. Their presence is
not evidence of a successful signed archive or device test.

## Privacy-manifest assessment

The checked-in manifest declares tracking false with empty tracking-domain,
collected-data and accessed-API arrays. It is an initial manifest, not a
completed privacy assessment. Reconcile its declarations with the actual
native APIs, SDKs and transmitted account/profile/message/media data in
`data-inventory.json` before submission. Do not infer that no data is collected
from an empty manifest. Required-reason APIs and embedded SDKs must be audited
against the final archive. No manifest declarations were invented by this review.

## Remaining submission blockers

- Produce and validate a signed Xcode archive with the supported submission SDK.
- Verify bundle identity, team, provisioning and version/build values.
- Complete the app icon and App Store assets; verify purpose strings against
  actual camera, microphone and photo-library usage.
- Complete the privacy-manifest/API/SDK audit and App Privacy answers.
- Validate native authentication, OTP, recovery, session restoration, onboarding,
  chat, media and voice recording on real devices.
- Verify account deletion and data export end to end. Deletion requires server
  runtime configuration; never embed privileged keys in the native client.
- Review push entitlements/APNs and any paid-feature/StoreKit behavior actually
  enabled in the release. Source files alone do not demonstrate these work.
- Complete accessibility, crash/performance, TestFlight, moderation operations,
  legal/owner decisions and App Store Connect metadata/review requirements.

## Scope of repository checks

`appstore:check` validates repository consistency, policy surfaces and protected
web endpoints. It does not compile Swift, sign an archive, validate the final
privacy report or certify App Store approval. Web publication and native App
Store submission are separate release activities.
