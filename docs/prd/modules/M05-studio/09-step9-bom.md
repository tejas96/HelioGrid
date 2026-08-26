# MS10 · Studio Step 9 — Bill of Materials (the money document)

Status: draft · Origin mix: SRC-CODE-dominant + BRIEF (Sitting 9 rulings, 2026-08-05) · Depends on: MS2/MS6 (geometry, structures), MS4 (catalog + pricebook), MS8 (sized ratings, routed metres, combiner plan), F1 (pack: prices, tax, subsidy, rules), F8 (confidence/provenance), MS7 (system cost consumer), MS9 (customer document)
Sources: POC code inventory — bom (**167 keys** — the largest area of the pass; 12 test files all passing) · sitting rulings (S9-1…S9-3) · census A.10-10. The ledger index is retired; the POC repository named in `docs/build-order.md` is the source, and the sitting rulings are carried by the rows below.
Forward: MS7 (system cost = BOM total), MS9 (BOM section + confidence on the customer document), MS8 (DXF trigger lives on the SLD step).

## 1. Purpose & scope

Step 9 turns the design into a priced, procurement-ready bill: six emitters derive every line from real geometry and sized electrical values, per-field overrides let a human correct anything without losing provenance, and one money engine produces the number that becomes the customer's price. This is the studio's commercial core — and after S9-1, its rules are market-pack data rather than India-only code.

## 2. Personas & surfaces

Design Engineer (author) · Operations/Finance (rates, margin, discount per F2) · Sales Executive (quote total). Web primary; touch-accessible derivations per S9-3.3.

## 3. Feature areas

### MS10.1 — Screen, money summary & controls

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS10-01 | Header with project identity; Re-sync-all with an explicit confirmation stating what will be discarded; CSV export (`.1–.5`). | `SRC-CODE` | P0 |
| MS10-02 | Money summary of nine figures: system size · pre-margin cost · editable margin · discount · taxable (with the discount delta) · tax (per-rate breakdown) · quote total · price-per-watt · subsidy (`.6–.15`). | `SRC-CODE` | P0 |
| MS10-03 | Discount control supports percentage AND flat amounts, storing nothing when zero, keeping the chosen kind, re-committing on kind switch — and re-syncing when project state changes externally (undo/redo/restore) (S9-3.2 fixes `.39`) (`.16/.35–.38`). | `SRC-CODE` + `BRIEF` S9-3.2 | P0 |
| MS10-04 | ONE money path: the screen, the proposal and the comparison all read the same money engine (`.17`, MS7-28). | `SRC-CODE` | P0 |
| MS10-05 | Every BOM mutation is ONE undoable patch; custom lines edit in place while derived lines take field overrides (`.18/.19`). | `SRC-CODE` | P0 |

### MS10.2 — Banners, orphans & compliance

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS10-06 | Orphan banner: an override whose line no longer derives is surfaced, never silently dropped, with an adopt-as-custom-line path (`.20/.21/.139`). | `SRC-CODE` | P0 |
| MS10-07 | Below-cost warning when the discount sells under cost (`.22/.133`). | `SRC-CODE` | P0 |
| MS10-08 | Structure/engineering disclaimer whenever assumed structural lines are present, WITH the site's wind/site conditions stated for every site — not only high-wind ones (S9-3.1 fixes `.24`) (`.23`). | `SRC-CODE` + `BRIEF` S9-3.1 | P0 |
| MS10-09 | Preliminary-quote banner naming how many lines are assumed (`.25`, F8). | `SRC-CODE` | P0 |
| MS10-10 | Compliance checklist for the connecting utility — its CONTENT is market-pack data (S9-1 fixes `.28`), with live evidence links where the design can prove an item (`.29–.33`). | `SRC-CODE` + `BRIEF` S9-1 | P0 |

