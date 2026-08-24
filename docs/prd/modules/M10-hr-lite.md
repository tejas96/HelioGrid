# M10 · HR-lite

Status: draft · Origin mix: BRIEF (with `SRC` only where a v1 rule reaches this module through
its owning document) · Depends on: `00-README.md`, `01-product-overview.md`, `02-personas.md`,
`04-business-model.md`, `foundations/F1-global-market-framework.md`,
`foundations/F2-roles-and-permissions.md`, `foundations/F4-data-integrity.md`,
`foundations/F8-data-honesty.md`, `modules/M01-onboarding-and-tenant-config.md`,
`modules/M09-field-workforce.md`

## 1. Purpose & scope

This module is the people side of the tenant, at SME weight: one accurate record per employee,
the employee-record side of getting a person in (invite-by-phone) and out (offboard = access
revocation + reassignment of open work), the attendance register and leave built on what the
field surfaces already capture, the flat team structure that gives "Team" visibility its
members, and per-employee document storage (contracts, certifications). The owner's brief is
the module's governing law, verbatim: *"Design a lightweight HR module suitable for SMEs.
Include only features that support EPC operations. Avoid enterprise HR complexity unless
justified"* (`_process/owner-brief-2026-08-03.md` §HR). Nothing in this document justifies
enterprise complexity, so none is included.

**What this module is not.** It is not a second identity system — the employee record is the
same person as `modules/M01`'s user, phone-keyed, and no HR-only account exists. It is not a
role administrator — role assignment, invitation and deactivation stay under
`F2.M01.manage-team` (EPC Owner-only; `foundations/F2` §F2.1 §HR/Admin), and this module
displays that truth without ever granting it. It is not payroll, recruitment or performance
management (§5). It does not own field capture — attendance day start/end, check-in/out and
every location fact belong to `modules/M09`, which hands this module the attendance half of a
shared surface (`M09-40`) and nothing else.

## 2. Personas & surfaces

- **HR/Admin** — primary. The persona's whole job description is this module plus the
  attendance slice F2 already grants it (`PS-29`, `PS-30`). Web-first for records, documents
  and the register (desk work); mobile for approvals and the exceptions queue — the
  time-sensitive part (`02-personas.md` §HR/Admin, Primary surfaces).
- **EPC Owner** — holds everything here (F2-01 §EPC Owner), and is the only preset that can
  perform the acts with permission consequences: deactivation, role assignment, team-structure
  changes (§M10.4, §M10.6).
- **Every employee persona** — reads their own record and documents, marks their own
  attendance (`F2.M09.mark-attendance`), requests their own leave. Own-scope by construction.
- **Sales Manager / Project Manager / Operations** — no grants in this module beyond the
  attendance-visibility slice F2 already gives them (`F2.M09.attendance-visibility`); the
  people-records domain proper is HR/Admin's and the Owner's (F2-14).

Mobile/web emphasis per feature: records and documents web-emphasis; the people-today queue,
leave decisions and re-invites are one-tap mobile acts (`_process/owner-brief-2026-08-03.md`
§Mobile-first — both surfaces full-featured).

## 3. Feature areas

### M10.1 — Scope law & the module boundary

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M10-01 | **The SME-weight law.** This module includes **only features that support EPC operations** and avoids enterprise HR complexity; any future addition that looks like enterprise HR (workflow builders, appraisal cycles, compensation structures, org hierarchies) requires written justification before it may enter the module — none is justified in this release, so none exists. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §HR, verbatim attestation | P0 |
| M10-02 | **The closed area list.** The module's scope is exactly: employee records (§M10.2) · onboarding, the employee-record side (§M10.3) · offboarding (§M10.4) · attendance & leave (§M10.5) · team structure (§M10.6) · per-employee documents (§M10.7). Anything outside this list is a non-goal (§5) or another module's. | `BRIEF` — `_process/2026-08-03-v2-prd-design.md` §11 (M10 scope: "people records, roles/teams wiring into F2, attendance/leave surfaces shared with M09, onboarding of employees = invite-by-phone flow") + `_process/2026-08-03-v2-prd-authoring-plan.md` §Task 23 Step 1 (document storage per employee; offboard lifecycle — see M10-18's pointer note) | P0 |
| M10-03 | **One person, one identity.** An employee record **is** the M01 user seen from the people side: keyed by the same phone identity (E.164, `M01-18`), carrying the same invited / active / deactivated status, never a parallel account. No person exists in this module who cannot be explained by `modules/M01`'s user lifecycle, and no record here can log in, hold a role or receive an assignment independently of it. | `BRIEF` — design spec §11 ("roles/teams wiring into F2"); lifecycle consumed from `M01-18` (`DOC04.user-lifecycle`) | P0 |
| M10-04 | **This module displays role truth and never grants it.** The record shows the presets a person holds (chips, from F2) read-only; assigning or removing a preset, inviting and deactivating ride `F2.M01.manage-team` (EPC Owner-only) on `modules/M01`'s screens, deep-linked from here. No M10 surface widens, delegates or shortcuts that grant — F2's §F2.1 §HR/Admin states the boundary and this module honours it. | `BRIEF` — design spec §11; boundary consumed from `foundations/F2` §F2.1 §HR/Admin ("Team and role administration is not delegated to this preset") + `F2-15` | P0 |
| M10-05 | **People records are their own visibility domain.** Records, documents and leave resolve in `F2-14`'s **people records** domain (HR/Admin and EPC Owner at tenant scope; every employee at own scope); holding a wide scope in any other domain — leads, projects, field work — never opens a people record (`F2-14`'s per-domain independence). The §F2.5-M10 rows this module appends are its only permission truth. | `BRIEF` — grounded in `SRC` `F2-14` (domain lattice) and `F2-12` (D20 scoping law) | P0 |

