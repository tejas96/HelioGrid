# M08 · Projects — Status, Documents, Money — engineering tasks

This file is the engineering task set for **M08 · Projects**: the post-Won surface set — the stage board and the canonical stage machine, the one project detail screen, blockers and wait attribution, the document checklist, the project-side money surfaces, the installation checklist and the installer's own job surface, handover with the referral ask, and change-after-Won with cancellation. Task ids in this file carry the prefix **`T-M08-`**.

**Source docs.** Every row quoted or cited here comes from `docs/prd/modules/M08-projects.md`. Screen tasks carry their verbatim requirement slice in the screen briefs under `docs/ux/briefs/`; the Screens Register is `docs/prd/registers/screens.md`. Rows this file does not build directly are dispositioned as laws below, and the Disposition index at the end of the file accounts for every row in the M08 bucket exactly once.

**Scope note.** The module's own scope law (`M08-01`) closes the surface set to six surfaces. No task in this file adds a seventh, and nothing outside the rows below is in scope for this file.

---

### T-M08-001 · Project Board
**Type:** screen · **Tier:** P0
**PRD rows:** M08-10 (P0), M08-11 (P0), M08-12 (P0), M08-14 (P1), M08-51 (P0)
**DESIGN:** SCR-M08-01 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M08-01-project-board.md`; they are the specification.

**DONE WHEN:**
- Given the board on a phone, when it renders, then it shows one column with a stage filter; given the same board on desktop, then it shows every column (M08-10).
- Given two projects in one stage, one there four days and one thirty-four, when the column renders, then the thirty-four-day project is above the four-day one and both show their days figure; and no card anywhere shows a percentage, burndown or completion bar (M08-11, M08-12, M08-13).
- Given a project in any stage, when it is cancelled, then a reason is mandatory, the state is terminal, and from that moment it is excluded from revenue anywhere it was counted (M08-51).
- (The PRD states no dedicated acceptance line for M08-14; the row's own text and the timeline law `M08-17` govern it — a stage move is actor-stamped on the append-only timeline, and a backward move is its own event with equal weight.) *(Amended 2026-08-07 by owner ruling `Q61`: this note read "a stage move is online-first, actor-stamped…"; the offline/sync capability was removed, so there is no connectivity class left for a stage move to belong to.)*
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M08-002 · Project Detail
**Type:** screen · **Tier:** P0
**PRD rows:** M08-16 (P0), M08-17 (P0), M08-21 (P0), M08-27 (P0), M08-38 (P0)
**DESIGN:** SCR-M08-02 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M08-02-project-detail.md`; they are the specification.