### MS10.3 — Sections, table & rows

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS10-11 | Categories render in registry order with per-section totals that RECONCILE to the project total — a flat project discount is applied once and allocated proportionally, never re-clamped per section (S9-2 fixes `.41`) (`.26/.40`). | `SRC-CODE` + `BRIEF` S9-2 | P0 |
| MS10-12 | Add-custom-line, per-section refresh-from-design, and the full 11-column table with an accessible caption (`.27/.42–.44`). | `SRC-CODE` | P0 |
| MS10-13 | Field-level staleness: when an edited value drifts from what the design now derives, the section banner names the field, the item and both values, with a one-tap "take the new value" and a capped list (`.45–.49/.138`). | `SRC-CODE` | P0 |
| MS10-14 | Survey-input card (electrical BOS): average DC/AC run inputs that DISABLE with an inline note when real routed geometry exists — measured beats assumed (`.50–.54`). | `SRC-CODE` | P0 |
| MS10-15 | Procurement quantities stay in the trade's unit even when display units differ (`.55`). | `SRC-CODE` | P1 |
| MS10-16 | Include/exclude keeps the line visible and priced at zero rather than deleting it (`.56/.57`). | `SRC-CODE` | P0 |
| MS10-17 | Every row carries a confidence indicator (measured/derived/estimated/assumed) and a per-field reset; edited fields read as the human's figure while retaining the engine's value for staleness (`.58/.73/.148`). | `SRC-CODE` | P0 |
| MS10-18 | Editable fields: item, spec, brand, quantity, unit (constrained list), waste %, rate, GST % — with order quantity, amounts and totals calculated read-only (`.59–.70/.136`). | `SRC-CODE` | P0 |
| MS10-19 | Derivation explanations are readable on touch and by screen readers — not tooltip-only (S9-3.3 fixes `.71`). | `BRIEF` S9-3.3 | P0 |
| MS10-20 | Remove is offered only for custom lines; derived lines are excluded, never deleted (`.72`). | `SRC-CODE` | P0 |

### MS10.4 — Derivation engine & emitters

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS10-21 | Six emitters run over one shared context in registry order; the merged result = auto lines + per-field overrides + custom lines (`.75/.76`). | `SRC-CODE` | P0 |
| MS10-22 | Header confidence is the WORST tier among included lines; subtotal is buy-cost including waste; the total is line-wise because tax rates differ (`.77–.79`). | `SRC-CODE` | P0 |
| MS10-23 | Line-key registry with stable semantic keys, category order, per-key default waste allowances, discrete-unit rounding, and a line constructor that fills provenance (`.84–.88`). | `SRC-CODE` | P0 |
| MS10-24 | Source attribution names a roof/segment only when exactly one contributed (`.89`). | `SRC-CODE` | P1 |
| MS10-25 | Cable-length precedence, DC and AC independently: routed geometry → survey input → documented fallback estimator, with each source stated and zero/negative inputs never treated as a run (`.90–.95`). | `SRC-CODE` | P0 |
| MS10-26 | Prices resolve through the catalog's price book per derivation, with cable rates rounding UP to the next priced size (never understating) (`.97/.152`). | `SRC-CODE` | P0 |
| MS10-27 | Mechanical panel buckets are disjoint and sum to the panel count — no double-counted mounting (`.98`). | `SRC-CODE` | P0 |
| MS10-28 | Emitter coverage as shipped: modules and inverters (measured); DC/AC cable sized from the electrical engine; connectors, DCDB/ACDB, conduit/tray, meters, optimisers, combiners (`.99–.109`); structure steel per profile, foundations/fixings from the node graph, per-covering fallbacks, rails, clamps, fasteners (`.110–.118`); safety from drawn geometry — walkways, rails, arresters, earthing pits, signage (`.119–.122`); civil and site works, with site-dependent prompt lines emitted at zero and excluded so nobody forgets them (`.123–.125`). | `SRC-CODE` | P0 |

### MS10.5 — Money engine (locked invariants)

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS10-29 | Order quantity applies waste and rounds up for discrete units; excluded lines price at zero with no phantom margin (`.126/.127`). | `SRC-CODE` | P0 |
| MS10-30 | Locked invariants: margin sits BELOW tax (tax is charged on the sale price) and discount sits BEFORE tax; the discount is bounded to the taxable amount and comes out of margin, never cost; rounding happens once then adds (`.128–.132`). | `SRC-CODE` | P0 |
| MS10-31 | Margin default and zero-line behaviour are defined (`.134/.135`). | `SRC-CODE` | P0 |
| MS10-32 | Tax rates, categories and per-line exceptions are MARKET-PACK data (S9-1 fixes `.153`). | `BRIEF` S9-1 | P0 |

### MS10.6 — Overrides, migration & fingerprints

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS10-33 | Per-field overrides keyed on stable line keys, each recording the engine value at edit time so staleness is exact; legacy whole-line overrides keep working and migrate lazily on first edit (`.136–.145`). | `SRC-CODE` | P0 |
| MS10-34 | Number-commit contract avoids phantom edits (untouched = no override; retyping the same value is not an edit) (`.147`). | `SRC-CODE` | P0 |
| MS10-35 | A BOM edit re-keys the design fingerprint (money moved) without disturbing field order; section state exposes counts of included and edited lines (`.146/.150`). | `SRC-CODE` | P0 |

### MS10.7 — Exports & market data

