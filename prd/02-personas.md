# 02 · Personas — the twelve people HelioGrid is built for

Status: draft · Origin mix: SRC + BRIEF (this document carries no `REC` items) · Depends on:
`00-README.md`, `01-product-overview.md`

## 1. Purpose & scope

This document names and documents the twelve personas HelioGrid is built for, each one
independently, and fixes the persona vocabulary every other document in the suite uses. When a
module PRD writes its *§2 Personas & surfaces* section, it names personas from this list and
nothing else.

Each persona is documented in six parts, in the same order every time: **who they are**, **goals**,
**pains**, **a day in the life**, **primary surfaces**, and **home screen & permissions**. Each
persona section opens with its requirement table. Requirement IDs in this document use the prefix
`PS-<nn>` and follow the ID rules in `00-README.md` §ID scheme; tags and tiers follow the same
file's tag vocabulary and tier definitions.

**What this document is not.**

- It is **not** `foundations/F2-roles-and-permissions.md`. No permission matrix appears here, no
  capability grid, no role names are coined here. Every persona section ends with a one-line
  permissions **summary** and a pointer to its F2 section. A persona is a job to be done; a role
  is the grant of access that lets someone do it, and F2 owns every role name, every capability
  and every matrix cell.
- It is **not** the journey (`03-journey-map.md`) and not any module's specification. The home
  screens named here are persona-level requirements — *which front door this persona lands on*.
  The screens themselves, with their states, empty states and contents, belong to the modules
  that own them.
- It carries no org chart, no headcount, no reporting lines and no HR-grade job descriptions.
  Two personas may be the same human being; in a small EPC several of them usually are.
- Per the suite-wide rules it carries no implementation content and **no schedule of any kind**.

**Market neutrality.** Persona bodies are market-neutral. Where the v1 source named a
market-specific artefact — a utility inspection body, an incentive scheme, a tax label, a payment
mode, a currency — this document uses the market-neutral term and points at the market pack
(`foundations/F1-global-market-framework.md`) for the pack's own labels.

## 2. The twelve personas at a glance