**Behavior detail.** The module's centre of gravity is a queue, not a database: the HR/Admin
home is "people today" (`PS-30`) — invitations pending or expired, joiners part-way through
onboarding, today's attendance exceptions, leave awaiting a decision, documents needing
attention — everything on it something to decide, resend, approve or correct. The record
(§M10.2) is what the queue items resolve into. The composition of the home screen itself is
`modules/M13`'s (role homes); the facts and states it composes are this module's.

Permissions: `F2.M10.people-records`, `F2.M10.request-leave`, `F2.M10.decide-leave`,
`F2.M10.manage-team-structure`; attendance reads ride `F2.M09.attendance-visibility`.

**Edge cases & what-goes-wrong.**

- *A tenant never uses this module* → nothing breaks: records exist from M01's invites with
  their identity facts only; every HR field is optional (TC.config-ux.1's zero-config posture,
  M01's law consumed).
- *Someone asks for an enterprise feature (appraisals, payroll)* → §5 names it a non-goal with
  rationale; the request is product feedback, not a config option.

**Acceptance criteria.**

- Given any person visible in this module, when their record is opened, then it resolves to an
  M01 user with the same phone identity and status, and no second account exists (M10-03).
- Given the HR/Admin preset, when any role-assignment act is attempted from an M10 surface,
  then the surface offers only a deep link to M01's Owner-gated screens and no grant of its
  own (M10-04).
- Given a holder of Team lead visibility and no people-records grant, when they attempt to
  open an employee record, then the people-records domain denies it (M10-05).

**Localization notes.** All record labels, queue copy and leave vocabulary EN/HI/MR per
`foundations/F3`; names and phone numbers never translated (F3's non-translate list).
**Analytics events:** people-today queue opened; queue item resolved (type).

### M10.2 — Employee records

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M10-06 | **One record per employee, created at invite.** The record exists from the moment the invite is sent (status invited), fills in as the person onboards, and persists after deactivation. There is no separate "create employee" act — inviting is creating (`M01-12`'s flow), and the record is its people-side view. | `BRIEF` — design spec §11 ("onboarding of employees = invite-by-phone flow"); invite mechanics consumed from `M01-12`/`M01-13` (`S0.screen.4`, `S1.screen.1`) | P0 |
| M10-07 | **Record contents are SME-weight, and mostly optional.** Identity: name, phone (from the account), photo (from the profile, `M01-14`). Employment facts, all optional: job title (free text — never a role), date joined, work city/location, manager (§M10.6), emergency contact name + phone. Presets held render as read-only chips (M10-04). **Nothing else is asked**: no grade, band, cost centre, salary or compensation field exists anywhere in the record (§5). | `BRIEF` — `_process/owner-brief-2026-08-03.md` §HR (SME-weight); design spec §11 (people records) | P0 |
| M10-08 | **The record never diverges from account truth.** Identity fields mirror the M01 profile and are corrected there (the person's own profile act); employment facts are edited here by HR/Admin or the EPC Owner; preset chips mirror F2 live. The same fact is never stored twice — the source's failure to avoid is "people, attendance and documents in three places is how an SME ends up trusting none of them" (`02-personas.md` §HR/Admin Pains). | `BRIEF` — `PS-29`; single-source posture per `02-personas.md` §HR/Admin | P0 |
| M10-09 | **Everyone reads their own record.** An employee sees their own record and documents without any grant — own scope by construction (the precedent is `F2.M09.mark-attendance` and `M09-66`'s own-record law). What they cannot do is edit employment facts or read anyone else's record. | `BRIEF` — grounded in `F2-15` (no exceptions needed — the act writes/reads only the actor's own record) | P1 |
| M10-10 | **Deactivated people stay in the register.** Deactivation hides a person from assignment pickers and ends sessions (F2-20, via M01); it never removes them from the people list, their record, their documents or their history — "deactivate, never delete." The list shows status plainly. | `SRC` — `DOC08.deactivate-never-delete` (docs/engineering/08; consumed via `F2-20` — referenced, not re-appended, per Task 5's disposition) | P0 |
| M10-11 | **The people list is the records surface, not a second Team screen.** It lists every employee with status, role chips, manager and joined date, filterable by status and preset. Role-administration acts (invite, assign roles, deactivate) deep-link to `modules/M01`'s Team screens (`M01-19`–`M01-21`); this list adds record-keeping and takes nothing over. | `BRIEF` — design spec §11; M01 surface boundary per `M01-19` | P1 |
| M10-12 | **Employee data rides the market's data-rights determination.** Export and erasure of employee PII follow `pack.data-rights` (`F1-23`, `F1-24`): tenant-level read + export always work; erasure is anonymisation with statutory carve-outs, never row deletion. Employee records introduce no second privacy regime. | `SRC` — `F1-23`/`F1-24` consumed by ID (`foundations/F1`, Task 6 owns) | P0 |

**Behavior detail.** The record page composes: identity header (name, photo, phone, status) ·
employment facts · preset chips with a "roles are managed on the Team screen" affordance
(Owner sees the deep link live; others see the chips only) · manager and direct reports
(§M10.6) · attendance summary for the current period (§M10.5, register slice) · documents
(§M10.7) · the person's activity attribution is **not** re-listed here (their work lives in
the owning modules; this record is about the person, not a surveillance rollup — `M09-09`'s
no-scoring law is honoured by simply not aggregating work here).

Permissions: `F2.M10.people-records` (read/edit records — EPC Owner, HR/Admin); own-record
reads per M10-09.

**Edge cases & what-goes-wrong.**

- *Two records for one person* → cannot exist: the record is keyed by the account (M10-03);
  a re-invite of the same phone resolves to the same record (M01's "already a member" edge).
- *Employment facts contradict account facts* → impossible by construction for identity
  (mirrored, M10-08); employment facts carry no duplicate of an account fact.
- *HR/Admin edits a record of someone senior to them* → allowed — the record is facts, not
  authority; nothing in a record edit changes any grant (M10-04).
- *A record field a market's law treats as sensitive* → the pack's determination governs
  (M10-12); the module adds no field the IN determination has not already covered for user
  PII (F1-56's family).

**Acceptance criteria.**

- Given an invite sent, when the people list renders, then the person appears with status
  invited and a record exists (M10-06).
- Given a record, when identity fields are compared with the M01 profile, then they are the
  same values from the same source, and editing them here is not possible (M10-08).
- Given a deactivated employee, when the list is filtered to "all", then they appear with
  status deactivated and their record and documents open read-only intact (M10-10).
- Given any employee, when they open their own record, then it renders fully; when they open
  another's, then the people-records domain denies it (M10-09, M10-05).

**Localization notes.** Field labels translated; job title is tenant free text (renders
as-entered, any script). **Analytics events:** record edited (field class, never the value);
list filtered.

### M10.3 — Onboarding: the employee-record side of invite-by-phone

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M10-13 | **Onboarding of employees is the invite-by-phone flow, and the flow itself is `modules/M01`'s.** Invite → OTP → profile → role card → role-decided home (`M01-12`–`M01-17`) is specified once, there. This module owns the **record side**: every invite's state (pending / accepted / expired / revoked) visible in the people list and the people-today queue, with the joiner's progress (verified, profile incomplete, landed) readable per person. | `BRIEF` — design spec §11 ("onboarding of employees = invite-by-phone flow"); flow consumed from `M01-12`, `M01-13`, `M01-17` (`S1.screen.1`–`S1.screen.5`, `S1.happy` — disposed to M01 by Task 12; cited, not re-appended) | P0 |
| M10-14 | **The people-today queue is the working surface** (`PS-30`): invitations pending or expired · joiners part-way through onboarding · today's attendance exceptions (§M10.5) · leave awaiting a decision (§M10.5) · documents needing attention (§M10.7). Everything on it is actionable in one or two taps; it is a queue, not a report. | `BRIEF` — `PS-30` (`02-personas.md`, grounded in `S1.wrong.1`–`S1.wrong.4`); composition into the role home is `modules/M13`'s | P0 |
| M10-15 | **An expired invite is one tap from resent; a declined invite is visible with its reason path.** The re-send act and the decline notification are M01's (`S1.wrong.1`, `S1.wrong.2` — "Ask Rajesh to invite you again"; decline notifies the EPC Owner); this surface shows both states and offers the one-tap resend to whoever holds the invite grant (Owner), and a "nudge the Owner" affordance for HR/Admin, who cannot send invites (M10-04). | `BRIEF` — `PS-30`; `S1.wrong.1`/`S1.wrong.2` consumed via `M01-19`'s edge list | P1 |
| M10-16 | **A joiner with nothing assigned is a queue item, not a mystery.** Where a joined person's role home would be empty (`S1.wrong.3`'s teaching empty state, M01's law), the people-today queue shows "joined, nothing assigned yet — who to ask", so the gap is closed by a person instead of discovered by the joiner. | `BRIEF` — grounded in `S1.wrong.3` (consumed via M01); `PS-30` ("joiners part-way through onboarding") | P2 |
| M10-17 | **The record fills in when facts are needed, never as a joining form.** The joiner's own path stays M01's two-minute flow (name, photo — that is all, `M01-14`); employment facts, documents and the manager mapping are added by HR/Admin afterwards, at their own pace. No M10 field ever blocks a joiner from landing on their work. | `BRIEF` — the minimum-first posture applied to people (`S0.rule.minimum-first` consumed via M01); `PS-29` | P1 |

**Behavior detail.** This area deliberately contains no flow of its own: HelioGrid onboarding
is M01's under-two-minutes path, and duplicating any of it here would create the second
source of truth M10-08 forbids. What HR-lite adds is *accountability for the funnel* — who
was invited and never landed, which invites died, who joined and is stuck — surfaced where
the person responsible for people actually works.

Permissions: queue visibility rides `F2.M10.people-records`; the resend/invite acts stay
`F2.M01.manage-team` (Owner).

**Edge cases & what-goes-wrong.**

- *Invite expired and nobody noticed* → it is a standing people-today item until resent or
  revoked; it never silently disappears (M10-14).
- *Wrong person got the invite and declined* → the decline is already Owner-notified (M01);
  here the invite renders declined/void so HR does not chase a dead invite (M10-15).
- *HR/Admin tries to resend* → the surface is honest: the act is the Owner's; HR/Admin gets
  the nudge affordance, not a hidden failure (M10-15, F2-15).

**Acceptance criteria.**

- Given a pending, an expired and a declined invite, when people-today renders, then all
  three appear with distinct states and the expired one offers one-tap resend to the Owner
  (M10-14, M10-15).
- Given a joiner who verified but has not landed on real work, when the queue renders, then
  their progress state is visible per person (M10-13).

**Localization notes.** Queue copy translated; invite states use M01's vocabulary.
**Analytics events:** queue item acted on (resend requested / nudge sent).

### M10.4 — Offboarding: access revocation + reassignment of open work

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M10-18 | **Offboarding is exactly two things, done together: access revocation and reassignment of open work.** One flow, run when a person leaves: (a) deactivate — sessions end everywhere within the M01 revocation window, the person leaves assignment pickers, "your access was removed" renders gracefully on their device (`S1.wrong.4` via M01); (b) sweep and reassign their open work (M10-19). Neither half alone is an offboard. **Pointer stated precisely:** the offboard definition is authored in `_process/2026-08-03-v2-prd-authoring-plan.md` §Task 23 Step 1 (owner-approved plan, 2026-08-03) — "offboard = access revocation + reassignment of open work — source wrong-items from S1"; design spec §11 carries M10's scope and does not itself contain this sentence (the pointer convention is Task 22's, traceability §Task 22 convention 8). | `BRIEF` — `PLAN.T23.offboard` (authoring plan §Task 23 Step 1, owner-approved); grounded in `SRC` at `S1.wrong.4` and `DOC08.deactivate-never-delete` (both consumed via M01/F2) | P0 |
| M10-19 | **The open-work sweep lists everything the person still owns, before access ends.** At offboard the product composes, from the owning modules, the person's open work: leads they own (`modules/M02`), survey visits assigned (`modules/M04`), designs awaiting their work or their sign-off (`modules/M05`), projects they manage and checklist duties (`modules/M08`), follow-up tasks and queued agent handoffs (`modules/M07`), open field visits (`modules/M09`) — and prompts reassignment of each through **that module's own assignment act**. This module composes the sweep and owns none of the assignment acts; an item can be deliberately left unassigned, visibly, but never silently dropped. | `BRIEF` — `PLAN.T23.offboard`; reassignment prompt grounded in `F2-20` ("their open work gets reassigned") and `M01-19` (deactivation "warns about open work and prompts reassignment"); `S3.wrong.6`'s bulk-reassign precedent (consumed via M02) | P0 |
| M10-20 | **Nothing is orphaned and nothing is rewritten.** Every lead, activity, tick, document and money event the person touched stays attributed to them after offboard (F2-20); the sweep reassigns **open** work only and never edits history. Deleting a user does not exist. | `SRC` — `F2-20` consumed by ID (`DOC08.deactivate-never-delete`) | P0 |
| M10-21 | **The guard rails render here too.** An offboard that would remove the last EPC Owner or the last Manage-team holder is blocked with the explanation, and the blocked attempt is audited — F2's transitions (`F2-19`, `F2-22`), surfaced wherever the offboard starts. | `SRC` — `F2-19`/`F2-22` consumed by ID; surface half per `M01-19` | P0 |
| M10-22 | **Offboarding is Owner-gated; HR/Admin prepares, the Owner executes.** The deactivation act is `F2.M01.manage-team` (EPC Owner-only, not delegated — F2 §F2.1 §HR/Admin). HR/Admin can open the sweep read-only, see what is open and who could take it, and hand the Owner a prepared offboard; the revocation itself and each reassignment run under the grants of whoever performs them. | `BRIEF` — F2 §F2.1 §HR/Admin boundary + `F2-15` (no arrangement can widen it); sweep visibility per `F2.M10.people-records` | P0 |

**Behavior detail.** The sweep is a composition surface: each row is an open item rendered by
its owning module's own summary (a lead card, a visit row, a sign-off queue entry) with that
module's reassign affordance inline. Reassignment respects each module's own rules — e.g.
lead reassignment is `F2.M02.assign-leads` (Owner, Sales Manager), so an Owner running an
offboard can do it all in one sitting, while an HR/Admin preparing one can only look. The
timeline of each reassigned item records why ("reassigned at offboarding of {name}") — the
`S3.wrong.6` precedent generalised. A person's manager mapping (§M10.6) is cleared at
offboard; their direct reports become unmapped and surface as a people-today item (M10-34's
honest empty state protects the interim).

**Edge cases & what-goes-wrong** (the S1 family, carried):

- *Owner removes them later, device in hand* (`S1.wrong.4`) → the graceful removal screen is
  M01's; this module guarantees the offboard flow never produces a state M01 cannot render.
- *The person is mid-task when deactivated* → their in-flight action completes; the
  restriction applies from the next action (`F2-17` consumed).
- *Offboard with the sweep skipped* → allowed only explicitly: the Owner must mark remaining
  items "leave unassigned", and those items surface in the owning modules' unassigned states
  (e.g. M02's inbox) rather than vanishing (M10-19).
- *The leaver is the last sign-off holder / last Owner* → guard rails block or warn per F2;
  the sweep shows the sign-off queue emptying to nobody so the Owner sees the gap before
  confirming (M10-21).
- *Re-hire* → a new invite to the same phone reactivates the same identity per M01's
  lifecycle; the old record and history are simply there (M10-10, M10-03).

**Acceptance criteria.**

- Given an offboard confirmed, when it completes, then the person is deactivated with
  sessions ended, every open item from the sweep is either reassigned via its owning module
  or explicitly marked left-unassigned, and history attribution is unchanged (M10-18,
  M10-19, M10-20).
- Given an offboard that would remove the last EPC Owner, when it is attempted, then it is
  blocked with an explanation and audited (M10-21).
- Given an HR/Admin holder, when they open an offboard, then the sweep renders read-only
  with no revocation act available (M10-22).

**Localization notes.** Sweep and confirmation copy translated; reassignment reasons render
in the viewer's language. **Analytics events:** offboard started / completed; items
reassigned vs left-unassigned (counts).

### M10.5 — Attendance & leave (the shared surface with M09)

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M10-23 | **The shared-surface split, honoured from this side.** `modules/M09` owns the field half: capturing day start and day end, correction-by-append and provenance (`M09-35`–`M09-38`). This module owns the HR half: the attendance **register** (per-person per-day view over M09's facts), leave, and the tenant holiday calendar. Neither half restates the other; this module writes no attendance capture and M09 writes no leave. | `BRIEF` — design spec §11 ("attendance/leave surfaces shared with M09"); the hand-off is `M09-40` (Task 22 §4), reciprocated here | P0 |
| M10-24 | **Absence is never inferred.** A day with no marks renders as **unmarked** — never as "absent", never red, never a score. The register states what was recorded and what was not; what an unmarked day *means* is the tenant's judgement, made by a person. This is `M09-39`'s law, relied on here exactly as M09 published it. | `BRIEF` — `M09-39` consumed (its wording is the module contract); `_process/owner-brief-2026-08-03.md` §Field-workforce ("Attendance") | P0 |
| M10-25 | **The register is a calendar of facts:** per person, per day — day start/end times with their capture provenance (from M09), leave (with type) where approved, tenant holidays, and unmarked days as unmarked. Period views (week/month) aggregate **counts of recorded facts only** (days marked, days on leave) and compute no punctuality, hours-worked or productivity figure (§5; `M09-09`'s no-scoring law extends here). | `BRIEF` — `_process/owner-brief-2026-08-03.md` §HR + §Field-workforce; facts-only posture per `M09-09`/`M09-45` consumed | P0 |
| M10-26 | **Attendance exceptions surface in people-today:** yesterday's unmarked days, days with a start and no end (M09's open check-in / missing day-end state), and corrections awaiting review — each resolvable by looking at the person's own timeline (the persona's stated behaviour), never auto-resolved. Corrections ride M09's correction-by-append (`M09-38`); the register never edits a captured fact. | `BRIEF` — `PS-30` ("today's attendance exceptions"); `02-personas.md` §HR/Admin (checks exceptions "against the technicians' own timelines"); `M09-38` consumed | P1 |
| M10-27 | **Leave is a request-and-decision record, SME-weight.** Any employee requests their own leave (dates, a type, an optional note); HR/Admin or the EPC Owner decides; the decision lands on the register and the person is notified. Leave **types are tenant-configured labels** (market-neutral — no statutory leave taxonomy is built in; a market's statutory leave rules, if ever encoded, are `pack.data-rights`-family pack data). **No accrual arithmetic exists in v1**: no balances, no carry-forward, no quota enforcement — the register records what was taken; policy lives with the tenant (stated as scope, not gap — SME-weight, §M10.1). | `BRIEF` — `_process/owner-brief-2026-08-03.md` §HR; `PS-30` ("leave awaiting a decision") | P0 |
| M10-28 | **The tenant holiday calendar renders on the register.** Tenant-declared holidays appear as holidays (tenant configuration, `F2.M01.manage-tenant-settings`); they imply nothing about any person's day beyond the label. This calendar is distinct from the calling-window holiday calendar the voice compliance gate uses (`F1-50`, M07's consumption) — the two are separate data with separate consequences, and this module touches only its own. | `BRIEF` — SME register need; distinctness note against `F1-50` (cited, not consumed) | P2 |
| M10-29 | **No shift patterns in v1, and the work-hours window stays M09's — CONFIRMED (owner ruling 2026-08-04, Q39).** This module carries **no per-employee shift pattern**: the ruled window is the worker's day-start → day-end marks with M09's tenant force-stop backstop (default 20:00, owner-set; `M09-44`), employee-visible. The ownership question is closed: the definition stays in M09, exactly as this module's input anticipated; a future shifts feature remains the justified-in-writing enterprise addition M10-01 contemplates. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §HR (avoid enterprise complexity); register `Q39` resolved per owner ruling 2026-08-04 (window concretized in `M09-44`) | P1 |
| M10-30 | **HR/Admin sees attendance and nothing else of the field.** The register reaches HR/Admin through `F2.M09.attendance-visibility` (All — the attendance slice only); no route, position, geofence event or movement fact is reachable from any register surface, for any preset, ever. `M09-41` states the law; this module's surfaces are built under it. | `BRIEF` — `M09-41` consumed; `F2.M09.attendance-visibility` (Task 22 §F2.5-M09) | P0 |

**Behavior detail.** The register reads M09's published facts — day start/end per person per
day, capture times, provenance, the correction trail — and renders them in calendar form. A
leave request lifecycle is requested → approved / declined (terminal per request; a changed
plan is a new request — no edit-in-place, matching the suite's append posture). Approving
leave for a date range paints those days as leave; it never back-fills or overrides a
recorded day start (a person who worked during approved leave shows both facts — the
register does not resolve the contradiction, it shows it, per F8's honesty posture).
Notification types this area raises — leave requested (to deciders), leave decided (to the
requester) — register in `foundations/F6`'s matrix.

Permissions: requesting is `F2.M10.request-leave` (every preset, own-scope); deciding is
`F2.M10.decide-leave` (EPC Owner, HR/Admin); register reads ride
`F2.M09.attendance-visibility`.

**Edge cases & what-goes-wrong.**

- *Leave requested for days already worked* → allowed (retroactive regularisation is normal
  in an SME); the register shows both facts for those days (behavior detail).
- *Leave request while the decider is the requester* (HR/Admin requesting their own leave) →
  permitted; the decision record names the decider, so self-approval is visible, not
  pretended away (the F2-04 author-rule precedent, applied as visibility rather than a
  block). | (edge, no ID — carried in behavior)
- *Tenant with no holiday calendar, no leave types configured* → the register still works:
  facts and unmarked days only; leave requests offer a single default label until the tenant
  configures types (zero-config posture).

**Acceptance criteria.**

- Given a person with no marks on a day, when the register renders, then the day is
  "unmarked" and no absent state, score or colour-coded judgement appears (M10-24, M10-25).
- Given a leave request, when it is decided, then the decision is attributed (who, when),
  the requester is notified, and approved days render as leave on the register (M10-27).
- Given any register surface opened by HR/Admin, when its content is audited, then no
  location, route or geofence fact appears (M10-30).
- Given a correction to a day mark, when it lands, then it arrives as M09's append with the
  original preserved, and the register shows the corrected value with its trail (M10-26).

**Localization notes.** Register and leave vocabulary translated; leave type labels are
tenant data (per-language where the tenant authors them, F3-10's content-class law).
**Analytics events:** leave requested / decided; exception resolved; register period viewed.

### M10.6 — Team structure: the manager mapping

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M10-31 | **Team structure is a flat manager mapping.** Each employee may name **one manager**; a "team" is exactly the people mapped to a manager — direct reports, no transitive tree, no departments, no org chart (§5). This is deliberately the least structure that makes team-scoped visibility resolvable. | `BRIEF` — design spec §11 ("roles/teams wiring into F2") · authoring-plan §Task 23 Step 1 ("team structure (manager mapping used by D20 visibility)") | P0 |
| M10-32 | **The mapping is what Team scope resolves over.** Where F2 grants a **Team** visibility scope (`F2-12`'s law: "Managers see the team's"; `F2.M02.lead-visibility` Team cell, `F2.M09.attendance-visibility` Team cell, and every other Team cell), the members of that team are this mapping's direct reports of the viewer. F2 owns the law; this module owns the membership data — the reciprocal each Team cell has presupposed since Task 5. | `BRIEF` — grounded in `SRC` `D20` (`F2-12`, journey L1538–1539) + `F2-13`/`F2-14`; design spec §11 | P0 |
| M10-33 | **Changing the mapping is a permission-affecting act: EPC Owner-only, audited, graceful.** Because moving a person between teams changes what every Team-scoped holder can see, the act rides the same authority class as role administration: Owner-only (`F2.M10.manage-team-structure`), never HR/Admin (F2 §F2.1 §HR/Admin's no-delegation boundary, same rationale), audit-logged with old → new (`F2-22`'s role-change family), and applied from the next action (`F2-17`'s mid-task grace). | `BRIEF` — authority class per `F2.M01.manage-team` precedent; `F2-15` (no arrangement widens it); `F2-17`, `F2-22` consumed | P0 |
| M10-34 | **Unmapped renders honestly and fails closed.** A Team-scope holder with no direct reports sees a teaching empty team state ("nobody reports to you yet — the Owner sets team structure"), never a silent widening to everyone and never an error. A person with no manager simply has none; nothing breaks. | `BRIEF` — fail-closed posture per the suite's honesty laws (`F8-36` family); empty-state contract per F7 (consumed) | P0 |

**Behavior detail.** The mapping renders in two places: on the record (manager + direct
reports) and as a simple team view (each manager with their reports). At offboard the
leaver's mapping is cleared and their reports become unmapped (§M10.4 behavior). The mapping
carries no authority of its own: being someone's manager grants **nothing** unless the person
also holds a preset with a Team-scoped cell — mapping is membership data, presets are grants,
and the two compose only through F2's own rules (F2-11, F2-13). A Sales Manager with reports
sees the team's leads; a Field Technician with reports (possible, harmless) still sees only
their own work, because no preset they hold has a Team cell.

Permissions: `F2.M10.manage-team-structure` (EPC Owner); reading the mapping rides
`F2.M10.people-records` for the full view, and everyone sees their own manager and reports
on their own record (M10-09).

**Edge cases & what-goes-wrong.**

- *Mapping cycles* (A manages B manages A) → blocked at save with an explanation; a flat
  mapping must stay acyclic to mean anything (M10-31).
- *Manager deactivated* → reports become unmapped and surface in people-today; Team-scoped
  views of the departed manager are moot (their access ended) (M10-34, §M10.4).
- *Someone maps to a person with no Team-granting preset* → allowed; the mapping is
  membership, the grant question is F2's — the pairing simply has no visibility effect yet
  (behavior detail).
- *Owner asks HR/Admin to maintain the mapping* → not possible by construction (F2-15, no
  per-person exceptions); the request is Q-class product feedback for a future preset, the
  R16-pattern escape path F2 §5 already names (M10-33).

**Acceptance criteria.**

- Given a Sales Manager with three mapped reports, when they open any Team-scoped list, then
  it contains exactly their reports' records in that domain, composed with their other
  grants by F2's rules (M10-32).
- Given a mapping change, when it saves, then an audit entry records old → new, the actor
  and the time, and in-flight actions complete under the prior mapping (M10-33).
- Given a Team-scope holder with no reports, when their team view renders, then it is the
  teaching empty state and no wider data appears (M10-34).

**Localization notes.** "Manager"/"reports" vocabulary translated; the team view uses
localized preset names (F2 localization notes). **Analytics events:** mapping changed
(old → new — also an audit event).

### M10.7 — Employee documents (contracts, certifications)

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M10-35 | **Per-employee document storage: contracts and certifications, type-labelled.** Each employee record holds documents — employment contract, certifications (electrician licence, safety training), identity documents where the tenant collects them — each with a type label, upload date and uploader. Uploaded by HR/Admin or the EPC Owner; the employee always sees their own (M10-09). | `BRIEF` — design spec §11 ("document storage per employee (contracts/certs)" — authoring-plan §Task 23 Step 1 phrasing) | P0 |
| M10-36 | **A document may carry an expiry date, and expiry is an attention item, not an enforcement.** Certifications expire in the real world; a document with an expiry date surfaces in people-today as "needing attention" as the date approaches and after it passes. The product **blocks nothing** on an expired document — whether an uncertified person may work is the tenant's call, not the register's. | `BRIEF` — `PS-30` ("employee documents needing attention"); no-enforcement posture per M10-01 (SME-weight) | P1 |
| M10-37 | **Employee documents live in tenant storage and obey the billing laws.** Uploads count against the tenant's storage meter (`BM-20`); upload gating and soft-block behaviour are `modules/M12`'s (reads and exports never pause — `BM-32`). No separate HR storage quota exists. | `SRC` — `BM-20`/`BM-32` consumed by ID (`04-business-model.md`, Task 11 owns) | P1 |
| M10-38 | **Documents are records, not workflow.** No e-signature, no document approval chain, no template generation, no versioned contract lifecycle: a document is uploaded, labelled, viewed, replaced (the old one retained — nothing deleted) and exported. Anything more is the enterprise complexity M10-01 excludes. | `BRIEF` — `_process/owner-brief-2026-08-03.md` §HR; retention posture per the suite's never-delete family (`F2-20` precedent) | P1 |
| M10-39 | **Employee documents are the narrowest-read objects in the module.** Visible to the EPC Owner, HR/Admin and the employee themself — never through team scope, never to a manager as manager, never on any other module's surface. The people-records domain boundary (M10-05) applies at its strictest here. | `BRIEF` — `F2-14` per-domain independence, applied; privacy posture per `pack.data-rights` (`F1-23`) | P0 |

**Behavior detail.** The document list renders on the record with type, date, expiry (where
set) and uploader; replace keeps the prior file visible in the trail (append, never
overwrite). Exports ride the tenant-level export right (`F1-24`) — an employee's own
documents are part of any data-principal export concerning them. Expiry attention appears at
a fixed approach window (a tenant-configurable lead time, defaulting sensibly) in
people-today and on the record; the notification type registers in `foundations/F6`.

Permissions: `F2.M10.people-records` (upload/manage); own-document reads per M10-09;
M10-39's read boundary is a property of the surface.

**Edge cases & what-goes-wrong.**

- *Upload while the tenant is storage-capped or halted* → M12's gate answers (soft headroom,
  honest banner); reads and exports of existing documents never pause (M10-37).
- *Expired certification for someone on today's field roster* → attention item only; no
  block, no automatic unassignment — a person decides (M10-36).
- *Wrong file on the wrong record* → replace + trail; the mistaken upload stays in the trail
  (nothing deleted), with an honest label (M10-38).
- *Erasure request touching employee documents* → the market determination governs
  (anonymisation, statutory carve-outs — `F1-24`); contracts required for statutory periods
  follow the pack's carve-out (M10-12).

**Acceptance criteria.**

- Given a document with an expiry date inside the lead window, when people-today renders for
  HR/Admin, then the document appears as needing attention, and nothing anywhere is blocked
  by it (M10-36).
- Given a manager with Team scope who is not HR/Admin or Owner, when they open a report's
  record surfaces available to them, then no document is reachable (M10-39).

**Localization notes.** Type labels are tenant-configurable data (per-language, F3-10);
attention copy translated. **Analytics events:** document uploaded / replaced; expiry
attention shown / resolved.

## 4. Cross-module contracts

**This module expects:**

| From | What it expects |
|---|---|
| `modules/M01-onboarding-and-tenant-config.md` | The whole invite/onboarding flow (`M01-12`–`M01-17`), the user lifecycle and phone identity (`M01-18`), the Team/Assign-roles/Roles-reference screens (`M01-19`–`M01-21`), session revocation timing (`M01-07`), and deactivation's guard rails surfaced there. This module deep-links and never duplicates. |
| `modules/M09-field-workforce.md` | The field half of the shared attendance surface (`M09-35`–`M09-40`): day start/end facts with capture times, provenance and the correction trail; the absence-never-inferred law (`M09-39`); the open-check-in exception feed (`M09-24`); the attendance-only HR boundary (`M09-41`). |
| `foundations/F2-roles-and-permissions.md` | The people-records domain (`F2-14`), the scoping laws (`F2-12`, `F2-13`, `F2-15`), deactivate-never-delete and the service invariants (`F2-19`, `F2-20`), mid-task grace (`F2-17`), audit (`F2-22`), and the §F2.1 §HR/Admin no-delegation boundary. The §F2.5-M10 rows this module fills are its only permission truth. |
| `foundations/F1-global-market-framework.md` | `pack.data-rights` as the carrier of employee-privacy determinations (`F1-23`, `F1-24`); tenant timezone (`F1-10`); formats (`F1-21`). |
| `04-business-model.md` | The storage meter and soft-block law (`BM-20`, `BM-32`); unlimited users (`BM-06` — nothing in this module is seat-priced; the tracked-seat exception is M09/BM-22's and touches nothing here). |
| `foundations/F4-data-integrity.md` | The concurrency law behind every record surface here: per-field last-writer-wins by server apply order with an activity entry for each applied change, so a lost concurrent edit stays recoverable from the log (`F4-16`), and the never-blocking law (`F4-27`). |

**This module provides:**

| To | What it provides |
|---|---|
| `foundations/F2-roles-and-permissions.md` | The team-membership data every **Team** visibility cell resolves over (M10-32) — F2 keeps the law, this module keeps the mapping. |
| `modules/M13-dashboards-and-reporting.md` (Task 23) | The people-today queue contents (`PS-30`) for the HR/Admin role home, and the attendance-register facts for any people rollup — facts and gaps only, no scores (`M10-25`). |
| `foundations/F6-notifications-and-search.md` (Task 23) | Notification types this module raises: **leave requested** (to deciders), **leave decided** (to the requester), **invite expired** (to the Owner, with HR visibility), **employee document expiring** (to HR/Admin + Owner). Placement in the matrix is F6's. Employees appear in global search results only within the searcher's people-records scope. |
| `modules/M02`/`M04`/`M05`/`M07`/`M08`/`M09` | The offboard sweep's demand (M10-19): each module's open-work summary and its own reassignment act, invoked from the sweep under that module's grants. |

## 5. Non-goals

Each exclusion is a product decision under the brief's own law (M10-01); none is arguable
enough to carry as a `REC`, so none appears in `registers/enhancements.md`.

- **No payroll, and no compensation data at all.** No salary field, no payslip, no
  reimbursement, no statutory filing. Payroll is a regulated, market-specific domain whose
  absence keeps every record here safe to show to the people it describes; an EPC's payroll
  tool remains its payroll tool. (Brief: EPC-operations only.)
- **No recruitment / ATS.** No vacancies, applicants, or hiring pipeline; people enter the
  product when they are invited (M10-06), not when they apply.
- **No performance reviews, appraisals or any people-scoring.** The suite already refuses
  productivity scoring on field data (`M09-09`); an HR module that scored people would
  reintroduce it through the back door. Descriptive facts only.
- **No shift patterns, rostering or scheduling engine.** `modules/M08` §5 already excludes
  crew rostering (`S8.rule.v1-boundary`); this module adds no per-employee shift patterns
  (M10-29) and no scheduling of anyone. The window-ownership half is closed — the owner
  confirmed the M09 definition (register `Q39`, ruled 2026-08-04).
- **No org chart beyond the flat manager mapping.** Departments, matrices and hierarchy
  trees are enterprise structure an SME does not maintain (M10-31).
- **No leave accrual arithmetic** — balances, carry-forward, quota enforcement (M10-27's
  in-row statement). The register records; the tenant judges.
- **No biometric or device-based attendance hardware integration.** Attendance is M09's
  capture, from the person's own device, under M09's privacy laws.
- **No training/LMS, onboarding-workflow builder, e-signature or document workflow**
  (M10-38).

## 6. Open questions

Raised or carried by this document, mirrored into `registers/open-questions.md`.

| # | Question | Decision owner |
|---|---|---|
| M10-Q1 | **RESOLVED (owner ruling 2026-08-04, Q39).** The owner confirmed this module's input: v1 ships no per-employee shift patterns (M10-29), and the tracking window is concretized in `M09-44` — the worker's day-start → day-end marks with the tenant force-stop backstop (default 20:00, owner-set). Nothing in M10 moves; a future shifts feature stays the written-justification enterprise addition M10-01 contemplates. | Decision recorded 2026-08-04 (register `Q39`) |
