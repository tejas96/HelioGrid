# SCR-M12-04 · Usage

Per-period rollups against bundles with plain overage pricing and ledger deep links.

**Module:** M12 · Platform billing · **Personas:** EPC Owner — the usage screen is owner-scoped and informational (M12-36); Finance is listed on the register for this screen, but note the PRD's boundary: Finance's money scope is the tenant's customers' money (M11), never the platform bill (`docs/prd/modules/M12-platform-billing.md` §2), and Finance-persona visibility of invoices and usage follows F2's matrices — `docs/prd/04-business-model.md` §2 adds no grants · **Context of use:** web emphasis with full mobile parity per the suite's lockstep law (`docs/prd/04-business-model.md` §2); the owner checks it when a warning fires — often on a phone, mid-day, deciding whether to upgrade.

## Entry & exit

Reached from: Billing Home's deep link — "what am I using (deep link to the usage screen)" (`docs/prd/modules/M12-platform-billing.md` §M12.10 behavior detail, SCR-M12-02); the 80% pre-warning and cap banners reference this screen — no gate may fire without the pre-warning having been available here (M12-34; banner surface is SCR-SHELL-06, shared row M12-30). Leads to: ledger detail via deep links (M12-36); the upgrade path when a cap is the signal — "new creations of that type pause until upgrade" (M12-30) and "outgrowing a cap IS the upgrade signal" (BM-07) — the PRD requires an upgrade path but does not pin the navigation to SCR-M12-03 — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/04-business-model.md

- **BM-07** (P0) — **Caps are upgrade signals and abuse bounds, never feature ransoms.** Every cap is visible and generous, published on the pricing page and on the usage screen; outgrowing a cap IS the upgrade signal. Enforcement is soft-block with read + export always working (§04.5). _(non-UI half, build-side: caps are upgrade signals and abuse bounds; soft-block enforcement — for awareness, not for drawing)_
  _Shared row: BM-07's pricing-page half lands on SCR-M12-01._
- **BM-27** (P0) — **Usage transparency is law, not UX polish.** The tenant-visible usage screen shows exactly the rollups the product enforces and bills from — same numbers, no smoothing — labelled with period and provenance, and a bundle's consumption is disclosed **before** any gate fires (the 80% pre-warning). This is `F8-33`'s law; M12 owns the screen and the ledger. Accruing overage is shown in the tenant's currency with the market's grouping as it happens (cited, M12). _(non-UI half, build-side: screen shows exactly the enforced/billed rollups, no smoothing (F8-33) — for awareness, not for drawing)_
- **BM-34** (P0) — **The cap-enforcement law (soft-block at capacity).** For every capped count and ceiling: the usage screen warns at **80%** (`F8-33` — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records, and exporting **never** pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window. _(non-UI half, build-side: 7-day grace after 100%; then new creations pause; resets on billing anchor — for awareness, not for drawing)_

### docs/prd/modules/M12-platform-billing.md

- **M12-30** (P0) — **Cap enforcement mechanics:** the usage screen warns at **80%** of any capped count or ceiling (M12-34 — the first notice is never the block); at **100%** a banner appears and a **7-day grace** begins; after grace, **new creations of that type pause** until upgrade or the next cycle. Reading, editing existing records and exporting never pause. Caps reset on the tenant's own billing anchor; counts are plain counts over the cycle window — no proration, no weighting. _(non-UI half, build-side: 80%/100%/7-day-grace cap ladder; counts reset on billing anchor, no proration — for awareness, not for drawing)_
  _Shared row: the 100%-banner/denial half lands on SCR-SHELL-06; this screen carries the warning and rollup surfaces._
- **M12-34** (P0) — **The usage screen shows exactly the rollups the product enforces and bills from** — same query, same numbers, no smoothing — each figure labelled with the period it covers and described in **plain "actual usage" language** (owner ruling 2026-08-04, Q9: the provenance word "measured" is reserved for engineering/survey data and does not appear on usage or billing screens; `F8-33`'s law, whose screen this is). **The 80% pre-warning is a gate-side obligation:** when any bundle or cap is 80% consumed the screen says so **before** the gate ever fires, and no gate in §M12.4 may fire without that pre-warning having been available on this screen. _(non-UI half, build-side: same query as enforcement and billing; gates need pre-warning first — for awareness, not for drawing)_
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