The persona set is fixed by the owner's V2 brief and is not open for reinterpretation by a later
document (`_process/owner-brief-2026-08-03.md` §Users: *"Primary users include EPC Owners, Sales
Managers, Sales Executives, Survey Engineers, Design Engineers, Project Managers, Field
Technicians, Installation Teams, HR/Admin, Finance, Operations, Marketing Teams. Document every
persona independently."*).

| # | Persona | v1 origin | Audience (`01` §2) | Surface emphasis | Home screen | Home tag |
|---|---|---|---|---|---|---|
| 1 | **EPC Owner** | v1 `Owner` preset | Owner | Web for administration, mobile for everything else | Pipeline dashboard, *what needs you* first | `SRC` |
| 2 | **Sales Manager** | v1 `Manager` preset (sales half) | Employees | Balanced web / mobile | The same dashboard, team-scoped | `SRC` |
| 3 | **Sales Executive** | v1 `Sales rep` preset | Employees | Mobile-first | My Day | `SRC` |
| 4 | **Survey Engineer** | v1 `Surveyor` preset | Employees | Mobile capture | Today's site visits | `SRC` |
| 5 | **Design Engineer** | v1 `Designer` **and** v1 `Engineer` presets | Employees | Desktop-weighted, full mobile parity | Designs awaiting work, with the sign-off queue composed in | `SRC` (×2) |
| 6 | **Project Manager** | v1 *coordinator / ops*, served by the `Manager` preset | Employees | Web board, mobile for stage moves | Projects by days-in-stage, blockers first | `BRIEF` |
| 7 | **Field Technician** | none — V2 field-workforce scope | Employees | Mobile only | My route today | `BRIEF` |
| 8 | **Installation Team Member** | v1 *installer / crew* — a persona with **no login in v1** (R16) | Employees | Mobile only | Today's installation | `BRIEF` |
| 9 | **HR/Admin** | none — V2 HR-lite scope | Employees | Web-first | People today | `BRIEF` |
| 10 | **Finance** | none as a persona; the money surfaces are v1 | Employees | Web-first | Money due | `BRIEF` |
| 11 | **Operations** | v1 *coordinator / ops*, portfolio half | Employees | Web-first | Blockers by party, oldest first | `BRIEF` |
| 12 | **Marketing** | none — V2 marketing scope | Employees | Web-first | Campaigns and what they captured | `BRIEF` |

**How the v1 six became the V2 twelve.** The source ships **six fixed preset roles** — Owner,
Manager, Sales rep, Surveyor, Designer, Engineer (`docs/product/product-journey.md` §ROLES &
PERMISSIONS, L1429–1436). The V2 persona set is wider than that, and the mapping is not
one-to-one in either direction. Three movements are worth stating plainly, because F2 has to rule
on all three:

- **One v1 role fans out into three personas.** The v1 `Manager` preset carried two unrelated
  jobs: running a sales team (L1432) *and* being the projects *coordinator / ops* — "**= the
  Manager preset** — there is no separate coordinator role (D27)" (`S8.rule.roles`). V2 separates
  the selling job (**Sales Manager**) from the per-project delivery job (**Project Manager**) and
  the cross-project throughput job (**Operations**).
- **Two v1 roles converge into one persona.** v1 has both a `Designer` (builds designs and prices
  them) and an `Engineer` (reviews and signs off) as separate presets. The V2 persona **Design Engineer**
  covers the v1 Designer, and the v1 Engineer's sign-off responsibility is documented **inside**
  that persona as a distinct capability (`PS-19`) rather than as a thirteenth persona. Whether
  sign-off also warrants its own preset **role** is F2's decision, not this document's — see
  §Open questions.
- **One v1 non-user becomes a persona.** v1's *installer / crew* had no user account at all:
  "InstallationSheet's crew ticks have no crew user in v1", the coordinator runs the checklist,
  and "crew sees no money because crew sees no screen" (`R16`). R16's own consequence names the
  release that changes this — a later release adds an Installer preset without restructuring
  anything, because a person already holds any number of roles — and the owner brief lists
  Installation Teams as primary users. **Installation Team Member** is therefore a documented
  persona here, with the v1 attribution fallback carried forward (`PS-28`).

**Personas are not roles, and this matters for reading every section below.** One person routinely
holds several roles — the source's whole reason for preset stacking is the small firm where
"one person is rep *and* surveyor *and* designer" (L1420–1422). Nothing in this document should be
read as implying twelve people, twelve seats, or twelve logins.

## 3. Persona laws

These five rows bind every persona section below and every module that names a persona.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-01 | **Role decides the home screen, not a setting.** Every persona lands on the work in front of them, not on a generic dashboard they must navigate away from; the front door is derived from what the person is, never chosen in preferences. The source calls this "the single highest-leverage UX decision in the product". | `SRC` — `S1.rec.1` (`docs/product/product-journey.md` §Stage 1 Recommendation, L183–186) | P0 |
| PS-02 | The twelve personas named in §2 are the **fixed persona vocabulary of the suite**. Every module and foundation PRD names its audience from this list, using these exact names; a document that needs a thirteenth persona records the need in `registers/open-questions.md` rather than coining one. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Users | P0 |
| PS-03 | **A persona is a job; a role is the grant of access.** The two sets are deliberately different sizes, one person may hold several roles at once, and access is resolved by F2's rules — permission granted if **any** held role grants it, lead visibility taking the **widest** scope among them. No persona section in this document grants, implies or restricts a permission. | `SRC` — `docs/product/product-journey.md` §ROLES & PERMISSIONS L1417–1422, L1479–1481; `DOC08.six-roles`, `DOC08.roles-or` | P0 |
| PS-04 | **Every persona sits inside one of the three audiences** of `01` §2 — Owner or Employees. No persona in this suite is the EPC's customer, and no persona-level requirement may imply a customer login: the customer reaches the product through one tokenised link and never acquires an account. | `SRC` — `D7` (three audiences), `D5` (customer never logs in) | P0 |
| PS-05 | **One person, one home.** Someone holding several roles gets a **single** home screen — the one for their widest role, with the other roles' work composed inside it — and can switch, "not two competing home screens". A person who both sells and surveys lands on My Day with today's visits shown inside it. | `SRC` — `docs/product/product-journey.md` §ROLES & PERMISSIONS Recommendation 2 (L1515–1517) | P1 |

**Surfaces, stated once.** Every persona below names a surface emphasis, never a surface
restriction. The product is mobile-first without compromising web (`OV-08`): the mobile
experience is native-fast and the web experience stays full-featured, and no persona is told that
a job is unavailable on the surface they happen to be holding. Where a persona's work is
genuinely one-surface in practice — a crew member on a roof, an administrator doing an import —
the section says so as an emphasis and the module owning that feature states the real per-feature
split.

---

## EPC Owner

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-06 | The **EPC Owner** persona is the person who buys and administers the tenant — the proprietor or director of the solar EPC. Their scope is the whole business: every lead, every design, every project, every unit of money in the tenant's currency, every setting. The source states it flatly: "The business owner. Everything, always. Cannot be deleted or restricted." | `SRC` — `docs/product/product-journey.md` §ROLES & PERMISSIONS L1431; `_process/owner-brief-2026-08-03.md` §Users | P0 |
| PS-07 | The EPC Owner's **home screen is the pipeline dashboard**, led by the honest attention list — deals stuck or aging, proposals sent and not opened, projects blocked, payments overdue — each item deep-linking to the thing itself, followed by cash collected versus due, pipeline by stage, this period against last, forecast marked a projection, and win/loss. | `SRC` — `S1.rec.1`; `docs/product/product-journey.md` §DASHBOARDS & REPORTS, Owner dashboard row (L1544) and Recommendation (L1569–1572) | P0 |

### Who they are

The owner is usually the founder, often still the best salesperson in the company, and in a small
EPC is also the person who signs off designs, chases the utility, and answers the phone at night.
They bought HelioGrid, they pay for it, and they are the only persona the tenant cannot exist
without. In firms of five people they hold most of the other eleven personas as well; in firms of
fifty they hold none of them and read the product entirely through its attention lists.

They are the persona `01` §2 calls the **Owner audience** — the widest visibility in the product,
and the only one with tenant-level administration: team and roles, catalog and price book, voice
agent configuration and its knowledge, branding and templates, subscription and billing.

### Goals

- Know the truth about the pipeline without asking anyone — value, stage, and where deals leak.
- Never lose an enquiry. Every lead triaged and owned quickly, because unowned leads are the
  cheapest possible loss.
- Know what is stuck, and whose fault the wait is, so the company stops absorbing blame for
  someone else's timeline.
- Collect the money that has already been earned against a passed milestone.
- Get the whole team productive without running a training session.
- Be sure the automation is worth its invoice, without being flattered by it.

### Pains

- **Untriaged leads rot.** Leads older than a day sitting unassigned is a known failure the
  source escalates to the owner explicitly (`S2.wrong.7`, `R9`), and triage that takes more than
  about three seconds per lead "will not get done" (`S2.rec.1`).
- **A rep goes off the road** and their pipeline goes with them; the owner needs a bulk
  reassignment that records why (`S3.wrong.6`).
- **Projects age quietly.** A deal can sit in one stage for weeks and still look healthy on a
  board that shows percentages instead of days-in-stage (`S8.wrong.1`, `S8.wrong.9`, `S8.rec.2`).
- **Money owed against a passed milestone** is the most common leak in the business, and it is
  invisible unless the board and the dashboard both say so (`S8.rule.tranches`, `S8.wrong.3`).
- **Over-trusting a number.** The owner sees a large "deals it touched" figure and reads it as
  attribution; the caveat has to be on the screen, not in a tooltip (`AP.wrong.3`, `AP.honesty.1`).
- **Nobody opens the step-back screens** — including the owner (`AP.wrong.4`, journey L1566).
- **Configuration that feels like homework.** Most B2B products ask for everything before
  anything works; the owner abandons (`S0.rule.minimum-first`, `TC.config-ux.1`).

### A day in the life

They open the product and the attention list is already sorted: two deals aging, one proposal
sent and unopened, a project blocked waiting on the utility, one payment overdue. They tap the
overdue payment first, see the tranche fell due when its stage completed, and hand it to whoever
chases. They drop into the lead inbox, where new enquiries from every channel sit newest-first
with a source badge, and triage them one decision at a time — assign or bin — watching each rep's
open load as they go so nobody gets buried. They glance at the agent's block: what it did while
nobody was working, how many conversations the team did not have to start, and the eleven
questions it could not answer, which take one tap each to teach. Later, on a laptop, they add a
component a rep asked for to the catalog, and approve a design that has been waiting.

### Primary surfaces

Web for administration — team, catalog and price book, imports, dense review screens, the
step-back dashboards and reports. Mobile for everything else, and specifically for triage,
approvals and the attention list, which is where most of an owner's actual interaction happens.
Neither surface is a subset of the other (`OV-08`).

### Home screen & permissions

`PS-07`. The owner's front door is the pipeline dashboard, and its first panel is *what needs
you* — the attention list — with cash immediately below it; pipeline totals, forecast and win rate
are context and sit quietly under those two. The dashboard **reads and never creates**: every item
deep-links to the real lead, proposal or project, and nothing is entered here. Forecast is
labelled a projection and never sits in the same total as won; a deal cancelled after Won stops
counting immediately. An owner with no data yet is taught what will appear and why, never shown a
broken empty chart.

**Permissions.** The widest scope in the product: all leads, all designs, all projects, all money,
and the tenant-level surfaces nobody else administers — team and roles, catalog and price book,
agent configuration, billing. The source's own guard is that this persona cannot be restricted
away and a tenant always retains at least one of them. Full matrix: **see F2 §EPC Owner**.

---

## Sales Manager

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-08 | The **Sales Manager** persona runs a selling team. Their scope is the team's leads — seeing them, reassigning them, building and sending proposals against them — and explicitly **not** the company's settings, catalog or billing. Lead visibility is team-wide, one step narrower than the owner and one wider than the executive. | `SRC` — `docs/product/product-journey.md` §ROLES & PERMISSIONS L1432; `D20`; `_process/owner-brief-2026-08-03.md` §Users | P0 |
| PS-09 | The Sales Manager's **home screen is the same dashboard the owner lands on, scoped to their team** — the attention list, cash and pipeline restricted to the team's deals — with the team's per-rep view reachable from it. The source assigns the owner dashboard to "Owner (+ manager, team-scoped)" and makes the same screen serve both, scoped, rather than building a second one. | `SRC` — `docs/product/product-journey.md` §DASHBOARDS & REPORTS L1538–1539, L1544, L1546; `AP.screen.4` (per-rep view, manager-only) | P0 |

### Who they are

The person accountable for a number and for a group of executives hitting it. In the source's v1
vocabulary this is the `Manager` preset — and that preset carried a second, unrelated job as the
projects coordinator, which V2 hands to the Project Manager and Operations personas instead
(see §2). The Sales Manager persona is the selling half only.

In a small EPC this persona is the owner wearing a second hat. In a larger one it is a real
person who never touches company settings and would not want to.

### Goals

- No lead in the team sits unowned, and no executive is buried while another is idle.
- Proposals go out while the customer is still interested, and the follow-up that chases them
  already exists before anyone forgets.
- Know which executives lean on the automation and whose leads it rescued, without turning it
  into a leaderboard.
- Rebalance the team's work quickly when someone is away, without losing the history of why.

### Pains

- **Uneven load.** Assignment is manual by design, with each rep's open load visible at the
  moment of assigning and no auto-routing to hide behind (`S3.screen.1`, `D14`); without that
  visibility a manager buries their best executive.
- **An absent rep's pipeline.** Bulk reassignment has to exist and has to record why
  (`S3.wrong.6`).
- **Two executives quoting the same customer.** Duplicate detection should have caught it at
  capture; when it does not, the customer record shows both and one must be withdrawn
  (`S6.wrong.8`).
- **The Friday proposal remembered the following Thursday** — the single biggest leak in solar
  selling, which is why a follow-up task exists the moment a proposal is shared (`S6.rec.1`).
- **Deals going quiet without anyone noticing** until they are dormant (`S7.wrong.8`, `R9`).
- **Metric gaming.** Marking everything "interested" makes a team look healthy; the numbers are
  descriptive, and win/loss on closed deals is what counts (journey L1564–1565).

### A day in the life

They open a dashboard that looks exactly like the owner's and contains only their team: three
attention items, the team's cash position, the funnel with the stage where deals are leaking. They
reassign two leads from an executive who is away, and the timeline on each records the reason.
They open the per-rep view to see which executives the voice agent is carrying and which have
stopped following up, then call one of them rather than sending a report. In the afternoon they
build a proposal themselves for a commercial enquiry the team is stretched on, discount it —
there is no approval step and no ceiling, by design — and send it.

### Primary surfaces

Balanced. Web for reassignment, the funnel and the step-back views; mobile for the attention
list, for chasing, and for building and sending a proposal while away from a desk.

### Home screen & permissions

`PS-09`. One screen, scoped — not a second dashboard with different arithmetic. Visibility follows
role, so the manager sees the team's deals where the owner sees all of them, and the panels,
their order and their honesty rules are identical: attention list first, cash second, forecast
labelled a projection, cancelled-after-won never silently counted.

**Permissions.** Team-wide lead visibility; assign and reassign within the team; build, discount
and send proposals; update project stages and record payments where the tenant uses them for that;
see the team's reports and the agent's per-rep view. Not theirs: company settings, catalog and
price book, agent configuration, billing, and deleting anything. Full matrix: **see F2 §Sales
Manager**.

---

## Sales Executive

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-10 | The **Sales Executive** persona sells. Their scope is their **own** leads, their own proposals and their own follow-ups — capture, qualify, book the survey, build and send the proposal, chase it, and mark it won or lost with a reason. | `SRC` — `docs/product/product-journey.md` §ROLES & PERMISSIONS L1433; `D20`; `_process/owner-brief-2026-08-03.md` §Users | P0 |
| PS-11 | The Sales Executive's **home screen is My Day** — "not a dashboard of numbers, a list of what to do today", in a fixed order: **overdue** first and always visually first, **today's** timed items, a separate **agent activity** block for what the automation did on their behalf, then **upcoming**. Snoozed and dormant leads are excluded until they wake. | `SRC` — `S1.rec.1`; `S7.rule.my-day` (journey L768); `S7.rec.1`; `R9` (snoozed/dormant excluded) | P0 |

### Who they are

The executive is the product's highest-frequency user and the reason it is mobile-first. The
source's own portrait of them arriving is "phone, almost always", and the goal for their first
session is to be useful within about two minutes without reading anything (`S1.happy`). They are
in a customer's living room, in a car, on a call — rarely at a desk — and everything they do has
to survive that.

They see their own leads and nobody else's. That is a deliberate v1 law, not an oversight.

### Goals

- Nothing goes quiet by accident — the stage's own stated goal.
- Give a credible price today, even standing in the customer's living room, without waiting for
  a survey or a design.
- Capture an enquiry in well under a minute, from anywhere.
- Know the moment a customer opens the proposal, and know what the automation said to them
  before calling.
- Never re-key the same customer twice.

### Pains

- **The forgotten follow-up.** A proposal sent and remembered days later is the biggest leak in
  the job (`S6.rec.1`, `S6.wrong.5`).
- **Nobody answers.** Attempts have to be logged and retried, and after repeated failures the
  lead deserves a machine's patience rather than the executive's (`S3.wrong.1`, `D17`).
- **"Call me next month."** The most common outcome of a first call; if the product cannot
  represent it cleanly the executive keeps it in their head, "and that is how pipeline leaks"
  (`S3.wrong.5`, `S3.rec.1`).
- **Not the decision maker**, a rented roof, a wrong number — three different disqualifications
  with three different reasons, each of which is analytics later (`S3.wrong.2`–`S3.wrong.4`,
  `S3.screen.5`).
- **A long builder for a small job.** Eleven steps is a lot when the customer wants a number now
  (`S6B.rec.1`) — which is why a short path and duplicate-an-earlier-proposal both exist.
- **The automation getting it wrong.** The executive sees the transcript, corrects the outcome,
  and their assessment always wins (`S7.wrong.3`, `S7.wrong.7`).

### A day in the life

My Day opens on a red overdue block: a follow-up three days late, and a proposal a customer has
not opened. Below it, today — a site visit at a fixed time, two callbacks. Below that, in its own
block and never mixed with their own tasks, what the agent did overnight: one customer interested
and asking for a callback, one no-answer that will retry, one who asked about warranty and got an
answer. They clear the overdue items, quick-add a lead from a phone call in four fields with a
live duplicate check, qualify another on the call itself, and book a site visit that hands them a
ready-to-paste confirmation message for the customer. Later they duplicate last week's proposal
for a near-identical house, change the customer and the size, generate, copy the link, paste it
into their own messaging app, and mark it shared — which is what starts the clock and creates the
next follow-up automatically.

### Primary surfaces

Mobile-first, genuinely: My Day, quick-add, lead detail, the builder's short path, sharing and
notifications are all designed for a phone and must feel native and fast. Web when the work is
dense — the full proposal builder for a commercial deal, bulk work, reviewing a long timeline.

### Home screen & permissions

`PS-11`. My Day is a list of what to do, never a wall of numbers; a rep must never have to open a
chart to know who to call. The agent-activity block stays visually separate from the executive's
own tasks — "blurring that line is how people stop trusting the automation". A step-back "how am I
doing" view exists but is secondary to My Day and shows their own data only.

**Permissions.** Own-lead visibility only. Add and edit leads, capture surveys, build proposals
including discounts, send proposals, mark won and lost. Not theirs: assigning to others, deleting,
project stage changes, recording payments, agent configuration, reports beyond their own.
Read-only on their own won deals so they can answer a customer without asking operations. Full
matrix: **see F2 §Sales Executive**.

---

## Survey Engineer

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-12 | The **Survey Engineer** persona visits sites and captures what a design cannot be built without: roof, electrical, shading, access and structural observations — the last "observations only, never a verdict". Their visibility is limited to what they are assigned. | `SRC` — `docs/product/product-journey.md` §ROLES & PERMISSIONS L1434; `S4.rule.capture`; `_process/owner-brief-2026-08-03.md` §Users | P0 |
| PS-13 | The Survey Engineer's **home screen is today's site visits** — each with address, customer, time, distance, one-tap navigation and one-tap call. | `SRC` — `S1.rec.1`; `S4.screen.6` (journey L379) | P0 |
| PS-14 | Surveying is a **capability, not a gatekeeper**: the survey is a task assignable to anyone who holds the capability — a dedicated Survey Engineer or a Sales Executive standing on the roof — and both use one capture flow. The persona describes whose job it usually is, never who is permitted to do it. | `SRC` — `D15`; `DOC08.matrix.capture-surveys` | P0 |

### Who they are

The person who goes to the roof. In V2 they are also the person who does *not* always go: the
product can survey a roof remotely from imagery and elevation data in minutes, which turns the
physical visit into verification before installation rather than a prerequisite for quoting. The
Survey Engineer owns the physical mode, and owns the honesty line that goes with it — remote data
is derived from imagery, physical data is measured on site, and the product labels the difference
on the document.

### Goals

- Never make a second trip. One visit that captures everything the designer needs.
- Never lose a capture.
- Hand the designer a survey with the gaps named rather than hidden.
- Get through the day's visits with the least possible travel and paperwork.

### Pains

- **The one forgotten item that costs a return trip** — most often the meter photo the designer
  cannot size a system without (`S4.wrong.12`, `S4.rec.1`).
- **The phone itself fails them**: storage full before capture starts, battery dead mid-survey
  (`S4.wrong.7`, `S4.wrong.8`).
- **The visit that cannot happen** — nobody home, gate locked, terrace inaccessible — which has to
  be recordable with a reason and a reschedule rather than as a silent non-event
  (`S4.wrong.9`, `S4.wrong.10`).
- **Wrong address on the job**, correctable on the spot rather than after the drive
  (`S4.wrong.11`).
- **Re-surveying a site** and overwriting the first visit; captures are versioned, never replaced
  (`S4.wrong.13`).
- **What the roof will not tell them from above** — the meter and sanctioned load, roof age and
  waterproofing, access for material, shading from a neighbour's wall — the exact list a remote
  survey cannot answer and a physical one exists to close (`S4.rule.remote-cannot`).

### A day in the life

Today's visits open in order with distances, and the first one is a tap away from navigation.
On site they work through guided capture group by group — roof photos from each corner, the meter
and main panel, every tall obstruction photographed with a rough height, how material will reach
the roof, visible cracks and roof age as observations — with a progress bar and every step
skippable but flagged. The camera opens inline; nothing bounces them out to another app. The
review screen before submit is the one that saves the day: it names what is captured, what is
missing and what is flagged, in plain language, and the missing meter photo is stated as a
consequence rather than an error code. They submit; the designer is notified. The capture screen
says forty-seven photos are still waiting to upload, and it never blocks them.

### Primary surfaces

Mobile, effectively exclusively. Web is a review surface, not a capture one.

### Home screen & permissions

`PS-13`. The visit list is the front door. The guided capture flow and its review screen belong
to the survey module.

**Permissions.** Assigned-only visibility. Capture and submit surveys, add site photos, correct a
site's address from the field. Not theirs: creating or reassigning leads, pricing, proposals,
project stages, or anything financial. Full matrix: **see F2 §Survey Engineer**.

---

## Design Engineer

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-15 | The **Design Engineer** persona builds the system: roof geometry, obstructions, components, panel layout, shading analysis, the single-line diagram and the priced bill of materials, plus the variants a customer needs to choose between. In v1 vocabulary this is the `Designer` preset — source wording "builds designs and quotes", read as **proposals** per R1's naming law — with assigned-only visibility. | `SRC` — `docs/product/product-journey.md` §ROLES & PERMISSIONS L1435; `S5.rule.existing-steps`; `_process/owner-brief-2026-08-03.md` §Users | P0 |
| PS-16 | The Design Engineer's **home screen is designs awaiting work** — the queue of surveys handed over and designs in progress, with the blocking gaps named per item. | `SRC` — `S1.rec.1` (journey L184) | P0 |
| PS-17 | This persona also holds **sign-off authority**: reviewing a design and approving it, or returning it with comments pinned to what is wrong. In v1 this is a separate preset (`Engineer` — "reviews and signs off designs"); in V2 it is documented as a distinct **capability of the Design Engineer persona**, and the customer never sees an unapproved design. | `SRC` — `docs/product/product-journey.md` §ROLES & PERMISSIONS L1436; `DOC08.matrix.approve-designs`; `S5.screen.3`; `S5.wrong.6` | P0 |
| PS-18 | Where a person holds sign-off, their **home screen carries the sign-off queue — designs awaiting review, oldest first** — composed into the one home rather than presented as a second front door (`PS-05`). | `SRC` — `S1.rec.1`; `S5.screen.2`; journey L1515–1517 | P0 |
| PS-19 | **Sign-off is a capability, and whoever performs it is not the person who drew it.** The reviewer's approval is the structural-safety record for the design, and returning a design sends it back to its author with comments attached to the specific problem. Whether the capability is granted by its own preset role or rides the Design Engineer preset is F2's decision. | `SRC` — `DOC08.matrix.approve-designs`; `DOC08.audit-coverage` (sign-off approve/return with who and when, "the engineer-led structural safety record"); `S5.wrong.6` | P0 |

### Who they are

The engineer who turns a survey into something buildable and sellable, and the engineer who says
it is safe to build. v1 kept those as two presets because in a firm large enough to have both, the
reviewer must not be the author. V2 keeps the *capability* distinction — `PS-17` and `PS-19` exist
precisely so it cannot be quietly lost — while recognising that the persona doing both jobs, and
often the same qualification, is one: the Design Engineer.

They are the persona closest to the flagship. The design studio is the product's centrepiece, and
this persona lives in it.

### Goals

- Design once, correctly, from a survey that is actually complete.
- Be honest about a roof that will not carry a good system, rather than producing flattering
  numbers.
- Produce variants a customer can choose between, with one marked recommended.
- Sign off without becoming the bottleneck — and never let an unapproved design reach a customer.

### Pains

- **A survey with holes.** Design cannot start; the product must show exactly what is missing and
  who to ask, not fail silently (`S5.wrong.1`).
- **A roof that is too shaded.** The system is honest about it and offers a smaller layout rather
  than quietly producing bad numbers (`S5.wrong.2`).
- **A design that exceeds the sanctioned load** — a real approval blocker, warned with the actual
  limit (`S5.wrong.3`).
- **A component that has gone out of stock or been discontinued** after proposals were built on
  it; already-sent documents keep the rates they were built with (`S5.wrong.4`).
- **The customer changing their mind on size** — a variant, never a rewrite (`S5.wrong.5`).
- **A design edited after its proposal exists.** The pricing is stale and must visibly say so;
  money never renders as final while stale (`S5.wrong.7`, `S6.wrong.1`).
- **A dense screen used at the worst moment.** The bill-of-materials screen presents hundreds of
  controls at once and needs progressive disclosure, not a smaller font (`S5.rule.uxprob.1`); and
  the studio's tracing, dragging and hovering were built desktop-only and need a real touch model
  (`S5.rule.uxprob.2`, `D2`).
- **Being returned to.** A returned design has to arrive with comments pinned to what is wrong,
  not as a rejection notice (`S5.wrong.6`).

### A day in the life

Their queue opens on designs awaiting work, oldest first, each showing what arrived with it —
and one flagged because the survey has no meter photo, with the gap named and the surveyor
identified. They open a design with a complete survey, work through the studio's steps from site
setup and roof drawing through obstructions, components, panel layout and the shadow view, and
produce the bill of materials that will price the proposal. They add a smaller variant for a
price-sensitive customer and mark the larger one recommended. Then, wearing sign-off, they work
the review queue composed into the same home: two designs approved, one returned with a comment
attached to the string configuration rather than a general complaint. The author is notified; the
customer sees neither.

### Primary surfaces

Desktop-weighted in practice — the studio's precision work is where a large screen genuinely
helps — with full mobile parity as a product law: every screen works at 375px including the
studio, and no studio capability is dropped on any surface. Review and sign-off are comfortable on
a phone by design, because the reviewer is often the person least likely to be at a desk.

### Home screen & permissions

`PS-16`, `PS-18`. Designs awaiting work is the front door; where the same person also signs off,
the sign-off queue is composed into that home rather than competing with it (`PS-05`). Both
queues order oldest-first, because the cost of a design queue is measured in the customer waiting
at the other end of it.

**Permissions.** Assigned-only visibility. Create and edit designs; build proposals from them,
including pricing and discounts. Sign-off approve/return where the capability is held, recorded
with who and when as the structural-safety record. Not theirs: assigning leads, sending proposals
to customers, project stages, payments, or any tenant administration.
Full matrix: **see F2 §Design Engineer** — including F2's ruling on whether sign-off is its own
preset.

---

## Project Manager

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-20 | The **Project Manager** persona owns a won deal from signature to handover: moving it through the stage chain, keeping the document checklist complete, naming blockers with the party responsible, requesting the payment each completed stage makes due, and keeping the customer's progress view honest. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Users · scope grounded in source at `S8.rule.v1-boundary`, `S8.rule.stage-chain`, `S8.rule.roles` (v1 served this job with the Manager preset) | P0 |
| PS-21 | The Project Manager's **home screen is their projects ordered by days-in-stage, blockers first** — each card showing customer, size, value, days in the current stage, payment collected against payment due, and the blocker flag with who is being waited on. | `BRIEF` — home for a V2 persona, `_process/owner-brief-2026-08-03.md` §Users · grounded in source at `S8.screen.1`, `S8.rec.2` ("days-in-stage is the only metric that matters on the board"), `S8.rec.3` | P0 |

### Who they are

The person the customer thinks of as "my project person". v1 called them the *coordinator / ops*
and served them with the Manager preset — "there is no separate coordinator role" — and the source
is explicit that this is "one screen the coordinator lives in". V2 gives the job its own persona
because in the V2 box it is a distinct career, not a hat a sales manager wears.

The boundary matters: this persona owns **individual projects end to end**. The portfolio view —
throughput across all projects, the field workforce's day — belongs to Operations.

### Goals

- Know what is stuck, and make the waiting visible and attributable rather than absorbing blame
  for someone else's timeline.
- Turn every completed stage into the payment it makes due, immediately.
- Keep the document pack complete as it goes, not at handover.
- Let the customer answer "what is the status?" themselves, without a phone call.

### Pains

- **Two stages outside their control** cause nearly all delay: the utility's inspection and
  approval, and the incentive disbursement they do the paperwork for and get blamed for
  (`S8.rule.external-delays`; labels come from the market pack).
- **Aging in a stage.** Weeks pass and the board still reads "nearly finished" unless
  days-in-stage tells the truth (`S8.wrong.1`, `S8.wrong.9`).
- **Waiting on the customer** — site access, documents — which has to be recorded with the date it
  started, because that is the state that protects the EPC (`S8.wrong.4`).
- **Material shortage**, blocked with an expected date, where the customer sees "material
  ordered" and not the supplier's problem (`S8.wrong.5`).
- **An incentive rejected or delayed** — the customer's money, so the customer will ask
  (`S8.wrong.6`).
- **Change after Won.** Two more panels means a new proposal version and revised tranches, with
  the original preserved (`S8.wrong.7`).
- **Cancellation after Won**, which must stop counting as revenue immediately rather than
  quietly persisting in a report (`S8.wrong.8`).
- **An unpaid tranche**, which is chased from the board — and never by blocking the customer's
  progress link: "chase the person, do not punish the view" (`S8.wrong.3`).

### A day in the life

Their board opens on blockers, oldest first: one waiting on the utility since a recorded date,
one waiting on the customer for site access, one waiting on us — which they clear themselves
before lunch. A project moves from installation to the next stage; the matching tranche becomes
due and they copy the ready-made request message rather than composing one. They upload two
documents against the checklist and mark one verified. On the aged card that has sat in inspection
for over a month, they add the blocker reason, and the customer's progress link now explains the
wait in one line — which the source says prevents most support calls. At handover they assemble
the document pack, close the project, and ask for the referral.

### Primary surfaces

Web for the board, the document checklist and the dense project detail. Mobile for stage moves,
photo and document upload, blocker updates and payment marking while on site — the parts of the
job that happen away from a desk.

### Home screen & permissions

`PS-21`. The board is a triage surface: days-in-stage is the metric, not a percentage or a
burndown, and every blocker names who is waiting. Mobile shows one column with a stage filter;
web shows the full board. Aged cards surface rather than sinking.

**Permissions.** Project-scoped: move stages, upload and verify documents, set and clear blockers,
request and record payments against tranches. Sales sees their own won deals read-only so they can
answer a customer without asking. Not theirs: catalog, price book, agent configuration, billing,
or team administration. Full matrix: **see F2 §Project Manager**.

---

## Field Technician

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-22 | The **Field Technician** persona is the employee whose working day is a sequence of places rather than a desk: site visits, service calls, deliveries and checks, with check-in and check-out at each, an activity timeline behind them and attendance derived from the day they actually worked. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Users, §Field-workforce | P0 |
| PS-23 | The Field Technician's **home screen is their route today** — the assigned stops in order, each with address, customer, window, distance, one-tap navigation and one-tap call, plus their current check-in state. | `BRIEF` — home for a V2 persona, `_process/owner-brief-2026-08-03.md` §Users, §Field-workforce · grounded in source at `S4.screen.6` (the surveyor's equivalent front door) | P1 |

