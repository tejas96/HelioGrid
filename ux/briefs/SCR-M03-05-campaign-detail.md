# SCR-M03-05 · Campaign Detail

Monitor one campaign (mobile-first): current state, running send count, why it paused and what resuming would do.

**Module:** M03 · Marketing · **Personas:** Marketing (primary — monitoring is where this persona lives, `PS-36`), EPC Owner (sees all campaigns, always, `F2-14`; notified on pauses), Sales Manager (reads results as pipeline input) · **Context of use:** campaign monitoring is mobile-first, because that is where the Marketing persona reads it (M03 §2, `PS-36`) — phone, likely one-handed, glancing at a running send.

## Entry & exit

Reached from: the Campaign List (SCR-M03-01). Leads to: the campaign's performance report (SCR-M03-06) — a completed campaign's report is permanent (M03 §M03.2 behavior detail); when paused for an exhausted allowance or a billing state, the upgrade/pay route is offered (`M03-45`, `BM-32`'s always-available billing screens). Other exits not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### prd/modules/M03-marketing.md

- **M03-08** (P0) — **A campaign is one named object with six parts: a channel, an audience, content, a schedule, an owner and a state.** It is created, edited while draft, scheduled, run, paused, completed or cancelled — and it is never deleted once it has sent anything, because what it sent is part of the tenant's compliance record. _(non-UI half, build-side: a campaign that sent anything is archived, never deleted (compliance record) — for awareness, not for drawing)_
- **M03-28** (P0) — **A channel that breaks mid-campaign pauses the campaign and says so.** Credential expiry, revoked permission at the provider, or a channel-side rejection moves the connection to `action needed` (`M03-19`), pauses every `sending` campaign on it at `paused` with that reason (`M03-09`), and notifies the campaign owner and the EPC Owner. Sends already made stay made; sends not yet made are not silently dropped — they wait, and the report states how many are waiting. _(non-UI half, build-side: break detection pauses sending campaigns, notifies owner; unsent messages wait — for awareness, not for drawing)_
- **M03-45** (P0) — **Allowance exhaustion follows the cap law and the soft-block law — never a silent truncation.** At 80% of the channel's allowance the usage surface warns (`BM-34` consumed: the first notice is never the block). A campaign whose projected burn exceeds the remaining allowance cannot be scheduled by a person without `F2.M03.approve-campaign-spend`; with that grant, the overage is shown explicitly and approved explicitly. A campaign that exhausts an allowance **mid-send pauses** (`M03-09`), states exactly how many were sent and how many remain, and offers the upgrade/pay route (`BM-32`'s always-available billing screens). Reading, exporting and every already-captured lead stay available in every billing state (`BM-32`). _(non-UI half, build-side: 80% pre-warn; overage needs approve-campaign-spend grant; mid-send exhaustion pauses — for awareness, not for drawing)_
- **M03-50** (P1) — **Send volume is bounded by the tenant's allowance and the channel's own limits, and both are visible.** Where a channel imposes its own throughput or daily ceiling, the campaign's schedule respects it, the surface says the run will take longer for that reason, and progress is visible throughout (`M03-09`'s `sending` state carries a running count). The product does not present a channel-imposed limit as its own, or vice versa. _(non-UI half, build-side: channel throughput/daily ceilings respected; limits attributed to their owner — for awareness, not for drawing)_

## States

- **loading**
- **empty** — not applicable in the ordinary case (a detail always has its campaign); design the no-activity-yet presentation for a campaign that has not started.
- **error**
- **draft** — nothing sent, freely editable (`M03-08` lifecycle).
- **scheduled** — audience resolved, waiting for its time.
- **sending-running-count** — in progress, with a running count visible throughout; where a channel's own throughput or daily ceiling stretches the run, the surface says the run will take longer for that reason, with the limit attributed to its owner (`M03-50`).
- **paused-by-person** — paused mid-run by a person; the screen shows why it paused and what resuming would do (M03 §M03.2 behavior detail).
- **paused-allowance-exhausted** — allowance exhausted mid-send: states exactly how many were sent and how many remain, and offers the upgrade/pay route (`M03-45`).
- **paused-channel-broken** — the channel broke mid-campaign: paused with that reason, owner and EPC Owner notified; unsent messages wait and the report states how many are waiting (`M03-28`).
- **paused-billing-state** — metered sends paused by the tenant's billing state, with the billing reason named and the pay/upgrade route offered; reading, exporting and every already-captured lead stay available (`M03-45`).
- **paused-window-closed** — the run reached the close of the market's messaging window: paused with that reason, resuming at the next opening, saying so.
- **completed** — the run finished, with its own honest partial-completion report where it stopped early.
- **cancelled** — stopped and not resumable; already-sent messages are already gone and nothing claims a recall.

## Data volume

Design at a running send over an audience on the order of a thousand recipients (M03 §2), against allowances at bundle scale (draft India book: Starter 500 / Growth 2,000 / Pro 10,000 sends/mo, `M03-52`) — the running count, the sent-vs-remaining split at a pause, and the waiting-message count must all stay legible on a phone.

## Numbers carrying provenance

Each of these renders with its F8 provenance tier in the design:

- The running send count while `sending` (`M03-50`)
- Exactly how many were sent and how many remain, on an allowance-exhausted pause (`M03-45`)
- How many unsent messages are waiting, on a channel-broken pause (`M03-28`)
- The tenant's allowance and the channel's own limit, both visible and each attributed to its owner (`M03-50`)
- The 80% allowance warning threshold state, where surfaced (`M03-45`)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and a Context-of-use clause claiming no offline capability (register `Q15`). Both are deleted.*
