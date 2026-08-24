# SCR-M10-06 · Leave Request

Any employee requests own leave: dates, type, optional note.

**Module:** M10 · HR-lite · **Personas:** Employee (all presets — requesting is `F2.M10.request-leave`, every preset, own-scope; `docs/prd/modules/M10-hr-lite.md` §M10.5 permissions) · **Context of use:** every employee persona, including field crews on phones — requests are the employee's own act on their own record; deciding happens elsewhere (HR/Admin's mobile one-tap approvals, §2).

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision (the PRD pins the act — any employee requests their own leave — not the entry point). Leads to: the request notifies the deciders (notification type "leave requested (to deciders)", §M10.5 behavior detail / §4 provides-table); the decision lands on the Attendance Register (SCR-M10-05) and the person is notified ("leave decided (to the requester)") (M10-27).

## Requirements (verbatim)

### From `docs/prd/modules/M10-hr-lite.md`

- **M10-27** (P0) — **Leave is a request-and-decision record, SME-weight.** Any employee requests their own leave (dates, a type, an optional note); HR/Admin or the EPC Owner decides; the decision lands on the register and the person is notified. Leave **types are tenant-configured labels** (market-neutral — no statutory leave taxonomy is built in; a market's statutory leave rules, if ever encoded, are `pack.data-rights`-family pack data). **No accrual arithmetic exists in v1**: no balances, no carry-forward, no quota enforcement — the register records what was taken; policy lives with the tenant (stated as scope, not gap — SME-weight, §M10.1). _(non-UI half, build-side: no accrual arithmetic; leave types are tenant-configured labels — for awareness, not for drawing)_

## States

- **loading** — the request surface loading (leave types are tenant data).
- **empty** — no prior requests to show; the request act itself is always available (own-scope, every preset).
- **error** — submission fails honestly; nothing pretends to be requested.
- **normal** — dates, a type, an optional note; submitted to HR/Admin or the EPC Owner to decide (M10-27). No balance, no carry-forward, no quota renders anywhere — none exists (M10-27).
- **single-default-type** — a tenant with no leave types configured: leave requests offer a single default label until the tenant configures types (§M10.5 edge — zero-config posture).
- **pending** — requested, awaiting decision; lifecycle is requested → approved / declined (terminal per request; a changed plan is a new request — no edit-in-place, §M10.5 behavior detail).
- **approved** — decided and attributed (who, when); approved days render as leave on the register and the requester is notified (M10-27, §M10.5 acceptance).
- **declined** — decided and attributed (who, when); the requester is notified (M10-27).
- **self-approval-visible** — the decider is the requester (HR/Admin requesting their own leave): permitted; the decision record names the decider, so self-approval is visible, not pretended away (§M10.5 edge).

Also design for: leave requested for days already worked — allowed (retroactive regularisation is normal in an SME); the register shows both facts for those days (§M10.5 edge; the rendering lives on SCR-M10-05).

## Data volume

One request: a date range, one tenant-configured type label (or the single default), an optional note (M10-27). The type list is tenant data — design it from one default label to a handful of tenant-configured labels. No balances or quotas exist to display (M10-27).

## Numbers carrying provenance

Every user-visible number/date carries its F8 provenance tier in the design:

- The requested date range (M10-27).
- The decision attribution — who decided, when (§M10.5 acceptance: "the decision is attributed (who, when)"; self-approval visible per the §M10.5 edge).

No balance, accrual or quota figure exists anywhere on this screen (M10-27).
