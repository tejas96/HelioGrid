# F6 · Notifications & search

Status: draft · Origin mix: SRC (the notification enum, centre and search are committed v1
scope; the delivery laws are docs/04/07's) / BRIEF (the V2 modules' registered types; quiet
hours) · Depends on: `00-README.md`, `01-product-overview.md`, `02-personas.md`,
`foundations/F2-roles-and-permissions.md`, `foundations/F3-localization.md`,
`foundations/F8-data-honesty.md`, and every module that
registers a type (`M01`–`M13`, `F5` as cited)

## 1. Purpose & scope

This document owns the two cross-cutting staff surfaces the journey names beside roles and
settings: the **notification system** — the type registry, the event × persona × channel
matrix, the delivery and honesty rules, and the notification centre — and **global search** —
one box across the tenant's records, scoped by role visibility. Both are committed v1 scope:
"Notification bell centre, push wiring, and app-wide global search are committed scope"
(`DOC14.notifications-search`). It also carries the message-template registry's F6 half — the
copy-paste supply for the product's manual messaging flows.

**What this document is not.** It is **staff-facing only**: every recipient in the matrix is a
tenant user. Nothing here sends anything to the EPC's customer — the customer-facing
transactional send channel was **ruled 2026-08-04 (register `Q33`)** and lives with
`modules/M03`'s connected channels and `foundations/F5`'s moments (`F5-16`/`F5-48`), not here;
this document still assumes no send channel of its own (the customer's own surfaces are
`foundations/F5`'s link states). It defines no notification *content* semantics beyond
honesty — each event's meaning belongs to the module that raises it. And it is not analytics:
the notification stream is not a metrics feed (`modules/M13` reads modules' data, not this
inbox).

## 2. Personas & surfaces

All twelve personas — everyone receives notifications and everyone searches. The matrix
(§F6.3) names recipients per event by persona and scope; the notification centre and search
box exist identically on web and mobile (bell + badge on web; bell in the app shell on
mobile), with push on mobile and web push where the platform allows. The EPC Owner and the
coordinator personas are the heaviest recipients (escalations, billing, blockers); field
personas receive their own-work events only.

## 3. Feature areas

### F6.1 — Principles: honest, actionable, staff-side

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F6-01 | **The notification centre, push wiring and global search are committed v1 scope** — a bell centre with grouped, actionable items; push; one app-wide search. This document is their specification; no module builds a private notification surface or a private search box. | `SRC` — `DOC14.notifications-search` (docs/14); journey §DASHBOARDS L1548 (the "Notifications + global search" screens-table row — "Everyone") | P0 |
| F6-02 | **Every notification deep-links to its subject and is actionable from where it lands.** A notification is a pointer to a real record — the lead, the design, the tranche, the invite — never a dead announcement. Where the subject offers a one-step act the recipient may perform (approve, resend, pay, reassign), the notification surfaces it. | `SRC` — `DOC04.notification-types` ("each deep-links to its subject"); journey L1548 ("grouped, each actionable") | P0 |
| F6-03 | **Notification honesty: no false urgency, ever.** A notification's tone matches its fact: informational facts inform, attention items say why they need attention, and nothing is dressed as urgent to drive engagement — the same discipline the dunning ladder (`M12-41`) and the state banners obey (`F8-34`'s family). No engagement mechanics exist: no streaks, no badges-for-opening, no re-notification of an unchanged fact. | `BRIEF` — authoring-plan §Task 23 Step 4 ("notification honesty (no false urgency)"), grounded in `SRC` `F8-34`'s honest-state law and `D37`'s no-vanity posture (consumed) | P0 |
| F6-04 | **Nothing in this document reaches the EPC's customer.** Every matrix recipient is a tenant user; the customer's surfaces are the link's own states (`F5-48`'s confirmation-state law) and the transactional message flows. The two source moments that ask for automatic customer messages — the design-wait message and the acceptance acknowledgement — are **ruled (owner ruling 2026-08-04, Q33)**: they send automatically from the tenant's connected transactional channel, owned by `foundations/F5` (`F5-16`, `F5-48`) with `modules/M03`'s connection (`M03-03`); this document still defines **no send channel of its own** and stays staff-side. | `SRC` — register `Q33` resolved 2026-08-04 (the channel lives with `modules/M03`/`foundations/F5`; F6 stays staff-side); `D32` consumed for the fallback path | P0 |

**Behavior detail.** The two surfaces share one discipline: they are *composed views over
other modules' facts*, exactly like M13's dashboards — a notification is a fact with a
pointer; a search result is a record with a scope check. Neither surface ever holds the only
copy of anything.

**Edge cases & what-goes-wrong.**

- *A module wants a bespoke alert surface* → it registers a type here instead (F6-05); the
  UX-gap register's cross-cutting rule is binding — new v1 systems "extend the existing
  NotificationsCentre patterns", never separate screens.
- *A notification's subject was deleted/merged* → the deep link resolves to the surviving
  record (merge re-points) or renders an honest "this record was merged/closed" landing —
  never a crash, never a dangling pointer.

**Acceptance criteria.**

- Given any notification anywhere in the product, when tapped, then it opens its subject (or
  the honest landing) and the act it offered is real (F6-02).
- Given the full notification catalogue, when audited for tone, then no message manufactures
  urgency beyond its fact and none re-notifies an unchanged fact (F6-03).
- Given every recipient in §F6.3's matrix, when enumerated, then all are tenant users and no
  customer-facing send exists (F6-04).

**Localization notes.** All notification copy EN/HI/MR (`F3`); titles/bodies render in the
recipient's language **at emit time** (F6-08). **Analytics events:** notification tapped
(type) · notification act taken (type, act).

