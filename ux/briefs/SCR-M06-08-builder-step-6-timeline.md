# SCR-M06-08 · Builder Step 6 — Project Timeline

Reorderable project phase rows seeded from the tenant timeline template.

**Module:** M06 · Proposals · **Personas:** Sales Executive (primary), Sales Manager, EPC Owner (the persona who feels the templates — their timeline defaults pre-fill here, §2), Design Engineer · **Context of use:** inside the builder shell (SCR-M06-02), phone or desk, fully workable at 375 px (`D2`, `F7-30`) — reordering must work with touch. In Quick mode this step is hidden and **filled from the tenant default** (timeline template — M06-18); reached there only via "review the rest" or a Generate-failure jump into the full rail (§M06.3 behavior detail). Fields commit on blur (§M06.2).

## Entry & exit

Reached from: the builder shell — any chip, Back/Next, or a Generate-failure jump, in any order and any state (M06-22, R12). Leads to: any step via free navigation. Reset targets the tenant's timeline template (`M01-52` consumed) — the template itself is edited in M01's settings, not here.

## Requirements (verbatim)

### prd/modules/M06-proposals.md

- **M06-12** (P0) — **Step 6 · Project Timeline:** reorderable phase rows (⌃ / ⌄ arrows, 🗑 delete), each with Title \* (char count) + Description \* (char count) · ↺ **Reset to System Default** (the tenant's timeline template, `M01-52` consumed) · ＋ Add Step.

## States

- **Loading** (base) — the step opens seeded from the tenant's timeline template (`M01-52`) or the draft's committed rows; a tenant who never opened settings still has working platform defaults (M06-18's default law, `M01-53`).
- **Empty** (base) — all rows deleted: the add action remains; required (\*) Title/Description gaps feed the Generate gate, never a disabled Next (M06-22).
- **Error** (base) — a failed commit acknowledged honestly; rows preserved.
- **reordering** — phase rows move via ⌃ / ⌄ arrows; 🗑 deletes a row; ＋ Add Step appends (M06-12).
- **reset-to-system-default** — ↺ Reset to System Default restores the tenant's timeline template (M06-12, `M01-52`). Tenant defaults changed while a draft is open never apply retroactively — the draft keeps what it was filled with (§M06.3 edge case).
- **empty-phase-validation** — a row with Title or Description unfilled: the required (\*) markers are completeness metadata consumed by the Generate gate (§M06.2 preamble) — shown as a gap with char counts, never blocking navigation.

## Data volume

A reorderable list of phase rows seeded from the tenant's timeline template plus any added steps — the PRD fixes no row count; design for a realistic template-length list that still reorders comfortably at 375 px, each row carrying Title + Description with char counts.

## Numbers carrying provenance

- **Char counts** on Title and Description — interface feedback, not provenance-tiered figures.
- No money, generation or date figures render on this step; the timeline rows are titled phases, not dated commitments (no dates appear in the step's field set — M06-12).
