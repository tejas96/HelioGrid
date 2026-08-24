# SCR-MS-12 · Studio Step 9 — Bill of Materials

Priced procurement-ready bill: money summary, sectioned 11-column line table, banners, overrides, compliance checklist, exports.

**Module:** M05 · Design Studio · **Personas:** Design Engineer (author), Operations/Finance (rates, margin, discount per F2), Sales Executive (quote total), EPC Owner, Sales (read-only, can export) · **Context of use:** the studio's commercial core — a ~286-control screen that must hold up at 375 px through progressive disclosure; web primary with derivation explanations touch-accessible per S9-3.3; BOM edits are money mutations and online-only, while read + export always work regardless of billing state.

## Entry & exit

Reached from: the studio wizard, advancing from Step 8 — SLD & Drawings (SCR-MS-11), or by the step rail/sheet into a visited step (SCR-MS-03). **Wizard-step gate that admits the user:** this step sits past the studio's one hard gate — invalid electrical blocks the layout step's Next (M05-49/MS6-28 on SCR-MS-08), so an unsafe design cannot reach the BOM; no additional gate guards entry here. Leads to: the Done step (SCR-MS-13) via the wizard's Next; Export CSV leaves the screen (M05-74); the totals travel — the money summary's Proposal total is the system cost the proposal consumes, below-cost warns here and payable ≤ 0 blocks at the proposal builder's Generate (M05-69 — M06's half); the market compliance checklist opens from the page actions (M05-74).

## Requirements (verbatim)

### docs/prd/modules/M05-studio/09-step9-bom.md

