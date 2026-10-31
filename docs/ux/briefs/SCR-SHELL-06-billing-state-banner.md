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
| The state — trial days left, a failed payment and its day in the grace, a cap at its ceiling, halted (`M12-53`, `M12-06`, `M12-30`, `M12-39`) | status · data | the strip's ONE title line: the fact with its count or its date |
| What paused, and what still works until when (`M12-31`, `M12-39`) | data | at most three short rows under the title — `Paused`, `Still works`, and `Until` with the date in a row of its own, because the deadline is the fact the person acts on. `Paused` and `Still works` are lists, so each gets the full width with its icon and its word leading the line — never a narrow value column beside a label; `Until` is short, so it is one label–value line. At `halted` the always-works set is a four-item list, because it is four items. Never a paragraph, never "account limited" |
| What resolves it (`M12-31`, `M12-21`) | action | the strip's ONE act; its label IS what resolves it. The day-6 act names the payment method it will charge, by the gateway's name — `UPI AutoPay` — never a bank or last digits (`M12-10`; owner ruling 2026-10-29) |
| The automatic retry, while nothing has paused (`M12-39`) | data | that a retry is coming rides the title line; it is not a sentence of reassurance, and no retry date is invented |
| The trial countdown before D-7 (`M12-53`) | status | a chip and no act — a fact, no pressure. A count of days carries no tier (`F8-01`) |
| A blocked act (`M12-21`) | data · action | the denial is a sheet at 375 and a centred modal at 1536: its title names what was blocked; two short lists, `Paused` and `Still works`; ONE primary act — reactivate, pick a plan, or upgrade |
| The amount (Owner only) | data | in the act's label, or one label–value row. For every other employee the strip renders without it. The strip's billing read must carry the amount due, its invoice number and the payment method's name for the Owner (owner ruling 2026-10-29) — `T-SHELL-006`'s read is extended when that task starts |
| A person who is not the Owner | status | the state and its rows stay; the act's place is taken by ONE line naming whose act it is |
| The amount's working (`F8-07`) | more detail | no tier label on this screen (owner ruling 2026-10-29); where an amount shows, the `Derivation` disclosure `How it is worked out` opens its origins — which charge and which invoice |
| The billing state could not be read | error | one line and `Try again`. No figure at all — not the last known day, not the amount |
| No billing condition | — | nothing is rendered: no strip, no chip, no teaching |

## Arrangement

- **375.** The strip sits between the top bar and the scrolling content, pinned: the title line, its
  rows, then the act on its own line. One banner at a time — the broadest true fact speaks.
- **1536.** The same strip in the content column: title and rows on the left, the act in the strip's
  action row on the right; the four-item list runs in one wrapping row.
- The strip and the denials are Expressive at both widths (`F7-17`).

## Sample data — the PRD's own rows, drawn and never invented

The first drawing of this screen invented a 30-day trial and a meter called "AI designs" at 40 of 50,
because this brief carried neither fact. The trial's length, every meter's name and every bundle size
on this screen are these rows' values; a frame that shows another is wrong. Counts used, dates and the
invoice are yours to choose. **The capped meter is proposals a month — Growth 300** (`BM-41`, `M12-23`): AI
detections are a bundle that runs on at ₹10 each, never a cap, so no cap strip names them.

