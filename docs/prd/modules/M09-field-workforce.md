# M09 · Field workforce

Status: draft · Origin mix: `BRIEF`-dominant — this module exists because the owner's V2 brief
mandates it, not because v1 source specifies it. **One `SRC` row** (`M09-71`) — *(amended 2026-08-15; this line read "**No `SRC` rows**")*. The one place the v1 corpus ruled directly on a capability of this module was the offline behaviour of site check-in/out and
visit logging, and that framing went with the offline/sync capability on 2026-08-07. What survived it is the attendance-acknowledgement law, restored by owner ruling 2026-08-15 (register `Q64`) as `M09-71`, which carries the `SRC` tag its deleted predecessor `M09-36` carried. **Four `REC` rows**
(`M09-25`, `M09-33`, `M09-34`, `M09-63`) are the
"Recommend additional field features if valuable" the brief invites, mirrored in
`registers/enhancements.md`. Every other row is `BRIEF` ·
Depends on: `00-README.md`, `01-product-overview.md`, `02-personas.md`, `04-business-model.md`,
`foundations/F1-global-market-framework.md`, `foundations/F2-roles-and-permissions.md`,
`foundations/F3-localization.md`, `foundations/F4-data-integrity.md`,
`foundations/F7-design-language.md`, `foundations/F8-data-honesty.md`,
`modules/M02-crm-and-leads.md`, `modules/M04-survey.md`, `modules/M08-projects.md`,
`docs/prd/owner-brief-2026-08-03.md` §Field-workforce,
*retired: PRD design note* §2 (DD2, DD4, DD5, DD7) and §11,
*retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan — the
authority for the four privacy laws and the geofencing phrasing; §11 carries the module's scope)

## 1. Purpose & scope

This module owns **the field day**: where a company's field employees are supposed to be, where
they actually were, when their day started and ended, and what a coordinator can see of it without
telephoning anyone. Its authority is the owner's V2 brief, quoted in full in the on-disk
attestation (`docs/prd/owner-brief-2026-08-03.md` §Field-workforce):

> "Study products like TrackoBit. We do NOT want to replicate TrackoBit… Examples include Live
> location, Attendance, Visit tracking, Route timeline, Site check-in, Site check-out, Geo-fencing,
> Activity timeline, Daily movement, Team visibility. Do NOT copy unnecessary fleet-management
> features. Recommend additional field features if valuable. Clearly distinguish: Source-derived
> features, Recommended enhancements."

Everything below is either one of those ten capabilities made specific (`BRIEF`) or one of the four
recommendations the brief's own sentence asks for and this suite labels as recommendations (`REC`).
Nothing else is here.

**The study instruction is a capability instruction, and this module reads it that way.** The brief
names a category leader and immediately says the product is not to be replicated. What it then
gives is a list of **capabilities**, not a list of screens: what a field workforce product must be
able to tell an EPC owner. This module specifies those ten capabilities for a solar EPC and stops
there. It copies no surface, no navigation and no feature from any studied product, and the
capabilities the studied category carries that an EPC has no use for are excluded by name in §5,
on the brief's own authority (`M09-06`).

**This module is where the one seat-counting exception in the product lands, and it says so.**

Design spec §2 **`DD7`** is the only decision in the suite that lets the product count people.
Its boundary is carried into this document **without paraphrase** at `M09-02` and `M09-03`, and
the commercial half of the same decision is already published at `04-business-model.md`
(`BM-22`, `BM-23`, `BM-24`) — which this document cites and never restates. Two consequences run
through every section below:

- **Included in every tier, for every employee, with no tracked seat and no add-on:** site
  check-in, site check-out and visit logging. An EPC that never buys a tracked seat still gets
  those, across its whole team, forever (`BM-23`).
