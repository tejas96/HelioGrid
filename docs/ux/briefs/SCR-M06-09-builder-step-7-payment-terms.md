# SCR-M06-09 · Builder Step 7 — Payment Terms

Tranche split editing from named templates with live 100% allocation feedback.

**Module:** M06 · Proposals · **Personas:** Sales Executive (primary), Sales Manager, EPC Owner (their payment-term defaults pre-fill here, §2), Design Engineer · **Context of use:** inside the builder shell (SCR-M06-02), phone or desk, fully workable at 375 px (`D2`, `F7-30`). In Quick mode this step is hidden and **filled from the tenant default** (default tranche template — M06-18); a tranche template that no longer sums after an edit elsewhere surfaces as a Generate failure jumping into the full rail at this step (§M06.3 behavior detail). Fields commit on blur (§M06.2).

## Entry & exit

Reached from: the builder shell — any chip, Back/Next, or a Generate-failure jump (tranche completeness failures land here with the remainder stated), in any order and any state (M06-22, M06-23(d), R12). Leads to: any step via free navigation. Downstream, past this module: the quoted tranche schedule on the generated version becomes the project's collection schedule at Won (`modules/M11`, `DOC04.tranches-money-path` — build-side, not drawn here).

## Requirements (verbatim)

### docs/prd/modules/M06-proposals.md

- **M06-13** (P0) — **Step 7 · Payment Terms:** ↺ Reset + the tenant's named tranche templates (platform-seeded splits per `M01-54`, consumed — the source names 10/60/20/10 and 30/60/10) · tranche rows (label + % + ✕) · ＋ Add tranche · progress bar + validation: **"Total allocation must = 100%"** — post-`R12` this is a **Generate-time block**, shown live as feedback and enforced only at Generate with the remainder stated ("12% unallocated", `S6B.wrong.3`). The quoted tranche schedule on the generated version becomes the project's collection schedule at Won (`modules/M11`, `DOC04.tranches-money-path` — cited, M11's half). _(non-UI half, build-side: tranche total must equal 100% — live feedback only, hard enforcement solely at Generate — for awareness, not for drawing)_

## States

- **Loading** (base) — the step opens seeded from the tenant's default tranche template (`M01-54`) or the draft's committed rows; platform-seeded splits exist for a tenant who never opened settings (M06-18's default law).
- **Empty** (base) — no tranche rows: the add action and templates remain; the 100% gap renders as live feedback and a Generate-gate failure, never a disabled Next (M06-22).
- **Error** (base) — a failed commit acknowledged honestly; rows preserved.
- **allocation-incomplete-remainder** — the progress bar and validation show the live gap with the remainder stated ("12% unallocated") — feedback only; the hard block fires solely at Generate (M06-13, `S6B.wrong.3`).
- **allocation-complete** — total allocation = 100%: the live feedback reads satisfied; the same arithmetic is what the Generate gate checks (M06-23(d)).
- **template-applied** — one of the tenant's named tranche templates applied (the source names 10/60/20/10 and 30/60/10); rows populate from the template, then remain editable (M06-13, `M01-54`).

## Data volume

A short list of tranche rows (the source's named templates are four-tranche and three-tranche splits) plus ＋ Add tranche — design for a handful of rows, each label + % + ✕, with the progress bar and remainder line always visible at 375 px.

## Numbers carrying provenance

- **Tranche percentages** and the **total-allocation figure vs 100%** with the stated remainder ("12% unallocated") — rep-entered or template-seeded splits; live arithmetic feedback, hard-enforced only at Generate (M06-13). These are allocation data, not provenance-tiered computed figures; the money they eventually govern (the collection schedule at Won) is `modules/M11`'s surface, not this screen's.
- No currency amounts render on this step — the rows carry label + % only (M06-13).
