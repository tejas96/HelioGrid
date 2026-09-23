# SCR-SHELL-06 · Billing State Banner & Denial Sheets

App-shell state banner, trial countdown chip, dunning banner and typed blocked-mutation denial messages.

**Module:** SHELL · **Personas:** EPC Owner (the only person who can act), Sales Manager (sees the dunning banner), all employees (see state banners; acts render only for the Owner — M12 §M12.2 permissions) · **Context of use:** rendered inside the shell on every surface, on both platforms; denial sheets fire wherever a person attempts a blocked mutation, on either platform.

**One job:** know the account's billing state at a glance, and reach the one act that fixes it.
**Order of attention:** 1 what is wrong, and the one act · 2 what paused, what still works and until when · 3 for the Owner only, the amount.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **This strip
sits on every screen of the product, so every word in it is paid for on every screen.** What paused,
what still works and until when are never behind a tap (`M12-31`, `F7-46`), and a pinned bar's budget
is one line: that is a collision, and §2 settles it — the facts stay and take the ROW form. Name it
in the self-audit. The strip spends its height on rows, never on sentences.

| Fact | Kind | Its form here |
|---|---|---|
| The state — trial days left, a failed payment and its day in the grace, a cap at 80% or at its ceiling, halted (`M12-53`, `M12-06`, `M12-30`, `M12-39`) | status · data | the strip's ONE title line: the fact with its count or its date |
| What paused, and what still works until when (`M12-31`, `M12-39`) | data | at most three short rows under the title — `Paused`, `Still works`, and `Until` with the date in a row of its own, because the deadline is the fact the person acts on. `Paused` and `Still works` are lists, so each gets the full width with its icon and its word leading the line — never a narrow value column beside a label; `Until` is short, so it is one label–value line. At `halted` the always-works set is a four-item list, because it is four items. Never a paragraph, never "account limited" |
| What resolves it (`M12-31`, `M12-21`) | action | the strip's ONE act; its label IS what resolves it. The day-6 act names the payment method it will charge |
| The automatic retry, while nothing has paused (`M12-39`) | data | that a retry is coming rides the title line; it is not a sentence of reassurance, and no retry date is invented |
| The forfeiture disclosure, for a tenant inside a protection horizon (`M12-39`) | fixed disclosure | ONE sentence, drawn whole on every rung, never trimmed, never behind a tap — and not counted against any budget |
| The trial countdown before D-7 (`M12-53`) | status | a chip with its tier mark and no act — a fact, no pressure |
| A blocked act (`M12-21`) | data · action | the denial is a sheet at 375 and a centred modal at 1536: its title names what was blocked; two short lists, `Paused` and `Still works`; ONE primary act — reactivate, pick a plan, or upgrade |
| The amount (Owner only) | data | in the act's label, or one label–value row. For every other employee the strip renders without it |
| A person who is not the Owner | status | the state and its rows stay; the act's place is taken by ONE line naming whose act it is |
| Provenance (`F8-07`) | honesty label | ONE row: the tier as a mark — dot and word — beside the `Derivation` disclosure that opens the origins, which charge and which invoice. Never a line of words in the strip, and no separator left hanging after the mark. A recorded date carries none |
| The billing state could not be read | error | one line and `Try again`. No figure at all — not the last known day, not the amount |
| No billing condition | — | nothing is rendered: no strip, no chip, no teaching |

## Arrangement

- **375.** The strip sits between the top bar and the scrolling content, pinned: the title line, its
  rows, then the act on its own line. One banner at a time — the broadest true fact speaks.
- **1536.** The same strip in the content column: title and rows on the left, the act in the strip's
  action row on the right; the four-item list runs in one wrapping row.

## Sample data — the PRD's own rows, drawn and never invented

The first drawing of this screen invented a 30-day trial and a meter called "AI designs" at 40 of 50,
because this brief carried neither fact. The trial's length, every meter's name and every bundle size
on this screen are these rows' values; a frame that shows another is wrong. Counts used, dates and the
invoice are yours to choose.

