# M08 · Projects — Status, Documents, Money
Status: draft · Origin mix: SRC (dominant) / BRIEF (the installation-team job surface only) ·
Depends on: `00-README.md` (conventions) · `01-product-overview.md` (§6 non-goal summary) ·
`02-personas.md` (`PS-20`, `PS-21`, `PS-26`–`PS-28`, `PS-31`, `PS-33`, `PS-34`) ·
`foundations/F1-global-market-framework.md` (stage labels, skippable set, blocker-party labels,
document checklist, utility directory — `F1-09`, `F1-22`, `F1-35`; IN instance `F1-51`–`F1-53`)
· `foundations/F2-roles-and-permissions.md` (§F2.5-M08, `F2-06`, `F2-07`, `F2-08`, `F2-12`–`F2-14`,
`F2-22`) · `foundations/F3-localization.md` (`F3-12` canonical vocabulary) ·
`foundations/F5-customer-link.md` (the customer progress link — Task 20) ·
`foundations/F6-notifications-and-search.md` (notification types — Task 23) ·
`foundations/F7-design-language.md` (`F7-12` status never by colour alone, `F7-17` density) ·
`foundations/F8-data-honesty.md` (`F8-12`, `F8-23`, `F8-24`, `F8-32`) ·
`modules/M02-crm-and-leads.md` (`M02-16` referral object, `M02-57` the won transition,
`DOC04.timeline`) · `modules/M04-survey.md` (the site record and its utility) ·
`modules/M05-design-studio.md` (`M05-76`, `M05-77` — the installation plan as derived work order)
· `modules/M06-proposals.md` (`M06-06` proposal type, `M06-13` payment terms, `M06-44` the
server-identifier law) · `modules/M07-sales-execution.md` (`M07-62` — Mark won) ·
`modules/M11-payments-and-collections.md` (the money path — Task 19) ·
`modules/M12-platform-billing.md` (the active-project entitlement gate — Task 23) ·
`modules/M13-dashboards-and-reporting.md` (aging and revenue surfaces — Task 23)

## 1. Purpose & scope

This module is what happens after a deal is won, and it is deliberately small. The source states
the boundary as a sentence and this document treats that sentence as law:

> "This is a status + documents + money tracker, not project-management software."

The customers this is built for *"run a WhatsApp group and a notebook. We are replacing the
notebook, not selling them MS Project"* (`S8.rule.v1-boundary`). The goal is three things and no
fourth: **know what is stuck, collect the money, and let the customer see progress without
phoning.**

It owns, at product level:

- **The project object** — created by the won transition, never by a person filling a form.
- **The stage board and the canonical stage machine** — the nine-stage chain plus cancellation
  (`R2`), with market-neutral value names and market-pack labels.
- **Blockers and wait attribution** — the four waiting parties, their reasons and their dates.
  This is the wait-visibility engine the customer link consumes; it is also the module's most
  valuable output, because *"the product's job is not to speed these up. It is to make the
  waiting visible and attributable, so the EPC stops absorbing blame for a utility's timeline."*
- **The document checklist** — seeding, statuses, and the handover rule that reads them.
- **The project's money surfaces** — the collection schedule it inherits, what each card and
  screen shows about collected-versus-due, and the stage event that makes a tranche due. The
  money itself (receipts, modes, reversals, the payments screen) is
  `modules/M11-payments-and-collections.md`'s.
- **The installation checklist surface** — the execution of the design's derived work order,
  with `R16`'s attribution rules and the no-commercial-figures law.
- **Handover, closure, and the referral ask.**

It explicitly does **not** own: the money mechanics behind the tranches (`modules/M11`); the
Mark-won surface that creates the project (`modules/M07`, `M07-62`) or the lead machine behind it
(`modules/M02`, `M02-57`); the customer-facing progress page, its token, its lifecycle and its
copy (`foundations/F5`); the derivation of the installation plan from the design
(`modules/M05`, `M05-76`); stage labels, skippable stages, checklist row names, blocker-party
labels and the utility directory, all of which are market-pack data (`foundations/F1`); and the
portfolio dashboards, aging reports and revenue roll-ups that read this module's stages
(`modules/M13`).

**The boundary is a law, not a phase.** Everything the source excludes from "light" is named in
§5 as an explicit non-goal with its v1 rationale — each one a stated exclusion, never a deferral.
Per `OV-43` there is no "later" bucket in this suite.

## 2. Personas & surfaces

Personas (per `02-personas.md`):

- **Project Manager** — the primary persona and the v1 "coordinator / ops" job. Owns a won deal
  from signature to handover (`PS-20`). **Web** for the board, the document checklist and the
  dense project detail; **mobile** for stage moves, document and photo upload, blocker updates
  and payment marking while on site.
