# M09 · Field workforce — engineering tasks

This file covers module M09 — Field workforce: the tracked-seat lifecycle and the Owner's tracking toggle, site check-in/out, visit tracking, attendance capture, live location and the route timeline, geofencing, the activity timeline and day playback, team visibility, and the module's four privacy laws. Task-id prefix: `T-M09-`. Source doc: `prd/modules/M09-field-workforce.md` (rows M09-01 … M09-71). Screen briefs live in `ux/briefs/` (SCR-M09-01 … SCR-M09-07); seven screen tasks carry one screen each, ten engine/policy/integration tasks carry the non-screen builds, eight rows are laws enforced through screens and review, and five context rows are realized by other rows or other modules' documents. Every row's disposition is indexed at the end of this file. Two rows from other documents — `PS-23` (`prd/02-personas.md`) and `M13-35` (`prd/modules/M13-dashboards-and-reporting.md`), the Field Technician route's content contract — are built at T-M09-002 and are indexed as `realized-by` that task in `tasks/F-core.md` and `tasks/M13-dashboards.md`, not here.

---

### T-M09-001 · Tracking Settings screen

**Type:** screen · **Tier:** P0
**PRD rows:** M09-04 (P0), M09-12 (P0), M09-14 (P0), M09-16 (P0), M09-44 (P0), M09-68 (P0)
**DESIGN:** SCR-M09-01 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M09-01-tracking-settings.md`; they are the specification. Every PRD row of this task is quoted in full in that brief; no additional rows need quoting here. M09-50 (the per-site radius rule) is also quoted verbatim in this brief because the tenant default radius is set here; it is dispositioned at T-M09-007.
**DONE WHEN:**

- Given the tracking toggle, when it is moved, then the act is attributable to the EPC Owner and its billing unit is tracked-seat-months, with no figure computed in this module (`M09-04`).
- Given the EPC Owner turning tracking on, when the confirmation renders, then it names the person, names the five capabilities, states that the person becomes a tracked seat billed as tracked-seat-months, and shows the tracked-seat count before and after (`M09-12`).
- Given tracking being turned off, when the toggle commits, then no further position, route, geofence or movement record is produced for that employee (`M09-14`).
- Given the IN book's draft per-tracked-seat price, when the toggle surface renders, then the draft value and the tier's included-seat allowance are presented as draft pending rate-card verification and never as a final sellable rate; and given a market book with no per-seat price at all, then the surface states that tracking is not yet priced and shows no number (`M09-16`, owner ruling 2026-08-04 Q1/Q17).
- Given the work-hours window, when it renders for the tenant and for a tracked employee, then both see the same window with its timezone named, and no window is derived from observed behaviour (`M09-44`).
- Given a market with no data-rights determination, when the tracking toggle is opened for a tenant in that market, then tracking is unavailable and the reason is stated (`M09-68`).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M09-002 · My Day (Route) screen

**Type:** screen · **Tier:** P0
**PRD rows:** M09-13 (P0), M09-19 (P0), M09-21 (P0), M09-23 (P1), M09-24 (P0), M09-28 (P0), M09-32 (P1), M09-33 (P2), M09-35 (P0), M09-37 (P0), M09-51 (P0), M09-66 (P0), M09-71 (P0), PS-23 (P1), M13-35 (P0)
**DESIGN:** SCR-M09-02 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M09-02-my-day-route.md`; they are the specification. Every PRD row of this task is quoted in full in that brief, `M09-71` included. *(This sentence carved out `M09-71` as an exception — true when written and false within minutes: the brief was amended in the same 2026-08-15 wave and its quote is byte-identical to the live cell.)* M09-24 also binds SCR-M09-04 and M09-66 also binds SCR-M09-05 — both are quoted verbatim in those briefs too; they are dispositioned here. M09-28's lead-side half binds SCR-M02-04 (Lead Detail; see `tasks/M02-crm-leads.md`); the field half — the stop on the route and its check-in/out — is this task's. **Exception — `M09-71`:** the row was added to `prd/modules/M09-field-workforce.md` §M09.5 by owner ruling 2026-08-15 (register `Q64`), restoring the law of `M09-36`, which was deleted 2026-08-07 with the offline capability and stays deleted; the restoring row deliberately carries a new id. The brief does not yet quote it — and still carries the stale `M09-36` pointer noted below — so it is quoted verbatim here and this quote is the specification for it until the brief owner carries it across:

- **M09-71** (P0) — **A day start or a day end is recorded only once the server has it.** The mark is the person's own act (`M09-35`, `M09-37`); until the server confirms it the surface shows it **pending, never as recorded** — no optimistic tick, and no local clock time presented as a record fact. A failure says so plainly and the mark is not lost from the screen (`F8-36`). This binds harder here than anywhere else in the product: attendance is read as a judgement about a person and feeds `modules/M10-hr-lite.md`'s register (`M10-23`), so a mark that *looks* recorded and is not is a wrong answer about someone's day. The time shown is the time the server recorded, which is what makes it an untiered record fact under `F8`'s date rule (register `Q59`) — a pending mark is not yet a record and cannot be shown as one.

Cross-bucket note: `PS-23` and `M13-35` are the route's **content contract** — what the screen lists — and their rows live in `prd/02-personas.md` and `prd/modules/M13-dashboards-and-reporting.md` while the screen belongs to this module. Both are quoted verbatim in `ux/briefs/SCR-M09-02-my-day-route.md` and both are dispositioned `realized-by` this task in `tasks/F-core.md` and `tasks/M13-dashboards.md`; they are listed above as this screen's specification rows and are not indexed in this file's disposition table, which covers the M09 rows only. This task is where they are built.

**DONE WHEN:**

