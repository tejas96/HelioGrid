# SCR-M12-01 · Pricing Page

Public per-market tier/price/cap comparison; states all features in every tier.

**Module:** M12 · Platform billing · **Personas:** Prospect (unauthenticated visitor evaluating the product), EPC Owner (evaluating an upgrade — the buyer and only billing administrator, `prd/modules/M12-platform-billing.md` §2) · **Context of use:** public web surface, pre-auth (`prd/04-business-model.md` §2: "the public pricing page"); read on any device — a prospect comparing tools on a phone as readily as an owner at a desk. Copy exists in every launch language; amounts render in the tenant's/market's currency with the market's grouping (`prd/04-business-model.md` §04.1 localization notes).

## Entry & exit

Reached from: the public web — the PRD names the pricing page as an M12-owned public surface (`prd/04-business-model.md` §2) but does not pin inbound navigation — not pinned by PRD — designer decides, note the decision. Leads to: the trial funnel — the PRD's analytics events for this surface are "pricing-page tier viewed; trial started; trial converted" (`prd/04-business-model.md` §04.1), and signup itself carries no plan choice, card or mandate (M12-14); Enterprise is sales-assisted (BM-14/BM-15 context), so the Enterprise column's action is a sales contact, never self-serve checkout. Exact exit targets beyond these are not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### prd/04-business-model.md

- **BM-05** (P0) — **Every module is in every tier. Tiers gate capacity ceilings + usage counts + metered bundles — never features** (owner-confirmed). Every feature is in every tier: CRM and projects, the full studio (shadow analysis, all obstruction types, tin-shed/metal-roof, ground mount, structures, SLD + AC/DC and earthing layouts, industrial drawing sheets, PV/energy reports, DXF/SVG/PDF export), customer links, all languages — and the V2 additions (marketing, field workforce, HR) enter under the same law. Competitors ransom capabilities into higher tiers; the pricing page says so. _(non-UI half, build-side: tiers gate capacity/counts/bundles, never features — every module every tier — for awareness, not for drawing)_
- **BM-07** (P0) — **Caps are upgrade signals and abuse bounds, never feature ransoms.** Every cap is visible and generous, published on the pricing page and on the usage screen; outgrowing a cap IS the upgrade signal. Enforcement is soft-block with read + export always working (§04.5). _(non-UI half, build-side: caps are upgrade signals and abuse bounds; soft-block enforcement — for awareness, not for drawing)_
  _Shared row: BM-07's usage-screen half lands on SCR-M12-04._

## States

- **loading** — book data (prices/caps/bundles) not yet resolved for the market.
- **empty** — no authored market book resolves for the visitor's market; the PRD defines one price/cap source of truth (the market book, BM-09/BM-41 context) but does not pin this page's no-book behavior — not pinned by PRD — designer decides, note the decision.
- **error** — book data failed to load; honest failure, no stale or invented numbers.
- **normal** — the four-tier comparison: every cap published and visible per tier (BM-07), with the "every module in every tier / competitors ransom capabilities, we don't" statement the page is required to make (BM-05).
- **monthly-yearly-toggle** — the page presents both billing cycles; every tier bills monthly or yearly (BM-13 context: yearly = pay for 10 months, get 12; prices exclusive of the market's tax scheme).
- **benchmark-comparison** — competitor benchmark rows cited on the page; every equivalent-capacity comparison must be lower-priced and traceable to the book's recorded benchmarks, with benchmark provenance shown (`prd/04-business-model.md` §04.7 acceptance criteria and localization notes; BM-39/BM-41/BM-44 context).

## Data volume

Design at the full IN book grid (`prd/04-business-model.md` BM-41): 4 tiers × 2 cycles, each tier carrying on the order of a dozen published values — monthly and yearly price, single-design kW ceiling, proposals/month, active projects, users (unlimited), AI-detection bundle + overage rate, voice minutes (PAYG rate or bundle), storage, included tracked seats + per-seat rate, marketing-send bundles + per-channel overage rates, trial caps, service terms — plus competitor benchmark rows per tier. The comparison must stay legible at that density on a phone.

## Numbers carrying provenance

Each of these is book data stated once in the PRD and pointed to, never restated (BM-09 context); each carries its F8 provenance tier in the design:

- Tier prices, monthly and yearly, per market currency (ex-tax posture stated, e.g. ex-GST for IN).
- Every published cap and ceiling per tier: single-design kW ceiling, proposals/month, active projects, storage GB.
- Bundle sizes and overage rates: AI detections/month and per-unit overage, voice minutes and per-minute rate, marketing sends per channel and per-send overage, tracked-seat allowance and per-seat price.
- Trial caps (detections, voice minutes, storage).
- Benchmark figures in competitor comparisons — claim traceable to the book's recorded benchmarks, provenance shown.
