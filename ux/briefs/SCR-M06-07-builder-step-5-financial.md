# SCR-M06-07 · Builder Step 5 — Financial Data

Savings, payback and lifetime figures with AI auto-fill and projection labels.

**Module:** M06 · Proposals · **Personas:** Sales Executive (primary), Sales Manager, EPC Owner, Design Engineer · **Context of use:** inside the builder shell (SCR-M06-02), phone or desk, fully workable at 375 px (`D2`, `F7-30`). In Quick mode this step is hidden but **AI-filled** — the field set stays complete (M06-18); reached there only via "review the rest" or a Generate-failure jump into the full rail (§M06.3 behavior detail). Fields commit on blur (§M06.2).

## Entry & exit

Reached from: the builder shell — any chip, Back/Next, or a Generate-failure jump, in any order and any state (M06-22, R12). On Path A the step arrives pre-filled `derived` — savings/payback from the real BOM pricing; without a design it is AI auto-filled `estimated` (M06-03). Leads to: any step via free navigation.

## Requirements (verbatim)

### prd/modules/M06-proposals.md

- **M06-11** (P0) — **Step 5 · Financial Data:** ✦ AI Auto-fill · the same tabbed chart · Yearly savings \* (tenant currency) · Payback years \* · Lifetime savings \* (25-year horizon; the source's compact "lakhs" figure is the IN pack's number format, `F1-46` via `F3-20`) · Electricity inflation % \* (source default ≈6%) · ↺ Reset to AI values. Financial projections carry the projection honesty label and travel with their assumptions (`F8-23`, consumed).

## States

- **Loading** (base) — the step opens with the draft's committed values; AI fill is an explicit act, never silent (§M06.2 behavior detail).
- **Empty** (base) — required (\*) fields unfilled show as the chip's incomplete dot and Generate-gate completeness — never a disabled Next (M06-22).
- **Error** (base) — a failed AI fill or commit acknowledged honestly; existing values preserved.
- **derived-prefilled** — Path A: savings/payback from the real BOM pricing, `derived` (M06-03).
- **ai-filled-estimated** — ✦ AI Auto-fill run: every filled figure labelled `estimated` (`F8-02`); manual edits stay editable like any field and never claim a stronger tier (§M06.2 behavior detail, edge case).
- **reset-to-ai** — ↺ Reset to AI values restores the AI values after manual edits (M06-11; §M06.2 acceptance).

## Data volume

One form (four required fields) plus the same tabbed chart as step 4 (Generation / Savings / ROI — M06-10). Design at a 25-year projection horizon with the pack's compact number format for large money figures (`F1-46` via `F3-20`) — lifetime savings at realistic magnitude, not toy values.

## Numbers carrying provenance

Every figure carries its F8 tier (`F8-02`) and, being financial projections, the projection honesty label travelling with its assumptions (`F8-23`):

- **Yearly savings** (tenant currency) — `derived` on Path A, `estimated` when AI-filled.
- **Payback years** — same tiers.
- **Lifetime savings** (25-year horizon; compact rendering per the pack's number format, `F1-46` via `F3-20`) — same tiers.
- **Electricity inflation %** (source default ≈6%) — an assumption the projections travel with (`F8-23`).
- **Chart figures** across the tabs — same tiers as their inputs. The proposal type chosen at step 1 drives the projection honesty label wording on these figures (M06-06, `F8-23`).
