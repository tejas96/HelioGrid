# SCR-M07-18 · Agent Performance

Monthly what-the-agent-did block, deals-touched with correlation caption, per-rep view, self-defending warnings.

**Module:** M07 · Sales Execution (working surface; M13 owns its dashboard rendering and placement) · **Personas:** EPC Owner, Sales Manager — `F2.M07.agent-performance`; the per-rep view additionally per its row (§M07.11 permissions) · **Context of use:** the owner reads it web-first for performance, mobile for the daily glance; "it is the reason the agent survives its first invoice" (M07-55). Read-only, decision-oriented under D37's rules (M13-41).

## Entry & exit

Reached from: the dashboard shell — the agent-performance screens render there as dashboard surfaces (M13-41); and the monthly in-app summary push to the owner exists for when nobody opens the screen (M07-61) — where the push lands is not pinned by PRD — designer decides, note the decision. Leads to: "questions it could not answer (→ review)" and the over-escalation warning link straight to the unanswered-questions list (M07-55, M07-61 — SCR-M07-10); the supporting views — call log (SCR-M07-19), unanswered questions (SCR-M07-10), usage (SCR-M07-20), per-rep view — render as specified in M07 (M13-43).

## Requirements (verbatim)

### prd/modules/M07-sales-execution.md

- **M07-55** (P0) — **The agent-performance screen exists because an owner paying for automated calls who cannot see what they bought will cancel within a month — it is not analytics garnish; it is the reason the agent survives its first invoice.** The monthly block, this month vs last: calls attempted · connected (with rate) · callbacks booked · site visits booked · handed to a human · questions it could not answer (→ review). Outcomes by type. "What it saved you": conversations the team did not have to start and the approximate calling time. (The source's figures — 412 attempted, 246 connected, ≈20 hours — are illustrative samples, not targets.)
- **M07-56** (P0) — **"Deals it touched" reports correlation, and the screen says so — beside the number, not behind an interaction.** The block (e.g. *"31 proposals were quiet, the agent called, and the customer responded within 3 days"*, with the pipeline value in tenant-currency pack formatting) renders with the verbatim caption of `F8-30`: *"The agent called and the customer responded within 3 days. We cannot prove the call caused it."* Never a tooltip (F8-31). The product never claims the agent generated revenue. _(non-UI half, build-side: correlation-only claim law (F8-30/31); product never claims agent revenue — for awareness, not for drawing)_
- **M07-60** (P1) — **The per-rep view — which reps lean on the agent, whose leads it rescued — is Sales Manager's and the EPC Owner's only.** *(In-row note: the source says "Manager-only"; the EPC Owner superset and the Manager→Sales Manager preset rename follow the pre-existing F2 row — `F2.M07.agent-performance`, Task 5, whose row text already names both — so the widening is deliberate and visible, not silent.)* _(non-UI half, build-side: visible to EPC Owner and Sales Manager only (F2.M07.agent-performance) — for awareness, not for drawing)_
- **M07-61** (P0) — **The screen defends itself:** a collapsing connect rate is surfaced as a warning with the likely cause (wrong numbers, bad timing) — not left for the owner to notice; an agent escalating almost everything links straight to the unanswered-questions list; and if nobody opens the screen, a monthly summary is pushed to the owner in-app, where they actually read things. _(non-UI half, build-side: detects collapsing connect rate with likely cause; monthly in-app summary push — for awareness, not for drawing)_

### prd/modules/M13-dashboards-and-reporting.md

- **M13-41** (P0) — **The agent-performance screens render here as dashboard surfaces under D37's rules** — read-only, decision-oriented, monthly-block first (this month vs last: attempted, connected, callbacks, visits booked, handed to a human, unanswered questions → review), with "what it saved you" stated in conversations and hours, never in claimed revenue. The screens' working-surface halves are `M07`'s (§M07.11); this module owns their dashboard rendering and placement.
- **M13-42** (P0) — **"Deals it touched" renders with the correlation caption beside the number, always** — *"The agent called and the customer responded within 3 days. We cannot prove the call caused it."* On the screen, not in a tooltip; in every export too.
- **M13-43** (P0) — **The supporting views render here as they are specified there:** the call log (`M07-57`), unanswered questions (`M07-58` — "where the dashboard turns into improvement"), usage (`M07-59` — the same numbers as billed, entitlement data from M12), and the per-rep view (`M07-60` — Sales Manager's and EPC Owner's only, per `F2.M07.agent-performance`).
- **M13-44** (P1) — **The screen defends itself:** a collapsing connect rate surfaces as a warning with the likely cause; an agent escalating almost everything links straight to the unanswered-questions list. Never left for the owner to notice.

## States

- **Loading** (base) — the monthly block while it fetches.
- **Error** (base) — fetch failure acknowledged honestly.
- **empty-teaching** (base empty + slice) — a tenant whose agent has made no calls this period: the block must teach what will appear, never render a blank dashboard.
- **normal / month-vs-last** — the monthly block, this month vs last: attempted · connected (with rate) · callbacks booked · site visits booked · handed to a human · questions it could not answer (→ review); outcomes by type; "what it saved you" in conversations and hours (M07-55, M13-41).
- **correlation-caption-visible / correlation-caption** — the "deals it touched" block with the `F8-30` caption beside the number, on the screen, never a tooltip, in every export too (M07-56, M13-42).
- **connect-rate-warning** — a collapsing connect rate surfaced as a warning with the likely cause (wrong numbers, bad timing) (M07-61, M13-44).
- **over-escalation-warning** — an agent escalating almost everything links straight to the unanswered-questions list (M07-61, M13-44 — SCR-M07-10).
- **per-rep-view-gated / gated-unreachable** — the per-rep view visible to EPC Owner and Sales Manager only; "when opened by anyone but an EPC Owner or Sales Manager, then it is not reachable" (M07-60, M13-43; M13 §M13.6 acceptance).
- **monthly-summary-pushed** — the nobody-opens-it fix: a monthly summary pushed to the owner in-app (M07-61).

## Data volume

Design at the source's illustrative sample scale — 412 attempted, 246 connected, ≈20 hours saved (explicitly "illustrative samples, not targets", M07-55) — with the deals-touched block at the shape of *"31 proposals were quiet, the agent called, and the customer responded within 3 days"* plus a pipeline value in tenant-currency pack formatting (M07-56). Two periods side by side (this month vs last) across six monthly-block measures plus outcomes by type.

## Numbers carrying provenance

- Calls attempted · connected (with rate) · callbacks booked · site visits booked · handed to a human · unanswered-questions count — ledgered call facts, this month vs last (M07-55).
- "What it saved you": conversations the team did not have to start and the **approximate** calling time — stated in conversations and hours, **never in claimed revenue** (M07-55, M13-41); the ≈ qualifier is part of the figure.
- "Deals it touched" count and its pipeline value (tenant-currency pack formatting) — **correlation-tier**: renders with the verbatim `F8-30` caption beside the number, on screen and in every export (M07-56, M13-42).
- Connect-rate warning threshold rendering — a derived warning with likely cause, presented as the screen's own defence, not a tunable (M07-61, M13-44).
- Per-rep reliance figures — ledgered facts, gated to EPC Owner and Sales Manager only (M07-60, M13-43).
