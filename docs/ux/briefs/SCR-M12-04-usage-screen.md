# SCR-M12-04 · Usage

Per-period rollups against bundles with plain overage pricing and ledger deep links.

**Module:** M12 · Platform billing · **Personas:** EPC Owner — the usage screen is owner-scoped and informational (M12-36); Finance is listed on the screens register for this screen, but note the PRD's boundary: Finance's money scope is the tenant's customers' money (M11), never the platform bill (`docs/prd/modules/M12-platform-billing.md` §2), and Finance-persona visibility of invoices and usage follows F2's matrices — `docs/prd/04-business-model.md` §2 adds no grants · **Context of use:** web emphasis with full mobile parity per the suite's lockstep law (`docs/prd/04-business-model.md` §2); the owner checks it when a warning fires — often on a phone, mid-day, deciding whether to upgrade.

**One job:** see what this cycle has used against what the plan includes, and know whether anything is about to cost money or pause.
**Order of attention:** 1 what needs me — a meter at 80%, at its cap or paused, and what happens next and when · 2 every meter and cap against its bundle for this cycle · 3 the detail behind a number, and the way to a bigger plan.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **"No scary
meters" (`M12-36`) is a rule about form:** a meter near its cap keeps the quiet treatment every
other meter has, and its chip carries the state — never a red wall, never an alarm banner per meter.

| Fact | Kind | Its form here |
|---|---|---|
| The cycle every count covers, and the day it resets (`M12-34`, `BM-34`) | data | ONE line under the title — the cycle's two dates and the reset date. It is the period label for every counted figure, stated once; the storage gauge differs, so it carries its own `as of` time |
| What needs me — each meter at 80%, at its cap in grace, or paused (`BM-34`, `M12-30`, `M12-34`) | status · data | the first region, drawn only when a meter qualifies: a row per meter — name, chip (`80% used` · `At the cap` · `Paused`), used of included, and ONE line saying what happens next and when: the grace's last day, what pauses, the reset date |
| What still works when a meter pauses (`BM-34`) | data | the same ONE line, on the paused meter's row: what paused, until when, and what still works — reading, editing and export never pause; on a trial, the manual alternative |
| Every capped count and ceiling (`BM-07`, `BM-34`) | data | a `Limits` region, one row per cap: name, used of allowed, a quiet meter. A ceiling that is not a count — the single-design size — is a row of the SAME form with no meter: label left, figure right |
| Every bundle and meter (`BM-27`, `M12-34`, `M12-36`) | data | an `Included each month` region, one row per meter: name, used of included, a quiet meter. A pay-as-you-go meter shows its count and its rate, with no bar to fill |
| A meter that is tracked and never billed | data · status | its count, and a `Not billed` chip |
| Overage as it accrues (`M12-35`, `BM-27`) | data | on the meter's own row, as the meter's ONE note line: the published rate and the amount so far. ONE total row ends the region, and its one line says when it bills |
| Plain overage pricing (`M12-36`) | data | the rate rides on the meter's row; no second rate table on this screen |
| A V2 meter the book has no rate for | data | the meter's row shows its activity; the rate is a named gap — never a zero, never an invented figure |
| Tracked seats and the accruing seat-months | data | two rows of the same form inside the seats meter — label left, figure right |
| Provenance (`M12-34`, `BM-27`, `F8-07`) | honesty label | once per group, at its FOOT, after the figures: `Actual usage` for what was used, and the price list with its date for what is included and for every rate — two short quiet lines at most, in plain words. Never a key above the figures, never a label per column. The word "measured" never appears |
| The ledger behind a number (`M12-36`) | more detail | each meter row opens that meter's ledgered events for the cycle — a sheet at 375, a side panel at 1536 (`F7-21`). No register row owns a ledger screen: if the ledger needs more than a sheet holds, NAME the screen in your notes and stop |
| The way to a bigger plan (`BM-07`) | more detail | a row that leads to `SCR-M12-03`; on a meter that is the signal, the same row sits on that meter |
| A person who is not the Owner opens this screen (`M12-56` context) | status | no usage figure, no amount and no act is drawn: which meter is at its cap or paused, as its chip, and ONE line naming whose screen this is — the same answer `SCR-M12-02` gives |
| Nothing used yet | teaching | every cap and bundle still visible at zero; at most two short sentences |
| The rollup failed | error | one banner — what failed and what to do. No figure is drawn: never a cached, approximate or placeholder number |

## Arrangement

- **375.** The title and its one cycle line · `Needs you`, only when a meter qualifies · `Limits` ·
  `Included each month`, ending in the overage total when any accrues. Every meter is a list row —
  name, used of included, a quiet meter — never a table: used-of-included is ONE value.
