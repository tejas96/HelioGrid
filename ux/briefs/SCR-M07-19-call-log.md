# SCR-M07-19 · Call Log

Every call filterable, with transcript and recording on tap.

**Module:** M07 · Sales Execution (working surface; M13 renders it among the agent dashboard's supporting views) · **Personas:** EPC Owner, Sales Manager (`F2.M07.agent-performance` scope family, §M07.11 permissions) · **Context of use:** owner and manager review surface — web emphasis for performance reading, mobile for the daily glance (`prd/modules/M07-sales-execution.md` §2).

## Entry & exit

Reached from: the agent-performance dashboard's supporting views — "the supporting views render here as they are specified there: the call log (`M07-57`) …" (M13-43, SCR-M07-18). Other entries are not pinned by PRD — designer decides, note the decision. Leads to: transcript and recording open on tap from any listed call (M07-57); further exits are not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### prd/modules/M07-sales-execution.md

- **M07-57** (P0) — **The call log: every call — customer, duration, outcome, language, config version — filterable, with transcript and recording on tap.**

### prd/modules/M13-dashboards-and-reporting.md

- **M13-43** (P0) — **The supporting views render here as they are specified there:** the call log (`M07-57`), unanswered questions (`M07-58` — "where the dashboard turns into improvement"), usage (`M07-59` — the same numbers as billed, entitlement data from M12), and the per-rep view (`M07-60` — Sales Manager's and EPC Owner's only, per `F2.M07.agent-performance`).

## States

- **Loading** (base) — the log while it fetches; transcript and recording load on tap, never blocking the list.
- **Empty** (base / slice `empty`) — no calls yet; must read as genuine quiet, never a broken screen.
- **Error** (base) — fetch failure acknowledged honestly.
- **normal** — every call listed with customer, duration, outcome, language, config version (M07-57).
- **filtered** — the log narrowed by its filterable fields (M07-57).
- **transcript-open** — a call's transcript open on tap, in the call's language, labelled (§M07.7 localization).
- **recording-within-retention** — recording playable where consented and within the pack's retention bound (§M07.11 acceptance: "transcript and recording (where consented and within retention) open").
- **recording-purged** — recording purged at the pack's retention bound; the transcript is retained (the call-ledger law this log reads).

## Data volume

Every call — human and agent, inbound and outbound. Design at the month scale of the module's illustrative sample: hundreds of calls per month (412 attempted is M07-55's illustrative figure), each row carrying customer · duration · outcome · language · config version, with filters doing the narrowing work.

## Numbers carrying provenance

- Duration per call — a ledgered system fact (M07-57).
- Call timestamps — ledgered system facts, tenant timezone.
- Config version per call — a recorded system fact answering disputes.
- No money figures appear on this screen.