- **Inside the per-seat tracked bundle:** live location, route timeline, geofencing, movement
  history, activity playback. The **EPC Owner toggles tracking per employee**; only toggled-on
  employees are billed, as tracked-seat-months (`BM-22`; the ledger and month-fraction mechanics
  are `modules/M12-platform-billing.md`'s and are not specified here).

No price, bundle size or overage rate appears anywhere in this document; those are market-book data
(`BM-41`, `F1-25`) — the launch market's per-seat slot now carries the owner's draft value with an
included-seat ladder (owner ruling 2026-08-04, Q1/Q17), draft pending rate-card verification, which
`M09-16` renders honestly rather than treating as final.

**What this module is explicitly not.**

It is not a second project tracker: it holds no stage, no blocker, no checklist and no document —
`modules/M08-projects.md` owns all of that, and this module reads M08's **project sites** as the
places a geofence can be anchored to. It is not a survey product: a survey visit is a field visit,
but the survey object, its versions, its capture flow and the surveyor's deliverable are
`modules/M04-survey.md`'s and are referenced, never restated. It is not a CRM: the lead, the
pipeline and the act of booking a site visit are `modules/M02-crm-and-leads.md`'s (`M02-46`). It is
not an HR system: `modules/M10-hr-lite.md` owns the employee record, leave and the attendance
register; this module owns the **field capture** of a day's start and end and hands it to that
shared surface (`M09-40`). And it is not a fleet product — see §5, where the exclusions are named
individually with the brief's own prohibition as their authority.

## 2. Personas & surfaces

| Persona (`02-personas.md`) | Relationship to this module |
|---|---|
| **Field Technician** (`PS-22`, `PS-23`) | Primary. The persona whose working day *is* this module: the route, the stops, the check-ins, the timeline behind them and the attendance that falls out of the day they worked. Their home screen is their route today (`PS-23`) — this module supplies its content. |
| **Installation Team Member** (`PS-25`–`PS-28`) | Secondary and deliberately narrow: they check in and out of the job they are assigned to and log what they did. Every surface they reach obeys `F2-06`'s no-commercial-figures law without exception, exactly as on the installation checklist itself (`M08-43`). The checklist is `modules/M08`'s and appears nowhere here. |
| **Survey Engineer** (`PS-13`, `PS-14`) | A survey visit is a field visit. Their day, their visits home and their capture flow are `modules/M04`'s (`M04-38`); this module adds the check-in/out, the timeline and — where the Owner has toggled them on — the tracked-seat capabilities behind that same day, and restates nothing M04 already owns. |
| **Project Manager** (`PS-20`, `PS-21`) | Coordinator for their own projects: sees the field day of the people working their sites, sets those sites' geofences, and reads attendance for the crew on them. |
| **Operations** (`PS-33`, `PS-34`) | The field-workforce team view is theirs by decision B (`F2-08c`); `PS-34` already places "the field team's current day" on their home screen, and this module supplies that content. |
| **EPC Owner** | Holds the one toggle that turns tracking on or off per employee (`M09-11`) — a commercial act as much as an operational one — and sees everything, always (`F2-14`). In a small firm the Owner is also the coordinator, and every surface here must work for one person holding both jobs. |
| **HR/Admin** | **Attendance only.** They read attendance records and nothing else in this module — no location, no route, no movement, no geofence event (`F2.M09.attendance-visibility`; §M09.5). |
| **Sales Manager** | Not a field-visibility holder. They see the **visit facts on the record** they already own — did the surveyor arrive, when, and for how long — because those ride the lead's scope, not the field-work domain (`M09-60`). |
| Every other preset | Marks their own attendance and, where they do field work, checks in and out. No read of anyone else's field day (§F2.5-M09). |

**Surfaces.** Everything a field employee touches is **mobile-first and mobile-only in practice**
(`PS-22` primary surfaces): the route, the check-in, the visit log, the day start and end. It is
built for a phone held in one hand, outdoors, on a roof, in sunlight — `F7`'s outdoor legibility
and touch-target rules are not optional on these screens. Everything a coordinator touches — the
team view, the timeline, the day playback, the geofence settings — is **desktop-first and fully
functional on mobile**, because a coordinator reads it at a desk and also from a car. The
Owner's tracking toggle is a settings-class surface and lives with `modules/M01`'s tenant
configuration pattern (`M01-58`), reached from here.

*Section removed 2026-08-07 by owner decision: the offline/sync capability was deleted, so this
module no longer places its capabilities on either side of an offline boundary. What a coordinator
sees of a worker whose device is out of contact is `M09-48`.*

## 3. Feature areas

### M09.1 — Scope and the per-seat boundary

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M09-01 | **This module specifies exactly ten capabilities, and the list is the brief's.** Live location · attendance · visit tracking · route timeline · site check-in · site check-out · geo-fencing · activity timeline · daily movement · team visibility. Each has its own feature area below, each is tagged `BRIEF` against the attestation, and **no eleventh capability enters core scope**. A capability this suite believes is valuable but the brief did not name is a `REC` row, in its area for context and in `registers/enhancements.md` with its rationale — which is the "Clearly distinguish: Source-derived features, Recommended enhancements" the brief asks for, made structural. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce (the ten capabilities, quoted in §1); design spec §11 ("Each capability tagged `BRIEF`; anything I add beyond that list is `REC`"); tagging law `00-README.md` §Tag vocabulary | P0 |
| M09-02 | **The included boundary, carried from `DD7` without paraphrase: "Included in every tier: site check-in/out and visit logging (part of the core visit workflow)."** These three capabilities are available to **every employee of every tenant on every tier**, require no tracked seat, cost no add-on, and are never gated by plan, entitlement, role-tier or usage state. An EPC that never buys a single tracked seat has full check-in, check-out and visit-logging capability across its whole team, permanently. | `BRIEF` — *retired: PRD design note* §2 `DD7`, quoted verbatim; published commercially at `BM-23` (consumed, not restated) · the never-gate-features law is `DD5`/`BM-05` | P0 |
| M09-03 | **The tracked boundary, carried from `DD7` without paraphrase: "Per-seat bundle covers live location, route timeline, geofencing, movement history, activity playback."** Those five capabilities exist for an employee **only while the EPC Owner has tracking toggled on for that employee**. The list is closed: no sixth capability is added to the bundle by this document, and none of the five is available to an untracked employee in a reduced form, a preview, a sample or a trial state. | `BRIEF` — *retired: PRD design note* §2 `DD7`, quoted verbatim; published commercially at `BM-22` (consumed, not restated) | P0 |
| M09-04 | **The toggle is the billing switch, and `DD7` says which unit it moves: "Owner toggles tracking per employee; billed as tracked-seat-months in the usage ledger; per-seat price set per market book."** This module owns the toggle **as a product surface** — who may move it, what it says before it moves, what the employee sees afterwards (§M09.2). It owns none of the accounting: the usage ledger, the month-fraction arithmetic, the invoice line and the overage behaviour are `modules/M12-platform-billing.md`'s, and no figure, rate or proration rule appears in this document. | `BRIEF` — *retired: PRD design note* §2 `DD7`, quoted verbatim; `BM-22` (the meter), `BM-16` (the closed meter set), `BM-04`/`BM-06` (the sole seat-counting exception) consumed | P0 |
| M09-05 | **The boundary is closed in both directions, and where `DD7` is silent this document states its reading rather than assuming one.** `DD7` names five capabilities in the per-seat bundle and three in the included set. Three of the brief's ten are named in neither list: **attendance**, **team visibility**, and the **activity timeline** (`DD7` says "activity playback", the brief says "Activity timeline"). **Reading CONFIRMED as final (owner ruling 2026-08-04, Q38):** the per-seat bundle's list is closed (`M09-03`), and `DD5` forbids gating a *feature* by tier at all — so a capability outside that closed list is **included for every employee on every tier**. Attendance (§M09.5), team visibility (§M09.9) and the activity **timeline** — the ordered record of check-ins, check-outs, visits and logged activity — are **included free for every worker**; the paid seat is purely the GPS bundle: live location, route timeline, geofencing, movement history, activity **playback** (the map replay that can only be rendered from the location stream a tracked seat produces). The `DD7` boundary is closed exactly as this row read it. | `BRIEF` — *retired: PRD design note* §2 `DD7` (the two lists) read against `DD5` ("tiers gate capacity + usage counts + metered bundles, never features") and `BM-05`; the brief's ten (`docs/prd/owner-brief-2026-08-03.md` §Field-workforce); reading confirmed final per owner ruling 2026-08-04 (Q38) | P0 |
| M09-06 | **The studied category is read at capability level, and its surplus is excluded by name.** The brief's instruction is carried as a law of this module: *"We do NOT want to replicate TrackoBit… Do NOT copy unnecessary fleet-management features."* No surface, workflow or data object in this document is copied from a studied product; what is taken is the *question* each capability answers for an EPC. The capabilities the studied category carries that an EPC running rooftop solar has no use for are **excluded individually, with this row as their authority**, in §5 — they are non-goals with a stated rationale, not unbuilt backlog. Adding one is an owner ruling, not a local decision inside this module. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce, quoted; design spec §11 ("TrackoBit-informed but EPC-filtered… No fleet-management surplus"); exclusion mechanism per `DD2` (§5 rationale discipline) | P0 |
| M09-07 | **Every recommendation this suite makes here is labelled as one.** The brief asks for recommendations — *"Recommend additional field features if valuable"* — and the four this module makes (`M09-25`, `M09-33`, `M09-34`, `M09-63`) appear in their feature areas tagged `REC`, with their conditions attached, and in `registers/enhancements.md` with their rationale. A `REC` row is never phrased, tiered or tabled as though the brief asked for it, and none of the four is a dependency of any `BRIEF` row above or below it. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Recommend additional field features if valuable. Clearly distinguish: Source-derived features, Recommended enhancements"); `00-README.md` §Tag vocabulary; design spec §5, §11 | P0 |
| M09-08 | **This module holds no pipeline, no project state and no employee record.** A check-in does not move a lead's stage, a visit does not advance a project, and an attendance mark does not create or alter a person. What this module writes is the field record: presence, place, time and the visit it belongs to. Everything it touches belongs to a module that already owns it — the lead and the booking act to `modules/M02` (`M02-46`), the survey and its visit to `modules/M04`, the project and its site to `modules/M08`, the employee and the attendance register to `modules/M10-hr-lite.md` — and this module reads and reciprocates rather than duplicating. | `BRIEF` — module boundary per design spec §11; reciprocates `M02-46`, `M04-38`, `M08-41`, and the shared attendance surface design spec §11 assigns to `modules/M10` | P0 |
| M09-09 | **Nothing in this module scores a person.** There is no productivity score, no efficiency rating, no ranking of employees against each other, no league table and no target attainment on any field surface. The product reports **facts with their gaps stated** — where someone was, when they arrived, how long they stayed, what is not known — and leaves the judgement to the human being who manages them. This is not a stylistic preference: a score computed from location data of uneven quality (`M09-45`, `M09-46`) would be a confident-looking number built on honest ones, which `foundations/F8` §F8.1's precision-is-not-provenance principle forbids, and it is the specific thing the persona's own pain names — *"Being surveilled rather than supported"* (`PS-22`). | `BRIEF` — the EPC filter of `M09-06` applied to the studied category's scoring surfaces (excluded by name in §5); honesty law consumed from `SRC` `F8-01` (a number whose tier cannot be established is not rendered as a number) and `F8-04` (an aggregate inherits the weakest tier of its members); persona pain `PS-22` | P0 |

**Behavior detail.** These nine rows are the module's constitution and every later row is read
against them. `M09-02` and `M09-03` are the load-bearing pair: they are `DD7`'s own sentences, and
the reason they are quoted rather than summarised is that the boundary they draw is simultaneously
a product boundary and the only per-person price in the product. A reader who wants to know whether
a capability costs money looks at exactly those two rows and needs no other document — and a reader
who wants the money itself goes to `BM-22`/`BM-23`, which this document cites and never repeats.

`M09-05` is the row that exists because the spec is genuinely silent. Three of the brief's ten
capabilities are not in either of `DD7`'s lists, and the honest options were to guess, to leave them
unspecified, or to state a reading and refer the question. The third is what the suite does
elsewhere (`F8-21`'s Path-B reading, `M02-54`'s vocabulary mismatch) and is what this row does. The
reading chosen is the one that cannot silently create a charge: it puts the unplaced capabilities on
the free side, so an owner ruling that disagrees *adds* a commercial boundary deliberately rather
than discovering one that was assumed.

`M09-09` deserves its place in the constitution rather than in a feature area because the pressure
to add a score arrives from every direction once the data exists. The row is what a future reviewer
points at.

**Permissions.** None of these rows is a capability; they constrain every capability in
§F2.5-M09. The toggle of `M09-04` is `F2.M09.toggle-tracked-seat` (EPC Owner only).

**Edge cases & what-goes-wrong.**

- *A tenant on the smallest tier asks whether check-in is available to them* → yes, on every tier,
  for every employee, with no add-on (`M09-02`, `BM-23`).
- *A reader cites this module to justify showing a live position for an untracked employee* →
  refused by `M09-03`; the bundle is closed and has no reduced form.
- *Someone asks where attendance sits commercially* → `M09-05` states the adopted reading and names
  `Q38`; the answer is not invented and not hidden.
- *A studied product's fleet surface is proposed as "obviously needed"* → it is already answered:
  §5 names it, `M09-06` is its authority, and adding it is an owner ruling.
- *A dashboard request arrives for "field team efficiency %"* → refused by `M09-09`; the underlying
  facts are available and carry their gaps, and no score is computed from them.

**Acceptance criteria.**

- Given any tenant on any tier with zero tracked seats, when any employee checks in, checks out or
  logs a visit, then the action succeeds and no entitlement, plan state or usage line gates it
  (`M09-02`).
- Given an employee for whom tracking is toggled off, when any surface in this module renders,
  then no live position, route timeline, geofence, movement history or day playback exists for that
  employee in any form, including a preview or sample (`M09-03`).
- Given the tracking toggle, when it is moved, then the act is attributable to the EPC Owner and its
  billing unit is tracked-seat-months, with no figure computed in this module (`M09-04`).
- Given attendance, team visibility or the activity timeline, when a reader asks which side of the
  seat boundary they sit on, then this document states its adopted reading and names `Q38` as the
  question it did not answer (`M09-05`).
- Given any requirement in this module, when its tag is read, then it is `BRIEF` or `REC` — and
  every `REC` also appears in `registers/enhancements.md` (`M09-01`, `M09-07`).
- Given any capability the studied category carries that this module excludes, when a reader looks
  for it, then it appears in §5 as a named non-goal with `M09-06` as its authority and nowhere as a
  requirement (`M09-06`).
- Given any act recorded by this module, when it commits, then no lead stage, project stage, survey
  version or employee record is created or altered by it (`M09-08`).
- Given any field surface in the product, when it renders, then it contains no score, rating,
  ranking or league position for any person (`M09-09`).

**Localization notes.** The capability vocabulary a user sees — "check in", "check out", "visit",
"route", "attendance", "tracking" — is product vocabulary translated per `F3-01`, one term per
concept in every launch locale (`F3-11`); "tracking" in particular is translated once and used
identically on the Owner's toggle and on the employee's own indicator, because the two screens must
be recognisably about the same thing (`M09-13`). **Analytics events:** none for this area; it
defines laws, not acts.

### M09.2 — The tracked-seat lifecycle

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M09-10 | **Tracking is off for every employee until it is deliberately turned on.** A new employee, an invited employee and an employee whose role changes all start untracked. There is no default-on state, no tenant-wide "track everyone" setting that pre-answers the per-employee decision, and no automatic enablement derived from a preset, a team or a job type. | `BRIEF` — *retired: PRD design note* §2 `DD7` ("Owner toggles tracking **per employee**"), read with the privacy laws of *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope; the deny-default posture matches the suite's permission model (`F2-15` cited as the pattern — no implicit grant) | P0 |
| M09-11 | **Only the EPC Owner may move the toggle, and it is moved one person at a time.** The grant is `F2.M09.toggle-tracked-seat`, Owner-only for the same reason `F2.M01.manage-tenant-settings` is: it commits the tenant commercially (`BM-22`) and it is the act on which the market's privacy posture turns (§M09.10). Moving it is an audited event (`F2-22`). | `BRIEF` — *retired: PRD design note* §2 `DD7` ("**Owner** toggles tracking per employee") + *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope ("owner-toggled per employee"); grant placement per `F2-15` (no per-person exceptions) and the Owner-only precedent at `F2.M01.manage-tenant-settings`; audit per `SRC` `F2-22` | P0 |
| M09-12 | **Turning tracking on states, before it commits, that it starts a charge.** The confirmation names the person, names the five capabilities that become available for them (`M09-03`), and states plainly that this employee becomes a **tracked seat** billed as tracked-seat-months from this moment. It shows the tenant's current tracked-seat count before and after. It does **not** compute a price in this module: the surface reads the market book's per-seat price — presenting a draft value as draft (`M09-16`, owner ruling 2026-08-04 Q1/Q17) — and where a slot is empty it says so. | `BRIEF` — *retired: PRD design note* §2 `DD7` (billed as tracked-seat-months) via `BM-22`; the state-the-cost-before-the-commit obligation is the suite's honest-action law (`F8-33` — the tenant sees the same counts the product bills from — and `F8-34` consumed); book data per `BM-41`/`F1-25` | P0 |
| M09-13 | **The employee is told, on their own device, and can always see their tracking state.** Turning tracking on for a person notifies that person, and their own application carries a persistent, plainly worded statement of whether they are currently being tracked and during which hours — visible without hunting for it, from the surface they already use (`PS-23`'s home). Turning tracking off notifies them too. The state is never hidden, never abbreviated to an icon alone (`F7-12`), and never inferable only from the absence of something. | `BRIEF` — *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope (the third field-workforce privacy law, verbatim: "employee-visible tracking state"); restated as law at `M09-66`; label-plus-mark rendering per `SRC` `F7-12` | P0 |
| M09-14 | **Turning tracking off stops collection at once, and says what happens to what was already collected.** No further position, route, geofence event or movement record is produced for that employee from the moment the toggle moves. What was collected while they were tracked remains readable under the retention and rights rules of §M09.8 and §M09.10 — it is not deleted by the toggle, and the surface says so rather than letting a user assume either outcome. | `BRIEF` — *retired: PRD design note* §2 `DD7` (the toggle governs collection) + *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope (the privacy laws); retention and erasure via `SRC` `F1-23`/`F1-24` (`pack.data-rights`); honest-state law `F8-34` | P0 |
| M09-15 | **A tracked seat belongs to a person, never to a device, a role or a job.** Tracking does not follow a preset, is not granted by holding `F2.M09.field-visibility`, and is not attached to a phone that several people share. One person toggled on is one tracked seat, on whichever of their devices they are signed into. | `BRIEF` — *retired: PRD design note* §2 `DD7` ("per employee"); consistent with `SRC` `F2-15` (grants derive from held presets, and this is deliberately not a grant) and `BM-22` (the billing unit is the person) | P0 |
| M09-16 | **The per-seat price is market-book data, and the launch market's slot now carries the owner's draft value (owner ruling 2026-08-04, Q1/Q17).** The IN book records **≈₹99/seat/mo beyond the tier's included allowance — Starter 0 / Growth 3 / Pro 10 / Enterprise custom included seats** (`BM-41`, `F1-61`), every number **draft pending rate-card verification** (`BM-17`/`BM-26`). Until verification, the toggle surface presents the price as draft and the meter as not yet sellable — it never shows a zero, never shows another market's number converted (`F1-26`), never treats a draft as final, and never quietly enables an unbillable capability as though it were free. Where any market's slot is genuinely empty, the empty-state honesty rule stands unchanged. | `BRIEF` — `DD7`'s "per-seat price set per market book"; `BM-41`/`F1-61` (draft values + included-seat ladder per owner ruling 2026-08-04, Q1/Q17), `F1-26` (no FX-converted pricing); honest-state law `F8-33`/`F8-34` consumed | P0 |
| M09-17 | **A tracked seat that is exhausted, unpaid or suspended never silently degrades into a false picture.** Where the tenant's billing state restricts the capability, the tracked surfaces state which capability is unavailable and why, and the included capabilities of `M09-02` continue working unaffected — check-in, check-out and visit logging are never gated by billing state in any degree, and read and export always work (`BM-23`, the soft-block law of §04.5, `F1-24`(a)). What the product must never do is keep drawing a route timeline from a location stream it is no longer collecting. | `BRIEF` — `DD7`'s boundary under the suite's soft-block law (`BM-32` consumed, `04-business-model.md` §04.5); `SRC` `F1-24`(a) (read + export always work); `F8-34`/`F8-36` (honest state, honest failure) | P0 |

**Behavior detail.** The toggle is the whole lifecycle. It is one control, on one person's record,
held by one preset, and everything else in this area is a consequence of it being moved. It is
deliberately not a bulk operation: a screen that turns tracking on for twenty people in one gesture
turns a per-person privacy decision into a housekeeping task, and `DD7`'s wording — *per employee* —
is read as the decision it is. An owner with twenty field staff moves twenty toggles, is told the
count each time (`M09-12`), and each of those twenty people is told (`M09-13`).

The employee-side indicator of `M09-13` is the row this module would most easily get wrong by
building it well. It must be **legible and boring**: a plain statement on the home screen, in the
person's own language, saying whether tracking is on and during which hours — not a badge that
reads as a status symbol, not a pulsing dot, and not a setting they can appear to change but
cannot. Where they can see their own history (`M09-66`), the same surface is where they reach it.

The billing-state behaviour of `M09-17` follows the suite's existing shape rather than inventing
one: the soft-block law already says what happens when a tenant's money stops, and this module's
only addition is the specific dishonesty it must avoid — a route line drawn from a stream that has
stopped. When the stream stops, the timeline ends where the data ends and says so (`M09-45`).

**Permissions.** `F2.M09.toggle-tracked-seat` (EPC Owner). Reading one's *own* tracking state
requires no grant — it is a property of being the person tracked (`M09-13`, `M09-66`). Every toggle
movement is audit-covered per `F2-22`.

**Edge cases & what-goes-wrong.**

- *An owner turns tracking on for someone mid-month* → the confirmation states the count change and
  the billing unit; the arithmetic is `modules/M12`'s and no figure is computed here (`M09-12`,
  `M09-04`).
- *An owner turns tracking off mid-month* → collection stops immediately; the included capabilities
  continue unchanged; what to do with the partial month is `modules/M12`'s ledger question
  (`M09-14`, `BM-22`).
- *A tenant's tracked-seat count changes while a coordinator is looking at the team view* → the
  view re-renders honestly: a person who is no longer tracked shows no live position and states why
  (`M09-61`), never a frozen last position presented as current (`M09-48`).
- *A shared site phone is used by two technicians* → the seat follows the signed-in person, not the
  device; a second person signing in produces no second seat unless they are toggled on (`M09-15`).
- *The market's per-seat price is still draft* → the toggle presents the draft as draft and the
  meter as awaiting rate-card verification — never defaulted, never zero, never silently final
  (`M09-16`, owner ruling 2026-08-04 Q1/Q17).
- *An employee asks whether they are being tracked right now* → their own screen already answers it,
  without asking anyone (`M09-13`).

**Acceptance criteria.**

- Given a newly invited employee, when their record is opened, then tracking is off and nothing in
  their preset, team or job turned it on (`M09-10`).
- Given a user who is not the EPC Owner, when they open an employee's record, then no control that
  moves the tracking toggle is present or reachable (`M09-11`).
- Given the EPC Owner turning tracking on, when the confirmation renders, then it names the person,
  names the five capabilities, states that the person becomes a tracked seat billed as
  tracked-seat-months, and shows the tracked-seat count before and after (`M09-12`).
- Given tracking being turned on or off for a person, when the change commits, then that person is
  notified and their own application states their current tracking state and its hours (`M09-13`).
- Given tracking being turned off, when the toggle commits, then no further position, route,
  geofence or movement record is produced for that employee (`M09-14`).
- Given the IN book's draft per-tracked-seat price, when the toggle surface renders, then the
  draft value and the tier's included-seat allowance are presented as draft pending rate-card
  verification and never as a final sellable rate; and given a market book with no per-seat
  price at all, then the surface states that tracking is not yet priced and shows no number
  (`M09-16`, owner ruling 2026-08-04 Q1/Q17).
- Given two people signing into the same shared device, when their tracking states are read, then
  each state follows the person rather than the device, and a second tracked seat exists only if
  that second person is toggled on (`M09-15`).
- Given a tenant in a restricted billing state, when a field employee checks in, checks out or logs
  a visit, then the action succeeds unaffected (`M09-17`, `BM-23`).

**Localization notes.** The confirmation of `M09-12`, the notifications of `M09-13` and the
unpriced-market statement of `M09-16` are translated across the launch language set (`F3-01`,
`F3-06`) and render in each reader's own language — the Owner may read English while the employee
being tracked reads Marathi, and both strings exist. Counts render through the shared number
implementation (`F3-19`); the work-hours window renders on the tenant's timezone with the timezone
named (`F3-22`, `F1-10`). **Analytics events:** tracking toggled on (actor, target, resulting
tracked-seat count) · tracking toggled off (actor, target) · tracking-state notification delivered
to employee · unpriced-market state shown at the toggle.

### M09.3 — Site check-in and check-out

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M09-18 | **Check-in and check-out are available to every field employee, on every tier, with no tracked seat.** They are the included half of `DD7` (`M09-02`) and the core of the visit workflow: the act by which a person says *I am here* and *I am done here*. No plan state, entitlement, add-on or usage counter gates either one. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Site check-in, Site check-out"); boundary per *retired: PRD design note* §2 `DD7`, published at `BM-23` | P0 |
| M09-19 | **A check-in records four facts and a check-out records five.** Check-in: **who**, **which site or visit**, **when** (the capture time, `F4-19`), and **where** — the device's position at that moment with its accuracy, where a fix is available. Check-out records the same four plus the **elapsed time on site**, computed from the two capture times and shown as what it is. Nothing else is required to check in: no form, no photo, no note, no manager approval. A note or a photo may be attached, and neither is a condition of the act. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce (site check-in / check-out as capabilities); capture-time semantics consumed from `SRC` `F4-19`; position provenance per `M09-22` | P0 |
| M09-21 | **A check-in with no position fix is still a check-in, and the product says the position is unknown rather than inventing one.** Where the device cannot obtain a position — indoors, in a basement, in a dense urban canyon, with location services unavailable — the check-in is recorded with who, which site and when, and the position field reads **"location unavailable"**. It is never filled from the site's own coordinates, never from the last known position, never from a network-derived guess presented as a fix, and never left blank in a way that reads as a location of zero. | `BRIEF` — the honest-capture obligation applied to this module's core act; consumed from `SRC` `F8-01` (a number whose tier cannot be established is not rendered as a number — the surface shows what is missing instead), `F8-35` (never a silent no-op), `F8-36` (honest failure) | P0 |
| M09-22 | **A check-in position is `measured`, and it carries its accuracy.** The four provenance tiers are closed and `measured` is defined as *"(on site)"* — which is literally what a satellite fix taken by a person standing on the site is, and this module is the one place in the suite where the tier's definition and the act coincide exactly. The fix carries its **accuracy radius** and is rendered as an area rather than a point where the radius is wide; a low-accuracy fix is shown as a low-accuracy fix, never rounded up into a confident dot (`foundations/F8` §F8.1: precision is not provenance). | `BRIEF` — tier assignment for a `BRIEF` capability, consuming `SRC` `F8-02` (the four tiers, `measured` = on site), `F8-01` (every user-visible number carries a tier, and one whose tier cannot be established is not rendered as a number), `F8-07` (the label renders beside the number, never hover-only) | P0 |
| M09-23 | **Where the employee is tracked and the site is geofenced, arriving offers the check-in on the same control the person already uses.** The geofence-driven prompt is a convenience of the tracked bundle and changes nothing about the act itself — the person still taps and the record still says who and when. **The never-acts law is `M09-51`'s and is not restated here:** whether a prompt may write a record is decided there, once, for every geofence surface. This row states only what is specific to the check-in surface — that the prompt lands on the route screen's existing check-in control rather than a screen of its own, and that an untracked employee checks in the same way, from the same screen, without the prompt (`M09-53`). | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Geo-fencing"); *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope (verbatim: "auto check-in prompts"); the never-acts law is `M09-51`'s and is cited, not restated, here | P1 |
| M09-24 | **An open check-in is never closed by the product with a time the product invented.** Where a person checks in and no check-out follows, the record surfaces as **still checked in** with the elapsed time running and stated. Past the end of the tenant's declared work-hours window it surfaces to the person and their coordinator as an **open check-in needing a check-out**, and it is closed by a human — the person, or their coordinator with the correction attributed to them (`M09-38`'s append rule applied). No automatic close-out time is written, and no default duration is assumed. | `BRIEF` — the honest-record obligation applied to the check-out gap; consumed from `SRC` `F8-01`/`F8-34` (state what is true; never render a fabricated value) and `F2-22` (the correction is audited); the work-hours window is `M09-44`'s | P0 |
| M09-25 | **`REC` — lone-worker safety escalation.** An open check-in that passes a tenant-set duration on a site raises an escalation to the person's coordinator: *"Ravi has been checked in at Sharma residence for 4 h 20 m and has not checked out."* The escalation is a notification, not an alarm, and never a location disclosure for an untracked employee beyond the check-in the person themselves made. | `REC` — beyond the brief's ten capabilities; mirrored in `registers/enhancements.md` with rationale and conditions. Not source truth and not brief scope | P2 |

