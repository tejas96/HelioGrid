# SCR-M07-02 · Mark Won

Capture final value and expected install date; confirming creates the project atomically.

**Module:** M07 · Sales Execution · **Personas:** Sales Executive (mobile-first, primary closer), Sales Manager (team leads), EPC Owner — `F2.M07.mark-won-lost`, scope follows lead visibility · **Context of use:** the close moment — often on the phone straight after the customer's yes, sometimes at a desk; mark-won touches money — it creates the project's money schedule (M07 §M07.12 behavior detail).

## Entry & exit

Reached from: the lead — Mark won is one of the close surfaces on a lead (M07 §1); a customer Accept on the link notifies the rep, and the rep still marks Won — human confirms, then the project exists (M07-62). Leads to: on confirm the project exists immediately (`modules/M08`'s object) with no re-entry of customer data, and the lead shows won (M07 §M07.12 acceptance). Post-confirm destination is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### prd/modules/M07-sales-execution.md

- **M07-62** (P0) — **Mark won captures the final value and the expected install date — and creates the project, atomically, in the same act.** There is no separate "create project" step; nobody re-enters the customer (*"a won deal is a project"* — `S8.rec.1`, `modules/M08`'s object; the transition's atomicity is `M02-57` consumed). A customer Accept on the link notifies the rep; **the rep still marks Won — human confirms, then the project exists** (`DOC04.accepted-human-confirms` — cited, `foundations/F5`'s row). _(non-UI half, build-side: atomically creates the project in the same act; no customer re-entry — for awareness, not for drawing)_

## States

- **Loading** (base) — opening the surface with the lead and its accepted proposal context.
- **Empty** (base) — no true empty: the surface always opens against a specific lead; the install-date field starts unfilled and is required.
- **Error** (base) — save failure acknowledged honestly; entered value and date preserved.
- **prefilled-final-value** — final value pre-fills from the accepted proposal version (`modules/M06`'s object; M07 §M07.12 behavior detail), editable as the final value.
- **install-date-required** — the expected install date is required before confirm (M07 §M07.12 behavior detail).
- **project-created-confirm** — the confirmation that the project now exists, in the same act, with the proposal's tranche schedule as its collection schedule (`modules/M11`'s money path — cited in M07 §M07.12 behavior detail); the lead shows won and the act lands on the timeline with its actor.

## Data volume

A single act on one lead: two captured facts (final value, expected install date) plus confirm. Where an acceptance record exists from the customer link, it is attached from the link's events (`foundations/F5`; M07 §M07.12 edge cases) — one attached record, not a list.

## Numbers carrying provenance

- **Final value** — money, pre-filled from the accepted proposal version and confirmed by the rep; tenant-currency pack formatting (F1-46); carries its F8 provenance tier in the design.
- **Expected install date** — a rep-entered commitment date, rendered on the tenant's timezone.
