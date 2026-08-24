# SCR-M06-01 · Proposal Entry

Choose path (with/without design) and Quick vs full mode when creating a proposal.

**Module:** M06 · Proposals · **Personas:** Sales Executive (primary), Sales Manager, EPC Owner, Design Engineer · **Context of use:** mobile emphasis is real, not nominal — the source's Path B scene is *"the rep is standing in their living room"* (`S6B.rule.two-paths`), phone in hand, often mid-conversation with the customer; fully workable at phone width (`D2`, `F7-30`). Desk use for C&I and Path A entries.

## Entry & exit

Reached from: (1) **Lead detail → Create proposal** (lead surface `M02-32`; M06-05) — the product asks "With design or without?"; (2) **Design complete → Generate proposal** (the `M05-61` hand-off) — entry point (2) never asks: *"the design is the path"* (§M06.1 behavior detail), so on this entry the path prompt is skipped; (3) **Duplicate an earlier proposal** (M06-05; §M06.8) — every step pre-filled from it. Leads to: the eleven-step builder (SCR-M06-02) on Path A or Path B, in Quick mode or full mode per the entry toggle (M06-19; Quick mode per M06-18). The Proposal Type modal fires after step 1, inside the builder — not here (M06-06, SCR-M06-03's scope).

## Requirements (verbatim)

### docs/prd/modules/M06-proposals.md

- **M06-05** (P0) — **Three entry points into the builder:** (1) **Lead detail → Create proposal** → the product asks "With design or without?" (Path choice; lead surface `M02-32`, consumed). (2) **Design complete → Generate proposal** — straight into Path A with most steps filled (the `M05-61` hand-off, consumed). (3) **Duplicate an earlier proposal** — every step pre-filled from it, components included: *"the fastest path of all, and how repeat residential jobs should actually work."* Duplicate is a first-class entry point, not buried (§M06.8).
- **M06-18** (P0) — **Quick mode is committed scope — the same builder, one toggle.** The source's observation: *"Eleven steps is a lot for Path B."* Quick mode shows **only steps 1, 3, 8 and 10** (company, system, components, client), **AI-fills 4 and 5**, and fills **6, 7, 9 and 11 from tenant defaults** (`M01-53`, consumed — timeline template, default tranche template, default T&C, bank details; a tenant who never opened settings still has working platform defaults), with a **"review the rest"** link into the full rail. Full mode stays for C&I. *"Same builder, one toggle"* — never a second proposal system. _(non-UI half, build-side: hidden steps 6/7/9/11 filled from tenant defaults, 4/5 AI-filled — the field set stays complete — for awareness, not for drawing)_
- **M06-19** (P0) — **Entry and loss-free expansion.** The mode is an **entry toggle on the proposal entry surface** (`UXG-09`: "Entry toggle on ProposalEntry"); expanding to the full builder is **loss-free** — everything entered, AI-filled or defaulted in Quick mode is exactly what the full rail shows, nothing re-entered, nothing discarded, and the expansion is available at any point before and after Generate (a generated Quick proposal opens in the full builder for its next version). _(non-UI half, build-side: loss-free expansion invariant: nothing re-entered or discarded, before or after Generate — for awareness, not for drawing)_

## States

- **Loading** (base) — the entry surface opens from a one-tap action on the lead; it must not block on lookups.
- **Empty** (base) — the default decision surface for a lead with no design: path choice plus the Quick/full entry toggle, nothing pre-decided.
- **Error** (base) — a failed create is acknowledged honestly; the lead context is preserved.
- **path-choice** — "With design or without?" asked only when the choice is real (§M06.1 behavior detail).
- **design-exists-notice** — the lead has an approved design and the rep picks "without design": the choice stands (free product, honest labels — the proposal is indicative even though a design exists); the entry sheet states that a design exists and Path A is available (§M06.1 edge case).
- **quick-mode-toggle** — the Quick/full entry toggle on this surface (M06-19, `UXG-09`); Quick shows only steps 1, 3, 8, 10 downstream (M06-18).
- **no-path-prompt-from-studio** — entry point (2), Design complete → Generate proposal: the prompt never appears; the builder opens straight on Path A (M06-05, §M06.1 behavior detail).

## Data volume

A single decision surface: one lead's context, at most one design-exists notice, two choices (path, mode). No lists render here — duplicate as an entry point is invoked from where proposals are listed (§M06.8), not browsed here.

## Numbers carrying provenance

None — this surface renders no money, quantity or date figures. The provenance consequences of the choice made here (derived vs estimated/assumed per `F8-02`) land on the builder steps and the document, not on this screen.