### Who they are

New in V2. The owner's brief asks for live location, attendance, visit tracking, route timeline,
site check-in and check-out, geofencing, activity timeline, daily movement and team visibility —
studied from products in that category without replicating them, and explicitly without the fleet
management features an EPC has no use for.

The persona is deliberately distinct from its two neighbours: the **Survey Engineer** is a
specific capture job with a specific deliverable, and the **Installation Team Member** is the crew
at a build. The Field Technician is the general field employee — the one whose day is the route
itself.

### Goals

- Know where to go next without phoning the office.
- Be counted as present for the day they actually worked, without paperwork.
- Check in and out of a site without arguing about it later.

### Pains

- **Being asked to prove where they were.** Attendance and check-in must be a by-product of doing
  the work, not a second job (`BRIEF` §Field-workforce).
- **A route that ignores geography**, sending them across the city and back.
- **A phone that runs out** — of battery, of storage — halfway through the day
  (`S4.wrong.7`, `S4.wrong.8`).
- **Being surveilled rather than supported.** Live location exists to answer "who is nearest" and
  "is the day going to plan", and the product should read that way to the person being located.

### A day in the life

They open their route and the first stop is already at the top with distance and a tap to
navigate. They check in on arrival — the app knows they are there — do the work, capture photos and
notes, and check out. Between stops the timeline fills itself: where they were, how long, what
happened. At the end of the day their attendance is already recorded from the day they worked,
and their coordinator can see the same timeline without calling to ask.