**Behavior detail.** Check-in is the smallest act in the module and gets the strongest guarantees,
because it is the one thing that must work in sunlight, with one hand, in under two seconds. The
screen is the technician's route (`PS-23`): the current stop carries the check-in control, and
after check-in the same place carries the check-out control with the elapsed time visible. There is
no separate check-in screen to navigate to and no confirmation step to dismiss — the record is
written and the row changes state.

The position is captured **at the moment of the tap**, not fetched afterwards and not refined in
the background into a better answer that contradicts what the person was shown. If the fix is poor,
the record says the fix was poor (`M09-22`); if there is no fix, the record says there is no fix
(`M09-21`). This is the module's first meeting with its own honesty problem: a check-in's location
is the fact most likely to be argued about later, and the product's value in that argument comes
entirely from never having overstated it. A check-in with "location unavailable" that a technician
made at the right place at the right time is worth more than a confident coordinate the product
guessed.

Elapsed time is arithmetic over two capture times and inherits their honesty: where either capture
time is in doubt it is still shown, because it is what the field user means by "when" (`F4-19`), and
it still orders nothing.

**Permissions.** `F2.M09.check-in-out` — held by the field-facing presets (EPC Owner, Sales Manager,
Sales Executive, Survey Engineer, Project Manager, Field Technician, Installation Team Member,
Operations). Reading someone *else's* check-ins rides
`F2.M09.field-visibility`, or the record's own scope where the check-in belongs to a visit on a lead
or project the reader can already open (`M09-60`). No check-in surface reachable by the Installation
Team Member preset carries a commercial figure (`F2-06`, `M08-43`).

**Edge cases & what-goes-wrong.**

- *No position fix at the moment of check-in* → recorded as "location unavailable", never guessed
  (`M09-21`).
- *A wide, imprecise fix* → shown as an area with its accuracy, not as a point (`M09-22`).
- *A person checks in and forgets to check out* → the record stays open, states it, and is closed by
  a human with the correction attributed (`M09-24`).
- *A device clock is wrong, or has been changed* → capture time is still shown as what the person
  meant by "when", and it decides nothing; the server's apply order resolves everything (`F4-19`).
- *A check-in request is retried after a dropped connection* → one record results; a retried
  capture never duplicates and never silently drops (`F4-07` consumed).
