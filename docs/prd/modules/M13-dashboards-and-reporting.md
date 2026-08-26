# M13 · Dashboards & reporting

Status: draft · Origin mix: SRC (the journey's dashboards section, D37, the agent-performance
screens, the role-home rows) / BRIEF (the six V2 persona homes and their rollups) · Depends on:
`00-README.md`, `01-product-overview.md`, `02-personas.md`, `04-business-model.md`,
`foundations/F2-roles-and-permissions.md`, `foundations/F8-data-honesty.md`, and every module
whose outputs it renders (`M02`–`M12` as cited)

## 1. Purpose & scope

This module is where a person steps back: the role-decided home screens, the owner's honest
dashboard, pipeline funnel and win/loss analytics, cycle-time measurement, the dashboard
renderings of agent performance, campaign reporting, field-day and people rollups, and the
export rules that travel with all of it. Its source law is `D37`: dashboards are the owner's
**periodic decision tool**, deliberately separate from the task-driven daily screens — the
daily driver stays My Day (tasks, not KPIs), and every tile here must answer *"what do I do
about this?"* If a number does not change a decision, it is not here.

**What this module is not.** It creates nothing — these screens read data other modules
captured, and every attention item deep-links to the real lead, proposal or project. It owns no
figures of its own: cash facts are `modules/M11`'s, pipeline facts `M02`/`M06`/`M07`'s, project
facts `M08`'s, field facts `M09`'s, people facts `M10`'s, usage and billing facts `M12`'s —
this module composes them, scoped by role, with every qualifier the owning module attached
still attached. It is not a BI tool: no custom report builder, no metric invented without a
decision it changes (§5).

## 2. Personas & surfaces

All twelve personas — this is the one module every persona meets first, because **role decides
the home screen** (`PS-01`) and the homes are composed here (§M13.2, §M13.5). Dashboards
proper (owner dashboard, funnel, agent performance) are web-emphasis with full mobile parity;
the role homes are mobile-first working surfaces. The EPC Owner and Sales Manager are the
primary dashboard audiences (`F2.M13.company-reports`); every other persona's surface here is
their own home and their own step-back view, own-scoped by `D20`.

## 3. Feature areas