### Primary surfaces

Mobile, exclusively in practice, and built for a phone held in one hand outdoors. Web exists for
their coordinator, not for them.

### Home screen & permissions

`PS-23`. The route is the front door: stops in order, current state visible, one tap to navigate
or call. No money, no pipeline, no dashboards.

**Permissions.** Assigned-work visibility only: their own stops, their own check-ins, their own
timeline and attendance. Not theirs: other people's locations, leads, pricing, proposals or any
financial surface. Full matrix: **see F2 §Field Technician**.

---

## Installation Team Member

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-25 | The **Installation Team Member** persona is the crew who physically install the system: working the installation checklist — foundation, legs, rafters, purlins, modules, stringing, balance of system — derived from the structural model, ticking steps as they are completed and attaching photos as evidence. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Users ("Installation Teams") · surface grounded in source at `S8.screen.6` | P0 |
| PS-26 | The Installation Team Member's **home screen is today's installation** — the assigned job, its checklist with progress, the site's access constraints and the photos expected — and nothing else. | `BRIEF` — home for a V2 persona, `_process/owner-brief-2026-08-03.md` §Users ("Installation Teams") · grounded in source at `S8.screen.6`, `R16` | P1 |
| PS-27 | **The installation surface shows no commercial figures.** No price, no discount, no tranche, no margin, no customer value appears on any screen this persona sees. v1 achieved this by giving crew no screen at all — "crew sees no money because crew sees no screen"; where V2 gives them a screen, the property must be preserved by the surface itself. | `SRC` — `R16`; `S8.rule.roles` (installer / crew: "the installation checklist only. Ticks steps. Nothing financial.") | P0 |
| PS-28 | **Attribution survives a crew that never signs in.** Where the checklist is run by a coordinator rather than the crew, ticks are attributed to the coordinator and an optional free-text "done by" per step records the crew member's name. This fallback is not removed when crew accounts exist, because mixed crews are the normal case. | `SRC` — `R16` | P1 |

