# SCR-SHELL-06 · Billing State Banner & Denial Sheets

App-shell state banner, trial countdown chip, dunning banner and typed blocked-mutation denial messages.

**Module:** SHELL · **Personas:** EPC Owner (the only person who can act), Sales Manager (sees the dunning banner), all employees (see state banners; acts render only for the Owner — M12 §M12.2 permissions) · **Context of use:** rendered inside the shell on every surface, on both platforms; denial sheets fire wherever a person attempts a blocked mutation, on either platform.

## Entry & exit

Reached from: not navigated to — the state banner and countdown chip render in the app shell whenever the tenant is in a trial countdown, a post-expiry soft block, `past_due` grace, cap-ladder or halted state (M12-53, M12-06, M12-30, M12-39); a denial sheet fires when any UI mutation is blocked by the billing-state matrix (M12-21). Leads to: the "Reactivate" (or upgrade) path (M12-21); the day-6 one-tap pay link (M12-39); the plan-pick screen at trial expiry (M12-53 — SCR-M12-03); the usage screen carries the cap ladder's own surface (M12-30 — SCR-M12-04). If the PRD does not pin an entry/exit beyond these, it is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M12-platform-billing.md

- **M12-06** (P0) — **`past_due` carries a 7-day grace in two phases:** days 0–3 full function plus the banner; days 4–7 only the features that cost per-use money pause (voice, AI detections, invites). **Core selling continues through the whole grace window** — leads, surveys, designs, proposals, projects all work to day 7. _(non-UI half, build-side: two-phase 7-day grace timer; only metered features pause day 4 — for awareness, not for drawing)_
- **M12-21** (P0) — **Every UI mutation is gated by the billing-state matrix; denial is typed and honest.** A blocked mutation returns a typed entitlement-blocked error; the UI renders the state banner and a "Reactivate" (or upgrade) path. This module implements `BM-35`'s matrix as the gate on every mutation and **may add enforcement detail but may never move a ✓ to a block** — the matrix is 04's law. _(non-UI half, build-side: BM-35 matrix gates every mutation; typed entitlement-blocked error — for awareness, not for drawing)_
- **M12-30** (P0) — **Cap enforcement mechanics:** the usage screen warns at **80%** of any capped count or ceiling (M12-34 — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records and exporting never pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window — no proration, no weighting. _(non-UI half, build-side: 80%/100%/7-day-grace cap ladder; counts reset on billing anchor, no proration — for awareness, not for drawing)_
- **M12-31** (P0) — **Every pause message states exactly what paused and what still works.** From `past_due` day 4's metered pause to a cap's post-grace pause, the copy is specific (which features, until when, what resolves it) — never a generic "account limited".
- **M12-39** (P0) — **The dunning ladder runs from the first failed charge, one rung per fact:** day 0 → `past_due`, banner + push + message ("payment failed, we'll retry — update your method here") · day 2 reminder · day 4 → metered features pause, and the message states **exactly what paused and what still works** · day 6 final warning with a one-tap pay link · day 7 → `halted`, and the message **confirms read + export + customer links + the billing screens (pay/upgrade/reactivate) still work** *(Final review: "billing screens" restored — `BM-32`'s always-works list is four items)* · post-halt weekly × 4, then monthly, indefinitely — reactivation always one payment away. **Grandfathering honesty (owner ruling 2026-08-04, Q43):** for a tenant inside a protection horizon, the ladder's copy from day 0 states plainly that a lapse to `cancelled`/`halted` **forfeits the launch-price guarantee** and reactivation prices at the current book — the no-surprise rule; win-back messages repeat it. _(non-UI half, build-side: day 0/2/4/6/7 rung timers, post-halt weekly then monthly; forfeiture disclosure — for awareness, not for drawing)_
- **M12-53** (P0) — **Trial UX: honest countdown, soft expiry, no hostage patterns.** A countdown chip stays subtle until D-7; expiry leads to a plan-pick screen; post-expiry is the soft-block set — create/edit paths blocked with a plan prompt, read + export always working. Expiry must convert, never destroy. _(non-UI half, build-side: soft expiry law: convert never destroy; read+export always work — for awareness, not for drawing)_
  _Shared row: this screen carries the countdown chip and the post-expiry soft-block prompt; the plan-pick destination is SCR-M12-03._

## States

- **loading**
- **empty** — no billing condition: no banner, no chip, nothing rendered
- **error**
- **trial-countdown-subtle** — the countdown chip staying subtle until D-7 (M12-53)
- **trial-countdown-d7-prominent** — the chip from D-7 (M12-53)
- **trial-expired-soft-block** — post-expiry, the soft-block set: the banner states the trial has expired, and the denial sheet on a blocked act names exactly which paths are blocked — create/edit — and states that read and export still work; the plan prompt is the sheet's one action and it routes to the plan-pick screen (M12-53 — SCR-M12-03). Nothing is destroyed and nothing is withheld to force the hand: expiry must convert, never destroy, and the copy is specific about what paused, until when and what resolves it, never a generic "account limited" (M12-53, M12-31).
- **past-due-day0-3-banner** — banner up, full function (M12-06, M12-39 day 0/day 2 rungs)
- **day4-metered-paused** — exactly the metered features paused; message states exactly what paused and what still works (M12-06, M12-39, M12-31)
- **day6-final-warning-one-tap-pay** — final warning with a one-tap pay link (M12-39)
- **halted-still-works-list** — `halted`, message confirms read + export + customer links + the billing screens (pay/upgrade/reactivate) still work (M12-39)
- **protected-tenant-forfeiture-variant** — the same ladder for a tenant inside a protection horizon: from day 0, and on every rung after it, the copy states plainly that a lapse to `cancelled`/`halted` forfeits the launch-price guarantee and reactivation prices at the current book — the no-surprise rule (M12-39, owner ruling 2026-08-04 Q43). This is a variant of each dunning rung above, not a rung of its own: the day 0, day 2, day 4, day 6 and day 7 banners each carry the extra disclosure sentence for a protected tenant and omit it for every other tenant, so both lengths must read well. It is a disclosure, never a threat — the consequence named is one that will actually occur, and no dunning copy threatens deletion, because nothing is deleted (M12-41 context — the dunning-honesty law).
- **cap-80-warning** — the 80% pre-warning; the first notice is never the block (M12-30)
- **cap-100-grace** — the 100% banner with the 7-day grace running (M12-30)
- **cap-post-grace-paused** — new creations of that type paused until upgrade or the next cycle; reading, editing existing records and exporting never pause (M12-30, M12-31)
- **typed-denial-with-reactivate-route** — the typed entitlement-blocked denial rendering the state banner and a "Reactivate" (or upgrade) path (M12-21)
- **no-amounts-for-employees** — state banners render for all employees; billing acts render only for the Owner (M12 §M12.2 permissions)

## Data volume

One banner at a time: gates compose with one rule — the broadest true fact speaks (state before cap, cap before bundle), so a user never gets two banners for one act (M12 §M12.4 behavior detail). The ladder is five rungs plus post-halt weekly × 4 then monthly (M12-39); the cap ladder is 80% → 100% → 7-day grace → pause (M12-30). Every dunning rung has two copy lengths — the ordinary one and the protected tenant's, which carries the forfeiture disclosure from day 0 — so design the banner at the longer of the two without letting the shorter one look empty (M12-39, Q43). Design the denial sheet's "what still works" list at the always-works set's real length — four items at `halted` (M12-39).

## Numbers carrying provenance

Each of these user-visible numbers/dates carries its F8 provenance tier in the design. This is a billing surface, so it uses plain "actual usage" language per the owner ruling carried in M12-34 — the provenance word "measured" is reserved for engineering/survey data and never appears here (owner ruling 2026-08-04, Q9). It binds the cap ladder's consumption figures in particular, which name the same rollups the usage screen states (M12-30 → SCR-M12-04):

- The trial countdown chip's days remaining, and its D-7 threshold (M12-53)
- The grace-day position in the dunning ladder — day 0 / 2 / 4 / 6 / 7 (M12-39, M12-06)
- The cap percentages — 80% warning, 100% banner — and the 7-day cap grace (M12-30)
- The "until when" in every pause message (M12-31)
- No money amounts render for non-Owner employees: banners for all employees, acts and their figures for the Owner only (M12 §M12.2 permissions)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state rendering the banner from cached entitlement state, and a Context-of-use clause about a field user's already-captured queue draining regardless of billing state. Both are deleted; the billing-state guarantees themselves are `modules/M12`'s and are untouched.*
