# MS4 · Studio Step 4 — Components (panel · capacity · inverter · battery)

Status: draft · Origin mix: SRC-CODE + BRIEF (Sitting 4 rulings, 2026-08-05) · Depends on: M01 (catalog laws M01-32..46), M05 §M05.6 + DD12 (the shared picker pattern), F1 (pack money/certification), F8 (provenance), MS2 (roofs), MS6 (layout/fill)
Sources: ledger `step4-components.md` (92 keys; 92/92 tests pass; formulas re-derived live) · rulings `step4-components-rulings.md` (S4-1…S4-5) · census A.10-5 (41/41 matched, 9 with recorded divergences now ruled).
Forward: MS6 (fill consumes the chosen module/target) · MS8 (SLD/stringing consumes inverter/topology/MLPE) · MS10 (BOM consumes catalog + pricebook) · MS3 (capability presets recorded here at `.81–.86`) · MS6 (steel profile catalog recorded here at `.87–.92`).

## 1. Purpose & scope

Step 4 chooses what gets installed: the module, the target capacity, the inverter (plus topology/MLPE), and — per S4-1 — the battery. It also hosts the studio's decision engine: an 11-column compare matrix that prices, sizes, simulates and ranks whole candidate systems with its assumptions stated. This document specs the full surface and reconciles it with the owner's DD12 catalog design.

## 2. Personas & surfaces

Design Engineer (author) · Sales Executive (compare-led selling). Web + mobile parity (F7-30). Permissions per F2 studio rows; catalog *management* stays Owner+Operations (M01/DD11) — this step only consumes the resolved catalog.

## 3. Feature areas