- *A person checks in at the wrong site* → they check out and check in again at the right one; both
  records survive, because the record of a mistake is still a record (`F4-17`'s forward-only rule
  and the suite's never-delete posture).

**Acceptance criteria.**

- Given a check-in, when its record is read, then it carries who, which site or visit, the capture
  time, and either a position with its accuracy or the words "location unavailable" (`M09-19`,
  `M09-21`).
- Given a check-in position, when it is rendered anywhere in the product, then it carries the
  `measured` tier and its accuracy, and a wide fix renders as an area rather than a point (`M09-22`).
- Given a write that would move a visit's status backwards, when it reaches the server, then it is
  refused (`F4-17`).
- Given a check-in with no check-out, when the work-hours window ends, then the record surfaces as
  an open check-in to the person and their coordinator and no close-out time is written by the
  product (`M09-24`).
- Given a tracked employee arriving at a geofenced site, when the prompt is raised, then it lands on
  the route screen's existing check-in control rather than a screen of its own, and whether it may
  write anything is `M09-51`'s law rather than this row's (`M09-23`).
- Given a tenant with zero tracked seats, when any field employee checks in, then the act succeeds
  and no capability of `M09-03` becomes available as a side effect (`M09-18`, `M09-03`).

**Localization notes.** "Checked in", "checked out", "still checked in" and "location unavailable"
are fixed product strings translated once across the launch language set (`F3-01`, `F3-07`) and
rendered in the field user's own language; elapsed durations render through the shared duration
implementation on the tenant's timezone (`F3-19`, `F3-22`, `F1-10`). No error code, entity name or
identifier ever reaches a field user on these screens (`F7-42`). **Analytics events:** check-in
recorded (site, with-fix / no-fix) · check-out recorded (elapsed bucket) · check-in
made from a geofence prompt vs unprompted · open check-in surfaced · open check-in closed by a
person (self / coordinator).

### M09.4 — Visit tracking

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M09-26 | **A visit is a planned stop: a place, a window, a person assigned to it, and a reason it exists.** Visit logging is included for every employee on every tier (`M09-02`, `BM-23`). This module owns the **field-side visit** — the stop on someone's day, its check-in/out, its outcome and its place on the timeline. It does **not** own the objects other modules already own, and the distinction is stated because two published documents describe visits from two sides: a **survey visit** is `modules/M04`'s object with its own states and capture flow (`M04-38`, `M02-46`), and it *appears here* as a stop on the surveyor's day; `foundations/F4`'s conflict-policy note (`F4-17`) assigns the general visit object and its states to this module. **Adopted reading, stated as a choice:** the two are compatible because they are different objects — every survey visit is a field stop, not every field stop is a survey visit — and neither document is edited to say so. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Visit tracking"); boundary per `BM-23`/`DD7`; the object split reconciles `SRC` `F4-17`'s shared note with `M04-38`/`M02-46` and is disclosed in-row per design spec §3.5 | P0 |
| M09-27 | **Planned and actual are shown side by side, as facts, with the difference stated and never scored.** A visit carries its planned place and window beside its actual arrival and departure (from the check-in and check-out of §M09.3), and the difference between them is rendered as a plain difference — *"arrived 40 min after the window"* — with no rating, no colour-only judgement (`F7-12`), no lateness score and no roll-up into a person's record (`M09-09`). Where either side is unknown, the unknown side says so rather than defaulting to the other. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Visit tracking"); the no-score law is `M09-09`; missing-value rendering consumed from `SRC` `F8-01` | P0 |
| M09-28 | **A site visit booked from a lead becomes a stop on the assigned person's day, and its field facts travel back to the lead.** `modules/M02` owns the booking act — date, time, surveyor, confirmed address (`M02-46`) — and this module reciprocates: the booked visit appears on the assigned person's route, its check-in and check-out are made here, and the arrival, departure and outcome are readable on the lead's own visit record by whoever can already open that lead. No lead stage is moved by any act in this module (`M09-08`). | `BRIEF` — the field half of `SRC` `M02-46`'s visit (the booking act and the lead-side record stay `modules/M02`'s); scoping per `SRC` `F2-12`/`D20` — the visit facts ride the lead's scope, not the field-work domain (`M09-60`) | P0 |
| M09-29 | **A survey visit is a field visit, and this module adds only what `modules/M04` does not own.** The Survey Engineer's home is `modules/M04`'s visits-today screen (`M04-38`), and their capture flow, survey versions and deliverable are `modules/M04`'s. What this module contributes to that same day is the check-in/out record, the visit's place on the activity timeline, and — where the Owner has toggled the surveyor on — the tracked capabilities of `M09-03`. Nothing in `modules/M04` is restated, re-tiered or re-scoped here. | `BRIEF` — the field-workforce half of the surveyor's day; consumes `SRC` `M04-38`, `M04-32` (the visit's agenda) by published ID | P0 |
| M09-30 | **A project site is a stop, and the project owns everything about it except the presence record.** Visits to a `modules/M08` project site — a delivery, a check, an installation day — appear on the assigned person's route and produce check-in/out records here; the project's stage, blockers, documents, checklist and money are `modules/M08`'s and appear nowhere in this module (`M08-01`'s closed surface set is not widened by this document). The project site is also the anchor a geofence attaches to (§M09.7). | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce (visit tracking over the work an EPC actually does); consumes `SRC` `M08-01` (the closed surface set), `M08-41`/`M08-45` (the installation surfaces stay M08's) by published ID | P0 |
| M09-31 | **A visit ends in one of three outcomes, and status only moves forward:** **completed** · **could not complete**, with a reason recorded · **rescheduled**, which creates the next visit and leaves this one closed with its history. The reason on a could-not-complete is mandatory and free-text-plus-reason-class where the source module already has a vocabulary for it (`modules/M04`'s could-not-complete on the doorstep, `S4.wrong.9` via `M04`'s reschedule). Status never regresses; a write that would move it backwards is refused (`F4-17`). | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Visit tracking"); forward-only semantics consumed from `SRC` `F4-17`; the survey-side reschedule vocabulary stays `modules/M04`'s (`F2.M04.schedule-survey-visits`, cited) | P0 |
| M09-32 | **An unplanned stop can be logged where it happened, without a plan to attach it to.** A field employee who visits a site nobody booked — a callback, an urgent check, a delivery diverted en route — logs the stop from their route with a place, a reason and their check-in/out, and it takes its place on the timeline as a stop that was not planned. It is marked as unplanned; it is not silently turned into a planned visit after the fact, and it does not create a lead, a project or a survey. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Visit tracking", "Activity timeline"); module boundary per `M09-08` | P1 |
| M09-33 | **`REC` — day-order optimisation for a route.** Ordering a day's assigned stops by geography and window, offered as a suggested order the person may accept or ignore, rather than the arrival-order-of-booking the route carries today. | `REC` — beyond the brief's ten capabilities; mirrored in `registers/enhancements.md` with rationale and conditions. Not source truth and not brief scope | P2 |
| M09-34 | **`REC` — customer-facing arrival window on the customer link.** Surfacing "your technician is on the way, arriving within the hour" on the existing no-login customer link (`foundations/F5`), derived from the assigned visit rather than from a live position. | `REC` — beyond the brief's ten capabilities; mirrored in `registers/enhancements.md` with rationale and conditions, including that it discloses field data on a customer surface and that register `Q33` (the customer send channel) is not answered by it. Not source truth and not brief scope | P2 |

**Behavior detail.** The visit is where this module meets the rest of the product, and the design
rule is that it **adds a lens, never a second copy**. A booked survey visit exists once: `M02`
created it, `M04` owns what happens on it, and this module renders it as a stop with a presence
record attached. A reader who wants to know what the surveyor found opens the survey; a reader who
wants to know whether anyone turned up opens the visit. That split is why `M09-26` states the
object reading explicitly rather than leaving two published documents looking like they disagree.

Planned-versus-actual is the capability an EPC owner actually wants from "visit tracking", and it
is also the capability most easily turned into a surveillance surface. `M09-27` renders the
difference and stops: a visit that ran two hours over might be a technician who is slow or a job
that was worse than the booking assumed, and the product does not know which. Stating the fact
serves the coordinator; scoring it would be the product pretending to know something it does not
(`M09-09`, `F8-01`).

Unplanned stops (`M09-32`) exist because the alternative is a timeline that quietly lies by
omission. A day with three booked visits and two unbooked ones is a five-stop day, and a product
that can only represent the booked three would make its own timeline the least accurate record of
the day in the company.

**Permissions.** `F2.M09.check-in-out` covers logging a visit and its outcome. Reading another
person's visits rides `F2.M09.field-visibility`; reading the visit facts attached to a **lead** or
**project** rides that record's own scope (`F2.M02.lead-visibility`, `F2.M08.project-visibility`) —
which is what lets a Sales Manager see whether the surveyor arrived at their team's lead without
holding any field-work scope (`M09-60`). Scheduling and reassigning survey visits stays
`F2.M04.schedule-survey-visits`; booking from a lead stays `F2.M02.book-site-visit`. This module
adds neither.

**Edge cases & what-goes-wrong.**

- *A visit is booked for a person who is not tracked* → everything in this area works; only the
  tracked capabilities of `M09-03` are absent (`M09-18`).
- *A surveyor cannot complete a visit on the doorstep* → the could-not-complete reason is recorded
  and the reschedule is `modules/M04`'s flow (`M09-31`, `S4.wrong.9` cited).
- *A visit's planned window is missing* → the actual is shown alone and the planned side states it
  is not set; no window is inferred from the booking time (`M09-27`, `F8-01`).
- *A person visits a site twice in one day* → two stops, two presence records, both on the timeline;
  neither overwrites the other (`F4-17`).
- *A stop is logged for a site that turns out to be the wrong address* → the record survives with
  its correction appended; the site's own address correction is `modules/M04`'s (`M04-12`).
- *Someone asks for the visit to close the lead or advance the project* → refused by `M09-08`; the
  stage machines belong to `modules/M02` and `modules/M08`.
- *A rescheduled visit's original is deleted* → does not happen; rescheduling closes the original
  with its history and creates the next one (`M09-31`).

**Acceptance criteria.**

- Given a site visit booked from a lead, when the assigned person opens their route, then the visit
  is present as a stop, and when they check in and out, then those facts are readable on the lead's
  visit record by anyone who can open that lead (`M09-28`).
- Given a survey visit, when it is read in this module, then it renders as a stop with its presence
  record and no survey content, version or capture surface is duplicated here (`M09-29`).
- Given a visit with a planned window and an actual arrival, when it renders, then both are shown
  and the difference is stated as a difference, with no rating, score or ranking (`M09-27`,
  `M09-09`).
- Given a visit marked could-not-complete, when it is saved, then a reason is present and the save
  is refused without one (`M09-31`).
- Given a write that would regress a visit's status, when it reaches the server, then it is refused
  (`M09-31`, `F4-17`).
- Given a survey visit and an ad-hoc field stop, when each is read, then the survey visit resolves
  to `modules/M04`'s object with its own states and capture flow and the field stop to this module's,
  and neither document is contradicted (`M09-26`).
- Given a visit to a project site, when it is completed here, then a presence record exists and no
  project stage, blocker, document or checklist state was written (`M09-30`, `M09-08`).
- Given an unplanned stop, when it is logged, then it appears on the timeline marked as unplanned
  and no lead, project or survey is created by it (`M09-32`).

**Localization notes.** Visit outcome vocabulary — "completed", "could not complete", "rescheduled",
"unplanned" — is fixed product vocabulary translated once (`F3-01`, `F3-11`); the planned-versus-
actual difference is a formatted duration through the shared implementation, never a hand-built
string (`F3-19`, `F3-22`). Addresses are customer and site data and render as entered, never re-formatted by the product.
**Analytics events:** visit stop opened · visit outcome recorded (outcome, reason class) · unplanned
stop logged · planned-vs-actual difference rendered (bucket) · visit facts read from a lead or
project record.

### M09.5 — Attendance

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M09-35 | **Attendance is the day the employee actually worked: one day start and one day end per person per day, marked by that person.** It is a `BRIEF` capability of this module and, under the adopted reading of `M09-05`, it is **included for every employee on every tier** and requires no tracked seat. It is deliberately the lightest possible record — two marks and the day they belong to — because the brief asks for attendance in a field-workforce module and the SME HR weight limit is `modules/M10`'s law (design spec §11). | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Attendance"); boundary reading per `M09-05` and register `Q38`; SME-weight constraint per design spec §11 (`modules/M10`) | P0 |
| M09-37 | **A first check-in of the day may propose the day start; it never writes it silently.** Where a person's first check-in of a day happens before they have marked a day start, the product **offers** the day start with that capture time pre-filled, and the person confirms. It is a proposal, not a derivation: nothing writes an attendance record without the person's act, and no attendance record ever appears by itself. | `BRIEF` — the honest-derivation obligation applied to the attendance/check-in relationship; consumed from `SRC` `F8-01`/`F8-34` (never present an inferred value as a recorded one), `F4-19` (capture time is display and audit) | P0 |
| M09-38 | **An attendance record is corrected by appending, never by silent edit.** A correction — a wrong day start, a missing day end, a record marked on the wrong day — is a new entry carrying the corrected value, a **mandatory reason**, its author and its time; the original stays readable. Every correction is an audited event (`F2-22`), and a correction made by someone other than the person it concerns is attributed to the person who made it and visible to the person it concerns. | `BRIEF` — the append-not-overwrite discipline of this suite applied to attendance; consumed from `SRC` `F2-22` (audit coverage), `M11-40`-class append-only reasoning cited as the pattern (`DOC04.payments-append-only`, `modules/M11`), `F4-16` (a lost concurrent edit is always recoverable from the log) | P0 |
| M09-39 | **Absence is never inferred.** No attendance record for a day means **no record for that day** — it does not mean absent, off, on leave or unaccounted for, and no surface in this module renders it as any of those. Whether a person was absent is a fact `modules/M10` holds (leave, holiday, roster), and this module's attendance surface shows what it has and names what it does not (`F8-01`). A blank is not a verdict. | `BRIEF` — the strongest honesty consequence in this area; consumed from `SRC` `F8-01` (a value whose tier cannot be established is not rendered as one — the surface shows what is missing instead), `F8-34` (honest state); the absence facts belong to `modules/M10` per design spec §11 | P0 |
| M09-40 | **Attendance is a shared surface with `modules/M10-hr-lite.md`, and this module owns the field half only.** What this document owns: the field capture of a day start and a day end, its correction rule and its provenance. What it does not own and does not specify: leave, holidays, rosters, shift patterns, payroll consequences, the attendance register as an HR artefact, or any policy about what a pattern of days means. Those are `modules/M10`'s (design spec §11: *"attendance/leave surfaces shared with M09"*), authored separately, and this module states the hand-off rather than pre-empting it. | `BRIEF` — *retired: PRD design note* §11 (M10 scope: "attendance/leave surfaces shared with M09"); `docs/prd/owner-brief-2026-08-03.md` §HR ("lightweight… Avoid enterprise HR complexity unless justified") | P0 |
| M09-41 | **HR/Admin reads attendance and nothing else in this module.** The HR/Admin preset holds `F2.M09.attendance-visibility` at tenant scope and holds **no** field-work visibility: no live position, no route timeline, no movement history, no geofence event and no day playback is reachable by that preset from any surface. The people-records domain proper is `modules/M10`'s to define (Task 23); this row is deliberately the narrow attendance slice so that document can add the rest without re-ruling it. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §HR + §Field-workforce read together; domain independence per `SRC` `F2-14` (holding a wide scope in one domain never widens another); `F2-15` (no per-person exceptions) | P0 |
| M09-71 | **A day start or a day end is recorded only once the server has it.** The mark is the person's own act (`M09-35`, `M09-37`); until the server confirms it the surface shows it **pending, never as recorded** — no optimistic tick, and no local clock time presented as a record fact. A failure says so plainly and the mark is not lost from the screen (`F8-36`). This binds harder here than anywhere else in the product: attendance is read as a judgement about a person and feeds `modules/M10-hr-lite.md`'s register (`M10-23`), so a mark that *looks* recorded and is not is a wrong answer about someone's day. The time shown is the time the server recorded, which is what makes it an untiered record fact under `F8`'s date rule (register `Q59`) — a pending mark is not yet a record and cannot be shown as one. | `SRC` — restores the law of `M09-36`, deleted 2026-08-07 with the offline capability and re-instated by owner ruling 2026-08-15 (register `Q64`); instance of `F8-36`; consumed by `modules/M10-hr-lite.md` per `M10-23`'s shared-surface split | P0 |

**Behavior detail.** Attendance is two taps a day and the product should never make it more. The
day-start mark sits on the technician's home (`PS-23`) above the first stop; the day-end mark
replaces it once the day has started. The persona's own goal is the acceptance test — *"Be counted
as present for the day they actually worked, without paperwork"* (`PS-22`) — and every addition to
this surface should be measured against it.

*Two paragraphs removed 2026-08-07 by owner decision: they set out the attendance side of the
offline boundary, which was deleted with the offline/sync capability. `M09-37`'s own rule — the
day start is offered and never written by the product — is unchanged.*

`M09-39` is the row a reviewer should be hardest on. Attendance data is the data most likely to be
read as a judgement about a person, and the single most damaging thing this product could do is
render a blank cell in a way that means "absent". It renders "no record", and the reason it can do
that safely is `M09-40`: somebody else — `modules/M10` — owns the facts that turn no-record into a
meaning.

**Permissions.** `F2.M09.mark-attendance` (own day start and day end — held by every preset, because
attendance is a property of being an employee rather than of doing field work) and
`F2.M09.attendance-visibility` (reading others' attendance: EPC Owner all · Sales Manager team ·
Project Manager their projects' field workers · HR/Admin all · Operations team). Corrections are
audit-covered per `F2-22`.

**Edge cases & what-goes-wrong.**

- *A person checks in before marking a day start* → the day start is offered with that capture time,
  and it is written when they confirm (`M09-37`).
- *A person forgets to mark a day end* → the day has a start and no end; the record says exactly
  that, and no end time is invented (`M09-39`, `M09-24`'s sibling rule for check-ins).
- *A coordinator corrects someone's attendance* → an append with a mandatory reason, attributed to
  the coordinator, visible to the person, audited (`M09-38`, `F2-22`).
- *A device clock is wrong* → the capture time is shown as what the person meant and orders nothing;
  the server decides apply order (`F4-19`).
- *A blank day in a month view* → renders as "no record", never as absent, off or on leave
  (`M09-39`).
- *Someone asks this module for leave balances or a shift roster* → not here; `modules/M10` owns
  them and this module states the hand-off (`M09-40`).
- *HR asks to see where a person was* → refused: HR/Admin holds attendance and no field-work scope
  (`M09-41`, `F2-14`).

**Acceptance criteria.**

- Given an employee on any tier with no tracked seat, when they mark a day start and a day end, then
  both succeed and no capability of `M09-03` becomes available (`M09-35`).
- Given a first check-in of the day made before any day start, when it is recorded, then the day
  start is **offered** with that capture time and no attendance record exists until the person
  confirms it (`M09-37`).
- Given a correction to an attendance record, when it is saved, then it carries a reason and an
  author, the original remains readable, and the event appears in the audit log (`M09-38`, `F2-22`).
- Given a day with no attendance record, when it renders on any surface in this module, then it
  reads as "no record" and never as absent, off or on leave (`M09-39`).
- Given leave, a holiday, a roster, a shift pattern or a payroll consequence, when it is looked for
  in this module, then it is absent and the hand-off to `modules/M10-hr-lite.md` is stated
  (`M09-40`).
- Given a user holding only the HR/Admin preset, when they open any surface in this module, then
  attendance is reachable and no position, route, movement, geofence or playback is (`M09-41`).
- Given a day start or a day end marked by the person, when the mark is made, then it renders as
  pending and never as recorded until the server confirms it, and no local clock time is shown as
  a record fact (`M09-71`, `F8-36`, owner ruling 2026-08-15 `Q64`).
- Given a mark the server refuses or cannot reach, when the failure returns, then it is stated
  plainly, the mark stays on screen, and no attendance record exists (`M09-71`, `F8-36`).
- Given a confirmed mark, when its time renders, then it is the time the server recorded and it
  carries no provenance tier, as a record fact under the `Q59` date rule (`M09-71`, `F8-02`).

**Localization notes.** "Day start", "day end" and "no record" are fixed
product strings translated once across the launch language set (`F3-01`, `F3-07`) — "no record" in
particular must be translated as an absence of data and never as a word that reads as *absent* in
any launch language, which is a translation-review obligation, not a developer's choice (`F3-11`).
Dates and times render through the shared implementation on the tenant's timezone with the day
boundary that timezone implies (`F3-22`, `F1-10`). **Analytics events:** day start marked · day end
marked · day start offered from a check-in (accepted / declined) · attendance
correction appended (self / coordinator) · attendance read by HR.

### M09.6 — Live location and route timeline

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M09-42 | **Live location exists only for a tracked seat, and only inside the ruled tracking window — the worker's day-start → day-end marks, bounded by the tenant's force-stop hour (`M09-44`, owner ruling 2026-08-04 Q39).** Both conditions are necessary and neither is sufficient alone: an untracked employee has no live location at any hour (`M09-03`), and a tracked employee has none outside the window (`M09-64`). There is no manual override that collects a position outside the window, no "just this once" control, and no surface that requests a position from a device that is not currently inside both conditions. | `BRIEF` — *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope (the first field-workforce privacy law, verbatim: "tracking only during work hours") + *retired: PRD design note* §2 `DD7` (live location is per-seat); window concretized per owner ruling 2026-08-04 (Q39); restated as law at `M09-64` | P0 |
| M09-43 | **Live location answers two questions and the product says which: "who is nearest" and "is the day going to plan".** The surface is a map of the tracked people currently working, each with their current stop, their next stop and the time of their last position. It is a **coordination** surface, and it is designed to read as one to the person being located as well as the person looking — which is the persona's own stated pain (`PS-22`: *"Being surveilled rather than supported"*). | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Live location", "Team visibility"); purpose framing consumed from `PS-22` (the persona's pains, `BRIEF`) | P0 |
| M09-44 | **The tracking window is concretized (owner ruling 2026-08-04, Q39): collection runs from the worker's own day-start tap to their day-end tap, worker-controlled, with a tenant force-stop backstop — default 20:00, owner-set — and no attendance means no tracking that day.** The window is never inferred from behaviour: the product never derives it from when a person usually works, never extends it because someone is still checked in past the force-stop (collection stops; the open check-in surfaces per `M09-24`), and never starts it without the person's own day-start mark. The force-stop hour renders on the tenant's timezone with the timezone named (`F1-10`, `F3-22`); the employee sees their live tracking state and its bounds on their own device — the **always-visible tracking indicator** (`M09-13`). Where a market's `pack.data-rights` determination sets a stricter rule, the pack wins (`M09-67`). The definition lives here: v1 ships no per-employee shift patterns (`M10-29`), so the tenant-wide force-stop plus worker-controlled marks is the whole law. | `BRIEF` — *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope; window concretized (day-start→day-end + owner-set force-stop, default 20:00) per owner ruling 2026-08-04 (Q39); market override per `SRC` `F1-23`/`F1-12` | P0 |
| M09-45 | **A gap in the location record is shown as a gap, and is never interpolated, smoothed or bridged.** Where a device was off, out of signal, out of battery, had location services disabled, or was outside the work-hours window, the route timeline shows a **break with its duration and, where known, its reason** — not a straight line between the two known points and not a curve fitted through them. A route drawn across an unknown interval would be the product asserting a path nobody observed. | `BRIEF` — the honesty law applied to this module's most tempting surface; consumed from `SRC` `F8-01` (a value whose tier cannot be established is not rendered as one — the surface shows what is missing instead), `F8-07` (the qualifying label renders beside the value, never hover-only) | P0 |
| M09-46 | **A position is `measured`, carries its accuracy, and a low-accuracy fix is never rendered as a confident one.** The tier vocabulary is closed and `measured` is *"(on site)"* — which a satellite fix taken where the person is standing satisfies literally, and this module notes the alignment rather than stretching the definition. Every position carries its accuracy radius; a wide fix renders as an area, a stale fix renders with the age of the fix beside it, and neither is upgraded by being drawn on a map. | `BRIEF` — tier assignment for a `BRIEF` capability, consuming `SRC` `F8-02` (the four tiers), `F8-01`, `F8-07` (the qualifying label renders beside the value, never hover-only), `F8-18` (a stale output says so where it is read) | P0 |
| M09-47 | **Location ingestion for a tracked seat is covered by the seat, and there is no second meter.** Continuous position ingestion, processing and retention for tracked seats are inside the per-seat price (`BM-22`), and the ingestion of the **included** capabilities — the position on a check-in, on a check-out, on a logged visit — is an absorbed cost that is never metered to the tenant (`BM-24`). No surface in this module shows a usage counter, an allowance or an overage for location. | `BRIEF` — *retired: PRD design note* §2 `DD7` (ingestion inside the seat price) via `BM-22`; the absorbed half via `BM-24`; the closed meter set is `BM-16`'s | P0 |
| M09-48 | **A device that cannot reach the server has no live position, and the product says "last known" rather than showing a stale point as current.** A live position that cannot reach the server is not a live fact. The team view renders the person's **last known position with the time it was taken**, plainly labelled, and never a position that is presented — by omission, by styling or by a moving marker — as where they are now. | `BRIEF` — the honest-state obligation applied to a live surface; consumed from `SRC` `F8-18` (a stale output says so where it is read), `F8-34` (a message about state describes the actual state) | P0 |

**Behavior detail.** The route timeline is the day rendered as a sequence: stops with their
check-in/out, travel between them, and breaks where the record has nothing. It is built from the
same events as the activity timeline (§M09.8) plus the position stream that only a tracked seat
produces, which is why it sits in the bundle and the activity timeline does not (`M09-05`).

The design constraint that shapes every surface here is `M09-45`. Location data from phones carried
by people working on rooftops, in basements and in vehicles is **structurally gappy**, and every
mapping library in existence will happily draw a smooth line through the gaps. The product does
not: it renders what was observed and marks what was not. A coordinator who sees a 40-minute break
in a timeline learns something true; a coordinator who sees a confident line across a road the
person never drove learns something false and cannot tell the difference.

The two-questions framing of `M09-43` is a product decision with a UX consequence. The live map's
default state is the **team's current stops**, not a set of moving dots — the dots are available,
and they are not the front door. That choice is what makes the same screen legible to the person on
it, and it is the one the persona's pain asks for.

**Permissions.** `F2.M09.view-live-location` — a **narrowing** of `F2.M09.field-visibility`, never a
widening: a viewer needs the field scope covering that person *and* this row to see a live position,
route timeline or movement history. Reading one's own requires no grant (`M09-66`). Every read of
another person's location is audit-covered per `F2-22` (`M09-70`).

**Edge cases & what-goes-wrong.**

- *A tracked person's phone loses signal for an hour* → last known position with its time; the
  timeline shows a break of that length when the stream resumes (`M09-48`, `M09-45`).
- *A tracked person's battery dies mid-afternoon* → the same: a break with its duration, and no
  inferred path (`M09-45`; the persona pain `PS-22` names this as normal).
- *A person disables location services on their device* → live position is unavailable and the
  surface says so; the included capabilities continue working (`M09-21`, `M09-48`).
- *A fix arrives with a 500-metre accuracy radius* → rendered as an area with its accuracy, never as
  a point on a building (`M09-46`).
- *A coordinator asks to see where someone is after hours* → nothing is collected outside the
  window, so there is nothing to show, and the surface says that rather than showing the last
  in-window position as though it were current (`M09-42`, `M09-48`).
- *An owner asks for a "distance travelled today" figure* → not in this module; distance across
  gapped positions would be a confident number over an honest one (`M09-45`, `M09-09`; §5).
- *A tenant asks to widen the work-hours window during a crisis* → the owner may move the
  force-stop hour, which changes it for the future and tells the employees; the worker's own
  day-start/day-end marks still bound collection, and nothing retroactively produces data for
  hours that were never collected (`M09-44`, `M09-13`; owner ruling 2026-08-04 Q39).

**Acceptance criteria.**

- Given an employee for whom tracking is off, when any live-location or route-timeline surface is
  opened, then that employee is absent from it entirely, with no placeholder position (`M09-42`,
  `M09-03`).
- Given a tracked employee outside the declared work-hours window, when the live map renders, then
  no position is collected or shown for them and the surface states the reason (`M09-42`,
  `M09-64`).
- Given a period with no position data, when the route timeline renders, then a break of that
  duration is shown and no line, curve or estimate spans it (`M09-45`).
- Given a position with a wide accuracy radius, when it renders on any surface, then the accuracy is
  rendered with it and the position is not drawn as a precise point (`M09-46`).
- Given a device that cannot reach the server, when the team view renders that person, then it shows
  a last-known position labelled with its time and no current position (`M09-48`).
- Given the live-location surface, when it opens, then its default view answers who is working and
  where each person is in their plan, and the moving-position map is a second view of the same
  people rather than the front door (`M09-43`).
- Given the work-hours window, when it renders for the tenant and for a tracked employee, then both
  see the same window with its timezone named, and no window is derived from observed behaviour
  (`M09-44`).
- Given any location surface, when it renders, then no usage counter, allowance or overage figure
  for location appears anywhere on it (`M09-47`).

**Localization notes.** "Last known", "no signal", "outside work hours" and the break labels on the
timeline are fixed product strings translated once (`F3-01`, `F3-07`). Distances and durations
render through the shared format implementation in the market's units (`pack.formats`, `F1-21`,
`F3-19`); times render on the tenant's timezone with the timezone named (`F3-22`, `F1-10`). Map
labels and place names come from the map provider in the reader's language where the provider
supports it, and the product never re-translates a place name itself (`F3-11`).
**Analytics events:** live map opened (viewer role, people shown) · location gap rendered (duration bucket,
known reason) · last-known state rendered · low-accuracy fix rendered as an area · out-of-window
state rendered.

### M09.7 — Geofencing

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M09-49 | **A geofence is anchored to a place the product already holds, never to a place it invented.** The anchors are `modules/M08`'s **project sites**, and the confirmed addresses of survey visits and booked site visits (`M04-12`'s corrected site record, `M02-46`'s confirmed address). Creating a geofence never creates a place: if the product does not already know where the site is, the fix is to correct the site — in the module that owns it — and the geofence follows. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Geo-fencing"); *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope (verbatim: "site radius per project site"); consumes `SRC` `M08-01`, `M04-12`, `M02-46` by published ID | P0 |
| M09-50 | **A geofence is a radius around its anchor, set per site by the tenant, with a stated default and an honest minimum.** The default radius is a tenant setting; a site may override it; and the surface states what the radius means in the market's units (`pack.formats`). A radius smaller than the typical accuracy of a consumer position fix is refused with the reason named, because a fence the product cannot reliably tell you have crossed is a fence that generates false events (`M09-46`'s accuracy law applied). **P0 because two P0 rows depend on it:** `M09-51`'s prompt-never-acts law is only meaningful if the fence that raised the prompt is one the product can reliably tell was crossed, and `M09-49`'s anchor rule assumes a radius exists on the anchor it names — a geofence with no defined radius is not a narrower feature, it is a source of false events on a privacy-sensitive surface. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Geo-fencing") and *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03; verbatim: "site radius per project site"); units per `SRC` `F1-21` (`pack.formats`); the minimum-radius rule follows from `F8-01`/`F8-07` (a fix is rendered with its accuracy, never above it) and `M09-46` | P0 |
| M09-51 | **Crossing a geofence prompts a person; it never acts for them.** Entering a site's fence offers a check-in; leaving it offers a check-out; and an ignored prompt produces **nothing** — no check-in, no check-out, no visit outcome, no attendance mark and no timeline entry that says a person did something they did not do. The geofence's own crossing event is recorded on the timeline as an event of the *fence*, distinct from the person's act (`M09-56`). | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Geo-fencing"); *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope (verbatim: "auto check-in **prompts**"); the never-acts law is this module's, consistent with `SRC` `F8-35` (a capability never silently no-ops) and `F8-34` (a message about state describes the actual state) | P0 |
| M09-52 | **A crossing is evaluated and recorded server-side, and the prompt it raises is never a dependency of the core workflow.** The evaluation happens on the server, against the position stream only a tracked seat produces; the prompt it raises is a convenience of the tracked bundle. What the day actually runs on is the included check-in of `M09-18`, which every employee has on every tier, with or without a fence and with or without a prompt. | `BRIEF` — capability per the attestation; the prompting law is `M09-51`'s and the included-check-in boundary is `M09-18`/`M09-02`'s, both cited rather than restated | P0 |
| M09-53 | **No tracked seat, no geofence.** Geofencing is inside the per-seat bundle (`M09-03`), so an untracked employee crosses no fences, receives no prompts and generates no crossing events. Their check-in is unaffected in every way (`M09-18`), and no surface offers them a degraded or preview version of the capability. | `BRIEF` — *retired: PRD design note* §2 `DD7` (geofencing in the per-seat bundle), published at `BM-22`; the closed-bundle rule is `M09-03` | P0 |