| ID | Requirement | Tag | Tier |
|---|---|---|---|
| MS10-36 | CSV export: full column set, buy-side amounts never discounted while sell-side reflects the quote, notes appended safely, and a defined no-project fallback (`.5/.80–.83`). | `SRC-CODE` | P0 |
| MS10-37 | DXF export writes the DESIGN at 1:1 in named layers including structure in plan, with a deterministic filename; its trigger lives on the SLD step (`.161–.166`, MS8-06). | `SRC-CODE` | P0 |
| MS10-38 | Units: everything stored metric with display-only conversion and a typed-value return trip (`.158–.160`). | `SRC-CODE` | P0 |
| MS10-39 | ALL market data is pack-driven: price book, tax, subsidy slabs and eligibility, engineering constants (slack, drops, reach, earthing counts) and wind tables; the single-market resolver becomes multi-market with India shipping today's exact values (S9-1 fixes `.151/.153–.157`). | `BRIEF` S9-1 | P0 |
| MS10-40 | Confidence and preliminary state TRAVEL to the proposal and the customer document (`.167`, MS9-20). | `SRC-CODE` | P0 |

## 4. Cross-module contracts

Consumes: MS2/MS6 geometry and structures, MS4 catalog/pricebook, MS8 sized ratings + routed metres + combiner plan, F1 pack (all commercial and engineering constants after S9-1), F8 confidence tiers. Provides: system cost to MS7 (one money path), the priced bill + confidence to MS9's customer document, DXF to the drawing set. **Money invariants (MS10-30) are suite law** — any surface displaying a price must respect the same order of operations.

## 5. Non-goals

Inventory or purchase-order management (D9 non-goal in the main suite) · deleting derived lines (exclusion only, MS10-20) · discounting supplier cost (MS10-30) · India-only commercial rules in code (MS10-39).

## 6. Open items

None — Sitting 9 closed with zero open items (3 rulings, 2026-08-05).

## Acceptance criteria (P0 coverage)

- Given the step opens, Then header, re-sync (with its confirmation) and CSV export are present (MS10-01) and the nine money figures render (MS10-02). Given an undo after a discount change, Then the control reflects the restored state (MS10-03). Given any surface showing price, Then it equals the money engine's output (MS10-04). Given any BOM edit, Then it is one undoable patch routed correctly for custom vs derived lines (MS10-05).
- Given an override with no matching derived line, Then it is surfaced with an adopt path (MS10-06). Given a below-cost discount, Then the warning shows (MS10-07). Given assumed structural lines, Then the disclaimer shows WITH the site's wind conditions regardless of zone (MS10-08); given assumed lines, the preliminary banner counts them (MS10-09). Given a connecting utility, Then the pack's checklist renders with live evidence where provable (MS10-10).
- Given a flat project discount, Then section totals sum exactly to the quote total (MS10-11). Given a section, Then add-custom-line and refresh-from-design are available and the table renders its full column set with an accessible caption (MS10-12). Given a drifted edited field, Then the banner names item, field and both values with a take-new action (MS10-13). Given routed geometry exists, Then survey-input fields disable with the reason (MS10-14). Given an excluded line, Then it stays visible at zero (MS10-16). Given any row, Then its confidence tier and per-field reset are available (MS10-17), its editable fields behave as specified (MS10-18), its derivation is readable on touch and by screen reader (MS10-19), and only custom lines offer removal (MS10-20).
- Given a design, Then all six emitters derive their lines over one context (MS10-21) with worst-tier header confidence and correct subtotal/total composition (MS10-22), stable keys and waste defaults (MS10-23), documented cable-length precedence (MS10-25), price-book resolution rounding up (MS10-26), disjoint mounting buckets (MS10-27) and the full emitter coverage listed (MS10-28).
- Given quantities and rates, Then waste and discrete rounding apply and excluded lines add nothing (MS10-29); margin sits below tax, discount before tax, bounded and drawn from margin, rounded once (MS10-30); defaults and empty-BOM behaviour hold (MS10-31); tax rates come from the pack (MS10-32).
- Given an edited field, Then the override records the engine's value for exact staleness, legacy overrides still apply and migrate lazily (MS10-33), retyping the same value creates no override (MS10-34), and the edit re-keys the fingerprint without reordering fields (MS10-35).
- Given CSV export, Then buy-side amounts are undiscounted while sell-side reflects the quote, with safe notes (MS10-36). Given DXF export, Then the design writes 1:1 in named layers with structure in plan (MS10-37). Given a display-unit preference, Then storage stays metric with a correct return trip (MS10-38). Given a non-India market pack, Then prices, tax, subsidy, constants and wind data come from that pack (MS10-39). Given a preliminary BOM, Then its confidence travels to the customer document (MS10-40).

Localization: labels/units/checklist copy via catalog + pack (F3/F1). Analytics: bom_edited {field}, bom_resynced, discount_applied {kind}, csv_exported, dxf_exported.
