# M13 · Dashboards & Reporting — engineering tasks

This file covers Module M13 (Dashboards & reporting): the five M13-owned dashboard screens (Owner Dashboard, Pipeline Dashboard, Operations Home, Pipeline Funnel, Win/Loss Analytics), the home-composition engine behind the role-decided homes, the dashboard read-models (revenue/forecast, inline targets, medians/outliers and cycle time), the monthly in-app summaries, trial-to-paid conversion reporting, and dashboard export. Task-id prefix: `T-M13-`. Source doc: `docs/prd/modules/M13-dashboards-and-reporting.md` (rows M13-01…M13-54). Screen tasks' verbatim requirement rows live in the PRD; engine and policy tasks quote their rows in full below. Rows whose surfaces ship in other modules' screens are listed under "Realized elsewhere" with their pointers.


### T-M13-002 · Pipeline Dashboard (Rep's own step-back)

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M13-31 (P0)
**DESIGN:** SCR-M13-02
**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification. (This screen is the Sales Executive's own-scoped step-back only. The EPC Owner's and Sales Manager's home is SCR-M13-01 / T-M13-001, which carries M13-29 and M13-30 — the rows the PRD tags "`PS-07` consumed" and "`PS-09` consumed". `docs/tasks/F-core.md` disposes PS-07 and PS-09 to this screen, but their rendering is routed to SCR-M13-01; PS-09's own text requires one screen serving both scopes, "rather than building a second one". Nothing owner- or manager-scoped is built here.)
**DONE WHEN:**
- Given each of the twelve presets held singly, when the person signs in, then their home matches their row above, with content identical to the owning module's contract (M13-29 through M13-40, M13-11).
- Given a Sales Executive on this screen, when it renders, then it shows their own data only, own-scoped — my pipeline value, my win rate, my proposals out / opened / accepted, my follow-up load, my target if set — and no attention list, cash figure, forecast or team-scoped rendering appears (M13-31; the owner/manager rendering those figures belong to is T-M13-001's).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M13-003 · Operations Home

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M13-25 (P0), M13-39 (P0), M13-47 (P0)
**DESIGN:** SCR-M13-03
**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.
**DONE WHEN:**
- Given each of the twelve presets held singly, when the person signs in, then their home matches their row above, with content identical to the owning module's contract (M13-29 through M13-40, M13-11).
- Given a field-day or attendance rollup, when audited, then gaps are stated, unmarked is unmarked, and no score of any kind appears (M13-47, M13-48).
- Given an Operations user, when their home renders, then blockers are grouped by party with **everything waiting on us before everything waiting on someone else**, oldest first, aged projects by days-in-stage beneath, and the field team's current day alongside (`M13-39`).
- (M13-25 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text in the brief is the binding criterion — project ageing renders days-in-stage per the canonical machine, aged projects surface to the Owner and Operations, and stage labels render per market pack through F1.)
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M13-004 · Pipeline Funnel

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M13-22 (P0), M13-24 (P0)
**DESIGN:** SCR-M13-04
**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.
**DONE WHEN:**
- Given any cycle-time figure, when it renders, then period, basis and median/mean choice are stated, and any implied driver carries the correlation caption (M13-24) (moved from T-M13-009, owner ruling 2026-11-12).
- Given the funnel, when it renders for a Sales Manager, then conversion, leaks and time-in-stage cover exactly the team's deals (M13-22, M13-07).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M13-005 · Win/Loss Analytics

**Type:** screen · **Tier:** P0
**Status:** planned
**PRD rows:** M13-23 (P0), M13-26 (P1)
**DESIGN:** SCR-M13-05
**Requirements (verbatim):** Verbatim rows live in the PRD; they are the specification.
**DONE WHEN:**
- Given win/loss, when it renders, then the disqualify breakdown and the lost breakdown are two distinct lists by count and value (M13-23).
- (M13-26 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text in the brief is the binding criterion — referral-sourced deals are visible in the win/loss view via the referral row, the "came from" chip's reporting face, with no credits and no balances.)
- Given a lead disqualified with one of the six reasons, when win/loss renders, then the lead counts under that reason in the disqualify breakdown (M02-42, M02-53) (moved from the block 3 CRM plan, owner yes 2026-11-09).
- Three base states + brief-listed states present at 375px and 1536px with full parity; zero raw colour literals/off-scale values.

### T-M13-007 · Revenue and forecast read-model

**Placed in block 8** (owner ruling 2026-11-12): a lead carries no value until a proposal prices it, so the weighted pipeline is built with proposals. The won half (M13-04) shipped in block 6 — the owner dashboard counts no cancelled deal.

**Type:** engine · **Tier:** P0
**Status:** planned
**PRD rows:** M13-03
**Design:** as T-M13-001 — the shipped owner home gains its pipeline value, its forecast and one attention item
**Drawn:** stop *Forecast*.
**Why:** the owner sees what the open proposals are worth and what is likely to close — labelled a projection, never added to won — and which sent proposals nobody has opened, so the rep calls today.
**Depends on:** T-M06-025
**Requirements (verbatim):**
- **M13-03** (P0) — **Forecast is a projection, never revenue.** Weighted pipeline (value × stage likelihood), labelled *expected, not promised*, and **never in the same total as won**. Lead estimated value is a weighted-pipeline input — forecast ≠ revenue, anywhere, ever.
**DONE WHEN:**
- Given a forecast figure and a won figure, when any total renders, then they are never summed and the forecast carries its label (M13-03).
- (M13-14's Pipeline section carries value as well as count, and its Forecast section the weighted figure, with no dedicated Given/When/Then line in the PRD's acceptance block for either; the requirement text is the binding criterion — the shipped owner home's Pipeline shows each stage's value beside its count, from the latest shared version of each open proposal, and its Forecast shows the weighted figure labelled a projection.)
- (M13-15's "proposals sent-and-not-opened" item carries no dedicated Given/When/Then line in the PRD's acceptance block; the requirement text is the binding criterion — a shared proposal its customer has not opened appears in "what needs you", deep-linking to the proposal, and leaves the list when the link is first opened.)

**Settle before the build:**
- Stage likelihood — ruled (owner ruling 2026-11-13): per-stage likelihood is market-pack data (a `MarketPack` key with IN's values), never a tenant setting or a constant in this module.
- Demo rows — ruled (owner ruling 2026-11-13): the read model excludes rows marked as demo; while the demo seed (T-M01-029) is parked there are none, and the exclusion is proven when it lands.
- The forecast card (M13-03) — ruled: the figure with its tier, the count of open proposals behind it, one bar split by stage, a row per stage with its count, its total and its likelihood, and the line *Expected, not promised. It is never added to Won.*; a row opens the proposals list (owner ruling 2026-11-13, approved design).

### T-M13-011 · Trial-to-paid conversion reporting

**Type:** engine · **Tier:** P1
**Status:** planned
**Parked:** by owner ruling 2026-11-12 until the new platform pricing replaces billing — the metric reads billing's states, and it has no V1 screen.
**PRD rows:** M13-51
**Requirements (verbatim):**
- **M13-51** (P1) — **Trial-to-paid conversion is the launch conversion metric this module reports** — the one acquisition measure named by source; its event taxonomy lands here.
**DONE WHEN:**
- (M13-51 carries no dedicated Given/When/Then line in the PRD's acceptance blocks; the requirement text above is the binding criterion. The PRD's analytics-events note for §M13.8 names the event: trial-to-paid conversion recorded (M13-51).)

**Settle before the build:**
- No analytics event-stream store in V1: trial-to-paid (M13-51) derives from the `subscription` transitions platform billing (being redesigned) already records — trialing to paid, with timestamps — so the taxonomy is those named transitions and nothing is authored — pick: derive (cost if wrong: an appended analytics_event table whose rows the transitions already imply).


## Laws (enforced through screens and review, no standalone build)

- **M13-01** (P0) — **Dashboards are the owner's periodic decision tool, deliberately separate from the task-driven daily screens.** My Day and the lists stay *tasks, not KPIs* — a rep never opens a chart to know who to call (`M07-01`'s boundary, reciprocated). Every tile earns its place by answering **"what do I do about this?"**; no new metric is added unless it changes a decision. The product refuses vanity metrics. — *Enforced by:* review of every tile on T-M13-001…T-M13-005 against the decision-it-changes test; its acceptance line: Given any tile in this module, when challenged, then it names the decision it changes and the deep link it offers (M13-01, M13-02).

- **M13-02** (P0) — **These screens READ; they never create.** Everything on them comes from data already captured — leads, proposals, projects, payments, the agent, the field, the people register. A dashboard surfaces and links; it is never a place data is entered. Every attention item deep-links to the real record. (The one sanctioned exception: an optional target may be set inline on the dashboard — M13-17 — because the target is dashboard furniture, not operational data.) — *Enforced by:* the read-only construction of all five M13 screen tasks (deep links everywhere, no create affordances) and review; the one sanctioned exception is T-M13-008's inline target; its acceptance line: Given any tile in this module, when challenged, then it names the decision it changes and the deep link it offers (M13-01, M13-02).

- **M13-05** (P0) — **Money never renders stale as final — on every figure here.** Cash, pipeline value, collections ageing and any monetary tile obey the money-never-stale law; a provisional figure says so where it is read. — *Enforced by:* every monetary tile in T-M13-001…T-M13-005 rendering the owning module's freshness/provisional qualifiers (M13-08's travel), and T-M13-012 carrying them into exports; the `stale-money-qualified` state in `SCR-M13-01`.

- **M13-06** (P0) — **Agent contribution is correlation, not attribution.** The owner dashboard's agent card links to Agent performance and never re-claims credit for revenue; every influence figure anywhere in this module renders with the correlation caption beside it, per the F8 law. — *Enforced by:* the agent card in T-M13-001 linking to Agent performance and never re-claiming revenue credit; the correlation caption carried on the agent dashboard surfaces (`SCR-M07-18`, M13-42) and into exports by T-M13-012.

- **M13-07** (P0) — **Visibility follows role on every dashboard: the same screen, scoped.** "A rep sees only their own, a manager their team, the owner everything." No dashboard is a different surface per role — one screen, D20-scoped through F2's domains (`F2-12`, `F2-14`), with team membership resolving over `modules/M10`'s manager mapping (`M10-32`). — *Enforced by:* D20 scoping through F2-12/F2-14 applied to every dashboard read in T-M13-001…T-M13-005 (team membership over M10-32's manager mapping) and to exports by T-M13-012 (M13-54); its acceptance line: Given the same dashboard opened by an owner, a manager and a rep, when compared, then it is one surface scoped three ways, and no row outside the viewer's scope appears (M13-07).

- **M13-08** (P0) — **Every figure keeps its qualifiers.** Freshness, confirmation state, provenance tier, gap statements and caveats attached by the owning module travel onto every dashboard rendering and every export — a dashboard may never drop a qualifier to look cleaner (`M11-54`'s explicit demand, generalized). — *Enforced by:* every screen task rendering the owning modules' qualifiers unmodified, and T-M13-012 carrying every qualifier into exports (M13-53).

- **M13-09** (P0) — **Role decides the home screen, not a setting** — the front door is derived from what the person is (the twelve homes are §M13.5's rows). Nothing in preferences chooses a home; the composition rule below derives it. — *Enforced by:* T-M13-006 deriving the home from held presets alone; review confirms no home-screen preference exists on any settings surface.

- **M13-11** (P0) — **Composition blocks are the owning module's content, unmodified.** The My Day content contract is `M07`'s (§M07.1); the visits block `M04-38`'s; the sign-off queue the design studio's; the people-today queue `M10-14`'s; the field day `M09-62`'s; money due `M11-54`'s. This module owns placement and scoping, never the facts, and a block keeps its own laws inside the composed home (e.g. the agent-activity block stays separate from the person's own tasks — M13-13). — *Enforced by:* T-M13-006 composing owning-module blocks unmodified; review compares each composed block with the owning module's content contract; its acceptance line: Given a composed home, when its blocks are compared with the owning modules' contracts, then the content is identical and every block law (separate agent block, no-commercial-figures surfaces, gap statements) still holds (M13-11, M13-13).

- **M13-12** (P0) — **Every home and dashboard has a teaching empty state.** A brand-new tenant, an unassigned joiner or an empty scope sees what will appear here, why, and who to ask — never a blank or broken chart. — *Enforced by:* the teaching empty state on every screen task in this file (each brief lists an `empty-teaching` state; the screen boilerplate DONE WHEN line requires the base states) and on every composed home via T-M13-006.

- **M13-13** (P0) — **Agent activity renders as a separate block, never mixed with the person's own tasks** — the rep must see at a glance what a machine did on their behalf; blurring that line is how people stop trusting the automation. Binding on every home this module composes. — *Enforced by:* T-M13-006 keeping the agent-activity block separate from the person's own tasks on every home it composes; its acceptance line: Given a composed home, when its blocks are compared with the owning modules' contracts, then the content is identical and every block law (separate agent block, no-commercial-figures surfaces, gap statements) still holds (M13-11, M13-13).

- **M13-19** (P0) — **Mid-period honesty:** "so far this month" is stated as such; a partial period is never projected or annualised as if it were an actual. — *Enforced by:* the `mid-period-so-far` state in `SCR-M13-01` (T-M13-001) and review that no partial-period figure anywhere in T-M13-001…T-M13-005 or T-M13-009 renders projected or annualised.

- **M13-27** (P0) — **The numbers are descriptive, never a leaderboard.** No ranking of reps, no gamified score; win/loss on **closed** deals is what counts, and a metric a rep could game by relabeling is presented so gaming it is pointless (closed-deal basis, medians, reason breakdowns). — *Enforced by:* the closed-deal basis, medians and reason breakdowns built in T-M13-009 and rendered by T-M13-004/T-M13-005; review confirms no ranking, leaderboard or gamified score exists on any M13 surface.

- **M13-28** (P0) — **Campaign-derived figures never render without their caveat.** Any pipeline or win/loss view that cites a campaign renders `M03-57`'s published figures with the correlation caveat travelling — this module may not present them without it, on screen or in export. — *Enforced by:* the `campaign-caveat` state in `SCR-M13-05` (T-M13-005), the caveat travelling on every campaign figure any M13 surface renders, and T-M13-012 carrying it into exports; its acceptance line: Given a campaign column anywhere in pipeline reporting, when it renders or exports, then the caveat is present (M13-28).

- **M13-49** (P0) — **Reporting vocabulary for plans and billing states is platform billing's, verbatim:** any report segmenting by plan uses billing's plan names; any surface naming a billing state uses billing's state names. No reporting synonym exists. — *Enforced by:* review of report copy on every M13 surface and export against billing's plan and state names; its acceptance line: Given any plan- or state-segmented report, when its vocabulary is audited, then only billing's plan and state names appear (M13-49).

- **M13-50** (P0) — **Usage figures on any dashboard read M12's rollups — the same numbers as billed** (`F8-33`); no dashboard recomputes usage, and the usage screen itself stays M12's owner-scoped surface (`F2.M12.view-usage-and-invoices`). — *Enforced by:* dashboards reading platform billing's usage rollups only (platform billing is being redesigned) — no task in this file builds any usage recomputation, and the usage screen remains platform billing's; its acceptance line: Given a usage figure on a dashboard, when compared with M12's rollup, then they are the same number from the same rollup (M13-50).

## Realized elsewhere

These M13 rows specify homes and dashboard renderings whose surfaces ship as other modules' screens; the verbatim row text lives in the pointed brief, and the owning module's screen task builds it. T-M13-006 composes each home per M13-10.

- **M13-32** (P0) → realized-by: SCR-M04-06 screen task (M04 tasks file)
- **M13-33** (P0) → realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet
- **M13-34** (P0) → realized-by: SCR-M08-01 screen task (M08 tasks file)
- **M13-35** (P0) → realized-by: SCR-M09-02 screen task (M09 tasks file)
- **M13-36** (P0) → realized-by: SCR-M08-05 screen task (M08 tasks file); the F2-06 no-commercial-figure surface law binds T-M13-006's composition of this home — its acceptance line: Given any surface reachable from the Installation Team Member home, when audited, then no price, discount, tranche, margin or customer value appears (M13-36).
- **M13-37** (P0) → realized-by: SCR-M10-01 screen task (M10 tasks file)
- **M13-38** (P0) → realized-by: SCR-M11-01 screen task (M11 tasks file)
- **M13-40** (P0) → realized-by: `SCR-M03-01` — T-M03-001 (docs/tasks/M03-marketing.md)
- **M13-41** (P0) → realized-by: `SCR-M07-18` — voice, postponed
- **M13-42** (P0) → realized-by: `SCR-M07-18` — voice, postponed
- **M13-43** (P0) → realized-by: `SCR-M07-19, SCR-M07-10, SCR-M07-20, SCR-M07-18` — voice, postponed
- **M13-44** (P1) → realized-by: `SCR-M07-18` — voice, postponed
- **M13-46** (P0) → realized-by: `SCR-M03-01` — T-M03-001 (docs/tasks/M03-marketing.md); its acceptance line: Given any campaign figure on any M13 surface or export, when audited, then the caveat is present (M13-46).
- **M13-48** (P0) → realized-by: SCR-M10-01 screen task (M10 tasks file); the non-UI half is a prohibition — no hours-worked, punctuality or people-score computation is built anywhere; its acceptance line: Given a field-day or attendance rollup, when audited, then gaps are stated, unmarked is unmarked, and no score of any kind appears (M13-47, M13-48).

## Disposition index

| Row | Disposition |
|---|---|
| M13-01 | LAW |
| M13-02 | LAW |
| M13-03 | T-M13-007 |
| M13-04 | shipped in block 6 — the owner home counts no cancelled deal |
| M13-05 | LAW |
| M13-06 | LAW |
| M13-07 | LAW |
| M13-08 | LAW |
| M13-09 | LAW |
| M13-10 | T-M13-006 (engine) — surface half T-SHELL-001 |
| M13-11 | LAW |
| M13-12 | LAW |
| M13-13 | LAW |
| M13-14 | T-M13-001, shipped — six sections; the agent card returns with voice (postponed) |
| M13-15 | T-M13-001, shipped — proposals sent-and-not-opened: T-M13-007 |
| M13-16 | T-M13-001, shipped |
| M13-17 | T-M13-008, shipped — the company target; a per-person target waits with the per-rep view (voice, postponed) |
| M13-18 | T-M13-009, shipped — the won deal's low median with its n |
| M13-19 | LAW |
| M13-20 | T-M13-001, shipped |
| M13-21 | T-M13-010, shipped — the summary opens the owner home |
| M13-22 | T-M13-004 |
| M13-23 | T-M13-005 |
| M13-24 | T-M13-004 (V2) — the cycle-time figures render on the funnel |
| M13-25 | T-M13-003 |
| M13-26 | T-M13-005 |
| M13-27 | LAW |
| M13-28 | LAW |
| M13-29 | T-M13-001, shipped — proven for the V1 presets; the V2 presets' homes come with their modules |
| M13-30 | T-M13-001, shipped — team = own leads and the unassigned queue until M10 maps teams |
| M13-31 | T-M13-002 |
| M13-32 | realized-by: T-M04-006 — SCR-M04-06 screen task |
| M13-33 | realized-by: the 3D Design Studio, rebuilt from scratch — no PRD or task yet |
| M13-34 | realized-by: T-M08-001 — SCR-M08-01 screen task, shipped |
| M13-35 | realized-by: T-M09-002 — SCR-M09-02 screen task |
| M13-36 | realized-by: T-M08-005 — SCR-M08-05 screen task, shipped |
| M13-37 | realized-by: T-M10-001 — SCR-M10-01 screen task |
| M13-38 | realized-by: T-M11-001 — SCR-M11-01 screen task |
| M13-39 | T-M13-003 |
| M13-40 | realized-by: SCR-M03-01 (T-M03-001) |
| M13-41 | realized-by: SCR-M07-18 — voice, postponed |
| M13-42 | realized-by: SCR-M07-18 — voice, postponed |
| M13-43 | realized-by: SCR-M07-19, SCR-M07-10, SCR-M07-20, SCR-M07-18 — voice, postponed |
| M13-44 | realized-by: SCR-M07-18 — voice, postponed |
| M13-45 | voice — postponed (the agent summary) |
| M13-46 | realized-by: SCR-M03-01 (T-M03-001) |
| M13-47 | T-M13-003 |
| M13-48 | realized-by: T-M10-001 — SCR-M10-01 screen task |
| M13-49 | LAW |
| M13-50 | LAW |
| M13-51 | T-M13-011 |
| M13-52 | T-M13-012, shipped — the CSV is built from the read on screen |
| M13-53 | T-M13-012, shipped |
| M13-54 | T-M13-012, shipped |
- Which proposals the pipeline counts (M13-14) — ruled: one per open lead — its latest shared version, in status shared or accepted; declined, withdrawn, superseded and draft never count; snoozed and dormant leads count at their stage; demo rows never count (owner ruling 2026-11-13, final review).