### Who they are

The crew on the roof. This persona has a specific and unusual v1 history that has to be read
before anything else here: **in v1 they had no user account**. The ruling is explicit — the
InstallationSheet's crew ticks had no crew user, the coordinator ran the checklist, and a
dedicated Installer preset was deferred with the note that a later release adds it without
restructuring anything, because a person already holds any number of roles. The owner's V2 brief
names Installation Teams as primary users
and requires every persona documented independently, so the persona is documented here in full,
and the question of whether it gets its own preset role is put to F2 rather than answered here
(see §Open questions).

### Goals

- Know today's job and exactly what has to be ticked, without a phone call to the office.
- Record what was actually done, in the order it was done, as evidence.
- Work on a roof, in sun, with gloves on.
- Never be shown, or asked about, what the customer paid.

### Pains

- **A checklist that does not match the structure** they are looking at; the sheet is derived
  from the structural model for exactly this reason (`S8.screen.6`).
- **Access they were not warned about** — no stairs, a locked terrace, a lane too narrow for the
  truck — which the survey captured as a constraint and which must reach them before they arrive
  (`S4.wrong.10`, `S4.rule.capture` access group).
- **Evidence lost.** Photos taken on a roof with no signal must survive the trip home.
- **Being handed a commercial screen.** The moment a crew surface shows money it becomes a
  negotiating document on site (`R16`).
- **Attribution disputes** about who did which step, which the free-text "done by" exists to
  settle (`PS-28`).

### A day in the life