**Behavior detail.** Geofencing in this product is a **prompting** capability, not an enforcement
one, and every rule above follows from that. The value it adds is removing a tap from a busy
technician's arrival and giving a coordinator a corroborating event beside a self-reported one. The
value it must not claim is certainty: a fence crossing is a signal derived from positions with real
accuracy limits (`M09-46`), and a product that checked people in automatically would be writing
records of acts that did not happen and would quietly become the least trustworthy source of truth
about the day.

The anchor rule (`M09-49`) keeps the module from growing a place database. Sites already exist —
`modules/M08` holds project sites, `modules/M04` holds corrected survey site records, `modules/M02`
holds confirmed visit addresses — and a geofence is a property attached to one of them. A tenant who
finds a fence in the wrong place has an address problem, and the product sends them to the place
where addresses are fixed rather than letting them paper over it here.

*Paragraph removed 2026-08-07 by owner decision: it stated the geofence side of the offline
boundary, which was deleted with the offline/sync capability. `M09-52`'s surviving rule — the
crossing is evaluated server-side and the prompt is never what the workflow depends on — is
unchanged.*

**Permissions.** `F2.M09.manage-geofences` — the holder set of `F2.M08.update-stages` (EPC Owner,
Sales Manager, Project Manager, Operations), on the principle that the people who run a project site
run its fence; no narrower authority is invented, and narrowing it would be an owner ruling rather
than a module decision (the precedent is §F2.5-M08's treatment of cancellation). Receiving a prompt
requires no grant beyond being the tracked employee it concerns.

**Edge cases & what-goes-wrong.**

- *A prompt appears and is ignored* → nothing is recorded as done; the fence event exists as a fence
  event and no act is attributed to the person (`M09-51`).
- *A fence fires while the person is driving past on an adjacent road* → the prompt is dismissible
  and produces nothing; the radius rule (`M09-50`) is the mitigation and the honest one — a fence
  cannot be made perfect and the product does not pretend it is.
- *A radius is set smaller than typical fix accuracy* → refused with the reason named (`M09-50`).
- *The site's address is wrong* → the fence is wrong; the fix is the address, in the module that
  owns it (`M09-49`, `M04-12`).
- *An untracked employee expects a prompt* → there is none, by design, and the surface does not
  advertise a capability their employer has not enabled (`M09-53`).
- *A position reporting a crossing arrives late* → it is not evaluated as a live crossing; late
  position data lands on the timeline with its capture time and orders nothing (`M09-52`, `F4-19`).

**Acceptance criteria.**

- Given a site with no geofence anchor in `modules/M08`, `modules/M04` or `modules/M02`, when a user
  attempts to create a geofence, then no new place is created and the user is directed to the module
  that owns the site (`M09-49`).
- Given a geofenced site, when its radius is set, then a radius below the typical accuracy of a
  consumer position fix is refused with the reason named, and a site with no radius has no fence
  (`M09-50`).
- Given a tracked employee entering a geofenced site, when the crossing is evaluated, then a
  check-in **prompt** appears and no check-in exists until they act (`M09-51`).
- Given an ignored geofence prompt, when the timeline renders, then it contains the fence event and
  no check-in, check-out, visit outcome or attendance mark (`M09-51`).
- Given an employee for whom tracking is off, when they arrive at a geofenced site, then no crossing
  event exists for them and no prompt appears (`M09-53`).

**Localization notes.** Prompt copy ("You're at Sharma residence — check in?") is translated across
the launch language set and renders in the field user's own language (`F3-01`, `F3-06`); radii
render in the market's units through the shared format implementation (`F1-21`, `F3-19`); site names
are tenant data and are never translated by the product (`F3-11`). **Analytics events:** geofence
created / radius changed (site) · crossing evaluated (enter / exit) · prompt shown · prompt acted on
· prompt ignored · radius refused as below minimum.

### M09.8 — Activity timeline and daily movement

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M09-54 | **The activity timeline is the ordered record of what happened in a person's field day, and it is included for every employee.** Its entries are the acts this module records: day start, check-in, check-out, visit outcome, unplanned stop, note or photo attached to a stop, day end — each with its capture time and its place where one was captured. Under the adopted reading of `M09-05` the timeline needs no tracked seat, because every event on it comes from the included capabilities of `M09-02`. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Activity timeline"); boundary reading per `M09-05` and register `Q38`; capture-time semantics per `SRC` `F4-19` | P0 |
| M09-55 | **Daily movement playback is the tracked seat's map replay of a day, and it exists only for a tracked seat.** Replaying a day draws the observed positions in order, at the times they were observed, with every gap of `M09-45` present as a gap in the replay. It is `DD7`'s *movement history* and *activity playback* (`M09-03`), and it is the one surface in this module that cannot exist without the location stream. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Daily movement"); boundary per *retired: PRD design note* §2 `DD7` ("movement history, activity playback"), published at `BM-22`; gap law per `M09-45` | P0 |
| M09-56 | **The timeline is append-only and states its own gaps.** Entries are added, never edited away; a correction appends (`M09-38`'s rule generalised to the timeline), and the timeline distinguishes three things a reader must not confuse: an **act a person performed**, an **event the system observed** (a geofence crossing, a position), and an **interval in which nothing was recorded**. Nothing on the timeline is inferred from anything else on it. | `BRIEF` — the append-only record discipline of this suite applied to the timeline; consumed from `SRC` `F8-01`/`F8-07` (state what is true, name what is missing, and label it beside the value), `DOC04.timeline` cited as the pattern (`modules/M08` `M08-49`), `F2-22` (mutating acts are audited) | P0 |
| M09-57 | **GPS movement-trail retention is 90 days rolling, auto-deleted after (owner ruling 2026-08-04, Q40); attendance, visit records and check-ins — the non-GPS business records — are retained unaffected.** The 90-day rolling window is the product's retention law for location trails and playback data; a market's `pack.data-rights` determination may set a stricter (shorter) period and the pack then wins — the retention fact rides in the pack's data-rights note per market. Tenant-level **read and export always work** in every billing state (`F1-24`(a)), and **erasure is anonymisation, never row deletion**, with the market's statutory carve-outs honoured (`F1-24`(b)). | `BRIEF` — the product half of a `SRC` law: `F1-24` (the two product-law rights), `F1-23` (`pack.data-rights` carries the determination), `F1-32`-class statutory carve-outs; 90-day rolling retention per owner ruling 2026-08-04 (Q40) | P0 |
| M09-58 | **The timeline is one surface, scoped — never a different surface per role.** A person reading their own timeline, a coordinator reading their team's and an owner reading anyone's see the **same** surface with the same vocabulary and the same honesty, differing only in whose days are reachable (`F2-12`'s law, verbatim in F2: *"The same screen, scoped"*). No role gets a richer rendering of the same day, and no role gets a summarised one that hides a gap the other sees. | `BRIEF` — the visibility law applied to this module's read surface; consumed from `SRC` `F2-12` (`D20`), `F2-14` (per-domain resolution) | P0 |

**Behavior detail.** The timeline is the module's memory and the surface most likely to be read in
an argument — about whether someone was somewhere, about how long a job took, about why a customer
was not visited. Its design obligation is therefore to be **boring and complete**: entries in
order, each labelled with what kind of thing it is, gaps shown as gaps, nothing computed, nothing
smoothed, nothing summarised into a judgement.

`M09-56`'s three-way distinction is what makes the timeline defensible. A check-in is something a
person did. A geofence crossing is something the system observed. A 40-minute break is something
nobody recorded. Collapsing any two of those — rendering a crossing as an arrival, or a break as
idle time — would make the timeline exactly the kind of confident artefact `F8` exists to prevent,
and would do it on the surface where the stakes are personal.

Playback (`M09-55`) is deliberately the thinnest possible feature: the day's observed positions
replayed in time order over the map. It computes no speeds, no distances, no dwell scores and no
route efficiency, because each of those is a confident number over gapped data (`M09-45`,
`M09-09`), and because the category's versions of them are exactly the surplus `M09-06` excludes.

Retention (`M09-57`) now has its number: **90 days rolling with auto-delete** for GPS movement
trails (owner ruling 2026-08-04, Q40), with attendance, visits and check-ins retained as business
records; a market pack's data-rights determination may still set a stricter period, and the
retention fact is noted per market in `pack.data-rights`.

**Permissions.** Reading one's **own** timeline requires no grant (`M09-66`). Reading another
person's rides `F2.M09.field-visibility`; the movement-playback half additionally requires
`F2.M09.view-live-location`, which is a narrowing of it (`M09-42`'s permissions note). Every read of
another person's location or playback is audit-covered per `F2-22` (`M09-70`). Export rides the
tenant's always-available export right (`F1-24`(a)).

**Edge cases & what-goes-wrong.**

- *A day with no positions at all (untracked person)* → the timeline is complete for what it
  records: day start, stops, outcomes, day end. There is no playback, and the surface says why
  rather than showing an empty map (`M09-54`, `M09-55`).
- *A day with a two-hour gap* → the gap is on the timeline and in the playback, with its duration
  (`M09-45`, `M09-56`).
- *An erasure request touches a person's location history* → anonymisation, never deletion, with the
  market's carve-outs honoured (`M09-57`, `F1-24`).
- *A tenant asks how long their location data is kept* → 90 days rolling for GPS trails,
  auto-deleted after, with attendance/visits/check-ins retained as business records; a stricter
  pack period wins where one exists (`M09-57`, owner ruling 2026-08-04 Q40).
- *A coordinator wants a "time on site vs time travelling" split* → the raw facts are on the
  timeline; the derived split is not computed, because the travelling half is exactly the gapped
  interval (`M09-45`, `M09-09`).
- *A person asks to see their own day* → they can, always, without a grant (`M09-66`).

**Acceptance criteria.**

- Given an untracked employee's day, when their activity timeline is opened, then it renders every
  act they recorded and states that movement playback is unavailable because tracking is off
  (`M09-54`, `M09-55`, `M09-61`).
- Given a tracked employee's day containing an interval with no positions, when the day is played
  back, then the interval renders as a gap of that duration and no path spans it (`M09-55`,
  `M09-45`).
- Given any entry on a timeline, when it renders, then it identifies whether it is an act a person
  performed, an event the system observed, or an unrecorded interval (`M09-56`).
- Given a correction to a timeline-bearing record, when it is applied, then the original entry
  remains readable and the correction appears as an appended entry (`M09-56`, `M09-38`).
- Given any billing state, when a tenant exports their field records, then the export succeeds
  (`M09-57`, `F1-24`(a)).
- Given the same day read by its owner, their coordinator and the EPC Owner, when each opens the
  timeline, then all three see the same surface with the same entries and the same gaps, differing
  only in which days they can reach (`M09-58`).

**Localization notes.** Timeline entry types, gap labels and the "tracking is off" statement are
fixed product strings translated once across the launch language set (`F3-01`, `F3-07`); times and
durations render through the shared implementation on the tenant's timezone (`F3-22`, `F1-10`,
`F3-19`). The timeline reads top-down in every launch locale and its layout is direction-aware per
`F3`'s writing-direction posture. **Analytics events:** timeline opened (self / other) · playback
opened · gap rendered (duration bucket) · timeline exported · correction appended.

### M09.9 — Team visibility

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M09-59 | **Team visibility is the coordinator's read of the field day as it is happening: who is working, where they are in their plan, what has been checked into, and what is running against its window.** Under the adopted reading of `M09-05` the surface itself is included for every tenant on every tier; what a tracked seat adds to it is the live position, the route line and the playback (`M09-03`). The surface is a list first and a map second, because the question a coordinator asks first is *is the day going to plan*, not *where is everyone*. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Field-workforce ("Team visibility"); boundary reading per `M09-05` and register `Q38`; the list-first choice follows `M09-43`'s framing and `PS-34` | P0 |
| M09-60 | **Team visibility resolves in the field-work domain, and that domain never leaks into or out of another.** `F2-14` establishes **field work** as its own visibility domain with the ladder **Own ⊂ Team ⊂ All**, and holding a wide scope elsewhere never widens it — F2's own worked example is a Sales Manager who also holds Field Technician and *"sees the team's leads and only their own route"*. This module honours that unchanged: no preset gains field scope from a lead, project, people or money scope. **What does travel is the record's own facts:** whether a booked visit was attended, when and for how long is readable on the **lead** or **project** it belongs to, by whoever can already open that record — which is how a Sales Manager learns their team's surveyor arrived without holding any field-work scope (`M09-28`). | `BRIEF` — the field-work domain's cells for this module; consumed from `SRC` `F2-14` (per-domain resolution, the field-work ladder, the worked example), `F2-12`/`D20` (the same screen, scoped), `F2-13` (widest wins inside a domain), `F2-15` (no per-person exceptions) | P0 |
| M09-61 | **An untracked person renders honestly on the team view, never as a blank that reads as "not working".** Their row shows what exists — their day start, their stops, their check-ins, their outcomes — and states plainly that **live position is unavailable because tracking is off for this employee**. It is never an empty cell, never a greyed-out silhouette that implies a failure, and never a prompt disguised as a status. Whether to turn tracking on is the Owner's decision and it is made on the Owner's own surface (`M09-11`), not sold from a coordinator's dashboard. | `BRIEF` — the honest-state obligation applied to the mixed tracked/untracked team, which is the normal case under `DD7`; consumed from `SRC` `F8-01`, `F8-34`, `F8-35` | P0 |
| M09-62 | **The coordinator's home composition belongs to `modules/M13-dashboards-and-reporting.md`; this module supplies its content.** `PS-34` already places "the field team's current day" on the Operations home and `PS-05` requires one composed home per person; the role-home composition rule is M13's (Task 23). This module states what it provides — the day-in-progress list, the exceptions on it, and the tracked additions where they exist — and specifies no home screen of its own. | `BRIEF` — the forward contract; consumes `PS-34`, `PS-05`, `PS-21` by published ID; composition ownership per design spec §4 (`modules/M13`) and the precedent at `M04-38` | P1 |
| M09-63 | **`REC` — nearest-available dispatch.** Answering *"who is nearest to this site right now"* as an **action**: proposing the nearest tracked, working, currently-free employee for an urgent visit and assigning it in one step. | `REC` — beyond the brief's ten capabilities; mirrored in `registers/enhancements.md` with rationale and conditions, including that it works only for tracked seats and must not become an automatic assignment. Not source truth and not brief scope | P2 |

**Behavior detail.** The team view is a list of people with a state each, ordered by what needs
attention: open check-ins past their window, visits running past their window, days not started,
and everyone else. The map is the second view of the same list, and the two never disagree, because
they render the same records.

`M09-60` is the row that took the most care to write, because the dispatch's shorthand ("managers
see the team") collides with a law F2 has already published. F2-14's worked example decides the
Sales Manager's field cell *by example*: a Sales Manager stacked with Field Technician sees "only
their own route", which is only true if the Sales Manager preset carries no team-wide field scope of
its own. This module does not re-rule that cell. What it does instead is notice that a Sales Manager
does not actually need field-work scope for the thing they need — they need to know whether the
surveyor turned up at *their team's lead*, and that fact lives on the lead. The delivery-side
coordinators, whom decision B created precisely for this work, hold the field scope: the Project
Manager over their projects' field workers and Operations over the field team (`F2-08c`, `PS-34`).

`M09-61` is a commercial-honesty row as much as a UX one. Under `DD7` a mixed team — some tracked,
most not — is the expected shape, and the surface that renders it must not make untracked people
look broken. A dashboard that shows twelve grey silhouettes and three live dots is an upsell
disguised as a status board, and it would be reporting a commercial fact as an operational one.

**Permissions.** `F2.M09.field-visibility` — EPC Owner **All** · Survey Engineer, Field Technician,
Installation Team Member **Own** · Project Manager **Own projects' field work** · Operations
**Team** · every other preset none, including Sales Manager (see `M09-60` and the notes on
§F2.5-M09). `F2.M09.view-live-location` narrows that scope to the location half.
`F2.M09.attendance-visibility` is separate and is §M09.5's. Reads of another person's location are
audited (`M09-70`, `F2-22`).

**Edge cases & what-goes-wrong.**

- *A team of ten with two tracked seats* → all ten appear; two carry live positions and eight state
  why they do not (`M09-61`).
- *A Sales Manager opens the team view* → they hold no field-work scope and see no field day; the
  visit facts they need are on their team's leads (`M09-60`, `M09-28`).
- *A person holds Field Technician and Sales Manager* → the team's leads and their own route only;
  the domains do not cross-widen (`M09-60`, `F2-14`).
- *A coordinator's whole team is out of contact* → the view says so, per person, with last-known
  times; nothing renders as current (`M09-48`).
- *Two coordinators look at the same person* → the same surface, scoped identically, both reads
  audited (`M09-58`, `M09-70`).
- *A coordinator wants to compare two technicians' days side by side* → the days are readable; no
  comparison score, ranking or difference metric is produced (`M09-09`).

**Acceptance criteria.**

- Given a coordinator with team field scope, when the team view opens, then it lists every person in
  scope with their day state, ordered by what needs attention, before any map is shown (`M09-59`).
- Given a user holding only the Sales Manager preset, when they attempt to open a field-work
  surface, then no person's field day is reachable, and the visit facts on their team's leads remain
  readable (`M09-60`, `M09-28`).
- Given a person for whom tracking is off, when they render on the team view, then their recorded
  acts are shown and the surface states that live position is unavailable because tracking is off
  (`M09-61`).
- Given a user holding a wide scope in the leads or projects domain and none in field work, when any
  field surface is opened, then no field day is visible to them (`M09-60`, `F2-14`).
- Given any team surface, when it renders, then no score, ranking, comparison metric or target
  attainment appears for any person (`M09-09`).

**Localization notes.** The day-state vocabulary — "not started", "on site", "travelling",
"day ended", "no record" — is fixed product vocabulary translated once (`F3-01`, `F3-11`), and
"travelling" must not be translated into a word that implies a vehicle in any launch language, since
the product observes movement, not a mode of transport. People's names are tenant data and are never
translated by the product (`F3-11`); times render on the tenant's timezone (`F3-22`, `F1-10`).
**Analytics events:** team view opened (viewer role, people in scope, tracked count) · person row
expanded · untracked-state rendered · exception row surfaced (open check-in / visit past window /
day not started).

### M09.10 — Privacy and compliance laws

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M09-64 | **Law 1 — tracking happens only during work hours.** No position, route, geofence evaluation or movement record is produced for any employee outside the tenant's declared work-hours window (`M09-44`), on any device, in any state, for any reason. There is no exception for an open check-in, an overrunning job, an emergency or an owner request; a window that needs to be wider is widened as a declared window, prospectively, with the employees told (`M09-13`). | `BRIEF` — *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope (M09 privacy laws, verbatim: "tracking only during work hours"), carried as a product requirement | P0 |
| M09-65 | **Law 2 — tracking is owner-toggled, per employee, and never derived.** The only way an employee becomes tracked is the EPC Owner moving that employee's toggle (`M09-10`, `M09-11`). No preset, team, job type, project assignment, plan tier or platform behaviour turns tracking on, and there is no tenant-wide setting that pre-answers the per-person decision. | `BRIEF` — *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope (verbatim: "owner-toggled per employee") + *retired: PRD design note* §2 `DD7` (*"Owner toggles tracking per employee"*), carried as a product requirement; published commercially at `BM-22` | P0 |
| M09-66 | **Law 3 — the tracking state is visible to the employee, and so is their own record.** A tracked employee can always see, from their own device, that they are tracked and during which hours (`M09-13`). They can always read **their own** timeline, their own check-ins, their own attendance and their own movement history, with no grant and no request to anyone. A product that collects a person's location and cannot show that person what it collected is not one this suite specifies. | `BRIEF` — *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope (verbatim: "employee-visible tracking state"), carried as a product requirement and extended to the employee's own record — the extension is this module's and is tagged as such; consistent with `SRC` `F1-24` (rights are product law) | P0 |
| M09-67 | **Law 4 — per-market employee-privacy compliance is `pack.data-rights` data, and this document restates no market's rules.** The jurisdiction's determination — the platform's role for employee data, residency, the data-principal rights map with its paths and SLAs, notice and consent obligations for workforce location, and breach duties — is `pack.data-rights` content (`F1-23`), authored per market and never tenant-editable. A tenant configures **within** the floor its market sets, never around it (`F1-12`). Where a market's determination imposes a stricter rule than any requirement in this module, the pack wins. | `BRIEF` — *retired: PRD authoring plan* §Task 22 Step 2 (owner-approved plan, 2026-08-03), under design spec §11's M09 scope (verbatim: "per-market privacy compliance via pack.data-rights"); consumed from `SRC` `F1-23` (the determination's contents), `F1-12` (packs are floors), `F1-05` (the new-market gate); market-neutrality law per design spec §6 | P0 |
| M09-68 | **A market without a data-rights determination cannot have tracking enabled in it at all.** `F1-05` already makes the privacy/residency determination a precondition of any tenant existing in a market; this module adds the consequence for its own most sensitive capability: absence of a determination is a **disable**, not a permissive default, and the tracking toggle in such a market states that tracking is unavailable pending the market's determination rather than being silently available. | `BRIEF` — the module-side consequence of `SRC` `F1-05` (the new-market gate) and `F1-12` (absence is never a permissive default); the same posture `modules/M03` takes for an absent messaging ruleset | P0 |
| M09-69 | **Export and erasure rights reach location history, unchanged.** Tenant-level **read and export always work** in every billing state, including for field and location records (`F1-24`(a)); **erasure is anonymisation, never row deletion**, honouring the market's statutory carve-outs (`F1-24`(b)); and the market's own rights map — the access/export path and its SLA — governs an individual employee's request (`F1-23`, IN instance `F1-56`). No requirement in this module weakens any of that, and nothing about location's sensitivity is used as a reason to withhold it from the person it describes (`M09-66`). | `BRIEF` — the module-side application of `SRC` `F1-24` (the two product-law rights) and `F1-23`/`F1-56` (the market rights map); retention period per `M09-57` and register `Q40` | P0 |
| M09-70 | **Every tracking toggle and every read of another person's location is an audited event.** The audit log's covered-events list is `F2-22`'s acceptance checklist, and this module adds its own events to it: tracking toggled on or off (actor, subject), a geofence created or its radius changed, an attendance correction made by someone other than its subject, and **each access to another person's live position, route timeline or movement playback** (viewer, subject, when). The log is tenant-scoped, retained and exportable by the tenant (`F2-23`). | `BRIEF` — this module's events added to a `SRC` mechanism: `F2-22` (the append-only log and its covered-events list), `F2-23` (tenant-scoped, exportable), `F2-24` (platform access is read-only and audited); the location-read event is this module's addition and is tagged as such | P0 |

**Behavior detail.** The four laws the owner-approved authoring plan names for this module
(*retired: PRD authoring plan* §Task 22 Step 2, under design spec §11's M09
scope) are written here as
requirements rather than as principles, because a principle cannot be tested and a law can. Each of
them is also enforced somewhere concrete: Law 1 at `M09-42` and `M09-44`, Law 2 at `M09-10` and
`M09-11`, Law 3 at `M09-13` and the own-record right of `M09-66`, Law 4 at `M09-67` through the
market pack. A reader auditing this module for privacy should be able to start at any of the four
and land on a testable requirement in a feature area.

`M09-66`'s second sentence is this module's own extension of the spec's law and is tagged as such:
the spec requires the tracking **state** to be visible, and this document adds that the tracked
person can read their own **record**. It is added because the alternative is a product where a
coordinator can see a person's day and that person cannot, which would make the surveillance reading
of the module the correct one. It costs nothing — the surface already exists (§M09.8) — and it is
the difference between a coordination tool and a monitoring tool.

The audit addition of `M09-70` is deliberately specific about **reads**, not just writes. Everywhere
else in the suite the audit log covers mutations; here the sensitive act is looking. A coordinator
reading a technician's route is doing something that should leave a trace, and the tenant can export
that trace (`F2-23`).

**Permissions.** `F2.M09.toggle-tracked-seat` (EPC Owner) carries Law 2. Reading another person's
location requires `F2.M09.field-visibility` **and** `F2.M09.view-live-location` and is audited.
Nothing in this area grants, widens or suspends any capability; the market pack constrains every one
of them and grants none (`F1-12`, `F1-01`-class posture).

**Edge cases & what-goes-wrong.**

- *An owner asks to track someone outside work hours "just for today"* → refused by `M09-64`; the
  window is widened prospectively as a declared window and the employees are told.
- *A market has no data-rights determination* → tracking cannot be enabled there and the toggle says
  so (`M09-68`, `F1-05`).
- *A market's law requires explicit employee notice before workforce tracking* → the pack carries
  it, the pack wins over anything in this document, and the requirement is not restated here
  (`M09-67`).
- *An employee asks what the company has collected about their movement* → they can read it
  themselves (`M09-66`), and the market's data-principal export path exists in addition
  (`M09-69`, `F1-56`).
- *An erasure request arrives from a former employee* → anonymisation with the market's carve-outs,
  never deletion (`M09-69`, `F1-24`).
- *A tenant is in a restricted billing state and asks to export their field data* → the export works
  (`F1-24`(a), `M09-17`).
- *A coordinator repeatedly opens one person's location* → every read is in the tenant's audit log
  and the tenant can export it (`M09-70`).
- *Someone proposes hiding the tracking indicator to "reduce anxiety"* → refused by `M09-66`; the
  indicator is a law, not a setting.

**Acceptance criteria.**

- Given any employee and any time outside the tenant's declared work-hours window, when any
  location, geofence or movement collection is attempted, then none occurs and no record is produced
  (`M09-64`).
- Given any mechanism in the product other than the EPC Owner's per-employee toggle, when it is
  exercised, then no employee becomes tracked as a result (`M09-65`).
- Given a tracked employee, when they open their own application, then their tracking state and its
  hours are visible without navigation, and their own timeline, check-ins, attendance and movement
  history are readable without any grant (`M09-66`).
- Given a market whose `pack.data-rights` determination imposes a stricter workforce-tracking rule
  than this module states, when the two are compared, then the pack governs and this module's text
  restates none of it (`M09-67`).
- Given a market with no data-rights determination, when the tracking toggle is opened for a tenant
  in that market, then tracking is unavailable and the reason is stated (`M09-68`).
- Given any billing state, when a tenant exports its field and location records, then the export
  succeeds; and given an erasure request, then records are anonymised rather than deleted
  (`M09-69`, `F1-24`).
- Given a read of another person's live position, route timeline or movement playback, when it
  occurs, then an entry naming the viewer, the subject and the time exists in the tenant's audit log
  (`M09-70`, `F2-22`).

**Localization notes.** The tracking-state statement, the work-hours window, the
unavailable-in-this-market message and every privacy-facing string are translated across the launch
language set and render in each reader's own language (`F3-01`, `F3-06`, `F3-07`) — an employee must
be able to read what the product is collecting about them in the language they chose, which is a
launch requirement rather than a refinement. The market's own notice and consent wording is pack
content and is authored per market, never translated by this module from another market's text
(`F1-23`, `F3-11`). **Analytics events:** tracking-state surface viewed by the employee ·
own-record read by the employee · out-of-window collection attempt refused (should be zero) ·
tracking unavailable in market rendered · location read audited (viewer role).

## 4. Cross-module contracts

**What this module expects from others.**

| From | What it expects |
|---|---|
| `04-business-model.md` | The tracked-seat meter and its included boundary: `BM-22` (per-tracked-seat monthly add-on, the owner toggle, tracked-seat-months as the unit, the closed bundle list), `BM-23` (check-in/out and visit logging included in every tier), `BM-24` (location ingestion outside the add-on is absorbed, never metered), `BM-16` (the closed five-meter set). No figure is computed here. |
| `foundations/F1-global-market-framework.md` | `pack.data-rights` as the carrier of every market's employee-privacy determination (`F1-23`), the two product-law rights (`F1-24`), the new-market gate (`F1-05`), packs-are-floors (`F1-12`), measurement units and locale formats (`F1-21`), tenant timezone (`F1-10`), and the empty per-tracked-seat book slot (`F1-25`, `F1-61`, `BM-41`). |
| `foundations/F2-roles-and-permissions.md` | The field-work visibility domain and its ladder (`F2-14`), the scoping law (`F2-12`), widest-wins within a domain (`F2-13`), no per-person exceptions (`F2-15`), the Field Technician / Installation Team Member preset split (`F2-09`), the no-commercial-figures surface law (`F2-06`), and the audit mechanism (`F2-22`, `F2-23`). The seven §F2.5-M09 rows this module fills are the only permission truth for it. |
| `foundations/F4-data-integrity.md` | Forward-only visit status (`F4-17`), capture-time semantics and the server-decides-apply-order law (`F4-19`), idempotent submission so a retried capture never duplicates and never drops (`F4-07`), the recoverable-concurrent-edit law behind attendance corrections (`F4-16`) and the never-blocking law (`F4-27`). |
| `foundations/F8-data-honesty.md` | The closed tier set and `measured`'s definition (`F8-01`–`F8-03`), including `F8-01`'s rule that a value whose tier cannot be established is not rendered as a number; aggregates inherit the weakest tier (`F8-04`); labels render beside the value and never hover-only (`F8-07`); a stale output says so where it is read (`F8-18`); usage figures are the ones the product bills from (`F8-33`); honest state, never a silent no-op, honest failure (`F8-34`, `F8-35`, `F8-36`). |
| `modules/M02-crm-and-leads.md` | The booking act and the confirmed address (`M02-46`); the lead's own visit record, which receives this module's arrival and departure facts and stays scoped by `F2.M02.lead-visibility`. |
| `modules/M04-survey.md` | The survey visit object, the surveyor's visits home (`M04-38`), the visit agenda (`M04-32`) and the site-address correction path (`M04-12`). This module renders the survey visit as a stop and restates none of it. |
| `modules/M08-projects.md` | Project sites as geofence anchors and as visit destinations; the closed project surface set (`M08-01`), which this module does not widen; the installation checklist and its no-figures law (`M08-41`, `M08-43`), which stay entirely M08's. |
| `modules/M12-platform-billing.md` | The usage ledger, tracked-seat-month arithmetic, month fractions, invoicing and the soft-block ladder. This module owns the toggle as a surface and none of the accounting. |

**What this module provides to others.**

| To | What it provides |
|---|---|
| `modules/M02-crm-and-leads.md` | For a booked site visit: attended / not attended, arrival and departure times, elapsed time on site, and the visit outcome with its reason — readable on the lead by whoever can open it, moving no lead stage (`M09-28`, `M09-08`). |
| `modules/M04-survey.md` | The presence record behind a survey visit — check-in, check-out, elapsed — and the visit's place on the activity timeline, without touching the survey, its versions or its capture flow (`M09-29`). |
| `modules/M08-projects.md` | The presence record behind a visit to a project site, and the geofence anchored to that site. No stage, blocker, document or checklist state is written by this module (`M09-30`, `M09-08`). |
| `modules/M10-hr-lite.md` **(Task 23)** | **The field half of the shared attendance surface**: day start and day end per person per day, their capture times and provenance, and the correction trail (`M09-38`) — plus the standing rule that **absence is never inferred** here (`M09-39`), which M10 must be able to rely on when it adds leave, holidays and rosters. This module specifies none of those and does not pre-empt M10's register, policy or SME-weight decisions (`M09-40`). |
| `modules/M12-platform-billing.md` | The tracked-seat toggle events (who, whom, when) that the usage ledger meters as tracked-seat-months (`M09-04`, `BM-22`). |
| `modules/M13-dashboards-and-reporting.md` **(Task 23)** | The field-day content for the coordinator role homes — the day-in-progress list, its exception rows (open check-ins, visits past window, days not started) and, for tracked seats, the live and playback surfaces. `PS-34`'s "field team's current day" is composed there, not here (`M09-62`). Every figure travels with its gaps stated (`M09-45`) and no score accompanies any of it (`M09-09`). |
| `foundations/F6-notifications-and-search.md` **(Task 23)** | Three notification types this module produces: **tracking turned on / off for you** (to the employee, `M09-13`), **open check-in needing a check-out** (to the person and their coordinator, `M09-24`), and **geofence arrival prompt** (to the tracked employee, `M09-51`). Their placement in the per-persona matrix is F6's. |

## 5. Non-goals

Each item below is explicitly out of scope with its rationale recorded. The first group carries
`M09-06` as its authority — the brief's own instruction, *"Do NOT copy unnecessary fleet-management
features"* — and each is a non-goal rather than an unbuilt backlog item; adding one is an owner
ruling.

**Fleet-management surplus, excluded by name.**

- **Vehicle records and vehicle assignment.** No vehicle object, no vehicle-to-employee assignment,
  no odometer. An EPC's field workforce is people going to roofs; the product tracks the person's
  day, not a vehicle's life.
- **Fuel cards, fuel logs and fuel-efficiency reporting.** No fuel consumption, no cost-per-litre,
  no mileage-versus-fuel reconciliation. This is a transport-company economics surface with no EPC
  workflow behind it.
- **Vehicle maintenance and service scheduling.** No service intervals, no maintenance due dates, no
  inspection checklists for vehicles. `modules/M08`'s checklist is the installation checklist and is
  about a solar system, not a vehicle.
- **Driver behaviour scoring and telematics.** No harsh-braking, acceleration, cornering or speeding
  detection, no driver safety score, no per-trip rating. Beyond being fleet surplus, it is refused
  twice over by `M09-09`: it is a score about a person, computed from gapped consumer-grade position
  data.
- **Trip and route economics.** No distance-travelled totals, no cost-per-trip, no route-efficiency
  percentage. Every one of these is a confident number computed across the gaps `M09-45` requires be
  shown as gaps.
- **Vehicle-hardware integration.** No on-board diagnostics, no hardware trackers, no SIM-based
  vehicle telematics, no dashcam. The product's only sensor is the phone the employee already
  carries.
- **Consignment, dispatch and delivery management.** No load, no consignment note, no
  proof-of-delivery workflow, no multi-drop dispatch board. Solar EPC field work is visits and
  installations; a logistics dispatch model would be a different product.

**Other non-goals, with their rationale.**

- **No productivity scoring, ranking or league tables** of any kind, for any persona, on any
  surface (`M09-09`). This is not a v1 deferral — it is a standing property of the module.
- **No automatic check-in, check-out or attendance mark.** Geofences prompt; people act (`M09-51`,
  `M09-37`). A record of an act nobody performed is worse than no record.
- **No route optimisation in core scope.** The suggested day order is a `REC` (`M09-33`) precisely
  because the brief did not ask for it; the route as delivered is the assigned order.
- **No crew scheduling or shift rostering.** Design spec `DD2` keeps crew scheduling out of core
  scope; shift patterns, if they arrive, arrive with `modules/M10` and are that document's decision
  (`M09-40`, register `Q39`).
- **No customer-facing location surface.** The customer link (`foundations/F5`) shows project
  progress, not a technician's position; the arrival-window idea is a `REC` with its conditions
  attached (`M09-34`).
- **No location-derived payroll.** Attendance feeds `modules/M10`'s shared surface as facts
  (`M09-40`); what a company does with those facts commercially is outside this suite, and no
  requirement here computes pay, overtime or deductions.
- **No monitoring of installed systems.** Post-handover telemetry, O&M and service dispatch remain
  the spec-locked exclusion `modules/M08` records (`M08-48`, `CG-6`); "field workforce" here means
  the people, not the installed fleet of systems.

## 6. Open questions

Mirrored into `registers/open-questions.md`. All three questions raised here were resolved in
the owner's 2026-08-04 rulings session; the cited questions closed in the same session.

- **`M09-Q1` (register `Q38`) — RESOLVED (owner ruling 2026-08-04, Q38).** Confirmed
  free-for-all: attendance, the team visibility board and the activity timeline are included
  for every worker on every tier; the paid seat is purely the GPS bundle (live location, route
  timeline, geofencing, movement history, activity playback). The `DD7` boundary is closed
  exactly as `M09-05` read it.
- **`M09-Q2` (register `Q39`) — RESOLVED (owner ruling 2026-08-04, Q39).** The tracking window
  is the worker's **day-start tap → day-end tap**, worker-controlled, with a tenant force-stop
  backstop (default 20:00, owner-set) and an always-visible tracking indicator; no attendance =
  no tracking that day (`M09-44`, `M09-13`). The definition stays in this module — v1 ships no
  per-employee shift patterns (`M10-29`), and `pack.data-rights` still wins where stricter.
- **`M09-Q3` (register `Q40`) — RESOLVED (owner ruling 2026-08-04, Q40).** GPS movement-trail
  retention is **90 days rolling, auto-deleted after**; attendance, visit records and check-ins
  are retained as business records (`M09-57`). The retention fact is noted per market in
  `pack.data-rights`, which may set a stricter period.

**Cited, closed in the same session (owner rulings 2026-08-04).**

- **`Q1`** — the IN book's per-seat slot now carries the owner's draft ≈₹99/seat/mo pending
  rate-card verification; `M09-16` presents the draft as draft, and the meter sells only after
  verification.
- **`Q17`** — higher tiers bundle included tracked seats: Starter 0 / Growth 3 / Pro 10 /
  Enterprise custom (`BM-41`, `M09-16`); `M09-03`'s closed bundle and `M09-12`'s per-person
  confirmation are unchanged by it.
