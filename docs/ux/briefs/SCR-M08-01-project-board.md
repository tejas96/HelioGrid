# SCR-M08-01 · Project Board

Won deals as stage-columned cards showing days-in-stage, collected-vs-due money and blocker flags; the module's home.

**Module:** M08 · **Personas:** Project Manager · EPC Owner · Operations · Sales Manager · Sales Executive (read-only on their own won deals) · **Context of use:** the Project Manager's home surface — web/desk for the full board scan; phone on site for stage moves, blocker updates and the single-column view; the Sales Executive opens it mid-call to answer a customer without asking ops.

**One job:** see which won deals are stuck, and move the ones that can move.
**Order of attention:** 1 the cards that have waited longest, and what each is waiting on · 2 each card's money — collected against due · 3 moving a card, setting a blocker.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **Days-in-stage is the board's only metric (`M08-11`), and that is a rule about what is NOT
drawn:** no percentage, no progress bar, no burndown, no health score, no colour grade — and no
sentence explaining their absence.

| Fact | Kind | Its form here |
|---|---|---|
| Each card — customer, system size, value, days in the stage, collected against due, the blocker and its party (`M08-10`) | data · status | one card: the customer as its title; size and value as its line; days in the stage as the card's ONE headline figure; collected and due as two figures, never a bar; the blocker as a chip naming the party waited on |
| The stage columns | data | each column's header is the pack's stage label and its card count |
| What has waited longest is seen first (`M08-12`) | — | arrangement, no words: oldest first in every column. No "aged" badge, no invented threshold |
| Money due and not yet collected (`M08-37`, `M08-39`) | status | where due is more than collected, the gap carries a word and a mark on the card, never colour alone. It blocks nothing — no move, no document, no customer link |
| Provenance (`F8-07`) | honesty label | one label at the foot of the board serves the figures that share it — never a key above them. A money figure that cannot be reconciled carries its own provisional mark (`F8-12`) |
| Moving a stage (`M08-14`) | action | a drag at 1536 and an explicit move act at 375 (`N1`). The confirm's ONE line names the target stage by its pack label. A move backwards uses the same confirm, with no warning paragraph |
| What a forward move does (`M08-15`, `M08-36`) | data | two label–value rows in the confirm, read before the act: the tranche that becomes due, by its schedule label and amount (none when the stage has no tranche), and that the customer's progress link will show the new stage. Nothing is sent by the move; asking for the money stays the coordinator's act on the project (`M08-38`). A backward move shows neither row |
| The next stage is skippable for this project (`F1-35`, `F1-51`) | action | the confirm offers the following stage instead, and moving through the skippable one stays a second choice. In India the one skippable stage is the pack's incentive claim, for commercial and no-incentive projects |
| The next stage is Handed over (`M08-32`, `M08-46`) | action | the confirm's act starts the handover (SCR-M08-06) instead of moving the card: a project reaches Handed over only through it |
| The centre action (`F7-22`, `M02-06`) | action | *Add lead* on this home, at 375 on the arc and at 1536 as the head's primary (owner ruling 2026-09-24) |
| The move has not reached the server | status | a light pending mark on the card, in place. Never drawn as moved before the server says so |
| Setting a blocker (`M08-20`, `M08-21`) | action | a sheet: the party as a four-way choice of the pack's labels, a reason field, an optional expected-until date. An unknown date reads as a named gap, never as an empty date. Where the party is the utility, the sheet names the utility the site belongs to (`M08-28`), read-only |
| What the customer sees of a blocker (`M08-24`, `M08-25`, `M08-29`) | action line | ONE line at the sheet's act: the customer's link shows who is waited on and the dates — never the reason typed here |
| Clearing a blocker (`M08-21`) | action | an explicit act on the card's blocker; a blocker never expires. The act carries the wait's measured length (*Waited 12 days*), because clearing is what ends the count |
| Cancelling (`M08-51`, `M08-53`, `N8`) | action | a confirm sheet: the mandatory reason, and ONE line — the project stops counting as revenue at once and the product cannot undo it. `N8`'s words are what stays true: the project stays readable in the project list with its state and its reason, and money already received stays recorded (a label–value row with the amount; a refund is recorded on the payments screen, never by the cancel) |
| A person with read scope only | status | the same cards in full, and no act is drawn — no drag handle, no move, no blocker sheet, no cancel. Nothing is greyed, and no card explains permissions |
| An empty stage | teaching | ONE line in its column |
| No won deals yet | teaching | at most two short sentences — what lands here, and where it comes from |
| Another preset's today-work (`M13-10`) | more detail | a compact block above the board with its own title and a row leading to its home. It never pushes the board off the first screenful |
| The board failed to load | error | one banner — what failed and what to do |

## Arrangement

- **375.** One column, chosen by a stage selector that opens on *All stages*: every project, oldest first, each
  card naming its stage; picking a stage narrows it. A composed block is a row.