- **MS10-01** (P0) — Header with project identity; Re-sync-all with an explicit confirmation stating what will be discarded; CSV export (`.1–.5`).
- **MS10-02** (P0) — Money summary of nine figures: system size · pre-margin cost · editable margin · discount · taxable (with the discount delta) · tax (per-rate breakdown) · quote total · price-per-watt · subsidy (`.6–.15`).
- **MS10-03** (P0) — Discount control supports percentage AND flat amounts, storing nothing when zero, keeping the chosen kind, re-committing on kind switch — and re-syncing when project state changes externally (undo/redo/restore) (S9-3.2 fixes `.39`) (`.16/.35–.38`). _(non-UI half, build-side: zero stores nothing; kind kept; re-commit on kind switch; re-sync on undo/redo/restore — for awareness, not for drawing)_
- **MS10-06** (P0) — Orphan banner: an override whose line no longer derives is surfaced, never silently dropped, with an adopt-as-custom-line path (`.20/.21/.139`).
- **MS10-07** (P0) — Below-cost warning when the discount sells under cost (`.22/.133`).
- **MS10-08** (P0) — Structure/engineering disclaimer whenever assumed structural lines are present, WITH the site's wind/site conditions stated for every site — not only high-wind ones (S9-3.1 fixes `.24`) (`.23`).
- **MS10-09** (P0) — Preliminary-quote banner naming how many lines are assumed (`.25`, F8).
- **MS10-10** (P0) — Compliance checklist for the connecting utility — its CONTENT is market-pack data (S9-1 fixes `.28`), with live evidence links where the design can prove an item (`.29–.33`). _(non-UI half, build-side: checklist content is market-pack data, not code — for awareness, not for drawing)_
- **MS10-11** (P0) — Categories render in registry order with per-section totals that RECONCILE to the project total — a flat project discount is applied once and allocated proportionally, never re-clamped per section (S9-2 fixes `.41`) (`.26/.40`). _(non-UI half, build-side: flat discount applied once, allocated proportionally, never re-clamped per section — for awareness, not for drawing)_
- **MS10-12** (P0) — Add-custom-line, per-section refresh-from-design, and the full 11-column table with an accessible caption (`.27/.42–.44`).
- **MS10-13** (P0) — Field-level staleness: when an edited value drifts from what the design now derives, the section banner names the field, the item and both values, with a one-tap "take the new value" and a capped list (`.45–.49/.138`).
- **MS10-14** (P0) — Survey-input card (electrical BOS): average DC/AC run inputs that DISABLE with an inline note when real routed geometry exists — measured beats assumed (`.50–.54`).
- **MS10-16** (P0) — Include/exclude keeps the line visible and priced at zero rather than deleting it (`.56/.57`).
- **MS10-17** (P0) — Every row carries a confidence indicator (measured/derived/estimated/assumed) and a per-field reset; edited fields read as the human's figure while retaining the engine's value for staleness (`.58/.73/.148`). _(non-UI half, build-side: edited fields retain the engine's value so staleness stays exact — for awareness, not for drawing)_
- **MS10-18** (P0) — Editable fields: item, spec, brand, quantity, unit (constrained list), waste %, rate, GST % — with order quantity, amounts and totals calculated read-only (`.59–.70/.136`).
- **MS10-19** (P0) — Derivation explanations are readable on touch and by screen readers — not tooltip-only (S9-3.3 fixes `.71`).
- **MS10-20** (P0) — Remove is offered only for custom lines; derived lines are excluded, never deleted (`.72`).
- **MS10-35** (P0) — A BOM edit re-keys the design fingerprint (money moved) without disturbing field order; section state exposes counts of included and edited lines (`.146/.150`). _(non-UI half, build-side: BOM edit re-keys design fingerprint without disturbing field order — for awareness, not for drawing)_

### docs/prd/modules/M05-design-studio.md

- **M05-68** (P0) — **The BOM's ~286 controls are presented with progressive disclosure — never all at once, never a smaller font.** Category and line detail unfold on demand; the money summary is always in reach.
- **M05-69** (P0) — **The money summary carries nine figures:** system kWp · cost before margin · **margin % (editable 0–60)** · **discount (editable, value + % or amount)** · taxable (with the reduction line when discounted) · tax (per-rate breakdown when rates are mixed — the tax scheme is pack data) · **Proposal total** (the census's "Quote total" is superseded as UI copy per `R1`) · price per Wp · subsidy (+ reason when zero — the scheme is pack data). There is **no discount-approval flow**; the arithmetic guards are: below-cost warns, payable ≤ 0 blocks Generate (the block runs at the proposal builder's Generate per `R12` — M06's half). _(non-UI half, build-side: no discount-approval flow; below-cost warns; payable≤0 blocks at M06 Generate — for awareness, not for drawing)_
- **M05-71** (P0) — **Six categories in fixed order, shown only when they have lines:** Modules · Inverter · Electrical BOS · Mechanical BOS · Safety · Civil & Misc. Per category: name, "N of M included", own total, and Refresh-from-design (appears once anything is hand-edited). Electrical BOS survey inputs: average DC run and average AC run — both **lock with a note when the design has real routed cable geometry** (the routed length is used instead).
- **M05-72** (P0) — **Line items carry the census field set with the four-tier confidence indicator:** Include switch (excluding keeps the line, drops it from totals, dims it — never deletes); **confidence MEASURED · DERIVED · ESTIMATED · ASSUMED, readable not decorative**; item name (editable on custom lines, fixed on derived); spec; brand; quantity; unit (nos · set · pairs · kit · lot · plate · panel-set · day · m · m² · kg · kW); waste % (0–100); order quantity (calculated, read-only); rate; amount (calculated); tax % (0–40); tax + total (calculated); derivation explanation (the formula in words); remove (custom lines only); per-field reset (appears next to overridden values; changes appearance when the design has moved on). **A user-entered override takes measured provenance ("override=measured"), and overrides are preserved with stale-field tracking.** Rates resolve through the catalog with versioned history; sent proposals keep the rate version they were built with. _(non-UI half, build-side: override takes measured provenance; stale-field tracking; versioned rate pinning — for awareness, not for drawing)_
- **M05-73** (P0) — **Reconciliation is explicit, per the census:** stale notice per category ("yours X · design now Y" per drifted field, one-tap "Take Y", bulk "Refresh these", "and N more"); orphan notice (a saved edit whose line no longer exists → Keep as custom line / Discard); below-cost warning; **preliminary-proposal notice** (how many lines are assumed/estimated and which figures need site verification — the census's "quote" wording superseded per `R1`); structure engineering disclaimer with the site's wind zone (material estimate, not a safety check).
- **M05-74** (P0) — **Page actions:** Add a custom line · Re-sync all (discards every hand-edit; confirm first, stating that edits are lost; disabled when nothing is edited) · **Export CSV — read + export always work regardless of billing state** · the market compliance checklist (pack-supplied: the tenant market's pre-submission checks; the IN pack's checklist — net metering vs sanctioned load, SLD sign-off, module scheme listings, earthing/arrester certificates, subsidy eligibility with its certification caveat — is `F1` pack data referenced by key, never named in this body). _(non-UI half, build-side: read+export always work regardless of billing state; checklist content is pack data — for awareness, not for drawing)_

## States

- loading
- empty
- error
- normal
- categories-collapsed (progressive disclosure; money summary always in reach)
- resync-confirm (explicit confirmation stating what will be discarded; disabled when nothing is edited)
- stale-notice / field-staleness ("yours X · design now Y" per drifted field, one-tap "Take Y", bulk "Refresh these", "and N more")
- orphan-notice / orphan-override (Keep as custom line / Discard)
- below-cost-warning
- structure-disclaimer (with the site's wind/site conditions stated for every site)
- preliminary-quote / preliminary-proposal-notice (how many lines are assumed/estimated and which figures need site verification)
- survey-inputs-disabled / runs-locked-routed-geometry (average DC/AC run inputs lock with a note when real routed cable geometry exists)
- excluded-line (visible, priced at zero, dimmed — never deleted)
- touch-derivation-view (derivation explanations readable on touch and by screen readers)
- mixed-tax-breakdown (per-rate breakdown when rates are mixed)
- read-only-export (read-only roles see everything and can export)

## Data volume

The ~286-control screen held to progressive disclosure: the PRD's 40-line BOM scale across six categories in fixed order (Modules · Inverter · Electrical BOS · Mechanical BOS · Safety · Civil & Misc), each line an 11-column row with an accessible caption, nine money figures always in reach, per-field overrides with staleness tracking, stacked banners (stale, orphan, below-cost, preliminary, disclaimer) and a pack-driven compliance checklist — designed to stay workable at 375 px.

## Numbers carrying provenance

- The nine money figures: system kWp · cost before margin · margin % (editable 0–60) · discount (value + % or amount) · taxable (with the reduction line when discounted) · tax (per-rate breakdown when mixed) · Proposal total · price per Wp · subsidy (+ reason when zero) (M05-69, MS10-02) — tax and subsidy schemes are pack data
- Per-line figures: quantity, waste % (0–100), order quantity (calculated), rate, amount (calculated), tax % (0–40), tax + total (calculated) (M05-72, MS10-18) — every row carries the four-tier confidence indicator **MEASURED · DERIVED · ESTIMATED · ASSUMED, readable not decorative** (M05-72, MS10-17)
- A user-entered override takes measured provenance ("override=measured") with stale-field tracking (M05-72); edited fields read as the human's figure while retaining the engine's value so staleness stays exact (MS10-17)
- Stale-field pairs: "yours X · design now Y" — both values shown (M05-73, MS10-13)
- Per-category "N of M included" and own total; per-section totals reconcile to the project total (M05-71, MS10-11)
- Preliminary notice count — how many lines are assumed/estimated (M05-73, MS10-09)
- Average DC run / average AC run — assumed survey inputs that lock when routed geometry exists (measured beats assumed) (M05-71, MS10-14)
- The site's wind zone / wind conditions on the structure disclaimer — stated for every site (M05-73, MS10-08)
- Rates — resolved through the catalog with versioned history; sent proposals keep the rate version they were built with (M05-72)
- Derivation explanation — the formula in words, per line (M05-72, MS10-19)
