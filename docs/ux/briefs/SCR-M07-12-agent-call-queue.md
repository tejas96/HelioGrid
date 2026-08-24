# SCR-M07-12 · Agent Call Queue

Who is scheduled to be called, when and why; verdicts, versions, cancellations.

**Module:** M07 · Sales Execution · **Personas:** EPC Owner (sees all, cancels anything), Sales Manager (team scope), Sales Executive (own scope; may cancel their own queued entries) — visibility per `F2.M07.see-agent-queue`, cancel per `F2.M07.control-agent-queue` (widened per owner ruling 2026-08-04 Q31) · **Context of use:** owner reads it web-first with a mobile daily glance; reps mobile-first in the field.

## Entry & exit

Reached from: not pinned by PRD — designer decides, note the decision. The PRD makes this "the one place scheduled automation is visible; nothing dials that was never in it" (§M07.7 behavior detail); a blocked entry notifies the owner (M07-37), though the notification's landing is not pinned. Leads to: a blocked entry's verdict persists on the queue and on the lead (M07-30), and every cancellation is logged to the lead timeline with its actor (M07-35) — the lead record (lead detail) is the natural cross-surface; any further exits are not pinned by PRD — designer decides, note the decision.

## Requirements (verbatim)

### docs/prd/modules/M07-sales-execution.md

- **M07-28** (P0) — **Before a dial, eligibility is read and shown: consent state, do-not-disturb registry status, the do-not-call flag, the quiet flag, and the window check.** The gate reads one row per dial from the customer record's compliance fields (`M02-37` consumed; the records themselves are pack data-rights content, F1-58). The pre-dial surface shows the verdict — set to respect the customer by default; above-floor choices are the owner's. _(non-UI half, build-side: gate reads one row of customer compliance fields per dial — for awareness, not for drawing)_
- **M07-30** (P0) — **A refusal is visible, never silent.** A queue entry the gate blocks persists its pre-dial verdict — registry-listed · no consent · do-not-call · outside window · quiet flag — on the queue and on the lead. A registry-listed customer is not dialed by the agent and **the rep is told to call manually**. **Manual dials (owner ruling 2026-08-04, Q30):** on an outside-window or registry-listed manual call action the product shows the verdict as a **warning-then-proceed** — the rep may proceed, and where they cite a customer request the "customer requested" context is logged with the call; the statutory gate enforcement itself binds automated dials (the three lanes, F1-36(b)). _(non-UI half, build-side: gate enforcement binds automated dials; manual dials get warning-then-proceed with context logged — for awareness, not for drawing)_
- **M07-35** (P0) — **The agent queue shows who is scheduled to be called, when, and why — and the owner can remove anyone from it.** Scheduling is window-shifted: an 11 pm capture queues for not-before the window opens (a recorded requested-callback may sit outside the window per M07-33's lane). Removal/cancel (owner ruling 2026-08-04, Q31): the **queuing rep may cancel their own queued entries**; the **Owner may cancel anything**; every cancellation is logged to the lead timeline. Attempts are counted against the configured maximum. _(non-UI half, build-side: window-shifted scheduling; attempts counted against configured maximum; cancellations logged to timeline — for awareness, not for drawing)_
- **M07-36** (P0) — **A queued call carries the agent-config version it was queued with** (M07-14) and dials with exactly that behaviour; the queue view names the version where it differs from current. _(non-UI half, build-side: queued call dials with exactly its queued config version — for awareness, not for drawing)_
- **M07-37** (P0) — **Voice allowance is checked before queue insert and again before dial** — queue entries can outlive allowance; a blocked entry is marked and the owner notified. Minutes are metered to the tenant usage ledger; the meter and its pricing are `BM-16`/`BM-18`'s, the gate and ledger mechanics `modules/M12`'s. Per-call cost composition is internal and never customer-facing. _(non-UI half, build-side: allowance checked at insert and dial; minutes metered to usage ledger — for awareness, not for drawing)_

## States

- **Loading** (base) — queue list while it fetches.
- **Empty** (base) — nothing queued; must read as genuine quiet, not a broken screen.
- **Error** (base) — fetch or cancel failure acknowledged honestly.
- **scheduled** — entries showing who, when (window-shifted; a recorded requested-callback may sit outside the window per M07-33's lane) and why, with attempts counted against the configured maximum (M07-35).
- **pre-dial-verdict** — consent state, do-not-disturb registry status, do-not-call flag, quiet flag and window check visible on the entry (M07-28).
- **blocked-with-verdict** — a gate-blocked entry persisting its verdict (registry-listed · no consent · do-not-call · outside window · quiet flag) on the queue and on the lead; registry-listed shows "the rep is told to call manually" (M07-30).
- **version-differs-noted** — the entry names its queued agent-config version where it differs from current (M07-36).
- **allowance-blocked** — an entry that outlived allowance: blocked at dial, marked, owner notified (M07-37).
- **cancelled-logged** — a cancelled entry (rep cancels own, owner cancels anything); the cancellation is on the lead timeline with its actor (M07-35).
- **cancelled-by-off** — owner switched the agent off with calls queued: entries are marked cancelled-by-off, visible, never silently dropped (§M07.7 edge case, M07-34's off law).

## Data volume

No fixed queue size is pinned by PRD; the module's acceptance examples work at tens of queued entries ("while ten calls sit queued", §M07.3 acceptance). Each entry is dense: who · when · why, plus verdict vocabulary, attempt count vs maximum, queued-version note where it differs, and blocked/cancelled markers — design the row to carry all of it legibly on a phone.

## Numbers carrying provenance

- Scheduled call time per entry — window-shifted system scheduling in the tenant's timezone; a recorded requested-callback outside the window carries its recorded-request basis (M07-35, M07-33's lane).
- Attempt count against the configured maximum — a counted system fact (M07-35).
- Agent-config version identifier where it differs from current — a recorded system fact (M07-36).
- No money figures appear on this screen; per-call cost composition is internal and never customer-facing (M07-37).
