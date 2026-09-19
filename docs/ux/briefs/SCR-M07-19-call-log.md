# SCR-M07-19 · Call Log

Every call filterable, with transcript and recording on tap.

**Module:** M07 · Sales Execution (working surface; M13 renders it among the agent dashboard's supporting views) · **Personas:** EPC Owner, Sales Manager (`F2.M07.agent-performance` scope family, §M07.11 permissions) · **Context of use:** owner and manager review surface — web emphasis for performance reading, mobile for the daily glance (`docs/prd/modules/M07-sales-execution.md` §2).

**One job:** find any call, and open it.
**Order of attention:** 1 the filters · 2 the calls — customer, outcome, duration · 3 a call's transcript and recording.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2.

| Fact | Kind | Its form here |
|---|---|---|
| Every call (`M07-57`) | data · status | one row: the customer, the outcome as its chip, the duration, the language, the agent version, when |
| Filtering (`M07-57`) | action | a filter bar over those same fields; an active filter is a chip that can be cleared |
| What the log is showing (`F7-27`) | data | the table's caption: the period and the filters in force |
| The transcript and the recording (`M07-57`) | more detail | a row opens them. A recording past its retention date is a chip, and the transcript stays |
| Provenance (`F8-07`) | honesty label | one label heads the duration column. A recorded time carries no tier |
| No calls yet | teaching | ONE line — genuine quiet |
| The log failed to load | error | one banner — what failed and what to do |

## Arrangement

- **375.** A list under a filter bar: the customer and the outcome chip lead each row, the rest is its
  second line.
- **1536.** A captioned table with every column in view — hundreds of rows, proven here — and the
  opened call in a side panel (`F7-21`).

## Entry & exit

Reached from: the agent-performance dashboard's supporting views — "the supporting views render here as they are specified there: the call log (`M07-57`) …" (M13-43, SCR-M07-18). Other entries are not pinned by PRD — designer decides, note the decision. Leads to: transcript and recording open on tap from any listed call (M07-57); further exits are not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-57** (P0) — **The call log: every call — customer, duration, outcome, language, config version — filterable, with transcript and recording on tap.**

### docs/prd/modules/M13-dashboards-and-reporting.md

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
