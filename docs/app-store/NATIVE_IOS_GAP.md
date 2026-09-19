# Native iOS Submission Gap

Status: **Native packaging BLOCKER.**

## Summary

The repository currently contains **no native iOS target**. Verified: no
`.xcodeproj`, no `.xcworkspace`, no Swift or Objective-C sources, no
`Package.swift`, no `Info.plist`, and no `PrivacyInfo.xcprivacy`. Therefore,
**App Store submission is BLOCKED regardless of web readiness.** No amount of web
or backend readiness work unblocks submission until a native target exists and is
packaged for upload.

No bundle identifier or team identifier is fabricated in this document. Those
values are owner-provided and must not be invented.

## Exact Blockers and Required Steps

1. **Create the native target / shell and define architecture.**
   Decide native wrapper vs full native implementation. Do not invent an
   architecture; owner/eng must choose and document it.
2. **Xcode 26+ / current Apple SDK requirement for uploads.**
   Build and archive with the current required Xcode/SDK at submission time.
3. **Bundle ID / team / certificates / provisioning — OWNER_ACTION.**
   Owner must supply the bundle identifier, team id, signing certificates, and
   provisioning profiles. Do not fabricate these.
4. **Version / build number.**
   Define `CFBundleShortVersionString` and `CFBundleVersion` for the native target.
5. **App icon (1024×1024) and asset catalog.**
   Provide the 1024pt marketing icon and the asset catalog resources.
6. **Info.plist purpose strings.**
   Derive only the keys for APIs actually used, using
   `docs/app-store/PERMISSIONS_MATRIX.md` (camera, microphone, photo library as
   applicable). No location/contacts/bluetooth request.
7. **PrivacyInfo.xcprivacy.**
   Generate from the **actual native APIs and SDKs** used, including any
   required-reason API declarations. Must reflect the built binary, not this doc.
8. **Third-party SDK privacy manifests / signatures review.**
   For every embedded SDK: verify privacy manifest presence and signature
   requirements (Supabase, Resend client usage, Spotify OAuth, OpenAI calls are
   service calls — but any bundled SDK must be reviewed). Add manifests as needed.
9. **ATS / network domains.**
   Review App Transport Security settings and ensure only intended domains are
   reachable; document any exceptions with justification.
10. **Universal links / custom URL schemes / deep links — only if used.**
    Configure associated domains and `apple-app-site-association` /
    `assetlinks` only if the product uses them.
11. **Sign in with Apple — only if triggered.**
    Required only if a third-party primary login is introduced/triggered by the
    native shell. Not required by current evidence (email/OTP based).
12. **StoreKit — only if digital paid features are enabled.**
    Vibe+ is preview/no-charge and purchase is disabled; no StoreKit required
    while that remains true.
13. **Push entitlements / APNs — only if native push is added.**
    In-app notifications exist today; native APNs is not implemented.
14. **Keychain / session storage review.**
    Review native session/token storage (e.g., Keychain) for auth state and the
    Spotify refresh token handling; ensure secure storage on device.
15. **TestFlight and on-device QA.**
    Internal TestFlight build and real-device verification of all flows
    (auth, messaging, media, voice notes, Spotify connect, account deletion,
    data export).
16. **Accessibility.**
    Verify VoiceOver, Dynamic Type, Voice Control, and Reduce Motion. Address
    findings before submission.
17. **Crash / performance / device testing.**
    Run on target device class(es); check launch time, scrolling performance,
    memory, and crash-free sessions.
18. **App Store Connect metadata / privacy / age rating / manual tasks.**
    Complete App Privacy answers (see `docs/app-store/APP_PRIVACY_LABEL.md`),
    screenshots, description, keywords, support/marketing/privacy URLs, and set
    the age rating after the owner finalizes the legal minimum age.

## Runtime Dependency Warning

- Account deletion backend exists but **requires runtime
  `SUPABASE_SERVICE_ROLE_KEY`** to be configured. Verify it is set in production
  and that deletion works end-to-end before submission.

## Final Status

**Native packaging BLOCKER.** Submission cannot proceed until a native iOS target
is created, configured, built, and validated against the steps above.
