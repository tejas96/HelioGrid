---
name: verify-app
description: Run the app and look at it — web in the browser plus both simulators, walking every state and capturing concrete evidence for the roadmap row. Use before marking any UI work VERIFIED.
---

# Run-and-look verification

**Green gates never prove UI work.** A slice that was never opened was never verified.

*What* to check is the "Done means" list in `.claude/rules/ui-adherence.md`, already loaded
if you have touched UI files. This is *how* to run each surface, and what to bring back.

## Web

Start the dev server through the preview tooling, never a bare shell command —
`.claude/launch.json` declares it. Then walk the screen at **375px and 1440px**, through
every state it can actually reach: loading, empty, error, offline. Switch the locale to
Hindi and look for clipping. Tab through it and watch the focus ring.

Read the console and the network panel before calling it good — a screen that looks right
while a request is failing is not working.

## Mobile — BOTH simulators

Law 7 means both platforms in the same slice. Attach the simulator panel first, then build
and launch, then drive the same walk on iOS **and** Android.

**iOS is agent-drivable; Android is not.** The iOS Simulator has a tool here (attach, launch,
screenshot, tap/swipe/text). There is NO equivalent for an Android emulator, so an agent
cannot drive that half — and quietly reporting "both simulators" after exercising one is the
failure this note exists to stop. Build Android to prove it compiles
(`pnpm --filter @heliogrid/mobile android`), then either ASK THE USER to walk the Android
screen, or record the row as `blocked(android walk pending)`. Never write VERIFIED for a
platform nobody looked at.

RN-specific traps worth attacking directly: timers suspended while the app is backgrounded,
the keyboard covering the focused input, and Devanagari run-splitting in mixed-script text.

## API and worker

curl the endpoints and read the logs. Exercise a **failure** path, not only the happy one:
confirm the error envelope shape and that the status code matches what the contract
promises. A route whose contract declares a non-base error code is exactly where the wire
and the typecheck have disagreed before.

## Evidence

The roadmap Evidence cell needs specifics, not adjectives.

**Good** — "browser 375+1440 happy / wrong-code / send-error paths; iPhone 16 relaunch
restores session; Pixel 8 fresh user passes; curl 409 returns ALREADY_ONBOARDED".
**Bad** — "verified working".

Screenshots for visual changes, curl output for API changes, log excerpts for worker
changes. If you could not run something, say so plainly rather than letting the omission
imply it passed.