- **M12-52** (P0) — **The trial is modelled in-app only; the gateway subscription is created at conversion.** 14 days, every tier capability, within the trial caps (book data — `BM-41`); no card or mandate to start; one 7-day extension available to support (an audited override, M12-19's family).
- **BM-41** (P0) — **The India book — the source-derived first instance (IN book; every number below is IN-market data, not the generic model).** Identified by `F1-60`/`F1-61`; canonical here. **Tier prices (INR, ex-GST):** Starter **₹1,999/mo · ₹19,990/yr** — Growth **₹3,999/mo · ₹39,990/yr** — Pro **₹9,999/mo · ₹99,999/yr** — Enterprise **custom, anchored ₹24,999+/mo**, annual contract (owner-set anchors ~₹2k/~₹4k/~₹10k). **Capacity + counts:** single-design ceiling 50 kW / 500 kW / 5 MW / 100 MW (utility: blocks/zones, trackers, terrain); proposals 30 / 300 / 1,500 / unlimited per month; active projects 10 / unlimited / unlimited / unlimited; users unlimited on all four. **Bundles + overage:** no AI-detection bundle or rate (BM-19, owner ruling 2026-10-31); voice minutes PAYG ₹6/min on Starter and Growth, 400 min/mo bundled then ₹6/min on Pro, custom bundles + BYO number on Enterprise; storage 10 / 50 / 250 GB / custom. **Trial caps:** 15 voice minutes · 5 GB; **proposals are not capped in the trial** (owner ruling 2026-10-08 — a proposal costs the platform little and is the trial's moment of value). **Service terms are pricing-page copy, not book data (owner ruling 2026-09-07):** the IN positioning — support in-app / in-app + WhatsApp / priority + onboarding call / named contact — is rendered by the pricing page as Tier-keyed screen copy per BM-14; the book carries none of it and no entitlement, invoice or gate reads it, and a second market whose terms differ carries them as pack labels (`F1-22`), never in a locale-keyed catalog. Enterprise adds the BM-15 commercial arrangements. **Benchmarks (recorded per BM-39):** Reslink India INR page (owner-supplied, authoritative — Basic ₹60,000/yr at 50 kW · Pro ₹85,000/yr at 500 kW, 1,000 proposals · Premium ₹1,20,000/yr at 5 MW · Enterprise custom) and ARKA per-org pricing; priced under both at every rung — Starter-yearly 67% under Basic, Growth-yearly 53% under Pro, Pro-yearly 17% under Premium with a voice bundle no competitor has, and Pro's 1,500 proposals/mo beat the benchmark's 1,000. **Collection routes:** per the IN mandate ladder, F1-40 (monthly self-serve under the per-debit cap rides UPI AutoPay; Enterprise e-NACH/invoice; every yearly total exceeds the cap and is a single payment link/invoice per year). **V2 add-on prices (owner ruling 2026-08-04 — base tiers confirmed unchanged; every add-on number below is DRAFT pending rate-card verification per BM-17/BM-26):** tracked seat **≈₹99/seat/mo** beyond the tier's included allowance; **included tracked seats: Starter 0 · Growth 3 · Pro 10 · Enterprise custom**; marketing-send bundles **Starter 500 · Growth 2,000 · Pro 10,000 sends/mo**, overage **≈ WhatsApp ₹1.5 · SMS ₹0.35 · email ₹0.10 per send**. A draft add-on rate is not sellable until the owner verifies the channel/seat rate cards against worst-case unit COGS (the ≥40% floor, BM-17) — verification is the revisit trigger.

**The person's words (context file §2), on this screen.** A cap's act is `Upgrade plan`. The day a trial ended is a
recorded date, so it carries no mark.

## Entry & exit

Reached from: not navigated to — the state banner and countdown chip render in the app shell whenever the tenant is in a trial countdown, a post-expiry soft block, `past_due` grace, cap-ladder or halted state (M12-53, M12-06, M12-30, M12-39); a denial sheet fires when any UI mutation is blocked by the billing-state matrix (M12-21). Leads to: the "Reactivate" (or upgrade) path (M12-21); the day-6 one-tap pay link (M12-39); the plan-pick screen at trial expiry (M12-53 — SCR-M12-03); the usage screen carries the cap ladder's own surface (M12-30 — SCR-M12-04). Decisions 3, 3a and 6 settle every other route.

**Decisions made in design (2026-09-20) — later screens inherit them.**

1. **The slot.** One pinned slot between the top bar and the scrolling content, one banner at a time (`BannerStack mode="single"`). It never scrolls away and is never dismissed: `BM-32` makes the strip the guaranteed way back.
2. **The strip's form.** One title line; rows of ONE family — a mark, the row's word leading the line, then its values — `Paused`, `Still works`, and a dated row (`Until`, `Account halts`, `Cycle resets`, `New proposals pause`) — the dated row and an amount row take a neutral mark, only the two pause rows a semantic one; then, where an amount shows, the `Derivation` disclosure; then the act. The act sits on its own line at 375 and in the banner's action row at 1536, where the strip caps at 1080.
3. **Where the act goes.** Every dunning, trial and halted act, and both denials' act, route to `SCR-M12-03` and return to the surface they were pressed from; the day-6 act is that route with the payment method already chosen. At 80% of a cap the shell draws no strip: the pre-warning is the usage screen's (`SCR-M12-04`, `M12-34`; `T-SHELL-006`). At 100% and after the grace the act is `Upgrade plan`.
3a. **On Billing Home (`SCR-M12-02`) the strip has no act and no amount row** (owner ruling 2026-10-29): that screen's `Needs you`, directly under the strip, carries both.
4. **A person who is not the Owner.** `ScopeNote` takes the act's place, its holder in the design system's form — `Mahesh Bhosale (owner)` — and no amount is rendered.
5. **The default frame is `past_due`, day 4 of 7** — the one ordinary rung where something has paused while core selling still works.
6. **The strip carries no ask and no second route.** How the grace works lives on `SCR-M12-02`, how caps reset on `SCR-M12-04`; the ledger, invoice and plan are reached through the act and More → Billing. Each region's focal point is the act, its headline the title line.
7. **Act labels by rung:** days 0–3 `Update your payment method`, with the amount as an `Amount due` row · day 4 `Pay {amount} now` · day 6 `Pay {amount} with UPI AutoPay` · halted `Reactivate with one payment of {amount}` · trial D-7 and expired `Pick a plan` · error `Try again`. The amount inside a label is mono.
8. **Dated rows:** days 0–3 `Voice, AI detections and invites pause · {day-4 date}`; a cap in grace `New proposals pause`; a cap after grace `Cycle resets`. No `Paused` row at halted or expired names engineer sign-off or photos already taken (`M12-24`, `M12-26`).
9. **The cap rows.** In grace: `Still works` — new proposals, editing, duplicating and sharing existing proposals, reading, export. After grace: `Paused` — new proposals; `Still works` — editing, duplicating and sharing existing proposals, reading, export, every other feature.
10. **The denials.** Trial expired: overline `Trial ended`, title `Creating a lead is paused`. Past due: overline `Payment overdue`, title `Inviting a teammate is paused`. The blocked control is never disabled beforehand, and the denial's lists are the strip's own two.
11. *(No forfeiture sentence exists: no company keeps a launch price — `BM-42`, owner ruling 2026-10-31.)*
12. **Loading never holds the app**; the surface behind renders as normal. At 1536 the strip never rides in `AppHeader`, which holds one line.
13. **The `Derivation` has two parts:** `Grace day` (counted from the failed charge) and `Amount` (the Growth month — with its 18% GST once the platform is GST-registered — on invoice `2026-27/000902` in mono).
14. **The no-amounts sample reader is Sneha Patil, Sales Manager** — the only non-Owner role the dunning strip reaches (`M12-40`).
15. **Motion.** When the state changes, the strip swaps in its slot with no push on the content below; it never slides away, because it is never dismissed; a denial rises as a sheet at 375 and appears as a centred modal at 1536; the countdown chip does not move (`F7-51`: every motion is the design system's; nothing waits on it, and a figure never animates).

**Decision made in the redesign.** The failed charge is the Growth month — invoice `2026-27/000902`,
**₹3,999.00** (₹3,999 + 18% GST = ₹4,718.82 once the platform is GST-registered, `F1-29`) — the same figure `SCR-M12-02` prints with its working. One story, one
figure across every billing screen.

## Design system gaps

Owner ruling 2026-10-29: a board draws the nearest real component, never a look-alike, and the screen's build adds the missing part to `packages/ui`. *Canvas behind the repo* means the repo already has the part and only the canvas copy lacks it.

- `ShellGlyph` `pause`, `tick`, `clock`, `rupee` — canvas behind the repo; `ShellGlyph` has no `warning` tone for the `Paused` mark.
- `LoadingBars` has no size the strip fits; the board draws `panel`.
- No token holds the strip's 1080px cap at 1536.
- No mono figure inside a `BannerAction` or `Button` label, a `FactRow` value or `Derivation` text (`F7-09`).

## Requirements (verbatim)

### docs/prd/modules/M12-platform-billing.md

- **M12-06** (P0) — **`past_due` carries a 7-day grace in two phases:** days 0–3 full function plus the banner; days 4–7 only the features that cost per-use money pause (voice, AI detections, invites). **Core selling continues through the whole grace window** — leads, surveys, designs, proposals, projects all work to day 7. _(non-UI half, build-side: two-phase 7-day grace timer; only metered features pause day 4 — for awareness, not for drawing)_
- **M12-21** (P0) — **Every UI mutation is gated by the billing-state matrix; denial is typed and honest.** A blocked mutation returns a typed entitlement-blocked error; the UI renders the state banner and a "Reactivate" (or upgrade) path. This module implements `BM-35`'s matrix as the gate on every mutation and **may add enforcement detail but may never move a ✓ to a block** — the matrix is 04's law. _(non-UI half, build-side: BM-35 matrix gates every mutation; typed entitlement-blocked error — for awareness, not for drawing)_
- **M12-30** (P0) — **Cap enforcement mechanics:** the usage screen warns at **80%** of any capped count or ceiling (M12-34 — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records and exporting never pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window — no proration, no weighting. _(non-UI half, build-side: 80%/100%/7-day-grace cap ladder; counts reset on billing anchor, no proration — for awareness, not for drawing)_
- **M12-31** (P0) — **Every pause message states exactly what paused and what still works.** From `past_due` day 4's metered pause to a cap's post-grace pause, the copy is specific (which features, until when, what resolves it) — never a generic "account limited".
- **M12-39** (P0) — **The dunning ladder runs from the first failed charge, one rung per fact:** day 0 → `past_due`, banner + push + message ("payment failed, we'll retry — update your method here") · day 2 reminder · day 4 → metered features pause, and the message states **exactly what paused and what still works** · day 6 final warning with a one-tap pay link · day 7 → `halted`, and the message **confirms read + export + customer links + the billing screens (pay/upgrade/reactivate) still work** *(Final review: "billing screens" restored — `BM-32`'s always-works list is four items)* · post-halt weekly × 4, then monthly, indefinitely — reactivation always one payment away. *(Owner ruling 2026-10-31: no launch-price guarantee exists — BM-42 — so no rung discloses a forfeiture.)* _(non-UI half, build-side: day 0/2/4/6/7 rung timers, post-halt weekly then monthly — for awareness, not for drawing)_
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
- **cap-80-warning** — not drawn in the shell: at 80% the shell shows no strip, because the pre-warning is the usage screen's (`SCR-M12-04`; M12-30, M12-34; `T-SHELL-006` DONE WHEN). The first notice is never the block.
- **cap-100-grace** — the 100% banner with the 7-day grace running (M12-30)
- **cap-post-grace-paused** — new creations of that type paused until upgrade or the next cycle; reading, editing existing records and exporting never pause (M12-30, M12-31)
- **typed-denial-with-reactivate-route** — the typed entitlement-blocked denial rendering the state banner and a "Reactivate" (or upgrade) path (M12-21)
- **no-amounts-for-employees** — state banners render for all employees; billing acts render only for the Owner (M12 §M12.2 permissions)

`loading` is a skeleton in the slot's own footprint with no tone, no glyph and no numeral — a strip that guessed a warning would alarm a tenant whose account is fine. `error` is neutral, never danger.

Drawn at 375 only (at 1536 the phone's answer holds at width): `loading`, `empty`, `error`, `trial-countdown-d7-prominent`, `trial-expired-soft-block` (its denial is `typed-denial-with-reactivate-route`'s centred modal), `past-due-day0-3-banner`, `day6-final-warning-one-tap-pay`, `cap-100-grace`, `cap-post-grace-paused`.

## Redesign owed

- `s-protected` draws a protected tenant's day-4 strip with the forfeiture disclosure, but no company keeps a launch price (`BM-42`, `M12-39`, owner ruling 2026-10-31): the board's next redraw drops that frame, and no strip carries a disclosure line.
- The failed charge's `Amount` is drawn as ₹4,718.82 on invoice `HG-INV-2026-0902`, but the platform collects no GST until it registers (`F1-29`, owner ruling 2026-10-30) and issues numbers as `<fiscal year>/<sequence>` (`T-M12-012a`): the board's next redraw follows `SCR-M12-02` — ₹3,999.00 on invoice `2026-27/000902`.

## Data volume

One banner at a time: gates compose with one rule — the broadest true fact speaks (state before cap, cap before bundle), so a user never gets two banners for one act (M12 §M12.4 behavior detail). The ladder is five rungs plus post-halt weekly × 4 then monthly (M12-39); the cap ladder is 80% → 100% → 7-day grace → pause (M12-30). Design the denial sheet's "what still works" list at the always-works set's real length — four items at `halted` (M12-39).

## Numbers and their source

No figure on these screens carries a provenance tier label (owner ruling 2026-10-29, for billing only). Billing screens use plain "actual usage" language — the word "measured" never appears (owner ruling carried in M12-34).

- The amount due (₹3,999.00, the Growth month; with its GST once the platform is GST-registered) shows its working in `How it is worked out`, naming the charge and the invoice. Owner only (M12 §M12.2 permissions); no amount renders for any other employee.

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state rendering the banner from cached entitlement state, and a Context-of-use clause about a field user's already-captured queue draining regardless of billing state. Both are deleted; the billing-state guarantees themselves are `modules/M12`'s and are untouched.*