### M13.1 — The governing rules (every dashboard, no exceptions)

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M13-01 | **Dashboards are the owner's periodic decision tool, deliberately separate from the task-driven daily screens.** My Day and the lists stay *tasks, not KPIs* — a rep never opens a chart to know who to call (`M07-01`'s boundary, reciprocated). Every tile earns its place by answering **"what do I do about this?"**; no new metric is added unless it changes a decision. The product refuses vanity metrics. | `SRC` — `D37` (census, live; docs/15 HONORED); *retired: product journey* §DASHBOARDS & REPORTS L1524–1528 | P0 |
| M13-02 | **These screens READ; they never create.** Everything on them comes from data already captured — leads, proposals, projects, payments, the agent, the field, the people register. A dashboard surfaces and links; it is never a place data is entered. Every attention item deep-links to the real record. (The one sanctioned exception: an optional target may be set inline on the dashboard — M13-17 — because the target is dashboard furniture, not operational data.) | `SRC` — journey §DASHBOARDS L1550–1555 ("These screens READ; they never create"); `D37` (read-only) | P0 |
| M13-03 | **Forecast is a projection, never revenue.** Weighted pipeline (value × stage likelihood), labelled *expected, not promised*, and **never in the same total as won**. Lead estimated value is a weighted-pipeline input — forecast ≠ revenue, anywhere, ever. | `SRC` — `D37`; journey §DASHBOARDS L1531–1533; `DOC04.forecast-not-revenue` (docs/04) | P0 |
| M13-04 | **Won means signed, and a cancellation never silently keeps counting.** A deal cancelled after Won stops counting as revenue immediately (`CANCELLED` in the R2 machine); no report, total or trend quietly keeps it. | `SRC` — `D37`; `R2` (revenue stops immediately — the reporting half; the machine `M08-08`); `S8.wrong.8` (consumed via `M08-36`'s family — "reporting must not silently keep counting it") | P0 |
| M13-05 | **Money never renders stale as final — on every figure here.** Cash, pipeline value, collections ageing and any monetary tile obey the money-never-stale law; a provisional figure says so where it is read. | `SRC` — journey §DASHBOARDS L1534 ("the existing rule holds on every figure here"); `F8-12`–`F8-18` consumed | P0 |
| M13-06 | **Agent contribution is correlation, not attribution.** The owner dashboard's agent card links to Agent performance and never re-claims credit for revenue; every influence figure anywhere in this module renders with the correlation caption beside it, per the F8 law. | `SRC` — `D37`; `F8-30`/`F8-31` consumed (Task 7 owns the law; this module owns screens) | P0 |
| M13-07 | **Visibility follows role on every dashboard: the same screen, scoped.** "A rep sees only their own, a manager their team, the owner everything." No dashboard is a different surface per role — one screen, D20-scoped through F2's domains (`F2-12`, `F2-14`), with team membership resolving over `modules/M10`'s manager mapping (`M10-32`). | `SRC` — `D20` via journey §DASHBOARDS L1538–1539 (quoted; the law is `F2-12`'s, Task 5 — consumed, not re-ruled) | P0 |
| M13-08 | **Every figure keeps its qualifiers.** Freshness, confirmation state, provenance tier, gap statements and caveats attached by the owning module travel onto every dashboard rendering and every export — a dashboard may never drop a qualifier to look cleaner (`M11-54`'s explicit demand, generalized). | `SRC` — `M11-54` (Task 19's hand-off: qualifiers "which a dashboard may not drop"); `F8-07` consumed | P0 |

**Behavior detail.** These eight rules are the module's constitution: every area below is an
application of them, and a proposed tile that fails one of them is rejected by construction.
The rules compose with the suite's honesty foundation rather than restating it — F8 owns the
laws; this module owns the screens they govern.

**Edge cases & what-goes-wrong** (journey §DASHBOARDS "What goes wrong", each carried):

- *Brand-new company, no data* → every dashboard and home teaches what will appear and why —
  never a broken empty chart (M13-12).
- *One outsized deal skews the averages* → medians or a flagged outlier; the pipeline must not
  look healthier than it is (M13-19).
- *No target set* → everything works without one; targets are optional, never a nag (M13-17).
- *Mid-month* → "so far this month" honesty; a partial period is never projected as an actual
  (M13-20).
- *A rep games a metric* → the numbers are descriptive, not a leaderboard; win/loss on closed
  deals is what counts (M13-27).
- *Owner never opens it* → a short monthly summary is pushed in-app (M13-21).

**Acceptance criteria.**

- Given any tile in this module, when challenged, then it names the decision it changes and
  the deep link it offers (M13-01, M13-02).
- Given a forecast figure and a won figure, when any total renders, then they are never summed
  and the forecast carries its label (M13-03).
- Given a project cancelled after Won, when any revenue view renders, then it excludes the
  deal from the moment of cancellation (M13-04).
- Given the same dashboard opened by an owner, a manager and a rep, when compared, then it is
  one surface scoped three ways, and no row outside the viewer's scope appears (M13-07).

**Localization notes.** All dashboard copy EN/HI/MR; money in tenant currency and grouping;
labels and captions render translated beside their figures (`F8-07`). **Analytics events:**
dashboard opened (which, scope class) · tile deep-link followed.

### M13.2 — Role homes & the multi-role composition rule

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M13-09 | **Role decides the home screen, not a setting** — the front door is derived from what the person is (the twelve homes are §M13.5's rows). Nothing in preferences chooses a home; the composition rule below derives it. | `SRC` — `PS-01` (Task 4's disposition of `S1.rec.1`; consumed here per its routing note — not re-appended); journey L1515–1517 | P0 |
| M13-10 | **The composition rule (resolves register `Q5` / F2 `F2-Q1`): one person, one home, chosen by a fixed preset-precedence ladder, with the other presets' today-work composed in as blocks.** The ladder orders the twelve presets by the breadth of the decision surface their home summarises, using `F2-14`'s domain lattice as the input — All-scope first, Team/Portfolio next, Own-scope working presets, then Assigned-only execution presets: **EPC Owner · Sales Manager · Operations · Project Manager · Marketing · Finance · HR/Admin · Sales Executive · Design Engineer · Survey Engineer · Field Technician · Installation Team Member.** A person's home is the home of their highest-ladder preset; every other held preset contributes its today-block inside that home (the source's own worked example: a rep + surveyor lands on My Day with today's visits shown inside it — "not two competing home screens"); and the person **can switch** — a switcher lists the home of every held preset. The ladder is a product constant, not tenant configuration. | `BRIEF` — the decision `registers/open-questions.md` `Q5` assigned to this module, taken with `SRC` inputs: `PS-05` (one person, one home, "widest" + compose + switch), `F2-14` (the domain lattice as input, per `F2-Q1`), journey L1515–1517 | P0 |
| M13-11 | **Composition blocks are the owning module's content, unmodified.** The My Day content contract is `M07`'s (§M07.1); the visits block `M04-38`'s; the sign-off queue `M05-83`'s; the people-today queue `M10-14`'s; the field day `M09-62`'s; money due `M11-54`'s. This module owns placement and scoping, never the facts, and a block keeps its own laws inside the composed home (e.g. the agent-activity block stays separate from the person's own tasks — M13-13). | `SRC` — the owning modules' hand-offs as cited; `S4.screen.6` (the composition half routed here by Task 14) | P0 |
| M13-12 | **Every home and dashboard has a teaching empty state.** A brand-new tenant, an unassigned joiner or an empty scope sees what will appear here, why, and who to ask — never a blank or broken chart. | `SRC` — journey §DASHBOARDS "What goes wrong" (brand-new company); `S1.wrong.3` consumed via M01 | P0 |
| M13-13 | **Agent activity renders as a separate block, never mixed with the person's own tasks** — the rep must see at a glance what a machine did on their behalf; blurring that line is how people stop trusting the automation. Binding on every home this module composes. | `SRC` — `S7.rec.1` (the M13-layout half, routed here by Task 17; the M07 working-surface half is `M07-03`) | P0 |

**Behavior detail.** The ladder's rationale, recorded: within the input lattice, wider scope
means the home summarises more people's work, so it wins the front door (owner over manager
over own-scope). Within the own-scope band, selling leads (Sales Executive's My Day) sit below
the coordinator/staff presets deliberately: a person holding Marketing + Sales Executive is
doing demand generation *and* selling, and campaigns-with-captures composes selling blocks
more naturally than My Day composes campaign state; the switcher makes the choice reversible
in one tap either way. Within the assigned-only band, Design Engineer precedes Survey
Engineer and the field presets because its queue (awaiting work + sign-off) is the one with
downstream dependents (`PS-18`'s composition instinct). The one case the source itself ruled —
rep + surveyor → My Day with visits inside — holds under the ladder (Sales Executive above
Survey Engineer). If the owner ever re-orders the ladder, that is a one-table change here and
nothing else moves (the rule's shape is the decision; the order is data).

**Edge cases & what-goes-wrong.**

- *A person holds one preset* → the ladder is trivial; their home is their preset's (M13-09).
- *Q5's own example — Field Technician + Survey Engineer + Installation Team Member* → home is
  today's visits (Survey Engineer, highest of the three), with the route block and the
  assigned-installation block composed inside; the switcher offers all three (M13-10).
- *EPC Owner who also sells* → owner dashboard first (attention list), My Day one switch away;
  the owner's own overdue items appear in "what needs you" regardless (M13-10, M13-15).
- *A held preset has no work today* → its block renders as its own teaching empty state inside
  the home, or collapses to a summary line — never a fake urgency row (M13-12, F8's spirit).

**Acceptance criteria.**

- Given any combination of held presets, when the person signs in, then their home is the
  highest-ladder preset's home with every other held preset's today-block composed inside,
  and a switcher lists each held preset's home (M13-10).
- Given a composed home, when its blocks are compared with the owning modules' contracts,
  then the content is identical and every block law (separate agent block, no-commercial-figures
  surfaces, gap statements) still holds (M13-11, M13-13).

**Localization notes.** Home and block titles translated; the switcher uses localized preset
names. **Analytics events:** home rendered (winning preset) · home switched (from → to).

### M13.3 — The owner dashboard

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M13-14 | **The owner dashboard's sections, in priority order:** **What needs you** · **Cash** · **Pipeline** (value and count by stage) · **This period** (won/signed value vs last period, vs target if set) · **Forecast** (weighted, labelled a projection) · **Win/loss** (win rate + loss-reason breakdown) · **Agent** (a compact card linking to Agent performance). The Sales Manager lands on the same dashboard, team-scoped (M13-07, `PS-09`). | `SRC` — journey §DASHBOARDS L1543–1544 (the Owner dashboard row, "Sections, in priority order"); `PS-07` consumed | P0 |
| M13-15 | **"What needs you" is the honest attention list:** deals stuck or aging, proposals sent-and-not-opened, projects blocked, payments overdue, and leads unassigned past 24 hours (the escalation's landing surface) — each item deep-linking straight to the thing itself. | `SRC` — journey §DASHBOARDS L1544; `R9.unassigned` (the "needs you" owner-surface half routed here by Task 13; the state is `M02-50`'s, the notification type `foundations/F6`'s) | P0 |
| M13-16 | **Cash: collected vs due this month from the project tranches, and the overdue total** — read from `modules/M11`'s figures with their freshness and confirmation qualifiers intact (M13-08); collections ageing renders the ageing M11 publishes, never a recomputation. | `SRC` — journey §DASHBOARDS L1544 ("Cash"); `M11-54` (Task 19's hand-off) | P0 |
| M13-17 | **Targets are optional, inline, and never a nag.** The dashboard works without a target; if used, a monthly target (tenant or per-user scope, one per scope+month) is set **inline on the dashboard** — there is no separate targets settings screen in v1. Stored as the goal only; actuals derive from proposals/payments at read time. | `SRC` — journey §DASHBOARDS "No target set" wrong-item (inline rule verbatim); `DOC04.targets` (docs/04) | P1 |
| M13-18 | **The outlier rule:** where one deal skews an average, the dashboard shows medians or flags the outlier — one outsized C&I deal must not make the pipeline look healthier than it is (the source's example is a single large C&I deal distorting the averages). | `SRC` — journey §DASHBOARDS "What goes wrong" (outlier row) | P1 |
| M13-19 | **Mid-period honesty:** "so far this month" is stated as such; a partial period is never projected or annualised as if it were an actual. | `SRC` — journey §DASHBOARDS "What goes wrong" (mid-month row); `F8` spirit consumed | P0 |
| M13-20 | **The two panels that matter lead: "what needs you" and cash.** Pipeline totals and win rate are context and sit below; the attention list and money owed are what an owner acts on. | `SRC` — journey §DASHBOARDS L1568–1571 (Recommendation — adopted as layout law) | P1 |
| M13-21 | **If the owner never opens it, a short monthly summary is pushed in-app** — where they actually read things; the same fix as Agent performance's. The notification type registers with `foundations/F6`. | `SRC` — journey §DASHBOARDS "What goes wrong" (owner-never-opens row); `AP.wrong.4` (the M13 half — Task 17 carried M07's) | P1 |

**Behavior detail.** The dashboard is periodic by design — weekly or monthly, not every
morning — and nothing on it nags dailiness. Deep links honour scope: a manager's attention
item opens the team's record they can already read (`F2-12`). "This period" compares signed
value only (M13-04); the forecast tile carries its label persistently (M13-03).

**Edge cases & what-goes-wrong.** Carried at §M13.1 (the journey's six, all present).

**Acceptance criteria.**

- Given the owner dashboard, when it renders, then the seven sections appear in the stated
  order with "what needs you" and cash leading (M13-14, M13-20).
- Given an unassigned lead past 24 h, when the dashboard renders, then it appears in "what
  needs you" deep-linking to the lead (M13-15).
- Given a target unset, when the dashboard renders, then no nag appears anywhere and every
  section works; given a target set inline, then "this period" compares against it (M13-17).

**Localization notes.** Section titles and attention copy translated; money per market
grouping. **Analytics events:** section viewed · attention item followed (type) · target set
inline · monthly summary pushed/opened.

### M13.4 — Pipeline analytics: funnel, win/loss, cycle time

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M13-22 | **The pipeline funnel shows conversion between stages and where deals leak, with time-in-stage** — the funnel over the CRM's own stages, for Owner and Sales Manager (team-scoped), read-only. | `SRC` — journey §DASHBOARDS L1545–1548 (Pipeline funnel + win/loss row); `D20` scoping per M13-07 | P0 |
| M13-23 | **Both reason lists render, kept distinct.** The early **Disqualify** reasons and the late **Mark lost** reasons are different lessons ("losing a quoted deal is a different lesson from disqualifying a renter on day one") and are never merged: win/loss shows both breakdowns by count and value, sourced from the CRM's own reason sets. The "disqualified early" list is `M02-53`'s state's; the "lost late" list `M02-54`'s — including the `Q21` vocabulary mismatch, carried as the CRM carries it, never repaired here. | `SRC` — journey §DASHBOARDS L1546–1548 ("Show BOTH reason lists, kept distinct"); `R9.disqualified` / `R9.lost` (the win-loss list halves routed here by Task 13); register `Q21` (cited, open) | P0 |
| M13-24 | **The sales cycle is made measurable, descriptively:** lead-created → won/lost duration (the cycle), duration per funnel stage, and medians per segment — the owner brief's "reduce sales cycle time" goal given its measuring stick. The figures are descriptive facts; where any surface implies a *driver* of cycle change (a campaign, the agent, a process change), the correlation law applies and the caption renders beside the figure. | `BRIEF` — `docs/prd/owner-brief-2026-08-03.md` §Primary-goals ("reduce sales cycle time"), made measurable; `SRC` framing per `F8-30`/`F8-31` consumed | P0 |
| M13-25 | **Days-in-stage is the project board's truth, and the dashboard's.** Project ageing renders days-in-stage per the canonical machine — "this one has been in [stage] for 34 days" is the whole insight; aged projects surface to the Owner and Operations. Stage labels render per market pack through F1. | `SRC` — `R2` (the days-in-stage metrics half, routed here by Tasks 6/18; machine `M08-08`, labels `F1-51`); `S8.rec.2` consumed via M08 | P0 |
| M13-26 | **Referral analytics live inside win/loss.** Referral-sourced deals are visible in the win/loss view via the referral row (`M02-16`) — the "came from" chip's reporting face. No credits, no balances (the spec-locked exclusion stands). | `SRC` — `R15` (the win/loss analytics half routed here by Task 13; the tag + chip `M02-16`) | P1 |
| M13-27 | **The numbers are descriptive, never a leaderboard.** No ranking of reps, no gamified score; win/loss on **closed** deals is what counts, and a metric a rep could game by relabeling is presented so gaming it is pointless (closed-deal basis, medians, reason breakdowns). | `SRC` — journey §DASHBOARDS "What goes wrong" (rep games a metric); kinship with `M09-09` (no productivity scoring — consumed) | P0 |
| M13-28 | **Campaign-derived figures never render without their caveat.** Any pipeline or win/loss view that cites a campaign renders `M03-57`'s published figures with the correlation caveat travelling — this module may not present them without it, on screen or in export. | `SRC` — `M03-57` (Task 21's hand-off, reciprocated); `F8-30` consumed (`M03-53`'s law) | P0 |

**Behavior detail.** The funnel's stages are the CRM's own — this module invents no stage,
renames nothing, and reads through the same state machine the lists use (R9's states; snoozed
and dormant leads excluded from active-pipeline views exactly as My Day excludes them,
`M07-04`). Cycle-time figures render with their period and basis stated ("closed deals, last
90 days, median") — never a bare number.

**Edge cases & what-goes-wrong.**

- *A stage with three deals* → medians over tiny samples render with the n stated; the product
  does not present three deals as a trend (M13-18's rule applied, F8 spirit).
- *A reopened lost lead closes won* → the cycle counts its full history honestly (reopen
  recorded on the timeline, `R9`'s machine); no cherry-picked restart.
- *Vocabulary mismatch between the two reason sets* (register `Q21`) → carried as the CRM
  carries it; the two lists render exactly the states' own sets (M13-23).

**Acceptance criteria.**

- Given the funnel, when it renders for a Sales Manager, then conversion, leaks and
  time-in-stage cover exactly the team's deals (M13-22, M13-07).
- Given win/loss, when it renders, then the disqualify breakdown and the lost breakdown are
  two distinct lists by count and value (M13-23).
- Given any cycle-time figure, when it renders, then period, basis and median/mean choice are
  stated, and any implied driver carries the correlation caption (M13-24).
- Given a campaign column anywhere in pipeline reporting, when it renders or exports, then
  the caveat is present (M13-28).

**Localization notes.** Funnel stage names are the CRM's localized vocabulary; reason lists
render the states' own localized sets. **Analytics events:** funnel viewed · win/loss viewed ·
cycle-time view rendered (period, scope).

### M13.5 — The twelve persona surfaces

One row per persona — the home this module composes for it (per §M13.2's rule) and the
step-back view it owes them, with the owning-module content contracts cited. `SRC` where the
source names the surface; `BRIEF` where a V2 persona's home is persona-document scope.

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M13-29 | **EPC Owner — home: the pipeline dashboard, led by the attention list** (§M13.3 whole). | `SRC` — journey §DASHBOARDS Owner row; `PS-07` consumed | P0 |
| M13-30 | **Sales Manager — home: the same owner dashboard, team-scoped**, with the team's per-rep view reachable from it (the agent per-rep view stays `F2.M07.agent-performance`-gated). | `SRC` — journey §DASHBOARDS "Owner (+ manager, team-scoped)"; `PS-09` consumed | P0 |
| M13-31 | **Sales Executive — home: My Day** (content contract `M07` §M07.1 — overdue · today · agent activity · upcoming; M13-13's separate-block law); **step-back: the rep dashboard, "how am I doing", secondary to My Day** — my pipeline value, my win rate, my proposals out / opened / accepted, my follow-up load, my target if set; their own data only, own-scoped. | `SRC` — journey §DASHBOARDS Rep-dashboard row (verbatim contents); `S7.rule.my-day` (the role-home half routed here by Task 17; working surface `M07-01`–`M07-04`); `PS-11` consumed | P0 |
| M13-32 | **Survey Engineer — home: today's site visits** — address, customer, time, distance, one-tap navigation and call (content `M04-38`; the composition is this module's). | `SRC` — `S4.screen.6` (the role-home composition half routed here by Task 14); `PS-13` consumed | P0 |
| M13-33 | **Design Engineer — home: designs awaiting work, with the sign-off queue composed in where the person holds sign-off** — the queue's content contract is `M05-83`'s (oldest-first; customer, kWp, designer, waiting time; role-gated), composed into one home per `PS-18`, never a second front door. | `SRC` — `UXG-06` / `M05-83` (the composition half routed here by Task 15); `S5.screen.2` consumed; `PS-16`/`PS-18` consumed | P0 |
| M13-34 | **Project Manager — home: their projects ordered by days-in-stage, blockers first** — each card: customer, size, value, days in current stage, payment collected vs due, blocker flag with who is being waited on (card facts `M08`'s; ageing per M13-25). | `BRIEF` — `PS-21` (home for a V2 persona); card contents from `SRC` `S8.screen.1` consumed via M08 | P0 |
| M13-35 | **Field Technician — home: their route today** — assigned stops in order with window, distance, navigation and call, and the current check-in state (content `M09`'s; `PS-23`). | `BRIEF` — `PS-23`; content contract `M09-62`'s family | P0 |
| M13-36 | **Installation Team Member — home: today's installation** — the assigned job, its checklist progress, access constraints, expected photos — and nothing else; **no commercial figure ever renders on this home or any block composed into it** (the F2-06 surface law, binding on composition). | `BRIEF` — `PS-26`/`PS-27`; `F2-06` consumed (surface law) | P0 |
| M13-37 | **HR/Admin — home: people today** — the `M10-14` queue (invites, joiners, attendance exceptions, leave, documents needing attention); the attendance rollup renders facts and gaps only, never a score (`M10-25`). | `BRIEF` — `PS-30`; content contract `M10-14`/`M10-25` (Task 23) | P0 |
| M13-38 | **Finance — home: money due** — tranches due and overdue by project, receipts waiting, period collections vs expected — every figure with `M11-54`'s qualifiers intact (M13-08). | `BRIEF` — `PS-32`; content contract `M11-54` (Task 19's hand-off) | P0 |
| M13-39 | **Operations — home: blockers by party, oldest first** — everything waiting on us before everything waiting on someone else, aged projects by days-in-stage beneath, and the field team's current day alongside (field-day content `M09-62`; blocker facts `M08`'s). | `BRIEF` — `PS-34`; content contracts `S8.screen.5` (consumed via M08) + `M09-62` (Task 22's hand-off) | P0 |
| M13-40 | **Marketing — home: live campaigns and what they captured** — each campaign with channel, state and its enquiries, captured leads not yet triaged, and the campaign reporting `M03` defines — rendered under `M03-56`'s list-not-model law and `M03-57`'s caveat rule. | `BRIEF` — `PS-36`; content contracts `M03-56`/`M03-57` (Task 21's hand-off) | P0 |

**Behavior detail.** Twelve personas, twelve rows — the verification gate this module was
briefed against. Each home is the owning modules' content composed under §M13.2's rules;
none of the twelve is a "dashboard of numbers" except the two the source makes so (Owner,
Sales Manager), and even those lead with an attention list. Step-back views beyond the rep's
(M13-31) are the dashboards the wide-scope personas already land on; own-scope personas get
their own-data step-back on the same pattern as the rep's where the owning module publishes
the facts (P2, no new figures invented).

**Edge cases & what-goes-wrong.**

- *A persona's module publishes nothing yet (new tenant)* → the teaching empty state per home
  (M13-12).
- *A person holds none of the twelve presets* → cannot happen (`F2-21`: an invitation carries
  at least one preset).

**Acceptance criteria.**

- Given each of the twelve presets held singly, when the person signs in, then their home
  matches their row above, with content identical to the owning module's contract (M13-29
  through M13-40, M13-11).
- Given any surface reachable from the Installation Team Member home, when audited, then no
  price, discount, tranche, margin or customer value appears (M13-36).

**Localization notes.** Home titles and block labels translated; content localization is the
owning modules'. **Analytics events:** covered by §M13.2's home events.

### M13.6 — Agent performance, rendered as dashboards

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M13-41 | **The agent-performance screens render here as dashboard surfaces under D37's rules** — read-only, decision-oriented, monthly-block first (this month vs last: attempted, connected, callbacks, visits booked, handed to a human, unanswered questions → review), with "what it saved you" stated in conversations and hours, never in claimed revenue. The screens' working-surface halves are `M07`'s (§M07.11); this module owns their dashboard rendering and placement. | `SRC` — `AP.retention.1` + `AP.dashboard.1` (the M13 halves routed by Task 17; M07 halves `M07-55`); `D37` | P0 |
| M13-42 | **"Deals it touched" renders with the correlation caption beside the number, always** — *"The agent called and the customer responded within 3 days. We cannot prove the call caused it."* On the screen, not in a tooltip; in every export too. | `SRC` — `AP.dashboard.2` + `AP.honesty.1` + `AP.wrong.3` (the M13 screen halves; the law `F8-30`/`F8-31`, Task 7; M07 half `M07-56`) | P0 |
| M13-43 | **The supporting views render here as they are specified there:** the call log (`M07-57`), unanswered questions (`M07-58` — "where the dashboard turns into improvement"), usage (`M07-59` — the same numbers as billed, entitlement data from M12), and the per-rep view (`M07-60` — Sales Manager's and EPC Owner's only, per `F2.M07.agent-performance`). | `SRC` — `AP.screen.1`–`AP.screen.4` (the M13 halves; M07 halves `M07-57`–`M07-60`) | P0 |
| M13-44 | **The screen defends itself:** a collapsing connect rate surfaces as a warning with the likely cause; an agent escalating almost everything links straight to the unanswered-questions list. Never left for the owner to notice. | `SRC` — `AP.wrong.1` / `AP.wrong.2` (the M13 halves; M07 half `M07-61`) | P1 |
| M13-45 | **A monthly agent summary is pushed in-app to the owner** — the nobody-opens-it fix, shared with M13-21's dashboard summary; the notification type registers with `foundations/F6`. | `SRC` — `AP.wrong.4` (the M13 half; push type F6's) | P1 |

**Behavior detail.** One specification, two surfaces: M07 §M07.11 defines the screens'
content; this module renders them in the dashboard shell with D37's framing and adds nothing —
sample numbers in the source are illustrative, never targets (`AP.dashboard.1`'s note).

**Acceptance criteria.**

- Given the agent dashboard, when "deals it touched" renders or exports, then the caption is
  beside the figure, persistent, not behind any interaction (M13-42).
- Given the per-rep view, when opened by anyone but an EPC Owner or Sales Manager, then it is
  not reachable (M13-43, `F2.M07.agent-performance`).

**Localization notes / Analytics events.** Per M07 §M07.11's; rendering adds none.

### M13.7 — Campaign, field and people rollups

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M13-46 | **Cross-campaign and cross-channel reporting renders exactly what M03 publishes:** campaign identity, channel, audience size, send outcomes, captures — **with the correlation caveat on every derived figure, without exception** (`M03-57`'s condition on this module, accepted as law). The campaign→pipeline view stays a list of the CRM's own records (`M03-56`), scoped by the reader's lead visibility. | `SRC` — `M03-57` (Task 21's hand-off, reciprocated); `M03-56` consumed; `F8-30` law | P0 |
| M13-47 | **Field-day rollups for the coordinator personas render M09's content with its honesty intact:** the day-in-progress list, exception rows (open check-ins, visits past window, days not started), and — for tracked seats only — the live and playback surfaces. **Every figure travels with its gaps stated, and no score, ranking or productivity figure accompanies any of it.** | `SRC` — `M09-62` (Task 22's hand-off, reciprocated); `M09-45` (gaps stated) + `M09-09` (no scoring) consumed as binding conditions | P0 |
| M13-48 | **People rollups are facts and gaps only:** the HR home's attendance rollup renders `M10-25`'s register facts (days marked, leave, unmarked-as-unmarked) and never computes hours-worked, punctuality or any people-score. | `BRIEF` — `M10-25` (Task 23's hand-off); `M09-39`'s absence-never-inferred law consumed | P0 |

**Behavior detail.** These three rows are the module's discipline applied to its newest
inputs: the V2 modules publish honest, gap-stated, unscored facts, and the dashboards must
not launder them into confidence (aggregation inherits the weakest tier — `F8-04` consumed).

**Acceptance criteria.**

- Given any campaign figure on any M13 surface or export, when audited, then the caveat is
  present (M13-46).
- Given a field-day or attendance rollup, when audited, then gaps are stated, unmarked is
  unmarked, and no score of any kind appears (M13-47, M13-48).

**Localization notes / Analytics events.** Per the owning modules; composition adds none.

### M13.8 — Billing vocabulary, usage reporting & the launch metric

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M13-49 | **Reporting vocabulary for plans and billing states is `04-business-model.md`'s, verbatim:** any report segmenting by plan uses the four tier names (`BM-11`); any surface naming a billing state uses the six `BM-33` names. No reporting synonym exists. | `SRC` — `BM-11` / `BM-33` consumed (Task 11 owns; this module is their named reporting consumer) | P0 |
| M13-50 | **Usage figures on any dashboard read M12's rollups — the same numbers as billed** (`F8-33`); no dashboard recomputes usage, and the usage screen itself stays M12's owner-scoped surface (`F2.M12.view-usage-and-invoices`). | `SRC` — `F8-33` consumed; `M12-38` (Task 23's hand-off) | P0 |
| M13-51 | **Trial-to-paid conversion is the launch conversion metric this module reports** — the one acquisition measure named by source; its event taxonomy lands here. | `SRC` — `BM-47` consumed (Task 11 owns the metric; this module its reporting) | P1 |

**Acceptance criteria.**

- Given any plan- or state-segmented report, when its vocabulary is audited, then only
  `BM-11`/`BM-33` names appear (M13-49).
- Given a usage figure on a dashboard, when compared with M12's rollup, then they are the
  same number from the same rollup (M13-50).

**Localization notes / Analytics events.** Tier and state names localize per their owners;
event: trial-to-paid conversion recorded (M13-51).

### M13.9 — Export rules

| ID | Requirement | Tag + source pointer | Tier |
|---|---|---|---|
| M13-52 | **Every dashboard read is exportable, and export works in every billing state** — the read + export law applied to reporting (dashboards and search are in the always-on set; export is never gated). | `SRC` — `BM-32` consumed (the matrix's read/search/dashboards + export rows; enforcement M12's) | P0 |
| M13-53 | **Exports carry everything the screen carried:** provenance labels, freshness qualifiers, correlation caveats, gap statements, the forecast's expected-not-promised label — a caveat that renders beside a number on screen travels into the export beside the same number. | `SRC` — `F8-31` (caveat placement, "travelling into exports" per `M03-53`/`M03-58`'s precedent); `M13-08`'s qualifier law applied | P0 |
| M13-54 | **Exports are scoped exactly as screens are:** an export never contains a row, figure or aggregate the exporting user's visibility scopes would not let them read on the screen (D20 through `F2-12`/`F2-14`), and company-wide report exports ride `F2.M13.company-reports`. | `SRC` — `D20` via `F2-12` consumed; `F2.M13.company-reports` (the existing matrix row) | P0 |

**Behavior detail.** Export formats are utilitarian (CSV for tables, PDF where a screen is a
document-like summary); an export is a snapshot and says when it was taken (freshness
honesty). Nothing here creates a new export pipeline — tenant-level data export remains the
suite-level right (`F1-24`); these rules govern dashboard-shaped exports specifically.

**Acceptance criteria.**

- Given a tenant in `halted`, when any dashboard is opened and exported, then both work
  (M13-52).
- Given an export of a screen bearing caveats and labels, when opened, then every caveat and
  label is present beside its figure (M13-53).
- Given an export by a team-scoped manager, when its rows are audited, then nothing outside
  the team's scope appears (M13-54).

**Localization notes.** Exports render in the exporting user's language with the tenant's
money formats. **Analytics events:** dashboard exported (which, scope class).

## 4. Cross-module contracts

**This module expects** (content contracts, consumed as published):

| From | What it expects |
|---|---|
| `modules/M02` | Funnel stages and the R9 state machine's lists; the unassigned-24h escalation surface facts (`M02-50`); the disqualify/lost reason sets (`M02-53`/`M02-54`); the referral row (`M02-16`). |
| `modules/M03` | The campaign reporting publication (`M03-56`/`M03-57`) with its caveat condition. |
| `modules/M04` | The visits-home content (`M04-38`). |
| `modules/M05` | The sign-off queue contract (`M05-83`); design analytics events. |
| `modules/M06` | Proposal analytics events; version/discount data for pipeline views. |
| `modules/M07` | The My Day content contract (§M07.1); the agent-performance screen set (§M07.11); win/loss list feeds. |
| `modules/M08` | Project cards, blockers, days-in-stage per the R2 machine; `CANCELLED`'s immediate revenue stop. |
| `modules/M09` | The field-day content with gaps stated and no scores (`M09-62`, `M09-45`, `M09-09`). |
| `modules/M10` | The people-today queue (`M10-14`) and register facts (`M10-25`); team membership for Team scoping (`M10-32`). |
| `modules/M11` | Collections figures, ageing and period-vs-expected with qualifiers (`M11-54`). |
| `modules/M12` | Usage rollups (same numbers as billed), billing-state and tier vocabulary, the trial-to-paid event. |
| `foundations/F2` | `F2-12`/`F2-14` scoping; `F2.M13.company-reports`; `F2-06`'s no-commercial-figures surface law on composed homes. |
| `foundations/F8` | Every honesty law this module's screens render under (`F8-04`, `F8-07`, `F8-12`–`F8-18`, `F8-30`/`F8-31`, `F8-33`). |
| `foundations/F1`/`F3` | Market-pack stage labels (`F1-51` via F1-03), formats and localization. |

**This module provides:**

| To | What it provides |
|---|---|
| Every persona | Their role-decided home, composed under §M13.2's rule (the `PS-01` mechanics both M01 and this module carry; M01 owns the first-run handoff onto it, `M01-17`). |
| `foundations/F2` | The resolution of `F2-Q1`'s home-composition half (M13-10), with F2-14 as input — recorded at register `Q5`. |
| `foundations/F6-notifications-and-search.md` (Task 23) | Two notification types: the monthly dashboard summary (M13-21) and the monthly agent summary (M13-45) — both owner-facing, in-app. |
| `modules/M01` | The role homes its first-run handoff lands on (`M01-17`'s reciprocal). |

## 5. Non-goals

- **No metric without a decision** — D37's law is also the module's scope guard: dashboard
  polish and analytics depth are the sanctioned release valves (`DOC14.release-valves`), and
  a vanity wall is out of scope at any depth.
- **No data entry on dashboards** (M13-02; the inline target is the stated exception).
- **No leaderboards, rep rankings or people scores** (M13-27; `M09-09`/`M10-25` kinship).
- **No custom report builder / BI surface in v1** — the report set is this document's;
  demand for more is product feedback, not configuration.
- **No separate targets settings screen** (M13-17's inline rule, source-verbatim).
- **No attribution modeling** — campaign attribution and lead scoring stay `modules/M02`'s
  non-goals, respected here (M13-28; correlation framing only).
- **No delivered state anywhere** — link reporting shows shared → opened → viewed, never
  "delivered" (`F5-28`'s prohibition, binding on every link figure this module renders).

## 6. Open questions

| # | Question | Decision owner |
|---|---|---|
| M13-Q1 | **`Q5` — decision recorded, not open.** The multi-role home composition rule is fixed at M13-10 (fixed preset-precedence ladder over `F2-14`'s lattice; other presets' work composed as blocks; switcher always available). The register row records the decision; the revisit trigger is owner preference on the ladder's order, which is a one-table change (M13.2 behavior detail). | Resolved by this module (Task 23); ladder-order revisit — Owner |
