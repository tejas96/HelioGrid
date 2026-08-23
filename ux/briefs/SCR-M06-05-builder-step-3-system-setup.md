# SCR-M06-05 · Builder Step 3 — Solar System Setup

Location, capacity, type, battery, AMC and the full pricing/subsidy money block.

**Module:** M06 · Proposals · **Personas:** Sales Executive (primary — applies discounts with no approval hop, `D34`), Sales Manager, EPC Owner, Design Engineer (natural author on Path A) · **Context of use:** the money conversation happens here — often on a phone in the customer's living room (Path B, `S6B.rule.two-paths`); fully workable at 375 px (`D2`, `F7-30`). Present in Quick mode (steps 1, 3, 8, 10 — M06-18). Fields commit on blur.

## Entry & exit

Reached from: the builder shell — any chip, Back/Next, or a Generate-failure jump (payable floor, battery validity and required-field failures land here highlighted), in any order and any state (M06-22, M06-23, R12). On Path A the step arrives pre-filled `derived` (capacity, type, category — M06-03); on Path B values are typed. Leads to: any step via free navigation; the Battery modal opens as a bottom sheet over this step (M06-30); the added battery also surfaces as step 8's Battery section (SCR-M06-10).

## Requirements (verbatim)

### prd/modules/M06-proposals.md

- **M06-09** (P0) — **Step 3 · Solar System Setup:** Location — the market pack's administrative-area fields \* (the source's IN instance: State · District; labels are pack data, `F1-22`). System configuration — System capacity kW \* (**0.5–7000**) · System type \* segmented **ONGRID / OFFGRID / HYBRID** · **Battery storage card** ("Add battery backup"; OFFGRID/HYBRID force a ⚠ "Battery required" notice; added state shows a summary with Edit / Remove — §M06.5, `M06-30`) · Category \* — Residential / Commercial · AMC \* — Free AMC · NO AMC · 1–8 years · Commissioning included (toggle). Pricing & subsidies — the scheme-generic money block of §M06.6 (`M06-34`): system cost excl. battery incl./excl. tax, tax % and computed tax amount per the pack's tax scheme (`F1-13`), incentive amount per the pack's incentive model (`F1-14`), discount (**% ⇄ amount** mode switch), Easy-financing EMI toggle (→ EMI interest rate 0–100%, `M06-40`), electricity tariff per kWh \* (**1–50**, tenant currency). **Client-payable summary card** — live (`M06-35`). **Recorded, not resolved:** the step's 0.5–7000 kW capacity range differs from `D1`'s 1 kW→100 MW design-range commitment (docs/11, `modules/M05` scale program); both are carried, the divergence is recorded here and in traceability, and neither is silently normalised.
- **M06-30** (P0) — **The battery blocks, across the builder.** Step 3 carries the **Battery storage card** ("Add battery backup"; **OFFGRID/HYBRID force a ⚠ "Battery required" notice**; added state = summary with Edit / Remove) opening the **Battery modal** (bottom sheet): Battery capacity kWh (**1–100**) · Cost excl./incl. tax and battery tax % per the pack's tax scheme (`F1-13`) · Cell chemistry — **Lithium LFP / Lithium NMC / Lead-acid / Custom** (Custom reveals free text) · Cancel · Save. When a battery is added, step 8 gains the **Battery** component section (capacity kWh · chemistry · warranty in the edit sheet) and the payable formula includes battery cost (`M06-35`). **OFFGRID with no battery is a hard block — "the system cannot work."** Enforcement point, read from the rulings and stated as the adopted reading: the ⚠ notice renders at step 3 immediately (a notice, not a navigation block — `R12` leaves the builder no earlier blocking point), and the hard block lands at Generate in the failure list (`M06-23`(b)); the source does not state an earlier block and none is invented. _(non-UI half, build-side: OFFGRID/HYBRID without battery: notice at step 3, hard block only at Generate (R12) — for awareness, not for drawing)_
- **M06-35** (P0) — **The client-payable summary card is live at step 3:** `cost + battery − incentive − discount = payable`, recomputing on every change, and **warning the moment a discount drives payable to zero or below** — the warning shows the negative figure rather than hiding it. The card is feedback; the block is Generate's (`M06-36`).
- **M06-40** (P0) — **The EMI calculator is proposal-side — and it is the whole v1 financing story.** Step 3's Easy-financing toggle reveals the EMI interest rate (0–100%) and the document renders the resulting EMI arithmetic as a labelled projection (`F8-23`). A financing marketplace (lender referral, eligibility, application, status) is explicitly not v1 (§5) — designed-for as a portable capability, never load-bearing. _(non-UI half, build-side: EMI arithmetic rendered as labelled projection; financing marketplace explicitly not v1 — for awareness, not for drawing)_

