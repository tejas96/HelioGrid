# The four quadrants — what a plan must contain

Every surface in the blast radius gets steps in **all four** quadrants. A plan may be
small; it may not be lopsided. `SKILL.md` counts steps per (surface × quadrant) before
handing off, and a zero cell aborts the run naming the gap.

The two files this replaced each had one half of this: `/verify-app` walked states and
never attacked, `qa-breaker` attacked and never confirmed the feature worked.

## Quadrant 1 — happy path (does it do the job?)

- The complete designed flow, start to finish, with valid input and no interference.
- Every success state actually renders: the confirmation, the populated list, the receipt.
- The primary number or money figure is correct and carries its provenance tier.
- Locale EN renders; then the same flow in HI renders without clipping (allow 20–30%
  expansion).

## Quadrant 2 — edge cases (do the boundaries hold?)

- Zero rows, exactly one row, and realistic volume (200 leads, a 40-line BOM, 50 members).
- First page, last page, and the exact page boundary.
- A value exactly at its limit, one below, one above.
- Max-length strings, especially Devanagari — verify `AppText` run-splitting on mobile.
- A timer at exactly 0 (the 30s resend countdown) and immediately after.
- 375px and 1440px on web; smallest and largest supported device on mobile.

## Quadrant 3 — negative paths (do designed failures behave?)

- Wrong OTP, expired session, revoked token, malformed payload, missing required field.
- Every role against every action — a `surveyor` on an owner-only surface. The guard must
  be deny-by-default, never allow-unless-listed.
- Error envelope shape and HTTP status match what the contract declares. A route whose
  contract declares a non-base error code is exactly where the wire and the typecheck have
  disagreed before.
- Cross-tenant access returns **404, never 403** — a 403 leaks that the row exists.
- The UI surfaces the error in the user's language, not a raw code.

## Quadrant 4 — adversarial (does it survive attack?)

Author these assuming the implementation is wrong until proven otherwise.

- **Double-submit.** Rapid double tap. Submit while a request is in flight. Back, then
  resubmit. Is the in-flight guard per-action or global — and is that the right one?
- **Offline.** Airplane mode mid-flow. Connection dropped between send and verify. A
  request that succeeded on the server whose response never arrived.
- **Stale data.** Two tabs, two devices. Data changed underneath. A cached response after a
  mutation. Design changed but quote not recomputed — does money read provisional, or
  silently final?
- **Cross-tenant probes.** Any identifier from tenant B used from a tenant A session.
- **Absurd inputs.** 0, negatives, 10⁶ kW, emoji names, 40-character Hindi labels, RTL
  characters, SQL-shaped strings, 500-character free text, leading/trailing whitespace, a
  phone number with the wrong country code.
- **Timers and lifecycle.** Backgrounded app — RN timers suspend, so is the countdown
  wall-clock or interval based? Rotation. Locale switched mid-flow. Session expiring
  mid-flow.

## Pixel precision — measure, do not eyeball

Never ask the model whether a gap is 12px or 16px; it will confidently guess.

- **Exact values** come from the DOM. Playwright reads `getComputedStyle`, and the step
  asserts the computed string against `packages/tokens/dist/tokens.json`. Deterministic,
  no model judgement.
- **Vision** is used only for what it is good at: clipping, overlap, truncation, broken
  Devanagari run-splitting, and layout collapse at 375px.

## Always-on core, regardless of blast radius

Every run includes at least one step for each:

- Tenancy isolation — a cross-tenant read returns 404.
- Money reconciliation — BOM ↔ proposal ↔ tranches agree to the paisa.
- Auth — an unauthenticated request to a protected route is rejected.

## Evidence standard

Specifics, not adjectives.

**Good** — "browser 375+1440 happy / wrong-code / send-error paths; iPhone 16 relaunch
restores session; Pixel 8 fresh user passes; curl 409 returns ALREADY_ONBOARDED".
**Bad** — "verified working".