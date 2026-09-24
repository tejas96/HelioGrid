# SCR-M08-02 · Project Detail

One screen composing stage timeline, design, proposal, payments, documents, blockers and activity; opens on what is wrong.

**Module:** M08 · **Personas:** Project Manager · EPC Owner · Operations · Sales Manager · Sales Executive (read-only on their own won deals) · Finance (reads as the money scope requires) · **Context of use:** "one screen the coordinator lives in" — dense reading work on web at a desk; on mobile it is the away-from-desk surface for stage moves, document and photo upload, blocker updates and marking a payment received while on site; the Sales Executive opens it during a customer call and must be able to answer without changing anything.

**One job:** see what is wrong with this project and act on it — and otherwise read where everything stands.
**Order of attention:** 1 what is wrong — the active blocker, then a due tranche that is unpaid · 2 where the project is — the stage timeline · 3 the records it composes — design, proposal, payments, documents · 4 the activity.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **This screen composes seven objects and copies none (`M08-16`):** each block is a summary and
a row that leads into the module that owns it.

| Fact | Kind | Its form here |
|---|---|---|
| The active blocker (`M08-21`) | status · data · action | the first region: the party as its chip; the reason, which is content; waiting since, expected until — a named gap when unknown — and the measured wait as label–value rows; for a utility wait, the utility's name (`M08-28`). ONE act: clear it |
| No active blocker (`M08-21`) | teaching · action | the block's one line (*No blockers — nothing is waiting on anyone*) and ONE act, *Set blocker*, opening `SCR-M08-01`'s sheet unchanged — its line that the customer sees who and when, never the reason |
| A due tranche that is unpaid (`M11-53`, `M08-38`) | data · action | the second region: amount, due date and days overdue as label–value rows, and ONE act — request the payment. With a connected channel its one line says it sends from the tenant's channel, and the delivery state is a chip afterwards. With none, the act copies the composed message and no delivery state is drawn anywhere |
| The stage timeline | data | the nine stages by their pack labels, the date each was reached, and the current one with its days in the stage — this region's ONE figure. A skipped stage stays in the chain, marked skipped (`M08-09`); a stage reached twice after a backward move shows its latest date, both moves being in the activity (`M08-14`) |
| Moving a stage (`M08-14`, `M08-19`) | action | *Move stage*, opening `SCR-M08-01`'s confirm unchanged: what falls due, the customer's link, the skip offer, and *Start handover* when the next stage is Handed over |
| The approved design and the accepted proposal (`M08-16`) | more detail | two read-only summaries, each naming the version in force, each a row leading into its module. Size and value carry their tier |
| The payments (`M08-16`) | data · more detail | tranche rows — amount, share, a state chip — and a row leading to the payments screen. No control here records money: *Record a payment* is a row into `M11`'s screen, drawn only for holders of `F2.M11.record-payments` (`M08-19`) |
| A money figure that cannot be recomputed (`F8-12`) | status | its provisional mark, on the figure |
| The documents | data · more detail | the verified count, and a row leading to `SCR-M08-03`, where documents and photos are uploaded (`M08-19`) |
| The installation checklist | data · more detail | its progress as a count, and a row leading to `SCR-M08-04` |
| Cleared blockers | more detail | rows, each with its measured wait |
| An incentive claim rejected or delayed (`M08-27`) | status · data | a chip on the claim's row, its reason as content, and its date |
| The activity (`M08-17`) | data | the one stream with filter chips by kind. An entry's text is content. No edit affordance is drawn |
| A block with nothing in it | teaching | ONE line saying so. A block never disappears |
| No design, or no payment terms | data | ONE plain line in that block. Never a placeholder design, never a fabricated row. With no design, the line leads to the proposal's own indicative labelling (`M06-04`) |
| An OPEX or PPA project | fixed note | the brief's own line — monthly energy billing is handled outside this platform — drawn once, as written |
| Hand over | action | a secondary act. While checklist rows are pending its ONE line says how many, and leads to them |
| Cancelling (`M08-51`, `N8`) | action | `SCR-M08-01`'s confirm, unchanged |
| A person with read scope only | status | every block in full; no act is drawn, and nothing is greyed |
| A cancelled project (`M08-51`, `M08-53`) | status · data | a *Cancelled* chip in the header and the reason as a label–value row. Every block stays readable, receipts included; no act is drawn, because the state is terminal |
| An act failed | error | one line at that act — what failed and what to do |

## Arrangement

- **375.** `What is wrong`, only when something is · the current stage and its days, with a row opening
  all nine · the composed blocks as rows that lead · the activity's latest few and `All activity`.
  Every editor is a sheet (`F7-21`).
- **1536.** Two columns: what is wrong, the stage timeline, payments and documents on the left; the
  activity stream on the right, as the ONE region that proves the volume. Design and proposal
  summaries sit side by side. Every editor is a side panel (`F7-21`).

## Entry & exit

Reached from: opening a card on the Project Board (SCR-M08-01). Leads to: the Document Checklist (SCR-M08-03); the Installation Checklist (SCR-M08-04); the Handover Flow (SCR-M08-06 — the handover action lives on the project detail); the payments screen where money is actually recorded is M11's, and this screen links into it rather than duplicating a control; the design and proposal blocks are read-only summaries with a link into the owning module (M05, M06); the set-blocker sheet and the cancel confirm are detail actions. The screen opens on what is wrong: an active blocker, if there is one, sits above the stage timeline; a due-but-unpaid tranche sits second. Other exits: not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### From docs/prd/modules/M08-projects.md

