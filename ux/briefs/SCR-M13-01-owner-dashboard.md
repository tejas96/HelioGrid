# SCR-M13-01 · Owner Dashboard

Periodic decision tool: what-needs-you, cash, pipeline, period, forecast, win/loss, agent card.

**This brief serves two personas and only these two: the EPC Owner, and the Sales Manager team-scoped.** It is the single owner/manager home, and it carries every row that specifies it: `prd/02-personas.md`'s PS-07 and PS-09, together with the module rows the PRD tags "`PS-07` consumed" and "`PS-09` consumed" — M13-29 and M13-30. All four are quoted verbatim below and all four are drawn here; PS-09's own text requires "the same screen serve both, scoped, rather than building a second one." The Sales Executive's own-scoped step-back is a different screen — `ux/briefs/SCR-M13-02-pipeline-dashboard.md` (SCR-M13-02), which carries M13-31 and draws the rep's figures only.

**Module:** M13 · Dashboards & reporting · **Personas:** EPC Owner, Sales Manager · **Context of use:** the owner's step-back surface — periodic (weekly/monthly), not a daily driver. Web-emphasis with full mobile parity (per `prd/modules/M13-dashboards-and-reporting.md` §2); the owner works web for step-back dashboards and reports, mobile for the attention list, triage and approvals (per `prd/02-personas.md` §EPC Owner, Primary surfaces). The Sales Manager uses it balanced: web for step-back views, mobile for the attention list and chasing.

## Entry & exit

Reached from: this is the EPC Owner's home screen — role decides the home, so signing in lands here (M13-29, PS-07); the Sales Manager lands on the same screen team-scoped (M13-30, PS-09). Multi-preset holders reach it via the home switcher (`prd/modules/M13-dashboards-and-reporting.md` §M13.2). Leads to: every "what needs you" item deep-links straight to the real lead, proposal, project or payment (M13-15, PS-07); the Agent card links to Agent performance (M13-14); the team's per-rep view is reachable for the Sales Manager, `F2.M07.agent-performance`-gated (M13-30, PS-09); aged projects open the real project record (dashboards read, surface and link — `prd/modules/M13-dashboards-and-reporting.md` §M13.1). The inline target edit happens on this screen itself — there is no separate targets settings screen (M13-17).

## Composed home (M13-10, P0 — this screen is a role home)

This screen is the home of one preset on the precedence ladder, and **a person has exactly one
home, never two competing front doors**. Where the same person also holds another preset, that
preset's *today-work* is composed into THIS screen as a block rather than sent to a second home —
the PRD's own worked example is a rep who is also a surveyor landing on My Day **with today's
visits shown inside it**. The person can still switch: the shell's switcher (`SCR-SHELL-01`) lists
the home of every preset they hold. Design the block seams: this screen must be able to host one
or more foreign today-blocks without the layout breaking or the screen's own purpose being buried.
The ladder itself is a product constant, not tenant configuration (`M13-10`, register `Q5`).

## Requirements (verbatim)

### From prd/modules/M13-dashboards-and-reporting.md

