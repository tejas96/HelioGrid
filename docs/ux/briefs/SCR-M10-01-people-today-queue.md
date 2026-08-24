# SCR-M10-01 · People Today Queue

HR/Admin working queue: invites, joiners, attendance exceptions, leave decisions, document attention.

**Module:** M10 · HR-lite · **Personas:** HR/Admin (primary), EPC Owner · **Context of use:** this is the HR/Admin's home screen — a queue, not a report. Mobile for approvals and the exceptions list, which is the part that is genuinely time-sensitive (`docs/prd/02-personas.md` §HR/Admin, Primary surfaces); the people-today queue, leave decisions and re-invites are one-tap mobile acts (`docs/prd/modules/M10-hr-lite.md` §2). Web full-featured too (both surfaces full-featured).

## Entry & exit

Reached from: sign-in — this queue is the HR/Admin role home (`M13-37`, `PS-30`); the composition of the home screen is `modules/M13`'s, the facts and states it composes are M10's (`docs/prd/modules/M10-hr-lite.md` §M10.1 behavior detail). Leads to: the Employee Record (SCR-M10-03) — "the record (§M10.2) is what the queue items resolve into"; the one-tap resend (the act is M01's, Owner-only) and the deep links to M01's Owner-gated Team screens; attendance exceptions are "each resolvable by looking at the person's own timeline" (M09's timeline, per `M10-26`); leave decisions land on the Attendance Register (SCR-M10-05); document attention items resolve on the record's documents (SCR-M10-03).

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

### From `docs/prd/modules/M10-hr-lite.md`

- **M10-13** (P0) — **Onboarding of employees is the invite-by-phone flow, and the flow itself is `modules/M01`'s.** Invite → OTP → profile → role card → role-decided home (`M01-12`–`M01-17`) is specified once, there. This module owns the **record side**: every invite's state (pending / accepted / expired / revoked) visible in the people list and the people-today queue, with the joiner's progress (verified, profile incomplete, landed) readable per person.
- **M10-14** (P0) — **The people-today queue is the working surface** (`PS-30`): invitations pending or expired · joiners part-way through onboarding · today's attendance exceptions (§M10.5) · leave awaiting a decision (§M10.5) · documents needing attention (§M10.7). Everything on it is actionable in one or two taps; it is a queue, not a report.
- **M10-15** (P1) — **An expired invite is one tap from resent; a declined invite is visible with its reason path.** The re-send act and the decline notification are M01's (`S1.wrong.1`, `S1.wrong.2` — "Ask Rajesh to invite you again"; decline notifies the EPC Owner); this surface shows both states and offers the one-tap resend to whoever holds the invite grant (Owner), and a "nudge the Owner" affordance for HR/Admin, who cannot send invites (M10-04).
- **M10-16** (P2) — **A joiner with nothing assigned is a queue item, not a mystery.** Where a joined person's role home would be empty (`S1.wrong.3`'s teaching empty state, M01's law), the people-today queue shows "joined, nothing assigned yet — who to ask", so the gap is closed by a person instead of discovered by the joiner.
- **M10-26** (P1) — **Attendance exceptions surface in people-today:** yesterday's unmarked days, days with a start and no end (M09's open check-in / missing day-end state), and corrections awaiting review — each resolvable by looking at the person's own timeline (the persona's stated behaviour), never auto-resolved. Corrections ride M09's correction-by-append (`M09-38`); the register never edits a captured fact.
- **M10-27** (P0) — **Leave is a request-and-decision record, SME-weight.** Any employee requests their own leave (dates, a type, an optional note); HR/Admin or the EPC Owner decides; the decision lands on the register and the person is notified. Leave **types are tenant-configured labels** (market-neutral — no statutory leave taxonomy is built in; a market's statutory leave rules, if ever encoded, are `pack.data-rights`-family pack data). **No accrual arithmetic exists in v1**: no balances, no carry-forward, no quota enforcement — the register records what was taken; policy lives with the tenant (stated as scope, not gap — SME-weight, §M10.1). _(non-UI half, build-side: no accrual arithmetic; leave types are tenant-configured labels — for awareness, not for drawing)_
- **M10-36** (P1) — **A document may carry an expiry date, and expiry is an attention item, not an enforcement.** Certifications expire in the real world; a document with an expiry date surfaces in people-today as "needing attention" as the date approaches and after it passes. The product **blocks nothing** on an expired document — whether an uncertified person may work is the tenant's call, not the register's. _(non-UI half, build-side: expiry blocks nothing; tenant decides consequences — for awareness, not for drawing)_

### From `docs/prd/modules/M13-dashboards-and-reporting.md`

- **M13-37** (P0) — **HR/Admin — home: people today** — the `M10-14` queue (invites, joiners, attendance exceptions, leave, documents needing attention); the attendance rollup renders facts and gaps only, never a score (`M10-25`).
- **M13-48** (P0) — **People rollups are facts and gaps only:** the HR home's attendance rollup renders `M10-25`'s register facts (days marked, leave, unmarked-as-unmarked) and never computes hours-worked, punctuality or any people-score. _(non-UI half, build-side: never computes hours-worked, punctuality or people-scores — for awareness, not for drawing)_

### From `docs/prd/02-personas.md`

- **PS-30** (P2) — The HR/Admin's **home screen is people today** — invitations pending or expired, joiners part-way through onboarding, today's attendance exceptions, leave awaiting a decision, and employee documents needing attention (scope per M10).

## States

- **loading** — the queue while its items compose.
- **empty-teaching** — nothing to decide today: a teaching empty state (nothing pending, nothing expired, no exceptions, no leave waiting, no documents needing attention), never a blank page.
- **error** — the queue cannot compose; honest failure, no fabricated "all clear".
- **normal** — a mixed day of queue items across all five families (M10-14).
- **invite-pending** — an invitation sent, not yet accepted; state readable per person (M10-13).
- **invite-expired-resend** — an expired invite as a standing item with one-tap resend for the Owner; it never silently disappears until resent or revoked (M10-14 edge, M10-15).
- **invite-declined** — a declined invite renders declined/void with its reason path, so HR does not chase a dead invite (M10-15).
- **joiner-stuck** — a joiner part-way through onboarding: progress state (verified, profile incomplete, landed) readable per person (M10-13).
- **joined-nothing-assigned** — "joined, nothing assigned yet — who to ask" as a queue item (M10-16).
- **attendance-exception** — yesterday's unmarked days, start-and-no-end days, corrections awaiting review; each resolves by the person's own timeline, never auto-resolved (M10-26).
- **leave-awaiting-decision** — a leave request pending decision, decidable by HR/Admin or the EPC Owner in one or two taps (M10-27, M10-14).
- **document-expiring** — a document approaching or past its expiry date as an attention item; nothing is blocked by it (M10-36).
- **nudge-owner-no-resend-grant** — HR/Admin viewing an expired invite: the surface is honest, offering the "nudge the Owner" affordance, not a hidden failure (M10-15).
- **attendance-rollup-facts-only** — the attendance rollup rendering days marked, leave, unmarked-as-unmarked, and never a computed hours-worked, punctuality or people-score (M13-37, M13-48).

## Data volume

Design at the persona's stated day (`docs/prd/02-personas.md` §HR/Admin, A day in the life): two invitations sent and not accepted, one expired and re-sendable in a tap, one joiner who verified but has not finished, three attendance exceptions from yesterday, one leave request — roughly 5–10 items on a normal morning. Also design the unattended case: expired invites are standing items until resent or revoked (M10-14 edge), so a queue left for a week accumulates dozens of items across the five families. Tenant scale is SME — from a 1–5 person shop upward (`BM-14`'s Starter framing), with unlimited users (no seat pricing, `BM-04`).

## Numbers carrying provenance

Every user-visible number/date carries its F8 provenance tier in the design:

- Invite dates/states per person (sent, pending, expired, revoked, declined) — M10-13, M10-15.
- Attendance exception facts: yesterday's unmarked days, day-start time with no day-end — capture facts from M09 with M09's provenance (M10-26).
- Leave request date ranges awaiting decision (M10-27).
- Document expiry dates on attention items (M10-36).
- Attendance rollup counts: days marked, days on leave, unmarked-as-unmarked — register facts only, never a computed hours-worked, punctuality or people-score (M13-48, M13-37).
