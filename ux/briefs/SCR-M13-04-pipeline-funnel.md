# SCR-M13-04 · Pipeline Funnel

Conversion between CRM stages, leak points, time-in-stage, cycle-time views.

**Module:** M13 · Dashboards & reporting · **Personas:** EPC Owner, Sales Manager · **Context of use:** a step-back analytics read for the two wide-scope personas — web-emphasis with full mobile parity (per `prd/modules/M13-dashboards-and-reporting.md` §2); the manager reaches the funnel from a desk when asking where deals leak, the owner periodically, never as a daily driver. Read-only.

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision. (The owner dashboard carries a **Pipeline** section per M13-14 on SCR-M13-01 and is the natural adjacency, but the PRD does not pin the navigation.) Leads to: not pinned by PRD — designer decides, note the decision; the screen is read-only (M13-22) and, like every dashboard in this module, surfaces and links rather than creating (`prd/modules/M13-dashboards-and-reporting.md` §M13.1).

## Requirements (verbatim)

### From prd/modules/M13-dashboards-and-reporting.md

- **M13-18** (P1) — **The outlier rule:** where one deal skews an average, the dashboard shows medians or flags the outlier — one outsized C&I deal must not make the pipeline look healthier than it is (the source's example is a single large C&I deal distorting the averages). _(non-UI half, build-side: median selection / outlier detection computation — for awareness, not for drawing)_
- **M13-22** (P0) — **The pipeline funnel shows conversion between stages and where deals leak, with time-in-stage** — the funnel over the CRM's own stages, for Owner and Sales Manager (team-scoped), read-only.
- **M13-24** (P0) — **The sales cycle is made measurable, descriptively:** lead-created → won/lost duration (the cycle), duration per funnel stage, and medians per segment — the owner brief's "reduce sales cycle time" goal given its measuring stick. The figures are descriptive facts; where any surface implies a *driver* of cycle change (a campaign, the agent, a process change), the correlation law applies and the caption renders beside the figure. _(non-UI half, build-side: cycle duration computation, per-stage durations, per-segment medians; correlation caption on implied drivers — for awareness, not for drawing)_

## States

- **loading** — base state.
- **empty** — base state.
- **error** — base state.
- **normal** — the funnel over the CRM's own stages: conversion between stages, leak points, time-in-stage, owner scope.
- **team-scoped** — the Sales Manager's rendering: conversion, leaks and time-in-stage cover exactly the team's deals (M13-22).
- **empty-teaching** — brand-new tenant or empty scope: the screen teaches what will appear here and why — never a blank or broken chart.
- **small-sample-n-stated** — a stage with only a few deals: medians over tiny samples render with the n stated; three deals are never presented as a trend (M13-18's rule applied).
- **cycle-time-view** — the descriptive sales-cycle read: lead-created → won/lost duration, duration per funnel stage, medians per segment — every figure with its period and basis stated, and the correlation caption beside any implied driver (M13-24).
- **snoozed-dormant-excluded** — snoozed and dormant leads excluded from active-pipeline views, exactly as My Day excludes them (`prd/modules/M13-dashboards-and-reporting.md` §M13.4 behavior detail).

## Data volume

Design at realistic volume, not demo volume: the funnel fed by a 200-lead book across the CRM's full stage set, with conversion and time-in-stage on every stage transition; cycle-time views over a real closed-deal population with per-segment medians — and, in the same design, the honest opposite: a stage holding only three deals rendering with its n stated. Long content scrolls inside its own region.

## Numbers carrying provenance

Every user-visible number below carries its F8 provenance tier (measured / derived / estimated / assumed) in the design; aggregates inherit the weakest tier of their members.

- Conversion rates between stages and leak figures by stage (rates + counts) — M13-22.
- Time-in-stage per stage (durations) — M13-22.
- Cycle duration: lead-created → won/lost (durations), duration per funnel stage, medians per segment — each with period, basis and median/mean choice stated, never a bare number (M13-24).
- The stated n on small samples (count) — M13-18.
- Medians / flagged outliers wherever one deal skews an average (money + durations) — M13-18.
- The correlation caption beside any figure implying a driver of cycle change — M13-24.
