# SCR-M12-03 · Plan Selection & Conversion

Pick tier and cycle; upgrade, downgrade with preview, cycle switch; handoff to hosted checkout.

**Module:** M12 · Platform billing · **Personas:** EPC Owner — every billing act rides `F2.M12.manage-billing`; only the Owner converts, upgrades, downgrades or switches cycle (`docs/prd/modules/M12-platform-billing.md` §2) · **Context of use:** web emphasis for plan work, fully mobile for the trial-expiry and one-tap-pay moments (`docs/prd/modules/M12-platform-billing.md` §2). The trial-expiry entry happens under time pressure; the downgrade path is a considered desk task reading a usage-derived preview.

**One job:** pick the plan that fits, and know exactly what changes when it starts.
**Order of attention:** 1 what I am on now · 2 what each plan costs and caps · 3 what happens at the switch — when it starts, what is charged today, what is kept.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2.

| Fact | Kind | Its form here |
|---|---|---|
| What I am on — plan, cycle, price, next bill and its date | data · status | label–value rows in a `Your plan` region; the subscription state is its chip |
| What I am on, during a trial or after a lapse | data · status | the same region: the state chip, and the trial's end date or the day the plan lapsed in place of price and next bill — never an empty price row |
| Each plan — name, price for the chosen cycle, its three limits that differ most | data · status | one card per plan; a chip says `Your plan`, `Upgrade` or `Downgrade` |
| Enterprise is sales-assisted, never a checkout (`M12-55` context) | action | a row with `Talk to sales` |
| Billing cycle | action | a two-way selector; the yearly price is the book's own row, and no saving is computed or claimed |
| What changes between my plan and the chosen one | data | a from–to list in the review sheet; limits that do not change share one line |
| What I pay today and from the boundary (`M12-48`) | data | label–value rows with the tax line and a total; one tier mark on the group; the prorated amount's working is its `Derivation` disclosure |
| Entitlements apply at once (`M12-48`) | action line | ONE line at the button — never a paragraph about the boundary |
| Downgrade — exactly what will be blocked (`M12-49`) | data | the screen's one tinted block, first in the review sheet: a row per blocked thing — its count, what stays readable and exportable, and a route to the list |
| Downgrade — nothing is over the lower plan's limits (`M12-49`) | data | the same block's place holds ONE row that says so; the preview ran and found nothing, and a missing block would not say that |
| Downgrade starts at the next cycle, no mid-cycle refund (`M12-49`) | data | a `From <date>` row and a `This cycle · No refund` row |
| Payment is collected on the gateway's page, at that moment (`M12-54`) | action line · help | one line under the button; the rest waits behind the ask |
| Trial days do not extend the paid cycle (`M12-54`) | data | a `Paid cycle starts` row in the review sheet, on the trial-expiry entry only |
| Read and export keep working (`M12-53`, `BM-32`) | help — but data in a dead state | behind the ask for an active tenant; ON the screen, as one line, in `trial-expiry-entry` and after a lapse, where nothing is behind anything |
| After a lapse the prices are the current book's | data | the plans region's caption names the price list the prices come from |
| The preview changed since it was opened (`M12-49`) | status · data | one banner naming what changed; the changed rows are marked |
| A person who is not the Owner opens this screen (`M12-56` context) | status | the state chip and ONE line that names whose act it is; no price, no amount and no act is drawn — the same answer `SCR-M12-02` gives |
| Checkout failed, nothing half-converted | error | one banner — what failed and what to do; the unchanged `Your plan` region is what shows that nothing moved |

## Arrangement

- **375.** Regions in the order of attention: `Your plan` · the cycle selector · the plans as cards,
  where the chosen card carries the region's one primary button · the Enterprise row · a
  `Compare all plans` row. **The review is a sheet (`F7-21`) and it is the consent surface
  (`M12-49`):** what changes, then what you pay, then one button. **Comparing at 375 is the
  person's own plan against ONE other plan** chosen by a selector, with a second selector for
  limits, monthly bundles and overage rates — never a four-plan matrix behind a pager.
- **1536.** The cycle selector sits directly above the plans it re-prices. The four plans side by
  side as siblings — one height, one inner structure; Enterprise keeps the same frame with `Talk to
  sales` as its act. The full four-plan matrix is ONE region with the same three-way selector — not
  three tables stacked down the page. The review is `F7-21`'s side panel: it opens on the act, as
  the sheet does at 375 — never parked open and empty.

## Sample data — the book's rows, drawn and never invented

The plan names, the trial's length, the tax rate and every price, limit and bundle on this screen
are these rows' values. A frame that shows a plan name or a figure these rows do not carry is wrong.