- Given a Field Technician, when they sign in, then their home is their route today and its content is identical to the owning module's contract — the assigned stops **in order**, each with address, customer, window, distance, one-tap navigation and one-tap call, plus their current check-in state (`M13-35`, `PS-23`; M13's own acceptance line: "Given each of the twelve presets held singly, when the person signs in, then their home matches their row above, with content identical to the owning module's contract (M13-29 through M13-40, M13-11)").
- No Given/When/Then line covers `PS-23` in the PRD's acceptance blocks — `prd/02-personas.md` carries no acceptance block; the requirement text quoted in the brief is the binding criterion, and `M13-35`'s line above is the acceptance the same content is tested against.
- Given the per-stop **distance** this content contract requires, when it renders, then it is the stop's own figure `PS-23` and `M13-35` name, and no distance-travelled total, cost-per-trip or route-efficiency percentage is computed here or anywhere in this module — §5's non-goal reads "No distance-travelled totals, no cost-per-trip, no route-efficiency percentage" (`prd/modules/M09-field-workforce.md` §5; `M09-45`, `M09-09`).
- Given tracking being turned on or off for a person, when the change commits, then that person is notified and their own application states their current tracking state and its hours (`M09-13`).
- Given a check-in, when its record is read, then it carries who, which site or visit, the capture time, and either a position with its accuracy or the words "location unavailable" (`M09-19`, `M09-21`).
- Given a check-in with no check-out, when the work-hours window ends, then the record surfaces as an open check-in to the person and their coordinator and no close-out time is written by the product (`M09-24`).
- Given a tracked employee arriving at a geofenced site, when the prompt is raised, then it lands on the route screen's existing check-in control rather than a screen of its own, and whether it may write anything is `M09-51`'s law rather than this row's (`M09-23`).
- Given a site visit booked from a lead, when the assigned person opens their route, then the visit is present as a stop, and when they check in and out, then those facts are readable on the lead's visit record by anyone who can open that lead (`M09-28`).
- Given an unplanned stop, when it is logged, then it appears on the timeline marked as unplanned and no lead, project or survey is created by it (`M09-32`).
- Given an employee on any tier with no tracked seat, when they mark a day start and a day end, then both succeed and no capability of `M09-03` becomes available (`M09-35`).
- Given a first check-in of the day made before any day start, when it is recorded, then the day start is **offered** with that capture time and no attendance record exists until the person confirms it (`M09-37`).
- Given a tracked employee entering a geofenced site, when the crossing is evaluated, then a check-in **prompt** appears and no check-in exists until they act (`M09-51`).
- Given an ignored geofence prompt, when the timeline renders, then it contains the fence event and no check-in, check-out, visit outcome or attendance mark (`M09-51`).
- Given a tracked employee, when they open their own application, then their tracking state and its hours are visible without navigation, and their own timeline, check-ins, attendance and movement history are readable without any grant (`M09-66`).
- Given a day start or a day end marked by the person, when the mark is made, then it renders as pending and never as recorded until the server confirms it, and no local clock time is shown as a record fact (`M09-71`, `F8-36`, owner ruling 2026-08-15 `Q64`).
- Given a mark the server refuses or cannot reach, when the failure returns, then it is stated plainly, the mark stays on screen, and no attendance record exists (`M09-71`, `F8-36`).
- Given a confirmed mark, when its time renders, then it is the time the server recorded and it carries no provenance tier, as a record fact under the `Q59` date rule (`M09-71`, `F8-02`).
- No Given/When/Then line covers `M09-33` (REC — suggested day order) in the PRD's acceptance blocks; the requirement text quoted in the brief is the binding criterion, and the suggestion must be acceptable or ignorable, never forced.
- (`M09-20`'s acceptance line tested the no-connection half of that row and is removed 2026-08-07 with the offline/sync capability. `M09-20`'s surviving halves — a visit's status only moves forward, and server apply order decides ordering, never a device clock — are `F4-17` and `F4-19`, built in `tasks/F-platform.md`.)
- *Row removed 2026-08-07 by owner decision: `M09-36` (the attendance day-start / day-end mark) was deleted with the offline/sync capability, and its acceptance line went with it. Its connectivity half — the ruling-Q15 consequence that in a no-signal area the day and the tracking window start only when the mark reaches the server — died correctly with the boundary. **Its other half did not, and no live row carries it:** an attendance day-start or day-end mark is recorded only when the server has it — until then the action is shown to the person as waiting, never as a success, and no attendance record is displayed as recorded before it is acknowledged. `M09-35` establishes only that attendance is two marks a day; `M09-37` governs only that a first check-in offers the day start rather than deriving it; `M09-39` governs absence, not acknowledgement; and `F8-36`'s no-optimistic-result clause is conditioned on an action that cannot be performed — the failure branch, not the in-flight branch this obligation governs. **Open for the owner: this obligation has no live carrier and is built by no task in this file.** Compounding it, `ux/briefs/SCR-M09-02-my-day-route.md` carries no 2026-08-07 amendment note — it still prints `M09-36` as a requirement and still specifies an `attendance-waiting` state citing it; the brief owner must resolve that pointer, and this task cannot close against an `M09-36` state.* **Closed 2026-08-15:** the owner ruled on that open question (register `Q64`) and the orphaned obligation is now carried by the new live row `M09-71`, quoted verbatim above and built by this task — `M09-36` itself stays deleted, this record of its deletion stays true, and the brief was repointed in the same wave — `ux/briefs/SCR-M09-02-my-day-route.md` now quotes `M09-71` in full and its `attendance-waiting` state cites it, with `M09-36` surviving there only inside the file's own dated amendment notes. Nothing is left outstanding on either side.
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M09-003 · Visit Stop Detail screen

**Type:** screen · **Tier:** P0
**PRD rows:** M09-27 (P0), M09-31 (P0)
**DESIGN:** SCR-M09-03 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M09-03-visit-stop-detail.md`; they are the specification. Every PRD row of this task is quoted in full in that brief; no additional rows need quoting here.
**DONE WHEN:**

- Given a visit with a planned window and an actual arrival, when it renders, then both are shown and the difference is stated as a difference, with no rating, score or ranking (`M09-27`, `M09-09`).
- Given a visit marked could-not-complete, when it is saved, then a reason is present and the save is refused without one (`M09-31`).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M09-004 · Team Field Day screen

**Type:** screen · **Tier:** P0
**PRD rows:** M09-43 (P0), M09-48 (P0), M09-59 (P0), M09-61 (P0), M09-63 (P2)
**DESIGN:** SCR-M09-04 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M09-04-team-field-day.md`; they are the specification. Every PRD row of this task is quoted in full in that brief; no additional rows need quoting here. M09-24 (open check-in surfacing) is also quoted verbatim in this brief because the exception rows surface here too; it is dispositioned at T-M09-002.
**DONE WHEN:**

- Given the live-location surface, when it opens, then its default view answers who is working and where each person is in their plan, and the moving-position map is a second view of the same people rather than the front door (`M09-43`).
- Given a device that cannot reach the server, when the team view renders that person, then it shows a last-known position labelled with its time and no current position (`M09-48`).
- Given a coordinator with team field scope, when the team view opens, then it lists every person in scope with their day state, ordered by what needs attention, before any map is shown (`M09-59`).
- Given a person for whom tracking is off, when they render on the team view, then their recorded acts are shown and the surface states that live position is unavailable because tracking is off (`M09-61`).
- Given any team surface, when it renders, then no score, ranking, comparison metric or target attainment appears for any person (`M09-09`).
- No Given/When/Then line covers `M09-63` (REC — nearest-available dispatch) in the PRD's acceptance blocks; the requirement text quoted in the brief is the binding criterion — tracked seats only, proposal-then-assign in one step, never an automatic assignment.
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M09-005 · Activity Timeline screen

**Type:** screen · **Tier:** P0
**PRD rows:** M09-45 (P0), M09-54 (P0), M09-56 (P0)
**DESIGN:** SCR-M09-05 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M09-05-activity-timeline.md`; they are the specification. Every PRD row of this task is quoted in full in that brief; no additional rows need quoting here. M09-45 also binds SCR-M09-06 (Day Playback) and is quoted verbatim in that brief too; it is dispositioned here. M09-66 (the own-record right) is also quoted verbatim in this brief; it is dispositioned at T-M09-002.
**DONE WHEN:**

- Given an untracked employee's day, when their activity timeline is opened, then it renders every act they recorded and states that movement playback is unavailable because tracking is off (`M09-54`, `M09-55`, `M09-61`).
- Given a period with no position data, when the route timeline renders, then a break of that duration is shown and no line, curve or estimate spans it (`M09-45`).
- Given any entry on a timeline, when it renders, then it identifies whether it is an act a person performed, an event the system observed, or an unrecorded interval (`M09-56`).
- Given a correction to a timeline-bearing record, when it is applied, then the original entry remains readable and the correction appears as an appended entry (`M09-56`, `M09-38`).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M09-006 · Day Playback screen

**Type:** screen · **Tier:** P0
**PRD rows:** M09-55 (P0)
**DESIGN:** SCR-M09-06 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M09-06-day-playback.md`; they are the specification. Every PRD row of this task is quoted in full in that brief; no additional rows need quoting here. M09-45 (gaps never interpolated) is also quoted verbatim in this brief and binds this screen's replay; it is dispositioned at T-M09-005. M09-57's retention window bounds which days are replayable; it is dispositioned at T-M09-012.
**DONE WHEN:**

- Given a tracked employee's day containing an interval with no positions, when the day is played back, then the interval renders as a gap of that duration and no path spans it (`M09-55`, `M09-45`).
- Given an untracked employee's day, when their activity timeline is opened, then it renders every act they recorded and states that movement playback is unavailable because tracking is off (`M09-54`, `M09-55`, `M09-61`).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M09-007 · Site Geofence screen

**Type:** screen · **Tier:** P0
**PRD rows:** M09-49 (P0), M09-50 (P0)
**DESIGN:** SCR-M09-07 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M09-07-site-geofence.md`; they are the specification. Every PRD row of this task is quoted in full in that brief; no additional rows need quoting here. M09-50 also binds SCR-M09-01 (the tenant default radius) and is quoted verbatim in that brief too; it is dispositioned here.
**DONE WHEN:**

- Given a site with no geofence anchor in `modules/M08`, `modules/M04` or `modules/M02`, when a user attempts to create a geofence, then no new place is created and the user is directed to the module that owns the site (`M09-49`).
- Given a geofenced site, when its radius is set, then a radius below the typical accuracy of a consumer position fix is refused with the reason named, and a site with no radius has no fence (`M09-50`).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M09-008 · Tracked-seat toggle service

**Type:** engine · **Tier:** P0
**PRD rows:** M09-10, M09-11, M09-15, M09-65
**Requirements (verbatim):**

- **M09-10** (P0) — **Tracking is off for every employee until it is deliberately turned on.** A new employee, an invited employee and an employee whose role changes all start untracked. There is no default-on state, no tenant-wide "track everyone" setting that pre-answers the per-employee decision, and no automatic enablement derived from a preset, a team or a job type.
- **M09-11** (P0) — **Only the EPC Owner may move the toggle, and it is moved one person at a time.** The grant is `F2.M09.toggle-tracked-seat`, Owner-only for the same reason `F2.M01.manage-tenant-settings` is: it commits the tenant commercially (`BM-22`) and it is the act on which the market's privacy posture turns (§M09.10). Moving it is an audited event (`F2-22`).
- **M09-15** (P0) — **A tracked seat belongs to a person, never to a device, a role or a job.** Tracking does not follow a preset, is not granted by holding `F2.M09.field-visibility`, and is not attached to a phone that several people share. One person toggled on is one tracked seat, on whichever of their devices they are signed into.
- **M09-65** (P0) — **Law 2 — tracking is owner-toggled, per employee, and never derived.** The only way an employee becomes tracked is the EPC Owner moving that employee's toggle (`M09-10`, `M09-11`). No preset, team, job type, project assignment, plan tier or platform behaviour turns tracking on, and there is no tenant-wide setting that pre-answers the per-person decision.

**DONE WHEN:**

- Given a newly invited employee, when their record is opened, then tracking is off and nothing in their preset, team or job turned it on (`M09-10`).
- Given a user who is not the EPC Owner, when they open an employee's record, then no control that moves the tracking toggle is present or reachable (`M09-11`).
- Given two people signing into the same shared device, when their tracking states are read, then each state follows the person rather than the device, and a second tracked seat exists only if that second person is toggled on (`M09-15`).
- Given any mechanism in the product other than the EPC Owner's per-employee toggle, when it is exercised, then no employee becomes tracked as a result (`M09-65`).

---

### T-M09-009 · Capability gating: the included set and the tracked bundle

**Type:** policy · **Tier:** P0
**PRD rows:** M09-02, M09-03, M09-05, M09-17, M09-18, M09-42, M09-53
**Requirements (verbatim):**

- **M09-02** (P0) — **The included boundary, carried from `DD7` without paraphrase: "Included in every tier: site check-in/out and visit logging (part of the core visit workflow)."** These three capabilities are available to **every employee of every tenant on every tier**, require no tracked seat, cost no add-on, and are never gated by plan, entitlement, role-tier or usage state. An EPC that never buys a single tracked seat has full check-in, check-out and visit-logging capability across its whole team, permanently.
- **M09-03** (P0) — **The tracked boundary, carried from `DD7` without paraphrase: "Per-seat bundle covers live location, route timeline, geofencing, movement history, activity playback."** Those five capabilities exist for an employee **only while the EPC Owner has tracking toggled on for that employee**. The list is closed: no sixth capability is added to the bundle by this document, and none of the five is available to an untracked employee in a reduced form, a preview, a sample or a trial state.
- **M09-05** (P0) — **The boundary is closed in both directions, and where `DD7` is silent this document states its reading rather than assuming one.** `DD7` names five capabilities in the per-seat bundle and three in the included set. Three of the brief's ten are named in neither list: **attendance**, **team visibility**, and the **activity timeline** (`DD7` says "activity playback", the brief says "Activity timeline"). **Reading CONFIRMED as final (owner ruling 2026-08-04, Q38):** the per-seat bundle's list is closed (`M09-03`), and `DD5` forbids gating a *feature* by tier at all — so a capability outside that closed list is **included for every employee on every tier**. Attendance (§M09.5), team visibility (§M09.9) and the activity **timeline** — the ordered record of check-ins, check-outs, visits and logged activity — are **included free for every worker**; the paid seat is purely the GPS bundle: live location, route timeline, geofencing, movement history, activity **playback** (the map replay that can only be rendered from the location stream a tracked seat produces). The `DD7` boundary is closed exactly as this row read it.
- **M09-17** (P0) — **A tracked seat that is exhausted, unpaid or suspended never silently degrades into a false picture.** Where the tenant's billing state restricts the capability, the tracked surfaces state which capability is unavailable and why, and the included capabilities of `M09-02` continue working unaffected — check-in, check-out and visit logging are never gated by billing state in any degree, and read and export always work (`BM-23`, the soft-block law of §04.5, `F1-24`(a)). What the product must never do is keep drawing a route timeline from a location stream it is no longer collecting.
- **M09-18** (P0) — **Check-in and check-out are available to every field employee, on every tier, with no tracked seat.** They are the included half of `DD7` (`M09-02`) and the core of the visit workflow: the act by which a person says *I am here* and *I am done here*. No plan state, entitlement, add-on or usage counter gates either one.
- **M09-42** (P0) — **Live location exists only for a tracked seat, and only inside the ruled tracking window — the worker's day-start → day-end marks, bounded by the tenant's force-stop hour (`M09-44`, owner ruling 2026-08-04 Q39).** Both conditions are necessary and neither is sufficient alone: an untracked employee has no live location at any hour (`M09-03`), and a tracked employee has none outside the window (`M09-64`). There is no manual override that collects a position outside the window, no "just this once" control, and no surface that requests a position from a device that is not currently inside both conditions.
- **M09-53** (P0) — **No tracked seat, no geofence.** Geofencing is inside the per-seat bundle (`M09-03`), so an untracked employee crosses no fences, receives no prompts and generates no crossing events. Their check-in is unaffected in every way (`M09-18`), and no surface offers them a degraded or preview version of the capability.

**DONE WHEN:**

- Given any tenant on any tier with zero tracked seats, when any employee checks in, checks out or logs a visit, then the action succeeds and no entitlement, plan state or usage line gates it (`M09-02`).
- Given an employee for whom tracking is toggled off, when any surface in this module renders, then no live position, route timeline, geofence, movement history or day playback exists for that employee in any form, including a preview or sample (`M09-03`).
- Given attendance, team visibility or the activity timeline, when a reader asks which side of the seat boundary they sit on, then this document states its adopted reading and names `Q38` as the question it did not answer (`M09-05`).
- Given a tenant in a restricted billing state, when a field employee checks in, checks out or logs a visit, then the action succeeds unaffected (`M09-17`, `BM-23`).
- Given a tenant with zero tracked seats, when any field employee checks in, then the act succeeds and no capability of `M09-03` becomes available as a side effect (`M09-18`, `M09-03`).
- Given an employee for whom tracking is off, when any live-location or route-timeline surface is opened, then that employee is absent from it entirely, with no placeholder position (`M09-42`, `M09-03`).
- Given a tracked employee outside the declared work-hours window, when the live map renders, then no position is collected or shown for them and the surface states the reason (`M09-42`, `M09-64`).
- Given an employee for whom tracking is off, when they arrive at a geofenced site, then no crossing event exists for them and no prompt appears (`M09-53`).

---

### T-M09-010 · Location capture pipeline & work-hours collection gate

**Type:** engine · **Tier:** P0
**PRD rows:** M09-22, M09-46, M09-64
**Requirements (verbatim):**

- **M09-22** (P0) — **A check-in position is `measured`, and it carries its accuracy.** The four provenance tiers are closed and `measured` is defined as *"(on site)"* — which is literally what a satellite fix taken by a person standing on the site is, and this module is the one place in the suite where the tier's definition and the act coincide exactly. The fix carries its **accuracy radius** and is rendered as an area rather than a point where the radius is wide; a low-accuracy fix is shown as a low-accuracy fix, never rounded up into a confident dot (`foundations/F8` §F8.1: precision is not provenance).
- **M09-46** (P0) — **A position is `measured`, carries its accuracy, and a low-accuracy fix is never rendered as a confident one.** The tier vocabulary is closed and `measured` is *"(on site)"* — which a satellite fix taken where the person is standing satisfies literally, and this module notes the alignment rather than stretching the definition. Every position carries its accuracy radius; a wide fix renders as an area, a stale fix renders with the age of the fix beside it, and neither is upgraded by being drawn on a map.
- **M09-64** (P0) — **Law 1 — tracking happens only during work hours.** No position, route, geofence evaluation or movement record is produced for any employee outside the tenant's declared work-hours window (`M09-44`), on any device, in any state, for any reason. There is no exception for an open check-in, an overrunning job, an emergency or an owner request; a window that needs to be wider is widened as a declared window, prospectively, with the employees told (`M09-13`).

**DONE WHEN:**

- Given a check-in position, when it is rendered anywhere in the product, then it carries the `measured` tier and its accuracy, and a wide fix renders as an area rather than a point (`M09-22`).
- Given a position with a wide accuracy radius, when it renders on any surface, then the accuracy is rendered with it and the position is not drawn as a precise point (`M09-46`).
- Given any employee and any time outside the tenant's declared work-hours window, when any location, geofence or movement collection is attempted, then none occurs and no record is produced (`M09-64`).

---

### T-M09-011 · Geofence crossing evaluation service

**Type:** engine · **Tier:** P0
**PRD rows:** M09-52
**Requirements (verbatim):**

- **M09-52** (P0) — **A crossing is evaluated and recorded server-side, and the prompt it raises is never a dependency of the core workflow.** The evaluation happens on the server, against the position stream only a tracked seat produces; the prompt it raises is a convenience of the tracked bundle. What the day actually runs on is the included check-in of `M09-18`, which every employee has on every tier, with or without a fence and with or without a prompt.

**DONE WHEN:**

- (`M09-52`'s acceptance line tested the no-connection consequence and is removed 2026-08-07 with the offline/sync capability; the requirement text above is the binding criterion — a crossing is evaluated and recorded server-side, and the ordinary check-in is never dependent on it.)

---

### T-M09-012 · Location retention & data-rights reach

**Type:** engine · **Tier:** P0
**PRD rows:** M09-57, M09-69
**Requirements (verbatim):**

- **M09-57** (P0) — **GPS movement-trail retention is 90 days rolling, auto-deleted after (owner ruling 2026-08-04, Q40); attendance, visit records and check-ins — the non-GPS business records — are retained unaffected.** The 90-day rolling window is the product's retention law for location trails and playback data; a market's `pack.data-rights` determination may set a stricter (shorter) period and the pack then wins — the retention fact rides in the pack's data-rights note per market. Tenant-level **read and export always work** in every billing state (`F1-24`(a)), and **erasure is anonymisation, never row deletion**, with the market's statutory carve-outs honoured (`F1-24`(b)).
- **M09-69** (P0) — **Export and erasure rights reach location history, unchanged.** Tenant-level **read and export always work** in every billing state, including for field and location records (`F1-24`(a)); **erasure is anonymisation, never row deletion**, honouring the market's statutory carve-outs (`F1-24`(b)); and the market's own rights map — the access/export path and its SLA — governs an individual employee's request (`F1-23`, IN instance `F1-56`). No requirement in this module weakens any of that, and nothing about location's sensitivity is used as a reason to withhold it from the person it describes (`M09-66`).

**DONE WHEN:**

- Given any billing state, when a tenant exports their field records, then the export succeeds (`M09-57`, `F1-24`(a)).
- Given any billing state, when a tenant exports its field and location records, then the export succeeds; and given an erasure request, then records are anonymised rather than deleted (`M09-69`, `F1-24`).

---

### T-M09-013 · Field audit events, including location-read audit

**Type:** integration · **Tier:** P0
**PRD rows:** M09-70
**Requirements (verbatim):**

- **M09-70** (P0) — **Every tracking toggle and every read of another person's location is an audited event.** The audit log's covered-events list is `F2-22`'s acceptance checklist, and this module adds its own events to it: tracking toggled on or off (actor, subject), a geofence created or its radius changed, an attendance correction made by someone other than its subject, and **each access to another person's live position, route timeline or movement playback** (viewer, subject, when). The log is tenant-scoped, retained and exportable by the tenant (`F2-23`).

**DONE WHEN:**

- Given a read of another person's live position, route timeline or movement playback, when it occurs, then an entry naming the viewer, the subject and the time exists in the tenant's audit log (`M09-70`, `F2-22`).

---

### T-M09-014 · REC: lone-worker open check-in escalation

**Type:** engine · **Tier:** P2
**PRD rows:** M09-25
**Requirements (verbatim):**

- **M09-25** (P2) — **`REC` — lone-worker safety escalation.** An open check-in that passes a tenant-set duration on a site raises an escalation to the person's coordinator: *"Ravi has been checked in at Sharma residence for 4 h 20 m and has not checked out."* The escalation is a notification, not an alarm, and never a location disclosure for an untracked employee beyond the check-in the person themselves made.

**DONE WHEN:**

- No Given/When/Then line covers `M09-25` in the PRD's acceptance blocks; the requirement text above is the binding criterion, and the row's rationale and conditions in `prd/registers/enhancements.md` bind alongside it. The escalation is a notification (registered with F6), never an alarm, and never a location disclosure for an untracked employee beyond the check-in the person themselves made.

---

### T-M09-015 · Field visit object & cross-module stop integration

**Type:** integration · **Tier:** P0
**PRD rows:** M09-26, M09-29, M09-30
**Requirements (verbatim):**

- **M09-26** (P0) — **A visit is a planned stop: a place, a window, a person assigned to it, and a reason it exists.** Visit logging is included for every employee on every tier (`M09-02`, `BM-23`). This module owns the **field-side visit** — the stop on someone's day, its check-in/out, its outcome and its place on the timeline. It does **not** own the objects other modules already own, and the distinction is stated because two published documents describe visits from two sides: a **survey visit** is `modules/M04`'s object with its own states and capture flow (`M04-38`, `M02-46`), and it *appears here* as a stop on the surveyor's day; `foundations/F4`'s conflict-policy note (`F4-17`) assigns the general visit object and its states to this module. **Adopted reading, stated as a choice:** the two are compatible because they are different objects — every survey visit is a field stop, not every field stop is a survey visit — and neither document is edited to say so.
- **M09-29** (P0) — **A survey visit is a field visit, and this module adds only what `modules/M04` does not own.** The Survey Engineer's home is `modules/M04`'s visits-today screen (`M04-38`), and their capture flow, survey versions and deliverable are `modules/M04`'s. What this module contributes to that same day is the check-in/out record, the visit's place on the activity timeline, and — where the Owner has toggled the surveyor on — the tracked capabilities of `M09-03`. Nothing in `modules/M04` is restated, re-tiered or re-scoped here.
- **M09-30** (P0) — **A project site is a stop, and the project owns everything about it except the presence record.** Visits to a `modules/M08` project site — a delivery, a check, an installation day — appear on the assigned person's route and produce check-in/out records here; the project's stage, blockers, documents, checklist and money are `modules/M08`'s and appear nowhere in this module (`M08-01`'s closed surface set is not widened by this document). The project site is also the anchor a geofence attaches to (§M09.7).

**DONE WHEN:**

- Given a survey visit and an ad-hoc field stop, when each is read, then the survey visit resolves to `modules/M04`'s object with its own states and capture flow and the field stop to this module's, and neither document is contradicted (`M09-26`).
- Given a survey visit, when it is read in this module, then it renders as a stop with its presence record and no survey content, version or capture surface is duplicated here (`M09-29`).
- Given a visit to a project site, when it is completed here, then a presence record exists and no project stage, blocker, document or checklist state was written (`M09-30`, `M09-08`).

---

### T-M09-016 · Attendance corrections: append-only store

**Type:** engine · **Tier:** P0
**PRD rows:** M09-38
**Requirements (verbatim):**

- **M09-38** (P0) — **An attendance record is corrected by appending, never by silent edit.** A correction — a wrong day start, a missing day end, a record marked on the wrong day — is a new entry carrying the corrected value, a **mandatory reason**, its author and its time; the original stays readable. Every correction is an audited event (`F2-22`), and a correction made by someone other than the person it concerns is attributed to the person who made it and visible to the person it concerns.

**DONE WHEN:**

- Given a correction to an attendance record, when it is saved, then it carries a reason and an author, the original remains readable, and the event appears in the audit log (`M09-38`, `F2-22`).
- Given a correction to a timeline-bearing record, when it is applied, then the original entry remains readable and the correction appears as an appended entry (`M09-56`, `M09-38`).

---

### T-M09-017 · REC: arrival window on the customer link (M09 side)

**Type:** integration · **Tier:** P2
**PRD rows:** M09-34
**Requirements (verbatim):**

- **M09-34** (P2) — **`REC` — customer-facing arrival window on the customer link.** Surfacing "your technician is on the way, arriving within the hour" on the existing no-login customer link (`foundations/F5`), derived from the assigned visit rather than from a live position.

**DONE WHEN:**

- No Given/When/Then line covers `M09-34` in the PRD's acceptance blocks; the requirement text above is the binding criterion, and the row's rationale and conditions in `prd/registers/enhancements.md` bind alongside it — including that it discloses field data on a customer surface and that register `Q33` (the customer send channel) is not answered by it. The window derives from the assigned visit, never from a live position. The customer-facing surface is SCR-F5-02 (T-F5-002 in `tasks/F5-customer-link.md`); this row is quoted verbatim in `ux/briefs/SCR-F5-02-link-progress.md`.

---

## Laws (enforced through screens and review, no standalone build)

- **M09-08** (P0) — **This module holds no pipeline, no project state and no employee record.** A check-in does not move a lead's stage, a visit does not advance a project, and an attendance mark does not create or alter a person. What this module writes is the field record: presence, place, time and the visit it belongs to. Everything it touches belongs to a module that already owns it — the lead and the booking act to `modules/M02` (`M02-46`), the survey and its visit to `modules/M04`, the project and its site to `modules/M08`, the employee and the attendance register to `modules/M10-hr-lite.md` — and this module reads and reciprocates rather than duplicating.
  *Enforced by:* T-M09-015's read-and-reciprocate integration boundary (the field-visit service holds no write path into lead, project, survey or employee state) and review of every M09 write path against the PRD's own check: "Given any act recorded by this module, when it commits, then no lead stage, project stage, survey version or employee record is created or altered by it (`M09-08`)."
- **M09-09** (P0) — **Nothing in this module scores a person.** There is no productivity score, no efficiency rating, no ranking of employees against each other, no league table and no target attainment on any field surface. The product reports **facts with their gaps stated** — where someone was, when they arrived, how long they stayed, what is not known — and leaves the judgement to the human being who manages them. This is not a stylistic preference: a score computed from location data of uneven quality (`M09-45`, `M09-46`) would be a confident-looking number built on honest ones, which `foundations/F8` §F8.1's precision-is-not-provenance principle forbids, and it is the specific thing the persona's own pain names — *"Being surveilled rather than supported"* (`PS-22`).
  *Enforced by:* every M09 screen task (T-M09-001 … T-M09-007) and product-wide review against the PRD's checks: "Given any field surface in the product, when it renders, then it contains no score, rating, ranking or league position for any person (`M09-09`)." and "Given any team surface, when it renders, then no score, ranking, comparison metric or target attainment appears for any person (`M09-09`)."
- **M09-39** (P0) — **Absence is never inferred.** No attendance record for a day means **no record for that day** — it does not mean absent, off, on leave or unaccounted for, and no surface in this module renders it as any of those. Whether a person was absent is a fact `modules/M10` holds (leave, holiday, roster), and this module's attendance surface shows what it has and names what it does not (`F8-01`). A blank is not a verdict.
  *Enforced by:* the rendering built in T-M09-004 and T-M09-005 and the shared attendance surface contract with `prd/modules/M10-hr-lite.md`; PRD check: "Given a day with no attendance record, when it renders on any surface in this module, then it reads as "no record" and never as absent, off or on leave (`M09-39`)."
- **M09-41** (P0) — **HR/Admin reads attendance and nothing else in this module.** The HR/Admin preset holds `F2.M09.attendance-visibility` at tenant scope and holds **no** field-work visibility: no live position, no route timeline, no movement history, no geofence event and no day playback is reachable by that preset from any surface. The people-records domain proper is `modules/M10`'s to define (Task 23); this row is deliberately the narrow attendance slice so that document can add the rest without re-ruling it.
  *Enforced by:* F2 grant wiring — HR/Admin holds `F2.M09.attendance-visibility` and no field-work grant — checked on every M09 read surface (T-M09-004, T-M09-005, T-M09-006); PRD check: "Given a user holding only the HR/Admin preset, when they open any surface in this module, then attendance is reachable and no position, route, movement, geofence or playback is (`M09-41`)."
- **M09-47** (P0) — **Location ingestion for a tracked seat is covered by the seat, and there is no second meter.** Continuous position ingestion, processing and retention for tracked seats are inside the per-seat price (`BM-22`), and the ingestion of the **included** capabilities — the position on a check-in, on a check-out, on a logged visit — is an absorbed cost that is never metered to the tenant (`BM-24`). No surface in this module shows a usage counter, an allowance or an overage for location.
  *Enforced by:* review — no location usage counter, allowance or overage is built on any M09 surface, and the meter set stays `prd/modules/M12-platform-billing.md`'s closed set; PRD check: "Given any location surface, when it renders, then no usage counter, allowance or overage figure for location appears anywhere on it (`M09-47`)."
- **M09-58** (P0) — **The timeline is one surface, scoped — never a different surface per role.** A person reading their own timeline, a coordinator reading their team's and an owner reading anyone's see the **same** surface with the same vocabulary and the same honesty, differing only in whose days are reachable (`F2-12`'s law, verbatim in F2: *"The same screen, scoped"*). No role gets a richer rendering of the same day, and no role gets a summarised one that hides a gap the other sees.
  *Enforced by:* T-M09-005 being the single timeline surface, scoped by F2 grants, with no role variant built; PRD check: "Given the same day read by its owner, their coordinator and the EPC Owner, when each opens the timeline, then all three see the same surface with the same entries and the same gaps, differing only in which days they can reach (`M09-58`)."
- **M09-60** (P0) — **Team visibility resolves in the field-work domain, and that domain never leaks into or out of another.** `F2-14` establishes **field work** as its own visibility domain with the ladder **Own ⊂ Team ⊂ All**, and holding a wide scope elsewhere never widens it — F2's own worked example is a Sales Manager who also holds Field Technician and *"sees the team's leads and only their own route"*. This module honours that unchanged: no preset gains field scope from a lead, project, people or money scope. **What does travel is the record's own facts:** whether a booked visit was attended, when and for how long is readable on the **lead** or **project** it belongs to, by whoever can already open that record — which is how a Sales Manager learns their team's surveyor arrived without holding any field-work scope (`M09-28`).
  *Enforced by:* F2's per-domain grant resolution applied on every M09 surface (T-M09-002 … T-M09-006); the visit facts travel on the lead/project record via T-M09-015 and SCR-M02-04. PRD checks: "Given a user holding only the Sales Manager preset, when they attempt to open a field-work surface, then no person's field day is reachable, and the visit facts on their team's leads remain readable (`M09-60`, `M09-28`)." and "Given a user holding a wide scope in the leads or projects domain and none in field work, when any field surface is opened, then no field day is visible to them (`M09-60`, `F2-14`)."
- **M09-67** (P0) — **Law 4 — per-market employee-privacy compliance is `pack.data-rights` data, and this document restates no market's rules.** The jurisdiction's determination — the platform's role for employee data, residency, the data-principal rights map with its paths and SLAs, notice and consent obligations for workforce location, and breach duties — is `pack.data-rights` content (`F1-23`), authored per market and never tenant-editable. A tenant configures **within** the floor its market sets, never around it (`F1-12`). Where a market's determination imposes a stricter rule than any requirement in this module, the pack wins.
  *Enforced by:* `pack.data-rights` configuration consumed by T-M09-008 (the toggle, including M09-68's disable), T-M09-010 (window and collection) and T-M09-012 (retention and rights) — the stricter pack rule wins — plus review that no market rule is hardcoded in this module; PRD check: "Given a market whose `pack.data-rights` determination imposes a stricter workforce-tracking rule than this module states, when the two are compared, then the pack governs and this module's text restates none of it (`M09-67`)."

---

## Realized elsewhere

- **M09-01** (P0) — **This module specifies exactly ten capabilities, and the list is the brief's.** Live location · attendance · visit tracking · route timeline · site check-in · site check-out · geo-fencing · activity timeline · daily movement · team visibility. Each has its own feature area below, each is tagged `BRIEF` against the attestation, and **no eleventh capability enters core scope**. A capability this suite believes is valuable but the brief did not name is a `REC` row, in its area for context and in `registers/enhancements.md` with its rationale — which is the "Clearly distinguish: Source-derived features, Recommended enhancements" the brief asks for, made structural.
  *realized-by:* the feature-area rows of `prd/modules/M09-field-workforce.md` §M09.2–§M09.10, dispositioned throughout this file; `prd/registers/enhancements.md` carries the REC labelling.
- **M09-06** (P0) — **The studied category is read at capability level, and its surplus is excluded by name.** The brief's instruction is carried as a law of this module: *"We do NOT want to replicate TrackoBit… Do NOT copy unnecessary fleet-management features."* No surface, workflow or data object in this document is copied from a studied product; what is taken is the *question* each capability answers for an EPC. The capabilities the studied category carries that an EPC running rooftop solar has no use for are **excluded individually, with this row as their authority**, in §5 — they are non-goals with a stated rationale, not unbuilt backlog. Adding one is an owner ruling, not a local decision inside this module.
  *realized-by:* `prd/modules/M09-field-workforce.md` §5 non-goals (the fleet surplus excluded by name) and row M09-09 (Laws section of this file).
- **M09-07** (P0) — **Every recommendation this suite makes here is labelled as one.** The brief asks for recommendations — *"Recommend additional field features if valuable"* — and the four this module makes (`M09-25`, `M09-33`, `M09-34`, `M09-63`) appear in their feature areas tagged `REC`, with their conditions attached, and in `registers/enhancements.md` with their rationale. A `REC` row is never phrased, tiered or tabled as though the brief asked for it, and none of the four is a dependency of any `BRIEF` row above or below it.
  *realized-by:* rows M09-25 (T-M09-014), M09-33 (T-M09-002), M09-34 (T-M09-017) and M09-63 (T-M09-004); `prd/registers/enhancements.md`.
- **M09-40** (P0) — **Attendance is a shared surface with `modules/M10-hr-lite.md`, and this module owns the field half only.** What this document owns: the field capture of a day start and a day end, its correction rule and its provenance. What it does not own and does not specify: leave, holidays, rosters, shift patterns, payroll consequences, the attendance register as an HR artefact, or any policy about what a pattern of days means. Those are `modules/M10`'s (design spec §11: *"attendance/leave surfaces shared with M09"*), authored separately, and this module states the hand-off rather than pre-empting it.
  *realized-by:* `prd/modules/M10-hr-lite.md` (the HR half of the shared attendance surface); the field half is built at T-M09-002 (capture) and T-M09-016 (corrections).
- **M09-62** (P1) — **The coordinator's home composition belongs to `modules/M13-dashboards-and-reporting.md`; this module supplies its content.** `PS-34` already places "the field team's current day" on the Operations home and `PS-05` requires one composed home per person; the role-home composition rule is M13's (Task 23). This module states what it provides — the day-in-progress list, the exceptions on it, and the tracked additions where they exist — and specifies no home screen of its own.
  *realized-by:* `prd/modules/M13-dashboards-and-reporting.md` (role-home composition); the content it composes is built at T-M09-004 (the day-in-progress list and its exception rows) under T-M09-009's gating.

---

## Disposition index

| Row | Disposition |
|---|---|
| M09-01 | realized-by: prd/modules/M09-field-workforce.md §M09.2–§M09.10 rows (this file); prd/registers/enhancements.md |
| M09-02 | T-M09-009 |
| M09-03 | T-M09-009 |
| M09-04 | T-M09-001 |
| M09-05 | T-M09-009 |
| M09-06 | realized-by: prd/modules/M09-field-workforce.md §5 non-goals; M09-09 (LAW) |
| M09-07 | realized-by: M09-25 (T-M09-014), M09-33 (T-M09-002), M09-34 (T-M09-017), M09-63 (T-M09-004); prd/registers/enhancements.md |
| M09-08 | LAW |
| M09-09 | LAW |
| M09-10 | T-M09-008 |
| M09-11 | T-M09-008 |
| M09-12 | T-M09-001 |
| M09-13 | T-M09-002 |
| M09-14 | T-M09-001 |
| M09-15 | T-M09-008 |
| M09-16 | T-M09-001 |
| M09-17 | T-M09-009 |
| M09-18 | T-M09-009 |
| M09-19 | T-M09-002 |
| M09-21 | T-M09-002 |
| M09-22 | T-M09-010 |
| M09-23 | T-M09-002 |
| M09-24 | T-M09-002 |
| M09-25 | T-M09-014 |
| M09-26 | T-M09-015 |
| M09-27 | T-M09-003 |
| M09-28 | T-M09-002 |
| M09-29 | T-M09-015 |
| M09-30 | T-M09-015 |
| M09-31 | T-M09-003 |
| M09-32 | T-M09-002 |
| M09-33 | T-M09-002 |
| M09-34 | T-M09-017 |
| M09-35 | T-M09-002 |
| M09-37 | T-M09-002 |
| M09-38 | T-M09-016 |
| M09-39 | LAW |
| M09-40 | realized-by: prd/modules/M10-hr-lite.md (field half at T-M09-002, T-M09-016) |
| M09-41 | LAW |
| M09-42 | T-M09-009 |
| M09-43 | T-M09-004 |
| M09-44 | T-M09-001 |
| M09-45 | T-M09-005 |
| M09-46 | T-M09-010 |
| M09-47 | LAW |
| M09-48 | T-M09-004 |
| M09-49 | T-M09-007 |
| M09-50 | T-M09-007 |
| M09-51 | T-M09-002 |
| M09-52 | T-M09-011 |
| M09-53 | T-M09-009 |
| M09-54 | T-M09-005 |
| M09-55 | T-M09-006 |
| M09-56 | T-M09-005 |
| M09-57 | T-M09-012 |
| M09-58 | LAW |
| M09-59 | T-M09-004 |
| M09-60 | LAW |
| M09-61 | T-M09-004 |
| M09-62 | realized-by: prd/modules/M13-dashboards-and-reporting.md (content at T-M09-004) |
| M09-63 | T-M09-004 |
| M09-64 | T-M09-010 |
| M09-65 | T-M09-008 |
| M09-66 | T-M09-002 |
| M09-67 | LAW |
| M09-68 | T-M09-001 |
| M09-69 | T-M09-012 |
| M09-70 | T-M09-013 |
| M09-71 | T-M09-002 |
