# iOS Permissions Matrix (Draft)

Status: DRAFT. Native iOS target is not present in the repository; browser/web
permission behavior is documented as current evidence, and native requirements
are listed as future work. See `docs/app-store/NATIVE_IOS_GAP.md`.

Current evidence: browser `Permissions-Policy` allows `camera=self` and
`microphone=self`, and disables `geolocation`.

| Capability | Current use | Where triggered | Native iOS future requirement | Prompt timing |
| --- | --- | --- | --- | --- |
| Camera / photo capture | User-initiated media sharing and profile photo capture | Only when the user starts a capture/upload action | `NSCameraUsageDescription` (required only if using the camera API). Browser/web permission is requested only when used. | At point of use, after an explicit user action |
| Microphone | Voice note recording | Only when the user starts voice note recording | `NSMicrophoneUsageDescription` (required only if recording audio). Browser/web permission is requested only when used. | At point of use, after explicit user action |
| Photo library / file picker | User selection of existing photos/files | Only when the user picks media | Prefer the Photos picker / file importer; add `NSPhotoLibraryUsageDescription` only if the selected API requires it | At point of use |
| Location | Not collected | — | Do not request. Geolocation is disabled in `Permissions-Policy`. | Never |
| Contacts | Not connected | — | Do not request (no contact-book upload). | Never |
| Notifications | In-app notifications exist | In-app only | Native APNs not implemented. Future: user-facing consent prompt + push entitlement before any APNs use. | Opt-in, at a clear in-app moment — never at launch |
| Tracking / IDFA | None | — | ATT not requested (`none_in_current_runtime`). Re-evaluate only if tracking/ads/SDKs are added. | Never (currently) |
| Bluetooth | Not used | — | Do not request. | Never |
| Health / Fitness | Not used | — | Do not request. | Never |
| Calendar / Reminders | Not used | — | Do not request. | Never |
| Motion & Fitness | Not used | — | Do not request. | Never |
| Speech Recognition | Not used | — | Do not request (voice notes are recorded, not transcribed via speech API in current evidence). | Never |
| Local Network | Not used | — | Do not request. | Never |
| Music / Media Library | Not used | — | Do not request. Spotify connection is OAuth-based, not device media access. | Never |

## Denial / Fallback Behavior Recommendations

- **Camera (denied):** offer the photo library / file picker as an alternative;
  show a plain-language explanation and a link to Settings; never block core
  messaging.
- **Microphone (denied):** keep text messaging fully functional; offer an option
  to stop recording and continue without voice notes; provide Settings deep link.
- **Photo library (denied/limited):** respect limited access; offer the file
  picker or camera as alternatives; do not repeatedly re-prompt.
- **Notifications (declined):** continue delivering in-app notifications; never
  gate functionality on push consent.
- **Location / Contacts / other unused:** do not request; if a future feature
  needs them, add a purpose string and a clear pre-prompt rationale first.

## Prompting Principles

- Never request any permission at app launch.
- Request only at the moment the user performs the action that needs it.
- Explain the benefit in-app before invoking a system prompt.
- Never re-prompt in a loop after denial; respect the user's decision and offer
  a Settings path.

## Notes for Native Target Build

- Generate `Info.plist` purpose strings from this matrix, but include only the
  keys corresponding to APIs actually linked in the native target.
- If push is added later, add the push entitlement and APNs setup; notifications
  consent remains opt-in and user-initiated.
- If Sign in with Apple is introduced because a third-party primary login is
  added, add the corresponding capability and purpose language at that time.