**DONE WHEN:**
- Given a project, when its detail screen opens, then the stage timeline, design, proposal, payments, documents, blockers and activity are all present on one screen, each naming the object it reads (M08-16).
- Given any stage change, blocker, document or payment event on the project, when the activity block renders, then the event is in the same stream with its actor, in order, and nothing is editable after the fact (M08-17).
- Given a coordinator sets a blocker, when they save, then a party from the four-value set, a reason and a start date are recorded, and saving without a party is impossible (M08-20, M08-21, M08-23).
- Given a rejected incentive claim, when the project renders, then the rejection and its reason are visible rather than the project simply sitting in its stage (M08-27).
- Given a coordinator completes the stage a tranche is mapped to, when the move saves, then that tranche is due and the request action is available on it — sending from the tenant's connected transactional channel where one exists, composing the message for a person to send where none is (M08-36, M08-38, owner ruling 2026-08-04 Q33).
- Given a due tranche on a tenant with a connected transactional channel, when the coordinator taps the request action, then a message with the project's real figures sends from that official channel under the transactional template class, and the channel's delivery states are shown as it reports them (M08-38, owner ruling 2026-08-04 Q33; `M03-03`).
- Given a due tranche on a tenant with no connected channel, when the coordinator taps the request action, then the same message is composed with the project's real figures for the person to send in whatever channel they already use, and no delivery state appears anywhere on the surface (M08-38, owner ruling 2026-08-04 Q33 — the no-channel fallback branch of the pair above).
  - (M08-38's PRD acceptance line at §M08.6 formerly stated that fallback half **unscoped** — the pre-Q33 wording, retained here for traceability: the request action was clipboard-only, *"nothing transmitted, no delivery state on any path"*, which contradicted the M08-38 row printed in `docs/ux/briefs/SCR-M08-02-project-detail.md`, the row that requires the send. **That acceptance block now carries both branches itself at `docs/prd/modules/M08-projects.md` §M08.6, annotated to the owner ruling of 2026-08-04 (Q33) — the gap this note was opened for is closed, and the two lines above are the PRD's own criteria rather than a supplement to them.** The reconciled M08-38 row in the brief remains the binding requirement text, together with `docs/prd/modules/M08-projects.md` §5's *"No fabricated delivery state. Request messages and handover-pack sends ride the transactional lane — automatic from the tenant's connected channel, composed for a person to send where none is connected (owner ruling 2026-08-04, Q33); the product tracks link opens always, and claims delivery only as a connected channel reports it (`M08-38`, `M03-03`)."* `docs/prd/registers/conflicts.md` row 4 already records both M08 surfaces — M08-38 and M08-46 — as reconciled.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M08-003 · Document Checklist
**Type:** screen · **Tier:** P0
**PRD rows:** M08-30 (P0), M08-31 (P0)
**DESIGN:** SCR-M08-03 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M08-03-document-checklist.md`; they are the specification.

**DONE WHEN:**
- Given a new project in any market, when the checklist seeds, then its rows are exactly the pack's rows for that project's segment, and no row name originates in this module (M08-30).
- Given an uploaded document, when it is marked verified, then the verification records who and when, and upload alone never sets verified (M08-31).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M08-004 · Installation Checklist
**Type:** screen · **Tier:** P0
**PRD rows:** M08-41 (P0), M08-42 (P0)
**DESIGN:** SCR-M08-04 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M08-04-installation-checklist.md`; they are the specification.

**DONE WHEN:**
- Given a designed and strung system, when the installation checklist opens on the project, then its steps are the design's derived work order in build order, and this module has generated no sequence of its own (M08-41).
- Given any step is ticked, when the record is written, then it names the person who ticked, and a free-text "done by" may be recorded against that step (M08-42).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M08-005 · Installer Job Home
**Type:** screen · **Tier:** P1
**PRD rows:** M08-45 (P1)
**DESIGN:** SCR-M08-05 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M08-05-installer-job-home.md`; they are the specification.

**DONE WHEN:**
- Given any step is ticked, when the record is written, then it names the person who ticked, and a free-text "done by" may be recorded against that step (M08-42).
- Given any surface reachable by the Installation Team Member preset, when it renders, then it contains no price, discount, tranche, margin or customer value (M08-43).
- (The PRD states no dedicated acceptance line for M08-45; §M08.7's acceptance block covers M08-41 … M08-43 only. The row is itself the criterion and the brief carries it verbatim: this home is **today's assigned installation, its checklist with progress, the site's access constraints, and the photographs expected — and nothing else**, so an access-constraints block and an expected-photographs block are both present, and any block beyond that set is a defect (M08-45).)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M08-006 · Handover Flow
**Type:** screen · **Tier:** P0
**PRD rows:** M08-46 (P0), M08-47 (P0)
**DESIGN:** SCR-M08-06 → PENDING

**Requirements (verbatim):** Verbatim rows live in `docs/ux/briefs/SCR-M08-06-handover-flow.md`; they are the specification.

**DONE WHEN:**
- Given every checklist row past pending, when handover runs, then the pack is assembled from the checklist, the link becomes the pack and the project reaches `HANDED_OVER` (M08-46).
- Given handover on a tenant with a connected transactional channel, when the share runs, then the handover message sends automatically from that official channel and its delivery state is shown as the channel reports it (M08-46, owner ruling 2026-08-04 Q33; `M03-03`).
- Given handover on a tenant with no connected channel, when the share runs, then the rep can download the pack and send the composed message themselves, and no delivery is claimed (M08-46, owner ruling 2026-08-04 Q33 — the no-channel fallback branch of the pair above).
  - (M08-46's PRD acceptance line at §M08.8 formerly tested only the manual *"download and share"* half — the pre-Q33 wording, retained here for traceability: the connected-channel send had no acceptance line anywhere in that block. **§M08.8's acceptance block now carries the connected-channel branch itself at `docs/prd/modules/M08-projects.md`, annotated to the owner ruling of 2026-08-04 (Q33) — the gap this note was opened for is closed, and the three lines above are the PRD's own criteria rather than a supplement to them.** The M08-46 row remains the binding requirement text — *"The share rides the transactional lane (owner ruling 2026-08-04, Q33): with a connected channel the handover message sends automatically from the tenant's official channel; with none, the rep downloads and sends the composed message manually and no delivery is claimed."* — together with `docs/prd/modules/M08-projects.md` §5's "No fabricated delivery state" bullet, which names handover-pack sends explicitly. The register records the same half against this task: `docs/prd/registers/screens.md` M08-46, "share rides transactional lane"; `docs/prd/registers/conflicts.md` row 4 already records both M08 surfaces — M08-38 and M08-46 — as reconciled.)
- Given the handover flow, when it completes, then the referral ask has been presented in the same flow, and any referral it produces is the CRM's referral row with no credit, balance or redemption anywhere in the product (M08-47).
- Given a project with any row still pending, when handover is attempted, then it is refused and the pending rows are named; given every row past pending and the pack shared on the link, then handover proceeds (M08-32).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M08-007 · Project creation at the won transition
**Type:** engine · **Tier:** P0
**PRD rows:** M08-02, M08-03, M08-04, M08-05

**Requirements (verbatim):**

- **M08-02** (P0) — **A won deal *is* a project: the project is created by the won transition, automatically and atomically, and there is no "create project" step anywhere in the product.** Nobody re-enters the customer — *"asking someone to re-enter the customer is how data diverges."* The act that causes it is the rep's Mark won (`M07-62`, consumed) and the transition's atomicity is the lead machine's (`M02-57`, consumed); a customer's Accept on the link notifies the rep but never creates the project — the human confirms first (`DOC04.accepted-human-confirms` — cited, `foundations/F5`'s row).
- **M08-03** (P0) — **The project number is server-assigned from tenant counters and never client-generated**, so two people winning deals at the same moment can never collide. This is the same law the proposal number obeys — one identifier rule, two objects (`M06-44` is the proposal half).
- **M08-04** (P0) — **The project inherits by reference, never by copy: the customer and site record, the approved design, the accepted proposal version, the survey it was designed from, and the accepted version's tranche schedule.** No field is duplicated for a human to keep in step, and no screen in this module asks for a fact another module already holds. The project points at the *version in force*, so a later version supersedes it explicitly rather than by overwriting (§M08.9).
- **M08-05** (P0) — **A new project opens in `WON`, its days-in-stage clock starts at creation, and its market-dependent contents are seeded from the tenant's market pack at that moment** — the stage set with its skippable stages, the stage and blocker labels, and the document checklist rows for this project's segment. Seeding happens once, at creation; a later pack version does not silently rewrite a live project's checklist (staleness is `foundations/F8`'s law, `F1-11` the pack-version input).

**DONE WHEN:**
- Given a rep confirms Mark won on a lead, when the act completes, then a project exists immediately with a server-assigned number, in `WON`, with no re-entry of customer data and no separate create step anywhere in the flow (M08-02, M08-03).
- Given the project has just been created, when it opens, then the customer, site, approved design, accepted proposal version and the accepted version's tranche schedule are present by reference, and the document checklist is seeded for this project's segment from the tenant's market pack (M08-04, M08-05).

---

### T-M08-008 · The canonical stage machine
**Type:** engine · **Tier:** P0
**PRD rows:** M08-08, M08-09, M08-22, M08-34

**Requirements (verbatim):**

- **M08-08** (P0) — **One canonical stage chain governs every project, and it is the full nine stages plus cancellation:** `WON → MATERIAL_ORDERED → DISPATCHED → INSTALLATION → ELECTRICAL_METERING → UTILITY_INSPECTION → COMMISSIONED → INCENTIVE_CLAIMED → HANDED_OVER`, plus **`CANCELLED`** — reachable from any stage, reason mandatory, terminal. The value names are market-neutral by ruling. **The earlier five-state shorthand is deprecated and appears nowhere** — not as a model, not as a filter, not as a display grouping in any surface this module defines.
- **M08-09** (P0) — **What a user reads is the market pack's label for a stage; this module names no stage on screen and hard-codes no wait.** Stage labels, the skippable-stage set and blocker-party labels are pack data (`F1-22`; the India instance is `F1-51`, its skippable rule `F1-35`). A skipped stage is skipped by pack rule or because the project has no such obligation — it is never removed from the chain, and the board still shows the project's true position. **Residential deals may pass through stages in days; they still pass through them.**
- **M08-22** (P0) — **Blockers ride on any stage; a blocked project is never moved out of its stage to record that it is blocked.** Blocking is a sub-state, not a stage, so the days-in-stage figure and the customer's view keep telling the truth while the wait is recorded on top of them. A project may carry a blocker in any stage of the chain, and clearing it changes no stage.
- **M08-34** (P0) — **The checklist is a completeness surface, not a stage gate.** No stage move in the chain is blocked by a pending document; only handover reads the checklist as a condition (`M08-32`). Real projects collect paperwork out of order, and a checklist that blocks the board is a checklist people work around.

**DONE WHEN:**
- Given any project in the product, when its stage is inspected, then its value is one of the nine canonical stages or `CANCELLED`, and no five-state shorthand appears in any surface, filter or grouping (M08-08).
- Given a tenant in any market, when the board renders, then every stage shows the pack's label for its market-neutral value, and no stage name originates in this module (M08-09).
- Given a blocked project, when the board and the detail screen render, then the project is still in its own stage with its true days-in-stage, and the blocker rides on top of it (M08-22).
- Given a pending checklist row, when a stage move is attempted, then the move succeeds (M08-34).

---

### T-M08-009 · Stage-completion trigger: tranche due and customer-link update
**Type:** integration · **Tier:** P0
**PRD rows:** M08-15, M08-35, M08-36

**Requirements (verbatim):**

- **M08-15** (P0) — **Completing a stage is the module's one automatic trigger, and it does exactly two things: the matching tranche becomes due (§M08.6) and the customer's progress link updates (`foundations/F5`).** Nothing in this module fires on a clock, and no stage change sends anything to anyone by itself — the request remains the coordinator's one-tap act (`M08-38`, which sends via the tenant's connected transactional channel per owner ruling 2026-08-04, Q33, with copy-paste as the no-channel fallback).
- **M08-35** (P0) — **The accepted proposal version's payment terms *are* the project's collection schedule — the same rows, never re-entered and never re-derived.** This is the connection that makes the module valuable: *"solar businesses die of cash flow, not of bad design software,"* and money owed against a passed milestone is the most common leak. The schedule's rows, states and arithmetic are `modules/M11`'s (`DOC04.tranches-money-path`); this module owns the project-side surfaces that show them and the stage event that moves them.
- **M08-36** (P0) — **Completing a stage makes the matching tranche due**, through the schedule's stage mapping against the canonical chain (`R2`). A tranche mapped to a skipped stage becomes due when the project passes the point that stage occupied, so a skippable stage never strands money; the state transitions themselves — upcoming → due → part-received → received, and waived as terminal — are `modules/M11`'s.

**DONE WHEN:**
- Given a coordinator completes a stage, when the move is saved, then the matching tranche becomes due and the customer link reflects the new stage — and nothing is sent to anyone (M08-15).
- Given a project created from a won deal, when its payments block renders, then it shows the accepted proposal version's payment terms as the same rows, with nothing re-entered (M08-35).
- Given a coordinator completes the stage a tranche is mapped to, when the move saves, then that tranche is due and the request action is available on it — sending from the tenant's connected transactional channel where one exists, composing the message for a person to send where none is (M08-36, M08-38, owner ruling 2026-08-04 Q33).

---

### T-M08-010 · Blocker attribution engine and the customer-link fact feed
**Type:** engine · **Tier:** P0
**PRD rows:** M08-20, M08-23, M08-24, M08-25, M08-26, M08-28, M08-29

**Requirements (verbatim):**

- **M08-20** (P0) — **A blocker names who is being waited on, from a closed set of exactly four parties: `utility` · `customer` · `material` · `company`.** The set is canonical and market-neutral; what a user reads for each is the market pack's label (`F1-22`; the India instance labels `utility` per `F1-51`). The source's fourth party is *"us"* — the tenant company itself — and its canonical value name is `company` so that the vocabulary carries across markets and languages unchanged; the pack and locale supply the first-person display. The set is fixed: a fifth party is a ruling, not a tenant setting or a free-text field.
- **M08-23** (P0) — **Every blocker names a party — there is no unattributed blocker.** *"Over a year this becomes the honest answer to 'why do our projects take so long'."* The party is mandatory at the moment the blocker is set, the aggregate is what `modules/M13` reports on, and Operations' working view is blockers grouped by party with the company's own first (`PS-34`).
- **M08-24** (P0) — **The "waiting on customer" state is the one that protects the EPC, and it works by recording responsibility rather than by arguing about it.** A customer who cannot give site access — nobody home, terrace locked — produces a blocker with the party, the reason and the date the wait began, *"so responsibility for the delay is recorded and visible."* It is visible to the customer too, on their own link, which is the point.
- **M08-25** (P0) — **A blocker's internal reason and its customer-visible framing are two different things, and the module keeps them separate.** A supplier's failure is the company's problem to solve and not the customer's to read: the customer sees the project's honest stage and the fact that material is on order, with an expected date; they do not see the supplier, the internal note, or the commercial detail behind it. What the customer's page renders is `foundations/F5`'s; what this module guarantees is that the internal field is never the published one.
- **M08-26** (P0) — **The two structurally external waits are framed as external, and the product's job is stated honestly: make the waiting visible and attributable, not faster.** Utility inspection and interconnection approval, and incentive disbursement to the customer, are largely outside the company's control; the pack declares which of them apply in a market and what a typical wait looks like (`F1-53`). The module never presents such a wait as the company's failure and never invents an estimate the pack has not declared.
- **M08-28** (P0) — **The project knows which utility it belongs to, from the pack's directory, and the utility blocker attributes the wait to that named body.** The site record carries the selection (`modules/M04`'s capture, `F1-53`'s directory); the project reads it. Utility-specific application packets are a post-launch document-template family and are **not** in v1 (§5).
- **M08-29** (P0) — **Blockers are the wait-visibility feed the customer link consumes, and this module produces structured facts rather than customer copy.** For every blocker the module publishes: the party, the reason class, the date the wait started and the expected-until where known — the four facts that let the link say what it says. *"This single line prevents most support calls."* The line's wording, its rendering and the link's lifecycle are `foundations/F5`'s; the facts behind it are this module's, and they are never fabricated to fill the sentence.

**DONE WHEN:**
- Given a coordinator sets a blocker, when they save, then a party from the four-value set, a reason and a start date are recorded, and saving without a party is impossible (M08-20, M08-21, M08-23).
- Given a blocker with party `customer` and a start date, when the customer opens their progress link, then the wait and its start are visible to them (M08-24, M08-29).
- Given a material blocker with an internal note naming a supplier, when the customer's page renders, then the internal note is not on it (M08-25).
- Given a market pack that declares a typical wait for utility inspection, when a utility blocker renders on the customer's page, then the framing is the pack's and this module supplies only the party, reason and dates (M08-26, M08-28, M08-29).

---

### T-M08-011 · Project money surfaces: one figure everywhere, overdue never gates
**Type:** engine · **Tier:** P0
**PRD rows:** M08-37, M08-39

**Requirements (verbatim):**

- **M08-37** (P0) — **Every project surface that shows money shows collected against due, and never a stale figure.** The board card, the detail screen's payments block and the portfolio views read the same computed values as the payments screen itself — one figure everywhere (`F8-24`) — recomputed before display (`F8-12`). A projection is never shown here as an amount owed (`F8-23`).
- **M08-39** (P0) — **An unpaid due tranche is visible and chased — and never blocks the customer's progress link.** It surfaces on the board card, on the project, and on the owner's dashboard (`modules/M13`), and the rep is prompted to chase the person. The product rule is absolute and this module states it because this is where the temptation lives: ***"never block the customer's progress link over money — chase the person, do not punish the view."*** No stage, document, link or handover behaviour in this module may be made conditional on payment.
- *Row removed 2026-08-07 by owner decision: `M08-40` (no money-bearing offline write on a project surface) was deleted with the offline/sync capability; `M11-06` carries the surviving money rule.*

**DONE WHEN:**
- Given the board and the payments screen open at once, when both render the same project, then collected and due are the same figures (M08-37).
- Given a project with an overdue tranche, when the customer opens their progress link, then the link works normally and shows the project's progress (M08-39).

---

### T-M08-012 · The handover condition
**Type:** engine · **Tier:** P0
**PRD rows:** M08-32

**Requirements (verbatim):**

- **M08-32** (P0) — **Handover is defined by the checklist: every row past pending, and the pack shared on the customer's link.** That is the definition, and no other surface may redefine it. A project cannot reach `HANDED_OVER` with a pending row.
- *Row removed 2026-08-07 by owner decision: `M08-33` (document capture keeps the local original until the server confirms it holds the file) was deleted with the offline/sync capability. `M04-55` rules the photograph queue "the product's one and only device-held queue", holding "photographs and nothing else", so no retained local original exists for project documents; the honest-failure guarantee on a failed upload is `F8-36`.*

**DONE WHEN:**
- Given a project with any row still pending, when handover is attempted, then it is refused and the pending rows are named; given every row past pending and the pack shared on the link, then handover proceeds (M08-32).

---

### T-M08-013 · The active-project definition the entitlement gate counts
**Type:** engine · **Tier:** P1
**PRD rows:** M08-07

**Requirements (verbatim):**

- **M08-07** (P1) — **This module owns the definition of an *active* project — one that is neither handed over nor cancelled** — and the law that a plan limit may gate *creating* one but never *working* one: an existing project stays fully workable however the tenant's entitlements change, because the product must never strand a live installation. The gate's mechanics, its denial message and its upgrade path are `modules/M12`'s.

**DONE WHEN:**
- (The PRD states no dedicated acceptance line for M08-07; the row is the definition itself. The module's §M08.1 edge case rules the observable behaviour: *the tenant is at its active-project limit* → creating is blocked with the upgrade path (`modules/M12`); every project already live keeps working, unchanged (M08-07).)

---

### T-M08-014 · Installation surface: no commercial figures
**Type:** engine · **Tier:** P0
**PRD rows:** M08-43

**Requirements (verbatim):**

- **M08-43** (P0) — **No commercial figure appears on this surface, ever — no price, no discount, no tranche, no margin, no customer value.** v1 got the property free by giving the installation team no screen at all — *"crew sees no money because crew sees no screen"* — and where V2 gives them a screen the surface itself must preserve it. This is a property of the surface, not of the viewer: the rule holds even when an EPC Owner is the one looking at it.
- *Row removed 2026-08-07 by owner decision: `M08-44` (offline checklist ticks and their queue) was deleted with the offline/sync capability.*

**DONE WHEN:**
- Given any surface reachable by the Installation Team Member preset, when it renders, then it contains no price, discount, tranche, margin or customer value (M08-43).

---

### T-M08-015 · Change after Won, cancellation and closure retention
**Type:** engine · **Tier:** P0
**PRD rows:** M08-48, M08-49, M08-50, M08-52, M08-53

**Requirements (verbatim):**

- **M08-48** (P0) — **Commissioning artefacts are retained at handover so a future monitoring or service surface can attach without re-collection** — the certificates, the as-built references and the system facts the handover pack contains stay with the project rather than living only inside a downloaded file. Retention is the whole of the commitment: there is no telemetry, no monitoring, no service module and no customer app in v1 (§5).
- **M08-49** (P1) — **Closing is not deleting.** A handed-over project stays readable with its timeline, its documents, its checklist and its money history intact, and its customer link continues to serve the pack (lifecycle per `foundations/F5`). Nothing about closure removes a record from the product.
- **M08-50** (P0) — **A change after Won produces a new proposal version with revised payment terms, and the original is preserved.** The customer who wants two more panels gets a new version, not an edit: the project then points at the version in force, the earlier one stays readable, and the collection schedule follows the version in force. The versioning is `modules/M06`'s and the tranche revision is `modules/M11`'s; what this module owns is that the project moves its reference and never rewrites its history.
- **M08-52** (P0) — **A project is never deleted, and cancellation is the correction path for a mistaken Won.** There is no delete action on a project anywhere in the product; a project won by mistake is cancelled with a reason, which is a record rather than an erasure (`modules/M07`'s close surface names this module as the correction path).
- **M08-53** (P1) — **Cancellation preserves history: the timeline, documents, checklist and receipts of a cancelled project stay readable.** Money already received is not unwound by the cancellation itself — reversal is `modules/M11`'s append-only mechanism (a reversing entry, never an edit), and the project simply stops counting as revenue from the moment it is cancelled.

**DONE WHEN:**
- Given a handed-over project, when it is opened later, then its commissioning artefacts, documents, timeline and money history are all still readable (M08-48, M08-49).
- Given a customer changes scope after Won, when a new proposal version is accepted, then the project references the new version, the earlier version remains readable, and the collection schedule follows the version in force (M08-50).
- Given any project in any state, when a user looks for a delete action, then there is none (M08-52).
- Given a cancelled project that had received payments, when it is opened, then its receipts, documents and timeline are readable and any reversal appears as its own entry (M08-53).

---

## Laws (enforced through screens and review, no standalone build)

These rows are constraints on what may be built rather than things to build. Each is quoted in full with what enforces it.

- **M08-01** (P0) — **The scope law: this module is a status + documents + money tracker, and its surface set is closed.** In v1: the stage board · payment collection against the tranche schedule · the document checklist · blockers with reasons · the customer progress link · the existing installation checklist. That list is exhaustive. A capability not on it is a non-goal with the source's rationale recorded (§5), not an unbuilt backlog item, and adding one is an owner ruling rather than a local decision inside this module.
  - *Enforced by:* the six screen tasks T-M08-001 … T-M08-006 being the whole surface set of this file, and by review against `docs/prd/modules/M08-projects.md` §5 — any proposed seventh surface is an owner ruling, not a task. Acceptance: *Given any request to add a capability outside the six surfaces of the scope law, when this module is read, then that capability is found in §5 as a non-goal with its rationale, not as an unbuilt requirement (M08-01).*

- **M08-06** (P0) — **The commercial document type does not branch the project.** A project behind an operating-expense or power-purchase proposal tracks **the same stages and the same document checklist** as one behind an outright-purchase proposal. There is no recurring invoicing and no meter ingestion behind the type — that engine is an explicit non-goal (§5), and the per-unit terms the document renders are projections carrying `F8-23`'s label, not amounts owed.
  - *Enforced by:* T-M08-008 (one chain, no type branch), T-M08-007 (one seeding path), and the `opex-billing-note` state on SCR-M08-02 — the money surface carries the honest note and nothing recurring is built. Acceptance: *Given a project behind an operating-expense/power-purchase proposal, when it opens, then it shows exactly the same stage chain and checklist as an outright-purchase project, and no recurring-billing or metering surface exists anywhere on it (M08-06).*

- **M08-13** (P0) — **The board never renders a project as nearly finished.** A system installed but stuck before commissioning for a month is not "90% done" — it is in its stage, with the days it has been there, and the honest thing on the card is that number. *"Days-in-stage tells the truth."* No surface in this module computes completion as a fraction of stages passed.
  - *Enforced by:* T-M08-001's acceptance line (*no card anywhere shows a percentage, burndown or completion bar*) and by review of every M08 surface for a computed completion fraction.

- **M08-18** (P0) — **The Sales Executive reads their own won deals and cannot change them** — *"so they can answer a customer without asking ops."* Read-only means the whole project: stages, blockers, documents and the money summary are visible and none of them is editable by that preset.
  - *Enforced by:* the `F2.M08.*` capability grants (owned by `docs/prd/foundations/F2-roles-and-permissions.md`) and the `read-only-scoped` state on both SCR-M08-02 and SCR-M08-01 — the board is the preset's first surface and the detail screen is reached through it, so both carry the scoped rendering. Acceptance: *Given a Sales Executive opening their own won deal, when the screen renders, then every block is readable and no control mutates anything (M08-18).*

- **M08-19** (P1) — **The screen splits by where the work happens, not by breakpoint.** Web carries the dense reading work — the board, the checklist, the full detail. Mobile carries the away-from-desk acts: stage moves, document and photo upload, blocker updates, and marking a payment received. Neither surface is a reduced version of the other; each carries the whole of what its job needs.
  - *Enforced by:* the "full parity at 375px and 1536px" DONE WHEN line carried by every screen task in this file (T-M08-001 … T-M08-006), checked at design review against each brief's state list.

---

## Disposition index

| Row | Disposition |
|---|---|
| M08-01 | LAW |
| M08-02 | T-M08-007 |
| M08-03 | T-M08-007 |
| M08-04 | T-M08-007 |
| M08-05 | T-M08-007 |
| M08-06 | LAW |
| M08-07 | T-M08-013 |
| M08-08 | T-M08-008 |
| M08-09 | T-M08-008 |
| M08-10 | T-M08-001 |
| M08-11 | T-M08-001 |
| M08-12 | T-M08-001 |
| M08-13 | LAW |
| M08-14 | T-M08-001 |
| M08-15 | T-M08-009 |
| M08-16 | T-M08-002 |
| M08-17 | T-M08-002 |
| M08-18 | LAW |
| M08-19 | LAW |
| M08-20 | T-M08-010 |
| M08-21 | T-M08-002 |
| M08-22 | T-M08-008 |
| M08-23 | T-M08-010 |
| M08-24 | T-M08-010 |
| M08-25 | T-M08-010 |
| M08-26 | T-M08-010 |
| M08-27 | T-M08-002 |
| M08-28 | T-M08-010 |
| M08-29 | T-M08-010 |
| M08-30 | T-M08-003 |
| M08-31 | T-M08-003 |
| M08-32 | T-M08-012 |
| M08-34 | T-M08-008 |
| M08-35 | T-M08-009 |
| M08-36 | T-M08-009 |
| M08-37 | T-M08-011 |
| M08-38 | T-M08-002 |
| M08-39 | T-M08-011 |
| M08-41 | T-M08-004 |
| M08-42 | T-M08-004 |
| M08-43 | T-M08-014 |
| M08-45 | T-M08-005 |
| M08-46 | T-M08-006 |
| M08-47 | T-M08-006 |
| M08-48 | T-M08-015 |
| M08-49 | T-M08-015 |
| M08-50 | T-M08-015 |
| M08-51 | T-M08-001 |
| M08-52 | T-M08-015 |
| M08-53 | T-M08-015 |
