# 03 · Journey map — nine stages, thirteen customer steps, one record that travels

Status: draft · Origin mix: SRC (the nine-stage spine and the customer's thirteen steps) +
BRIEF (the V2 extensions that widen the spine); no `REC` items · Depends on: `00-README.md`,
`01-product-overview.md`, `02-personas.md`, and — because every stage below points into one —
every foundation and module PRD in this suite.

## 1. Purpose & scope

This document is the suite's narrative spine. It tells the product as a story — a company
arrives, its people arrive, an enquiry arrives, and that enquiry becomes a roof with panels on
it and money in the bank — and at every point in the story it names the document that owns the
detail. A reader who wants to know *what the product does* reads this file. A reader who wants
to know *what the product must do* follows the link.

It was written **last, deliberately**. Every link below points at a finished PRD, and every
sentence about a module was written after reading that module's own statement of what it is.
Nothing here characterises a module the module does not claim about itself.

**This document carries no requirements, and that is a rule rather than an omission.** There is
no requirement table, no requirement ID assigned here, no tier and no origin tag on a row —
because a narrative that restates requirements becomes a second, drifting copy of them.
Requirements live in `foundations/F1`–`F8` and `modules/M01`–`M13`, once each, and this file
points into them. Where a stage below names a behaviour, the requirement ID in brackets is a
**pointer to where that behaviour is actually specified**, not a restatement of it. The two
tables in this document (§5 and §6) are **maps** — step-to-document, stage-to-module-to-persona —
and neither has an ID, a tag or a tier column, because neither is a requirement table.

**How to read a stage.** Each of the nine stages in §3 carries four things and no fifth:

1. a paragraph of narrative — who is here, what they are trying to do, and what makes the stage
   hard;
2. the **owning module**, linked, described in the words its own §1 uses;
3. the **key personas** from `02-personas.md`'s fixed set of twelve; and
4. the stage's **P0 heart** — the one behaviour without which the stage does not exist, named
   by the requirement ID that carries it in the owning document.

**Vocabulary.** The commercial document is a **proposal**, everywhere, in every locale — the
naming decision is closed and the word "quotation" is not a synonym the product uses
([`foundations/F3-localization.md`](foundations/F3-localization.md) `F3-11`, with the search
alias the single exception at
[`foundations/F6-notifications-and-search.md`](foundations/F6-notifications-and-search.md)
`F6-22`).

**Market neutrality.** No currency symbol, tax term, incentive name, utility name or statutory
hour appears in this document. The journey is the same shape in every market; what a user reads
at each stage — the label on a stage, the name of the inspecting authority, the wording of an
incentive — is market-pack data owned by
[`foundations/F1-global-market-framework.md`](foundations/F1-global-market-framework.md). Where
the story needs a market fact, it names the pack rather than the market.

**No sequencing.** Stage numbers are positions in a customer's story, not build order, not
release phases and not priorities. The suite contains no timeline
([`00-README.md`](00-README.md) §Tier definitions: tiers rank importance, not schedule).

## 2. The one record that travels

The whole product is one sentence, and every stage below is a facet of it:

> The product replaces the spreadsheet-and-rekeying pipeline with **one record that travels**:
> CRM → survey → 3D design → proposal → no-login customer link → voice-agent follow-up → light
> project tracking → payments. No stage re-enters data an earlier stage already holds.
> ([`01-product-overview.md`](01-product-overview.md) `OV-04`)

This is the thread the rest of the document hangs on, so it is worth being concrete about what
"one record" means as the story moves.

A person telephones. Their **phone number becomes their identity** at the moment of capture, and
the duplicate check runs before anything is saved — so the same human being who called on one
day, filled a form on another and messaged on a third is one record, not three
([`modules/M02-crm-and-leads.md`](modules/M02-crm-and-leads.md) `M02-07`). That record acquires
a **site** when someone surveys the roof, and the survey is one object whichever mode produced
it ([`modules/M04-survey.md`](modules/M04-survey.md) `M04-01`). The site acquires a **design**,
and the design's bill of materials *is* the money path into the proposal rather than a second
set of numbers typed again
([`modules/M05-design-studio.md`](modules/M05-design-studio.md),
[`modules/M06-proposals.md`](modules/M06-proposals.md) `M06-01`). The proposal acquires a
**link**, and that link is not re-issued when the deal is won: the same tokenised URL becomes the
progress tracker and then the document pack, because the customer bookmarked it once
([`foundations/F5-customer-link.md`](foundations/F5-customer-link.md) `F5-19`). The won deal
**becomes** the project — created by the winning act itself, never by a person filling a form
([`modules/M07-sales-execution.md`](modules/M07-sales-execution.md) `M07-62`;
[`modules/M08-projects.md`](modules/M08-projects.md)). And the payment terms typed into the
proposal **become** the project's collection schedule, so the money owed against a passed
milestone is never a spreadsheet somebody keeps separately
([`modules/M11-payments-and-collections.md`](modules/M11-payments-and-collections.md)).

Two things follow, and they are the reason this thread is stated before the stages rather than
after them.

The first is a **conformance test**, and the overview states it as one: open any module PRD; if
its requirements can be satisfied while a user re-keys something an upstream module already
holds, `OV-04` has been broken and the defect belongs in
[`registers/conflicts.md`](registers/conflicts.md). Every cross-module contract in the suite —
every §4 in every module — exists to keep the thread unbroken.

The second is that the thread is what makes the stages *stages* rather than *products*. Nothing
in the story below is a separate application a user switches into. A stage is a moment in one
record's life, and the hand-off between two stages is the most fragile part of the product,
which is why each hand-off is specified as a contract by the module on both sides of it.

## 3. The nine stages

The spine is nine stages, from a company that does not exist yet to a customer holding a warranty
pack. The source states it as a map and each stage in the same six beats — who, goal, screens,
happy path, what goes wrong, what is deliberately left out — and every one of those beats has
been carried into the owning module PRD, where the "what goes wrong" items in particular are
carried whole rather than summarised.

### Stage 0 — Company onboarding

An EPC owner has decided to try the product, usually on a laptop, sometimes with a salesperson on
the telephone. The trap that kills this stage is well known: most business software asks for
everything up front — tax registration, logo, price book, the whole team — and people abandon
half way through and never come back. This product asks for **the minimum to produce one real
proposal** and collects the rest when it is actually needed. A company profile is skippable and
gets asked for when the first proposal is about to go out; the team is skippable; the catalog is
skippable. The stage ends with two doors, not a checklist: create your first lead, or open a
pre-loaded demo project and see what a finished job looks like before risking a real one. The
goal is the distance from "I signed up" to "my team can price a job" with no training session in
between.

- **Owning module:** [`modules/M01-onboarding-and-tenant-config.md`](modules/M01-onboarding-and-tenant-config.md)
  — "the front door and the configuration surface of the product: how a company becomes a
  tenant, how its people become users, and everything an EPC can make their own", written
  around the conviction that configuration is a first-class product surface rather than a
  settings dumping ground.
- **Key personas:** **EPC Owner** (the only persona present at signup); **HR/Admin** and
  **Operations** arrive later as the tenant's configuration surfaces become somebody's job.
- **The P0 heart:** self-serve signup on a phone number and a one-time password, asking for
  nothing beyond company name, the owner's name and city — no tax registration, no logo, no
  price book, no team, no payment instrument (`M01-01`, under the minimum-first law `M01-22`).

### Stage 1 — User onboarding

An employee receives an invite naming the person who sent it and the company it is for, with
their phone number already filled in. Two minutes later they are looking at real work assigned
to them. That is the entire stage, and its difficulty is not technical: it is that a
salesperson, a surveyor, a designer and an engineer want four different products on the same
day, and none of them will read anything. The answer the product gives is a structural one —
**role decides the home screen, and it is not a setting**. A sales executive lands on My Day, a
survey engineer on today's visits, a design engineer on designs awaiting work with the sign-off
queue composed in, an owner on the pipeline. Same application, different front doors. A person
who holds several roles gets one home with the other roles' work composed inside it, never two
competing home screens. First-run guidance is at most three coach marks on the screen the person
actually landed on — dismissible, never a carousel.

- **Owning module:** [`modules/M01-onboarding-and-tenant-config.md`](modules/M01-onboarding-and-tenant-config.md)
  (invites, first-run and the role-administration screens), with the home screens themselves
  owned by [`modules/M13-dashboards-and-reporting.md`](modules/M13-dashboards-and-reporting.md)
  and the role semantics behind them fixed once in
  [`foundations/F2-roles-and-permissions.md`](foundations/F2-roles-and-permissions.md).
- **Key personas:** every employee persona in
  [`02-personas.md`](02-personas.md) passes through this stage — **Sales Executive**, **Survey
  Engineer**, **Design Engineer**, **Project Manager**, **Field Technician**, **Installation
  Team Member**, **Finance**, **Operations**, **Marketing**, **HR/Admin**, **Sales Manager** —
  invited by the **EPC Owner**.
- **The P0 heart:** a phone-keyed invite carrying at least one preset role, accepted in one step,
  landing the person on the home their role decides rather than a generic dashboard they must
  navigate away from (`M01-12`, `M01-13`; the law is `PS-01`, the mechanism `M13-09` and its
  composition ladder `M13-10`).

### Stage 2 — Lead capture

An enquiry arrives. It arrives by telephone, or as a row in a spreadsheet somebody has been
keeping for years, or from a customer who was referred by a previous customer — and in the V2
product, from a campaign (§4). The stage has exactly one enemy and the source names it: *"The one
thing that kills solar CRMs: duplicates."* A homeowner telephones on one day, fills a form on
another and messages on a third; a careless system produces three leads, three reps, three
proposals and one confused customer who concludes the company is disorganised and buys elsewhere.
So the rule is stated once and binds every capture path: **phone number is the identity, and the
duplicate check runs on capture, every time, from every channel, before anything is saved.**
Capture itself must take under thirty seconds on a phone — four fields, everything else later.
What lands is a single queue, newest first, each row wearing the badge of the channel it came
from: the owner's morning triage, built for one decision per lead in under three seconds.

- **Owning module:** [`modules/M02-crm-and-leads.md`](modules/M02-crm-and-leads.md) — "where a
  customer enters the product and where a deal is either kept alive or honestly closed": capture,
  the duplicate check, the inbox, qualification, assignment, the lead's whole lifecycle, and the
  customer merge that phone-based deduplication cannot reach.
- **Key personas:** **EPC Owner** (the inbox is the owner's screen, not the rep's), **Sales
  Manager**, **Sales Executive**; **Marketing** joins this stage in V2 (§4).
- **The P0 heart:** the duplicate check on capture, from every channel, before anything is saved
  — with the dedupe sheet showing the three facts that make the decision obvious: who owns the
  existing record, what stage it is at, and when it was last contacted (`M02-07`, `M02-08`).

### Stage 3 — Qualify & assign

The lead has arrived and now somebody has to own it. Assignment is a human decision made with
each rep's current open load visible, so nobody gets buried — there is no routing engine and no
rules in this release. Once owned, the rep telephones, and the qualification that matters is six
things asked inline on the call rather than a form filled afterwards: what the customer's
electricity costs them, whether they own the roof, what kind of roof it is, whether shading is
obvious, when they want it, and whether the person on the telephone is the one who decides.
Disqualification requires a reason from a fixed list, because that list is the most valuable
analytics the product will ever hold. And the stage's most under-appreciated action is **snooze**:
"call me after the festival" is the single most common outcome of a first call, and a product
that cannot represent it cleanly leaves reps holding pipeline in their heads, which is how
pipeline leaks. Nothing here is allowed to go quiet by accident either — a lead nobody has picked
up escalates to the owner rather than ageing silently in a queue.

- **Owning module:** [`modules/M02-crm-and-leads.md`](modules/M02-crm-and-leads.md) (assignment,
  qualification, the consolidated snooze / dormant / reopen state machine, and the booking act
  that hands work to survey).
- **Key personas:** **EPC Owner** and **Sales Manager** (assigning), **Sales Executive**
  (qualifying and booking).
- **The P0 heart:** assignment is manual with each rep's open load visible at the moment of
  assigning (`M02-27`), and no lead stays unowned in silence — more than twenty-four hours
  unassigned escalates to the owner as a notification, without the lead's own state changing
  (`M02-50`).

### Stage 4 — Site survey

This is the stage the product turned into a competitive weapon. A roof can be surveyed **without
anybody going there**: an address, satellite imagery, an automatically detected outline with
obstructions and pitch, reviewed and corrected by a person — a designable roof, from a desk, in
minutes. The alternative mode is the traditional one: hours, travel, the customer at home, a
person on the roof photographing the meter and the main panel and the neighbour's water tank.
Both produce the same kind of record. The consequence is a change in the order of the whole
journey: for residential work the sequence becomes remote survey → design → proposal → physical
visit *once the customer is interested*, so the site visit is **verification before installation
rather than a precondition for giving somebody a price**. One law holds the stage together:
honesty about origin — remote data is *derived* from imagery, physical data is *measured* on
site, and a proposal built on a remote survey is entirely legitimate and sellable, it simply must
not claim to be a site survey.

- **Owning module:** [`modules/M04-survey.md`](modules/M04-survey.md) — "where a roof stops being
  an address and becomes something a person can design on", owning both modes and everything each
  produces.
- **Key personas:** **Survey Engineer** (the physical mode is their day), **Sales Executive** (the
  remote mode is often theirs, standing in front of the customer), **Design Engineer** (the
  consumer of everything captured); **Field Technician** joins this stage in V2 (§4).
- **The P0 heart:** a detected roof is **never applied silently** — the result is an editable
  overlay the operator must accept, adjust or reject, with the detector's confidence shown beside
  each thing it qualifies (`M04-15`, `M04-16`), and no imagery failure ever blocks the survey
  (`M04-11`).

### Stage 5 — Design

A designer turns a survey into something buildable and sellable: the roof traced on real
satellite imagery, obstructions modelled, components chosen, panels laid out with real electrical
stringing, shading simulated, a 3D view, and a bill of materials that is not a document but the
proposal's actual money path. This is **the flagship of the product** — the thing no competitor
at a comparable price has — and it is a redesign rather than an invention: the working
implementation already carries the tracing, the simulation, the 3D and the layout, and the
engineering underneath it is validated and must not be redesigned away. The stage produces
variants rather than rewrites when a customer changes their mind about size, marks one of them
recommended, and ends at a **human sign-off**: an engineer approves the design, and until they
do, the customer never sees it. The product does not compute whether a structure is adequate —
that is a person's judgement, recorded with their name against exactly what they reviewed.

- **Owning module:** [`modules/M05-design-studio.md`](modules/M05-design-studio.md) — the studio
  in which a survey becomes a buildable, sellable design, from a small rooftop to a large plant,
  with the studio census adopted verbatim as its acceptance baseline and never allowed to shrink.
- **Key personas:** **Design Engineer** (both jobs — the design and the sign-off), with **Sales
  Executive** reading variants and **EPC Owner** seeing what it costs to build.
- **The P0 heart:** the product never computes structural adequacy — sign-off is a recorded human
  decision, and an unapproved design is never shown to the customer (`M05-82`, with the sign-off
  record pinned to exactly what was reviewed at `M05-85`).

### Stage 6 — Proposal

The most-used screen in the product, and the one many deals never leave: plenty of jobs are won
without the design studio ever opening. There is **one object, not two** — no separate "quote" a
user manages somewhere else; the proposal is the thing that is built, priced, versioned, shared
and accepted. It is built in eleven steps through one builder with two entry paths: arriving from
a design, where the numbers are *derived* from a real model, or straight from a lead, where they
are *estimated or assumed*. The difference is not two systems — it is how much arrives pre-filled
and how honestly the result is labelled. The builder lets people work out of order: jump to any
step, leave things incomplete, come back — and every check the product enforces fires **once, at
Generate**, as a list of failures each of which is tappable back to the step that owns it. Then
two actions and no third: download the document, copy the link. The rep pastes it into their own
messenger, because the product composes messages and a person sends them. Marking it shared is
what starts the clock, and the follow-up task for the next contact already exists before anyone
has to remember it.

- **Owning module:** [`modules/M06-proposals.md`](modules/M06-proposals.md) — "the product's
  commercial document: how it is built, priced, versioned, generated and put in front of a
  customer", with the goal stated in one line: *a price the customer trusts, delivered where
  they will actually read it*.
- **Key personas:** **Sales Executive** (builds and shares), **Design Engineer** (builds from a
  design), **EPC Owner** (sees the margin), **Finance** (sees what was committed).
- **The P0 heart:** one object, not two (`M06-01`), and free navigation with validation at
  Generate only, as a tappable failure list (`M06-22`).

### Stage 7 — Follow-up & close

The goal of this stage is four words: *nothing goes quiet by accident.* The rep's home is **My
Day** — not a dashboard of numbers but a list of what to do today, overdue work first and in red,
then timed items, then what happened overnight, then the week ahead. Alongside the rep works the
**voice agent**: it answers when nobody picks up, it calls back the customer whose proposal has
been sitting unopened, it answers the boring specific questions people actually have before
spending a large sum — who fixes this in year four, will it damage my roof, is the incentive real
and who does the paperwork — and it hands over to a human the moment anyone asks. What it does by
default is set to protect the customer out of the box, and what the owner may change stops at the
market's statutory floor: tenants configure within the law, not around it. Everything a machine
did on the rep's behalf appears as its own block, never mixed into the rep's own tasks, because
blurring that line is how people stop trusting automation. The stage ends in a decision, and both
directions require honesty: marking won captures the value and creates the project in the same
act; marking lost requires a reason from a fixed list, and that list is the most valuable data in
the product.

- **Owning module:** [`modules/M07-sales-execution.md`](modules/M07-sales-execution.md) — "where
  selling actually happens after a proposal exists": the working day, the follow-up task system
  every other module's automation feeds, the voice agent end to end, and the close.
- **Key personas:** **Sales Executive** (the whole stage is their day), **Sales Manager** and
  **EPC Owner** (the queue, the escalations, the win and loss reasons).
- **The P0 heart:** My Day as a list of what to do today rather than a dashboard of numbers
  (`M07-01`), every automation landing as an owned, dated task (`M07-05`), and Mark won creating
  the project atomically in the same act (`M07-62`).

### Stage 8 — Handover and delivery

The deal is won and the product's job changes completely: know what is stuck, collect the money,
and let the customer see progress without telephoning. This stage is **deliberately small** — a
status, documents and money tracker, not project-management software. The customers it is built
for run a group chat and a notebook, and the product is replacing the notebook, not selling them
a scheduling suite. A won deal *is* a project; nobody re-enters a customer. It moves along a
canonical stage chain with market-neutral names and market-pack labels, and its most valuable
output is not the board but the **attribution of every wait**: two of these stages sit almost
entirely outside the company's control, and the product's job is not to make them faster but to
make the waiting **visible and attributable**, so an EPC stops absorbing blame for somebody
else's timeline. The payment terms agreed in the proposal are the collection schedule here: when
a stage completes, the matching tranche becomes due and the coordinator can produce a
ready-to-paste request in one tap. And the customer's link — the same one they were sent the
proposal on — is now the progress tracker, then the handover pack. It is never blocked over
money: chase the person, do not punish the view.

- **Owning module:** [`modules/M08-projects.md`](modules/M08-projects.md) (the project object,
  the stage machine, blockers, the document checklist, the installation checklist, handover),
  with the money mechanics at
  [`modules/M11-payments-and-collections.md`](modules/M11-payments-and-collections.md) and the
  customer's side of the link at
  [`foundations/F5-customer-link.md`](foundations/F5-customer-link.md).
- **Key personas:** **Project Manager** (the screen they live in), **Operations** (blockers across
  the portfolio), **Finance** (what has been collected against what is due), **Installation Team
  Member** (the installation checklist), **Sales Executive** (read-only on their own won deals, so
  they can answer a customer without asking anyone), **EPC Owner**; **Field Technician** joins
  this stage in V2 (§4).
- **The P0 heart:** every blocker names the party being waited on, from a closed set of four, with
  the date the wait started — there is no unattributed blocker (`M08-20`, `M08-23`) — and the
  customer's own link renders that wait rather than hiding it (`F5-19`), never revoked, degraded
  or gated over money the customer owes (`F5-24`, `F5-60`).

## 4. Where V2 widens the spine

The nine stages above are the v1 spine, and they are `SRC`: every one of them is carried from the
source corpus through the overlay. The owner's V2 brief adds three capabilities the v1 product did
not have, and none of them is a tenth stage. Each **extends an existing stage**, and each is
`BRIEF` in origin — mandated by the brief, not present in the source
([`00-README.md`](00-README.md) §Tag vocabulary). They are set out separately here so that a
reader can always tell which half of the journey carries source authority.

**Marketing feeds Stage 2.** In v1 an enquiry arrives because a person telephoned, because
somebody typed it in, or because a spreadsheet was imported. The brief adds demand generation:
campaigns run across the channels an EPC's customers actually use, and the enquiries those
campaigns produce. [`modules/M03-marketing.md`](modules/M03-marketing.md) owns that, and it owns
it under a boundary that matters more than the feature: **it is not a second CRM.** It holds no
pipeline, owns no lead after triage and runs no stage machine — everything it captures enters
Stage 2's unassigned inbox, through Stage 2's dedupe sheet, unchanged, with phone identity
preserved exactly as a typed capture is (`M03-07`, `M03-30`, `M03-32`). This module is also
where the suite's two brief-driven supersessions live and are stated rather than hidden: v1
deferred web and messaging capture channels, and v1 ruled that the product never sends on the
tenant's behalf. The capture supersession is the campaign lane's; the sending one now reaches
further — per the owner ruling of 2026-08-04 (`Q33`) the one-to-one messages about a single
deal that Stages 3, 4, 6 and 8 produce **send automatically from the tenant's connected
channel** under the transactional template class, with composed-and-pasted as the no-channel
fallback (`M03-03`). The original contradictions and their resolution notes are recorded in
[`registers/conflicts.md`](registers/conflicts.md) rows 3, 4 and 8.
Persona added to the spine: **Marketing**.

**Field workforce rides Stages 4 and 8.** A survey visit and an installation day are both, from
the office's point of view, a person going somewhere. In v1 the product knew that a visit was
booked and, later, that a survey had been submitted; it knew nothing about the day in between.
[`modules/M09-field-workforce.md`](modules/M09-field-workforce.md) owns **the field day**: where
field employees are supposed to be, where they actually were, when the day started and ended, and
what a coordinator can see of it without telephoning anyone. It rides the existing stages rather
than replacing them — it holds no stage, no blocker, no checklist and no survey object, and it
reads Stage 8's project sites as the places a geofence can be anchored to (`M09-08`). One of its
capabilities is structural for this journey: **site check-in and check-out and visit logging are
included for every employee, on every tier, with no tracked seat and no add-on**
(`M09-02`, `M09-18`). The location-tracking half is the product's single seat-counting
exception, toggled per employee by the owner, and its commercial law lives in
[`04-business-model.md`](04-business-model.md), not here.
Personas added to the spine: **Field Technician**, and a first-class surface for **Installation
Team Member**.

**HR-lite supports Stage 1.** Stage 1 in v1 gets a person into the product: an invite, a
one-time password, a profile, a home screen. What it never produced was a **record of the
person** — who they are, what they signed, what certifications they hold, whether they are on
leave today, and what happens to their open work when they leave the company.
[`modules/M10-hr-lite.md`](modules/M10-hr-lite.md) adds that at SME weight, and it is careful
about the boundary in both directions: the invite flow itself stays
[`modules/M01`](modules/M01-onboarding-and-tenant-config.md)'s and is referenced rather than
re-specified (`M10-13`), role assignment stays the owner's under
[`foundations/F2-roles-and-permissions.md`](foundations/F2-roles-and-permissions.md), and the
employee record is **the same person as the M01 user**, keyed by the same phone identity — there
is no second identity system (`M10-03`). Its other end matters to Stage 8: offboarding is access
revocation plus the reassignment of open work, which is the difference between a person leaving
and a pipeline leaking.
Persona added to the spine: **HR/Admin**, with **Finance** and **Operations** reading the same
records.

## 5. The customer's journey, in parallel

Everything above is written from the EPC's side. This is the same story from the other side of
the glass — a homeowner, or a factory owner, about to make a large once-in-a-decade purchase from
a company they do not yet trust. The defining fact of this journey is a subtraction: **the
customer never logs in.** No account, no password, no application, no portal. Their entire
experience of this product is messages, telephone calls and **one link** — and that link begins
as a proposal, becomes a progress tracker when the deal is won, and becomes the document pack at
handover. Same URL, bookmarked once, answering the only question the customer ever really asks:
*what is happening?*

The budget the design has to hold to is small and specific: roughly a dozen to eighteen messages
across the whole project, three to six telephone calls, **one** web link per named recipient,
**zero** logins and **zero** application installs. And the product's job on this side is not
screens. It is making sure the right message arrives at the right moment, and that the one link
always answers "what is happening?" — message timing and link truthfulness, the two themes every
customer-facing requirement is written against.

Three moments decide the outcome, and each one is a design constraint on a named surface:

- **Speed of first callback** decides whether the company is in the running at all. The customer
  has probably contacted two or three companies the same week; a callback within the hour reads
  as a strong signal, and three days later the job is already lost. The mechanism is Stage 2.
- **The proposal link, opened once, on a phone, in the evening** decides the sale. It will be
  read properly, once, probably with a spouse. The mechanism is Stage 6 and the link itself.
- **Visible progress during the long external wait** decides whether they refer you. The
  mechanism is Stage 8's wait attribution rendered on the same link.

The thirteen steps below are the customer's own, and **all of them land in
[`foundations/F5-customer-link.md`](foundations/F5-customer-link.md)** — including the steps
where the customer touches no screen at all, because "nothing happens in the app; everything
happens in their head" is itself a product obligation about what must not be left silent. This is
a map, not a requirement table: the requirement IDs are pointers into F5, where the behaviour is
specified.

| Step | What the customer experiences | EPC-side stage | Lands at |
|---|---|---|---|
| **C1** — They make an enquiry | A telephone call. They are shopping, and they have contacted competitors the same week. | Stage 2 | [`foundations/F5-customer-link.md`](foundations/F5-customer-link.md) `F5-09`, `F5-10` |
| **C2** — First conversation | A rep asking about their bill, roof and timeline, while they silently judge whether this person knows more than they do. | Stage 3 | `F5-12`, `F5-13` |
| **C3** — The site visit, which may not happen yet | Either nothing at all (remote survey — they get their proposal far sooner, which is often what wins the job), or somebody on their roof for half an hour. What builds trust is being told what is being photographed and why; what destroys it is silence. | Stage 4 | `F5-14`, `F5-15` |
| **C4** — The wait | Silence, for a few days. This is where enthusiasm decays and competitors land first. Nothing in the product may let this gap be silent. | Stage 5 | `F5-16` |
| **C5** — The proposal arrives | A message, a document and a link. The moment of maximum attention: system size, generation, savings, price and what they actually pay, payback, **a 3D view of their own roof**, financing, and two actions — Accept, or ask a question. | Stage 6 | `F5-32`, `F5-36`, `F5-38`, `F5-39` |
| **C6** — They think about it | Nothing happens in the product for days or weeks. Their real questions are rarely about price: will it actually reduce my bill, what if it does not work, who fixes it in year four, will it damage my roof. | Stage 7 | `F5-17` |
| **C7** — The follow-up | A call, sometimes from the rep, sometimes automated — which says so, in their language, inside lawful hours, with a person always reachable. | Stage 7 | `F5-11`, `F5-18` |
| **C8** — The decision | Tapping **Accept** on the link, going quiet, or saying no. Acceptance happens in exactly one way and no other. Asking for a discount gets an answer the same day, because there is no approval hop. | Stage 7 | `F5-43`, `F5-48`, `F5-50` |
| **C9** — Paying the advance | The highest-anxiety moment in the whole journey: first real money to a company they met weeks ago. What reduces it is an instant receipt, a named person to contact, and a clear statement of what happens next. | Stage 8 | §F5.8, with the money at [`modules/M11-payments-and-collections.md`](modules/M11-payments-and-collections.md) |
| **C10** — The long wait | Weeks. Material, scheduling, and an external approval that is entirely outside the company's control. This is where customers become unhappy — almost always because of silence rather than delay. The progress link, saying what is waiting and why, prevents more support calls than anything else in the product. | Stage 8 | §F5.9, reading [`modules/M08-projects.md`](modules/M08-projects.md)'s blockers |
| **C11** — Installation | A crew on their roof for a day or two. They want to know who is coming, when, how long, and whether there will be noise and mess. | Stage 8 | §F5.9 |
| **C12** — Commissioning & handover | The system switching on, and a pile of documents — warranties, the commissioning certificate, the approvals, and how to read their own generation. This is the moment they decide whether to refer you, so this is where the referral is asked for. | Stage 8 | §F5.10 |
| **C13** — Living with it | Beyond this release. They will want monitoring, cleaning reminders, a service contact and eventually warranty claims. The one live obligation is that handover leaves them knowing exactly who to call. | — | §F5.10 and F5 §5 (non-goals) |

Two of these steps carried a recorded tension that the owner has since resolved (ruling
2026-08-04, `Q33`): the source describes an **automatic** message to the customer at C4 and an
acknowledgement **within seconds** at C8 — and both are now the shipped behaviour, sending
automatically from the tenant's connected transactional channel, with the link's own state plus
a composed message a person sends as the no-channel fallback (`F5-16`, `F5-48`;
[`registers/open-questions.md`](registers/open-questions.md) Q33 — decision recorded).

## 6. The map: stage ↔ module ↔ persona

One table, for the reader who wants the whole spine at a glance. **This is a map, not a
requirement table** — it assigns no ID, tag or tier, and every cell is a pointer to a document
that owns the detail. Personas are named from
[`02-personas.md`](02-personas.md)'s fixed twelve; "V2" marks a persona or module that the
brief adds to a v1 stage (§4).

| Stage | Owning module | Also on this stage | Key personas | The stage in one line |
|---|---|---|---|---|
| **0 · Company onboarding** | [`modules/M01-onboarding-and-tenant-config.md`](modules/M01-onboarding-and-tenant-config.md) | [`04-business-model.md`](04-business-model.md), [`modules/M12-platform-billing.md`](modules/M12-platform-billing.md) (trial and entitlements), [`foundations/F1-global-market-framework.md`](foundations/F1-global-market-framework.md) (the tenant's market pack) | EPC Owner | Ask for the minimum to produce one real proposal. |
| **1 · User onboarding** | [`modules/M01-onboarding-and-tenant-config.md`](modules/M01-onboarding-and-tenant-config.md) | [`foundations/F2-roles-and-permissions.md`](foundations/F2-roles-and-permissions.md), [`modules/M13-dashboards-and-reporting.md`](modules/M13-dashboards-and-reporting.md) (the homes), [`modules/M10-hr-lite.md`](modules/M10-hr-lite.md) *(V2)* | All twelve; invited by EPC Owner; HR/Admin *(V2)* | Role decides the home screen, not a setting. |
| **2 · Lead capture** | [`modules/M02-crm-and-leads.md`](modules/M02-crm-and-leads.md) | [`modules/M03-marketing.md`](modules/M03-marketing.md) *(V2)*, [`modules/M07-sales-execution.md`](modules/M07-sales-execution.md) (inbound voice capture) | EPC Owner, Sales Manager, Sales Executive, Marketing *(V2)* | Phone number is the identity; dedupe on capture, every time. |
| **3 · Qualify & assign** | [`modules/M02-crm-and-leads.md`](modules/M02-crm-and-leads.md) | [`modules/M04-survey.md`](modules/M04-survey.md) (the booked visit), [`foundations/F6-notifications-and-search.md`](foundations/F6-notifications-and-search.md) (escalation) | EPC Owner, Sales Manager, Sales Executive | Somebody owns every lead, and snooze is a first-class action. |
| **4 · Site survey** | [`modules/M04-survey.md`](modules/M04-survey.md) | [`foundations/F4-data-integrity.md`](foundations/F4-data-integrity.md), [`foundations/F8-data-honesty.md`](foundations/F8-data-honesty.md), [`modules/M09-field-workforce.md`](modules/M09-field-workforce.md) *(V2)* | Survey Engineer, Sales Executive, Design Engineer, Field Technician *(V2)* | Two modes, one record; derived is not measured, and it says so. |
| **5 · Design** | [`modules/M05-design-studio.md`](modules/M05-design-studio.md) | [`modules/M01-onboarding-and-tenant-config.md`](modules/M01-onboarding-and-tenant-config.md) (the catalog), [`foundations/F8-data-honesty.md`](foundations/F8-data-honesty.md) | Design Engineer, Sales Executive, EPC Owner | The flagship — and an unapproved design never reaches a customer. |
| **6 · Proposal** | [`modules/M06-proposals.md`](modules/M06-proposals.md) | [`foundations/F5-customer-link.md`](foundations/F5-customer-link.md), [`foundations/F8-data-honesty.md`](foundations/F8-data-honesty.md), [`foundations/F1-global-market-framework.md`](foundations/F1-global-market-framework.md) | Sales Executive, Design Engineer, EPC Owner, Finance | One object, not two — and validation happens once, at Generate. |
| **7 · Follow-up & close** | [`modules/M07-sales-execution.md`](modules/M07-sales-execution.md) | [`modules/M13-dashboards-and-reporting.md`](modules/M13-dashboards-and-reporting.md) (My Day's rendering), [`foundations/F6-notifications-and-search.md`](foundations/F6-notifications-and-search.md), [`foundations/F1-global-market-framework.md`](foundations/F1-global-market-framework.md) (the statutory floor) | Sales Executive, Sales Manager, EPC Owner | Nothing goes quiet by accident. |
| **8 · Handover & delivery** | [`modules/M08-projects.md`](modules/M08-projects.md) | [`modules/M11-payments-and-collections.md`](modules/M11-payments-and-collections.md), [`foundations/F5-customer-link.md`](foundations/F5-customer-link.md), [`modules/M09-field-workforce.md`](modules/M09-field-workforce.md) *(V2)* | Project Manager, Operations, Finance, Installation Team Member, Sales Executive, EPC Owner, Field Technician *(V2)* | Make the waiting visible and attributable, and collect the money. |
| **Parallel · C1–C13** | [`foundations/F5-customer-link.md`](foundations/F5-customer-link.md) | Every module that publishes a fact the link renders | *(no persona — the customer holds no role and never logs in)* | One link, three phases, bookmarked once. |

## 7. What runs across every stage

The source's own map ends with a list of things that belong to no single stage because they
belong to all of them. Each has an owner in this suite:

- **Roles and permissions** — twelve fixed presets, stacking, visibility scope and the
  per-module matrices: [`foundations/F2-roles-and-permissions.md`](foundations/F2-roles-and-permissions.md).
  No module restates a matrix.
- **Notifications and search** — the notification type registry, the event × persona × channel
  matrix and the notification centre, plus one search box across the tenant's records scoped by
  role visibility: [`foundations/F6-notifications-and-search.md`](foundations/F6-notifications-and-search.md).
  Both surfaces are **staff-facing only**; nothing there sends to the EPC's customer — the C4
  and C8 moments send through the transactional lane the owner ruled on 2026-08-04 (Q33; §5),
  which lives with `foundations/F5` and `modules/M03`, not with F6.
- **Settings** — every surface an EPC makes its own, from the catalog to message templates:
  [`modules/M01-onboarding-and-tenant-config.md`](modules/M01-onboarding-and-tenant-config.md).
- **Reporting** — the step back: role homes, the owner's dashboard, the funnel, win/loss,
  cycle time and the export rules that travel with all of it:
  [`modules/M13-dashboards-and-reporting.md`](modules/M13-dashboards-and-reporting.md).

Three foundations sit underneath every stage above rather than beside any one of them, and a
reader following a stage into its module will meet all three:
[`foundations/F1-global-market-framework.md`](foundations/F1-global-market-framework.md) (every
market fact any stage renders),
[`foundations/F3-localization.md`](foundations/F3-localization.md) (the language the reader
reads it in), and
[`foundations/F7-design-language.md`](foundations/F7-design-language.md) (what all of it looks
and behaves like). Underneath those sits
[`modules/M12-platform-billing.md`](modules/M12-platform-billing.md), whose entitlements are the
product's only runtime gating — and which never gates reading, search, export or the customer's
link in any billing state.

## 8. The two convictions the spine bends around

Two of the product's convictions are not features of a stage; they are shapes the whole journey
was bent into. They surface in the narrative above at a dozen points, and they are stated here
once so that a reader can recognise them when they meet them.

**Honesty is a feature.** Every user-visible number carries where it came from — measured on
site, derived from a model, estimated from heuristics, or assumed — and the label is never
switched off by a role, a plan, a tenant setting or a screen that ran out of room. Money never
renders as final while it is stale. Structural adequacy is never computed. The stage-level
consequences are visible throughout §3: a remote survey says on the document that it is a remote
survey (Stage 4), a proposal built without a design says so **visibly and not in fine print**
(Stage 6), a design edited after its proposal makes that proposal's pricing say it is stale
(Stages 5 and 6), and a blocker names who is being waited on rather than absorbing the blame
(Stage 8). The competitive reading is the one the source makes: competitors print estimates as
though they were calculations, and being the one product that distinguishes them reads as
confidence rather than weakness. The law book is
[`foundations/F8-data-honesty.md`](foundations/F8-data-honesty.md); every other document renders
it and none of them re-rules it.

**The customer never logs in.** This is a subtraction, and it shapes the journey as much as any
feature does. Because there is no portal, the link has to be trustworthy on its own — one URL
carrying three phases, never re-issued between them, never blocked over an unpaid tranche, always
answering "what is happening?" without an account. Because there is no application to install,
every message the product composes has to carry its meaning in the message rather than behind a
sign-in. And because acceptance happens in exactly one way — the customer tapping Accept on their
own link — no verbal agreement, no rep's note and no automated caller's report of enthusiasm is
ever a sale. The law and its whole lifecycle live at
[`foundations/F5-customer-link.md`](foundations/F5-customer-link.md).

## 9. What this document is not

- It is **not a requirements document.** It assigns no requirement ID and carries no requirement
  row. If a behaviour matters, it is specified in the module or foundation that owns it, and this
  file points there. A requirement table appearing in this file in a later revision is a defect.
- It is **not a build plan.** Stage numbers are positions in a customer's story. There is no
  sequencing, phasing or timeline in this suite ([`00-README.md`](00-README.md)).
- It is **not a resolution of anything.** Where the source contradicts itself or the overlay —
  the customer messages with no send channel at C4 and C8 being the clearest case — this document
  repeats the tension and points at
  [`registers/conflicts.md`](registers/conflicts.md) and
  [`registers/open-questions.md`](registers/open-questions.md). It resolves nothing on its own
  authority.
- It is **not a persona document.** Personas are named here and documented in
  [`02-personas.md`](02-personas.md); a persona's goals, pains and day belong there.
- It is **not market-specific.** Every market fact the journey touches is named as a pack key's
  responsibility rather than written out ([`foundations/F1-global-market-framework.md`](foundations/F1-global-market-framework.md)).
