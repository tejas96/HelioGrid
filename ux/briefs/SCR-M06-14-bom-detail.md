# SCR-M06-14 · BOM Detail

Internal Path A line items behind the price; mobile card list with edit sheet.

**Module:** M06 (Proposals — the commercial document: built, priced, versioned, generated, shared) · **Personas:** Sales Executive (primary), Sales Manager (team-scoped), EPC Owner (full capability), Design Engineer (the natural author on Path A) · **Context of use:** internal surface — the customer never sees it; the PRD calls it *"the densest screen in the product"*; must be fully workable on a phone as a card list; BOM edits are money mutations.

## Entry & exit

Reached from: a Path A proposal only — the BOM exists only when a design produced it (Path B has no BOM at all, `M06-01`); the exact entry point is not pinned by PRD — designer decides, note the decision (the module lists "BOM detail (Path A only — internal)" among its surfaces and emits `proposal.bom_opened`). Leads to: not pinned by PRD — designer decides, note the decision (the margin applied here flows into the proposal's price; the builder and its money block are SCR-M06-02/SCR-M06-05).

## Requirements (verbatim)

### From `prd/modules/M06-proposals.md`

- **M06-39** (P0) — **BOM detail (Path A only): the line items behind the price.** Item, spec, qty, unit, rate, tax, total — *"the densest screen in the product — mobile gets a card list with an edit sheet, never a wide table."* **Internal; the customer never sees it.** BOM edits are money mutations — **online-only, fail fast**. The margin the happy path applies starts from the price book's default margin %, adjustable per proposal (`M01-48` consumed — its behavior detail names this module's mechanics); the locked BOM money invariants — margin applied below tax, discounts pro-rated pre-tax, and the BOM ↔ proposal reconciliation — are carried market-neutrally as the proposal-money surface of the studio's BOM math (`DOC05.bom-money-locked`, the M06 half; arithmetic authored in `modules/M05` `M05-70`, money path `modules/M11`). _(non-UI half, build-side: BOM money invariants: margin below tax, discounts pro-rated pre-tax, BOM-proposal reconciliation; edits online-only — for awareness, not for drawing)_

## States

- **loading** — the line items loading for the Path A proposal.
- **empty** — no BOM exists (Path B): this screen never renders for a Path B proposal; the honest form of empty is the screen's absence, not a blank list.
- **error** — a failed line-item load or a failed edit stated plainly.
- **desktop-table** — the full line-item view at desk width: item, spec, qty, unit, rate, tax, total.
- **mobile-card-list** — the phone rendering: a card list with an edit sheet, never a wide table.
- **line-edit-sheet** — the per-line edit surface (online-only).

## Data volume

Design at a **40-line BOM** — the PRD's realistic BOM volume — with full item names, specs and per-line money on every line, at phone width, without a wide table.

## Numbers carrying provenance

Every money figure here is part of the one server-computed value set (no device computes proposal money — `M06-41` per the module):

- **Qty, unit, rate, tax, total per line** — Path A figures are **derived** (from the design's real bill of materials, per the module's pre-fill table `M06-03`).
- **Margin %** — starts from the price book's default margin %, adjustable per proposal; internal, never customer-facing.
- **BOM total ↔ proposal price** — reconciles under the locked invariants (margin below tax, discounts pro-rated pre-tax, BOM ↔ proposal reconciliation); a disagreement is a defect, not a display difference.

Stale money renders provisional, never final.
