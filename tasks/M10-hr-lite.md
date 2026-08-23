# M10 · HR-lite — engineering tasks

This file covers module M10 — HR-lite: the people-today queue, the people list, the employee record, the offboard sweep, the attendance register, leave requests, the team-structure view, the employee-record data model bound to M01 identity, the people-records visibility domain, the flat manager mapping that Team scope resolves over, per-employee document storage, and the data-rights integration for employee PII. Task-id prefix: `T-M10-`. Source doc: `prd/modules/M10-hr-lite.md` (rows M10-01 … M10-39). Screen briefs live in `ux/briefs/` (SCR-M10-01 … SCR-M10-07); seven screen tasks carry one screen each, five engine/policy/integration tasks carry the non-screen builds, and six rows are laws enforced through screens and review. Every row's disposition is indexed at the end of this file.

---

### T-M10-001 · People Today Queue screen

**Type:** screen · **Tier:** P0
**PRD rows:** M10-13 (P0), M10-14 (P0), M10-15 (P1), M10-16 (P2), M10-26 (P1)
**DESIGN:** SCR-M10-01 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M10-01-people-today-queue.md`; they are the specification.
**DONE WHEN:**

- Given a pending, an expired and a declined invite, when people-today renders, then all three appear with distinct states and the expired one offers one-tap resend to the Owner (M10-14, M10-15).
- Given a joiner who verified but has not landed on real work, when the queue renders, then their progress state is visible per person (M10-13).
- Given a correction to a day mark, when it lands, then it arrives as M09's append with the original preserved, and the register shows the corrected value with its trail (M10-26).
- (M10-16 carries no dedicated Given/When/Then line in the PRD's acceptance block — §M10.3's block covers M10-14/M10-15 and M10-13 only; the requirement text in the brief is the binding criterion, and its testable form is the brief's `joined-nothing-assigned` state: wherever a joined person's role home would be empty, the queue carries "joined, nothing assigned yet — who to ask" as a queue item, so the gap is closed by a person rather than discovered by the joiner.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M10-002 · People List screen

**Type:** screen · **Tier:** P0
**PRD rows:** M10-10 (P0), M10-11 (P1)
**DESIGN:** SCR-M10-02 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M10-02-people-list.md`; they are the specification.
Non-UI (build-side) half carried by this task: M10-10 — deactivate-never-delete invariant (F2-20 family).
**DONE WHEN:**

