# SCR-M08-02 · Project Detail

One screen composing stage timeline, design, proposal, payments, documents, blockers and activity; opens on what is wrong.

**Module:** M08 · **Personas:** Project Manager · EPC Owner · Operations · Sales Manager · Sales Executive (read-only on their own won deals) · Finance (reads as the money scope requires) · **Context of use:** "one screen the coordinator lives in" — dense reading work on web at a desk; on mobile it is the away-from-desk surface for stage moves, document and photo upload, blocker updates and marking a payment received while on site; the Sales Executive opens it during a customer call and must be able to answer without changing anything.

## Entry & exit

Reached from: opening a card on the Project Board (SCR-M08-01). Leads to: the Document Checklist (SCR-M08-03); the Installation Checklist (SCR-M08-04); the Handover Flow (SCR-M08-06 — the handover action lives on the project detail); the payments screen where money is actually recorded is M11's, and this screen links into it rather than duplicating a control; the design and proposal blocks are read-only summaries with a link into the owning module (M05, M06); the set-blocker sheet and the cancel confirm are detail actions. The screen opens on what is wrong: an active blocker, if there is one, sits above the stage timeline; a due-but-unpaid tranche sits second. Other exits: not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From docs/prd/modules/M08-projects.md

- **M08-16** (P0) — **One screen holds the whole project: the stage timeline, the approved design, the accepted proposal, the payments, the documents, the blockers and the activity.** *"One screen the coordinator lives in."* Each block is a view onto the object that owns it — the design is `modules/M05`'s, the proposal `modules/M06`'s, the payments `modules/M11`'s — and this screen composes them rather than copying them.
- **M08-17** (P0) — **The activity block is the product's one timeline, not a project-local log.** Stage changes, blockers set and cleared, documents uploaded and verified, payments recorded, checklist milestones, link opens and system events all land in the same append-only stream with their actor — user, system or customer — so the project's history and the customer's history are one history. _(non-UI half, build-side: single polymorphic append-only stream owned by M02; project and customer history are one history — for awareness, not for drawing)_
- **M08-21** (P0) — **Every blocker carries a reason, the date the wait started, and an expected-until date where one is known.** The start date is set when the blocker is set and is never back-edited silently; the expected-until is the honest estimate, editable, and its absence is shown as absence rather than as an empty date. Clearing a blocker records who cleared it and when, so the wait has a measured length rather than a remembered one. _(non-UI half, build-side: start date never silently back-edited; clearing records who and when so waits have measured lengths — for awareness, not for drawing)_
- **M08-27** (P0) — **An incentive claim that is rejected or delayed is surfaced with its reason** — on the project and, through the link, to the customer — *"this is the customer's money and they will ask."* The incentive vocabulary, its eligibility and whether the claim stage applies at all are pack data (`F1-14`, `F1-35`); this module owns only the surfacing of the outcome and the wait.
- **M08-38** (P0) — **When a tranche falls due the coordinator raises the request in one tap — and it sends from the tenant's connected transactional channel where one exists (owner ruling 2026-08-04, Q33).** The message is composed with the project's real figures; with a connected official channel the coordinator's tap sends it under the transactional template class with the channel's honest delivery states (payment links are a named transactional moment); with no channel connected it is ready-to-paste and the person sends it in whatever channel they already use — and on that fallback there is no delivery state anywhere, because the product did not do the sending. _(non-UI half, build-side: sends via tenant's connected transactional channel with honest delivery states; copy-paste fallback shows no delivery state anywhere — for awareness, not for drawing)_
- **M08-51** (P0) — **A project may be cancelled from any stage, the reason is mandatory, the state is terminal, and revenue stops counting immediately.** *"Reporting must not silently keep counting it as revenue."* Won means signed, and a deal cancelled after Won never quietly persists in a total — the reporting consequence is `modules/M13`'s and the honesty law is `F8-32`'s; the state, the mandatory reason and the immediacy are this module's. _(non-UI half, build-side: terminal state; revenue stops counting immediately across all reporting — for awareness, not for drawing)_

### From docs/prd/modules/M11-payments-and-collections.md

- **M11-53** (P0) — **An unpaid due tranche is chased through a person, and the product's job is to make it impossible to miss.** It surfaces on the project, on the stage board and on the owner's dashboard (`modules/M08`, `modules/M13` own those surfaces; this module supplies the facts), and the rep is prompted to chase. The prompt leads to a message a person sends — never to a product-side sanction against the customer (`M11-32`). _(non-UI half, build-side: supplies overdue facts to M08 board/project and M13 dashboard; never sanctions customer — for awareness, not for drawing)_ **Ruling clause carried from the cell:** The prompt leads to a message — sent from the tenant's connected transactional channel where one exists and composed for a person to send where none is (owner ruling 2026-08-06, Q45; the message's send path is owner ruling 2026-08-06 (Q45) applying owner ruling 2026-08-04 (Q33) — `M11-26` | P0 |

## States

Base states (always designed): loading · empty · error.

Screen-specific states from the slice:

- **normal** — all blocks present: stage timeline, design, proposal, payments, documents, blockers, activity — each naming the object it reads and the version in force.
- **blocker-leads** — an active blocker sits above the stage timeline; the screen opens on what is wrong.
- **due-tranche-lifted** — a due-but-unpaid tranche sits second, lifted in the payments block and carrying the request action.
- **empty-blocks-say-so** — blocks with nothing in them say so ("No blockers — nothing is waiting on anyone") rather than disappearing.
- **read-only-scoped** — the Sales Executive's own won deal: every block readable, no control mutates anything; a preset with read scope and no capability sees the block and no control — the same screen, scoped.
- **no-design-reference** — a project with no design: the design block states that plainly; no placeholder design is implied.
- **empty-payment-schedule** — a project whose accepted proposal carries no payment terms shows an empty schedule and says so plainly; it never fabricates rows.
- **opex-billing-note** — an OPEX/PPA project shows the one-time payments its accepted version carries with the full tranche toolset, plus the honest note "monthly energy billing is handled outside this platform".
- **incentive-rejected** — a rejected or delayed incentive claim surfaced with its reason.
- **provisional-money** — a value that cannot be recomputed renders as provisional with that stated.
- **timeline-filtered** — the activity stream filtered by kind; it is one stream, never split into per-module logs.
- **set-blocker-sheet** — party from the pack's four labels, reason, optional expected-until.
- **cancel-confirm** — mandatory reason, explicit confirm stating "this project stops counting as revenue immediately", no undo.
- **overdue-chase-prompt** — an unpaid due tranche impossible to miss, with the prompt to chase the person.
- **copy-request-message** — the no-channel fallback: the composed request message ready-to-paste, with no delivery state anywhere.

## Data volume

A mature mid-project record: a long activity timeline (months of stage changes, blockers set and cleared, documents, payments, link opens — enough to force the filterable single-stream treatment), the full nine-stage timeline with a mid-chain position, a tranche schedule of several rows in mixed states (received, part-received, due, upcoming), the pack's document checklist summarised (the IN pack instance is eight rows), and an active blocker plus at least one cleared one so two measured waits coexist in history.

## Numbers carrying provenance

Every user-visible number carries its F8 provenance tier (measured / derived / estimated / assumed) in the design:

- Days in the current stage, and the dates on the stage timeline (stage history with dates).
- Every money figure in the payments block: each tranche's amount, its share, collected against due — one figure everywhere, recomputed before display or rendered provisionally with that stated.
- The real figures composed into the payment request message.
- Blocker start date and expected-until date (absence shown as absence, never an empty date); wait lengths.
- Timestamps and actors on every activity-stream event.
- Dates on the incentive claim outcome and its wait.
- System size and value wherever the design/proposal summary blocks show them, naming the version in force.