### MS4.1 — Step shell & flow

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS4-01 | Accordion of four sections in fixed order **PANEL → CAPACITY → INVERTER → BATTERY** (S4-1 adds Battery to `.1`), one open at a time, initial section = the first incomplete one, done-state summary on each collapsed header ("{brand} {watt}W", "{n} kWp", "{brand} {acKw}kW", "{kWh} kWh / none") (`.1–.3`). | `SRC-CODE` + `BRIEF` S4-1 | P0 |
| MS4-02 | Auto-advance on completion; every section stays freely reopenable — AND the open section collapses on its own header (S4-4.1 fixes `.5`) (`.4`). | `SRC-CODE` + `BRIEF` S4-4.1 | P0 |
| MS4-03 | Step gate messages block in order with plain reasons ("Select a panel to continue" → "Select an inverter to continue" → "Set a target capacity to continue") (`.6`). | `SRC-CODE` | P0 |
| MS4-04 | Undo semantics: component choices are single, coherent undo entries — not per-keystroke, not silent (S4-4.5 + S4-2 raise `.7`'s default to explicit, matching the Compare→Apply path `.67`). | `BRIEF` S4-2/S4-4.5 | P0 |

### MS4.2 — Catalog source & entry paths (the DD12 alignment)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS4-05 | Every picker (panel, inverter, battery) reads the tenant's RESOLVED catalog — platform market slice + tenant SKUs + tenant overrides (M01-32..46) — the same door the compare matrix, BOM and design fingerprint use. No component list may read a bundled database directly (S4-1 fixes `.8`; `.74` is the correct consumer pattern). | `BRIEF` S4-1 | P0 |
| MS4-06 | All three entry paths are REAL on every picker: **Browse** the resolved catalog · **Upload datasheet** (PDF extraction with review-before-commit per M01-40) · **Enter specs manually** — plus in-flow **Excel import** (M01-41). The POC's non-interactive caption (`.23/.24`) is retired. | `BRIEF` S4-1 | P0 |
| MS4-07 | Provenance is visible per entry: manufacturer-datasheet / installer-pricebook / tenant-provided, with effective-from where present — surfaced in the picker row and carried into compare and BOM (S4-1 activates `.72/.73`; F8). | `BRIEF` S4-1 | P0 |
| MS4-08 | Availability travels with the product everywhere it appears (picker, compare, summary) — never compare-only (S4-5.3, M05-43). | `BRIEF` S4-5.3 | P0 |
| MS4-09 | Certification flags are scheme-keyed market data (India: ALMM/DCR) shown on rows and filterable; the compare shortlist's certification-first ranking is stated as pack-driven, not hard-coded (`.50/.75`, F1 + M01-34). | `SRC-CODE` + `BRIEF` S4-1 | P0 |

### MS4.3 — Panel picker

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS4-10 | Filters: search, watt window, technology, certification toggles — with bounds guarded (blank = no bound, never an empty catalog; negatives refused) (S4-4.3 fixes `.13`) and state PERSISTED across section switches (S4-4.2 fixes `.22`). | `SRC-CODE` + `BRIEF` S4-4.2/.3 | P0 |
| MS4-11 | Result list shows count, specs, certification/availability/provenance badges; a no-match state explains and offers **Clear filters** (S4-4.4 fixes `.21`). | `SRC-CODE` + `BRIEF` S4-4.4 | P0 |
| MS4-12 | Choosing a panel with modules ALREADY PLACED raises the guard dialog (what changes · module count · keep-or-refill) and applies as one undo step — identical on the picker and Compare→Apply paths (S4-2 fixes `.20`, closes SC.10-5.40; `.68` is the correct pattern). | `BRIEF` S4-2 | P0 |
| MS4-13 | Panel spec contract (schema-gated: unique ids, watt > 0, length > width, Voc > Vmp, Isc > Imp, negative temp-coeff, price > 0) — the studio never accepts a module that would break electrical sizing (`.76/.77`). | `SRC-CODE` | P0 |

### MS4.4 — Capacity

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS4-14 | Target capacity input in kWp: commit-on-blur, clamped > 0, quantised to 0.1, one undo entry per committed change (S4-4.5 fixes `.26`); Continue disabled until set (`.25/.33`). | `SRC-CODE` + `BRIEF` S4-4.5 | P0 |
| MS4-15 | "Auto" estimates max capacity from the drawn roofs; when unavailable the control STATES THE REASON ("draw a roof first" / "choose a panel first") (S4-4.7 fixes `.28`, SC.10-5.13). | `SRC-CODE` + `BRIEF` S4-4.7 | P0 |
| MS4-16 | Bill-based suggestion banner ("From your ₹X/month bill → ~Y kWp") and the recommended-inverter banner are real buttons (Enter AND Space, screen-reader-correct) with market-grouped currency (S4-5.2 fixes `.32`); positive suggestions use an informational (not warning) style (`.30/.31` corrected). | `SRC-CODE` + `BRIEF` S4-5.2 | P0 |
| MS4-17 | Google-Solar cross-check line states panels AND the equivalent kWp at the reference watt, with the honest "your module differs" caveat (S4-5.1 fixes `.29`, SC.10-5.14). | `BRIEF` S4-5.1 | P1 |

### MS4.5 — Inverter, topology & MLPE

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS4-18 | Recommendation engine: scans the resolved catalog for units matching the site's phase, sizes count ≤4, keeps only candidates inside the DC/AC eligibility band (0.90–1.35), then picks the candidate whose ratio is CLOSEST to the 1.15 target (minimises \|ratio − 1.15\|), tie-breaking on lower total price; the banner states unit, count, phases and resulting ratio; never auto-applies (`.34–.36`). | `SRC-CODE` | P0 |
| MS4-19 | NO-FIT state is explained, never blank: the reason, the nearest fits (reusing the compare sheet's nearest-fit computation) and the practical suggestions (multi-unit, phase change) (S4-3 fixes `.37`). | `BRIEF` S4-3 | P0 |
| MS4-20 | Inverter list is sorted phase-suitability first, then kW ascending; phase-incompatible units carry a badge stating why they cannot serve this site (S4-3 + S4-5.4 fix `.42`). | `BRIEF` S4-3/S4-5.4 | P0 |
| MS4-21 | Inverter count input enforces its stated maximum as well as its minimum (S4-4.6 fixes `.39`); the count propagates to ratio, BOM and stringing (`.39`). | `SRC-CODE` + `BRIEF` S4-4.6 | P0 |
| MS4-22 | DC collection topology (string / central+combiners) and MLPE (none / DC optimisers) selectors with their consequence hints; visible whenever an inverter is chosen (`.43–.45`). | `SRC-CODE` | P0 |
| MS4-23 | Inverter spec contract: AC kW, phases, MPPT windows (count/min-max V/current/strings), max DC V, efficiency, price, warranty — the fields electrical sizing depends on (`.78/.79`). | `SRC-CODE` | P0 |

### MS4.6 — Battery (new section)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS4-24 | BATTERY section with the same three entry paths and the resolved catalog; per-unit specs (usable kWh, chemistry, voltage window, warranty, price) and quantity; "None" is a valid, explicit state (S4-1; DD12/M05-37). | `BRIEF` S4-1 | P0 |
| MS4-25 | Battery selection flows to the BOM, the SLD/electrical step and the proposal's components block; the proposal-side battery card (M06-33 family) consumes it rather than re-asking (S4-1). | `BRIEF` S4-1 | P0 |
| MS4-26 | Battery ECONOMICS (backup duration, self-consumption/ToU modelling) remains a Recommended Enhancement — not v2 scope (enhancements register, design spec §10). | `REC` | P2 |

### MS4.7 — Compare options (the decision engine)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS4-27 | Compare sheet: full-screen dialog with focus trap and Esc; disabled with a stated reason when no roof exists (`.46/.47`). | `SRC-CODE` | P0 |
| MS4-28 | BASIS statement above the matrix, assembled live, stating exactly what was simulated (target-filled vs max-fill; which roofs; shading assumption) (`.48`) plus the warnings list (roofless, sub-module target) (`.49`) — F8 honesty at the decision surface. | `SRC-CODE` | P0 |
| MS4-29 | Candidate set: certification-first shortlist ranked by cost-per-watt, capped, with the CURRENT selection always included even when it wouldn't rank (`.50`). | `SRC-CODE` | P0 |
| MS4-30 | The 11 comparison columns, each computed per candidate: option (with RECOMMENDED/CURRENT badges) · inverter (+count, DC/AC) · fits (panels × watt, achieved kWp) · module efficiency (STC area basis) · annual kWh (unshaded basis, stated) · net cost (with subsidy sub-line via pack) · payback (escalation + degradation model) · 25-yr savings (+ ROI %) · warranty · install complexity band (+ array weight) · action (`.51–.61`). | `SRC-CODE` | P0 |
| MS4-31 | Action states are honest: infeasible options cannot be applied (marked "check"), feasible ones offer Apply; the note taxonomy explains every zero/warn case verbatim (`.62/.63`). | `SRC-CODE` | P0 |
| MS4-32 | Matrix recommendation rule (feasible AND within the clipping limit) is stated on-screen and distinct from the picker's rule (`.64`); decision cards below the matrix state topic, choice, reason and inputs (`.65`); the fixed-assumptions footnote lists escalation, horizon, margin and subsidy basis (`.66`). | `SRC-CODE` | P0 |
| MS4-33 | Apply writes panel + inverter + count as ONE undo step, raising the placed-panel guard when the module changes (`.67/.68` — the pattern MS4-12 generalises); the sheet stays open and re-computes so the choice can be verified against alternatives (`.69`). | `SRC-CODE` | P0 |
| MS4-34 | Everything derived recomputes from the store (efficiency, energy, cost, subsidy, payback, savings, ROI, ratio, weight) — no cached figures (`.70`); capacity edits re-key the comparison memo, so the compare sheet always reflects the current target (`.71`). | `SRC-CODE` | P0 |

## 4. Cross-module contracts & catalogs recorded here

Consumes: M01 resolved catalog + provenance + availability (MS4-05..09); MS2 roofs; MS6 fill/estimation (`.28/.54`); F1 pack (currency, certification schemes, subsidy slabs — `.57`); F8 (basis/assumption honesty). Provides: module/target to MS6; inverter/count/topology/MLPE to MS8; catalog + pricebook to MS10; battery to MS8/MS10/M06. Recorded here, surfaced elsewhere: **obstruction capability model** (`.81–.86`) — the resolver, the single shadow predicate, bridge-clearance arithmetic — surfaces at MS3-15/28/30/31; **structural steel profile catalog** (`.87–.92`) — 8 sections, mass rules by shape family, derived labels, the default-profile ordering and the de-duplication that removed a real drift hazard — surfaces at MS6. Both are stated once here (their data files) and cited there.

## 5. Non-goals

Catalog *management* on this step (Owner+Operations in settings, M01/DD11) · battery economics modelling (MS4-26, REC) · hard-coding any market's certification scheme (F1) · silent component swaps (MS4-12) · reading bundled component databases directly (MS4-05).

## 6. Open items

None — Sitting 4 closed with zero open items (5 rulings covering all 14 defects, 2026-08-05).

## Acceptance criteria (P0 coverage)

- Given a new design, Then the accordion shows PANEL → CAPACITY → INVERTER → BATTERY, opening at the first incomplete section with summaries on completed headers (MS4-01); tapping an open header collapses it (MS4-02); Next states the blocking reason in order (MS4-03); a component choice produces exactly one undo entry (MS4-04).
- Given a tenant with own SKUs and price overrides, When any picker opens, Then it lists the RESOLVED catalog — identical to what compare and BOM use (MS4-05). Given a missing product, Then browse/datasheet-upload/manual all work in-flow, with datasheet extraction reviewed before commit (MS4-06). Given a tenant-entered SKU, Then its provenance shows on the row and travels to compare and BOM (MS4-07). Given an on-order unit, Then the availability badge shows in the picker, not only in compare (MS4-08). Given an IN-market tenant, Then ALMM/DCR flags show and filter as pack-driven data (MS4-09).
- Given an emptied Max-watt filter, Then the list is not emptied and the bound reads as "no maximum" (MS4-10); given zero matches, Then the state explains and offers Clear filters (MS4-11). Given 24 placed modules, When a different panel is chosen from the picker, Then the guard dialog appears with the count and keep-or-refill choice, and one undo reverts everything (MS4-12). Given a catalog entry violating the spec gate, Then it never reaches the picker (MS4-13).
- Given a typed capacity of 5.37, Then it commits as 5.4 on blur as ONE undo entry; a negative never commits (MS4-14). Given no roof drawn, Then Auto states "draw a roof first" (MS4-15). Given a bill on file, Then the suggestion banner activates with Enter AND Space and prints grouped currency (MS4-16).
- Given a 4.3 kWp single-phase site with no in-band inverter, Then the reason, the nearest fits and the multi-unit/phase suggestions are shown (MS4-19); the list is phase-sorted with badges on incompatible units (MS4-20); a typed count above the maximum is refused (MS4-21). Given an inverter, Then topology and MLPE selectors show with their hints (MS4-22). Given several inverter×count candidates inside the 0.90–1.35 eligibility band, Then the recommendation is the one whose DC/AC ratio is closest to 1.15, with price breaking ties, and the banner states unit/count/phase/ratio without auto-applying (MS4-18). Given a catalog inverter, Then its MPPT/DC-voltage fields are present for sizing (MS4-23).
- Given a hybrid design, Then a battery can be chosen (or explicitly none) via the same three paths (MS4-24), and it flows to BOM, SLD and the proposal components block without re-asking (MS4-25).
- Given no roof, Then Compare is disabled with the reason (MS4-27); given results, Then the basis paragraph states exactly what was simulated and warnings render (MS4-28); the shortlist is certification-first by cost-per-watt with the current choice included (MS4-29); all 11 columns compute per candidate (MS4-30); infeasible rows cannot be applied and every zero/warn case is explained (MS4-31); the recommendation rule and fixed assumptions are visible (MS4-32); Apply is one undo step and raises the swap guard (MS4-33); every figure recomputes from the store with no staleness (MS4-34).

Localization: labels/hints/decision copy via catalog (F3); currency/units per F1 pack. Analytics: component_selected {kind, source}, compare_opened, compare_applied {row, recommended?}, datasheet_uploaded, catalog_import_used.
