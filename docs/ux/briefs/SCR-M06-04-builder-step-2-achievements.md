# SCR-M06-04 · Builder Step 2 — Achievements

Optional company credibility numbers for the proposal cover.

**Module:** M06 · Proposals · **Personas:** Sales Executive (primary), Sales Manager, EPC Owner, Design Engineer · **Context of use:** inside the builder shell (SCR-M06-02), phone or desk, fully workable at 375 px (`D2`, `F7-30`). Not among Quick mode's shown steps (Quick shows only 1, 3, 8, 10 — M06-18); it stays reachable through the full rail and the "review the rest" link. Fields commit on blur (§M06.2 behavior detail).

## Entry & exit

Reached from: the builder shell — any chip, Back/Next, or a Generate-failure jump, in any order and any state (M06-22, R12). Leads to: any step via free navigation. The step is optional and skippable (M06-08) — skipping costs nothing and blocks nothing.

## Requirements (verbatim)

### docs/prd/modules/M06-proposals.md

- **M06-08** (P0) — **Step 2 · Achievements (optional, skippable):** About your company (textarea, "shown on proposal cover") · Total capacity installed (kW) → e.g. "200 kW" · Happy customers → "350+" · Cities served → "10+". **Numbers only; units auto-added.**

## States

- **Loading** (base) — the step opens with whatever the draft already holds; nothing recomputes.
- **Empty** (base) — the blank optional form; being empty is a legitimate final state, not a gap: the step is optional and skippable, so empty never shows as an incomplete dot or a Generate failure (M06-08).
- **Error** (base) — a failed commit acknowledged honestly; entered values preserved.
- **normal** — textarea plus the three numeric fields with their auto-added unit renderings ("200 kW", "350+", "10+") (M06-08).
- **skipped** — the step left untouched; the proposal generates without achievements content.
- **non-numeric-refused** — the numeric fields accept numbers only; non-numeric input is refused (M06-08; §M06.2 acceptance: "units are auto-added and non-numeric input is refused").

## Data volume

One short optional form: one textarea and three numeric fields. No lists.

## Numbers carrying provenance

- **Total capacity installed (kW)**, **Happy customers**, **Cities served** — tenant-typed credibility claims rendered with auto-added units on the proposal cover. The PRD attaches no computed F8 tier to these beyond their nature as tenant-authored content; they are never presented as product-computed figures, and the design must not dress them as calculations (the honesty frame of M06-04/`F8-02` governs computed figures elsewhere).
- No money or date figures render on this step.
