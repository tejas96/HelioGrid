# SCR-M12-03 · Plan Selection & Conversion

Pick tier and cycle; upgrade, downgrade with preview, cycle switch; handoff to hosted checkout.

**Module:** M12 · Platform billing · **Personas:** EPC Owner — every billing act rides `F2.M12.manage-billing`; only the Owner converts, upgrades, downgrades or switches cycle (`prd/modules/M12-platform-billing.md` §2) · **Context of use:** web emphasis for plan work, fully mobile for the trial-expiry and one-tap-pay moments (`prd/modules/M12-platform-billing.md` §2). The trial-expiry entry happens under time pressure; the downgrade path is a considered desk task reading a usage-derived preview.

## Entry & exit

Reached from: trial expiry — "expiry leads to a plan-pick screen" (M12-53); the trial countdown chip (chip surface is SCR-SHELL-06, shared row M12-53); Billing Home's plan-selection surface (M12-55, SCR-M12-02); soft-block prompts — post-expiry create/edit paths are "blocked with a plan prompt" (M12-53); a return after a lapse — in `halted`/`expired`/`cancelled` the billing screens "are the guaranteed way back" and plan selection is one of them (M12-55). Leads to: the gateway's hosted checkout — "pick tier and cycle → hosted checkout → mandate per the pack's rails → `active` immediately" (M12-54); on downgrade, confirming schedules the change at the cycle boundary and returns to Billing Home's scheduled-downgrade state (M12-49; §M12.8 behavior detail); on checkout failure, "conversion fails honestly (`F8-36`); the trial state is unchanged; nothing half-converts" (§M12.2 edge case) — the tenant lands back here.

## Requirements (verbatim)

### prd/modules/M12-platform-billing.md

- **M12-48** (P0) — **Upgrade: entitlements apply immediately — a paying customer never waits.** The prorated delta for the remaining cycle bills as a one-time invoice; the plan swaps at the next cycle boundary. Cycle switches follow the same mechanics (M12-12). _(non-UI half, build-side: immediate entitlements; prorated delta one-time invoice; swap at boundary — for awareness, not for drawing)_
- **M12-49** (P0) — **Downgrade takes effect at the next cycle, with an honest preview — no mid-cycle refund.** If current usage exceeds the lower tier's ceilings, the downgrade screen shows **exactly what will be blocked before confirming**; existing over-ceiling designs remain readable and exportable forever. _(non-UI half, build-side: preview computed from real usage; recomputes at confirm and boundary — for awareness, not for drawing)_
- **M12-53** (P0) — **Trial UX: honest countdown, soft expiry, no hostage patterns.** A countdown chip stays subtle until D-7; expiry leads to a plan-pick screen; post-expiry is the soft-block set — create/edit paths blocked with a plan prompt, read + export always working. Expiry must convert, never destroy. _(non-UI half, build-side: soft expiry law: convert never destroy; read+export always work — for awareness, not for drawing)_
  _Shared row: the countdown chip and soft-block prompt half lands on SCR-SHELL-06; this screen is the plan-pick destination._
- **M12-54** (P0) — **Conversion is: pick tier and cycle → hosted checkout → mandate per the pack's rails → `active` immediately.** Payment collects at that moment and never before; the trial's remaining days do not extend the first paid period (the paid cycle starts at conversion). _(non-UI half, build-side: hosted checkout handoff; payment at conversion; paid cycle starts then — for awareness, not for drawing)_
- **M12-55** (P0) — **The billing screens are real, complete, and available in every state:** current plan and cycle with the book's published caps/bundles; plan selection; mandate/payment-method setup and update; invoice list with PDFs; the usage screen (§M12.5); dunning state and history; cancel; reactivate. In `halted`/`expired`/`cancelled` these screens are the guaranteed way back (`BM-32`'s fourth always-on row, enforced here).
  _Shared row: the billing-home half lands on SCR-M12-02; this screen carries the plan-selection surface._

