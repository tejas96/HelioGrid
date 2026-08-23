# SCR-M08-01 · Project Board

Won deals as stage-columned cards showing days-in-stage, collected-vs-due money and blocker flags; the module's home.

**Module:** M08 · **Personas:** Project Manager · EPC Owner · Operations · Sales Manager · Sales Executive (read-only on their own won deals) · **Context of use:** the Project Manager's home surface — web/desk for the full board scan; phone on site for stage moves, blocker updates and the single-column view; the Sales Executive opens it mid-call to answer a customer without asking ops.

## Entry & exit

Reached from: it is the M08 module's home, and the Project Manager's home screen *is* this board (PS-21, M13-34); a project lands on it automatically the moment a rep confirms Mark won on a lead (per `prd/modules/M08-projects.md` — creation is invisible, no wizard). Leads to: Project Detail (SCR-M08-02) by opening a card; the Document Checklist (SCR-M08-03) directly from the card (per the PRD, "the checklist is reachable from the card as well as the detail screen"); the set-blocker sheet and the cancel confirm are card actions; a stage move is a card action (drag on desktop, an explicit move on mobile) that opens the confirm with the target stage's pack label. Cancelled projects leave the active board and remain reachable through the project list with their state and reason (per the PRD's M08.9 behavior detail). Other exits: not pinned by PRD — designer decides, note the decision.

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

### From prd/modules/M08-projects.md

- **M08-10** (P0) — **The board is won deals as cards, columned by stage.** Each card carries: customer · system size · value · **days in the current stage** · **payment collected against payment due** · the blocker flag with the party being waited on. Desktop shows the full board; **mobile shows one column with a stage filter**. Cards are ordered oldest-first within a column so what has waited longest is what is seen first.
- **M08-11** (P0) — **Days-in-stage is the board's metric — the only one.** Not percentage complete, not a burndown, not a progress bar, not a health score. *"Days-in-stage is the only metric that matters on the board … 'this one has been in inspection for 34 days' is the whole insight."* Every other number on a card is a fact (size, value, collected, due), never a computed judgement.
- **M08-12** (P0) — **Aged cards surface rather than sink.** A project sitting unusually long in one stage rises — to the top of its column, and into the owner's and Operations' views — carrying its days-in-stage and its blocker if it has one. Ageing is **relative**: oldest-first ordering and the days figure itself, with no invented threshold constant anywhere in this module; any notification threshold on top of it is `foundations/F6`'s, and the portfolio aging report is `modules/M13`'s.
- **M08-14** (P1) — **A stage move is recorded on the timeline with its actor and its timestamp, and it is never silently reversible.** Moving a project backwards is allowed — real installations go backwards — and is recorded as its own event with the same weight as moving forward, so the days-in-stage history stays truthful rather than being rewritten. _(non-UI half, build-side: online-first write; append-only actor-stamped timeline event; backward moves recorded with equal weight, history never rewritten — for awareness, not for drawing)_
- **M08-21** (P0) — **Every blocker carries a reason, the date the wait started, and an expected-until date where one is known.** The start date is set when the blocker is set and is never back-edited silently; the expected-until is the honest estimate, editable, and its absence is shown as absence rather than as an empty date. Clearing a blocker records who cleared it and when, so the wait has a measured length rather than a remembered one. _(non-UI half, build-side: start date never silently back-edited; clearing records who and when so waits have measured lengths — for awareness, not for drawing)_
- **M08-51** (P0) — **A project may be cancelled from any stage, the reason is mandatory, the state is terminal, and revenue stops counting immediately.** *"Reporting must not silently keep counting it as revenue."* Won means signed, and a deal cancelled after Won never quietly persists in a total — the reporting consequence is `modules/M13`'s and the honesty law is `F8-32`'s; the state, the mandatory reason and the immediacy are this module's. _(non-UI half, build-side: terminal state; revenue stops counting immediately across all reporting — for awareness, not for drawing)_

### From prd/modules/M13-dashboards-and-reporting.md

- **M13-34** (P0) — **Project Manager — home: their projects ordered by days-in-stage, blockers first** — each card: customer, size, value, days in current stage, payment collected vs due, blocker flag with who is being waited on (card facts `M08`'s; ageing per M13-25).

### From prd/02-personas.md

- **PS-21** (P0) — The Project Manager's **home screen is their projects ordered by days-in-stage, blockers first** — each card showing customer, size, value, days in the current stage, payment collected against payment due, and the blocker flag with who is being waited on.

## States

Base states (always designed): loading · empty · error.

Screen-specific states from the slice:

- **normal** — the full board, columns per canonical stage with pack labels, cards oldest-first.
- **empty-column-teaching / empty-teaching** — a stage with no projects says so in its column; empty states teach rather than blank.
- **no-won-deals-yet** — a tenant with no won deals yet sees what will land here and where it comes from.
- **mobile-single-column-filter / mobile-single-column (stage filter)** — the board on a phone: one column with a stage filter.
- **stage-move-confirm** — the move confirm carrying the target stage's pack label.
- **skippable-stage-offer** — where the pack marks the next stage skippable and this project does not need it, the move offers the following stage instead.
- **move-waiting-server** — the move waits visibly until it reaches the server.
- **set-blocker-sheet** — pick the party (the pack's four labels and nothing else), give the reason, optionally an expected-until.
- **blocker-flagged / blocker-flag** — the card's blocker flag names the party being waited on.
- **aged-card-surfaced** — an aged card risen to the top of its column carrying its days-in-stage and its blocker if it has one.
- **cancel-confirm** — mandatory reason, explicit confirm that states what happens ("this project stops counting as revenue immediately"), no undo.
- **read-only-scoped** — the Sales Executive's board: only their own won deals are on it, every card reads in full (customer, size, value, days-in-stage, collected against due, the blocker flag with the party), and no control mutates anything — no drag, no stage move, no set-blocker sheet, no cancel; a preset with read scope and no capability sees the card and no card action — the same board, scoped.

Every stage, blocker and payment state renders as a label plus a mark — never colour alone (F7-12; behavior, not styling).

## Data volume

A full tenant portfolio: won deals spread across all nine stage columns — design at the product's ruled realistic list scale (the 200-record order of the 200-lead list), not five demo cards. Columns hold enough cards to force internal scrolling; days-in-stage values span from single digits to 34+ days so oldest-first ordering is visibly doing work; several cards carry blocker flags across all four parties; at least one column is empty (teaching state) at the same time others are full.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier (measured / derived / estimated / assumed) in the design:

- System size on each card.
- Project value on each card.
- Days in the current stage on each card (the board's only metric).
- Payment collected against payment due on each card (money — never a stale figure).
- Blocker wait-start date and expected-until date where shown on the blocker sheet/flag; an absent expected-until renders as absence, never as an empty date.
