# SCR-M07-10 · Unanswered Questions

What customers asked that the agent could not answer, with asked-counts and one-tap answers.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner (answering and every write into the KB is Owner-only — `F2.M01.configure-agent`, R10; M07 §M07.4 permissions); Sales Manager reads it among the agent-performance supporting views (`F2.M07.agent-performance`, M13-43) · **Context of use:** the owner's short weekly improvement glance — web for the sit-down, mobile for the daily glance (M07 §2); answering writes to the KB.

## Entry & exit

Reached from: the agent-performance screen — an agent escalating almost everything links straight to this list (M07-61, M07 §M07.4 edge cases; SCR-M07-18), and the same view renders among M13's supporting dashboard views (M13-43); the questions themselves are captured from real calls (M07-18). Leads to: one tap writes the answer into the named knowledge section (SCR-M07-09) — the agent knows it from the next call (M07-18). Not otherwise pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### prd/modules/M07-sales-execution.md

- **M07-18** (P0) — **The unanswered-questions loop:** when a customer asks something the agent could not answer, it is captured as an unanswered question with an asked-count. The owner sees a short list — *"3 customers asked about hail damage this week"* — and **one tap writes the answer into the named knowledge section; the agent knows it from the next call.** The KB grows from real calls instead of a blank page. _(non-UI half, build-side: captures unanswerable questions with asked-count; answer live from next call — for awareness, not for drawing)_
- **M07-58** (P0) — **The unanswered-questions screen: what customers asked that the agent could not handle, one tap to answer** (§M07.4's loop). *"This is where the dashboard turns into improvement."*

### prd/modules/M13-dashboards-and-reporting.md

- **M13-43** (P0) — **The supporting views render here as they are specified there:** the call log (`M07-57`), unanswered questions (`M07-58` — "where the dashboard turns into improvement"), usage (`M07-59` — the same numbers as billed, entitlement data from M12), and the per-rep view (`M07-60` — Sales Manager's and EPC Owner's only, per `F2.M07.agent-performance`).

## States

- **Loading** (base) — reading the captured questions.
- **Empty** (base) — nothing the agent could not answer: an honest empty, distinct from "the agent made no calls"; never a blank.
- **Error** (base) — read or answer-save failure acknowledged honestly; a typed answer is preserved.
- **normal** — the short list of captured questions, each with its asked-count and its named target knowledge section, one tap to answer (M07-18, M07-58).
- **list-with-counts** — the asked-count is the ranking signal — *"3 customers asked about hail damage this week"* (M07-18).
- **answered-live-next-call** — after the one-tap answer: the answer is written into the named knowledge section and the agent knows it from the next call — the design must confirm that liveness honestly (M07-18; M07 §M07.4 acceptance).
- **empty** — the slice's named empty state (see Empty base above).

## Data volume

A short list by design (M07-18: "The owner sees a short list"), each row a question pattern with its asked-count and named target section. A knowledge-too-thin agent inflates it — the over-escalation case arrives here from the performance screen (M07-61, M07 §M07.4 edge cases) — so the design must also hold a longer backlog without losing the one-tap answer.

## Numbers carrying provenance

- **Asked-count per question** ("3 customers asked") — a system-counted fact from real calls; carries its F8 provenance tier in the design.
- **The time window of the count** ("this week") — part of the captured claim, rendered on the tenant's timezone.
- No money figures appear on this screen.
