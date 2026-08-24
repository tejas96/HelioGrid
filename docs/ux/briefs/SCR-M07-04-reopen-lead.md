# SCR-M07-04 · Reopen Lead

Bring a lost lead back at its prior funnel stage with the reopen on the timeline.

**Module:** M07 · Sales Execution · **Personas:** Sales Executive (mobile-first), Sales Manager, EPC Owner — `F2.M07.mark-won-lost`, scope follows lead visibility · **Context of use:** the customer came back — the rep acts from the lead record, phone or desk; a lightweight single act, not a flow.

## Entry & exit

Reached from: a lost lead (M07-64 — only lost leads can be reopened); postponed losses also come back without this surface, auto-resurfacing on their date (M07-64). Leads to: the lead re-enters at its prior funnel stage and the timeline records the reopen (M07-64; M07 §M07.12 acceptance). Post-reopen destination is not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-64** (P0) — **Reopen: a lost lead can come back — it re-enters at its prior funnel stage and the timeline records the reopen; postponed losses auto-resurface on their date without anyone remembering them.** _(non-UI half, build-side: postponed losses auto-resurface on their date without anyone remembering — for awareness, not for drawing)_

## States

- **Loading** (base) — opening against the lost lead.
- **Empty** (base) — no true empty: the act always runs against a specific lost lead.
- **Error** (base) — failure acknowledged honestly; the lead stays lost until the reopen succeeds.
- **prior-stage-restored** — the reopened lead lands at its prior funnel stage, and the timeline records the reopen (M07-64).
- **auto-resurfaced-postponed** — the system-driven sibling: a postponed loss resurfaces on its date at 09:00 tenant-local with a follow-up task, without anyone remembering it (M07-64; M07 §M07.12 acceptance) — the design must distinguish a human reopen from an automatic resurface on the timeline.

## Data volume

A single act on one lead. The visible consequence is one timeline entry (the reopen, with actor) and the restored prior stage. No lists on this screen.

## Numbers carrying provenance

- **The postponed resurface date** — the date a postponed loss comes back on (auto-resurface at 09:00 tenant-local, M07 §M07.12 acceptance); rendered on the tenant's timezone.
- **The reopen timeline entry's timestamp** — a server-recorded fact.
- No money figures appear on this screen.