- Given a deactivated employee, when the list is filtered to "all", then they appear with status deactivated and their record and documents open read-only intact (M10-10).
- (M10-11 carries no dedicated Given/When/Then line in the PRD's acceptance block — §M10.2's block covers M10-06, M10-08, M10-10 and M10-09/M10-05 only; the requirement text in the brief is the binding criterion, and its testable form is the brief's `normal`, `filtered-by-status` and `filtered-by-preset` states: every employee listed with status, role chips, manager and joined date, filterable by status and by preset, with invite, assign-roles and deactivate deep-linking to `modules/M01`'s Team screens (`M01-19`–`M01-21`) and performed nowhere on this list.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M10-003 · Employee Record screen

**Type:** screen · **Tier:** P0
**PRD rows:** M10-04 (P0), M10-07 (P0), M10-35 (P0), M10-36 (P1)
**DESIGN:** SCR-M10-03 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M10-03-employee-record.md`; they are the specification.
Non-UI (build-side) halves carried by this task: M10-04 — role grants stay F2.M01.manage-team; M10 never widens or delegates. M10-36 — expiry blocks nothing; tenant decides consequences.
**DONE WHEN:**

- Given the HR/Admin preset, when any role-assignment act is attempted from an M10 surface, then the surface offers only a deep link to M01's Owner-gated screens and no grant of its own (M10-04).
- Given a document with an expiry date inside the lead window, when people-today renders for HR/Admin, then the document appears as needing attention, and nothing anywhere is blocked by it (M10-36).
- (M10-07 and M10-35 carry no dedicated Given/When/Then line in the PRD's acceptance blocks — §M10.2's block covers M10-06, M10-08, M10-10 and M10-09/M10-05, and §M10.7's covers M10-36 and M10-39; the requirement text in the brief is the binding criterion for both. M10-07's testable form is the SME-weight field set — identity from the account and the M01 profile, the optional employment facts, presets held rendering as read-only chips — plus the brief's own line "No compensation figure exists anywhere on this screen (M10-07)", which is what "nothing else is asked" checks as: no grade, band, cost centre, salary or compensation field anywhere in the record (§5). M10-35's testable form is the brief's `documents-list` state — documents with type label, upload date, expiry where set and uploader — and `replaced-document-trail`, where replace keeps the prior file visible in the trail (append, never overwrite).)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M10-004 · Offboard Sweep screen

**Type:** screen · **Tier:** P0
**PRD rows:** M10-18 (P0), M10-19 (P0), M10-20 (P0), M10-21 (P0), M10-22 (P0)
**DESIGN:** SCR-M10-04 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M10-04-offboard-sweep.md`; they are the specification. M10-20 appears in no brief and is quoted here:

- **M10-20** (P0) — **Nothing is orphaned and nothing is rewritten.** Every lead, activity, tick, document and money event the person touched stays attributed to them after offboard (F2-20); the sweep reassigns **open** work only and never edits history. Deleting a user does not exist.

Non-UI (build-side) halves carried by this task: M10-18 — offboard defined as revocation plus reassignment, done together. M10-19 — composes open work cross-module; owns no assignment act; nothing silently dropped. M10-21 — F2 guard-rail transitions enforced and audited. M10-22 — deactivation act is Owner-only, never delegated.
**DONE WHEN:**

- Given an offboard confirmed, when it completes, then the person is deactivated with sessions ended, every open item from the sweep is either reassigned via its owning module or explicitly marked left-unassigned, and history attribution is unchanged (M10-18, M10-19, M10-20).
- Given an offboard that would remove the last EPC Owner, when it is attempted, then it is blocked with an explanation and audited (M10-21).
- Given an HR/Admin holder, when they open an offboard, then the sweep renders read-only with no revocation act available (M10-22).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M10-005 · Attendance Register screen

**Type:** screen · **Tier:** P0
**PRD rows:** M10-25 (P0), M10-28 (P2)
**DESIGN:** SCR-M10-05 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M10-05-attendance-register.md`; they are the specification.
Non-UI (build-side) half carried by this task: M10-28 — distinct data from F1-50 calling-window holiday calendar.
**DONE WHEN:**

- Given a person with no marks on a day, when the register renders, then the day is "unmarked" and no absent state, score or colour-coded judgement appears (M10-24, M10-25).
- (M10-28 carries no dedicated Given/When/Then line in the PRD's acceptance block — §M10.5's block covers M10-24/M10-25, M10-27, M10-30 and M10-26 only; the requirement text in the brief is the binding criterion, and its testable form is the brief's `holiday` state: a tenant-declared holiday renders as a holiday and implies nothing about any person's day beyond the label, with the zero-config case — no holiday calendar and no leave types configured — still rendering facts and unmarked days (`empty-zero-config`). The distinctness from `F1-50`'s calling-window calendar is the build-side half noted above.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M10-006 · Leave Request screen

**Type:** screen · **Tier:** P0
**PRD rows:** M10-27 (P0)
**DESIGN:** SCR-M10-06 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M10-06-leave-request.md`; they are the specification.
Non-UI (build-side) half carried by this task: M10-27 — no accrual arithmetic; leave types are tenant-configured labels.
**DONE WHEN:**

- Given a leave request, when it is decided, then the decision is attributed (who, when), the requester is notified, and approved days render as leave on the register (M10-27).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M10-007 · Team Structure screen

**Type:** screen · **Tier:** P0
**PRD rows:** M10-34 (P0)
**DESIGN:** SCR-M10-07 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M10-07-team-structure.md`; they are the specification.
Non-UI (build-side) half carried by this task: M10-34 — fail closed; unmapped never widens to everyone.
**DONE WHEN:**

- Given a Team-scope holder with no reports, when their team view renders, then it is the teaching empty state and no wider data appears (M10-34).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

---

### T-M10-008 · Employee record data model bound to M01 identity

**Type:** engine · **Tier:** P0
**PRD rows:** M10-03, M10-06, M10-08
**Requirements (verbatim):**

- **M10-03** (P0) — **One person, one identity.** An employee record **is** the M01 user seen from the people side: keyed by the same phone identity (E.164, `M01-18`), carrying the same invited / active / deactivated status, never a parallel account. No person exists in this module who cannot be explained by `modules/M01`'s user lifecycle, and no record here can log in, hold a role or receive an assignment independently of it.
- **M10-06** (P0) — **One record per employee, created at invite.** The record exists from the moment the invite is sent (status invited), fills in as the person onboards, and persists after deactivation. There is no separate "create employee" act — inviting is creating (`M01-12`'s flow), and the record is its people-side view.
- **M10-08** (P0) — **The record never diverges from account truth.** Identity fields mirror the M01 profile and are corrected there (the person's own profile act); employment facts are edited here by HR/Admin or the EPC Owner; preset chips mirror F2 live. The same fact is never stored twice — the source's failure to avoid is "people, attendance and documents in three places is how an SME ends up trusting none of them" (`02-personas.md` §HR/Admin Pains).

**DONE WHEN:**

- Given any person visible in this module, when their record is opened, then it resolves to an M01 user with the same phone identity and status, and no second account exists (M10-03).
- Given an invite sent, when the people list renders, then the person appears with status invited and a record exists (M10-06).
- Given a record, when identity fields are compared with the M01 profile, then they are the same values from the same source, and editing them here is not possible (M10-08).

---

### T-M10-009 · People-records visibility domain enforcement

**Type:** policy · **Tier:** P0
**PRD rows:** M10-05, M10-09, M10-30
**Requirements (verbatim):**

- **M10-05** (P0) — **People records are their own visibility domain.** Records, documents and leave resolve in `F2-14`'s **people records** domain (HR/Admin and EPC Owner at tenant scope; every employee at own scope); holding a wide scope in any other domain — leads, projects, field work — never opens a people record (`F2-14`'s per-domain independence). The §F2.5-M10 rows this module appends are its only permission truth.
- **M10-09** (P1) — **Everyone reads their own record.** An employee sees their own record and documents without any grant — own scope by construction (the precedent is `F2.M09.mark-attendance` and `M09-66`'s own-record law). What they cannot do is edit employment facts or read anyone else's record.
- **M10-30** (P0) — **HR/Admin sees attendance and nothing else of the field.** The register reaches HR/Admin through `F2.M09.attendance-visibility` (All — the attendance slice only); no route, position, geofence event or movement fact is reachable from any register surface, for any preset, ever. `M09-41` states the law; this module's surfaces are built under it.

**DONE WHEN:**

- Given a holder of Team lead visibility and no people-records grant, when they attempt to open an employee record, then the people-records domain denies it (M10-05).
- Given any employee, when they open their own record, then it renders fully; when they open another's, then the people-records domain denies it (M10-09, M10-05).
- Given any register surface opened by HR/Admin, when its content is audited, then no location, route or geofence fact appears (M10-30).

---

### T-M10-010 · Manager mapping: membership data, Team-scope resolution & change controls

**Type:** engine · **Tier:** P0
**PRD rows:** M10-31, M10-32, M10-33
**Requirements (verbatim):**

- **M10-31** (P0) — **Team structure is a flat manager mapping.** Each employee may name **one manager**; a "team" is exactly the people mapped to a manager — direct reports, no transitive tree, no departments, no org chart (§5). This is deliberately the least structure that makes team-scoped visibility resolvable.
- **M10-32** (P0) — **The mapping is what Team scope resolves over.** Where F2 grants a **Team** visibility scope (`F2-12`'s law: "Managers see the team's"; `F2.M02.lead-visibility` Team cell, `F2.M09.attendance-visibility` Team cell, and every other Team cell), the members of that team are this mapping's direct reports of the viewer. F2 owns the law; this module owns the membership data — the reciprocal each Team cell has presupposed since Task 5.
- **M10-33** (P0) — **Changing the mapping is a permission-affecting act: EPC Owner-only, audited, graceful.** Because moving a person between teams changes what every Team-scoped holder can see, the act rides the same authority class as role administration: Owner-only (`F2.M10.manage-team-structure`), never HR/Admin (F2 §F2.1 §HR/Admin's no-delegation boundary, same rationale), audit-logged with old → new (`F2-22`'s role-change family), and applied from the next action (`F2-17`'s mid-task grace).

**DONE WHEN:**

- Given a Sales Manager with three mapped reports, when they open any Team-scoped list, then it contains exactly their reports' records in that domain, composed with their other grants by F2's rules (M10-32).
- Given a mapping change, when it saves, then an audit entry records old → new, the actor and the time, and in-flight actions complete under the prior mapping (M10-33).
- Given a save that would give an employee a second manager, or one that would create a cycle (A manages B manages A), when it is submitted, then it is blocked at save with an explanation — a flat mapping must stay acyclic to mean anything (M10-31; wording taken from `prd/modules/M10-hr-lite.md` §M10.6 "Edge cases & what-goes-wrong", the only binding text the PRD carries for this row).
- No dedicated Given/When/Then line exists for M10-31 in the PRD's acceptance blocks; the requirement text above is the binding criterion — each employee may name one manager, and a "team" is exactly the people mapped to a manager, direct reports only, with no transitive tree, no departments and no org chart in the model (the negative half is a scope constraint, enforced by review under M10-01 rather than by a runnable assertion).

---

### T-M10-011 · Employee document storage: typed documents, replace-with-trail, storage meter & read boundary

**Type:** engine · **Tier:** P0
**PRD rows:** M10-37, M10-38, M10-39
**Requirements (verbatim):**

- **M10-37** (P1) — **Employee documents live in tenant storage and obey the billing laws.** Uploads count against the tenant's storage meter (`BM-20`); upload gating and soft-block behaviour are `modules/M12`'s (reads and exports never pause — `BM-32`). No separate HR storage quota exists.
- **M10-38** (P1) — **Documents are records, not workflow.** No e-signature, no document approval chain, no template generation, no versioned contract lifecycle: a document is uploaded, labelled, viewed, replaced (the old one retained — nothing deleted) and exported. Anything more is the enterprise complexity M10-01 excludes.
- **M10-39** (P0) — **Employee documents are the narrowest-read objects in the module.** Visible to the EPC Owner, HR/Admin and the employee themself — never through team scope, never to a manager as manager, never on any other module's surface. The people-records domain boundary (M10-05) applies at its strictest here.

**DONE WHEN:**

- Given a manager with Team scope who is not HR/Admin or Owner, when they open a report's record surfaces available to them, then no document is reachable (M10-39).
- No dedicated Given/When/Then line exists for M10-37 or M10-38 in the PRD's acceptance blocks; the requirement text above is the binding criterion for both.

---

### T-M10-012 · Employee PII data-rights integration

**Type:** integration · **Tier:** P0
**PRD rows:** M10-12
**Requirements (verbatim):**

- **M10-12** (P0) — **Employee data rides the market's data-rights determination.** Export and erasure of employee PII follow `pack.data-rights` (`F1-23`, `F1-24`): tenant-level read + export always work; erasure is anonymisation with statutory carve-outs, never row deletion. Employee records introduce no second privacy regime.

**DONE WHEN:**

- No dedicated Given/When/Then line exists for M10-12 in the PRD's acceptance blocks; the requirement text above is the binding criterion — tenant-level read + export always work; erasure is anonymisation with statutory carve-outs, never row deletion.

---

## Laws (enforced through screens and review, no standalone build)

- **M10-01** (P0) — **The SME-weight law.** This module includes **only features that support EPC operations** and avoids enterprise HR complexity; any future addition that looks like enterprise HR (workflow builders, appraisal cycles, compensation structures, org hierarchies) requires written justification before it may enter the module — none is justified in this release, so none exists.
  *Enforced by:* review of every M10 change against the brief's law and `prd/modules/M10-hr-lite.md` §5; no task in this file builds a workflow builder, appraisal cycle, compensation structure or org hierarchy.
- **M10-02** (P0) — **The closed area list.** The module's scope is exactly: employee records (§M10.2) · onboarding, the employee-record side (§M10.3) · offboarding (§M10.4) · attendance & leave (§M10.5) · team structure (§M10.6) · per-employee documents (§M10.7). Anything outside this list is a non-goal (§5) or another module's.
  *Enforced by:* this file's task set, which covers exactly the six areas and nothing else; review rejects any M10 addition outside the list.
- **M10-17** (P1) — **The record fills in when facts are needed, never as a joining form.** The joiner's own path stays M01's two-minute flow (name, photo — that is all, `M01-14`); employment facts, documents and the manager mapping are added by HR/Admin afterwards, at their own pace. No M10 field ever blocks a joiner from landing on their work.
  *Enforced by:* T-M10-003 (every employment fact on the record is optional; no required HR field exists) and M01's joining flow, which no M10 task extends; review of any change that would add a field to the joiner's path.
- **M10-23** (P0) — **The shared-surface split, honoured from this side.** `modules/M09` owns the field half: capturing day start and day end, correction-by-append and provenance (`M09-35`–`M09-38`). This module owns the HR half: the attendance **register** (per-person per-day view over M09's facts), leave, and the tenant holiday calendar. Neither half restates the other; this module writes no attendance capture and M09 writes no leave.
  *Enforced by:* T-M10-005 and T-M10-006 reading only M09's published facts and owning only register, leave and holiday data; review that no M10 code writes an attendance capture and no M09 code writes leave.
- **M10-24** (P0) — **Absence is never inferred.** A day with no marks renders as **unmarked** — never as "absent", never red, never a score. The register states what was recorded and what was not; what an unmarked day *means* is the tenant's judgement, made by a person. This is `M09-39`'s law, relied on here exactly as M09 published it.
  *Enforced by:* T-M10-005's register rendering, whose DONE WHEN carries the shared acceptance line (M10-24, M10-25); review that no absent state, red state or score exists anywhere in the register to render.
- **M10-29** (P1) — **No shift patterns in v1, and the work-hours window stays M09's — CONFIRMED (owner ruling 2026-08-04, Q39).** This module carries **no per-employee shift pattern**: the ruled window is the worker's day-start → day-end marks with M09's tenant force-stop backstop (default 20:00, owner-set; `M09-44`), employee-visible. The ownership question is closed: the definition stays in M09, exactly as this module's input anticipated; a future shifts feature remains the justified-in-writing enterprise addition M10-01 contemplates.
  *Enforced by:* review — no per-employee shift-pattern field or data model exists in any M10 task; the work-hours window definition remains `M09-44`'s.

---

## Disposition index

| Row | Disposition |
|---|---|
| M10-01 | LAW |
| M10-02 | LAW |
| M10-03 | T-M10-008 |
| M10-04 | T-M10-003 |
| M10-05 | T-M10-009 |
| M10-06 | T-M10-008 |
| M10-07 | T-M10-003 |
| M10-08 | T-M10-008 |
| M10-09 | T-M10-009 |
| M10-10 | T-M10-002 |
| M10-11 | T-M10-002 |
| M10-12 | T-M10-012 |
| M10-13 | T-M10-001 |
| M10-14 | T-M10-001 |
| M10-15 | T-M10-001 |
| M10-16 | T-M10-001 |
| M10-17 | LAW |
| M10-18 | T-M10-004 |
| M10-19 | T-M10-004 |
| M10-20 | T-M10-004 |
| M10-21 | T-M10-004 |
| M10-22 | T-M10-004 |
| M10-23 | LAW |
| M10-24 | LAW |
| M10-25 | T-M10-005 |
| M10-26 | T-M10-001 |
| M10-27 | T-M10-006 |
| M10-28 | T-M10-005 |
| M10-29 | LAW |
| M10-30 | T-M10-009 |
| M10-31 | T-M10-010 |
| M10-32 | T-M10-010 |
| M10-33 | T-M10-010 |
| M10-34 | T-M10-007 |
| M10-35 | T-M10-003 |
| M10-36 | T-M10-003 |
| M10-37 | T-M10-011 |
| M10-38 | T-M10-011 |
| M10-39 | T-M10-011 |
