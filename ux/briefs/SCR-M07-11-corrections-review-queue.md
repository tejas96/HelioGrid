# SCR-M07-11 · Corrections Review Queue

Owner reviews rep corrections and explicitly promotes answers into the KB.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner (promotion into the KB is Owner-only per R10, riding `F2.M01.configure-agent`) · **Context of use:** web emphasis for setup and performance; mobile for the daily glance.

## Entry & exit

Reached from: queue items arrive when a rep corrects an agent call's outcome or summary on the call record (SCR-M07-13) — "a correction updates the call record (outcome/summary) and emits a review-queue item" (M07-26). How the owner navigates to this screen is not pinned by PRD — designer decides, note the decision. Leads to: promoting an answer writes it into the knowledge base (SCR-M07-09's object) via the same one-tap loop as unanswered questions (M07-26); no other exit is pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### prd/modules/M07-sales-execution.md

- **M07-26** (P0) — **Corrections train nothing automatically — review-queue only, no auto-training, ever in v1.** A correction updates the call record (outcome/summary) and emits a review-queue item; **an owner explicitly promotes an answer into the knowledge base** — the same one-tap loop as unanswered questions. Nothing a rep types reaches the agent's behaviour without that promotion. Behaviour stays auditable per call: config version + KB version. _(non-UI half, build-side: no auto-training ever in v1; owner promotion is only behaviour path — for awareness, not for drawing)_

## States

- **Loading** (base) — the queue list while it fetches.
- **Empty** (base / slice `empty`) — no pending corrections; per the module's teaching-empty-state posture, silence must read as "nothing to review", never a broken screen.
- **Error** (base) — fetch or promotion failure acknowledged honestly.
- **pending** — review items awaiting the owner's decision; each carries the rep's correction against the agent's original read (the agent original stays visible in the call record's history, per §M07.5 behavior detail).
- **promoted** — an answer the owner explicitly promoted into the KB; nothing a rep types reaches agent behaviour without this act (M07-26).

## Data volume

Not pinned by PRD. One review item is emitted per rep correction (M07-26); design the list to work when corrections accumulate between owner visits, and make the empty state the common, healthy case.

## Numbers carrying provenance

- Correction timestamps and actors — server-recorded facts on the call record.
- Config version + KB version identifiers per call (the auditability pairing of M07-26) — recorded system facts.
- No money figures appear on this screen.