- **EPC Owner** — everything: all projects, all money, all blockers.
- **Operations** — the same delivery capabilities at portfolio scope; their working view is
  blockers grouped by party, oldest first, with aged projects beneath (`PS-33`, `PS-34`; the
  home composition itself is `modules/M13`'s).
- **Sales Manager** — the v1 `Manager` preset's direct successor, team-scoped (`F2-08a`).
- **Sales Executive** — **read-only on their own won deals**, "so they can answer a customer
  without asking ops" (`S8.rule.roles`).
- **Installation Team Member** — the assigned installation job and its checklist, and nothing
  else (`PS-26`); every surface obeys `F2-06` (no commercial figures, ever).
- **Finance** — reads projects as the money scope requires; the receipts ledger is
  `modules/M11`'s (`PS-31`).
- **The EPC's customer** — **not a user of this module**. They see the progress link, with no
  login, ever (`foundations/F5`); this module supplies the facts that link renders and never
  writes its copy.

**Surface emphasis.** Desktop shows the full board; **mobile shows one column with a stage
filter** (`S8.screen.1`). Boards, checklists and the project detail are *functional*-density
surfaces (`F7-17`), and every stage, blocker and payment state renders as a label plus a mark —
never colour alone (`F7-12`).

*Offline posture removed 2026-08-07 by owner decision: the offline/sync capability was deleted.*

## 3. Feature areas

### M08.1 — The light boundary and the project at Won

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M08-01 | **The scope law: this module is a status + documents + money tracker, and its surface set is closed.** In v1: the stage board · payment collection against the tranche schedule · the document checklist · blockers with reasons · the customer progress link · the existing installation checklist. That list is exhaustive. A capability not on it is a non-goal with the source's rationale recorded (§5), not an unbuilt backlog item, and adding one is an owner ruling rather than a local decision inside this module. | `SRC` — `S8.rule.v1-boundary` (verbatim: "This is a status + documents + money tracker, not project-management software"); `D9` (scope half — the surviving half; docs/15: PARTIAL); `DOC00.nongoal-projects-light` (disposed by Task 3, fulfilled here) | P0 |
| M08-02 | **A won deal *is* a project: the project is created by the won transition, automatically and atomically, and there is no "create project" step anywhere in the product.** Nobody re-enters the customer — *"asking someone to re-enter the customer is how data diverges."* The act that causes it is the rep's Mark won (`M07-62`, consumed) and the transition's atomicity is the lead machine's (`M02-57`, consumed); a customer's Accept on the link notifies the rep but never creates the project — the human confirms first (`DOC04.accepted-human-confirms` — cited, `foundations/F5`'s row). | `SRC` — `S8.rec.1` (verbatim); `S8.happy`; `M07-62` / `M02-57` consumed | P0 |
| M08-03 | **The project number is server-assigned from tenant counters and never client-generated**, so two people winning deals at the same moment can never collide. This is the same law the proposal number obeys — one identifier rule, two objects (`M06-44` is the proposal half). | `SRC` — `DOC02.server-identifiers` (docs/engineering/02 — the project-number half; "Server assigns all business identifiers … never client-generated") | P0 |
| M08-04 | **The project inherits by reference, never by copy: the customer and site record, the approved design, the accepted proposal version, the survey it was designed from, and the accepted version's tranche schedule.** No field is duplicated for a human to keep in step, and no screen in this module asks for a fact another module already holds. The project points at the *version in force*, so a later version supersedes it explicitly rather than by overwriting (§M08.9). | `SRC` — `S8.rec.1` ("a won deal *is* a project"); `S8.screen.2` (the detail screen's contents); `DOC04.tranches-money-path` (cited — `modules/M11` owns the money path) | P0 |
| M08-05 | **A new project opens in `WON`, its days-in-stage clock starts at creation, and its market-dependent contents are seeded from the tenant's market pack at that moment** — the stage set with its skippable stages, the stage and blocker labels, and the document checklist rows for this project's segment. Seeding happens once, at creation; a later pack version does not silently rewrite a live project's checklist (staleness is `foundations/F8`'s law, `F1-11` the pack-version input). | `SRC` — `R2` (the chain's entry state); `DOC04.document-checklist` ("seeded at project creation"); `F1-22`, `F1-35` consumed (labels, skippable set) | P0 |
| M08-06 | **The commercial document type does not branch the project.** A project behind an operating-expense or power-purchase proposal tracks **the same stages and the same document checklist** as one behind an outright-purchase proposal. There is no recurring invoicing and no meter ingestion behind the type — that engine is an explicit non-goal (§5), and the per-unit terms the document renders are projections carrying `F8-23`'s label, not amounts owed. | `SRC` — `R17` (docs/15 §1 — the post-Won half, verbatim: "the project after Won tracks the same stages and document checklist; no recurring invoicing, no meter ingestion"); `M06-06` consumed (the document type); `F8-23` consumed | P0 |
| M08-07 | **This module owns the definition of an *active* project — one that is neither handed over nor cancelled** — and the law that a plan limit may gate *creating* one but never *working* one: an existing project stays fully workable however the tenant's entitlements change, because the product must never strand a live installation. The gate's mechanics, its denial message and its upgrade path are `modules/M12`'s. | `SRC` — `DOC16.gate.active-projects` (cited — `modules/M12` owns the gate; the "active" definition is a function of this module's stage machine, and the never-strand rule is the source's) | P1 |

**Behavior detail.** Creation is invisible: the rep confirms Mark won on the lead and the project
exists, numbered, in `WON`, on the board, with its checklist seeded and its collection schedule
attached. No wizard, no confirmation step of its own, no second entry of the customer. The
project's timeline opens with the creation event and inherits the lead's history rather than
starting blank (`DOC04.timeline` — `modules/M02`'s single stream). Creation completes against the
server: the number and the money schedule are the server's to assign.

Permissions: creation is a consequence of `F2.M07.mark-won-lost` and grants nothing of its own.
Who may then see and work the project is `F2.M08.project-visibility` and the capability rows in
§F2.5-M08. Project creation is an audited event under `F2-22`'s money-events list (Won).

**Edge cases & what-goes-wrong.**
- *A customer accepts on the link but the rep has not marked won* → no project exists yet; the
  Accept notifies the rep and the human confirms (`DOC04.accepted-human-confirms`, `foundations/F5`).
- *Two users mark won on the same deal at once* → one project, one server-assigned number; the
  second act finds the project already there rather than making a duplicate (M08-03).
- *A rep marks won by mistake* → the project exists and the correction is cancellation with a
  reason (§M08.9, M08-51) — never a silent delete.
- *The tenant is at its active-project limit* → creating is blocked with the upgrade path
  (`modules/M12`); every project already live keeps working, unchanged (M08-07).
- *The deal was won without a design or a survey* → the project exists with those references
  empty and says so on the detail screen; nothing is fabricated to fill the block.

**Acceptance criteria.**
- Given a rep confirms Mark won on a lead, when the act completes, then a project exists
  immediately with a server-assigned number, in `WON`, with no re-entry of customer data and no
  separate create step anywhere in the flow (M08-02, M08-03).
- Given the project has just been created, when it opens, then the customer, site, approved
  design, accepted proposal version and the accepted version's tranche schedule are present by
  reference, and the document checklist is seeded for this project's segment from the tenant's
  market pack (M08-04, M08-05).
- Given a project behind an operating-expense/power-purchase proposal, when it opens, then it
  shows exactly the same stage chain and checklist as an outright-purchase project, and no
  recurring-billing or metering surface exists anywhere on it (M08-06).
- Given any request to add a capability outside the six surfaces of the scope law, when this
  module is read, then that capability is found in §5 as a non-goal with its rationale, not as an
  unbuilt requirement (M08-01).

**Localization notes.** Stage, checklist and blocker labels are the pack's, translated EN/HI/MR
under `foundations/F3`; the project number's format follows `F1-46` number rendering and is never
translated. **Analytics events.** `project_created` (from lead, with proposal version),
`project_opened`.

### M08.2 — The stage board and the canonical stage machine

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M08-08 | **One canonical stage chain governs every project, and it is the full nine stages plus cancellation:** `WON → MATERIAL_ORDERED → DISPATCHED → INSTALLATION → ELECTRICAL_METERING → UTILITY_INSPECTION → COMMISSIONED → INCENTIVE_CLAIMED → HANDED_OVER`, plus **`CANCELLED`** — reachable from any stage, reason mandatory, terminal. The value names are market-neutral by ruling. **The earlier five-state shorthand is deprecated and appears nowhere** — not as a model, not as a filter, not as a display grouping in any surface this module defines. | `SRC` — `R2` as amended 2026-08-02 (RULING, verbatim chain); `S8.rule.stage-chain`; `DOC04.project-machine`; supersedes `D9`'s five-state shorthand | P0 |
| M08-09 | **What a user reads is the market pack's label for a stage; this module names no stage on screen and hard-codes no wait.** Stage labels, the skippable-stage set and blocker-party labels are pack data (`F1-22`; the India instance is `F1-51`, its skippable rule `F1-35`). A skipped stage is skipped by pack rule or because the project has no such obligation — it is never removed from the chain, and the board still shows the project's true position. **Residential deals may pass through stages in days; they still pass through them.** | `SRC` — `R2` as amended ("Stage LABELS are market-pack data … skippable stages are pack data"; "Residential deals may pass through stages quickly; they still pass through them"); `F1-09`, `F1-22`, `F1-35` consumed | P0 |
| M08-10 | **The board is won deals as cards, columned by stage.** Each card carries: customer · system size · value · **days in the current stage** · **payment collected against payment due** · the blocker flag with the party being waited on. Desktop shows the full board; **mobile shows one column with a stage filter**. Cards are ordered oldest-first within a column so what has waited longest is what is seen first. | `SRC` — `S8.screen.1` (verbatim card contents and the mobile/desktop split); `PS-21` (card contents reciprocated); `PS-34` (oldest-first ordering) | P0 |
| M08-11 | **Days-in-stage is the board's metric — the only one.** Not percentage complete, not a burndown, not a progress bar, not a health score. *"Days-in-stage is the only metric that matters on the board … 'this one has been in inspection for 34 days' is the whole insight."* Every other number on a card is a fact (size, value, collected, due), never a computed judgement. | `SRC` — `S8.rec.2` (verbatim; the stage named in the source's example is the India pack's label for `UTILITY_INSPECTION`, `F1-51`); `PS-21` | P0 |
| M08-12 | **Aged cards surface rather than sink.** A project sitting unusually long in one stage rises — to the top of its column, and into the owner's and Operations' views — carrying its days-in-stage and its blocker if it has one. Ageing is **relative**: oldest-first ordering and the days figure itself, with no invented threshold constant anywhere in this module; any notification threshold on top of it is `foundations/F6`'s, and the portfolio aging report is `modules/M13`'s. | `SRC` — `S8.wrong.1` ("stuck in a stage for weeks → aged cards surface to the owner with days-in-stage"); `PS-21` ("aged cards surface rather than sinking"); `PS-34` | P0 |
| M08-13 | **The board never renders a project as nearly finished.** A system installed but stuck before commissioning for a month is not "90% done" — it is in its stage, with the days it has been there, and the honest thing on the card is that number. *"Days-in-stage tells the truth."* No surface in this module computes completion as a fraction of stages passed. | `SRC` — `S8.wrong.9` (verbatim reasoning) | P0 |
| M08-14 | **A stage move is recorded on the timeline with its actor and its timestamp, and it is never silently reversible.** Moving a project backwards is allowed — real installations go backwards — and is recorded as its own event with the same weight as moving forward, so the days-in-stage history stays truthful rather than being rewritten. | `SRC` — `DOC04.timeline` (append-only, actor-stamped — cited, `modules/M02`'s row); `S8.rec.2` (days-in-stage integrity) | P1 |
| M08-15 | **Completing a stage is the module's one automatic trigger, and it does exactly two things: the matching tranche becomes due (§M08.6) and the customer's progress link updates (`foundations/F5`).** Nothing in this module fires on a clock, and no stage change sends anything to anyone by itself — the request remains the coordinator's one-tap act (`M08-38`, which sends via the tenant's connected transactional channel per owner ruling 2026-08-04, Q33, with copy-paste as the no-channel fallback). | `SRC` — `S8.happy` (verbatim spine: "coordinator moves it stage by stage → each stage triggers the matching payment request and updates the customer link"); `S8.rule.tranches`; send rail per owner ruling 2026-08-04 (Q33) | P0 |

**Behavior detail.** The board is the module's home. A stage move is a card action (drag on
desktop, an explicit move on mobile) that opens the confirm with the target stage's pack label;
where the pack marks the next stage skippable and this project does not need it, the move offers
the following stage instead of forcing a pass through an obligation that does not exist here.
`CANCELLED` is not a column — it is a terminal state reached from the card's own action, with the
mandatory reason (§M08.9). Empty states teach rather than blank: a stage with no projects says so
in its column; a tenant with no won deals yet sees what will land here and where it comes from.
Stage state renders as a labelled chip with a mark, never colour alone (`F7-12`).

Permissions: `F2.M08.update-stages` — EPC Owner · Sales Manager · Project Manager · Operations.
Reading the board is `F2.M08.project-visibility`, scoped per `F2-12`/`F2-14` (projects are their
own visibility domain). Stage changes and any cancellation are audited events (`F2-22`).

**Edge cases & what-goes-wrong.**
- *Stuck in a stage for weeks* (`S8.wrong.1`) → the card ages upward with its days-in-stage and
  reaches the owner's view; nothing hides it (M08-12).
- *Install done but commissioning blocked for a month* (`S8.wrong.9`) → the board shows the
  stage and the days, never "nearly finished" (M08-13).
- *A residential deal that runs start to finish in nine days* → it still passes through every
  stage; the chain is not shortened for fast projects (M08-09).
- *A market with no incentive obligation, or a commercial project* → the incentive-claim stage is
  skipped per pack rule and the board reflects the real position (M08-09, `F1-35`).
- *The coordinator moves a project one stage too far* → they move it back; both moves stand on
  the timeline and the days-in-stage history is not rewritten (M08-14).

**Acceptance criteria.**
- Given any project in the product, when its stage is inspected, then its value is one of the
  nine canonical stages or `CANCELLED`, and no five-state shorthand appears in any surface,
  filter or grouping (M08-08).
- Given a tenant in any market, when the board renders, then every stage shows the pack's label
  for its market-neutral value, and no stage name originates in this module (M08-09).
- Given the board on a phone, when it renders, then it shows one column with a stage filter;
  given the same board on desktop, then it shows every column (M08-10).
- Given two projects in one stage, one there four days and one thirty-four, when the column
  renders, then the thirty-four-day project is above the four-day one and both show their days
  figure; and no card anywhere shows a percentage, burndown or completion bar (M08-11, M08-12,
  M08-13).
- Given a coordinator completes a stage, when the move is saved, then the matching tranche
  becomes due and the customer link reflects the new stage — and nothing is sent to anyone
  (M08-15).

**Localization notes.** Every stage name on screen is a pack label translated EN/HI/MR; the
canonical value names are identifiers and are never translated or collapsed by translation
(`F3-12`). Day counts render with pack number formats (`F1-46`). **Analytics events.**
`project_stage_changed` (from, to, days in previous stage, direction), `project_board_viewed`
(surface, filter), `project_card_opened`.

### M08.3 — Project detail: the one screen the coordinator lives in

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M08-16 | **One screen holds the whole project: the stage timeline, the approved design, the accepted proposal, the payments, the documents, the blockers and the activity.** *"One screen the coordinator lives in."* Each block is a view onto the object that owns it — the design is `modules/M05`'s, the proposal `modules/M06`'s, the payments `modules/M11`'s — and this screen composes them rather than copying them. | `SRC` — `S8.screen.2` (verbatim block list and the intent, verbatim) | P0 |
| M08-17 | **The activity block is the product's one timeline, not a project-local log.** Stage changes, blockers set and cleared, documents uploaded and verified, payments recorded, checklist milestones, link opens and system events all land in the same append-only stream with their actor — user, system or customer — so the project's history and the customer's history are one history. | `SRC` — `DOC04.timeline` (docs/04, one polymorphic timeline per lead/project/customer; append-only — cited, `modules/M02` owns the stream) | P0 |
| M08-18 | **The Sales Executive reads their own won deals and cannot change them** — *"so they can answer a customer without asking ops."* Read-only means the whole project: stages, blockers, documents and the money summary are visible and none of them is editable by that preset. | `SRC` — `S8.rule.roles` (verbatim); `F2-12`/`F2-14` consumed (projects are their own visibility domain) | P0 |
| M08-19 | **The screen splits by where the work happens, not by breakpoint.** Web carries the dense reading work — the board, the checklist, the full detail. Mobile carries the away-from-desk acts: stage moves, document and photo upload, blocker updates, and marking a payment received. Neither surface is a reduced version of the other; each carries the whole of what its job needs. | `SRC` — `PS-20` (the persona's surface split, reciprocated); `S8.screen.1` (the board's mobile/desktop split); `F7-17` consumed (density by surface) | P1 |

**Behavior detail.** The detail screen opens on what is wrong: an active blocker, if there is
one, sits above the stage timeline; a due-but-unpaid tranche sits second. Blocks with nothing in
them say so ("No blockers — nothing is waiting on anyone") rather than disappearing, because an
absent block reads as a broken screen. The design and proposal blocks are read-only summaries
with a link into the owning module, and they name the *version in force* (`M08-04`) so a reader
never has to guess which proposal the project is running on.

Permissions: reading is `F2.M08.project-visibility`; every act on the screen carries the grant of
the capability it belongs to (`F2.M08.update-stages`, `F2.M08.project-documents`,
`F2.M08.installation-checklist`, `F2.M11.record-payments`). A preset with read scope and no
capability sees the block and no control — the same screen, scoped (`F2-12`).

**Edge cases & what-goes-wrong.**
- *A rep opens a won deal to answer a customer's call* → they see stage, blocker, documents and
  the money summary, and can change nothing (M08-18).
- *A project with no design (a proposal built without one)* → the design block states that
  plainly and links to the proposal's own indicative labelling (`M06-04` — cited); no placeholder
  design is implied.
- *The timeline is long* → it is one stream, filterable by kind, never split into per-module logs
  that can disagree (M08-17).

**Acceptance criteria.**
- Given a project, when its detail screen opens, then the stage timeline, design, proposal,
  payments, documents, blockers and activity are all present on one screen, each naming the
  object it reads (M08-16).
- Given a Sales Executive opening their own won deal, when the screen renders, then every block
  is readable and no control mutates anything (M08-18).
- Given any stage change, blocker, document or payment event on the project, when the activity
  block renders, then the event is in the same stream with its actor, in order, and nothing is
  editable after the fact (M08-17).

**Localization notes.** Block titles, empty-state copy and timeline event phrases EN/HI/MR; actor
names are data, never translated. **Analytics events.** `project_detail_viewed` (block ordering
shown), `project_timeline_filtered`.

### M08.4 — Blockers and wait attribution

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M08-20 | **A blocker names who is being waited on, from a closed set of exactly four parties: `utility` · `customer` · `material` · `company`.** The set is canonical and market-neutral; what a user reads for each is the market pack's label (`F1-22`; the India instance labels `utility` per `F1-51`). The source's fourth party is *"us"* — the tenant company itself — and its canonical value name is `company` so that the vocabulary carries across markets and languages unchanged; the pack and locale supply the first-person display. The set is fixed: a fifth party is a ruling, not a tenant setting or a free-text field. | `SRC` — `R2` as amended 2026-08-02 ("blocker sub-states (waiting on utility/customer/material/us) ride on any stage"; the party's pre-amendment market-specific name is superseded — recorded in `registers/traceability.md`, its market label carried by `F1-51`); `S8.screen.5`; `DOC04.blockers`; `F1-22`/`F1-51` consumed (labels); `F3-12` consumed (canonical value, translated display) | P0 |
| M08-21 | **Every blocker carries a reason, the date the wait started, and an expected-until date where one is known.** The start date is set when the blocker is set and is never back-edited silently; the expected-until is the honest estimate, editable, and its absence is shown as absence rather than as an empty date. Clearing a blocker records who cleared it and when, so the wait has a measured length rather than a remembered one. | `SRC` — `DOC04.blockers` (docs/04: "with reason, start and expected-until"); `S8.screen.5`; `S8.wrong.4` (the date it started) | P0 |
| M08-22 | **Blockers ride on any stage; a blocked project is never moved out of its stage to record that it is blocked.** Blocking is a sub-state, not a stage, so the days-in-stage figure and the customer's view keep telling the truth while the wait is recorded on top of them. A project may carry a blocker in any stage of the chain, and clearing it changes no stage. | `SRC` — `R2` as amended ("blocker sub-states … ride on any stage"); `S8.wrong.9` (days-in-stage integrity while blocked) | P0 |
| M08-23 | **Every blocker names a party — there is no unattributed blocker.** *"Over a year this becomes the honest answer to 'why do our projects take so long'."* The party is mandatory at the moment the blocker is set, the aggregate is what `modules/M13` reports on, and Operations' working view is blockers grouped by party with the company's own first (`PS-34`). | `SRC` — `S8.rec.3` (verbatim); `PS-34` (grouping reciprocated); `F8-32` consumed (observed fact, never causal claim) | P0 |
| M08-24 | **The "waiting on customer" state is the one that protects the EPC, and it works by recording responsibility rather than by arguing about it.** A customer who cannot give site access — nobody home, terrace locked — produces a blocker with the party, the reason and the date the wait began, *"so responsibility for the delay is recorded and visible."* It is visible to the customer too, on their own link, which is the point. | `SRC` — `S8.screen.5` (verbatim: "the 'waiting on customer' state is the one that protects the EPC"); `S8.wrong.4` | P0 |
| M08-25 | **A blocker's internal reason and its customer-visible framing are two different things, and the module keeps them separate.** A supplier's failure is the company's problem to solve and not the customer's to read: the customer sees the project's honest stage and the fact that material is on order, with an expected date; they do not see the supplier, the internal note, or the commercial detail behind it. What the customer's page renders is `foundations/F5`'s; what this module guarantees is that the internal field is never the published one. | `SRC` — `S8.wrong.5` (verbatim: "customer sees *'material ordered'*, not the supplier's problem") | P0 |
| M08-26 | **The two structurally external waits are framed as external, and the product's job is stated honestly: make the waiting visible and attributable, not faster.** Utility inspection and interconnection approval, and incentive disbursement to the customer, are largely outside the company's control; the pack declares which of them apply in a market and what a typical wait looks like (`F1-53`). The module never presents such a wait as the company's failure and never invents an estimate the pack has not declared. | `SRC` — `S8.rule.external-delays` (verbatim: "The product's job is not to speed these up. It is to make the waiting visible and attributable, so the EPC stops absorbing blame for a utility's timeline"); `F1-53` consumed (wait framing content) | P0 |
| M08-27 | **An incentive claim that is rejected or delayed is surfaced with its reason** — on the project and, through the link, to the customer — *"this is the customer's money and they will ask."* The incentive vocabulary, its eligibility and whether the claim stage applies at all are pack data (`F1-14`, `F1-35`); this module owns only the surfacing of the outcome and the wait. | `SRC` — `S8.wrong.6` (verbatim); `R2` as amended (incentive vocabulary per pack); `F1-14`/`F1-35` consumed | P0 |
| M08-28 | **The project knows which utility it belongs to, from the pack's directory, and the utility blocker attributes the wait to that named body.** The site record carries the selection (`modules/M04`'s capture, `F1-53`'s directory); the project reads it. Utility-specific application packets are a post-launch document-template family and are **not** in v1 (§5). | `SRC` — `CG-3` (docs/12, DESIGN-FOR: "Site carries [the utility], blockers attribute the wait, document checklist tracks the application. Packets are a … template family added post-launch"); `R2` as amended (party `utility`); `F1-53` consumed | P0 |
| M08-29 | **Blockers are the wait-visibility feed the customer link consumes, and this module produces structured facts rather than customer copy.** For every blocker the module publishes: the party, the reason class, the date the wait started and the expected-until where known — the four facts that let the link say what it says. *"This single line prevents most support calls."* The line's wording, its rendering and the link's lifecycle are `foundations/F5`'s; the facts behind it are this module's, and they are never fabricated to fill the sentence. | `SRC` — `S8.wrong.2` (the project-side half; the customer-link copy is `foundations/F5`'s); `C10`, `C10.wrong.1`, `C10.wrong.2`, `C.lifecycle.6` (cited — `foundations/F5`, Task 20); `DOC04.blockers` | P0 |

**Behavior detail.** Setting a blocker is two taps from the card and from the detail screen: pick
the party, give the reason, optionally give an expected-until. The party picker shows the pack's
four labels and nothing else. An active blocker is visible everywhere the project is — the card's
blocker flag names the party, the detail screen leads with it, and Operations' portfolio view
groups by party with the company's own group first, because *"everything waiting on us"* is the
only group the tenant can act on directly (`PS-34`). Clearing is explicit; a blocker never expires
on its own, because a wait that ended silently is a wait nobody measured.

Permissions: setting and clearing blockers rides `F2.M08.update-stages` — a blocker is a
sub-state of the stage machine (`R2`), not a separate object with a separate grant; the
capability's holders are EPC Owner · Sales Manager · Project Manager · Operations, matching the
source's coordinator role (`S8.rule.roles`) and decision B's delivery re-grants (`F2-08b`,
`F2-08c`). Recorded in the §F2.5-M08 notes.

**Edge cases & what-goes-wrong.**
- *A utility approval runs long* (`S8.wrong.2`) → a blocker with party `utility`, its reason and
  the date it was applied for; the customer's link explains the wait in one line (M08-29).
- *The customer blocks access — nobody home, terrace locked* (`S8.wrong.4`) → party `customer`,
  reason, and the date the wait began; responsibility is recorded, not argued (M08-24).
- *Material shortage* (`S8.wrong.5`) → the project is blocked with an expected date; the customer
  sees the honest stage, not the supplier's problem (M08-25).
- *The incentive claim is rejected* (`S8.wrong.6`) → surfaced with its reason on the project and
  the link (M08-27).
- *A project is blocked and the blocker is cleared, then blocked again* → two waits, two
  measured lengths, both on the timeline; the second does not erase the first (M08-21).
- *Nobody knows how long it will take* → expected-until stays empty and renders as unknown; the
  module never fills it with a guess, and the pack's typical range — where the pack declares one
  — is what the customer's page may say instead (M08-26).

**Acceptance criteria.**
- Given a coordinator sets a blocker, when they save, then a party from the four-value set, a
  reason and a start date are recorded, and saving without a party is impossible (M08-20,
  M08-21, M08-23).
- Given a blocked project, when the board and the detail screen render, then the project is still
  in its own stage with its true days-in-stage, and the blocker rides on top of it (M08-22).
- Given a blocker with party `customer` and a start date, when the customer opens their progress
  link, then the wait and its start are visible to them (M08-24, M08-29).
- Given a material blocker with an internal note naming a supplier, when the customer's page
  renders, then the internal note is not on it (M08-25).
- Given a market pack that declares a typical wait for utility inspection, when a utility blocker
  renders on the customer's page, then the framing is the pack's and this module supplies only
  the party, reason and dates (M08-26, M08-28, M08-29).
- Given a rejected incentive claim, when the project renders, then the rejection and its reason
  are visible rather than the project simply sitting in its stage (M08-27).

**Localization notes.** The four party labels are pack/locale strings translated EN/HI/MR; the
canonical values `utility`/`customer`/`material`/`company` are identifiers and are never
translated (`F3-12`). Reason text is tenant-entered free text and is not translated by the
product. **Analytics events.** `project_blocker_set` (party, has expected-until),
`project_blocker_cleared` (party, wait length in days), `project_blockers_grouped_view`.

### M08.5 — The document checklist

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M08-30 | **The document checklist is seeded at project creation from the tenant's market pack, and this module defines no row name.** The row set, and which rows a segment omits, are pack data — a commercial project omits the incentive row in the India pack, and a market with no incentive model has no such row at all (`F1-52`, `F1-14`). This module owns seeding, the statuses, the handover rule that reads them, and nothing about what the rows are called. | `SRC` — `DOC04.document-checklist` (docs/04: "market-pack data, seeded at project creation … 8 rows; incentive row omitted for commercial"); `S8.screen.4`; `F1-52`, `F1-22` consumed | P0 |
| M08-31 | **Each row has exactly three states — pending · uploaded · verified — and verification is a separate act from upload, recorded with who verified and when.** Uploading is not approving: the person who attaches the file and the person who confirms it is the right file may differ, and the checklist is only a defence if that distinction is real. | `SRC` — `DOC04.document-checklist` ("Statuses pending / uploaded / verified"); `S8.screen.4` ("Each: pending / uploaded / verified"); `F2-22` consumed (document events audited) | P0 |
| M08-32 | **Handover is defined by the checklist: every row past pending, and the pack shared on the customer's link.** That is the definition, and no other surface may redefine it. A project cannot reach `HANDED_OVER` with a pending row. | `SRC` — `DOC04.document-checklist` (verbatim: "Handover = all rows past pending + pack shared on the link"); `S8.screen.8` | P0 |
| M08-34 | **The checklist is a completeness surface, not a stage gate.** No stage move in the chain is blocked by a pending document; only handover reads the checklist as a condition (`M08-32`). Real projects collect paperwork out of order, and a checklist that blocks the board is a checklist people work around. | `SRC` — `DOC04.document-checklist` (the handover condition is the only stated gate; read as exclusive — stated in-row rather than assumed); `S8.rule.v1-boundary` (the module tracks status, it does not sequence work) | P0 |

**Behavior detail.** The checklist renders as its pack rows in pack order with a status chip
each, a count at the top ("*n* of *m* verified" — *m* is the market pack's checklist length; the
IN pack's instance is eight rows — phrasing generalised by Task 26), and per-row actions: upload, replace, view, mark
verified. A row may hold more than one file. Rows never disappear when complete — a green row is
information. The checklist is reachable from the card as well as the detail screen, because on
site it is the reason the coordinator opened their phone.

Permissions: `F2.M08.project-documents` — EPC Owner · Sales Manager · Project Manager ·
Operations. Upload and verify are the same grant by source (the v1 capability was one row);
verification being a distinct *act* does not make it a distinct *grant*. Document events are
audited (`F2-22`).

**Edge cases & what-goes-wrong.**
- *A commercial project in a market whose pack omits the incentive row* → the row is absent, not
  greyed; the count reflects the real row set (M08-30).
- *The wrong file was uploaded and verified* → replace and re-verify; both acts stand on the
  timeline, and nothing is deleted from the history (M08-31, M08-17).
- *The coordinator tries to hand over with a pending row* → handover is refused with the pending
  rows named (M08-32).
- *A stage needs to move before its paperwork exists* → it moves; the checklist stays incomplete
  and visible (M08-34).

**Acceptance criteria.**
- Given a new project in any market, when the checklist seeds, then its rows are exactly the
  pack's rows for that project's segment, and no row name originates in this module (M08-30).
- Given an uploaded document, when it is marked verified, then the verification records who and
  when, and upload alone never sets verified (M08-31).
- Given a project with any row still pending, when handover is attempted, then it is refused and
  the pending rows are named; given every row past pending and the pack shared on the link, then
  handover proceeds (M08-32).
- Given a pending checklist row, when a stage move is attempted, then the move succeeds (M08-34).

**Localization notes.** Row names are pack labels translated EN/HI/MR (`F1-52` content,
`foundations/F3` rendering); status words are product vocabulary with fixed canonical values
(`F3-12`). **Analytics events.** `project_document_uploaded` (row key), `project_document_verified`
(row key), `project_checklist_completion` (verified/total at handover attempt).

### M08.6 — Tranche surfaces: the money this module shows

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M08-35 | **The accepted proposal version's payment terms *are* the project's collection schedule — the same rows, never re-entered and never re-derived.** This is the connection that makes the module valuable: *"solar businesses die of cash flow, not of bad design software,"* and money owed against a passed milestone is the most common leak. The schedule's rows, states and arithmetic are `modules/M11`'s (`DOC04.tranches-money-path`); this module owns the project-side surfaces that show them and the stage event that moves them. | `SRC` — `S8.rule.tranches` (verbatim: "they are the project's collection schedule", and the rationale verbatim); `M06-13` consumed (step 7 defines the terms); `DOC04.tranches-money-path` (cited — `modules/M11`) | P0 |
| M08-36 | **Completing a stage makes the matching tranche due**, through the schedule's stage mapping against the canonical chain (`R2`). A tranche mapped to a skipped stage becomes due when the project passes the point that stage occupied, so a skippable stage never strands money; the state transitions themselves — upcoming → due → part-received → received, and waived as terminal — are `modules/M11`'s. | `SRC` — `S8.rule.tranches` ("When a stage completes, the matching tranche becomes due"); `R2` as amended (the `due_on_stage` mapping uses this chain); `DOC04.tranches-money-path` (cited — `modules/M11` owns the states). **The skipped-stage clause is an author completion, stated in-row rather than assumed** (the `M08-34` pattern): the source rules only that *completing* a stage makes its tranche due and is silent on a stage the market's pack marks skippable, so the never-strand-money reading is this suite's, not the source's. The alternative reading — the tranche stays `upcoming` until a person releases it — is available to an owner ruling and would change this rule alone, not the schedule's structure. `modules/M11` reciprocates the same disclosure at `M11-12`, and neither module cites the clause as source truth | P0 |
| M08-37 | **Every project surface that shows money shows collected against due, and never a stale figure.** The board card, the detail screen's payments block and the portfolio views read the same computed values as the payments screen itself — one figure everywhere (`F8-24`) — recomputed before display (`F8-12`). A projection is never shown here as an amount owed (`F8-23`). | `SRC` — `S8.screen.1` ("payment collected vs due" on the card); `S8.screen.2`; `F8-12`, `F8-23`, `F8-24` consumed | P0 |
| M08-38 | **When a tranche falls due the coordinator raises the request in one tap — and it sends from the tenant's connected transactional channel where one exists (owner ruling 2026-08-04, Q33).** The message is composed with the project's real figures; with a connected official channel the coordinator's tap sends it under the transactional template class with the channel's honest delivery states (payment links are a named transactional moment); with no channel connected it is ready-to-paste and the person sends it in whatever channel they already use — and on that fallback there is no delivery state anywhere, because the product did not do the sending. | `SRC` — `S8.rule.tranches` ("the coordinator can request a ready-to-paste request message in one tap"); `S8.screen.3` (the copy action — `modules/M11`'s screen); `D32`'s manual rule superseded for transactional moments by owner ruling 2026-08-04 (Q33; lane boundary `M03-03`) | P0 |
| M08-39 | **An unpaid due tranche is visible and chased — and never blocks the customer's progress link.** It surfaces on the board card, on the project, and on the owner's dashboard (`modules/M13`), and the rep is prompted to chase the person. The product rule is absolute and this module states it because this is where the temptation lives: ***"never block the customer's progress link over money — chase the person, do not punish the view."*** No stage, document, link or handover behaviour in this module may be made conditional on payment. | `SRC` — `S8.wrong.3` (verbatim; the money-mechanics half is `modules/M11`'s); `C.lifecycle.7` (cited — the link-lifecycle law, `foundations/F5`) | P0 |

**Behavior detail.** The payments block on the project detail is a ledger view of the inherited
schedule: each row shows its label, its share, its amount, its state and its date where it has
one, with the due row lifted and carrying the request action — which sends from the tenant's
connected transactional channel where one exists and composes the ready-to-paste message where
none is connected (`M08-38`, owner ruling 2026-08-04, Q33; this line previously named it the
copy-message action, D32's retired manual-only affordance — see `registers/conflicts.md` row 4).
The screen where money is actually recorded — mode, reference, receipt file, reversal — is
`modules/M11`'s, and this module links into it rather than duplicating a control. A project whose accepted proposal carries no
payment terms shows an empty schedule and says so plainly; it never fabricates rows.

**The OPEX/PPA money surface is ruled (owner ruling 2026-08-04, Q32):** a project behind an
operating-expense / power-purchase proposal shows the **one-time payments its accepted version
carries** — deposit, connection fee, whatever the version's terms name — with the **full
tranche toolset** (states, due-on-stage, request messages, receipts via `modules/M11`), plus an
honest note on the money surface: **"monthly energy billing is handled outside this platform."**
Nothing is fabricated, nothing is hidden, and no recurring invoicing or meter ingestion exists
(`R17`, §5). `M11-16` states the same rule from the money module's side.

Permissions: recording money is `F2.M11.record-payments` — EPC Owner · Sales Manager · Project
Manager · Finance. Reading the money block rides `F2.M08.project-visibility`; the Sales
Executive's own-deal read is read-only (`M08-18`), and no surface reachable by the Installation
Team Member preset shows any of it (`F2-06`, `M08-43`). Payment events are audited (`F2-22`).

**Edge cases & what-goes-wrong.**
- *The customer is not paying a due tranche* (`S8.wrong.3`) → visible on the board and the owner's
  dashboard, the rep is prompted to chase, and the customer's link keeps working exactly as
  before (M08-39).
- *A stage that a tranche was mapped to is skipped in this market* → the tranche still becomes due
  at the point the project passes it (M08-36).
- *The accepted proposal is superseded by a new version with revised terms* → the schedule follows
  the version in force, with the original preserved (§M08.9, M08-50).
- *A figure differs between the card and the payments screen* → it cannot: they read the same
  computed values (M08-37).

**Acceptance criteria.**
- Given a project created from a won deal, when its payments block renders, then it shows the
  accepted proposal version's payment terms as the same rows, with nothing re-entered (M08-35).
- Given a coordinator completes the stage a tranche is mapped to, when the move saves, then that
  tranche is due and the request action is available on it — sending from the tenant's connected
  transactional channel where one exists, composing the message for a person to send where none is
  (M08-36, M08-38, owner ruling 2026-08-04 Q33). *(This line previously named only the
  copy-message action, D32's retired manual-only affordance — see `registers/conflicts.md` row 4.)*
- Given a due tranche on a tenant with a connected transactional channel, when the coordinator
  taps the request action, then a message with the project's real figures sends from that official
  channel under the transactional template class, and the channel's delivery states are shown as
  it reports them (M08-38, owner ruling 2026-08-04 Q33).
- Given a due tranche on a tenant with no connected channel, when the coordinator taps the request
  action, then the same message is composed with the project's real figures for the person to send
  in whatever channel they already use, and no delivery state appears anywhere on the surface
  (M08-38, owner ruling 2026-08-04 Q33). *(These two lines replace one that carried D32's retired
  manual-only rule — clipboard-only, nothing transmitted, no delivery state on any path — which
  contradicted M08-38's own row above and §5's "No fabricated delivery state"; see
  `registers/conflicts.md` row 4.)*
- Given a project with an overdue tranche, when the customer opens their progress link, then the
  link works normally and shows the project's progress (M08-39).
- Given the board and the payments screen open at once, when both render the same project, then
  collected and due are the same figures (M08-37).

**Localization notes.** Currency and number rendering per the market pack (`F1-46` via
`foundations/F3`); the request message is a tenant template in the tenant's languages
(`modules/M01`'s template surface), and the module ships no message copy of its own.
**Analytics events.** `project_tranche_became_due` (stage, share), `project_payment_request_copied`,
`project_money_block_viewed`.

### M08.7 — The installation checklist surface

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M08-41 | **The installation checklist is reused, not rebuilt.** The steps are the design's derived work order — the real build sequence the studio already produces (`M05-76`, consumed) — and this module owns its *execution*: working the steps, ticking them, attaching evidence, adding a manual step the design could not know about, and the progress the project reads from it. *"Do not rebuild it."* | `SRC` — `S8.screen.6` (verbatim, incl. "Do not rebuild it"); `DOC04.installation-checklist` (steps generated from the design's structural sequence, "with manual additions"); `M05-76` consumed | P0 |
| M08-42 | **Ticks are attributed to the person who ticked, and an optional free-text "done by" per step records who actually did the work.** `R16` rules the v1 answer and it is carried whole: the coordinator runs the checklist and the attribution never depends on the installer having an account. In V2's preset vocabulary that coordinator is the **Project Manager** — `R16`'s "Manager role" is v1's preset name, and decision B assigns the duty to the Project Manager (`F2-08b`), with `F2-07` keeping the fallback in place permanently because mixed teams are the normal case (`PS-28`). | `SRC` — `R16` (RULING, verbatim: "Ticks are attributed to the coordinator; an optional free-text 'done by' per step captures the crew member's name"); `UXG-20`; `DOC04.installation-checklist`; `F2-07`/`F2-08b` consumed | P0 |
| M08-43 | **No commercial figure appears on this surface, ever — no price, no discount, no tranche, no margin, no customer value.** v1 got the property free by giving the installation team no screen at all — *"crew sees no money because crew sees no screen"* — and where V2 gives them a screen the surface itself must preserve it. This is a property of the surface, not of the viewer: the rule holds even when an EPC Owner is the one looking at it. | `SRC` — `R16` (verbatim); `S8.rule.roles` ("the installation checklist only … nothing financial"); `F2-06`, `PS-27`, `M05-77` consumed | P0 |
| M08-45 | **The Installation Team Member's own job surface: today's assigned installation, its checklist with progress, the site's access constraints, and the photographs expected — and nothing else.** This surface is V2 scope: `R16` deferred the login and its own consequence named the path ("v2 adds an Installer preset without schema change"), and the owner's brief names installation teams as primary users. Every rule above rides it unchanged — `M08-42`'s attribution and `M08-43`'s no-figures law — and the coordinator fallback is not removed when accounts exist. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Users ("Installation Teams"); `F2-05` (decision C — the preset ships), `PS-26` (the persona's home) · the v1-derived constraints it inherits are source-derived per `R16` and stated at `M08-42`–`M08-43` | P1 |

**Behavior detail.** The checklist renders as the design's phases with their steps in build order,
each step a tick with its detail and the materials it needs; progress shows "done of total". A
manual step can be added where reality diverges from the model, and it is marked as manually
added so the derived sequence stays legible. The empty state is the design's own
("place modules and string the array first" — `M05-76`), not a blank. Completing the checklist
does not by itself move the stage; a person moves stages (`M08-14`).

Permissions: `F2.M08.installation-checklist` — EPC Owner · Project Manager (as coordinator, with
`F2-07` attribution) · Installation Team Member (whose surface obeys `F2-06`). Note that the
Sales Manager, the v1 `Manager` preset's direct successor, does **not** hold this row: decision B
moved the coordinator's checklist duty to the Project Manager, and `R16`'s "Manager role" wording
is v1's, not V2's (recorded on the F2 row itself so no reader is misled).

**Edge cases & what-goes-wrong.**
- *The team has no accounts and the coordinator runs the checklist from their phone* → the v1
  behaviour exactly: ticks attributed to the coordinator, "done by" naming who did the work
  (M08-42).
- *Mixed teams — some members with accounts, some without* → both paths coexist; the fallback is
  never removed (M08-42, `F2-07`).
- *An installation-team member opens the app expecting to see the project's value* → there is no
  such figure on any surface they can reach, by construction (M08-43).
- *The design changes after the checklist was started* → the derived steps are the design's
  (`modules/M05`); already-ticked steps keep their ticks and their attribution, and the divergence
  is visible rather than silently reconciled.

**Acceptance criteria.**
- Given a designed and strung system, when the installation checklist opens on the project, then
  its steps are the design's derived work order in build order, and this module has generated no
  sequence of its own (M08-41).
- Given any step is ticked, when the record is written, then it names the person who ticked, and
  a free-text "done by" may be recorded against that step (M08-42).
- Given any surface reachable by the Installation Team Member preset, when it renders, then it
  contains no price, discount, tranche, margin or customer value (M08-43).

**Localization notes.** Step titles and phase names come from the design's derived plan
(`modules/M05`) and render in the viewer's language; "done by" is free text and is never
translated. **Analytics events.** `installation_step_ticked` (step, has done-by),
`installation_step_added_manually`, `installation_checklist_completed`.

### M08.8 — Handover, closure and the referral ask

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M08-46 | **Handover is one act with four parts: the document pack is assembled from the checklist, shared to the customer, the customer's link becomes the pack, and the project reaches `HANDED_OVER`.** The share rides the transactional lane (owner ruling 2026-08-04, Q33): with a connected channel the handover message sends automatically from the tenant's official channel; with none, the rep downloads and sends the composed message manually and no delivery is claimed. The link's transition into its final — now permanent — phase is `foundations/F5`'s (`F5-70`, Q34). Handover is refused while any checklist row is pending (`M08-32`). | `SRC` — `S8.screen.8` (verbatim: "document pack downloaded and shared by the rep, project closed, referral asked for"); `DOC04.document-checklist` (the handover condition); `C12`, `C.lifecycle.7` (cited — `foundations/F5`); send rail per owner ruling 2026-08-04 (Q33) | P0 |
| M08-47 | **The referral is asked for at handover, because that is the moment the customer decides.** *"Ask for the referral here, while the roof is new and the first bill is about to drop — not six months later."* The ask is part of the handover flow and produces the referral link between the referring customer and any lead that comes from it — the tag and the "came from" chip are `M02-16`'s object, and this module is the surface that starts one. **No credit, no redemption, no balance exists** — the credits ledger is the spec-locked exclusion (§5). | `SRC` — `R15` (RULING — the handover-ask half; the CRM-core tag half is `M02-16`); `UXG-19` (the handover-time ask); `C12` (the timing rule, verbatim); `S8.screen.8` | P0 |
| M08-48 | **Commissioning artefacts are retained at handover so a future monitoring or service surface can attach without re-collection** — the certificates, the as-built references and the system facts the handover pack contains stay with the project rather than living only inside a downloaded file. Retention is the whole of the commitment: there is no telemetry, no monitoring, no service module and no customer app in v1 (§5). | `SRC` — `CG-6` (docs/12, SKIP-DELIBERATELY: "Commissioning artefacts are retained at handover so an O&M module can attach post-v1 — but no monitoring code, telemetry ingestion or customer app in v1"); `DOC00.nongoal-projects-light` (the retention clause; disposed by Task 3, fulfilled here) | P0 |
| M08-49 | **Closing is not deleting.** A handed-over project stays readable with its timeline, its documents, its checklist and its money history intact, and its customer link continues to serve the pack (lifecycle per `foundations/F5`). Nothing about closure removes a record from the product. | `SRC` — `S8.screen.8` ("project closed" — closure as a state, not a deletion); `DOC04.timeline` (append-only — cited); `C.lifecycle.7` (cited — `foundations/F5`) | P1 |

**Behavior detail.** The handover action lives on the project detail. It shows the assembled pack
— the checklist's verified files, in pack order — with the pending-row block if there is one, the
share action, and the referral ask as the last step of the same flow rather than a separate
errand somebody remembers later. The referral ask is a prompt with a one-tap outcome: it records
that the ask was made and captures the referred person if the customer names one there and then;
whatever it produces is `M02-16`'s referral row, on both records.

Permissions: assembling and sharing the pack rides `F2.M08.project-documents` plus the link
operations of `foundations/F5`'s §F2.5-F5 table; reaching `HANDED_OVER` rides
`F2.M08.update-stages`. The referral row itself is `modules/M02`'s object and adds no grant here.

**Edge cases & what-goes-wrong.**
- *A pending checklist row at handover* → refused, rows named (M08-32, M08-46).
- *The customer never opens the pack* → opens are tracked always (`foundations/F5`); delivery is
  claimed only where the tenant's connected channel sent it and reported it, and never on the
  no-channel fallback, where nothing in this module claims the pack arrived (M08-46, owner ruling
  2026-08-04 Q33). *(This bullet previously denied delivery state on every path under `D32`, the
  retired manual-only rule — see `registers/conflicts.md` row 4.)*
- *The customer names a referral months later instead* → the CRM path exists independently
  (`M02-16`); the handover ask is the prompt, not the only door.
- *A tenant wants to reward the referrer* → there is no credit mechanism to configure; the
  exclusion is explicit (§5), and the referral rows a future ledger would need already exist.
- *A handed-over project needs a document re-issued* → it is readable and its documents are
  retrievable; closure never made it inert (M08-49).

**Acceptance criteria.**
- Given every checklist row past pending, when handover runs, then the pack is assembled from the
  checklist, the link becomes the pack and the project reaches `HANDED_OVER` (M08-46).
- Given handover on a tenant with a connected transactional channel, when the share runs, then the
  handover message sends automatically from that official channel and its delivery state is shown
  as the channel reports it (M08-46, owner ruling 2026-08-04 Q33).
- Given handover on a tenant with no connected channel, when the share runs, then the rep can
  download the pack and send the composed message themselves, and no delivery is claimed (M08-46,
  owner ruling 2026-08-04 Q33). *(The manual half was this block's whole share criterion before;
  the connected-channel branch M08-46's own row and §5 both register had no acceptance line —
  added here, see `registers/conflicts.md` row 4.)*
- Given the handover flow, when it completes, then the referral ask has been presented in the
  same flow, and any referral it produces is the CRM's referral row with no credit, balance or
  redemption anywhere in the product (M08-47).
- Given a handed-over project, when it is opened later, then its commissioning artefacts,
  documents, timeline and money history are all still readable (M08-48, M08-49).

**Localization notes.** Handover and referral copy EN/HI/MR; the pack's document names are the
market pack's row labels (`F1-52`). **Analytics events.** `project_handover_completed`
(documents in pack), `project_referral_asked` (outcome: named / declined / skipped),
`project_pack_shared`.

### M08.9 — Change after Won, and cancellation

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M08-50 | **A change after Won produces a new proposal version with revised payment terms, and the original is preserved.** The customer who wants two more panels gets a new version, not an edit: the project then points at the version in force, the earlier one stays readable, and the collection schedule follows the version in force. The versioning is `modules/M06`'s and the tranche revision is `modules/M11`'s; what this module owns is that the project moves its reference and never rewrites its history. | `SRC` — `S8.wrong.7` (verbatim: "new proposal version, revised tranches, original preserved"); `DOC04.proposal-versions-immutable` (cited — `modules/M06`); `DOC04.tranches-money-path` (cited — `modules/M11`) | P0 |
| M08-51 | **A project may be cancelled from any stage, the reason is mandatory, the state is terminal, and revenue stops counting immediately.** *"Reporting must not silently keep counting it as revenue."* Won means signed, and a deal cancelled after Won never quietly persists in a total — the reporting consequence is `modules/M13`'s and the honesty law is `F8-32`'s; the state, the mandatory reason and the immediacy are this module's. | `SRC` — `R2` as amended (`CANCELLED`, "reason required; revenue stops counting immediately"); `S8.wrong.8` (verbatim); `D37` (cited — `modules/M13`); `F8-32` consumed | P0 |
| M08-52 | **A project is never deleted, and cancellation is the correction path for a mistaken Won.** There is no delete action on a project anywhere in the product; a project won by mistake is cancelled with a reason, which is a record rather than an erasure (`modules/M07`'s close surface names this module as the correction path). | `SRC` — `S8.wrong.8` ("allowed with a reason"); `M07-62` edge case reciprocated; `DOC04.merge-tombstone` pattern (cited — the suite's never-delete posture, `modules/M02`) | P0 |
| M08-53 | **Cancellation preserves history: the timeline, documents, checklist and receipts of a cancelled project stay readable.** Money already received is not unwound by the cancellation itself — reversal is `modules/M11`'s append-only mechanism (a reversing entry, never an edit), and the project simply stops counting as revenue from the moment it is cancelled. | `SRC` — `DOC04.payments-append-only` (cited — `modules/M11`'s row: "append-only with reversal rows … never edited"); `R2` as amended (revenue stops immediately); `DOC04.timeline` (cited) | P1 |

**Behavior detail.** Cancellation is a card and detail action with a mandatory reason, an explicit
confirm that states what happens ("this project stops counting as revenue immediately"), and no
undo — a project cancelled in error is not un-cancelled by a button; the record shows what
happened. Cancelled projects leave the active board and remain reachable through the project list
with their state and reason, because a board that hides its failures teaches nothing. A change
after Won is initiated in `modules/M06` (a new version on the deal) and lands here as a changed
reference, visible on the timeline with both version numbers named.

Permissions: cancellation rides `F2.M08.update-stages` — `CANCELLED` is a state of the same
machine, and no separate grant is invented for it (recorded in the §F2.5-M08 notes). It is an
audited event by name in `F2-22`'s covered-events list ("Cancelled-after-Won").

**Edge cases & what-goes-wrong.**
- *The customer wants two more panels* (`S8.wrong.7`) → a new proposal version with revised terms;
  the original is preserved and the project points at the version in force (M08-50).
- *A project is cancelled after Won* (`S8.wrong.8`) → allowed with a reason; revenue stops
  counting from that moment and no report keeps it silently (M08-51).
- *Won was marked by mistake* → cancellation with a reason, never a delete (M08-52).
- *Money was already collected on a cancelled project* → the receipts stand; reversal is an
  append-only entry in `modules/M11`, and this module shows the project's true history (M08-53).
- *A cancelled project's customer link* → lifecycle handled by `foundations/F5`; this module never
  revokes a link as a punishment and never over money (`M08-39`).

**Acceptance criteria.**
- Given a customer changes scope after Won, when a new proposal version is accepted, then the
  project references the new version, the earlier version remains readable, and the collection
  schedule follows the version in force (M08-50).
- Given a project in any stage, when it is cancelled, then a reason is mandatory, the state is
  terminal, and from that moment it is excluded from revenue anywhere it was counted (M08-51).
- Given any project in any state, when a user looks for a delete action, then there is none
  (M08-52).
- Given a cancelled project that had received payments, when it is opened, then its receipts,
  documents and timeline are readable and any reversal appears as its own entry (M08-53).

**Localization notes.** Cancellation reasons are tenant free text; the confirm copy and the
"stops counting as revenue" statement are product strings in EN/HI/MR. **Analytics events.**
`project_cancelled` (stage at cancellation, days since creation), `project_version_changed`
(from version, to version).

## 4. Cross-module contracts

**Expects from others.**

- `foundations/F1` — stage labels and the skippable-stage set, blocker-party labels, the document
  checklist rows with their per-segment omissions, and the utility directory (`F1-09`, `F1-22`,
  `F1-35`; the India instance `F1-51`–`F1-53`), plus number and date formats (`F1-46`).
- `foundations/F2` — §F2.5-M08's capability rows and the project visibility domain (`F2-12`–`F2-14`);
  the installation-surface laws `F2-06` and `F2-07`; decision B's assignment of the coordinator
  duty (`F2-08b`, `F2-08c`); the audit obligations of `F2-22`.
- `foundations/F5` — the customer progress link: its token, its lifecycle, its stage rendering and
  every word the customer reads, including the wait line this module's blockers feed.
- `foundations/F8` — one figure everywhere (`F8-24`), money recomputed before display (`F8-12`),
  projections never presented as amounts owed (`F8-23`), reversal stops counting (`F8-32`).
- `modules/M02` — the won transition that creates the project (`M02-57`), the one timeline
  (`DOC04.timeline`), and the referral object the handover ask produces (`M02-16`).
- `modules/M04` — the site record and the utility it carries (`F1-53`'s directory).
- `modules/M05` — the installation plan as a derived work order (`M05-76`) and its
  no-commercial-figures property (`M05-77`).
- `modules/M06` — the accepted proposal version, its payment terms (`M06-13`), its type
  (`M06-06`), and the server-identifier law this module's numbering shares (`M06-44`).
- `modules/M07` — Mark won, the act that creates the project (`M07-62`).
- `modules/M11` — the tranche states, the receipts ledger, payment modes, reversal, and the
  payments screen itself.
- `modules/M12` — the active-project entitlement gate at creation (`DOC16.gate.active-projects`).

**Provides to others.**

- `foundations/F5` — the facts the customer's progress page renders: the project's current stage
  as a canonical value, the stage history with dates, and for each blocker its party, reason,
  start date and expected-until. This module produces the facts; F5 writes the sentence.
- `modules/M11` — the stage-completion event that makes a tranche due (`M08-36`), and the project
  context every receipt is recorded against.
- `modules/M13` — the stage machine, days-in-stage, blocker attribution by party, and the
  cancellation event that stops revenue counting (`M08-51`); aging and portfolio reporting read
  these and add no new state.
- `modules/M02` — the handover-time referral ask that produces a referral row (`M08-47`), and
  every project event that lands on the shared timeline.
- `modules/M12` — the definition of an active project (`M08-07`) the entitlement gate counts.
- `foundations/F6` — the notification-worthy events this module raises: a tranche became due, a
  blocker was set or has run past its expected-until, a project aged in stage, handover completed.
  The matrix and the thresholds are F6's.
- `foundations/F2` — the row appended to §F2.5-M08 (numeral corrected by Task 26 — F2's own note
  records "one row added"; this line previously said "two") and the notes recording what
  deliberately did **not** become a row.

## 5. Non-goals

Each is an explicit exclusion with the source's rationale, not a deferral — per `OV-43` there is
no "later" bucket. The governing sentence is `M08-01`'s: *"This is a status + documents + money
tracker, not project-management software."*

- **No inventory or stock levels.** The product is the selling engine; the project is status,
  documents and money. Tracking stock is a different business system with a different data owner,
  and the source excludes it by name (`D9`, `S8.rule.v1-boundary`; DD2 keeps it out because the
  V2 brief does not ask for it).
- **No purchase orders to suppliers, and no procurement workflow.** The project records that
  material was ordered as a *stage*; it does not raise, approve or track the order itself
  (`S8.rule.v1-boundary`).
- **No rostering or scheduling engine for installation teams.** There is no assignment algorithm,
  no capacity model and no calendar of team availability in this module. The installation
  checklist records what was done and by whom; who is sent where is a decision the tenant makes
  outside the product in v1 (`S8.rule.v1-boundary`; `D9`). Field-workforce presence and visit
  tracking are `modules/M09`'s separate `BRIEF` scope and are not a scheduling engine either.
- **No Gantt charts, no task dependencies, no critical path.** The board's only metric is
  days-in-stage (`S8.rec.2`), and dependency modelling is exactly the "MS Project" the source
  refuses to sell (`S8.rule.v1-boundary`).
- **No operations and maintenance, no generation monitoring, no annual maintenance contracts, no
  service ticketing, and no end-customer monitoring application.** Commissioning artefacts are
  retained at handover so such a surface can attach later without re-collecting anything
  (`M08-48`), but no telemetry is ingested, no monitoring code exists and no customer app ships
  (`D9`; `CG-6`, SKIP-DELIBERATELY; `CG-matrix.19`).
- **No recurring billing or meter ingestion behind an operating-expense / power-purchase
  project.** The proposal type exists as a document type; the billing engine behind it is an
  explicit non-goal (`R17`; the non-goal's own record is `modules/M06` §5 and
  `01-product-overview.md` §6). A project of that type tracks the same stages and checklist
  (`M08-06`).
- **No referral credits, redemption or balance.** The referral tag and the "came from" chip ship
  (`M02-16`); the credits ledger is the spec-locked exclusion — *"no monetary credit, no
  redemption, no balance in v1"* — and when one arrives it references the referral rows that
  already exist, so there is no backfill problem (`R15`; `UXG-19`).
- **No utility-specific application packets in v1.** The site carries its utility, blockers
  attribute the wait and the checklist tracks the application (`M08-28`); generated
  state-by-state application packets are a post-launch document-template family
  (`CG-3`, DESIGN-FOR; `F1-53`).
- **No five-state project shorthand.** The earlier short chain is deprecated by ruling and appears
  nowhere in this suite — not as a model, a filter or a display grouping (`R2`; `D9`'s superseded
  half).
- **No separate coordinator role, and no per-project permission exceptions.** The coordinator is a
  preset (`D27`; decision B's Project Manager), and the permission model has no per-person
  overrides (`F2-15`/`F2-16`).
- **No fabricated delivery state.** Request messages and handover-pack sends ride the
  transactional lane — automatic from the tenant's connected channel, composed for a person to
  send where none is connected (owner ruling 2026-08-04, Q33); the product tracks link opens
  always, and claims delivery only as a connected channel reports it (`M08-38`, `M03-03`).

## 6. Open questions

Mirrored into `registers/open-questions.md`.

- **M08-Q1 (→ register Q32) — RESOLVED (owner ruling 2026-08-04, Q32).** The money surface of
  an operating-expense / power-purchase project is the **one-time payments from the accepted
  version** (deposit / connection fee, as its terms name them), with the **full tranche
  toolset**, plus the honest note **"monthly energy billing is handled outside this
  platform"** — nothing fabricated, nothing hidden (§M08.6 behavior detail; `M11-16` states
  the same from the money side). No recurring invoicing and no meter ingestion exist (`R17`,
  §5 — unchanged). Q29 (the type is ungated) resolved in the same session.