They open the app to one job: today's installation, its address, its access notes, and the
checklist derived from the structure — foundation, legs, rafters, purlins, modules, stringing,
balance of system. They work down it, ticking as they go and attaching a photo where the step
calls for evidence. A step is done by a colleague who does not use the app, so it is recorded
with their name in the "done by" field. When the last item is ticked, the coordinator sees the job complete
without anyone phoning to say so. At no point does any screen show a price.

### Primary surfaces

Mobile, exclusively. This persona has no web surface and needs none.

### Home screen & permissions

`PS-26`. One job, one checklist, no navigation into the rest of the product. The checklist itself
— its steps, its derivation from the structural model, its persistence — belongs to the projects
module, which is also told not to rebuild it.

**Permissions.** The narrowest scope in the product: the assigned installation job and its
checklist, plus photo capture against it. No leads, no proposals, no project money, no documents
beyond installation evidence, no visibility of any other job. Full matrix: **see F2 §Installation
Team Member** — including F2's ruling on whether this persona holds a preset of its own.

---

## HR/Admin

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-29 | The **HR/Admin** persona keeps the people side of the company correct: inviting and onboarding employees, keeping their records and documents current, tracking attendance and leave, and deactivating people cleanly when they leave. The scope is SME-weight — only what supports EPC operations, without enterprise HR complexity. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Users, §HR; `_process/2026-08-03-v2-prd-design.md` §11 (M10 HR-lite scope: people records, roles/teams wiring into F2, attendance/leave surfaces shared with M09, onboarding = invite-by-phone) · onboarding and lifecycle mechanics grounded in source at `S0.screen.4`, `S1.screen.1`–`S1.screen.5`, `DOC08.deactivate-never-delete` | P0 |
| PS-30 | The HR/Admin's **home screen is people today** — invitations pending or expired, joiners part-way through onboarding, today's attendance exceptions, leave awaiting a decision, and employee documents needing attention (scope per M10). | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Users, §HR; `_process/2026-08-03-v2-prd-design.md` §11 (M10 HR-lite scope) · grounded in source at `S1.wrong.1`–`S1.wrong.4` | P2 |

### Who they are

New in V2 as a persona, though half their work already existed as owner-only administration. In a
small EPC this is the office administrator who also handles accounts and answers the phone; in a
larger one it is a real HR function. The brief's constraint is the defining one: include only what
supports EPC operations, and justify anything that looks like enterprise HR.

Note the boundary with the owner: **team and role administration is the owner's**, and this
persona's involvement in it is whatever F2 grants — this document does not widen it.

### Goals

- Get a new joiner from invitation to useful work in about two minutes, without a training
  session.
- Keep a people record that is accurate without becoming a second system nobody updates.
- Track attendance and leave from what the field surfaces already know, rather than from a
  spreadsheet.
- Remove access cleanly when someone leaves, without orphaning a year of their history.

### Pains

- **The invitation that never lands.** Expired invitations need a one-tap "ask again"; a wrong
  recipient needs to be able to decline, which notifies the person who invited them
  (`S1.wrong.1`, `S1.wrong.2`).
- **A joiner with nothing assigned**, who signs in to an empty screen — which must teach what will
  appear and who to ask, not present a blank page (`S1.wrong.3`).
- **Somebody leaving.** Access is removed gracefully rather than by a crash, and people are
  deactivated and never deleted, because deleting a user orphans their history and their
  attribution (`S1.wrong.4`, `DOC08.deactivate-never-delete`).
- **Guard rails they did not know existed** — a tenant must always retain an owner and always
  retain somebody who can administer the team, so some removals are blocked with an explanation
  (`DOC08.min-owner`).
- **Duplicated records.** People, attendance and documents in three places is how an SME ends up
  trusting none of them.

### A day in the life

Their screen opens on people: two invitations sent and not accepted, one expired and re-sendable
in a tap; a joiner who has verified their phone but not finished their profile; three attendance
exceptions from yesterday's field work; one leave request. They resend the expired invitation,
approve the leave, and check the two exceptions against the technicians' own timelines rather than
by calling them. Someone has left the company: they deactivate rather than delete, the person's
sessions end everywhere, their name disappears from assignment pickers, and every lead and
activity they touched stays attributed to them.

### Primary surfaces

Web-first — records, documents, imports and the people list are desk work. Mobile for approvals
and for the exceptions list, which is the part that is genuinely time-sensitive.

### Home screen & permissions

`PS-30`. A queue, not a report: everything on it is something to decide, resend, approve or
correct.

**Permissions.** People-scoped: employee records, documents, attendance and leave. Team and role
administration remains the owner's; where a tenant delegates part of it, F2 says so explicitly and
this document does not assume it. No lead, proposal, design or project money visibility follows
from this persona. Full matrix: **see F2 §HR/Admin**.

---

## Finance

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-31 | The **Finance** persona owns money correctness: the collection schedule each project inherits from its proposal's payment terms, recording what has been received against which tranche with its mode and receipt, keeping revenue honest as projects change or cancel, and holding the tenant's side of tax and invoicing per the market pack. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Users · money mechanics grounded in source at `S8.rule.tranches`, `S8.screen.3`, `S8.wrong.8` | P0 |
| PS-32 | The Finance persona's **home screen is money due** — tranches due now and overdue by project, receipts waiting to be recorded, and the period's collections against what was expected — with every figure obeying the money-never-stale rule. | `BRIEF` — home for a V2 persona, `_process/owner-brief-2026-08-03.md` §Users · grounded in source at `S8.rule.tranches`, `S8.wrong.3`, `S6.wrong.1` (money never renders stale as final) | P1 |

### Who they are

New in V2 as a persona; the surfaces they live on are not new. v1 already made payment tranches
the project's collection schedule and called it "the feature an EPC owner will actually pay for —
solar businesses die of cash flow, not of bad design software". In a small EPC this persona is the
owner or the administrator; in a larger one it is an accounts function that never touches a lead.

Two boundaries: the **tenant's** money — what their customers owe them — is this persona's daily
work; the **platform's** money — the tenant's own subscription — is the owner's, and Finance sees
it only where F2 grants it. All tax treatment, payment modes, invoice formats and currency
behaviour are market-pack data (`F1`), never hard-coded persona behaviour.

### Goals

- Collect what a completed milestone has already earned, before it ages.
- Reconcile every receipt to a tranche, with its mode and its evidence attached.
- Keep revenue honest: won means signed, and a cancelled project stops counting immediately.
- Never be the reason a customer's view of their own project goes dark.

### Pains

- **The unpaid tranche.** Visible on the board and the dashboard, chased by a person — and never
  by blocking the customer's progress link (`S8.wrong.3`).
- **Stale money.** A figure that changed upstream must never render as final; a design edited
  after its proposal makes that proposal's pricing stale and it has to say so
  (`S6.wrong.1`, `S5.wrong.7`).
- **Revenue that will not die.** A deal cancelled after Won that quietly keeps counting is the
  fastest way to lose trust in every other number (`S8.wrong.8`).
- **Discounting below cost.** The guard is arithmetic at generation — a warning below cost, a hard
  block when the payable figure reaches zero or less — and there is deliberately no approval
  workflow to appeal to (`S6.wrong.2`, `S6.wrong.3`).
- **Scope change after Won**, which revises the tranche schedule while preserving the original
  (`S8.wrong.7`).

### A day in the life

Money due opens on what has fallen due since they last looked: three tranches triggered by stages
that completed, two of them with the request message already copyable, and one overdue by long
enough to be flagged. They record two payments received with mode and receipt attached, and both
become part of an append-only record rather than an edit. They check a project that was cancelled
after Won and confirm it has stopped counting toward the period. They review one proposal where a
discount ran below cost, which was warned rather than blocked — the arithmetic guard did its job
and the decision belongs to whoever built the price.

### Primary surfaces

Web-first: reconciliation, receipts, exports and reporting are desk work on dense screens. Mobile
for marking a payment received and for the overdue list, both of which happen away from the desk.

### Home screen & permissions

`PS-32`. Due, overdue, and received — with every figure honest about its freshness. The tranche
ledger, the receipt record and the append-only money rules belong to the payments module; the
platform's own subscription and invoicing belong to platform billing.