- **1536.** Every stage at once on one band — its count and its longest wait, *All stages* first — above one
  ranked list of the chosen view, which scrolls inside its own region and proves the portfolio's volume
  (owner ruling 2026-09-24). Grouping by party is the Operations home's (`PS-34`), not this screen's.

## Entry & exit

Reached from: it is the M08 module's home, and the Project Manager's home screen *is* this board (PS-21, M13-34); a project lands on it automatically the moment a rep confirms Mark won on a lead (per `docs/prd/modules/M08-projects.md` — creation is invisible, no wizard). Leads to: Project Detail (SCR-M08-02) by opening a card; the Document Checklist (SCR-M08-03) directly from the card (per the PRD, "the checklist is reachable from the card as well as the detail screen"); the set-blocker sheet and the cancel confirm are card actions; a stage move is a card action (drag on desktop, an explicit move on mobile) that opens the confirm with the target stage's pack label. Cancelled projects leave the active board and remain reachable through the project list with their state and reason (per the PRD's M08.9 behavior detail). Other exits: not pinned by PRD — designer decides, note the decision.

## Composed home (M13-10, P0 — this screen is a role home)

This screen is the home of one preset on the precedence ladder, and **a person has exactly one
home, never two competing front doors**. Where the same person also holds another preset, that
preset's *today-work* is composed into THIS screen as a block rather than sent to a second home —
the PRD's own worked example is a rep who is also a surveyor landing on My Day **with today's
visits shown inside it**. The person can still switch: the shell's switcher (`SCR-SHELL-01`) lists
the home of every preset they hold. Design the block seams: this screen must be able to host one
or more foreign today-blocks without the layout breaking or the screen's own purpose being buried.
The ladder itself is a product constant, not tenant configuration (`M13-10`).

## Requirements (verbatim)

### From docs/prd/modules/M08-projects.md

- **M08-10** (P0) — **The board is won deals as cards, columned by stage.** Each card carries: customer · system size · value · **days in the current stage** · **payment collected against payment due** · the blocker flag with the party being waited on. Desktop shows every stage at once — each with its count and longest wait — above one ranked list of all stages or the chosen stage (owner ruling 2026-09-24); **mobile shows one column with a stage filter**. Cards are ordered oldest-first within a column so what has waited longest is what is seen first.
- **M08-11** (P0) — **Days-in-stage is the board's metric — the only one.** Not percentage complete, not a burndown, not a progress bar, not a health score. *"Days-in-stage is the only metric that matters on the board … 'this one has been in inspection for 34 days' is the whole insight."* Every other number on a card is a fact (size, value, collected, due), never a computed judgement.
- **M08-12** (P0) — **Aged cards surface rather than sink.** A project sitting unusually long in one stage rises — to the top of its column, and into the owner's and Operations' views — carrying its days-in-stage and its blocker if it has one. Ageing is **relative**: oldest-first ordering and the days figure itself, with no invented threshold constant anywhere in this module; any notification threshold on top of it is `foundations/F6`'s, and the portfolio aging report is `modules/M13`'s.
- **M08-14** (P1) — **A stage move is recorded on the timeline with its actor and its timestamp, and it is never silently reversible.** Moving a project backwards is allowed — real installations go backwards — and is recorded as its own event with the same weight as moving forward, so the days-in-stage history stays truthful rather than being rewritten. _(non-UI half, build-side: online-first write; append-only actor-stamped timeline event; backward moves recorded with equal weight, history never rewritten — for awareness, not for drawing)_
- **M08-21** (P0) — **Every blocker carries a reason, the date the wait started, and an expected-until date where one is known.** The start date is set when the blocker is set and is never back-edited silently; the expected-until is the honest estimate, editable, and its absence is shown as absence rather than as an empty date. Clearing a blocker records who cleared it and when, so the wait has a measured length rather than a remembered one. _(non-UI half, build-side: start date never silently back-edited; clearing records who and when so waits have measured lengths — for awareness, not for drawing)_
- **M08-51** (P0) — **A project may be cancelled from any stage, the reason is mandatory, the state is terminal, and revenue stops counting immediately.** *"Reporting must not silently keep counting it as revenue."* Won means signed, and a deal cancelled after Won never quietly persists in a total — the reporting consequence is `modules/M13`'s and the honesty law is `F8-32`'s; the state, the mandatory reason and the immediacy are this module's. _(non-UI half, build-side: terminal state; revenue stops counting immediately across all reporting — for awareness, not for drawing)_