## States

- **Loading** (base) — the step opens with the draft's committed values; the payable card reads the same server arithmetic as the Generate checks (§M06.6 behavior detail) and never shows a locally invented figure as final.
- **Empty** (base) — Path B fresh: required (\*) fields unfilled show as the chip's incomplete dot and Generate-gate completeness — never a disabled Next (M06-22).
- **Error** (base) — a failed commit or recompute acknowledged honestly; entered values preserved.
- **derived-prefilled** — Path A: capacity, type, category arrive derived from the design; cost from the real bill of materials (M06-03).
- **typed-path-b** — Path B: values typed; a typed figure carries the conservative tier per F8's recorded reading (`F8-21`, via M06-03).
- **battery-required-notice** — OFFGRID/HYBRID with no battery: the ⚠ "Battery required" notice renders immediately — a notice, not a navigation block; the hard block is Generate's (M06-30).
- **battery-modal** — the bottom sheet: capacity kWh (1–100), cost excl./incl. tax, battery tax %, cell chemistry (Lithium LFP / Lithium NMC / Lead-acid / Custom with free text), Cancel · Save (M06-30).
- **battery-added-summary** — the card's added state: summary with Edit / Remove; removing the battery removes step 8's section and its line from the payable — with the removal stated, never silent (M06-30, §M06.5 behavior detail). HYBRID switched back to ONGRID keeps the battery card — only the force-notice clears (§M06.5 edge case).
- **payable-negative-warning** — the live card warns the moment payable goes ≤ 0, showing the negative figure rather than hiding it; the block lands at Generate (M06-35, `M06-36`).
- **below-cost-warning** — a discount below cost (Path A: below BOM-derived cost; Path B: below the typed cost basis) warns explicitly with the loss stated in tenant currency and never blocks (`M06-37`, §M06.6).
- **emi-enabled** — the Easy-financing toggle on reveals the EMI interest rate (0–100%); the resulting arithmetic renders on the document as a labelled projection (M06-40).
- **discount-mode-switch** — discount entry switches **% ⇄ amount**; the entered mode is what versions record — conversion loses no intent (M06-09, §M06.6 behavior detail).

## Data volume

The densest builder form: location fields, four configuration fields plus the battery card, and the full money block (cost, tax, incentive, discount, EMI, tariff) with the live payable card recomputing on every change. One bottom sheet (battery). Design at realistic money magnitudes for both segments — small residential systems and C&I systems within the step's 0.5–7000 kW capacity range.

## Numbers carrying provenance

Every figure here carries its F8 tier (`F8-01`/`F8-02`) in the design:

- **System capacity kW** (0.5–7000) — derived on Path A, typed on Path B (conservative tier per `F8-21`).
- **System cost excl. battery, incl./excl. tax** — Path A: the real bill of materials (derived); Path B: a typed lump sum (M06-03).
- **Tax % and computed tax amount** — per the market pack's tax scheme (`F1-13`); labels are pack strings, never hard-coded.
- **Incentive amount** — computed from the market pack's incentive model (`F1-14`, `M06-38`) — never manually configured per tenant.
- **Discount (% ⇄ amount)** — rep-entered; audited with amount and actor (`F2-22` via §M06.6 permissions).
- **Battery capacity kWh (1–100), battery cost, battery tax %** — entered in the battery modal (M06-30).
- **Electricity tariff per kWh** (1–50, tenant currency) — typed input.
- **EMI interest rate (0–100%)** and the resulting EMI arithmetic — a labelled projection with its assumptions (`F8-23`, M06-40).
- **Client payable** — the live card's `cost + battery − incentive − discount = payable`, recomputing on every change; shows the negative when ≤ 0 (M06-35). All money renders in the tenant currency through the pack's formats (`F3-20`, `F1-46`).