- **M12-52** (P0) — **The trial is modelled in-app only; the gateway subscription is created at conversion.** 14 days, every tier capability, within the trial caps (book data — `BM-41`); no card or mandate to start; one 7-day extension available to support (an audited override, M12-19's family).
- **BM-41** (P0) — **The India book — the source-derived first instance (IN book; every number below is IN-market data, not the generic model).** Identified by `F1-60`/`F1-61`; canonical here. **Tier prices (INR, ex-GST):** Starter **₹1,999/mo · ₹19,990/yr** — Growth **₹3,999/mo · ₹39,990/yr** — Pro **₹9,999/mo · ₹99,999/yr** — Enterprise **custom, anchored ₹24,999+/mo**, annual contract (owner-set anchors ~₹2k/~₹4k/~₹10k). **Capacity + counts:** single-design ceiling 50 kW / 500 kW / 5 MW / 100 MW (utility: blocks/zones, trackers, terrain); proposals 30 / 300 / 1,500 / unlimited per month; active projects 10 / unlimited / unlimited / unlimited; users unlimited on all four. **Bundles + overage:** AI detections 30 / 100 / 400 / custom per month, then ₹10 each; voice minutes PAYG ₹6/min on Starter and Growth, 400 min/mo bundled then ₹6/min on Pro, custom bundles + BYO number on Enterprise; storage 10 / 50 / 250 GB / custom. **Trial caps:** 25 detections · 15 voice minutes · 5 GB. **Service terms are pricing-page copy, not book data (owner ruling 2026-09-07):** the IN positioning — support in-app / in-app + WhatsApp / priority + onboarding call / named contact — is rendered by the pricing page as Tier-keyed screen copy per BM-14; the book carries none of it and no entitlement, invoice or gate reads it, and a second market whose terms differ carries them as pack labels (`F1-22`), never in a locale-keyed catalog. Enterprise adds the BM-15 commercial arrangements. **Benchmarks (recorded per BM-39):** Reslink India INR page (owner-supplied, authoritative — Basic ₹60,000/yr at 50 kW · Pro ₹85,000/yr at 500 kW, 1,000 proposals · Premium ₹1,20,000/yr at 5 MW · Enterprise custom) and ARKA per-org pricing; priced under both at every rung — Starter-yearly 67% under Basic, Growth-yearly 53% under Pro, Pro-yearly 17% under Premium with a voice bundle no competitor has, and Pro's 1,500 proposals/mo beat the benchmark's 1,000. **Collection routes:** per the IN mandate ladder, F1-40 (monthly self-serve under the per-debit cap rides UPI AutoPay; Enterprise e-NACH/invoice; every yearly total exceeds the cap and is a single payment link/invoice per year). **V2 add-on prices (owner ruling 2026-08-04 — base tiers confirmed unchanged; every add-on number below is DRAFT pending rate-card verification per BM-17/BM-26):** tracked seat **≈₹99/seat/mo** beyond the tier's included allowance; **included tracked seats: Starter 0 · Growth 3 · Pro 10 · Enterprise custom**; marketing-send bundles **Starter 500 · Growth 2,000 · Pro 10,000 sends/mo**, overage **≈ WhatsApp ₹1.5 · SMS ₹0.35 · email ₹0.10 per send**. A draft add-on rate is not sellable until the owner verifies the channel/seat rate cards against worst-case unit COGS (the ≥40% floor, BM-17) — verification is the revisit trigger.

**The person's words (context file §2), on this screen.** A cap's act is `Upgrade plan`. The
forfeiture disclosure names today's prices, not "the current book". The day a trial ended is a
recorded date, so it carries no mark.

## Entry & exit

Reached from: not navigated to — the state banner and countdown chip render in the app shell whenever the tenant is in a trial countdown, a post-expiry soft block, `past_due` grace, cap-ladder or halted state (M12-53, M12-06, M12-30, M12-39); a denial sheet fires when any UI mutation is blocked by the billing-state matrix (M12-21). Leads to: the "Reactivate" (or upgrade) path (M12-21); the day-6 one-tap pay link (M12-39); the plan-pick screen at trial expiry (M12-53 — SCR-M12-03); the usage screen carries the cap ladder's own surface (M12-30 — SCR-M12-04). If the PRD does not pin an entry/exit beyond these, it is not pinned by PRD — designer decides, note the decision.

**Decisions made in design (2026-09-20) — later screens inherit them.**

1. **The slot.** One pinned slot between the top bar and the scrolling content, one banner at a time (`BannerStack mode="single"`). It never scrolls away and is never dismissed: `BM-32` makes the strip the guaranteed way back.
2. **The strip's form.** One title line; rows of ONE family — a mark, the row's word leading the line, then its values — `Paused`, `Still works`, and a dated row (`Until`, `Account halts`, `Cycle resets`, `New detections pause`); then ONE row with the tier mark and the `Derivation` beside it; then the act. The act sits on its own line at 375 and in the banner's action row at 1536, where the strip caps at 1080.
3. **Where the act goes.** Every dunning, trial and halted act, and both denials' act, route to `SCR-M12-03` and return to the surface they were pressed from; the day-6 act is that route with the card already chosen. The 80% cap's act is `See usage` and routes to `SCR-M12-04`; at 100% and after the grace the act is `Upgrade plan`.
4. **A person who is not the Owner.** `ScopeNote` takes the act's place, its holder in the design system's form — `Mahesh Bhosale (owner)` — and no amount is rendered.
5. **The default frame is `past_due`, day 4 of 7** — the one ordinary rung where something has paused while core selling still works.

**Decision made in the redesign.** The failed charge is the Growth month — invoice `HG-INV-2026-0902`,
₹3,999 + 18% GST = **₹4,718.82** — the same figure `SCR-M12-02` prints with its working. One story, one
figure across every billing screen.

## Requirements (verbatim)

### docs/prd/modules/M12-platform-billing.md

- **M12-06** (P0) — **`past_due` carries a 7-day grace in two phases:** days 0–3 full function plus the banner; days 4–7 only the features that cost per-use money pause (voice, AI detections, invites). **Core selling continues through the whole grace window** — leads, surveys, designs, proposals, projects all work to day 7. _(non-UI half, build-side: two-phase 7-day grace timer; only metered features pause day 4 — for awareness, not for drawing)_
- **M12-21** (P0) — **Every UI mutation is gated by the billing-state matrix; denial is typed and honest.** A blocked mutation returns a typed entitlement-blocked error; the UI renders the state banner and a "Reactivate" (or upgrade) path. This module implements `BM-35`'s matrix as the gate on every mutation and **may add enforcement detail but may never move a ✓ to a block** — the matrix is 04's law. _(non-UI half, build-side: BM-35 matrix gates every mutation; typed entitlement-blocked error — for awareness, not for drawing)_
- **M12-30** (P0) — **Cap enforcement mechanics:** the usage screen warns at **80%** of any capped count or ceiling (M12-34 — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records and exporting never pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window — no proration, no weighting. _(non-UI half, build-side: 80%/100%/7-day-grace cap ladder; counts reset on billing anchor, no proration — for awareness, not for drawing)_
- **M12-31** (P0) — **Every pause message states exactly what paused and what still works.** From `past_due` day 4's metered pause to a cap's post-grace pause, the copy is specific (which features, until when, what resolves it) — never a generic "account limited".
- **M12-39** (P0) — **The dunning ladder runs from the first failed charge, one rung per fact:** day 0 → `past_due`, banner + push + message ("payment failed, we'll retry — update your method here") · day 2 reminder · day 4 → metered features pause, and the message states **exactly what paused and what still works** · day 6 final warning with a one-tap pay link · day 7 → `halted`, and the message **confirms read + export + customer links + the billing screens (pay/upgrade/reactivate) still work** *(Final review: "billing screens" restored — `BM-32`'s always-works list is four items)* · post-halt weekly × 4, then monthly, indefinitely — reactivation always one payment away. **Grandfathering honesty (owner ruling 2026-08-04):** for a tenant inside a protection horizon, the ladder's copy from day 0 states plainly that a lapse to `cancelled`/`halted` **forfeits the launch-price guarantee** and reactivation prices at the current book — the no-surprise rule; win-back messages repeat it. _(non-UI half, build-side: day 0/2/4/6/7 rung timers, post-halt weekly then monthly; forfeiture disclosure — for awareness, not for drawing)_
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
- **protected-tenant-forfeiture-variant** — the same ladder for a tenant inside a protection horizon: from day 0, and on every rung after it, the copy states plainly that a lapse to `cancelled`/`halted` forfeits the launch-price guarantee and reactivation prices at the current book — the no-surprise rule (M12-39, owner ruling 2026-08-04). This is a variant of each dunning rung above, not a rung of its own: the day 0, day 2, day 4, day 6 and day 7 banners each carry the extra disclosure sentence for a protected tenant and omit it for every other tenant, so both lengths must read well. It is a disclosure, never a threat — the consequence named is one that will actually occur, and no dunning copy threatens deletion, because nothing is deleted (M12-41 context — the dunning-honesty law).
- **cap-80-warning** — the 80% pre-warning; the first notice is never the block (M12-30)
- **cap-100-grace** — the 100% banner with the 7-day grace running (M12-30)
- **cap-post-grace-paused** — new creations of that type paused until upgrade or the next cycle; reading, editing existing records and exporting never pause (M12-30, M12-31)
- **typed-denial-with-reactivate-route** — the typed entitlement-blocked denial rendering the state banner and a "Reactivate" (or upgrade) path (M12-21)
- **no-amounts-for-employees** — state banners render for all employees; billing acts render only for the Owner (M12 §M12.2 permissions)

## Data volume

One banner at a time: gates compose with one rule — the broadest true fact speaks (state before cap, cap before bundle), so a user never gets two banners for one act (M12 §M12.4 behavior detail). The ladder is five rungs plus post-halt weekly × 4 then monthly (M12-39); the cap ladder is 80% → 100% → 7-day grace → pause (M12-30). Every dunning rung has two copy lengths — the ordinary one and the protected tenant's, which carries the forfeiture disclosure from day 0 — so design the banner at the longer of the two without letting the shorter one look empty (M12-39, `BM-42`). Design the denial sheet's "what still works" list at the always-works set's real length — four items at `halted` (M12-39).

## Numbers carrying provenance

Each of these user-visible numbers/dates carries its F8 provenance tier in the design. This is a billing surface, so it uses plain "actual usage" language per the owner ruling carried in M12-34 — the provenance word "measured" is reserved for engineering/survey data and never appears here (owner ruling 2026-08-04). It binds the cap ladder's consumption figures in particular, which name the same rollups the usage screen states (M12-30 → SCR-M12-04):

- The trial countdown chip's days remaining, and its D-7 threshold (M12-53)
- The grace-day position in the dunning ladder — day 0 / 2 / 4 / 6 / 7 (M12-39, M12-06)
- The cap percentages — 80% warning, 100% banner — and the 7-day cap grace (M12-30)
- The "until when" in every pause message (M12-31)
- No money amounts render for non-Owner employees: banners for all employees, acts and their figures for the Owner only (M12 §M12.2 permissions)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state rendering the banner from cached entitlement state, and a Context-of-use clause about a field user's already-captured queue draining regardless of billing state. Both are deleted; the billing-state guarantees themselves are `modules/M12`'s and are untouched.*
