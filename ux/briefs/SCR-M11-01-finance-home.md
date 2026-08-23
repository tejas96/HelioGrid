# SCR-M11-01 · Finance Home (Money Due)

Finance's money-due home: due, overdue, receipts awaiting, period collections (composed by M13).

**Module:** M11 (facts, states and figures) · composed by M13 (home composition) · **Personas:** Finance · **Context of use:** web-first desk work — reconciliation, receipts and the period view are dense-screen desk tasks; the overdue list is also consulted on mobile away from the desk (per the Finance persona's primary-surfaces statement in `prd/02-personas.md`).

## Entry & exit

Reached from: sign-in — this is the home screen the product composes for a person holding the Finance preset (`PS-32`, `M13-38`; M13 §M13.5's acceptance: when the person signs in, their home matches their row). Leads to: the Payments Ledger (SCR-M11-02) — M11 §M11.8's behavior detail pins that the payments screen "is reachable from the project (`M08-35`) and from Finance's own home (`M11-54`); it is the same screen in both places." Other exits: not pinned by PRD — designer decides, note the decision.

## Composed home (M13-10, P0 — this screen is a role home)

This screen is the home of one preset on the precedence ladder, and **a person has exactly one
home, never two competing front doors**. Where the same person also holds another preset, that
preset's *today-work* is composed into THIS screen as a block rather than sent to a second home —
the PRD's own worked example is a rep who is also a surveyor landing on My Day **with today's
visits shown inside it**. The person can still switch: the shell's switcher (`SCR-SHELL-01`) lists
the home of every preset they hold. Design the block seams: this screen must be able to host one
or more foreign today-blocks without the layout breaking or the screen's own purpose being buried.
The ladder itself is a product constant, not tenant configuration (`M13-10`, register `Q5`).

## Requirements (verbatim)

### From `prd/modules/M11-payments-and-collections.md`

- **M11-54** (P1) — **Finance's home is money due.** Tranches due now and overdue by project, receipts waiting to be recorded, and the period's collections against what was expected — every figure obeying the money-never-stale law. The composition of the home screen is `modules/M13`'s; the facts, states and figures it composes are this module's. _(non-UI half, build-side: supplies due/overdue/receipts/period figures; composition is M13's — for awareness, not for drawing)_

### From `prd/modules/M13-dashboards-and-reporting.md`

- **M13-38** (P0) — **Finance — home: money due** — tranches due and overdue by project, receipts waiting, period collections vs expected — every figure with `M11-54`'s qualifiers intact (M13-08).

### From `prd/02-personas.md`

- **PS-32** (P1) — The Finance persona's **home screen is money due** — tranches due now and overdue by project, receipts waiting to be recorded, and the period's collections against what was expected — with every figure obeying the money-never-stale rule.

## States

- **Loading** (base).
- **Empty** (base) — empty-teaching: a new tenant whose modules publish nothing yet gets the teaching empty state per home (M13 §M13.5 edge case); nothing is fabricated to fill blocks.
- **Error** (base).
- **Normal** — due now and overdue by project, receipts waiting to be recorded, period collections against expected.
- **Stale-money-qualified** — a figure that cannot be reconciled at display time renders visibly provisional with its qualifier, never presented as settled fact; `M11-54`'s qualifiers stay intact in every block M13 composes (`M13-38`).

## Data volume

Portfolio-wide, not single-project: tranches due and overdue grouped by project across the tenant's active projects, each project carrying a 3–4-tranche schedule (the platform seeds the 10/60/20/10 and 30/60/10 templates, `M01-54`). The Finance persona's day-in-the-life sets the sitting-down volume: three tranches newly due since last look, one overdue long enough to be flagged, two receipts waiting to be recorded — design the lists to stay workable at tens of due/overdue rows across the portfolio.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier in the design (measured / derived / estimated / assumed), and money additionally carries its freshness and confirmation qualifiers, which the composition may not drop (`M13-38`, `M11-54`):

- Amount due per tranche, per project (due now).
- Amount overdue per tranche, per project, and the date it fell due.
- Receipts waiting to be recorded (count and their amounts).
- The period's collections figure.
- The period's expected figure it is shown against.
- Every one of the above: never rendered final while stale; confirmation-state qualifiers intact.