Preview mechanics (`prd/modules/M12-platform-billing.md` §M12.8 behavior detail): "The downgrade preview is computed from real usage against the target tier's book values: which designs exceed the kW ceiling (they stay readable/exportable — never hostage), where the proposal count stands against the smaller cap, which bundles shrink. The preview is the consent surface; confirming schedules the change at the boundary."

## States

- **loading** — book values / usage-derived preview not yet computed.
- **empty** — no state where plan choices are absent (plan selection is available in every billing state, M12-55); if a market book has no sellable value for a slot it cannot be sold (Q1 context) — behavior beyond that is not pinned by PRD — designer decides, note the decision.
- **error** — preview computation or book load failed; honest failure, no confirm without a preview (the preview is the consent surface, M12-49).
- **trial-expiry-entry** — arrived from expiry: the plan-pick moment; read + export still work behind it; expiry must convert, never destroy (M12-53).
- **post-lapse-reprice-at-current-book** — arrived after a lapse, the guaranteed way back from `halted`/`expired`/`cancelled` (M12-55): for a tenant who was inside a protection horizon, the lapse has ended the price protection, so the prices on this screen are the **current list book's rows**, never the signed-up rows (M12-57 mechanics; the forfeiture disclosure their dunning copy already carried from day 0, M12-39 — SCR-SHELL-06). The screen names the current book's price as the price; nothing here implies the old price survives the lapse, and no win-back framing on this surface may suggest otherwise (M12-41 context). For an unprotected tenant this is the ordinary plan pick and no repricing statement applies.
- **upgrade-prorated-preview** — upgrade path: entitlements immediate, prorated delta for the remaining cycle billed as a one-time invoice, plan swaps at the boundary; cycle switches follow the same mechanics (M12-48).
- **downgrade-blocked-preview** — usage exceeds the target tier's ceilings: the screen shows exactly what will be blocked before confirming; over-ceiling designs remain readable and exportable forever (M12-49).
- **preview-recomputed-changed** — "the preview re-computes at confirmation time and again at the boundary; the tenant is told if the picture changed" (§M12.8 edge case, M12-49's honesty).
- **checkout-handoff** — handing to the gateway's hosted flow; the platform's screens collect nothing sensitive (M12-54; M12-10 context); payment collects at that moment and never before.
- **checkout-failed-honest** — gateway failure at conversion: fails honestly, trial state unchanged, nothing half-converts (§M12.2 edge case; `F8-36` context).

## Data volume

Design at the full four-tier, two-cycle choice (the book's published caps/bundles per tier — BM-41 context: ~a dozen values per tier), plus a downgrade preview built from real usage: multiple designs over the target kW ceiling listed as staying readable/exportable, a proposal count standing against caps of 30/300/1,500 per month, and every bundle that shrinks (detections, voice, storage, seats, sends). The blocked-list must stay honest and legible when several items block at once.

## Numbers carrying provenance

Each user-visible number/money/date carries its F8 provenance tier in the design; billing screens use plain "actual usage" language per the owner ruling carried in M12-34 ("measured" never appears).

- Tier prices per cycle (book data, pointed at, never restated — BM-09 context).
- For a tenant returning after a lapse, which book those prices come from: reactivation bills against the current list book's rows, never the signed-up rows, and the screen is explicit about it rather than letting the protected price be assumed (M12-57, M12-39's forfeiture disclosure).
- The prorated delta amount for the remaining cycle and its one-time invoice (M12-48).
- The next cycle boundary date (upgrade swap; downgrade effective date) (M12-48, M12-49).
- Downgrade preview figures: current usage vs the target tier's ceilings and caps — kW per design, proposal count vs cap, bundle sizes before/after (M12-49; §M12.8 behavior detail).
- Trial days remaining at the conversion moment; the paid cycle starts at conversion — remaining trial days do not extend it (M12-54).
