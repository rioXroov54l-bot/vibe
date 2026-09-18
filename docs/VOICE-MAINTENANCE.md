# Voice maintenance — FIX18

Chat recorder: guarded cancellation and teardown; permission deadline 30 seconds; stop deadline 5 seconds; late streams discarded by generation and conversation; listeners removed before tracks stop; muted/ended input cancels rather than sending partial audio; MIME constructor fallback; elapsed wall-clock duration; one-minute/2-MiB bound; playback paused when recording starts. No automatic re-request following a failure.

Gestures: pointer capture on stable body; lost capture cancels; dominant diagonal axis chooses lock/cancel; release sends only with a valid active recording; lock survives release; context menu suppressed on microphone. Cancel never dispatches. Platform permission prompts remain necessary.

Echo recorder: exclusion with chat recording, guarded stop, permission/stop deadlines, interruption cleanup, one-minute cancellation ceiling.

Validation: node tests/security.cjs includes mocked MediaRecorder regressions for permission denial, track interruption, stop throw, stop event timeout, permission timeout, late resolution during a new recording, unexpected stop, lock/release/cancel and retry. Source security tests also pass. These are deterministic simulation tests, not Safari, actual microphone, Bluetooth, phone-call interruption, Xcode build or latency measurements. No zero-latency or crash-free guarantee.

Architecture remains WKWebView + MediaRecorder, not an AVAudioEngine/AudioQueue native implementation. Private messages remain local prototype messages, not delivered to other users.

Device acceptance: on a physical iPhone test first permission allow/deny and settings recovery; repeat short recordings; release to send; up-lock then send/trash; left-cancel; background/return; incoming call; wired/Bluetooth disconnect; listen to resulting audio. Confirm no continuing microphone use after cancellation.

Official API reference: https://www.w3.org/TR/mediastream-recording/ (working draft; recording data/stop/error ordering). No buffers are released until final dataavailable/stop on the normal send path.