### F6.2 — The notification model: types, state, delivery

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F6-05 | **One notification type registry, complete from day one and extended only by registration.** The source's day-one enum: `proposal_opened` · `agent_escalation` · `follow_up_due` · `survey_submitted` · `design_returned` · `signoff_requested` · `payment_due` · `lead_unassigned_24h` · `system` (the full enum exists from day 1, forward-compatible). The V2 modules extend the registry with the types their §4 contracts hand this document (all in §F6.3's matrix); every type is registered here with its recipients and channels — no unregistered notification can exist. | `SRC` — `DOC04.notification-types` (docs/04, enum verbatim); V2 extensions `BRIEF` per each module's §4 hand-off (cited per row in §F6.3) | P0 |
| F6-06 | **The notification record is the source of truth; push is best-effort by contract.** The in-app inbox and the badge derive from the record, so a dropped push never loses information — push is a tap on the shoulder, the inbox is the fact. Each record tracks read state and a push-sent marker. | `SRC` — `DOC07.push-best-effort` (docs/engineering/07, verbatim posture); `DOC04.notification-types` (read state + push-sent marker) | P0 |
| F6-07 | **Read state travels up only and is set once** — reading on one device reads everywhere; nothing un-reads. | `SRC` — `DOC06.conflict-matrix` (the notification-read-state entity half routed here by Task 10), quoted: "notification read-state up only" | P0 |
| F6-08 | **Language is fixed at emit time.** Title and body render in the recipient's language when the notification is created — notifications are not re-translated when the user later switches language; the deep-linked subject renders in whatever language the user has at open time. | `SRC` — `DOC04.notification-language` (docs/04, verbatim) | P0 |
| F6-09 | **Notifications are never billing-gated.** The inbox, badge and history are reads and live in the soft-block matrix's always-on set; billing-state events themselves are matrix rows (§F6.3). | `SRC` — `BM-32` consumed (reads always work; enforcement `modules/M12`) | P0 |