- **BM-11** (P0) — **Four tiers, fixed names: Starter · Growth · Pro · Enterprise.** The names are market-neutral structure and suite-wide vocabulary — every market's price book prices these same four tiers in its own currency (F1-25), every entitlement is keyed to them (M12), every report that segments by plan uses them (M13).
- **BM-41** (P0) — **The India book — the source-derived first instance (IN book; every number below is IN-market data, not the generic model).** Identified by `F1-60`/`F1-61`; canonical here. **Tier prices (INR, ex-GST):** Starter **₹1,999/mo · ₹19,990/yr** — Growth **₹3,999/mo · ₹39,990/yr** — Pro **₹9,999/mo · ₹99,999/yr** — Enterprise **custom, anchored ₹24,999+/mo**, annual contract (owner-set anchors ~₹2k/~₹4k/~₹10k). **Capacity + counts:** single-design ceiling 50 kW / 500 kW / 5 MW / 100 MW (utility: blocks/zones, trackers, terrain); proposals 30 / 300 / 1,500 / unlimited per month; active projects 10 / unlimited / unlimited / unlimited; users unlimited on all four. **Bundles + overage:** AI detections 30 / 100 / 400 / custom per month, then ₹10 each; voice minutes PAYG ₹6/min on Starter and Growth, 400 min/mo bundled then ₹6/min on Pro, custom bundles + BYO number on Enterprise; storage 10 / 50 / 250 GB / custom.
- **M12-52** (P0) — **The trial is modelled in-app only; the gateway subscription is created at conversion.** 14 days, every tier capability, within the trial caps (book data — `BM-41`); no card or mandate to start; one 7-day extension available to support (an audited override, M12-19's family).
- **F1-28** (P0) — The IN tax scheme is **GST**, strategy `per_line_rate`; the tenant tax-registration type is `IN_GST`. All platform prices are **ex-GST**; platform SaaS subscriptions and overage add-ons carry **SAC 998434 (cloud/SaaS) at 18% GST**.

**A price list value's trust label.** Its tier word is `Published` — the PRD's own word for a price list's values (`M12-55`, `M12-35`) — and its source label is the list's name and date. The date is sample content, because a price list is versioned data (`F1-25`): draw `India price list · 1 Apr 2026`.

## Entry & exit

Reached from: trial expiry — "expiry leads to a plan-pick screen" (M12-53); the trial countdown chip (chip surface is SCR-SHELL-06, shared row M12-53); Billing Home's plan-selection surface (M12-55, SCR-M12-02); soft-block prompts — post-expiry create/edit paths are "blocked with a plan prompt" (M12-53); a return after a lapse — in `halted`/`expired`/`cancelled` the billing screens "are the guaranteed way back" and plan selection is one of them (M12-55). Leads to: the gateway's hosted checkout — "pick tier and cycle → hosted checkout → mandate per the pack's rails → `active` immediately" (M12-54); on downgrade, confirming schedules the change at the cycle boundary and returns to Billing Home's scheduled-downgrade state (M12-49; §M12.8 behavior detail); on checkout failure, "conversion fails honestly (`F8-36`); the trial state is unchanged; nothing half-converts" (§M12.2 edge case) — the tenant lands back here.

**Inherited from `SCR-SHELL-06` (designed) — reuse, never redraw.**

- **The billing strip.** Where a frame shows the billing strip or a denial sheet, it is `SCR-SHELL-06`'s, reused exactly as that file draws it (context file, *REUSED, never redrawn*). This screen designs no second banner.
- **Arriving from the strip.** The strip's act and both denials' act lead here, and the person returns to the surface they pressed it from once the act is done.
- **`non-owner-read-only`.** `ScopeNote` takes the act's place, its holder in the design system's form — `Mahesh Bhosale (owner)` — and no amount renders.
- **One sample story across the billing screens.** Suryodaya Solar · Growth plan · Owner Mahesh Bhosale · today 15 Sept 2026 · the charge that failed on 11 Sept 2026 · invoice `HG-INV-2026-0891`, ₹24,600.

## Requirements (verbatim)

### docs/prd/modules/M12-platform-billing.md

- **M12-48** (P0) — **Upgrade: entitlements apply immediately — a paying customer never waits.** The prorated delta for the remaining cycle bills as a one-time invoice; the plan swaps at the next cycle boundary. Cycle switches follow the same mechanics (M12-12). _(non-UI half, build-side: immediate entitlements; prorated delta one-time invoice; swap at boundary — for awareness, not for drawing)_
- **M12-49** (P0) — **Downgrade takes effect at the next cycle, with an honest preview — no mid-cycle refund.** If current usage exceeds the lower tier's ceilings, the downgrade screen shows **exactly what will be blocked before confirming**; existing over-ceiling designs remain readable and exportable forever. _(non-UI half, build-side: preview computed from real usage; recomputes at confirm and boundary — for awareness, not for drawing)_
- **M12-53** (P0) — **Trial UX: honest countdown, soft expiry, no hostage patterns.** A countdown chip stays subtle until D-7; expiry leads to a plan-pick screen; post-expiry is the soft-block set — create/edit paths blocked with a plan prompt, read + export always working. Expiry must convert, never destroy. _(non-UI half, build-side: soft expiry law: convert never destroy; read+export always work — for awareness, not for drawing)_
  _Shared row: the countdown chip and soft-block prompt half lands on SCR-SHELL-06; this screen is the plan-pick destination._
- **M12-54** (P0) — **Conversion is: pick tier and cycle → hosted checkout → mandate per the pack's rails → `active` immediately.** Payment collects at that moment and never before; the trial's remaining days do not extend the first paid period (the paid cycle starts at conversion). _(non-UI half, build-side: hosted checkout handoff; payment at conversion; paid cycle starts then — for awareness, not for drawing)_
- **M12-55** (P0) — **The billing screens are real, complete, and available in every state:** current plan and cycle with the book's published caps/bundles; plan selection; mandate/payment-method setup and update; invoice list with PDFs; the usage screen (§M12.5); dunning state and history; cancel; reactivate. In `halted`/`expired`/`cancelled` these screens are the guaranteed way back (`BM-32`'s fourth always-on row, enforced here).
  _Shared row: the billing-home half lands on SCR-M12-02; this screen carries the plan-selection surface._

