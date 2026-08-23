# SCR-M10-03 · Employee Record

One person's identity, employment facts, role chips, manager, attendance summary, documents.

**Module:** M10 · HR-lite · **Personas:** HR/Admin, EPC Owner, Employee (own record) · **Context of use:** web-first desk work for records and documents (`prd/02-personas.md` §HR/Admin, Primary surfaces; `prd/modules/M10-hr-lite.md` §2); every employee reads their own record on either surface, own scope by construction (M10-09's law, cited in the rows below).

## Entry & exit

Reached from: the People List (SCR-M10-02) — rows open the record; the People Today Queue (SCR-M10-01) — "the record (§M10.2) is what the queue items resolve into" (`prd/modules/M10-hr-lite.md` §M10.1 behavior detail); an employee's own entry to their own record is not pinned by PRD — designer decides, note the decision. Leads to: `modules/M01`'s Owner-gated Team screens via deep link for role administration ("Owner sees the deep link live; others see the chips only" — §M10.2 behavior detail); the manager + direct reports mapping (§M10.6, Team Structure SCR-M10-07); the attendance summary for the current period is the register slice (§M10.5 — Attendance Register SCR-M10-05); documents render on the record itself (§M10.7).

## Requirements (verbatim)

### From `prd/modules/M10-hr-lite.md`

- **M10-04** (P0) — **This module displays role truth and never grants it.** The record shows the presets a person holds (chips, from F2) read-only; assigning or removing a preset, inviting and deactivating ride `F2.M01.manage-team` (EPC Owner-only) on `modules/M01`'s screens, deep-linked from here. No M10 surface widens, delegates or shortcuts that grant — F2's §F2.1 §HR/Admin states the boundary and this module honours it. _(non-UI half, build-side: role grants stay F2.M01.manage-team; M10 never widens or delegates — for awareness, not for drawing)_
- **M10-07** (P0) — **Record contents are SME-weight, and mostly optional.** Identity: name, phone (from the account), photo (from the profile, `M01-14`). Employment facts, all optional: job title (free text — never a role), date joined, work city/location, manager (§M10.6), emergency contact name + phone. Presets held render as read-only chips (M10-04). **Nothing else is asked**: no grade, band, cost centre, salary or compensation field exists anywhere in the record (§5).
- **M10-10** (P0) — **Deactivated people stay in the register.** Deactivation hides a person from assignment pickers and ends sessions (F2-20, via M01); it never removes them from the people list, their record, their documents or their history — "deactivate, never delete." The list shows status plainly. _(non-UI half, build-side: deactivate-never-delete invariant (F2-20 family) — for awareness, not for drawing)_
- **M10-35** (P0) — **Per-employee document storage: contracts and certifications, type-labelled.** Each employee record holds documents — employment contract, certifications (electrician licence, safety training), identity documents where the tenant collects them — each with a type label, upload date and uploader. Uploaded by HR/Admin or the EPC Owner; the employee always sees their own (M10-09).
- **M10-36** (P1) — **A document may carry an expiry date, and expiry is an attention item, not an enforcement.** Certifications expire in the real world; a document with an expiry date surfaces in people-today as "needing attention" as the date approaches and after it passes. The product **blocks nothing** on an expired document — whether an uncertified person may work is the tenant's call, not the register's. _(non-UI half, build-side: expiry blocks nothing; tenant decides consequences — for awareness, not for drawing)_

## States

- **loading** — the record composing.
- **empty** — a record with identity facts only: every HR field is optional (§M10.1 edge — a tenant that never uses this module breaks nothing; M10-07's "mostly optional").
- **error** — record cannot load; honest failure. Opening another person's record without the people-records grant is denied by the domain (M10-05's law, §M10.2 acceptance).
- **normal** — identity header (name, photo, phone, status) · employment facts · preset chips with a "roles are managed on the Team screen" affordance · manager and direct reports · attendance summary for the current period · documents; the person's activity attribution is not re-listed here (§M10.2 behavior detail).
- **own-view** — the employee sees their own record and documents fully, without any grant; they cannot edit employment facts or read anyone else's record (M10-09's law, §M10.2 acceptance).
- **deactivated-read-only** — a deactivated person's record and documents open read-only intact, status plainly shown (M10-10).
- **owner-deep-link-live** — the EPC Owner sees the deep link to M01's Team screens live; others see the chips only (M10-04, §M10.2 behavior detail).
- **documents-list** — documents with type label, upload date, expiry (where set) and uploader (M10-35, §M10.7 behavior detail).
- **document-expiry-attention** — a document approaching or past expiry marked as needing attention on the record; nothing is blocked by it (M10-36).
- **replaced-document-trail** — replace keeps the prior file visible in the trail (append, never overwrite; a mistaken upload stays in the trail with an honest label — §M10.7 behavior detail and edge, M10-38's family).

## Data volume

One person per screen. Documents: an employment contract, certifications (electrician licence, safety training), identity documents where the tenant collects them (M10-35) — design the list at a handful to a dozen documents, plus the replace trail behind any of them. The attendance summary covers the current period (register slice, §M10.2 behavior detail). Employment facts are few and mostly optional (M10-07) — design for sparse records as the common case.

## Numbers carrying provenance

Every user-visible number/date carries its F8 provenance tier in the design:

- Phone (from the account — M01 identity, E.164) and emergency contact phone (M10-07).
- Date joined (M10-07).
- Document upload dates and expiry dates, per document, with uploader attribution (M10-35, M10-36).
- Attendance summary counts for the current period — counts of recorded facts only, never hours-worked or any score (register slice per §M10.2 behavior detail; M10-25's law governs the slice).

No compensation figure exists anywhere on this screen (M10-07).
