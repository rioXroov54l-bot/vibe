# Vibe social platform

Arabic/English responsive interface with Supabase-backed accounts, profiles, settings, rooms, direct messages, notifications, reactions and private media. Some legacy/demo-only surfaces still exist for features that are not connected to production services.

Implemented interactions: room/category browsing, room creation, flash-room cleanup when its sole demo participant leaves, chat previews, mood selection, local turn-taking conversation cards and word challenges, Vibe+ preview at a displayed SAR 20/month, priority-hand UI, audience ghost mode, animated profile frames, and a five-gift demo balance. Five is a demo quantity; the monthly subscription allowance has not been specified.

Cinema accepts local video/audio files without upload. Echo Stage can record the current device microphone after a permission grant using MediaRecorder, with local playback/download. It cannot record simulated participants. Media capture is stopped on room exit and pagehide. These browser-media paths require verification on target devices.

Email/password authentication, email OTP verification, recovery and same-origin HttpOnly-cookie sessions are connected through Supabase Auth. Google and Apple sign-in are not configured yet.

Durable accounts/messages and server-controlled cloud room lifecycle are connected. Live WebRTC/SFU voice streaming, production billing/subscription verification, monthly entitlements, and some multi-device realtime behaviors are not connected. Vibe+ is explicitly a no-charge preview, not a paid subscription. Ghost mode is not an anonymity guarantee against hosts or service operators.

Official provider setup references:
- https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid
- https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/

Validation: JavaScript syntax and local asset references; VM interaction checks for Arabic/English rendered text, flash cleanup, word scoring/repeats, ghost hand rules, gift limits, escaping, and non-authenticating sign-in previews. Browser/media QA was not requested and was not performed.

App Store preparation: see `appstore/RELEASE-READINESS.md`. The prototype includes bilingual community/privacy/data-control views, local report previews, session-only blocking, basic threat-string checks, and media-rights acknowledgement. None substitutes for a production moderation service, real account deletion, StoreKit, a native iOS build, or Apple approval.

Latest capabilities: required signup terms/privacy acknowledgement; Supabase-backed reporting, private messages, photo and voice-note sharing, profile persistence, onboarding persistence, and an AI support view under Profile with a server-side OpenAI Responses adapter. See `server/SETUP.md` for the required secret, model, authenticated pilot allowlist and limits. AI support is disabled until configured.

Source is now in `public/`; `scripts/build.mjs` embeds assets into a Cloudflare-compatible Worker at `dist/server/index.js`. No third-party runtime dependencies are required. Security response headers are applied by the Worker rather than depending on static `_headers` processing. Scripts/style are same-origin; local blob images/media and same-origin support API requests are permitted by CSP.

## Personal setup update
Three-step bilingual onboarding persists nature choices, interests/personality and profile details to the authenticated account; profile media supports JPEG/PNG/WebP flows with crop/edit support in legacy surfaces. Gallery/capture support depends on the device; HEIC is not accepted. Age 18+ is self-declared, not independently verified. Required terms and privacy consent is immediately below the signup button. Composer switches from Plus media controls to Send on input. No zero-lag guarantee. Terms are draft; refunds follow store policies and applicable rights. Remaining gaps include live streaming, production billing/entitlements, provider-backed Google/Apple sign-in, Spotify production integration and AI-support activation.

## Profile, settings and media update
Nine session-only compressed profile photos support ordering, delete, edit/preview and explicit save; cancel preserves the prior gallery and cleans unused blobs. Three prompts and a computed completion score are included. Verification is explicitly unverified. Super Likes and Boosts are demo allowances, with no real ranking impact. Swipe and Likes refer to social rooms. Settings cover requested categories; account connections, geographic/people filtering, notifications and contact importing are explicitly not connected. Light/dark/system appearance is functional and session-only. Photo processing is single-flight per surface, bounded by 5 MB input and 1280px output, with compression, progress feedback, error handling and cleanup. This mitigates risks but does not certify iOS crash freedom; browser image decoding may still allocate source-image memory. Native/device tests have not run. Refund terms continue to defer to store policies and statutory rights.
