# SCR-M06-10 · Builder Step 8 — Components

Mandatory five-category component summary and gate, with edit sheets and inline add.

**Module:** M06 · Proposals · **Personas:** Sales Executive (primary), Sales Manager, EPC Owner, Design Engineer · **Context of use:** inside the builder shell (SCR-M06-02), phone or desk, fully workable at 375 px (`D2`, `F7-30`). Present in Quick mode (steps 1, 3, 8, 10 — M06-18). Step 8 is a summary-and-gate surface: the sections show state; the picker does the picking — §M05.6's accordion, search, filters, badges and add paths, on this module's step (§M06.5 behavior detail). The inline catalog-add paths additionally require the M01 catalog grant (`F2.M01.add-own-catalog-items`) — the picker offers the add path only to holders (§M06.5 permissions).

## Entry & exit

Reached from: the builder shell — any chip, Back/Next, or a Generate-failure jump (missing-category failures land here with the missing categories highlighted — `S6B.wrong.4`, M06-23(a)), in any order and any state (M06-22, R12). On Path A all five sections fill from the BOM automatically; a duplicated proposal brings its components (M06-27). Leads to: the shared component picker (`modules/M05` §M05.6 — cited, its own designed surface, never redrawn here); per-type Component Edit sheets and the inline add flow open over this step; any step via free navigation. The battery section appears/disappears with the battery added or removed at step 3 (M06-30, SCR-M06-05).

## Requirements (verbatim)

### docs/prd/modules/M06-proposals.md

- **M06-14** (P0) — **Step 8 · Components:** required — all categories selected before Generate (`D22`). The step surface, sections, counter and edit sheets are §M06.5's rows (`M06-27`–`M06-32`); the picker itself is `modules/M05` §M05.6, cited never restated.
- **M06-27** (P0) — **Components are mandatory on every proposal — no lump-sum quotes.** Step 8 carries sections **Panel · Inverter · Cable · Electrical · Structure** (＋ **Battery** when added), each showing **Selected / Empty** status, ＋ add, brand rows (✎ edit / ✕ remove), and count fields for Panel and Inverter. The footer counter — **"Components Selected X/5 ✓"** — *"is the gate, not a status"*: all categories must be selected before Generate (`M06-23`(a)). Path A fills all five from the BOM automatically; a duplicated proposal brings its components; otherwise the rep picks five. _(non-UI half, build-side: D22: all categories mandatory before Generate — the counter is the gate, no lump-sum quotes — for awareness, not for drawing)_
- **M06-28** (P0) — **Picking uses the one shared picker — cited, never restated.** Browsing, datasheet-PDF extraction, manual specs, resolved-catalog search and scheme-keyed certification badges are `modules/M05` §M05.6's pattern (`M05-37`–`M05-43`, consumed). Inline add is never a dead end: a missing product is added in-flow by single form, datasheet PDF, or **spreadsheet import available at proposal time** (`M01-39`, `M01-40`, `M01-41`, consumed — DD9/DD10), and the new SKU is picked without leaving the builder. _(non-UI half, build-side: DD12 one-picker law: M05 §M05.6 pattern cited, never restated; no second picker — for awareness, not for drawing)_
- **M06-29** (P0) — **The Component Edit sheet (bottom sheet, per type; Brand Name locked):** Panel — Watt Peak Range · Panel Type (Mono PERC / TOPCon / Bifacial / Mono / Poly / HJT / Thin-film) · Product & Performance Warranty. Inverter — Capacity kW · Inverter Type (On / Off / Hybrid) · Warranty. Cable — Cable Type · Specification · Warranty. Electrical — Includes · Standard. Structure — Warranty · Weight per kW · Standard. Battery — Capacity kWh · Chemistry · Warranty. Plus Description (**max 110 chars**). Cancel · Done.
- **M06-30** (P0) — **The battery blocks, across the builder.** Step 3 carries the **Battery storage card** ("Add battery backup"; **OFFGRID/HYBRID force a ⚠ "Battery required" notice**; added state = summary with Edit / Remove) opening the **Battery modal** (bottom sheet): Battery capacity kWh (**1–100**) · Cost excl./incl. tax and battery tax % per the pack's tax scheme (`F1-13`) · Cell chemistry — **Lithium LFP / Lithium NMC / Lead-acid / Custom** (Custom reveals free text) · Cancel · Save. When a battery is added, step 8 gains the **Battery** component section (capacity kWh · chemistry · warranty in the edit sheet) and the payable formula includes battery cost (`M06-35`). **OFFGRID with no battery is a hard block — "the system cannot work."** Enforcement point, read from the rulings and stated as the adopted reading: the ⚠ notice renders at step 3 immediately (a notice, not a navigation block — `R12` leaves the builder no earlier blocking point), and the hard block lands at Generate in the failure list (`M06-23`(b)); the source does not state an earlier block and none is invented. _(non-UI half, build-side: OFFGRID/HYBRID without battery: notice at step 3, hard block only at Generate (R12) — for awareness, not for drawing)_