**Behavior detail.** A type's registration fixes: its name, the module that raises it, its
recipient rule (persona/scope — always resolved through F2's visibility, F6-16), its channel
set (F6-11), its grouping class (F6-12) and its urgency class (immediate vs standard,
F6-13). The registry is this document's §F6.3 table; a module adding a type in a later
revision adds a row here in the same format.

**Edge cases & what-goes-wrong.**

- *Push token dead / push disabled* → the inbox still has everything (F6-06); nothing retries
  into spam.
- *Recipient loses visibility of the subject between emit and open* → the deep link applies
  F2's scope at open time; the notification renders an honest "no longer in your scope"
  landing (F6-16's scope law at both moments).

**Acceptance criteria.**

- Given every notification in the product, when traced, then its type exists in the registry
  with recipients, channels, grouping and urgency defined (F6-05).
- Given a dropped push, when the user opens the app, then the inbox contains the record and
  the badge counted it (F6-06).
- Given a language switch, when the inbox renders, then old items keep their emit-time
  language and new items use the new language (F6-08).

**Localization notes.** Per F6-08. **Analytics events:** emitted (type) · pushed (type) ·
read (type, channel of read).

### F6.3 — The matrix: event × persona × channel

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F6-10 | **The matrix below is the complete v1 event registry** — every notification-worthy event named by a module's §4 contract, with its recipients (persona + scope) and channels. It is the cross-check the suite's modules registered into (M02, M03, M04, M05, M06, M07, M08, M09, M10, M11, M12, M13, F5); an event absent from a module's contract and from this table does not notify. | `SRC` — the registry-and-registration law is `F6-05`'s (`DOC04.notification-types`); per-row origins are cited in the table itself — each row cites its registering module's §4 hand-off or its ledger key, and the V2 modules' registrations are `BRIEF` per those rows *(tag restructured from dual `SRC`/`BRIEF` to the suite's single-governing-tag-plus-note convention — Task 26)* | P0 |

**The matrix.** Channels: **In-app** = the notification record (always, for every row — the
record is the truth, F6-06); **Push** = best-effort push where marked. Recipients are
personas resolved through the holder's F2 scope (F6-16) — "owner" = EPC Owner; "managers" =
Sales Manager (team scope) and, where the subject is a project/portfolio fact, Project
Manager/Operations per their scopes. Grouping and urgency classes per F6-12/F6-13.

| Event (type) | Raised by | Recipients (persona · scope) | Push | Source |
|---|---|---|---|---|
| Invite declined by its recipient | M01 | EPC Owner | — | `SRC` `S1.wrong.2` via `M01-19`'s edge list ("declining notifies the EPC Owner"); voids the invite |
| Re-invite requested (expired invite) | M01 | The inviter (EPC Owner) | — | `SRC` `S1.wrong.1` via `M01-19`'s edge list ("one-tap request that notifies the inviter") |
| Lead assigned to you | M02 | The assigned Sales Executive (own) | ✓ | `SRC` `S2.happy` ("rep is notified") via M02 §4 (assignment) |
| Lead unassigned > 24 h (`lead_unassigned_24h`) | M02 | EPC Owner (all) — lands in "what needs you" (`M13-15`) | ✓ | `SRC` `R9.unassigned` (escalation half routed here by Task 13); `DOC04.notification-types` |
| New enquiry on an existing lead | M02 | The record's owner (own/scope) | — | `SRC` M02 §4 (enquiry-on-existing) |
| Channel needs action (reconnect/registration) | M03 | EPC Owner + Marketing (campaign scope) | ✓ | `BRIEF` M03 §4 ("channel `action needed`") |
| Campaign paused | M03 | Marketing + EPC Owner | — | `BRIEF` M03 §4 |
| Capture-failure spike | M03 | Marketing + EPC Owner | ✓ | `BRIEF` M03 §4 |
| Survey submitted / ready for design (`survey_submitted`) | M04 | The assigned Design Engineer (assigned); designer notified per `S4.happy` | ✓ | `SRC` `DOC04.notification-types`; M04 §4 |
| Visit rescheduled | M04 | The assigned Survey Engineer + the lead's owner | ✓ | `SRC` M04 §4 |
| Survey submission rejected / needs attention | M04 | The submitting Survey Engineer (own) | ✓ | `SRC` M04 §4 |
| Sign-off requested (`signoff_requested`) | M05 | Sign-off holders (`F2.M05.approve-designs` — queue-scoped) | — (queue is the surface; `M05-83`) | `SRC` `DOC04.notification-types`; `UXG-06`/`M05-83` |
| Design returned (`design_returned`) | M05 | The design's author (own) — with pinned markers in the studio | ✓ | `SRC` `DOC04.notification-types`; `M05-86` (`UXG-07`'s type registered here) |
| A newer survey superseded the design's inputs (`design_survey_superseded`) | M05 | The design's author (own) — with the "survey updated — review needed" marker in the studio | ✓ | `SRC` `M05-13` (owner ruling 2026-08-04, Q24 — "notifies the designer"); M05 §4 |
| Proposal opened (`proposal_opened`) | M06 (via F5's open event) | The proposal's rep (own) | ✓ | `SRC` `DOC04.notification-types`; `M06-54` (`S6.happy` — "the rep is notified") |
| Follow-up due (`follow_up_due`) | M07 | The task's owner (own) — My Day is the primary surface; the notification is the nudge | — | `SRC` `DOC04.notification-types`; M07 §4 |
| Agent escalation (`agent_escalation`) | M07 | The lead's rep (own) — "a notification, not a task buried in a list"; owner sees escalations list | ✓ **immediate** | `SRC` `DOC04.notification-types`; `S7.wrong.5` (the F6 half routed by Task 17) |
| Number-provisioning status | M07 | EPC Owner | — | `SRC` M07 §4 (UXG cross-cutting: new-system types extend the centre) |
| Monthly agent performance summary | M07/M13 | EPC Owner | in-app push ("pushed to the owner in-app") | `SRC` `AP.wrong.4` (F6 half); `M13-45` |
| Blocked voice-queue entry (allowance) | M07/M12 | EPC Owner | ✓ | `SRC` `DOC16.gate.voice` ("owner notified"); `M07-37`/`M12-23` |
| Tranche became due (`payment_due`) | M08/M11 | Project Manager (own projects) + Finance (money scope) + EPC Owner | ✓ | `SRC` `DOC04.notification-types`; M08 §4 + M11 §4 |
| Payment confirmed | M11 | The project's PM + Finance + the deal's rep (read-scope) | ✓ | `SRC` M11 §4 |
| Payment reversed | M11 | Finance + EPC Owner | ✓ | `SRC` M11 §4 |
| Collections credential failing | M11/M01 | EPC Owner | ✓ | `SRC` M11 §4 (`DOC09.credential-probe-nag`'s alert half — "never silent failure") |
| Blocker set / blocker past expected-until | M08 | Operations (portfolio) + the project's PM; owner sees aged view | — | `SRC` M08 §4 |
| Project aged in stage | M08 | EPC Owner + Operations — surfaces via "what needs you"/board | — | `SRC` M08 §4 |
| Handover completed | M08 | EPC Owner + the deal's rep | — | `SRC` M08 §4 |
| Link opened | F5 | The link's rep (own) — feeds `proposal_opened` when the subject is a proposal | ✓ | `SRC` F5 §4 |
| Proposal accepted | F5 | The rep + EPC Owner | ✓ **immediate** | `SRC` F5 §4 (`C8`'s staff side) |
| Negotiation requested | F5 | The rep (own) | ✓ | `SRC` F5 §4 |
| Proposal declined | F5 | The rep + their Sales Manager (team) | ✓ | `SRC` F5 §4 |
| Customer asked a question | F5 | The record's owner (own) — the tenant-side question inbox entry | ✓ | `SRC` `UXG-12` (the question-inbox F6 half routed by Task 19/20); F5 §4 |
| Customer requested a call | F5/M07 | The rep (own) — also queues the callback (`F5-54`) | ✓ | `SRC` F5 §4 |
| Tracking turned on/off for you | M09 | The affected employee (self) | ✓ | `BRIEF` M09 §4 (`M09-13`) |
| Open check-in needing check-out | M09 | The person (self) + their coordinator | ✓ | `BRIEF` M09 §4 (`M09-24`) |
| Geofence arrival prompt | M09 | The tracked employee (self) | ✓ | `BRIEF` M09 §4 (`M09-51`) |
| Leave requested | M10 | Deciders: HR/Admin + EPC Owner | — | `BRIEF` M10 §4 |
| Leave decided | M10 | The requester (self) | ✓ | `BRIEF` M10 §4 |
| Invite expired | M10/M01 | EPC Owner (act) with HR/Admin visibility | — | `BRIEF` M10 §4; `S1.wrong.1` family |
| Employee document expiring | M10 | HR/Admin + EPC Owner | — | `BRIEF` M10 §4 (`M10-36`) |
| Dunning: payment failed / retry (day 0) | M12 | EPC Owner (+ banner to managers) | ✓ + pack channels | `SRC` `DOC16.dunning-ladder`/`DOC16.dunning-channels` (`M12-39`/`M12-40`) |
| Dunning: metered features paused (day 4) | M12 | EPC Owner (+ banner) | ✓ + pack channels | `SRC` `M12-39` |
| Dunning: final warning (day 6) / halted (day 7) / post-halt cadence | M12 | EPC Owner | ✓ + pack channels | `SRC` `M12-39` |
| Trial nudges (day 7 / 12 / 14) and expiry | M12 | EPC Owner | ✓ | `SRC` `DOC16.trial-nudges` (`M12-42`) |
| Usage 80% warning (per meter/cap) | M12 | EPC Owner | — (usage screen is primary; `M12-34`) | `SRC` `BM-34`/`F8-33` via `M12-34` |
| Reactivation confirmed | M12 | EPC Owner | ✓ | `SRC` M12 §4 |
| Monthly dashboard summary | M13 | EPC Owner | in-app push | `SRC` journey §DASHBOARDS (owner-never-opens fix); `M13-21` |
| System (`system`) | platform | Per announcement's audience (default: EPC Owner) | — | `SRC` `DOC04.notification-types` |

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F6-11 | **Channels are in-app and push, and nothing else, for every staff notification** — with one exception: the M12 dunning family additionally rides the market pack's platform→tenant channel stack (registered-template SMS, opted-in business messaging — `M12-40`'s rows, `F1-38`'s rule). No other event may use an out-of-app channel; a module wanting one is asking for a pack-level decision, not a notification setting. | `SRC` — `DOC14.notifications-search` (push + in-app scope); `DOC16.dunning-channels` (the sanctioned exception; mechanics `M12-40`) | P0 |
| F6-12 | **Grouping: standard events group; nothing important hides.** The centre groups same-type events on the same subject class ("3 proposals opened today") with each item still individually reachable; immediate-class events (F6-13) never group. Grouping is presentation only — every record still exists individually (F6-06). | `SRC` — journey L1548 ("grouped, each actionable") | P1 |
| F6-13 | **Two urgency classes, fixed per type:** **immediate** (agent escalation, proposal accepted — pushed at once, never grouped, never held by quiet hours *within the working day*) and **standard** (everything else — pushed subject to quiet hours, groupable). A type's class is registered, never per-event improvised (no false urgency — F6-03). | `SRC` — `S7.wrong.5` ("immediate escalation… not a task buried in a list"); `C8`'s acceptance urgency (staff side); class discipline `BRIEF` | P0 |
| F6-14 | **Quiet hours: tenant-configurable, applied to push only.** The tenant declares staff quiet hours (default: outside ordinary working hours in the tenant's timezone, `F1-10`; formats per `F1-21` — the defaults ride the market pack's locale conventions, the setting is the tenant's). During quiet hours, standard pushes hold and deliver at the window's end; the in-app record is always immediate. Immediate-class events in practice occur inside working hours (agent calls run in the market's lawful calling window — `F1-36` is the voice law, not this document's), so quiet hours and immediacy do not collide; where they ever would, the push holds and the record stands — no staff notification wakes a phone at night. | `BRIEF` — authoring-plan §Task 23 Step 4 ("tenant-configurable quiet hours via pack"); grounded in `F1-10`/`F1-21` (pack-supplied defaults) | P1 |
| F6-15 | **Per-user notification preferences are minimal and honest:** a user may mute push per type-group (never the in-app record, never audit-relevant billing/compliance events for the Owner); no per-event snooze theatre. The record always lands (F6-06). | `BRIEF` — SME-weight preference surface; the record-always-lands law `SRC` `DOC07.push-best-effort` | P2 |
| F6-16 | **Recipients resolve through F2 scope at emit and at open.** A notification targets personas by scope ("the record's owner", "team's manager", "portfolio Operations"), resolved by F2's domains (`F2-12`–`F2-14`, with team membership per `M10-32`); a recipient who has lost the subject's visibility gets the honest landing (F6.2 edge). No notification widens anyone's visibility — the notification never contains more of the record than its recipient may read. | `SRC` — `D20` via `F2-12` consumed; `F2-14`/`F2-15` | P0 |

**Behavior detail.** The matrix is the registry (F6-05): each row's Source cell is its
provenance, and each raising module's §4 names the same events — the cross-check both ways.
Recipients marked "(self)" are person-targeted regardless of preset (tracking state, leave
decisions); everything else is scope-resolved. The billing family's extra
channels exist because dunning must reach an owner who never opens the app — the one place
out-of-app delivery is load-bearing (`M12-40`).

**Edge cases & what-goes-wrong.**

- *An event matches nobody* (no manager mapped, no sign-off holder) → the event escalates to
  the EPC Owner rather than vanishing — the tenant always has one (`F2-19`); the honest
  fallback recipient of last resort.
- *A recipient holds multiple qualifying presets* → one notification, not one per preset
  (dedupe by person).
- *Notification storm* (bulk import, bulk reassign) → bulk acts emit one grouped notification
  per recipient summarising the batch, not hundreds of rows (F6-12; honesty — the fact is
  "400 leads imported", not 400 facts).

**Acceptance criteria.**

- Given every module's §4 contract (M01–M13, F5), when its named events are checked
  against the matrix, then each appears with recipients and channels, and the matrix contains
  no event no module raises (F6-10).
- Given an agent escalation, when it fires, then the rep's push is immediate and ungrouped,
  and the record deep-links to the call/lead (F6-13, F6-02).
- Given quiet hours configured, when a standard event fires at night, then no push sounds
  before the window ends and the in-app record is already there (F6-14).
- Given any notification, when its content is compared against the recipient's scope, then it
  discloses nothing beyond what the recipient may read (F6-16).

**Localization notes.** All copy per F6-08; the dunning family's out-of-app messages ride the
market's registered templates (`F1-38`). **Analytics events:** per F6.2's; plus grouped-batch
emitted (type, count).

### F6.4 — The notification centre

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F6-17 | **One notification centre: the bell, the badge, the list.** The badge counts unread from the record (never from push state); the list renders grouped per F6-12, filterable by type-group and read state, newest first; every item deep-links and offers its one-step act where the recipient holds it (F6-02). | `SRC` — `DOC14.notifications-search` ("Notification bell centre"); journey L1548 | P0 |
| F6-19 | **History is bounded and honest:** the centre keeps a practical horizon of items (with read state); the underlying facts live on their records' timelines forever — the centre is an inbox, not an archive, and says so at its horizon. | `BRIEF` — inbox posture; the record-of-truth law `SRC` `DOC07.push-best-effort` | P2 |

**Behavior detail.** The centre is one shared surface on both platforms (bell in the web
header, bell in the mobile shell), rendered per F7's shell patterns. Marking-all-read exists
and is honest (it marks read; it deletes nothing). System announcements (`system` type)
render distinctly so product news never masquerades as tenant work.

**Acceptance criteria.**

- Given unread notifications, when the badge renders on any device, then its count derives
  from the records and matches the list (F6-17).

**Localization notes.** Centre chrome translated; items per F6-08. **Analytics events:**
centre opened · filter used · mark-all-read.

### F6.5 — Global search

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F6-20 | **One global search box, everywhere:** finds **leads, customers, sites, proposals, projects and catalog items** — by name, phone or city — plus **people** (employee records) within the searcher's people-records scope. One box in the app shell on web and mobile; results grouped by entity type; every result deep-links. *(The journey's own list says "quotes" — rendered here as proposals per the naming ruling, with the alias law at F6-22.)* | `SRC` — journey §DASHBOARDS L1548 ("one global search field that finds leads, customers, sites, quotes and projects by name, phone or city"); `DOC14.notifications-search` ("app-wide global search"); catalog + people `BRIEF` — authoring-plan §Task 23 Step 4 + M10 §4 | P0 |
| F6-21 | **Search is scoped by role visibility — D20, per domain, no leakage.** A result appears only if the searcher's F2 scopes would let them open it: leads per lead visibility, projects per project visibility, people per people-records scope, campaigns per campaign scope (`F2-12`–`F2-14`). Search never becomes the side door around a scope — the dedupe sheet's minimal-disclosure surface (`M02-08`) is the only sanctioned cross-scope reveal in the product, and it is not this one. | `SRC` — `D20` via `F2-12` consumed (authoring-plan Step 4: "scoped by role visibility D20"); `F2-14`/`F2-15`; `M02-08` boundary noted (register `Q23` untouched) | P0 |
| F6-22 | **The search-alias law (R1's single exception):** the queries "quote" and "quotation" return **Proposals** — because that is what users will type — while both words stay banned from identifiers, interface strings and documents. The alias is a query behaviour only; results, labels and the opened records say "Proposal" in every locale. | `SRC` — `R1` (docs/15 §1 — the search-alias clause routed to this document by the ruling's own mapping; vocabulary law `F3-11`, entity/document half `M06-01`, link wording `F5`'s) | P0 |
| F6-23 | **Junk leads surface in search only.** A lead marked junk leaves every queue and list but is never deleted; search is the one surface that still finds it (with its junk state plain), and Reopen exists from there for the rare mistake. | `SRC` — `R9.junk` (the search-only surface half routed here by Task 13; the state is `M02-55`'s) | P0 |
| F6-24 | **Search is never billing-gated.** In every billing state, search works — it is in the soft-block matrix's always-on set. | `SRC` — `BM-32` consumed (search always on; enforcement M12) | P0 |
| F6-25 | **Search finds records, not analytics:** results are records the searcher can open — no computed answers, no cross-record aggregation, no natural-language querying in v1 (§5). Result ranking is plain (exact identifier matches — phone, proposal number — first; then name/city matches); no engagement tuning. | `BRIEF` — scope discipline; honesty posture consumed (`F8`) | P1 |

**Behavior detail.** Phone-number queries normalise before matching (the phone is the CRM's
identity — `M02-03`'s law makes number search the highest-value path); proposal-number and
project queries match their server-assigned identifiers. Each result row shows the minimal
identifying facts of its record class (name, city, stage/status) — scoped content only
(F6-21). Empty results teach ("no leads match — check spelling or search a phone number"),
never dead-end.

**Edge cases & what-goes-wrong.**

- *A rep searches a customer another rep owns* → no result (out of scope); the capture-time
  dedupe sheet — not search — is where the product prevents the double-chase (`M02-08`,
  `Q23`'s boundary honoured) (F6-21).
- *Search for a merged customer's old name/number* → resolves to the survivor (merge
  re-points; the loser is marked merged, never deleted).
- *"quotation" typed in any locale* → Proposals return (F6-22).
- *Deactivated employee searched* → appears within people-records scope with status plain
  (`M10-10`); never in assignment pickers, which are not search.

**Acceptance criteria.**

- Given a searcher with any scope set, when results render for each entity type, then every
  result is a record their scopes let them open, and none other (F6-21).
- Given the queries "quote" and "quotation", when submitted, then Proposals return and every
  rendered label says Proposal (F6-22).
- Given a junk lead, when its phone number is searched by a user whose scope contains it,
  then it returns with its junk state visible; and given any list or queue, then it does not
  appear there (F6-23).
- Given a halted tenant, when search runs, then results return (F6-24).

**Localization notes.** The search box and result labels are translated; queries match names
in any script; the alias law applies as typed. **Analytics events:** search performed (entity
types returned, none-found flag) · result opened (entity type).

### F6.6 — Message templates: the registry half

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| F6-26 | **One message-template registry supplies every manual copy-paste flow:** templates per key — `proposal_share` · `follow_up_nudge` · `payment_reminder` · `visit_confirmation` · `survey_complete` (the post-survey promise-with-a-date of `foundations/F5`'s `F5-14`, seeded as *"Survey done. Your proposal will reach you by <date>."* with `<date>` as its placeholder — the key was seeded when `Q24` was applied and enters this list by owner ruling 2026-08-06, Q55) · `handover` · `crew_arrival` (the evening-before pre-installation message of `foundations/F5`'s `F5-68`, seeded with who is coming, when, how long it will take and what disturbance to expect, plus the crew lead's name and number — owner ruling 2026-08-06, Q49). **This list is exhaustive, not illustrative (owner ruling 2026-08-06, Q55):** every key the platform seeds appears in it, so this one row answers *"what messages does this product send to customers?"* — and seeding a key anywhere, by any later ruling, task or module, is not complete until the key is added here. Templates are tenant-extendable, one version per template per language (three at launch), with placeholders; the platform seeds a starter set. Consumed by the share flows of `modules/M06`, `M07`, `M08` (and `M11`'s payment-request message); the composed output **sends from the tenant's connected transactional channel where one exists, and is copied for a person to send where none is** (owner ruling 2026-08-04, Q33 — the fallback path claims no delivery, D32's surviving discipline). The hour a scheduled send goes out is never this registry's: it is market-pack data under `F1-15`/`F1-17`, read on the tenant's timezone under `F1-10` (owner rulings 2026-08-06, Q50 and Q54). *(Amended to owner ruling 2026-08-06, Q49 — the authoring act applying `Q46`, not a new decision; this key list previously read `proposal_share` · `follow_up_nudge` · `payment_reminder` · `visit_confirmation` · `handover` and carried no row for the evening-before crew message, a gap `foundations/F5-customer-link.md` §6 recorded as open — register `Q49` — once `Q46` put that message on the automatic transactional lane. The precedent named by the ruling is `survey_complete`, seeded when `Q24` was applied. Nothing else in the row changes; the send-rail sentence and the Q33 fallback discipline are untouched.)* *(Further amended to owner ruling 2026-08-06, Q55 — the list's status and its one missing key. Immediately before this amendment the key list read `proposal_share` · `follow_up_nudge` · `payment_reminder` · `visit_confirmation` · `handover` · `crew_arrival`, and the row said nothing about whether that was the registry's whole seeded set: `survey_complete`, seeded when `Q24` was applied, lived only in `docs/tasks/F-platform.md` T-FPLAT-021's DONE WHEN and `docs/tasks/F5-customer-link.md`'s `F5-14` trace, so two seeded keys were recorded two different ways — the asymmetry §6's `F6-Q4` recorded as open, register `Q55`. The ruling makes the list exhaustive and adds `survey_complete` to it. No key is removed, no seeded copy changes, and the tenant-extendable clause, the send-rail sentence, the Q33 fallback discipline and the never-this-registry's-hour sentence are all untouched.)* | `SRC` — `DOC04.message-templates` (docs/04, verbatim); `TC.message-templates.1` (the F6 half routed by Task 8's routing note; the management surface is `M01-55`'s); `DOC07.messaging-manual` (cited — the fallback flow); send rail per owner ruling 2026-08-04 (Q33); the `crew_arrival` key per owner ruling 2026-08-06 (Q49), its four seeded facts being `foundations/F5`'s `F5-68`; the `survey_complete` key's entry in the list and the exhaustive-list rule per owner ruling 2026-08-06 (Q55), the key itself seeded when Q24 was applied → `foundations/F5`'s `F5-14`; send hour per owner ruling 2026-08-06 (Q50) → `F1-15`, `F1-17`, its clock the tenant's timezone per owner ruling 2026-08-06 (Q54) → `F1-10`, superseding Q50's *"customer's market timezone"* wording | P0 |
| F6-27 | **Templates are tenant data, per language — never translation-catalog messages.** The content-class law is `F3-10`'s; the missing-language behaviour is ruled (owner ruling 2026-08-04, `Q10`): the reader sees the original language with a small note — never a silent substitution — and the gap is surfaced to the author. | `SRC` — `DOC10.templates-are-data` (the F6 half routed by Task 8; the law `F3-10`); labelled-original fallback per owner ruling 2026-08-04 (Q10) | P0 |

**Behavior detail.** The registry is the supply side; authoring lives in tenant settings
(`M01-55`) and campaign-content authoring in M03 (its own surface, `F2.M03.author-campaign-content`).
A consuming flow requests a template by key + language and receives the tenant's version with
placeholders resolved from the record — then it sends from the tenant's connected transactional
channel, or the person copies and sends from their own channel where none is connected
(owner ruling 2026-08-04, Q33; `DOC07.messaging-manual` is the fallback's reference behaviour).
Where the consuming flow is a **scheduled** send rather than a share act — the seeded
`crew_arrival` row is the one such consumer at launch (`foundations/F5`'s `F5-68`) — this
registry supplies the copy and never the moment: the hour is the market pack's, and the
statutory messaging window it sits inside is a floor the scheduler yields to, last lawful
moment before the slot and never after, and the clock that hour is read on is the **tenant's**
timezone (`F1-10`) and never the customer's (`F1-15`, `F1-17`, owner rulings 2026-08-06 Q49,
Q50 and Q54). *(Paragraph extended by the pass applying Q49/Q50; it previously described
share-flow requests only, because the registry had no scheduled consumer. The clock clause was
added by the pass applying Q54; Q50 had read the hour on "the customer's market timezone".)*
**The key list in F6-26 is the registry's whole seeded key set (owner ruling 2026-08-06, Q55),
not a sample of it:** a flow that needs a new seeded message gets its key added to that list in
the same act that seeds it, so a reader asking what messages this product sends to customers
reads one row and no task file. *(Paragraph added by the pass applying Q55; before the ruling
the list's status was undeclared and `survey_complete` was recorded only under `docs/tasks/`.)*

**Acceptance criteria.**

- Given each template key, when a share flow requests it in each launch language, then the
  tenant's version (or the seeded default) returns with placeholders resolved, and the
  composed output sends from the tenant's connected transactional channel where one exists
  and is copied for a person to send where none is — the copy path claiming no delivery
  (F6-26, owner ruling 2026-08-04 Q33). *(This line previously read "no send capability
  exists anywhere in the flow", the pre-Q33 D32 discipline; it contradicted F6-26's own
  reconciled row above and is aligned here — `registers/conflicts.md` row 4, which names
  this PRD-side acceptance copy as the F6 owner's to align; the task-side copy at
  `docs/tasks/F-platform.md` T-FPLAT-021 already carries it.)*
- Given the starter set this registry seeds, when it is inspected, then it carries a
  `crew_arrival` key whose seeded copy carries the four facts `F5-68` requires — who is
  coming, when, how long it will take, what disturbance to expect — plus the crew lead's name
  and number; and given the evening-before scheduler requesting that key in each launch
  language, then the composed output sends from the tenant's connected transactional channel
  where one exists and is copied for a person to send where none is, with no delivery claimed
  on that path; and the hour it goes out resolves from the market pack, never from this
  registry — at that hour on the **tenant's** timezone and never the customer's (`F1-10`)
  (F6-26, `F5-68`, `F1-15`, `F1-17`, owner rulings 2026-08-06 Q49, Q50 and Q54).
  *(Criterion added by the pass applying Q49; before the ruling this registry had no row for
  the crew message and no criterion here tested one. The clock clause was added by the pass
  applying Q54.)*
- Given the starter set this registry seeds, when its keys are compared with F6-26's key list,
  then the two sets are identical — every seeded key is named in the list, including
  `survey_complete` and `crew_arrival`, and the list names no key the starter set lacks
  (F6-26, owner ruling 2026-08-06 Q55). *(Criterion added by the pass applying Q55; before the
  ruling the list's status was undeclared, `survey_complete` was named only under `docs/tasks/`, and
  nothing tested the list against the seeded set.)*

**Localization notes.** Templates are per-language tenant data (`F3-10`); the seeded set
ships in all launch languages. **Analytics events:** template copied (key, language).

## 4. Cross-module contracts

**This document expects:**

| From | What it expects |
|---|---|
| Every module (`M01`–`M13`) and `foundations/F5` | Its §4-named notification events raised with their subjects — exactly the matrix's rows; no unregistered notification, no private alert surface. |
| `foundations/F2` | Scope resolution for recipients and search results (`F2-12`–`F2-14`, `F2-15`); the last-resort Owner guarantee (`F2-19`). |
| `foundations/F3` | Rendering languages; the content-class law for templates (`F3-10`); vocabulary law (`F3-11` — Proposal everywhere, aliases here only). |
| `foundations/F1` | Tenant timezone and locale conventions for quiet-hours defaults (`F1-10`, `F1-21`); registered-template messaging where the dunning family leaves the app (`F1-38`); the pack-declared scheduled-send hour and the statutory messaging window it sits inside for the seeded `crew_arrival` template — hour a default read on the tenant's timezone (`F1-10`), window a floor (`F1-15`, `F1-17`; owner ruling 2026-08-06 Q50 — clause added by the pass applying it, this row previously expected no send-timing content because the registry had no scheduled consumer; the clock added by the pass applying owner ruling 2026-08-06 Q54, which supersedes Q50's "customer's market timezone" wording). |
| `modules/M10` | Team membership (`M10-32`) for manager-scoped recipients. |
| `modules/M12` | The dunning family's ladder, channels and honesty (`M12-39`–`M12-42`) — F6 registers the types; M12 owns the ladder. |

**This document provides:**

| To | What it provides |
|---|---|
| Every module | The one notification centre and type registry (F6-05, F6-17) and the one global search surface (F6-20) — no module builds its own. |
| `modules/M06` / `M07` / `M08` / `M11` | The message-template supply per key and language (F6-26) — every seeded key being named in F6-26's own list, which is exhaustive rather than illustrative (owner ruling 2026-08-06 Q55 — clause added by the pass applying it, this row previously left the list's status unstated). |
| `modules/M13` | Nothing to re-render: the centre is not a dashboard feed; M13's summaries are two registered types in the matrix. |
| `foundations/F5` | The staff-side landing of every customer-side event (opened, accepted, negotiate, declined, question, call request) — F5 raises them, this document routes them. Plus the seeded `crew_arrival` template row that `F5-68`'s evening-before crew message composes from, and the seeded `survey_complete` row that `F5-14`'s promise-with-a-date composes from (`F6-26`; owner ruling 2026-08-06 Q49 — clause added by the pass applying it, this row previously provided events only; `survey_complete` named by the pass applying owner ruling 2026-08-06 Q55, which puts it in F6-26's now-exhaustive key list — the key itself was seeded when Q24 was applied and its emitter is `docs/tasks/M04-survey.md` T-M04-009). |

## 5. Non-goals

- **No customer-facing sending of its own, and no scheduling of its own** — the matrix is
  staff-only; the transactional customer moments send via `foundations/F5`/`modules/M03`'s
  connected channel per the Q33 ruling (2026-08-04), and this document defines no channel for
  them (F6-04). The `crew_arrival` row this registry now seeds (F6-26, owner ruling 2026-08-06
  Q49) does not change that: the copy is this document's, the channel is F5/M03's, and the hour
  is the market pack's floor-bound data, read on the tenant's timezone (`F1-10`, `F1-15`,
  `F1-17`, owner rulings 2026-08-06 Q50 and Q54).
  *(This bullet previously read "the two transactional customer moments"; the count predates
  the `Q46` ruling that put `F5-68`'s evening-before crew message on the same lane and the
  `Q49` act that seeds its row here, so it is no longer stated as a count. The rule itself —
  F6 defines no channel and no send moment — is unchanged.)*
- **No email notification channel for staff in v1** — in-app + push only, with the dunning
  family's pack-channel exception (F6-11). Adding a channel is a pack/product decision, not a
  setting.
- **No engagement mechanics** — no streaks, no re-notification of unchanged facts, no
  urgency theatre (F6-03).
- **No natural-language or analytical search** — records in, records out (F6-25); saved
  searches and cross-record aggregation are out of v1.
- **No per-tenant notification-type configuration** — types, recipients and urgency classes
  are product registry, not tenant settings; the tenant configures quiet hours and per-user
  push mutes only (F6-14, F6-15).
- **No seeded message key recorded outside F6-26's list.** The list is the registry's whole
  seeded key set, not a sample of it (F6-26, owner ruling 2026-08-06 Q55): a task file's DONE
  WHEN, a trace row or a ruling's prose is never the only place a seeded key appears, and a key
  absent from the list is not a seeded key. Tenant-authored templates are the tenant's own data
  (`M01-55`) and are not seeded keys. *(Non-goal recorded by the pass applying Q55; before the
  ruling the list's status was undeclared — the asymmetry §6's F6-Q4 recorded — so there was
  nothing to exclude.)*
- **No archive pretensions** — the centre is an inbox; the record of work is the records'
  timelines (F6-19).

## 6. Open questions

No question of this document's is open. F6-Q4 — the registry-list asymmetry exposed by applying
owner ruling 2026-08-06 `Q49` — is resolved the same day by owner ruling `Q55`; the rest were
resolved 2026-08-04. *(This preamble previously read "One question is raised by this document —
F6-Q4, exposed by applying owner ruling 2026-08-06 `Q49`; the others are resolved", and before
that "This document raised no new question. The two it recorded inputs to were resolved
2026-08-04:". No new question is raised by applying `Q55`.)*

| # | Question | Decision owner |
|---|---|---|
| F6-Q1 | **`Q33` — RESOLVED (owner ruling 2026-08-04).** Transactional sending is automatic from the tenant's connected channel with copy-paste fallback — exactly the outcome this document was built to be indifferent to: the staff-side matrix is unchanged, the customer-side events F5 raises were already routed (F6.3), and F6 still defines no send channel of its own (F6-04, F6-26). | Decision recorded 2026-08-04 (register `Q33`) |
| F6-Q2 | **`Q10` — RESOLVED (owner ruling 2026-08-04).** The labelled fallback won: a missing-language version shows the original language with a small note, never silent substitution; the registry still surfaces the gap to the author (F6-27; `F3-10`). | Decision recorded 2026-08-04 (register `Q10`) |
| F6-Q3 | **`Q49` — RESOLVED (owner ruling 2026-08-06), and it is an authoring act rather than a new decision.** Every automatic transactional send rides a seeded row in this registry (the precedent is `survey_complete`, seeded when `Q24` was applied); `Q46` had put `F5-68`'s evening-before crew message on that lane without naming a row, and `foundations/F5-customer-link.md` §6 recorded the gap. The row is now authored at F6-26 keyed **`crew_arrival`**, its seeded copy carrying `F5-68`'s four facts plus the crew lead's name and number, with the build criterion at `docs/tasks/F-platform.md` T-FPLAT-021. The **hour** it goes out is not this document's — it is market-pack data under `F1-15`/`F1-17` per the same day's `Q50`, so F6-04's no-channel-of-its-own posture is untouched. | Decision recorded 2026-08-06 (register `Q49`); origin `foundations/F5` §6 |
| F6-Q4 | **`Q55` — RESOLVED (owner ruling 2026-08-06).** The F6-26 key list is **exhaustive, not illustrative**: every seeded template key appears in it, so one place answers *"what messages does this product send to customers?"*, and seeding a key — by any later ruling, task or module — is not complete until the key is added to the list. `survey_complete` (`Q24`/`F5-14`) and `crew_arrival` (`Q49`/`F5-68`) are both named in the list itself; F6-26 carries the rule and the prior list, §F6.6's behaviour detail and acceptance block test the list against the seeded set, and §5 carries the matching non-goal. *(This row previously read "**OPEN — newly raised by applying `Q49`; not decided here.** The `survey_complete` key seeded when `Q24` was applied lives only in `docs/tasks/F-platform.md` T-FPLAT-021's DONE WHEN and in `docs/tasks/F5-customer-link.md`'s `F5-14` trace — it never entered F6-26's key list … Whether `survey_complete` (and any key seeded later) belongs in the list is an `foundations/F6`/owner act; this pass added and removed nothing on that ground, and no requirement anywhere depends on the answer today." The owner has ruled that it does belong, and the list is now the whole seeded set. `registers/open-questions.md` `Q55` is that file's owner's to mark closed.)* | Decision recorded 2026-08-06 (register `Q55`); origin `foundations/F6` §6, raised by the `Q49` application |
