# SCR-M10-02 · People List

Every employee with status, role chips, manager and joined date; deep-links to M01 for admin acts.

**Module:** M10 · HR-lite · **Personas:** HR/Admin (primary), EPC Owner · **Context of use:** web-first desk work — "records, documents, imports and the people list are desk work" (`docs/prd/02-personas.md` §HR/Admin, Primary surfaces); mobile still full-featured (`docs/prd/modules/M10-hr-lite.md` §2).

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision (the PRD defines the list as "the records surface", `M10-11`, without pinning its navigation entry). Leads to: the Employee Record (SCR-M10-03) — a person's row opens their record; role-administration acts (invite, assign roles, deactivate) deep-link to `modules/M01`'s Team screens (`M01-19`–`M01-21`), never performed here (M10-11, M10-04's boundary).

## Requirements (verbatim)

### From `docs/prd/modules/M10-hr-lite.md`

- **M10-10** (P0) — **Deactivated people stay in the register.** Deactivation hides a person from assignment pickers and ends sessions (F2-20, via M01); it never removes them from the people list, their record, their documents or their history — "deactivate, never delete." The list shows status plainly. _(non-UI half, build-side: deactivate-never-delete invariant (F2-20 family) — for awareness, not for drawing)_
- **M10-11** (P1) — **The people list is the records surface, not a second Team screen.** It lists every employee with status, role chips, manager and joined date, filterable by status and preset. Role-administration acts (invite, assign roles, deactivate) deep-link to `modules/M01`'s Team screens (`M01-19`–`M01-21`); this list adds record-keeping and takes nothing over.
- **M10-13** (P0) — **Onboarding of employees is the invite-by-phone flow, and the flow itself is `modules/M01`'s.** Invite → OTP → profile → role card → role-decided home (`M01-12`–`M01-17`) is specified once, there. This module owns the **record side**: every invite's state (pending / accepted / expired / revoked) visible in the people list and the people-today queue, with the joiner's progress (verified, profile incomplete, landed) readable per person.

## States

- **loading** — the list loading.
- **empty** — a tenant that never uses this module still works: records exist from M01's invites with identity facts only (§M10.1 edge — zero-config posture); the truly-empty list can only be a brand-new tenant before any invite.
- **error** — list cannot load; honest failure.
- **normal** — every employee listed with status, role chips, manager and joined date (M10-11).
- **filtered-by-status** — the list filtered by status (M10-11); per M10-10's acceptance, filtering to "all" includes deactivated people with status shown plainly.
- **filtered-by-preset** — the list filtered by preset (M10-11).
- **deactivated-shown** — deactivated people stay in the list with status plainly shown; record and documents open read-only intact (M10-10).
- **invited-status** — a person whose invite is pending / accepted / expired / revoked, state visible per person with joiner progress (verified, profile incomplete, landed) readable (M10-13).

## Data volume

Every employee including deactivated ones — "deactivate, never delete" means the list only grows (M10-10). Tenant scale is SME: from a 1–5 person residential shop (`BM-14`) to an EPC employing many low-cost designers and field reps with unlimited users (`BM-04`'s rationale) — design the list, its status filter and its preset filter to stay workable at tens of rows.

## Numbers carrying provenance

Every user-visible number/date carries its F8 provenance tier in the design:

- Joined date per row (M10-11).
- Invite state and joiner progress per person (pending / accepted / expired / revoked; verified, profile incomplete, landed) (M10-13).

No money and no computed figure appears on this screen.