## States

- **Loading** (base) — the step opens with the draft's committed selections; Path A arrives with all five sections already filled from the BOM (M06-27).
- **Empty** (base) = **all-empty-0of5** — Path B with no components: all five sections show Empty, the counter reads "0/5", and Generate blocks jumping here (§M06.5 acceptance).
- **Error** (base) — a failed pick or sheet commit acknowledged honestly; selections preserved.
- **partially-selected** — some sections Selected, some Empty; the counter shows the live X/5; statuses per section (M06-27).
- **complete-counter-satisfied** — every category selected; "Components Selected X/5 ✓" satisfied — a duplicated proposal arrives with the counter already satisfied (§M06.5 acceptance).
- **component-edit-sheet** — the per-type bottom sheet with Brand Name locked, the type's census field list, Description capped at 110 chars, Cancel · Done (M06-29).
- **inline-add-flow** — a missing product added in-flow by single form, datasheet PDF, or spreadsheet import, without leaving step 8; the created SKU is picked in place (M06-28; extraction is review-before-commit per `M01-39`/`M01-40`, §M06.5 edge case). Offered only to holders of the M01 catalog grant.
- **battery-section-present** — a battery added at step 3: the Battery section exists, the counter's denominator includes it (the counter counts categories, not items; Battery joins the denominator only when a battery exists — §M06.5 behavior detail), and the payable includes battery cost (M06-30). Removing the battery at step 3 removes the section — with the removal stated, never silent.
- **gate-blocked-missing-highlighted** — Generate tapped with categories missing: hard block; the failure jumps here with exactly the missing categories highlighted; the counter is the gate (M06-27, M06-23(a), `S6B.wrong.4`).
- **archived-line-flagged** — a product archived while the draft references it: the draft keeps its components — archive affects pickers, never history (`M01-42` via §M06.5 edge case); a duplicated proposal's archived line stands and the picker flags it on the next edit (`M05-43`'s honesty, §M06.8 behavior detail).

## Data volume

Five sections — six with Battery — each with status, add action and brand rows (✎ edit / ✕ remove); count fields on Panel and Inverter. Design at a realistic residential selection (one brand row per category) and verify the layout holds when a category carries multiple brand rows. The picker behind ＋ add is `modules/M05` §M05.6's surface with its own data volumes — not drawn here. One bottom sheet per type for editing.

## Numbers carrying provenance

- **"Components Selected X/5 ✓"** counter and per-section Selected/Empty statuses — gate state, not provenance-tiered figures; Battery joins the denominator only when a battery exists (§M06.5 behavior detail).
- **Count fields for Panel and Inverter** — rep-entered quantities on the selected lines.
- **Battery capacity kWh · chemistry · warranty** in the Battery edit sheet — entered data (M06-30).
- Component lines carry their **catalog-resolution provenance** (tenant override / tenant item / platform item / custom) and their **F8 tier** (`F8-02`), and are immutable with their proposal version (`M06-31`, §M06.5) — Path A lines arrive `derived` from the BOM, picked-from-catalog lines are `assumed` (M06-03). No money renders on this step — component pricing lives in the money block (SCR-M06-05) and the BOM detail (SCR-M06-14).