- **1536.** The two meter regions become tables with their columns in view — meter · used · included
  · extra usage · rate — side by side where they fit. `Needs you` and the overage total sit in a side
  column, in view while the tables scroll. A meter's ledger opens as a side panel.
- **Inside a card, ONE row form.** Every row reads label left, figure right, on one edge; a meter's bar sits
  under its own row, and a row with no meter looks like the rows that have one. Never a label–value pair
  packed to the left beside meter rows whose figures sit at the right.

## Sample data — the book's rows, drawn and never invented

The trial's length and every cap, bundle size, overage rate and trial cap on this screen are these
rows' values. Usage counts are yours to choose; a plan name, a cap or a rate these rows do not carry
is wrong. A V2 meter has no sellable rate in `BM-41`, which is what the
`v2-meter-activity-no-rate` state draws.

- **BM-41** (P0) — **The India book — the source-derived first instance (IN book; every number below is IN-market data, not the generic model).** Identified by `F1-60`/`F1-61`; canonical here. **Tier prices (INR, ex-GST):** Starter **₹1,999/mo · ₹19,990/yr** — Growth **₹3,999/mo · ₹39,990/yr** — Pro **₹9,999/mo · ₹99,999/yr** — Enterprise **custom, anchored ₹24,999+/mo**, annual contract (owner-set anchors ~₹2k/~₹4k/~₹10k). **Capacity + counts:** single-design ceiling 50 kW / 500 kW / 5 MW / 100 MW (utility: blocks/zones, trackers, terrain); proposals 30 / 300 / 1,500 / unlimited per month; active projects 10 / unlimited / unlimited / unlimited; users unlimited on all four. **Bundles + overage:** AI detections 30 / 100 / 400 / custom per month, then ₹10 each; voice minutes PAYG ₹6/min on Starter and Growth, 400 min/mo bundled then ₹6/min on Pro, custom bundles + BYO number on Enterprise; storage 10 / 50 / 250 GB / custom. **Trial caps:** 25 detections · 15 voice minutes · 5 GB.
- **M12-52** (P0) — **The trial is modelled in-app only; the gateway subscription is created at conversion.** 14 days, every tier capability, within the trial caps (book data — `BM-41`); no card or mandate to start; one 7-day extension available to support (an audited override, M12-19's family).

**A price list value's trust label.** Its tier word is `Published` — the PRD's own word for a price list's values (`M12-55`, `M12-35`) — and its source label is the list's name and date. The date is sample content, because a price list is versioned data (`F1-25`): draw `India price list · 1 Apr 2026`.

## Entry & exit

Reached from: Billing Home's deep link — "what am I using (deep link to the usage screen)" (`docs/prd/modules/M12-platform-billing.md` §M12.10 behavior detail, SCR-M12-02); the 80% pre-warning and cap banners reference this screen — no gate may fire without the pre-warning having been available here (M12-34; banner surface is SCR-SHELL-06, shared row M12-30). Leads to: ledger detail via deep links (M12-36); the upgrade path when a cap is the signal — "new creations of that type pause until upgrade" (M12-30) and "outgrowing a cap IS the upgrade signal" (BM-07) — the upgrade path leads to SCR-M12-03, the corridor's one plan-selection surface (M12-55 context); decided here, so the billing screens have one way to a bigger plan and not two.

**Inherited from `SCR-SHELL-06` (designed) — reuse, never redraw.**

- **The billing strip.** Where a frame shows the billing strip or a denial sheet, it is `SCR-SHELL-06`'s, reused exactly as that file draws it (context file, *REUSED, never redrawn*). This screen designs no second banner.
- **Arriving from the strip.** The 80% cap strip's act is `See usage` and leads here; at 100% and after the grace the strip's act is `Upgrade plan` and leads to `SCR-M12-03`. The strip's cap frames read `AI detections · 80 of 100` and `100 of 100` on the Growth plan — keep those figures, so the two screens agree.
- **`non-owner-read-only`.** `ScopeNote` takes the act's place, its holder in the design system's form — `Mahesh Bhosale (owner)` — and no amount renders.
- **One sample story across the billing screens.** Suryodaya Solar · Growth plan · Owner Mahesh Bhosale · today 15 Sept 2026 · the charge that failed on 11 Sept 2026 · invoice `HG-INV-2026-0891`, ₹24,600.

**Inherited from `SCR-M12-03` (designed) — reuse, never redraw.**

- **The person's words for the price list's:** `Included` for a bundle, `Extra charges` for overage, `Biggest design` for the ceiling. A one-of-N choice is a chip strip, directly above what it changes.
- **The way to a bigger plan is `SCR-M12-03`**, and only that. Honesty label for a price list value: `Published · India price list · 1 Apr 2026`; a usage count keeps `Actual usage`.

**Decisions made in design (2026-09-20) — later screens inherit them.**

1. **Two cards, and the meters are rows inside them.** `Limits` and `Included each month`. Every row reads label left, figure right, on ONE edge; a meter's bar sits under its own row, and a row with no meter — `Biggest design · 500 kW`, a sub-fact — looks like the rows that have one.
2. **One status chip always answers the job.** `Within plan` · `Nearing a limit` · `Past what's included` · `On trial` · `At a limit` · `Paused` — beside the cycle line at 375, on the `This cycle` card at 1536.
3. **`Needs you` exists only while a meter qualifies.** A row per meter: its name with its own chip, used of included as the figure, and ONE line saying what happens next and when. It is never parked open and empty.
4. **Extra charges ride the meter's own row** as its one note line — `₹6 a minute · ₹858 so far`, the amount marked `Derived` — and the card ends in `Extra charges` and `Bills on`.
5. **The trust label is two quiet lines at each card's foot**, after the figures: `Actual usage`, then `Limits and rates · India price list · 1 Apr 2026`. The storage gauge carries its own `As of` under its figure.
6. **One named chevron per metered row opens that meter's events** — a sheet at 375, `F7-21`'s side panel at 1536. No ledger screen is invented.
7. **1536 is two lanes.** The tables — meter · used this cycle · included · rate · charges so far — and a standing column: `This cycle`, `Needs you` where it exists, `Extra charges`, `Bigger plans`. A state with no figure to draw is ONE lane.
8. **`Bigger plans` leads to `SCR-M12-03`**, the one way to a bigger plan. A person who is not the Owner sees which meter is paused as its chip, no figure, and `ScopeNote` — `Only Mahesh Bhosale (owner) can see this cycle's usage.`
9. **The language proof is drawn on the creations-paused state**, the longest copy in the set, in Hindi and in Marathi at 375: the same cards, the same rows and the same value edge, nothing clipped. Dates, `₹`, `GB`, `kW`, `OTP`, `WhatsApp`, `SMS`, the plan names and the price list's name stay as they are. **The paused meter is built as the English frame draws it** — the quiet grey bar with its status line under it — in every language: on the two language frames that line is absent and the bar is not grey ONLY because the design system's `UsageMeter` prints English-only words (`docs/tasks/deferred.md`).

## Requirements (verbatim)

### docs/prd/04-business-model.md

- **BM-07** (P0) — **Caps are upgrade signals and abuse bounds, never feature ransoms.** Every cap is visible and generous, published on the pricing page and on the usage screen; outgrowing a cap IS the upgrade signal. Enforcement is soft-block with read + export always working (§04.5). _(non-UI half, build-side: caps are upgrade signals and abuse bounds; soft-block enforcement — for awareness, not for drawing)_
  _Shared row: BM-07's pricing-page half lands on SCR-M12-01._
- **BM-27** (P0) — **Usage transparency is law, not UX polish.** The tenant-visible usage screen shows exactly the rollups the product enforces and bills from — same numbers, no smoothing — labelled with period and provenance, and a bundle's consumption is disclosed **before** any gate fires (the 80% pre-warning). This is `F8-33`'s law; M12 owns the screen and the ledger. Accruing overage is shown in the tenant's currency with the market's grouping as it happens (cited, M12). _(non-UI half, build-side: screen shows exactly the enforced/billed rollups, no smoothing (F8-33) — for awareness, not for drawing)_
- **BM-34** (P0) — **The cap-enforcement law (soft-block at capacity).** For every capped count and ceiling: the usage screen warns at **80%** (`F8-33` — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records, and exporting **never** pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window. _(non-UI half, build-side: 7-day grace after 100%; then new creations pause; resets on billing anchor — for awareness, not for drawing)_

### docs/prd/modules/M12-platform-billing.md

- **M12-30** (P0) — **Cap enforcement mechanics:** the usage screen warns at **80%** of any capped count or ceiling (M12-34 — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records and exporting never pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window — no proration, no weighting. _(non-UI half, build-side: 80%/100%/7-day-grace cap ladder; counts reset on billing anchor, no proration — for awareness, not for drawing)_
  _Shared row: the 100%-banner/denial half lands on SCR-SHELL-06; this screen carries the warning and rollup surfaces._
- **M12-34** (P0) — **The usage screen shows exactly the rollups the product enforces and bills from** — same query, same numbers, no smoothing — each figure labelled with the period it covers and described in **plain "actual usage" language** (owner ruling 2026-08-04: the provenance word "measured" is reserved for engineering/survey data and does not appear on usage or billing screens; `F8-33`'s law, whose screen this is). **The 80% pre-warning is a gate-side obligation:** when any bundle or cap is 80% consumed the screen says so **before** the gate ever fires, and no gate in §M12.4 may fire without that pre-warning having been available on this screen. _(non-UI half, build-side: same query as enforcement and billing; gates need pre-warning first — for awareness, not for drawing)_
- **M12-35** (P0) — **Overage accrues visibly and bills on the next invoice.** Voice minutes and detections beyond bundle bill at the book's published per-unit rates as add-ons on the next subscription invoice; the usage screen shows accruing overage as it happens, in the tenant's currency with its market grouping. _(non-UI half, build-side: overage bills as add-ons at published book rates next invoice — for awareness, not for drawing)_
- **M12-36** (P1) — **The usage screen is owner-scoped and informational** — per-period rollups against bundles with plain overage pricing, deep links to ledger detail, "no scary meters".

## States

- **loading** — rollups not yet resolved; never a placeholder number presented as a rollup.
- **empty** — a fresh tenant with no ledgered usage this period; every published cap still visible (BM-07).
- **error** — rollup query failed; honest failure — this screen may only ever show the enforced/billed numbers, so no fallback or approximate figures (BM-27, M12-34).
- **normal** — per-period rollups against bundles with plain overage pricing and ledger deep links; every cap visible; informational, "no scary meters" (M12-36).
- **eighty-percent-warning / 80-percent-pre-warning** — (both names appear in the slice; one ladder rung) a bundle or cap is 80% consumed and the screen says so before any gate fires — the first notice is never the block (BM-34, M12-30, M12-34, BM-27).
- **overage-accruing** — usage beyond bundle: accruing overage shown as it happens, in the tenant's currency with its market grouping, at the book's published per-unit rates, billing on the next invoice (M12-35, BM-27).
- **v2-meter-activity-no-rate** — "the book has no value for a V2 meter slot → the meter exists but cannot be sold; the usage screen shows activity with no rate rather than inventing one" (`docs/prd/modules/M12-platform-billing.md` §M12.5 edge case).
- **tracked-seats-accruing** — "the usage screen shows current tracked seats and the accruing seat-months beside every other meter" (`docs/prd/modules/M12-platform-billing.md` §M12.5 behavior detail).
- **trialing** — the caps in force are the book's trial caps (BM-41), enforced through the same gates with the same 80% pre-warning; a paused meter states its manual alternative (M12-52 context).
- **non-owner-read-only** — a person who is not the Owner arrives, from a cap banner or from Billing Home: which meter is at its cap or paused stays visible, no usage figure or amount renders, and the screen says whose screen it is (M12-56 context; the same rule SCR-M12-02 carries).
- **cap-reached-grace** — a cap at 100%: banner appeared, the 7-day grace is running; reading, editing existing records and exporting never pause (BM-34, M12-30).
- **creations-paused** — grace elapsed: new creations of that type pause until upgrade or the next cycle; the reset lands on the tenant's own billing anchor (BM-34, M12-30).

## Data volume

Design at the full metered set (M12-33 context): voice minutes, AI detections, OTP (tracked for cost visibility, not billed in v1), storage (nightly gauge), tracked seats + accruing seat-months (V2), and marketing sends per channel (V2) — roughly 6–8 meters, each carrying a period-labelled rollup, its bundle/cap, and any accruing overage line — plus every capped count and ceiling (proposals/month up to 1,500 on Pro, active projects, single-design kW ceiling per the book). Several meters can warn or overflow at once; the screen must stay informational, not alarming, at that density.

## Numbers carrying provenance

Every figure here is the enforced/billed rollup — same query, same numbers, no smoothing (M12-34, BM-27) — and each carries its F8 provenance tier in the design. Wording constraint from the rows: plain "actual usage" language; the provenance word "measured" is reserved for engineering/survey data and does not appear on this screen (M12-34).

- Each meter's period rollup (plain counts over the cycle window, no proration, no weighting — M12-30) and its period label (M12-34).
- Each bundle/cap size (book data) and consumption against it, including the 80% threshold moment (BM-07, BM-34).
- Accruing overage: units beyond bundle, the book's published per-unit rate, and the accrued amount in the tenant's currency with its market grouping (M12-35, BM-27).
- Current tracked seats and accruing tracked-seat-months (§M12.5 behavior detail).
- Grace-window days remaining after a 100% cap event; the reset date on the tenant's billing anchor (BM-34, M12-30).
- V2 meter activity shown with no rate when the book carries no value (§M12.5 edge case).