- **M13-14** (P0) — **The owner dashboard's sections, in priority order:** **What needs you** · **Cash** · **Pipeline** (value and count by stage) · **This period** (won/signed value vs last period, vs target if set) · **Forecast** (weighted, labelled a projection) · **Win/loss** (win rate + loss-reason breakdown) · **Agent** (a compact card linking to Agent performance). The Sales Manager lands on the same dashboard, team-scoped (M13-07, `PS-09`).
- **M13-15** (P0) — **"What needs you" is the honest attention list:** deals stuck or aging, proposals sent-and-not-opened, projects blocked, payments overdue, and leads unassigned past 24 hours (the escalation's landing surface) — each item deep-linking straight to the thing itself.
- **M13-16** (P0) — **Cash: collected vs due this month from the project tranches, and the overdue total** — read from `modules/M11`'s figures with their freshness and confirmation qualifiers intact (M13-08); collections ageing renders the ageing M11 publishes, never a recomputation.
- **M13-17** (P1) — **Targets are optional, inline, and never a nag.** The dashboard works without a target; if used, a monthly target (tenant or per-user scope, one per scope+month) is set **inline on the dashboard** — there is no separate targets settings screen in v1. Stored as the goal only; actuals derive from proposals/payments at read time. _(non-UI half, build-side: target stored as goal only, one per scope+month; actuals derived at read time; no settings screen — for awareness, not for drawing)_
- **M13-18** (P1) — **The outlier rule:** where one deal skews an average, the dashboard shows medians or flags the outlier — one outsized C&I deal must not make the pipeline look healthier than it is (the source's example is a single large C&I deal distorting the averages). _(non-UI half, build-side: median selection / outlier detection computation — for awareness, not for drawing)_
- **M13-20** (P1) — **The two panels that matter lead: "what needs you" and cash.** Pipeline totals and win rate are context and sit below; the attention list and money owed are what an owner acts on.
- **M13-25** (P0) — **Days-in-stage is the project board's truth, and the dashboard's.** Project ageing renders days-in-stage per the canonical machine — "this one has been in [stage] for 34 days" is the whole insight; aged projects surface to the Owner and Operations. Stage labels render per market pack through F1.
- **M13-29** (P0) — **EPC Owner — home: the pipeline dashboard, led by the attention list** (§M13.3 whole).
- **M13-30** (P0) — **Sales Manager — home: the same owner dashboard, team-scoped**, with the team's per-rep view reachable from it (the agent per-rep view stays `F2.M07.agent-performance`-gated).

### From prd/02-personas.md

_These are the persona rows M13-29 and M13-30 consume — the PRD tags them "`PS-07` consumed" and "`PS-09` consumed". They are drawn here, on this screen, and nowhere else._

- **PS-07** (P0) — The EPC Owner's **home screen is the pipeline dashboard**, led by the honest attention list — deals stuck or aging, proposals sent and not opened, projects blocked, payments overdue — each item deep-linking to the thing itself, followed by cash collected versus due, pipeline by stage, this period against last, forecast marked a projection, and win/loss.
- **PS-09** (P0) — The Sales Manager's **home screen is the same dashboard the owner lands on, scoped to their team** — the attention list, cash and pipeline restricted to the team's deals — with the team's per-rep view reachable from it. The source assigns the owner dashboard to "Owner (+ manager, team-scoped)" and makes the same screen serve both, scoped, rather than building a second one.

## States

- **loading** — base state.
- **empty** — base state.
- **error** — base state.
- **normal** — owner scope, all sections populated in the stated priority order (M13-29, PS-07).
- **team-scoped** — the Sales Manager's rendering: same screen, same sections, attention list / cash / pipeline restricted to the team's deals; per-rep view reachable (M13-30, PS-09).
- **empty-teaching** — brand-new tenant or empty scope: the dashboard teaches what will appear here and why — never a blank or broken chart.
- **no-target** — no monthly target set: every section works, no nag appears anywhere (M13-17).
- **target-inline-edit** — a monthly target being set inline on the dashboard itself (M13-17).
- **mid-period-so-far** — a partial period rendered as "so far this month", never projected or annualised as an actual.
- **outlier-flagged** — one outsized deal skews an average: medians shown or the outlier flagged (M13-18).
- **stale-money-qualified** — a cash/pipeline money figure that is provisional says so where it is read; M11's freshness and confirmation qualifiers render intact (M13-16).
- **forecast-labelled** — the Forecast section carrying its "expected, not promised" projection label persistently, never summed with won (M13-14).

## Data volume

Design at realistic volume, not demo volume: an attention list carrying a dozen-plus items across all five categories (deals stuck/aging, proposals sent-and-not-opened, projects blocked, payments overdue, leads unassigned past 24 hours); pipeline value and count across the CRM's full stage set drawn from a 200-lead book; an aged-projects list at portfolio scale with days-in-stage on every card; collections ageing across every bucket M11 publishes. Long content scrolls inside its own region.

## Numbers carrying provenance

Every user-visible number below carries its F8 provenance tier (measured / derived / estimated / assumed) in the design; aggregates inherit the weakest tier of their members; money never renders stale as final.

- Cash collected vs due this month (money, with M11's freshness and confirmation qualifiers intact) — M13-16.
- Overdue total and collections ageing figures (money, M11's published ageing, never recomputed) — M13-16.
- Pipeline value and count by stage (money + counts) — M13-14.
- This period won/signed value, last period comparison value, and the target if set (money) — M13-14, M13-17.
- Forecast weighted-pipeline value (money, labelled a projection, never in the same total as won) — M13-14.
- Win rate and loss-reason breakdown figures (rates + counts) — M13-14.
- Attention-list ages and dates: days a deal has been stuck/aging, proposal sent dates, payment overdue amounts and due dates, hours a lead has sat unassigned past 24 (dates + durations + money) — M13-15.
- Days-in-stage per aged project ("in [stage] for 34 days") — M13-25.
- Medians / flagged-outlier averages wherever one deal skews a figure — M13-18.

(PS-07's and PS-09's figures are this same set — cash collected versus due, pipeline by stage, this period against last, forecast marked a projection, win/loss, and the attention list's ages, dates and overdue amounts — rendered once here, owner-scoped for the EPC Owner and team-scoped for the Sales Manager.)