**Permissions.** Money-scoped: view and record payments against tranches, attach receipts, and
read the money side of any project. Not theirs by default: building or discounting proposals,
project stage changes, catalog and price book, team administration, or the tenant's own billing.
Full matrix: **see F2 §Finance**.

---

## Operations

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-33 | The **Operations** persona keeps the whole portfolio moving: every project's blockers seen together and attributed to a party, aging visible across the board, document and stage hygiene enforced, and the field workforce's day visible as a whole. Their unit of work is the portfolio, where the Project Manager's is one project. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Users · scope grounded in source at `S8.rule.roles` (the v1 coordinator/ops job), `S8.rec.3`, and the V2 field-workforce team-visibility scope | P0 |
| PS-34 | The Operations persona's **home screen is blockers by party, oldest first** — everything waiting on us before everything waiting on someone else — with aged projects by days-in-stage beneath it and the field team's current day alongside. | `BRIEF` — home for a V2 persona, `_process/owner-brief-2026-08-03.md` §Users, §Field-workforce (team visibility) · grounded in source at `S8.screen.5`, `S8.rec.2`, `S8.rec.3` | P1 |

### Who they are

The second half of v1's *coordinator / ops*. Where the Project Manager owns projects one at a
time, Operations owns throughput: which projects are stuck and why, which of those waits are ours
to end, whether documents and stages are being kept honest, and where the field workforce
actually is today.

**A hard boundary, stated because the persona's name invites the mistake.** Operations does not
imply inventory, stock levels, purchase orders to suppliers, a procurement workflow, a crew
rostering or scheduling engine, dependency charts, or maintenance and monitoring. Those are
explicit product non-goals with a v1 rationale — the product is "a status + documents + money
tracker, not project-management software" — and naming an Operations persona does not reopen them
(`S8.rule.v1-boundary`, `D9`).

### Goals

- Nothing waits on us longer than it has to; everything that waits on someone else is recorded as
  such.
- Know where the field team is and whether the day is going to plan, without phoning anyone.
- Keep the boards honest, so days-in-stage tells the truth rather than flattering the company.
- Spot the pattern behind the delays, not just the individual delay.

### Pains

- **Blockers without an owner.** Every blocker has to name who is waiting — us, the customer, or
  the utility — because over time that is the only honest answer to "why do our projects take so
  long" (`S8.rec.3`, `S8.screen.5`).
- **Aging that hides.** A card that has sat in one stage for weeks must surface, not sink
  (`S8.wrong.1`, `S8.rec.2`).
- **The stage nobody controls.** Utility inspection and incentive disbursement dominate the
  calendar-free reality of delivery, and the product's job is to make the waiting visible and
  attributable rather than to pretend it can be shortened (`S8.rule.external-delays`).
- **Field visibility that arrives by phone call** — the exact problem the V2 field-workforce scope
  exists to solve (`BRIEF` §Field-workforce).
- **Being asked for procurement.** The pressure to grow this persona into inventory and purchase
  orders is constant and is refused on purpose (`S8.rule.v1-boundary`).

### A day in the life

Their screen opens on blockers grouped by party, with *waiting on us* first: two documents we owe,
one site revisit we have not scheduled. They clear both document items themselves and hand the
revisit to a coordinator. Below that, aged projects by days-in-stage, where one has been in
utility inspection long enough that the customer's link now carries the honest wait line. Alongside,
the field team's day: who checked in where, which stops are still open, and one technician whose
route no longer matches the work assigned to them. They reassign that stop. Nothing on the screen
is a vanity total; every item is something to do.

### Primary surfaces

Web-first — the portfolio view, the blocker groupings and the team view are wide-screen work.
Mobile for exceptions: the blocker that needs a decision now, the technician who needs
reassigning.

### Home screen & permissions

`PS-34`. Waiting-on-us first is the deliberate ordering: the persona's job starts with the delays
the company owns. Days-in-stage, not percentages. The board, the blocker model and the field
timeline belong to the projects and field-workforce modules respectively.

**Permissions.** Cross-project visibility with stage, blocker and document capabilities, plus
field-workforce team visibility. **Catalog and price-book administration belongs to Owner +
Operations**: this persona manages the catalog and publishes price-book versions alongside the
owner, and Finance views prices and margins (`_process/2026-08-03-v2-prd-design.md` §2 DD11 —
**superseding** the v1 Owner-only rule in `DOC08.matrix.manage-catalog`). It is a fixed property of
the preset, not a per-tenant arrangement. Not theirs: agent configuration, team and role
administration, or the tenant's own billing. Full matrix: **see F2 §Operations**, which encodes
the DD11 row.

---

## Marketing

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| PS-35 | The **Marketing** persona runs demand generation: campaigns across the channels the brief names — email, messaging, social and SMS — capturing the enquiries those campaigns produce and feeding them into the sales pipeline as leads that dedupe like any other. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §Users, §Marketing | P0 |
| PS-36 | The Marketing persona's **home screen is live campaigns and what they captured** — each campaign with its channel, its state and the enquiries it produced, plus captured leads not yet triaged into the pipeline, and whatever campaign-and-channel reporting M03 defines. | `BRIEF` — home for a V2 persona, `_process/owner-brief-2026-08-03.md` §Users, §Marketing · grounded in source at `S2.screen.2` (the capture queue this hands into); campaign/channel reporting content is a forward reference to `modules/M03-marketing.md`, not specified here | P1 |
| PS-37 | Whatever a campaign captures becomes an ordinary lead: **the phone number is the identity and every capture dedupes on it, from every channel, every time.** A marketing-sourced enquiry that matches an existing customer surfaces as a duplicate before it is saved, not after. | `SRC` — `S2.rule.dedupe`; `S2.wrong.1`; `S2.screen.3` | P0 |

### Who they are

New in V2. The brief asks for an integrated marketing module supporting lead generation and
engagement across email, messaging, social and SMS, managing campaigns, capturing leads and
feeding them into the sales pipeline — while keeping the existing voice follow-up capability and
inventing no automation beyond what the source supports or the brief proposes.

In a small EPC this persona is the owner running an occasional campaign. In a larger one it is a
function whose output is measured entirely by what reaches the pipeline.

### Goals

- Every enquiry a campaign produces reaches the pipeline, once, attributed to where it came from.
- Channels that stop working are noticed by the product, not by a drop in the pipeline a
  fortnight later.
- The company's own voice — the knowledge, the tone, the claims — stays consistent between a
  campaign and what the automation says on a call.
- Never create work for the sales team that the sales team has to clean up.

### Pains

- **Duplicates, which the source calls the one thing that kills solar CRMs.** The same homeowner
  arriving by three channels in three days must not become three leads with three executives and
  three prices (`S2.rule.dedupe`).
- **Junk at volume.** Wrong numbers and non-enquiries need to leave the queue without being
  deleted, so the pattern is still visible later (`S2.wrong.2`).
- **Partial captures.** A number with no name is still a lead; the gaps are visible to whoever
  makes first contact rather than blocking the capture (`S2.wrong.3`).
- **Enquiries arriving outside calling hours**, which may be captured but must not trigger an
  outbound call until the statutory window opens — a market-pack rule enforced by the platform,
  not a preference (`S2.wrong.4`).
- **A bulk import full of people already in the system** — shown before the import, never after
  (`S2.wrong.5`).
- **Handing over into a queue nobody triages**, where leads older than a day escalate to the
  owner (`S2.wrong.7`).

### A day in the life

Their screen opens on live campaigns by channel, each with what it captured, and a channel that
has stopped delivering flagged rather than silently flat, where M03's reporting surfaces it. They
review the enquiries captured
overnight: most flow straight into the lead queue with their source badge, two are flagged as
duplicates of existing customers and are logged as new enquiries against those records instead of
becoming second leads, one is obvious junk and leaves the queue without being deleted. They see
that the enquiries captured after hours were held rather than called. Later they update the
company's standing answers to the objections customers keep raising, which the automation reads
from the same place.

### Primary surfaces

Web-first: campaign composition, audience work, imports and channel configuration are desk work
on dense screens. Mobile for monitoring — what came in, what broke — rather than for authoring.

### Home screen & permissions

`PS-36`. Campaigns and captures, with the handover into the pipeline visible as the actual
measure of the persona's output.

