# SCR-M03-06 · Campaign Performance

Permanent honest report: per-recipient states the channel actually reported, scheduled-vs-sent delta, captures, correlation-framed pipeline lead list, export.

**Module:** M03 · Marketing · **Personas:** Marketing (all), EPC Owner (all), Sales Manager (read — the capture list shows their team's captures only, scoped by `F2.M02.lead-visibility`) · **Context of use:** campaign monitoring and reading is mobile-first (M03 §2, `PS-36`); the report is permanent — it is the tenant's own record of what was sent to whom under which consent, and it survives the campaign's archival (M03 §M03.2 behavior detail).

## Entry & exit

Reached from: the campaign's own context (list and detail); the exact route is not pinned by PRD — designer decides, note the decision. Leads to: the campaign→pipeline view opens the CRM's own records, scoped by the reader's own lead visibility (`M03-56`); export produces the campaign's records carrying the same caveat text as the screen (slice state `export`).

## Requirements (verbatim)

### docs/prd/modules/M03-marketing.md

- **M03-04** (P0) — **Because this module controls the sending, it reports send state — and only what the channel actually tells it.** A campaign send carries a per-recipient state drawn from the channel's own reporting: queued · sent · delivered · failed (with the channel's reason) · opted-out-before-send. Where a channel does not report a state, the product shows **"not reported by this channel"** and never a zero, a blank that reads as success, or an inferred delivery. Opens and clicks are the link's own events, never a delivery claim (`F5-28`, `F5-29` consumed — the customer-link surface has no delivered state and this module does not give it one). _(non-UI half, build-side: per-recipient state only from channel's own reporting; never inferred delivery — for awareness, not for drawing)_
- **M03-14** (P0) — **The audience is re-resolved at send time and the difference is reported.** Between scheduling and sending, records change: someone opts out, a lead is disqualified, a number is corrected. The send uses the audience as it is at the moment of sending, and the campaign's report states the delta from the scheduled count with the reasons grouped (opted out since · newly suppressed · no longer matches the filter · newly matches the filter). Silent drift is the failure this row exists to prevent. _(non-UI half, build-side: audience re-resolved at send time against current records — for awareness, not for drawing)_
- **M03-26** (P0) — **Each channel declares what it can report, and the product renders only that.** Per channel the product knows whether it can report acceptance by the channel, delivery, read state, click state and failure reason — and every campaign surface renders exactly the columns that channel supports. A channel that cannot report delivery shows no delivery column at all rather than an empty one, and the surface says which states this channel does not report. _(non-UI half, build-side: per-channel reporting-capability declaration drives which columns exist — for awareness, not for drawing)_
- **M03-49** (P0) — **A partially completed send is reported partially.** When a run stops early — exhausted allowance, broken channel, billing state, cancellation — the campaign reports sent, failed with reasons, not attempted, and why it stopped. Nothing is rounded up to "completed", and the counts on the campaign are the same counts the usage ledger bills from (`F8-33`'s same-numbers law consumed). _(non-UI half, build-side: report counts identical to counts the usage ledger bills from — for awareness, not for drawing)_
- **M03-53** (P0) — **Campaign impact is reported as correlation, and the screen says so.** The suite's law is verbatim and binding: *"'Deals it touched' is correlation, not attribution — and the screen must say so"* (`F8-30` consumed). A campaign performance surface may state that leads it captured later progressed or closed; it may **never** state that a campaign generated a deal, produced revenue, or caused a value of pipeline. The caption renders in the same honest register the agent-impact block uses — what happened, in what window, and what cannot be proved. _(non-UI half, build-side: no revenue, generated-deal or causation claim anywhere — for awareness, not for drawing)_
- **M03-55** (P0) — **Performance reports only what the channel actually reported, and names what it did not.** Per campaign: audience sent to, per-state counts from `M03-04` limited to the states this channel reports (`M03-26`), captures produced, and — correlation-framed (`M03-53`) — what those captures did afterwards. A state the channel does not report is shown as **not reported**, never as zero, and never inferred from an adjacent signal (an open is not a delivery).
- **M03-56** (P0) — **The campaign→pipeline view is a list of leads, not a model.** For a campaign: the leads it captured, their current stage, and how many reached each of the CRM's own terminal states within a stated window — rendered as the CRM's records with the campaign as one attribute of each (`M03-31`), scoped by the reader's own lead visibility (`F2-12`–`F2-14`). There is no weighting, no scoring, no multi-touch model and no revenue claim; `modules/M02`'s "no lead scoring" and "no campaign attribution" non-goals are respected rather than routed around.

## States

- **loading**
- **empty** — see empty-no-captures below; a campaign with no results yet still reports honestly what has and has not happened.
- **error**
- **normal** — audience sent to, per-state counts limited to the states this channel reports, captures produced, and — correlation-framed — what those captures did afterwards (`M03-55`).
- **not-reported-states** — a state the channel does not report is shown as **not reported**, never as zero, never inferred from an adjacent signal; a channel that cannot report delivery shows no delivery column at all, and the surface says which states this channel does not report (`M03-04`, `M03-26`, `M03-55`).
- **partial-completion** — the run stopped early: sent, failed with reasons, not attempted, and why it stopped — nothing rounded up to "completed" (`M03-49`).
- **delta-from-scheduled** — the report states the delta from the scheduled count with the reasons grouped: opted out since · newly suppressed · no longer matches the filter · newly matches the filter (`M03-14`).
- **correlation-caveat-visible** — the correlation caption is persistent on-screen content: what happened, in what window, and what cannot be proved; never a revenue or generated-deal claim (`M03-53`).
- **empty-no-captures** — the campaign produced no captures; the report says so honestly rather than hiding the unflattering outcome (M03 §M03.7 behavior detail: the product does not hide unflattering outcomes).
- **export** — the campaign's records export, carrying the same caveat text as the screen.

## Data volume

Design at per-recipient results for a send on the order of a thousand recipients (M03 §2), a capture list at the PRD's own 200-lead scale (M03 §M03.3 edge case), and a pipeline lead list showing each captured lead's current stage plus counts per CRM terminal state within a stated window (`M03-56`) — all scoped by the reader's lead visibility.

## Numbers carrying provenance

Each of these renders with its F8 provenance tier in the design:

- Audience sent to (`M03-55`)
- Per-recipient state counts — queued · sent · delivered · failed (with the channel's reason) · opted-out-before-send — limited to the states this channel reports (`M03-04`, `M03-26`, `M03-55`)
- "Not reported by this channel" placeholders — explicitly never a zero (`M03-04`, `M03-55`)
- The delta from the scheduled count, with its grouped reasons (`M03-14`)
- Captures produced (`M03-55`)
- Sent, failed with reasons, and not attempted, with the stop reason, on a partial run — the same counts the usage ledger bills from (`M03-49`)
- Leads captured, their current stage, and how many reached each CRM terminal state within a stated window (`M03-56`)
- Every correlation-framed figure carries its caveat as persistent on-screen content (`M03-53`)

---

*Amended 2026-08-07 by owner decision: the offline/sync capability was removed from the product. This screen previously carried an `offline` state and a Context-of-use clause claiming no offline capability (register `Q15`). Both are deleted. The per-recipient `queued` send state is the channel's own reporting, not a sync queue, and is untouched.*
