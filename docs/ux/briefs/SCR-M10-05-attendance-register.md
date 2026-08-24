# SCR-M10-05 · Attendance Register

Per-person per-day calendar of M09 facts, leave, holidays; unmarked stays unmarked.

**Module:** M10 · HR-lite · **Personas:** HR/Admin, EPC Owner, Employee (own) · **Context of use:** web-first desk work — the register is desk work (`docs/prd/modules/M10-hr-lite.md` §2: "Web-first for records, documents and the register"); reads reach HR/Admin through `F2.M09.attendance-visibility` — the attendance slice only, no route, position, geofence event or movement fact ever (M10-30's law).

## Entry & exit

Reached from: the Employee Record (SCR-M10-03) — the record composes "attendance summary for the current period (§M10.5, register slice)"; attendance exceptions in the People Today Queue (SCR-M10-01) resolve against the person's own timeline (M10-26); an employee's route to their own register is not pinned by PRD — designer decides, note the decision. Leads to: corrections ride M09's correction-by-append — the register never edits a captured fact (M10-26), so any correction act belongs to M09's surfaces; leave decisions land here from the leave flow (M10-27, SCR-M10-06).

## Requirements (verbatim)

### From `docs/prd/modules/M10-hr-lite.md`

- **M10-25** (P0) — **The register is a calendar of facts:** per person, per day — day start/end times with their capture provenance (from M09), leave (with type) where approved, tenant holidays, and unmarked days as unmarked. Period views (week/month) aggregate **counts of recorded facts only** (days marked, days on leave) and compute no punctuality, hours-worked or productivity figure (§5; `M09-09`'s no-scoring law extends here).
- **M10-26** (P1) — **Attendance exceptions surface in people-today:** yesterday's unmarked days, days with a start and no end (M09's open check-in / missing day-end state), and corrections awaiting review — each resolvable by looking at the person's own timeline (the persona's stated behaviour), never auto-resolved. Corrections ride M09's correction-by-append (`M09-38`); the register never edits a captured fact.
- **M10-27** (P0) — **Leave is a request-and-decision record, SME-weight.** Any employee requests their own leave (dates, a type, an optional note); HR/Admin or the EPC Owner decides; the decision lands on the register and the person is notified. Leave **types are tenant-configured labels** (market-neutral — no statutory leave taxonomy is built in; a market's statutory leave rules, if ever encoded, are `pack.data-rights`-family pack data). **No accrual arithmetic exists in v1**: no balances, no carry-forward, no quota enforcement — the register records what was taken; policy lives with the tenant (stated as scope, not gap — SME-weight, §M10.1). _(non-UI half, build-side: no accrual arithmetic; leave types are tenant-configured labels — for awareness, not for drawing)_
- **M10-28** (P2) — **The tenant holiday calendar renders on the register.** Tenant-declared holidays appear as holidays (tenant configuration, `F2.M01.manage-tenant-settings`); they imply nothing about any person's day beyond the label. This calendar is distinct from the calling-window holiday calendar the voice compliance gate uses (`F1-50`, M07's consumption) — the two are separate data with separate consequences, and this module touches only its own. _(non-UI half, build-side: distinct data from F1-50 calling-window holiday calendar — for awareness, not for drawing)_

## States

- **loading** — the calendar loading.
- **empty** — see empty-zero-config below; a person with no facts at all renders a calendar of unmarked days, never an error.
- **error** — the register cannot load; honest failure, no fabricated day states.
- **normal** — per person, per day: day start/end times with capture provenance, leave with type where approved, tenant holidays, unmarked days as unmarked; week/month period views aggregate counts of recorded facts only (M10-25).
- **unmarked-day** — a day with no marks renders as unmarked — never as "absent", never red, never a score (M10-24's law, cited in M10-25's §5 pointer; §M10.5 acceptance).
- **leave-day** — approved leave paints those days as leave, with its tenant-configured type label (M10-27, §M10.5 behavior detail).
- **holiday** — a tenant-declared holiday renders as a holiday and implies nothing about any person's day beyond the label (M10-28).
- **start-no-end** — a day with a start and no end (M09's open check-in / missing day-end state) shown as the fact it is (M10-26).
- **correction-trail** — a correction arrives as M09's append with the original preserved; the register shows the corrected value with its trail (M10-26, §M10.5 acceptance).
- **worked-during-leave-both-facts** — a person who worked during approved leave shows both facts — the register does not resolve the contradiction, it shows it (§M10.5 behavior detail; retroactive regularisation edge).
- **empty-zero-config** — a tenant with no holiday calendar and no leave types configured: the register still works, facts and unmarked days only (§M10.5 edge — zero-config posture).

## Data volume

Per person, per day, in week/month period views (M10-25) — design the month view at a full month of days per person, each day carrying up to: start/end times with provenance, a leave label, a holiday label, or unmarked. Period aggregates are counts of recorded facts only (days marked, days on leave). Tenant scale is SME with unlimited users (`BM-04`) — if the register offers a multi-person view, design it at tens of people; the PRD pins only the per-person calendar.

## Numbers carrying provenance

Every user-visible number/date carries its F8 provenance tier in the design:

- Day start/end times with their capture provenance, from M09 — the provenance travels with each time (M10-25).
- Leave days with type and their decision record (who decided, when — §M10.5 acceptance: "the decision is attributed (who, when)") (M10-27).
- Tenant holiday dates (M10-28).
- Period counts: days marked, days on leave — counts of recorded facts only; no punctuality, hours-worked or productivity figure exists (M10-25).
- Correction trail: original and corrected values with their capture/append times (M10-26).