**Permissions.** Campaign- and capture-scoped: create and run campaigns, see what they produced,
and hand captured enquiries into the lead queue. Lead visibility beyond capture, assignment,
pricing and proposals are not this persona's. Full matrix: **see F2 §Marketing**.

**Recorded, not resolved here.** This persona's scope crosses source material that v1 excluded —
lead scoring, marketing automation, campaign attribution and a website chatbot are all v1
non-goals (`S2.notv1.1`–`S2.notv1.4`), v1 limited lead sources to manual entry, bulk import and
inbound voice (`D13`), and v1's product never sent a message on the user's behalf (`D32`). The
two recorded conflicts are owned by the marketing, CRM and proposal modules
(`registers/conflicts.md` rows 3–4; the sending half was further resolved by the owner's
2026-08-04 Q33 ruling — the transactional lane now sends, D32's manual rule retired), and this
persona additionally gained the whole-base aggregate-only audience builder by the same session's
Q37 ruling (`M03-10`, F2's M03 matrix).

---

## 4. Cross-document contracts

**Provides.** The twelve persona names (`PS-02`) and their meanings; the home screen each persona
lands on (`PS-01`, `PS-05`, and one row per persona); the surface emphasis each persona is
designed around; and the persona-side reading of the v1 role matrix, including the three mappings
in §2 that F2 must rule on.

**Expects.**

| From | This document expects |
|---|---|
| `foundations/F2-roles-and-permissions.md` | Preset roles covering all twelve personas by these exact names; the ruling on whether design **sign-off** is its own preset or a capability of the Design Engineer preset (`PS-17`, `PS-19`); the ruling on whether Installation Team Member holds a preset (`PS-25`, and R16's own deferral, which names a later release as the one that adds it); the split of the v1 `Manager` preset across Sales Manager, Project Manager and Operations; and every permission summary in this document restated as an actual matrix row. No persona section here may be read as a permission grant. |
| `modules/M13-dashboards-and-reporting.md` | The home screens named here as real screens, honouring `PS-01` and `PS-05` — one composed home per person, derived from their widest role, never two competing front doors. |
| `modules/M01-onboarding-and-tenant-config.md` | The invitation and first-run path that puts a new person on the right home screen, including the role-explained card and the empty state for a person with nothing assigned yet. |
| `modules/M07` + `modules/M13` | The My Day composition behind `PS-11`, with agent activity in its own block, never mixed with the executive's own tasks. |
| `modules/M04-survey.md` | The visits home and the capture flow behind `PS-13`, and `PS-14`'s rule that surveying is a capability rather than a persona gate. |
| `modules/M05-design-studio.md` | The design queue and sign-off queue behind `PS-16` and `PS-18`, and the return-with-comments behaviour behind `PS-19`. |
| `modules/M08-projects.md` | The board, blocker model and installation checklist behind `PS-21`, `PS-26`, `PS-27`, `PS-28` and `PS-34` — including the no-commercial-figures property on the installation surface. |
| `modules/M09-field-workforce.md` | The route, check-in/out, timeline and team visibility behind `PS-22`–`PS-23` and Operations' field view, without the fleet-management scope the brief excludes. |
| `modules/M10-hr-lite.md` | The people surfaces behind `PS-29` and `PS-30`, SME-weight, with deactivate-never-delete carried from source. |
| `modules/M11` + `modules/M12` | The tranche ledger, receipts and money-honesty rules behind `PS-31`–`PS-32`, and the boundary between the tenant's money and the platform's. |
| `modules/M03-marketing.md` + `modules/M02-crm-and-leads.md` | The campaign and capture surfaces behind `PS-35`–`PS-37`, and ownership of the v1 non-goals and recorded conflicts this persona's scope crosses. |
| `foundations/F6-notifications-and-search.md` | The per-persona notification matrix, which this document deliberately does not attempt. |

## 5. Non-goals

- **No permission matrix, no capability grid, no role names.** F2 owns all three. Every
  permissions line in this document is a summary with a pointer, and where a summary and F2 ever
  disagree, F2 is correct and the disagreement is recorded in `registers/conflicts.md`.
- **No thirteenth persona.** The set is fixed by the brief (`PS-02`). A document that needs one
  raises an open question instead of coining one.
- **No screen specifications.** Home screens are named here as persona-level requirements; their
  contents, states and empty states belong to the owning modules.
- **No org chart, headcount, seat model or job description.** Personas are jobs to be done, not
  people or licences; the seat meter is the business model's.
- **No customer persona.** The EPC's customer is an audience, never a user, and never acquires a
  login (`PS-04`).
- **Operations does not mean procurement.** Naming an Operations persona does not reopen
  inventory, purchase orders, rostering engines, dependency charts or maintenance and monitoring,
  all of which remain explicit product non-goals with a v1 rationale (`S8.rule.v1-boundary`, `D9`).

## 6. Open questions

Raised by this document, owned elsewhere. These are to be mirrored into
`registers/open-questions.md` by the tasks that own them — this document's file scope did not
include that register.

| # | Question | Decision owner |
|---|---|---|
| A | **Does design sign-off warrant its own preset role?** v1 kept `Designer` and `Engineer` as separate presets so that the reviewer is not the author. V2 documents both jobs inside the Design Engineer persona (`PS-17`, `PS-19`). F2 must decide whether the preset set mirrors that convergence or keeps sign-off as a separate grantable preset — noting R16's precedent that roles are already many-to-many and a preset can be added without structural change. | `foundations/F2` (Task 5) |
| B | **How does the v1 `Manager` preset split?** It carried both the sales-team job and the projects coordinator job ("= the Manager preset — there is no separate coordinator role", `S8.rule.roles`). V2 has three personas across that ground: Sales Manager, Project Manager, Operations. Which presets result, and which one inherits the coordinator capabilities the source assigned to Manager? | `foundations/F2` (Task 5), with `modules/M08` |
| C | **Does the Installation Team Member get a login?** R16 deferred the Installer preset and gave the crew no screen at all, while naming a later release as the one that adds it. The owner brief names Installation Teams as primary users. If yes, `PS-27` (no commercial figures) becomes a surface obligation rather than a consequence of having no surface; if no, `PS-26` does not ship and `PS-28`'s coordinator attribution remains the only record. | `foundations/F2` (Task 5), with `modules/M08` |
| D | **Field Technician, Survey Engineer and Installation Team Member overlap in one person.** A single field employee may hold all three. `PS-05` requires one composed home, derived from the widest role — but "widest" is defined for lead visibility, not for field work. F2 and M13 need a composition rule for personas whose scope is not measured in lead visibility. | `foundations/F2` (Task 5), with `modules/M13` |
| E | **Sales Manager's home is source-derived; the v1 source never named a manager front door.** `S1.rec.1` names five front doors and the Manager is not among them; the manager's home is derived instead from the dashboards section, which assigns the owner dashboard to "Owner (+ manager, team-scoped)". Recorded as a source gap closed by another part of the same source rather than by invention — confirm the reading. | `modules/M13`, at authoring |

## 7. Verification performed

Run against this document as written, per the Task 4 brief:

- **Twelve persona sections**, each a `## ` heading titled with the exact persona name fixed by
  the owner brief, in the brief's order: EPC Owner · Sales Manager · Sales Executive · Survey
  Engineer · Design Engineer · Project Manager · Field Technician · Installation Team Member ·
  HR/Admin · Finance · Operations · Marketing.
- **Six subsections in every persona section**: *Who they are* · *Goals* · *Pains* · *A day in the
  life* · *Primary surfaces* · *Home screen & permissions*. Twelve sections × six = 72 subsections.
- **Six source-derived home screens**, matching the S1 ledger's intent and the source lines behind
  it: Sales Executive → My Day · Survey Engineer → today's site visits · Design Engineer → designs
  awaiting work · Design Engineer (sign-off) → the sign-off queue · EPC Owner → the pipeline
  dashboard (`S1.rec.1`, journey L183–186) · Sales Manager → that same dashboard, team-scoped
  (journey L1544). The remaining seven personas carry `BRIEF` homes.
- **Every persona section ends with a permissions summary** naming its F2 section, and **no
  permission matrix, capability grid or role name is defined in this document**.
