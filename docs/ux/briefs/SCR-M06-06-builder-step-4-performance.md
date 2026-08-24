# SCR-M06-06 · Builder Step 4 — Performance Metrics

Generation metrics with AI auto-fill, tabbed chart and reset.

**Module:** M06 · Proposals · **Personas:** Sales Executive (primary), Sales Manager, EPC Owner, Design Engineer · **Context of use:** inside the builder shell (SCR-M06-02), phone or desk, fully workable at 375 px (`D2`, `F7-30`). In Quick mode this step is hidden but **AI-filled** — the field set stays complete (M06-18); it is reached there only via "review the rest" or a Generate-failure jump into the full rail (§M06.3 behavior detail). Fields commit on blur (§M06.2).

## Entry & exit

Reached from: the builder shell — any chip, Back/Next, or a Generate-failure jump, in any order and any state (M06-22, R12). On Path A the step arrives pre-filled `derived` from the real shading simulation; without a design it is AI auto-filled `estimated` (M06-03). Leads to: any step via free navigation.

## Requirements (verbatim)

### docs/prd/modules/M06-proposals.md

- **M06-10** (P0) — **Step 4 · Performance Metrics:** ✦ AI Auto-fill · chart with **Generation / Savings / ROI** tabs · Efficiency / PR % \* (**50–100**) · seasonal generation dip % \* (**0–50**; the source's label for the market's monsoon season is pack vocabulary — `F1-22`, the IN pack names it "Monsoon dip") · Units per kW/day \* · ↺ **Reset to AI values**. AI-filled values are `estimated` (`F8-02`); the energy source of record and its labelling are `F8-08`/`F8-09`'s (consumed — "Real · PVGIS ({database})" vs "Built-in estimate ±10%" ride every generation figure).

## States

- **Loading** (base) — the step opens with the draft's committed values; the AI fill is an explicit act, never a silent background commit (§M06.2 behavior detail).
- **Empty** (base) — required (\*) fields unfilled show as the chip's incomplete dot and Generate-gate completeness — never a disabled Next (M06-22).
- **Error** (base) — a failed AI fill or commit acknowledged honestly; existing values preserved.
- **derived-prefilled** — Path A: generation from the real shading simulation, `derived` (M06-03).
- **ai-filled-estimated** — ✦ AI Auto-fill run: every filled figure labelled `estimated` (`F8-02`); nothing AI-filled is ever silently committed as a stronger tier (§M06.2 behavior detail).
- **manually-edited** — AI values edited like any field; implausible AI values are simply editable, and the labels never claim more than `estimated` (§M06.2 edge case).
- **reset-to-ai** — ↺ Reset to AI values restores the AI values after manual edits (M06-10; §M06.2 acceptance).

## Data volume

One form (three required numeric fields) plus the tabbed chart with three tabs — Generation / Savings / ROI. Chart data spans the figures the AI fill or design derivation produces; design the tabs at realistic yearly/seasonal series, not single points.

## Numbers carrying provenance

Every figure carries its F8 tier (`F8-02`) in the design:

- **Efficiency / PR %** (50–100), **seasonal generation dip %** (0–50; label is pack vocabulary — the IN pack names it "Monsoon dip"), **Units per kW/day** — `derived` on Path A, `estimated` when AI-filled, and editable manual values never claim more than their tier.
- **Chart figures across the Generation / Savings / ROI tabs** — same tiers as their inputs.
- **The energy source label rides every generation figure**: "Real · PVGIS ({database})" vs "Built-in estimate ±10%" (`F8-08`/`F8-09`, consumed).