- **M08-16** (P0) — **One screen holds the whole project: the stage timeline, the approved design, the accepted proposal, the payments, the documents, the blockers and the activity.** *"One screen the coordinator lives in."* Each block is a view onto the object that owns it — the design is `modules/M05`'s, the proposal `modules/M06`'s, the payments `modules/M11`'s — and this screen composes them rather than copying them.
- **M08-17** (P0) — **The activity block is the product's one timeline, not a project-local log.** Stage changes, blockers set and cleared, documents uploaded and verified, payments recorded, checklist milestones, link opens and system events all land in the same append-only stream with their actor — user, system or customer — so the project's history and the customer's history are one history. _(non-UI half, build-side: single polymorphic append-only stream owned by M02; project and customer history are one history — for awareness, not for drawing)_
- **M08-21** (P0) — **Every blocker carries a reason, the date the wait started, and an expected-until date where one is known.** The start date is set when the blocker is set and is never back-edited silently; the expected-until is the honest estimate, editable, and its absence is shown as absence rather than as an empty date. Clearing a blocker records who cleared it and when, so the wait has a measured length rather than a remembered one. _(non-UI half, build-side: start date never silently back-edited; clearing records who and when so waits have measured lengths — for awareness, not for drawing)_
- **M08-27** (P0) — **An incentive claim that is rejected or delayed is surfaced with its reason** — on the project and, through the link, to the customer — *"this is the customer's money and they will ask."* The incentive vocabulary, its eligibility and whether the claim stage applies at all are pack data (`F1-14`, `F1-35`); this module owns only the surfacing of the outcome and the wait.
- **M08-38** (P0) — **When a tranche falls due the coordinator raises the request in one tap — and it sends from the tenant's connected transactional channel where one exists (owner ruling 2026-08-04).** The message is composed with the project's real figures; with a connected official channel the coordinator's tap sends it under the transactional template class with the channel's honest delivery states (payment links are a named transactional moment); with no channel connected it is ready-to-paste and the person sends it in whatever channel they already use — and on that fallback there is no delivery state anywhere, because the product did not do the sending. _(non-UI half, build-side: sends via tenant's connected transactional channel with honest delivery states; copy-paste fallback shows no delivery state anywhere — for awareness, not for drawing)_
- **M08-51** (P0) — **A project may be cancelled from any stage, the reason is mandatory, the state is terminal, and revenue stops counting immediately.** *"Reporting must not silently keep counting it as revenue."* Won means signed, and a deal cancelled after Won never quietly persists in a total — the reporting consequence is `modules/M13`'s and the honesty law is `F8-32`'s; the state, the mandatory reason and the immediacy are this module's. _(non-UI half, build-side: terminal state; revenue stops counting immediately across all reporting — for awareness, not for drawing)_
- **M08-09** (P0) — **What a user reads is the market pack's label for a stage; this module names no stage on screen and hard-codes no wait.** Stage labels, the skippable-stage set and blocker-party labels are pack data (`F1-22`; the India instance is `F1-51`, its skippable rule `F1-35`). A skipped stage is skipped by pack rule or because the project has no such obligation — it is never removed from the chain, and the board still shows the project's true position. **Residential deals may pass through stages in days; they still pass through them.**
- **M08-14** (P1) — **A stage move is recorded on the timeline with its actor and its timestamp, and it is never silently reversible.** Moving a project backwards is allowed — real installations go backwards — and is recorded as its own event with the same weight as moving forward, so the days-in-stage history stays truthful rather than being rewritten.
- **M08-18** (P0) — **The Sales Executive reads their own won deals and cannot change them** — *"so they can answer a customer without asking ops."* Read-only means the whole project: stages, blockers, documents and the money summary are visible and none of them is editable by that preset.
- **M08-19** (P1) — **The screen splits by where the work happens, not by breakpoint.** Web carries the dense reading work — the board, the checklist, the full detail. Mobile carries the away-from-desk acts: stage moves, document and photo upload, blocker updates, and marking a payment received. Neither surface is a reduced version of the other; each carries the whole of what its job needs.
- **M08-53** (P1) — **Cancellation preserves history: the timeline, documents, checklist and receipts of a cancelled project stay readable.** Money already received is not unwound by the cancellation itself — reversal is `modules/M11`'s append-only mechanism (a reversing entry, never an edit), and the project simply stops counting as revenue from the moment it is cancelled.

### From docs/prd/modules/M11-payments-and-collections.md

- **M11-53** (P0) — **An unpaid due tranche is chased through a person, and the product's job is to make it impossible to miss.** It surfaces on the project, on the stage board and on the owner's dashboard (`modules/M08`, `modules/M13` own those surfaces; this module supplies the facts), and the rep is prompted to chase. The prompt leads to a message — sent from the tenant's connected transactional channel where one exists and composed for a person to send where none is (owner ruling 2026-08-06; `M11-26`) — never to a product-side sanction against the customer (`M11-32`). *This clause previously read "The prompt leads to a message a person sends — never to a product-side sanction against the customer (`M11-32`)"; the earlier manual-only half is retired and the never-sanction half is unchanged. The chase is still a person's decision: the product prompts and the person acts.*

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
- **cancelled-project** — after the cancel confirm: the chip and the reason; every block readable, no act (M08-51, M08-53).
- **stage-move-confirm** — `SCR-M08-01`'s confirm from the detail: what falls due and the customer's link; *Start handover* when the next stage is Handed over.
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
