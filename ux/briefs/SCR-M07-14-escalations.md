# SCR-M07-14 · Escalations

Every call the agent handed to a human, with the reason visible.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner, Sales Manager, Sales Executive · **Context of use:** reps meet escalations as immediate notifications on the phone (§M07.8 — a price question is a notification, not a task buried in a list); the owner and manager read this surface to see the pattern. Web and mobile from day one (`prd/modules/M07-sales-execution.md` §2).

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision. (The PRD pins that escalation *notifications* deep-link to the live context, §M07.8 — that is the live-call path, not this list.) Leads to: each entry is a call the agent handed to a human; the call's record and its lead are the natural cross-surfaces, but the PRD does not pin the exit — designer decides, note the decision.

## Requirements (verbatim)

### prd/modules/M07-sales-execution.md

- **M07-42** (P0) — **The escalations surface shows every call the agent handed to a human, and why — the reason visible** (*"customer asked for a discount"*). Hand-to-human works at any point in any call (M07-24).

## States

- **Loading** (base) — list while it fetches.
- **Empty** (base / slice `empty`) — no escalations; must read as genuine quiet, never a broken screen.
- **Error** (base) — fetch failure acknowledged honestly.
- **list-with-reasons** — every handed-to-human call listed with its reason visible on the row (*"customer asked for a discount"*), never behind an interaction (M07-42).
- **terminal-fallback-entries** — calls that reached the terminal fallback because everyone was off/busy at escalation time appear here too (§M07.8 edge case: "Everyone off/busy at escalation time → terminal fallback takes the call; the escalations surface shows it").

## Data volume

Not pinned by PRD. An over-escalating agent is a named failure mode (§M07.4 edge case — "agent escalating almost everything"), so the list must stay legible when escalations are frequent, not only when they are rare.

## Numbers carrying provenance

- Escalation time per entry — a ledgered system fact.
- No money figures appear on this screen; a price question is shown as a reason, never as a figure.
