# SCR-M13-03 · Operations Home

Blockers by party oldest-first, aged projects by days-in-stage, field day alongside.

**Module:** M13 · Dashboards & reporting · **Personas:** Operations · **Context of use:** web-first — the portfolio view, the blocker groupings and the team view are wide-screen work; mobile for exceptions: the blocker that needs a decision now, the technician who needs reassigning (per `prd/02-personas.md` §Operations, Primary surfaces). Full parity on both surfaces regardless.

## Entry & exit

Reached from: this is the Operations persona's home screen — role decides the home, so signing in lands here (PS-34, M13-39); multi-preset holders reach it via the home switcher (`prd/modules/M13-dashboards-and-reporting.md` §M13.2). Leads to: blocker rows and aged projects open the real project record — a dashboard surfaces and links, it never creates (`prd/modules/M13-dashboards-and-reporting.md` §M13.1); the field-day rollup leads to the live and playback surfaces for tracked seats only (M13-47). Other exits are not pinned by PRD — designer decides, note the decision.

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

- **M13-25** (P0) — **Days-in-stage is the project board's truth, and the dashboard's.** Project ageing renders days-in-stage per the canonical machine — "this one has been in [stage] for 34 days" is the whole insight; aged projects surface to the Owner and Operations. Stage labels render per market pack through F1.
- **M13-39** (P0) — **Operations — home: blockers by party, oldest first** — everything waiting on us before everything waiting on someone else, aged projects by days-in-stage beneath, and the field team's current day alongside (field-day content `M09-62`; blocker facts `M08`'s).
- **M13-47** (P0) — **Field-day rollups for the coordinator personas render M09's content with its honesty intact:** the day-in-progress list, exception rows (open check-ins, visits past window, days not started), and — for tracked seats only — the live and playback surfaces. **Every figure travels with its gaps stated, and no score, ranking or productivity figure accompanies any of it.**

### From prd/02-personas.md

- **PS-34** (P1) — The Operations persona's **home screen is blockers by party, oldest first** — everything waiting on us before everything waiting on someone else — with aged projects by days-in-stage beneath it and the field team's current day alongside.

## States

- **loading** — base state.
- **empty** — base state.
- **error** — base state.
- **normal** — blockers grouped by party oldest-first, aged projects by days-in-stage beneath, the field team's current day alongside.
- **empty-teaching** — brand-new tenant or empty scope: the home teaches what will appear here and why — never a blank or broken chart.
- **waiting-on-us-first** — the deliberate ordering: everything waiting on us renders before everything waiting on someone else, oldest first (M13-39, PS-34).
- **gaps-stated** — field-day figures travelling with their gaps stated; unmarked is unmarked; no score, ranking or productivity figure anywhere (M13-47).
- **tracked-seats-live-gated** — the live and playback surfaces reachable for tracked seats only; untracked seats never show them (M13-47).

## Data volume

Design at realistic volume, not demo volume: blockers grouped by party (us / customer / utility) across a portfolio of active projects, oldest-first within each group; an aged-projects list at portfolio scale, each with its days-in-stage; the field team's whole current day alongside — the day-in-progress list plus exception rows (open check-ins, visits past window, days not started) for a full team. Long content scrolls inside its own region.

## Numbers carrying provenance

Every user-visible number below carries its F8 provenance tier (measured / derived / estimated / assumed) in the design; aggregates inherit the weakest tier of their members.

- Blocker ages — how long each item has waited, driving the oldest-first ordering (durations/dates) — M13-39, PS-34.
- Days-in-stage per aged project ("in [stage] for 34 days") — M13-25.
- Field-day figures: counts of open check-ins, visits past window, days not started; times on the day-in-progress list — every one travelling with its gaps stated, and never a score, ranking or productivity figure (M13-47).