Preview mechanics (`docs/prd/modules/M12-platform-billing.md` §M12.8 behavior detail): "The downgrade preview is computed from real usage against the target tier's book values: which designs exceed the kW ceiling (they stay readable/exportable — never hostage), where the proposal count stands against the smaller cap, which bundles shrink. The preview is the consent surface; confirming schedules the change at the boundary."

## States

- **loading** — book values / usage-derived preview not yet computed.
- **empty** — no state where plan choices are absent (plan selection is available in every billing state, M12-55); if a market book has no sellable value for a slot it cannot be sold (M12 §M12.5 edge case; `BM-41`'s slots) — behavior beyond that is not pinned by PRD — designer decides, note the decision.
- **error** — preview computation or book load failed; honest failure, no confirm without a preview (the preview is the consent surface, M12-49).
- **trial-expiry-entry** — arrived from expiry: the plan-pick moment; read + export still work behind it; expiry must convert, never destroy (M12-53).
- **post-lapse-reprice-at-current-book** — arrived after a lapse, the guaranteed way back from `halted`/`expired`/`cancelled` (M12-55): for a tenant who was inside a protection horizon, the lapse has ended the price protection, so the prices on this screen are the **current list book's rows**, never the signed-up rows (M12-57 mechanics; the forfeiture disclosure their dunning copy already carried from day 0, M12-39 — SCR-SHELL-06). The screen names the current book's price as the price; nothing here implies the old price survives the lapse, and no win-back framing on this surface may suggest otherwise (M12-41 context). For an unprotected tenant this is the ordinary plan pick and no repricing statement applies.
- **upgrade-prorated-preview** — upgrade path: entitlements immediate, prorated delta for the remaining cycle billed as a one-time invoice, plan swaps at the boundary; cycle switches follow the same mechanics (M12-48).
- **downgrade-blocked-preview** — usage exceeds the target tier's ceilings: the screen shows exactly what will be blocked before confirming; over-ceiling designs remain readable and exportable forever (M12-49).
- **preview-recomputed-changed** — "the preview re-computes at confirmation time and again at the boundary; the tenant is told if the picture changed" (§M12.8 edge case, M12-49's honesty).
- **checkout-handoff** — handing to the gateway's hosted flow; the platform's screens collect nothing sensitive (M12-54; M12-10 context); payment collects at that moment and never before.
- **non-owner-read-only** — a person who is not the Owner arrives, from the expiry route or from Billing Home: the state is visible, the acts are not, no price or amount renders, and the screen says whose act it is (M12-56 context; the same rule SCR-M12-02 carries).
- **checkout-failed-honest** — gateway failure at conversion: fails honestly, trial state unchanged, nothing half-converts (§M12.2 edge case; `F8-36` context).

## Data volume

Design at the full four-tier, two-cycle choice (the book's published caps/bundles per tier — BM-41 context: ~a dozen values per tier), plus a downgrade preview built from real usage: multiple designs over the target kW ceiling listed as staying readable/exportable, a proposal count standing against caps of 30/300/1,500 per month, and every bundle that shrinks (detections, voice, storage, seats, sends). The blocked-list must stay honest and legible when several items block at once.

## Numbers carrying provenance

Each user-visible number/money/date carries its F8 provenance tier in the design; billing screens use plain "actual usage" language per the owner ruling carried in M12-34 ("measured" never appears).

- Tier prices per cycle (book data, pointed at, never restated — BM-09 context).
- For a tenant returning after a lapse, which book those prices come from: reactivation bills against the current list book's rows, never the signed-up rows, and the screen is explicit about it rather than letting the protected price be assumed (M12-57, M12-39's forfeiture disclosure).
- The prorated delta amount for the remaining cycle and its one-time invoice (M12-48).
- The next cycle boundary date (upgrade swap; downgrade effective date) (M12-48, M12-49).
- Downgrade preview figures: current usage vs the target tier's ceilings and caps — kW per design, proposal count vs cap, bundle sizes before/after (M12-49; §M12.8 behavior detail).
- Trial days remaining at the conversion moment; the paid cycle starts at conversion — remaining trial days do not extend it (M12-54).
