# The four quadrants — what a plan must contain

Every surface in the blast radius gets steps in **all four** quadrants. A plan may be
small; it may not be lopsided. `SKILL.md` counts steps per (surface × quadrant) before
handing off, and a zero cell aborts the run naming the gap.

> **Test data derives from the tenant's market pack.** v1 tenants are IN, so examples in
> this matrix use +91 phones, Devanagari strings and paisa-level reconciliation; a future
> market's runs derive the equivalents (phone spec, scripts, minor unit) from its pack.

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
- **Connection loss.** Connection dropped between send and verify. A request that succeeded
  on the server whose response never arrived.
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

## Assert on text, not on pixels — on EVERY surface

Never ask the model whether a gap is 12px, or whether a screenshot "shows the login
screen". It will confidently guess, and it guesses in the direction of a pass: a blank
loading frame has been reported as a fully rendered screen because the step's criterion was a
picture.

**Every surface has a machine-readable view tree. Use it as the criterion:**

| Surface | Read the tree with | Assert |
|---|---|---|
| web | `read_page` (accessibility tree) · `javascript_tool` for computed values | exact strings, exact computed values |
| iOS | Simulator MCP — accessibility tree | the tree contains the exact label |
| Android | `adb shell uiautomator dump` → XML | `text="…"` attributes match exactly |
| api | `curl -i` | status line and body bytes |
| db | read-only `psql -tAc` against `heliogrid-pg-local` | the scalar returned |

A step whose `expected` cannot be written as a string comparison is not yet a step —
rewrite it until it can. "Renders correctly" is not a criterion; `text="Welcome back"`
present and `text="Loading from"` absent is.

**Screenshots stay, in a smaller role:** evidence a human can look at, and mandatory on
failure. They are never the thing that decides pass or fail. This is also the cheapest
change available — a view-tree dump greps to a few lines, where a 300 KB PNG must be
vision-decoded by the executor and again by the verifier.

**Vision is still right for what only vision catches:** clipping, overlap, truncation,
broken Devanagari run-splitting, layout collapse at 375px. Those steps say so explicitly.

## Parity — the test this repo needs most, and the one easiest to forget

Web and RN ship the same behaviour from the same shared code (Law 7, `@heliogrid/data`).
So the highest-value assertion is not "each surface works" — it is **that they agree**.

Checking the 10-digit phone cap three times, once per surface, proves three things
separately and the important thing not at all: a shared constant could change on one
platform and every per-surface step would still pass.

Author parity as **explicit merge steps**: each surface records an observed VALUE, and one
step afterwards compares them. Candidates in any slice touching shared code — OTP box
count, input length caps, error copy for the same failure, the enum options a picker
renders, the formatted phone string.

This is exactly what a per-surface split makes easy: the surfaces already return values;
the merge step is a comparison, not another device interaction.

## Always-on core, regardless of blast radius

Every run includes at least one step for each:

- Tenancy isolation — a cross-tenant read returns 404.
- Money reconciliation — BOM ↔ proposal ↔ tranches agree to the minor unit of the tenant's
  currency (paisa for IN).
- Auth — an unauthenticated request to a protected route is rejected.

## Evidence standard

Specifics, not adjectives.

**Good** — "browser 375+1440 happy / wrong-code / send-error paths; iPhone 16 relaunch
restores session; Pixel 8 fresh user passes; curl 409 returns ALREADY_ONBOARDED".
**Bad** — "verified working".