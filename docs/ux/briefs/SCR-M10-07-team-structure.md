# SCR-M10-07 · Team Structure

Each manager with their direct reports; Owner edits the flat mapping.

**Module:** M10 · HR-lite · **Personas:** EPC Owner (edits — `F2.M10.manage-team-structure`, Owner-only), HR/Admin (reads via `F2.M10.people-records`) · **Context of use:** desk work — changing the mapping is a permission-affecting act in the same authority class as role administration (M10-33's law, `docs/prd/modules/M10-hr-lite.md` §M10.6); everyone sees their own manager and reports on their own record (§M10.6 permissions).

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision. The PRD pins where the mapping renders: "in two places: on the record (manager + direct reports) and as a simple team view (each manager with their reports)" (§M10.6 behavior detail) — this screen is the team view. Leads to: the Employee Record (SCR-M10-03) for any person in the mapping; after an offboard the leaver's mapping is cleared and their reports become unmapped, surfacing as a people-today item (SCR-M10-01; §M10.4/§M10.6 behavior detail).

## Requirements (verbatim)

### From `docs/prd/modules/M10-hr-lite.md`

- **M10-34** (P0) — **Unmapped renders honestly and fails closed.** A Team-scope holder with no direct reports sees a teaching empty team state ("nobody reports to you yet — the Owner sets team structure"), never a silent widening to everyone and never an error. A person with no manager simply has none; nothing breaks. _(non-UI half, build-side: fail closed; unmapped never widens to everyone — for awareness, not for drawing)_

## States

- **loading** — the mapping loading.
- **empty** — a tenant with no mapping yet: a person with no manager simply has none; nothing breaks (M10-34).
- **error** — the mapping cannot load; honest failure, never a silent widening to everyone (M10-34's fail-closed posture).
- **normal** — each manager with their direct reports: a flat mapping, one manager per employee, no transitive tree, no departments, no org chart (M10-31's law, §M10.6); the Owner edits, others read.
- **empty-no-reports-teaching** — a Team-scope holder with no direct reports sees the teaching empty team state ("nobody reports to you yet — the Owner sets team structure"), and no wider data appears (M10-34, §M10.6 acceptance).
- **unmapped-after-offboard** — a manager deactivated: their reports become unmapped and surface in people-today; the unmapped people render honestly here (M10-34, §M10.6 edge).
- **cycle-blocked-error** — a mapping cycle (A manages B manages A) is blocked at save with an explanation; a flat mapping must stay acyclic to mean anything (§M10.6 edge, M10-31's law).

## Data volume

Each manager with their direct reports — a flat mapping only (M10-31's law: direct reports, no transitive tree, no departments, no org chart). Tenant scale is SME with unlimited users (`BM-04`): design from a 1–5 person shop (`BM-14`) with no mapping at all, up to an EPC with several managers each holding a handful-to-tens of reports, plus an unmapped group.

## Numbers carrying provenance

Every user-visible number/date carries its F8 provenance tier in the design:

- Direct-report counts per manager, if the view states them — a count of the mapping's own records, nothing computed beyond it.

No other number, money or date is pinned to this screen by the PRD; mapping-change audit (old → new, actor, time — M10-33's law) is recorded build-side, not drawn here.