- **M08-15** (P0) — **Completing a stage is the module's one automatic trigger, and it does exactly two things: the matching tranche becomes due (§M08.6) and the customer's progress link updates (`foundations/F5`).** Nothing in this module fires on a clock, and no stage change sends anything to anyone by itself — the request remains the coordinator's one-tap act (`M08-38`, which sends via the tenant's connected transactional channel per owner ruling 2026-08-04, with copy-paste as the no-channel fallback).
- **M08-20** (P0) — **A blocker names who is being waited on, from a closed set of exactly four parties: `utility` · `customer` · `material` · `company`.** The set is canonical and market-neutral; what a user reads for each is the market pack's label (`F1-22`; the India instance labels `utility` per `F1-51`). The source's fourth party is *"us"* — the tenant company itself — and its canonical value name is `company` so that the vocabulary carries across markets and languages unchanged; the pack and locale supply the first-person display. The set is fixed: a fifth party is a ruling, not a tenant setting or a free-text field.
- **M08-25** (P0) — **A blocker's internal reason and its customer-visible framing are two different things, and the module keeps them separate.** A supplier's failure is the company's problem to solve and not the customer's to read: the customer sees the project's honest stage and the fact that material is on order, with an expected date; they do not see the supplier, the internal note, or the commercial detail behind it. What the customer's page renders is `foundations/F5`'s; what this module guarantees is that the internal field is never the published one.
- **M08-36** (P0) — **Completing a stage makes the matching tranche due**, through the schedule's stage mapping against the canonical chain (`R2`). A tranche mapped to a skipped stage becomes due when the project passes the point that stage occupied, so a skippable stage never strands money; the state transitions themselves — upcoming → due → part-received → received, and waived as terminal — are `modules/M11`'s.
- **M08-37** (P0) — **Every project surface that shows money shows collected against due, and never a stale figure.** The board card, the detail screen's payments block and the portfolio views read the same computed values as the payments screen itself — one figure everywhere (`F8-24`) — recomputed before display (`F8-12`). A projection is never shown here as an amount owed (`F8-23`).
- **M08-39** (P0) — **An unpaid due tranche is visible and chased — and never blocks the customer's progress link.** It surfaces on the board card, on the project, and on the owner's dashboard (`modules/M13`), and the rep is prompted to chase the person. The product rule is absolute and this module states it because this is where the temptation lives: ***"never block the customer's progress link over money — chase the person, do not punish the view."*** No stage, document, link or handover behaviour in this module may be made conditional on payment.
- **M08-53** (P1) — **Cancellation preserves history: the timeline, documents, checklist and receipts of a cancelled project stay readable.** Money already received is not unwound by the cancellation itself — reversal is `modules/M11`'s append-only mechanism (a reversing entry, never an edit), and the project simply stops counting as revenue from the moment it is cancelled.

### From docs/prd/foundations/F1-global-market-framework.md

- **F1-35** (P0) — The canonical incentive-claim stage **applies in IN**, labelled per F1-51, and is **skippable** for commercial projects and for projects with no incentive.
- **F1-51** (P0) — **IN stage and blocker labels** for the canonical machines: `utility_inspection` → **"DISCOM inspection"**; `incentive_claimed` → **"Subsidy claimed"**; blocker party `utility` → **"DISCOM"**. Skippable-stage set: `incentive_claimed` (per F1-35). DISCOM names, like brand names, are never translated.

### From docs/prd/modules/M13-dashboards-and-reporting.md

- **M13-34** (P0) — **Project Manager — home: their projects ordered by days-in-stage, oldest first** — a blocker flags a card and never reorders it (owner ruling 2026-09-24) — each card: customer, size, value, days in current stage, payment collected vs due, blocker flag with who is being waited on (card facts `M08`'s; ageing per M13-25).

### From docs/prd/02-personas.md

- **PS-21** (P0) — The Project Manager's **home screen is their projects ordered by days-in-stage, oldest first** — a blocker flags a card and never reorders it (owner ruling 2026-09-24) — each card showing customer, size, value, days in the current stage, payment collected against payment due, and the blocker flag with who is being waited on.

## States

Base states (always designed): loading · empty · error.

Screen-specific states from the slice:

- **normal** — the full board, columns per canonical stage with pack labels, cards oldest-first.
- **empty-column-teaching / empty-teaching** — a stage with no projects says so in its column; empty states teach rather than blank.
- **no-won-deals-yet** — a tenant with no won deals yet sees what will land here and where it comes from.
- **mobile-single-column-filter / mobile-single-column (stage filter)** — the board on a phone: one column with a stage filter.
- **stage-move-confirm** — the move confirm carrying the target stage's pack label.
- **skippable-stage-offer** — where the pack marks the next stage skippable and this project does not need it, the move offers the following stage instead.
- **handover-start** — where the following stage is Handed over, the move's act starts the handover (M08-32, M08-46).
- **cancelled** — after the cancel confirm: the card leaves the board, and one line names it and leads to the project list (N8's after-state).
- **move-waiting-server** — the move waits visibly until it reaches the server.
- **set-blocker-sheet** — pick the party (the pack's four labels and nothing else), give the reason, optionally an expected-until.
- **blocker-flagged / blocker-flag** — the card's blocker flag names the party being waited on.
- **blocker-cleared** — the explicit clear act on a card's blocker, carrying the wait's measured length (M08-21).
- **money-due-uncollected** — a card whose due exceeds its collected carries the gap as word and mark; nothing is blocked by it (M08-39).
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
