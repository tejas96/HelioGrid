# SCR-M06-03 · Builder Step 1 — Company

Company identity fields from the business profile plus logo; the proposal-type sheet fires after.

**Module:** M06 · Proposals · **Personas:** Sales Executive (primary), Sales Manager, EPC Owner, Design Engineer · **Context of use:** inside the builder shell (SCR-M06-02), phone in the field or desk; fully workable at 375 px (`D2`, `F7-30`). Present in Quick mode (steps 1, 3, 8, 10 — M06-18). Every field commits on blur (§M06.2 behavior detail).

## Entry & exit

Reached from: the builder shell — first step in the default reading order, but reachable from any chip, Back/Next or Generate-failure jump in any order and any state (M06-22, R12). Leads to: after step 1 the Proposal Type modal fires (M06-07 → M06-06's bottom sheet, drawn as a state of this screen); then any step via free navigation. The locked account fields are edited in tenant settings, not in the builder (M06-07) — that surface is M01's, outside this screen.

## Requirements (verbatim)

### prd/modules/M06-proposals.md

- **M06-06** (P0) — **Proposal type: CAPEX or OPEX/PPA — a document type only.** The Proposal Type modal (bottom sheet after step 1: drag handle, "Choose proposal type", two radio cards — **CAPEX**, purchase outright / **OPEX / PPA**, per-unit billing to the customer; Back · Continue) sets the proposal `type`. Per ruling `R17`, **nothing downstream branches on it except the rendered document and the honesty label on financial projections** (`F8-23`, consumed): the document renders per-unit terms; the project after Won tracks the same stages and checklist (`modules/M08`); no recurring invoicing, no meter ingestion (§5). **The type is UNGATED on every tier — final (owner ruling 2026-08-04, Q29)**; no proposal-type entitlement key exists (`M12-20`). _(non-UI half, build-side: R17: type branches nothing downstream except document and projection label; ungated on every tier — for awareness, not for drawing)_
- **M06-07** (P0) — **Step 1 · Company:** Phone number \* (locked, linked to the account) · Company name \* · Email address \* (locked, linked) · Website · Company address · Company logo — swatch + Change logo (**max 5 MB · 12×6 cm · PNG/JPG**, validated on upload with the actual limits stated). Values come from the business profile (`M01-31`, consumed — asked once, never re-asked here); the locked fields are edited in tenant settings, not in the builder. After step 1 the Proposal Type modal fires (`M06-06`).

## States

- **Loading** (base) — values arrive pre-filled from the business profile (`M01-31`); the form never opens blank for a configured tenant.
- **Empty** (base) — required (\*) fields unfilled render as the chip rail's incomplete dot and the Generate gate's completeness check — never a disabled Next (M06-22, §M06.2 behavior detail).
- **Error** (base) — a failed logo upload or field commit is acknowledged honestly; the rest of the step is preserved.
- **locked-account-fields** — Phone number and Email address locked, linked to the account; editable only in tenant settings (M06-07).
- **logo-upload-invalid** — logo too large / wrong format: validated on upload with the actual limits stated (max 5 MB · 12×6 cm · PNG/JPG) — never a silent failure (M06-07, `S6B.wrong.5`).
- **proposal-type-sheet** — the bottom sheet after step 1: drag handle, "Choose proposal type", two radio cards (CAPEX / OPEX / PPA), Back · Continue (M06-06). Ungated on every tier — no tier chrome, no upsell.

## Data volume

One company form: six fields plus the logo swatch. One bottom sheet with two radio cards. No lists.

## Numbers carrying provenance

- No provenance-tiered figures render on this step — no money, no generation values.
- The logo limits (**max 5 MB · 12×6 cm**) are validation constants stated in the upload copy — fixed product facts, not tiered data (M06-07).
- The choice made in the proposal-type sheet later drives the projection honesty label on financial figures (`F8-23` via M06-06) — that label renders on steps 5/3 and the document, not here.
