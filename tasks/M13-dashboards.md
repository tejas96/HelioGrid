# M13 · Dashboards & Reporting — engineering tasks

This file covers Module M13 (Dashboards & reporting): the five M13-owned dashboard screens (Owner Dashboard, Pipeline Dashboard, Operations Home, Pipeline Funnel, Win/Loss Analytics), the home-composition engine behind the role-decided homes, the dashboard read-models (revenue/forecast, inline targets, medians/outliers and cycle time), the monthly in-app summaries, trial-to-paid conversion reporting, and dashboard export. Task-id prefix: `T-M13-`. Source doc: `prd/modules/M13-dashboards-and-reporting.md` (rows M13-01…M13-54). Screen tasks point at their UX briefs under `ux/briefs/`, where the verbatim requirement rows live; engine and policy tasks quote their rows in full below. Rows whose surfaces ship in other modules' screens are listed under "Realized elsewhere" with their pointers.

### T-M13-001 · Owner Dashboard

**Type:** screen · **Tier:** P0
**PRD rows:** M13-14 (P0), M13-15 (P0), M13-16 (P0), M13-20 (P1), M13-29 (P0), M13-30 (P0)
**DESIGN:** SCR-M13-01 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M13-01-owner-dashboard.md`; they are the specification. (This is the single EPC Owner / Sales Manager home. M13-29 and M13-30 are the rows the PRD tags "`PS-07` consumed" and "`PS-09` consumed" — so the attention list, cash, pipeline, this-period, forecast and win/loss that `prd/02-personas.md`'s PS-07 and PS-09 describe are built once, here, with the manager's rendering the same screen team-scoped. T-M13-002 / SCR-M13-02 is the Sales Executive's own-scoped step-back and builds none of it.)
**DONE WHEN:**
- Given the owner dashboard, when it renders, then the seven sections appear in the stated order with "what needs you" and cash leading (M13-14, M13-20).
- Given an unassigned lead past 24 h, when the dashboard renders, then it appears in "what needs you" deep-linking to the lead (M13-15).
- Given each of the twelve presets held singly, when the person signs in, then their home matches their row above, with content identical to the owning module's contract (M13-29 through M13-40, M13-11).
- (M13-16 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text in the brief is the binding criterion — cash is collected vs due this month from the project tranches plus the overdue total, read from `modules/M11`'s figures with their freshness and confirmation qualifiers intact, and collections ageing renders the ageing M11 publishes, never a recomputation.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M13-002 · Pipeline Dashboard (Rep's own step-back)

**Type:** screen · **Tier:** P0
**PRD rows:** M13-31 (P0)
**DESIGN:** SCR-M13-02 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M13-02-pipeline-dashboard.md`; they are the specification. (This screen is the Sales Executive's own-scoped step-back only. The EPC Owner's and Sales Manager's home is SCR-M13-01 / T-M13-001, which carries M13-29 and M13-30 — the rows the PRD tags "`PS-07` consumed" and "`PS-09` consumed". PS-07 and PS-09 are quoted verbatim in this screen's brief because `tasks/F-core.md` disposes them to it, but the brief now routes their rendering to SCR-M13-01; PS-09's own text requires one screen serving both scopes, "rather than building a second one". Nothing owner- or manager-scoped is built here.)
**DONE WHEN:**
- Given each of the twelve presets held singly, when the person signs in, then their home matches their row above, with content identical to the owning module's contract (M13-29 through M13-40, M13-11).
- Given a Sales Executive on this screen, when it renders, then it shows their own data only, own-scoped — my pipeline value, my win rate, my proposals out / opened / accepted, my follow-up load, my target if set — and no attention list, cash figure, forecast or team-scoped rendering appears (M13-31; the owner/manager rendering those figures belong to is T-M13-001's).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M13-003 · Operations Home

**Type:** screen · **Tier:** P0
**PRD rows:** M13-25 (P0), M13-39 (P0), M13-47 (P0)
**DESIGN:** SCR-M13-03 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M13-03-operations-home.md`; they are the specification.
**DONE WHEN:**
- Given each of the twelve presets held singly, when the person signs in, then their home matches their row above, with content identical to the owning module's contract (M13-29 through M13-40, M13-11).
- Given a field-day or attendance rollup, when audited, then gaps are stated, unmarked is unmarked, and no score of any kind appears (M13-47, M13-48).
- (M13-25 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text in the brief is the binding criterion — project ageing renders days-in-stage per the canonical machine, aged projects surface to the Owner and Operations, and stage labels render per market pack through F1.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M13-004 · Pipeline Funnel

**Type:** screen · **Tier:** P0
**PRD rows:** M13-22 (P0)
**DESIGN:** SCR-M13-04 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M13-04-pipeline-funnel.md`; they are the specification.
**DONE WHEN:**
- Given the funnel, when it renders for a Sales Manager, then conversion, leaks and time-in-stage cover exactly the team's deals (M13-22, M13-07).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M13-005 · Win/Loss Analytics

**Type:** screen · **Tier:** P0
**PRD rows:** M13-23 (P0), M13-26 (P1)
**DESIGN:** SCR-M13-05 → PENDING
**Requirements (verbatim):** Verbatim rows live in `ux/briefs/SCR-M13-05-win-loss-analytics.md`; they are the specification.
**DONE WHEN:**
- Given win/loss, when it renders, then the disqualify breakdown and the lost breakdown are two distinct lists by count and value (M13-23).
- (M13-26 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text in the brief is the binding criterion — referral-sourced deals are visible in the win/loss view via the referral row, the "came from" chip's reporting face, with no credits and no balances.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M13-006 · Home composition engine (preset ladder, composed blocks, switcher)

**Type:** engine · **Tier:** P0
**PRD rows:** M13-10
**Requirements (verbatim):**
- **M13-10** (P0) — **The composition rule (resolves register `Q5` / F2 `F2-Q1`): one person, one home, chosen by a fixed preset-precedence ladder, with the other presets' today-work composed in as blocks.** The ladder orders the twelve presets by the breadth of the decision surface their home summarises, using `F2-14`'s domain lattice as the input — All-scope first, Team/Portfolio next, Own-scope working presets, then Assigned-only execution presets: **EPC Owner · Sales Manager · Operations · Project Manager · Marketing · Finance · HR/Admin · Sales Executive · Design Engineer · Survey Engineer · Field Technician · Installation Team Member.** A person's home is the home of their highest-ladder preset; every other held preset contributes its today-block inside that home (the source's own worked example: a rep + surveyor lands on My Day with today's visits shown inside it — "not two competing home screens"); and the person **can switch** — a switcher lists the home of every held preset. The ladder is a product constant, not tenant configuration.
(M13-10's surface half — the switcher and the composed home in the app shell — ships in `T-SHELL-001` / `ux/briefs/SCR-SHELL-01-app-shell.md`; this task builds the derivation: the fixed preset-precedence ladder as a product constant, the home resolution from held presets, and the composition of every other held preset's today-block from the owning modules' content contracts, unmodified.)
**DONE WHEN:**
- Given any combination of held presets, when the person signs in, then their home is the highest-ladder preset's home with every other held preset's today-block composed inside, and a switcher lists each held preset's home (M13-10).
- Given a composed home, when its blocks are compared with the owning modules' contracts, then the content is identical and every block law (separate agent block, no-commercial-figures surfaces, gap statements) still holds (M13-11, M13-13).

### T-M13-007 · Revenue and forecast read-model

**Type:** engine · **Tier:** P0
**PRD rows:** M13-03, M13-04
**Requirements (verbatim):**
- **M13-03** (P0) — **Forecast is a projection, never revenue.** Weighted pipeline (value × stage likelihood), labelled *expected, not promised*, and **never in the same total as won**. Lead estimated value is a weighted-pipeline input — forecast ≠ revenue, anywhere, ever.
- **M13-04** (P0) — **Won means signed, and a cancellation never silently keeps counting.** A deal cancelled after Won stops counting as revenue immediately (`CANCELLED` in the R2 machine); no report, total or trend quietly keeps it.
**DONE WHEN:**
- Given a forecast figure and a won figure, when any total renders, then they are never summed and the forecast carries its label (M13-03).
- Given a project cancelled after Won, when any revenue view renders, then it excludes the deal from the moment of cancellation (M13-04).

### T-M13-008 · Monthly targets — inline goal storage and derived actuals

**Type:** engine · **Tier:** P1
**PRD rows:** M13-17
**Requirements (verbatim):**
- **M13-17** (P1) — **Targets are optional, inline, and never a nag.** The dashboard works without a target; if used, a monthly target (tenant or per-user scope, one per scope+month) is set **inline on the dashboard** — there is no separate targets settings screen in v1. Stored as the goal only; actuals derive from proposals/payments at read time.
(M13-17's inline set/edit surface is SCR-M13-01's — `ux/briefs/SCR-M13-01-owner-dashboard.md` carries the verbatim row; this task builds the storage — one goal per scope+month, goal only — and the read-time derivation of actuals from proposals/payments.)
**DONE WHEN:**
- Given a target unset, when the dashboard renders, then no nag appears anywhere and every section works; given a target set inline, then "this period" compares against it (M13-17).

### T-M13-009 · Descriptive statistics — medians, outlier flags, cycle-time measurement

**Type:** engine · **Tier:** P0
**PRD rows:** M13-18, M13-24
**Requirements (verbatim):**
- **M13-18** (P1) — **The outlier rule:** where one deal skews an average, the dashboard shows medians or flags the outlier — one outsized C&I deal must not make the pipeline look healthier than it is (the source's example is a single large C&I deal distorting the averages).
- **M13-24** (P0) — **The sales cycle is made measurable, descriptively:** lead-created → won/lost duration (the cycle), duration per funnel stage, and medians per segment — the owner brief's "reduce sales cycle time" goal given its measuring stick. The figures are descriptive facts; where any surface implies a *driver* of cycle change (a campaign, the agent, a process change), the correlation law applies and the caption renders beside the figure.
(The rendering surfaces are SCR-M13-01 and SCR-M13-04 — their briefs carry these verbatim rows too; this task builds the computations: median selection / outlier detection, lead-created → won/lost cycle duration, per-stage durations, per-segment medians, and the stated period/basis on every figure.)
**DONE WHEN:**
- Given any cycle-time figure, when it renders, then period, basis and median/mean choice are stated, and any implied driver carries the correlation caption (M13-24).
- Given a period in which one deal skews an average, when any affected figure renders, then the surface shows a median or flags the outlier — one outsized C&I deal must not make the pipeline look healthier than it is; and given a stage with three deals, then the median renders with the n stated and three deals are not presented as a trend (M13-18; wording taken from the row itself and from `prd/modules/M13-dashboards-and-reporting.md` §M13.4 "Edge cases & what-goes-wrong", the only binding text the PRD carries for this row).
- (M13-18 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text above is the binding criterion. The flag's rendering half is exercised by SCR-M13-01's outlier-flagged state and SCR-M13-04's small-sample-n-stated state under T-M13-001 and T-M13-004; the detection this task builds is what the line above asserts.)

### T-M13-010 · Monthly in-app summaries (dashboard and agent)

**Type:** engine · **Tier:** P1
**PRD rows:** M13-21, M13-45
**Requirements (verbatim):**
- **M13-21** (P1) — **If the owner never opens it, a short monthly summary is pushed in-app** — where they actually read things; the same fix as Agent performance's. The notification type registers with `foundations/F6`.
- **M13-45** (P1) — **A monthly agent summary is pushed in-app to the owner** — the nobody-opens-it fix, shared with M13-21's dashboard summary; the notification type registers with `foundations/F6`.
(The receiving surface is the Notification Center — `T-SHELL-003` / `ux/briefs/SCR-SHELL-03-notification-center.md` carries these verbatim rows; this task builds the monthly summary generation and push scheduling for both summaries, with the two notification types registering with `foundations/F6` per `prd/foundations/F6-notifications-and-search.md`.)
**DONE WHEN:**
- (M13-21 and M13-45 carry no dedicated Given/When/Then lines in the PRD's acceptance blocks; the requirement texts above are the binding criteria.)

### T-M13-011 · Trial-to-paid conversion reporting

**Type:** engine · **Tier:** P1
**PRD rows:** M13-51
**Requirements (verbatim):**
- **M13-51** (P1) — **Trial-to-paid conversion is the launch conversion metric this module reports** — the one acquisition measure named by source; its event taxonomy lands here.
**DONE WHEN:**
- (M13-51 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text above is the binding criterion. The PRD's analytics-events note for §M13.8 names the event: trial-to-paid conversion recorded (M13-51).)

### T-M13-012 · Dashboard export

**Type:** engine · **Tier:** P0
**PRD rows:** M13-52, M13-53, M13-54
**Requirements (verbatim):**
- **M13-52** (P0) — **Every dashboard read is exportable, and export works in every billing state** — the read + export law applied to reporting (dashboards and search are in the always-on set; export is never gated).
- **M13-53** (P0) — **Exports carry everything the screen carried:** provenance labels, freshness qualifiers, correlation caveats, gap statements, the forecast's expected-not-promised label — a caveat that renders beside a number on screen travels into the export beside the same number.
- **M13-54** (P0) — **Exports are scoped exactly as screens are:** an export never contains a row, figure or aggregate the exporting user's visibility scopes would not let them read on the screen (D20 through `F2-12`/`F2-14`), and company-wide report exports ride `F2.M13.company-reports`.
**DONE WHEN:**
- Given a tenant in `halted`, when any dashboard is opened and exported, then both work (M13-52).
- Given an export of a screen bearing caveats and labels, when opened, then every caveat and label is present beside its figure (M13-53).
- Given an export by a team-scoped manager, when its rows are audited, then nothing outside the team's scope appears (M13-54).

## Laws (enforced through screens and review, no standalone build)

- **M13-01** (P0) — **Dashboards are the owner's periodic decision tool, deliberately separate from the task-driven daily screens.** My Day and the lists stay *tasks, not KPIs* — a rep never opens a chart to know who to call (`M07-01`'s boundary, reciprocated). Every tile earns its place by answering **"what do I do about this?"**; no new metric is added unless it changes a decision. The product refuses vanity metrics. — *Enforced by:* review of every tile on T-M13-001…T-M13-005 against the decision-it-changes test; its acceptance line: Given any tile in this module, when challenged, then it names the decision it changes and the deep link it offers (M13-01, M13-02).

- **M13-02** (P0) — **These screens READ; they never create.** Everything on them comes from data already captured — leads, proposals, projects, payments, the agent, the field, the people register. A dashboard surfaces and links; it is never a place data is entered. Every attention item deep-links to the real record. (The one sanctioned exception: an optional target may be set inline on the dashboard — M13-17 — because the target is dashboard furniture, not operational data.) — *Enforced by:* the read-only construction of all five M13 screen tasks (deep links everywhere, no create affordances) and review; the one sanctioned exception is T-M13-008's inline target; its acceptance line: Given any tile in this module, when challenged, then it names the decision it changes and the deep link it offers (M13-01, M13-02).

- **M13-05** (P0) — **Money never renders stale as final — on every figure here.** Cash, pipeline value, collections ageing and any monetary tile obey the money-never-stale law; a provisional figure says so where it is read. — *Enforced by:* every monetary tile in T-M13-001…T-M13-005 rendering the owning module's freshness/provisional qualifiers (M13-08's travel), and T-M13-012 carrying them into exports; the `stale-money-qualified` state in `ux/briefs/SCR-M13-01-owner-dashboard.md`.

- **M13-06** (P0) — **Agent contribution is correlation, not attribution.** The owner dashboard's agent card links to Agent performance and never re-claims credit for revenue; every influence figure anywhere in this module renders with the correlation caption beside it, per the F8 law. — *Enforced by:* the agent card in T-M13-001 linking to Agent performance and never re-claiming revenue credit; the correlation caption carried on the agent dashboard surfaces (`ux/briefs/SCR-M07-18-agent-performance.md`, M13-42) and into exports by T-M13-012.

- **M13-07** (P0) — **Visibility follows role on every dashboard: the same screen, scoped.** "A rep sees only their own, a manager their team, the owner everything." No dashboard is a different surface per role — one screen, D20-scoped through F2's domains (`F2-12`, `F2-14`), with team membership resolving over `modules/M10`'s manager mapping (`M10-32`). — *Enforced by:* D20 scoping through F2-12/F2-14 applied to every dashboard read in T-M13-001…T-M13-005 (team membership over M10-32's manager mapping) and to exports by T-M13-012 (M13-54); its acceptance line: Given the same dashboard opened by an owner, a manager and a rep, when compared, then it is one surface scoped three ways, and no row outside the viewer's scope appears (M13-07).

- **M13-08** (P0) — **Every figure keeps its qualifiers.** Freshness, confirmation state, provenance tier, gap statements and caveats attached by the owning module travel onto every dashboard rendering and every export — a dashboard may never drop a qualifier to look cleaner (`M11-54`'s explicit demand, generalized). — *Enforced by:* every screen task rendering the owning modules' qualifiers unmodified, and T-M13-012 carrying every qualifier into exports (M13-53).

- **M13-09** (P0) — **Role decides the home screen, not a setting** — the front door is derived from what the person is (the twelve homes are §M13.5's rows). Nothing in preferences chooses a home; the composition rule below derives it. — *Enforced by:* T-M13-006 deriving the home from held presets alone; review confirms no home-screen preference exists on any settings surface.

- **M13-11** (P0) — **Composition blocks are the owning module's content, unmodified.** The My Day content contract is `M07`'s (§M07.1); the visits block `M04-38`'s; the sign-off queue `M05-83`'s; the people-today queue `M10-14`'s; the field day `M09-62`'s; money due `M11-54`'s. This module owns placement and scoping, never the facts, and a block keeps its own laws inside the composed home (e.g. the agent-activity block stays separate from the person's own tasks — M13-13). — *Enforced by:* T-M13-006 composing owning-module blocks unmodified; review compares each composed block with the owning module's content contract; its acceptance line: Given a composed home, when its blocks are compared with the owning modules' contracts, then the content is identical and every block law (separate agent block, no-commercial-figures surfaces, gap statements) still holds (M13-11, M13-13).

- **M13-12** (P0) — **Every home and dashboard has a teaching empty state.** A brand-new tenant, an unassigned joiner or an empty scope sees what will appear here, why, and who to ask — never a blank or broken chart. — *Enforced by:* the teaching empty state on every screen task in this file (each brief lists an `empty-teaching` state; the screen boilerplate DONE WHEN line requires the base states) and on every composed home via T-M13-006.

- **M13-13** (P0) — **Agent activity renders as a separate block, never mixed with the person's own tasks** — the rep must see at a glance what a machine did on their behalf; blurring that line is how people stop trusting the automation. Binding on every home this module composes. — *Enforced by:* T-M13-006 keeping the agent-activity block separate from the person's own tasks on every home it composes; its acceptance line: Given a composed home, when its blocks are compared with the owning modules' contracts, then the content is identical and every block law (separate agent block, no-commercial-figures surfaces, gap statements) still holds (M13-11, M13-13).

- **M13-19** (P0) — **Mid-period honesty:** "so far this month" is stated as such; a partial period is never projected or annualised as if it were an actual. — *Enforced by:* the `mid-period-so-far` state in `ux/briefs/SCR-M13-01-owner-dashboard.md` (T-M13-001) and review that no partial-period figure anywhere in T-M13-001…T-M13-005 or T-M13-009 renders projected or annualised.

- **M13-27** (P0) — **The numbers are descriptive, never a leaderboard.** No ranking of reps, no gamified score; win/loss on **closed** deals is what counts, and a metric a rep could game by relabeling is presented so gaming it is pointless (closed-deal basis, medians, reason breakdowns). — *Enforced by:* the closed-deal basis, medians and reason breakdowns built in T-M13-009 and rendered by T-M13-004/T-M13-005; review confirms no ranking, leaderboard or gamified score exists on any M13 surface.

- **M13-28** (P0) — **Campaign-derived figures never render without their caveat.** Any pipeline or win/loss view that cites a campaign renders `M03-57`'s published figures with the correlation caveat travelling — this module may not present them without it, on screen or in export. — *Enforced by:* the `campaign-caveat` state in `ux/briefs/SCR-M13-05-win-loss-analytics.md` (T-M13-005), the caveat travelling on every campaign figure any M13 surface renders, and T-M13-012 carrying it into exports; its acceptance line: Given a campaign column anywhere in pipeline reporting, when it renders or exports, then the caveat is present (M13-28).

- **M13-49** (P0) — **Reporting vocabulary for plans and billing states is `04-business-model.md`'s, verbatim:** any report segmenting by plan uses the four tier names (`BM-11`); any surface naming a billing state uses the six `BM-33` names. No reporting synonym exists. — *Enforced by:* review of report copy on every M13 surface and export against the four tier names and six state names; its acceptance line: Given any plan- or state-segmented report, when its vocabulary is audited, then only `BM-11`/`BM-33` names appear (M13-49).

- **M13-50** (P0) — **Usage figures on any dashboard read M12's rollups — the same numbers as billed** (`F8-33`); no dashboard recomputes usage, and the usage screen itself stays M12's owner-scoped surface (`F2.M12.view-usage-and-invoices`). — *Enforced by:* dashboards reading M12's rollups only — no task in this file builds any usage recomputation, and the usage screen remains M12's; its acceptance line: Given a usage figure on a dashboard, when compared with M12's rollup, then they are the same number from the same rollup (M13-50).

## Realized elsewhere

These M13 rows specify homes and dashboard renderings whose surfaces ship as other modules' screens; the verbatim row text lives in the pointed brief, and the owning module's screen task builds it. T-M13-006 composes each home per M13-10.

- **M13-32** (P0) → realized-by: `ux/briefs/SCR-M04-06-my-visits-today.md` — SCR-M04-06 screen task (M04 tasks file)
- **M13-33** (P0) → realized-by: `ux/briefs/SCR-MS-02-design-queue.md` — SCR-MS-02 screen task (studio tasks file)
- **M13-34** (P0) → realized-by: `ux/briefs/SCR-M08-01-project-board.md` — SCR-M08-01 screen task (M08 tasks file)
- **M13-35** (P0) → realized-by: `ux/briefs/SCR-M09-02-my-day-route.md` — SCR-M09-02 screen task (M09 tasks file)
- **M13-36** (P0) → realized-by: `ux/briefs/SCR-M08-05-installer-job-home.md` — SCR-M08-05 screen task (M08 tasks file); the F2-06 no-commercial-figure surface law binds T-M13-006's composition of this home — its acceptance line: Given any surface reachable from the Installation Team Member home, when audited, then no price, discount, tranche, margin or customer value appears (M13-36).
- **M13-37** (P0) → realized-by: `ux/briefs/SCR-M10-01-people-today-queue.md` — SCR-M10-01 screen task (M10 tasks file)
- **M13-38** (P0) → realized-by: `ux/briefs/SCR-M11-01-finance-home.md` — SCR-M11-01 screen task (M11 tasks file)
- **M13-40** (P0) → realized-by: `ux/briefs/SCR-M03-01-campaign-list.md` — T-M03-001 (tasks/M03-marketing.md)
- **M13-41** (P0) → realized-by: `ux/briefs/SCR-M07-18-agent-performance.md` — T-M07-018 (tasks/M07-sales-execution.md)
- **M13-42** (P0) → realized-by: `ux/briefs/SCR-M07-18-agent-performance.md` — T-M07-018 (tasks/M07-sales-execution.md)
- **M13-43** (P0) → realized-by: `ux/briefs/SCR-M07-19-call-log.md, ux/briefs/SCR-M07-10-unanswered-questions.md, ux/briefs/SCR-M07-20-agent-usage.md, ux/briefs/SCR-M07-18-agent-performance.md` — T-M07-019, T-M07-010, T-M07-020, T-M07-018 (tasks/M07-sales-execution.md)
- **M13-44** (P1) → realized-by: `ux/briefs/SCR-M07-18-agent-performance.md` — T-M07-018 (tasks/M07-sales-execution.md)
- **M13-46** (P0) → realized-by: `ux/briefs/SCR-M03-01-campaign-list.md` — T-M03-001 (tasks/M03-marketing.md); its acceptance line: Given any campaign figure on any M13 surface or export, when audited, then the caveat is present (M13-46).
- **M13-48** (P0) → realized-by: `ux/briefs/SCR-M10-01-people-today-queue.md` — SCR-M10-01 screen task (M10 tasks file); the non-UI half is a prohibition — no hours-worked, punctuality or people-score computation is built anywhere; its acceptance line: Given a field-day or attendance rollup, when audited, then gaps are stated, unmarked is unmarked, and no score of any kind appears (M13-47, M13-48).

## Disposition index

| Row | Disposition |
|---|---|
| M13-01 | LAW |
| M13-02 | LAW |
| M13-03 | T-M13-007 |
| M13-04 | T-M13-007 |
| M13-05 | LAW |
| M13-06 | LAW |
| M13-07 | LAW |
| M13-08 | LAW |
| M13-09 | LAW |
| M13-10 | T-M13-006 (engine) — surface half T-SHELL-001 |
| M13-11 | LAW |
| M13-12 | LAW |
| M13-13 | LAW |
| M13-14 | T-M13-001 |
| M13-15 | T-M13-001 |
| M13-16 | T-M13-001 |
| M13-17 | T-M13-008 |
| M13-18 | T-M13-009 |
| M13-19 | LAW |
| M13-20 | T-M13-001 |
| M13-21 | T-M13-010 (engine) — surface half T-SHELL-003 |
| M13-22 | T-M13-004 |
| M13-23 | T-M13-005 |
| M13-24 | T-M13-009 |
| M13-25 | T-M13-003 |
| M13-26 | T-M13-005 |
| M13-27 | LAW |
| M13-28 | LAW |
| M13-29 | T-M13-001 |
| M13-30 | T-M13-001 |
| M13-31 | T-M13-002 |
| M13-32 | realized-by: T-M04-006 — ux/briefs/SCR-M04-06-my-visits-today.md (SCR-M04-06 screen task) |
| M13-33 | realized-by: T-MS-375 (`tasks/MS-studio-c.md`) — brief `ux/briefs/SCR-MS-02-design-queue.md` |
| M13-34 | realized-by: T-M08-001 — ux/briefs/SCR-M08-01-project-board.md (SCR-M08-01 screen task) |
| M13-35 | realized-by: T-M09-002 — ux/briefs/SCR-M09-02-my-day-route.md (SCR-M09-02 screen task) |
| M13-36 | realized-by: T-M08-005 — ux/briefs/SCR-M08-05-installer-job-home.md (SCR-M08-05 screen task) |
| M13-37 | realized-by: T-M10-001 — ux/briefs/SCR-M10-01-people-today-queue.md (SCR-M10-01 screen task) |
| M13-38 | realized-by: T-M11-001 — ux/briefs/SCR-M11-01-finance-home.md (SCR-M11-01 screen task) |
| M13-39 | T-M13-003 |
| M13-40 | realized-by: ux/briefs/SCR-M03-01-campaign-list.md (T-M03-001) |
| M13-41 | realized-by: ux/briefs/SCR-M07-18-agent-performance.md (T-M07-018) |
| M13-42 | realized-by: ux/briefs/SCR-M07-18-agent-performance.md (T-M07-018) |
| M13-43 | realized-by: ux/briefs/SCR-M07-19-call-log.md, SCR-M07-10-unanswered-questions.md, SCR-M07-20-agent-usage.md, SCR-M07-18-agent-performance.md (T-M07-019, T-M07-010, T-M07-020, T-M07-018) |
| M13-44 | realized-by: ux/briefs/SCR-M07-18-agent-performance.md (T-M07-018) |
| M13-45 | T-M13-010 (engine) — surface half T-SHELL-003 |
| M13-46 | realized-by: ux/briefs/SCR-M03-01-campaign-list.md (T-M03-001) |
| M13-47 | T-M13-003 |
| M13-48 | realized-by: T-M10-001 — ux/briefs/SCR-M10-01-people-today-queue.md (SCR-M10-01 screen task) |
| M13-49 | LAW |
| M13-50 | LAW |
| M13-51 | T-M13-011 |
| M13-52 | T-M13-012 |
| M13-53 | T-M13-012 |
| M13-54 | T-M13-012 |
