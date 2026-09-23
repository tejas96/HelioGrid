# SCR-M12-02 · Billing Home

Plan, cycle, payment method, invoices, dunning state and history; the guaranteed way back from dead states.

**Module:** M12 · Platform billing · **Personas:** EPC Owner — the only persona that manages billing (plan, cycle, payment method, reactivation, cancellation, `F2.M12.manage-billing`); non-Owner employees may open the screen and see state but never amounts or acts (M12-56 context: "the state is visible, the acts are not; the screen says whose act it is") · **Context of use:** web emphasis for plan/mandate/invoice work; the dunning banner and one-tap pay are fully mobile (`docs/prd/modules/M12-platform-billing.md` §2). This screen must work when the tenant is in a dead state — it is the way back, so it is opened under stress, often from a dunning message on a phone.

**One job:** see what needs me on the bill, what I am on and what I am using — and, from a dead state, get back in one act.
**Order of attention:** 1 what needs me — a failed payment, a refund window, a scheduled downgrade, or the way back · 2 what I am on · 3 what I am using · 4 the records: payment method, invoices, history.

## Words on this screen

Every fact below is carried. None is a paragraph. The kinds are the context file's §2. **Route, don't
pack:** this screen answers three questions and leads to every record; it does not stack the records.

| Fact | Kind | Its form here |
|---|---|---|
| What needs me — the dunning rung, the refund window, a scheduled downgrade (§M12.10) | status · data · action | the first region, drawn only when something needs the Owner: a row per thing — its chip, the fact as label–value (the amount and the day the grace ends · refund available until a date · the plan and the date it changes) — and the region's ONE primary act |
| A dead state — `halted`, `expired`, `cancelled` — and the way back (`BM-32`, `M12-08`) | status · data · action | the same region, first on the screen and behind nothing: the state chip, what still works as four short rows, a row saying the data is intact, and ONE primary act, `Reactivate`. Its one line says entitlements return when the payment confirms |
| What I am on — plan, cycle, price, next bill and its date (`M12-55`) | data · status | label–value rows in a `Your plan` region; the subscription state is its chip; a `Change plan` row leads to `SCR-M12-03` |
| The plan's published caps and bundles (`M12-55`) | more detail | a `What my plan includes` row that opens the list in place — never a dozen rows standing on this screen |
| What I am using (§M12.10) | data · more detail | the two meters nearest their caps, as quiet rows, and an `All usage` row leading to `SCR-M12-04` |
| The payment method and its mandate (`M12-55`) | data · status · action | one label–value row, the method as the gateway names it, with its chip; a secondary `Update` act that hands off to the gateway. Why the product never sees an instrument is Help |
| Invoices, every one exportable in every state (`M12-46`, `M12-55`) | data · more detail | the three latest as list rows — amount, date, what it was for, its state chip, its PDF — then an `All invoices` row leading to the full list with its filter chips. A list at 375, a table at 1536. The PDF act never goes away with the billing state |
| The 7-day refund window (`M12-47`) | data | a row in `Needs you`, present only while it is open: that a refund is available, and until when. It is gone afterwards — never a hidden clause, never a standing sentence |
| Dunning history and subscription history (`M12-55`, §M12.2) | more detail | two rows that lead to their append-only lists — state, when, why |
| Cancel (`M12-50`) | action | the last, quiet act on the screen. Its reason dialog is a sheet: the reasons as a list, `Skip` always offered because a reason is never a gate, and ONE line — the day service runs to, and that the data is kept |
| Cancelled, running to its period end (`M12-50`) | status · data · action | the chip, a `Runs until` row, and `Reactivate` |
| Enterprise (§M12.10) | action | a `Talk to us` row, and nothing self-serve |
| A person who is not the Owner opens this screen (`M12-56` context) | status | the state chip and ONE line naming whose act it is; no amount and no act is drawn |
| A fresh trial — no invoices, no mandate yet | teaching | the trial's state and days left in `Your plan`; the invoices region teaches in at most two short sentences |
| Billing data failed to load | error | one banner — what failed and what to do. This screen is the way back, so retry AND the pay route stay reachable |

## Arrangement

- **375.** `Needs you`, only when something does · `Your plan` · `Usage this cycle` · `Payment
  method` · `Invoices` · the two history rows · `Cancel subscription`, last and quiet.
- **1536.** Two columns: what needs me, the plan and the usage on the left; the payment method and the
  invoices table — more rows in view — on the right. A history opens as a side panel (`F7-21`).

## Sample data — the book's rows, drawn and never invented

The plan names, the trial's length, the tax rate and every price, cap and bundle on this screen are
these rows' values. Invoice amounts, dates and usage counts are yours to choose; a plan name or a
published figure these rows do not carry is wrong.

- **BM-11** (P0) — **Four tiers, fixed names: Starter · Growth · Pro · Enterprise.** The names are market-neutral structure and suite-wide vocabulary — every market's price book prices these same four tiers in its own currency (F1-25), every entitlement is keyed to them (M12), every report that segments by plan uses them (M13).
- **BM-41** (P0) — **The India book — the source-derived first instance (IN book; every number below is IN-market data, not the generic model).** Identified by `F1-60`/`F1-61`; canonical here. **Tier prices (INR, ex-GST):** Starter **₹1,999/mo · ₹19,990/yr** — Growth **₹3,999/mo · ₹39,990/yr** — Pro **₹9,999/mo · ₹99,999/yr** — Enterprise **custom, anchored ₹24,999+/mo**, annual contract (owner-set anchors ~₹2k/~₹4k/~₹10k). **Capacity + counts:** single-design ceiling 50 kW / 500 kW / 5 MW / 100 MW (utility: blocks/zones, trackers, terrain); proposals 30 / 300 / 1,500 / unlimited per month; active projects 10 / unlimited / unlimited / unlimited; users unlimited on all four. **Bundles + overage:** AI detections 30 / 100 / 400 / custom per month, then ₹10 each; voice minutes PAYG ₹6/min on Starter and Growth, 400 min/mo bundled then ₹6/min on Pro, custom bundles + BYO number on Enterprise; storage 10 / 50 / 250 GB / custom. **Trial caps:** 25 detections · 15 voice minutes · 5 GB. **Service terms are pricing-page copy, not book data (owner ruling 2026-09-07):** the IN positioning — support in-app / in-app + WhatsApp / priority + onboarding call / named contact — is rendered by the pricing page as Tier-keyed screen copy per BM-14; the book carries none of it and no entitlement, invoice or gate reads it, and a second market whose terms differ carries them as pack labels (`F1-22`), never in a locale-keyed catalog. Enterprise adds the BM-15 commercial arrangements. **Benchmarks (recorded per BM-39):** Reslink India INR page (owner-supplied, authoritative — Basic ₹60,000/yr at 50 kW · Pro ₹85,000/yr at 500 kW, 1,000 proposals · Premium ₹1,20,000/yr at 5 MW · Enterprise custom) and ARKA per-org pricing; priced under both at every rung — Starter-yearly 67% under Basic, Growth-yearly 53% under Pro, Pro-yearly 17% under Premium with a voice bundle no competitor has, and Pro's 1,500 proposals/mo beat the benchmark's 1,000. **Collection routes:** per the IN mandate ladder, F1-40 (monthly self-serve under the per-debit cap rides UPI AutoPay; Enterprise e-NACH/invoice; every yearly total exceeds the cap and is a single payment link/invoice per year). **V2 add-on prices (owner ruling 2026-08-04 — base tiers confirmed unchanged; every add-on number below is DRAFT pending rate-card verification per BM-17/BM-26):** tracked seat **≈₹99/seat/mo** beyond the tier's included allowance; **included tracked seats: Starter 0 · Growth 3 · Pro 10 · Enterprise custom**; marketing-send bundles **Starter 500 · Growth 2,000 · Pro 10,000 sends/mo**, overage **≈ WhatsApp ₹1.5 · SMS ₹0.35 · email ₹0.10 per send**. A draft add-on rate is not sellable until the owner verifies the channel/seat rate cards against worst-case unit COGS (the ≥40% floor, BM-17) — verification is the revisit trigger.
- **M12-52** (P0) — **The trial is modelled in-app only; the gateway subscription is created at conversion.** 14 days, every tier capability, within the trial caps (book data — `BM-41`); no card or mandate to start; one 7-day extension available to support (an audited override, M12-19's family).
- **F1-28** (P0) — The IN tax scheme is **GST**, strategy `per_line_rate`; the tenant tax-registration type is `IN_GST`. All platform prices are **ex-GST**; platform SaaS subscriptions and overage add-ons carry **SAC 998434 (cloud/SaaS) at 18% GST**.
- **M12-06** (P0) — **`past_due` carries a 7-day grace in two phases:** days 0–3 full function plus the banner; days 4–7 only the features that cost per-use money pause (voice, AI detections, invites). **Core selling continues through the whole grace window** — leads, surveys, designs, proposals, projects all work to day 7.
- **M12-39** (P0) — **The dunning ladder runs from the first failed charge, one rung per fact:** day 0 → `past_due`, banner + push + message ("payment failed, we'll retry — update your method here") · day 2 reminder · day 4 → metered features pause, and the message states **exactly what paused and what still works** · day 6 final warning with a one-tap pay link · day 7 → `halted`, and the message **confirms read + export + customer links + the billing screens (pay/upgrade/reactivate) still work** *(Final review: "billing screens" restored — `BM-32`'s always-works list is four items)* · post-halt weekly × 4, then monthly, indefinitely — reactivation always one payment away. **Grandfathering honesty (owner ruling 2026-08-04):** for a tenant inside a protection horizon, the ladder's copy from day 0 states plainly that a lapse to `cancelled`/`halted` **forfeits the launch-price guarantee** and reactivation prices at the current book — the no-surprise rule; win-back messages repeat it.
- **M12-56** (P0) — **Managing billing is EPC Owner-only; seeing state is everyone's.** Every billing act rides `F2.M12.manage-billing` (v1 matrix, restored capability). The state banner renders for all employees without amounts; the dunning banner's named audience is owner + managers (M12-40); no employee surface shows a price, invoice or usage figure — those are the Owner's screens.

**A price list value's trust label.** Its tier word is `Published` — the PRD's own word for a price list's values (`M12-55`, `M12-35`) — and its source label is the list's name and date. The date is sample content, because a price list is versioned data (`F1-25`): draw `India price list · 1 Apr 2026`.

## Entry & exit

Reached from: dunning messages, which "deep-link to the billing screen's one action" (`docs/prd/modules/M12-platform-billing.md` §M12.6 behavior detail); the honest state banner and blocked-mutation errors, which carry "a route to reactivate" (BM-32; banner surface is SCR-SHELL-06); and it is available in every billing state without exception (M12-55, BM-32). Leads to: plan selection (SCR-M12-03); the usage screen — "what am I using (deep link to the usage screen)" (`docs/prd/modules/M12-platform-billing.md` §M12.10 behavior detail, SCR-M12-04); the gateway's hosted checkout for pay/update-method/reactivate (the platform never sees a payment instrument — M12-10 context); the cancel-reason dialog (M12-50); invoice PDFs (M12-55). Reactivation from a dead state "is the same screen with one primary action" (§M12.10 behavior detail).

**Decisions made in design — later screens inherit them.**

1. **`Needs you` exists only when something needs the Owner.** In the active state it is absent, not empty. In every other state it is first, and its one act is the state's one act.
2. **A dead state is the way back, and it does not repeat the strip.** The strip says what paused and what still works; the region below adds the state chip, `To reactivate · ₹4,718.82` with its `Derived` mark and working, `Your data — kept` in the strip's own row form, and ONE act. The trial's way back is `Choose a plan`, not a payment: no mandate ever existed, so no amount is invented.
3. **Every figure in `Needs you` and every meter ends on the region's right edge** (x=331 at 375), `SCR-M12-04`'s edge. `Your plan`, `What my plan includes`, the payment method and the cancel sheet share one 120px label track.
4. **Every record is routed:** three invoices and `All 24 invoices`; two meters and `All usage`; `Payment reminders` and `Plan history` — a side panel at 1536, where the invoices are a captioned table (`For` is a column there; at 375 the row holds amount, date, state and PDF, and the block's title is its scope).
5. **One invoice provenance line** at the region's foot — `Derived · India price list · 1 Apr 2026 · 18% GST` — carries every amount's tier.
6. **Enterprise** shows counts with no cap, and its money and limits name the contract as their source — never the price list; the board draws `BM-41`'s anchor, ₹24,999 + 18% GST. `Talk to us` and nothing self-serve.
6a. **A subscription that takes no further charge has no live mandate.** Halted, cancelled running and cancelled show the method's chip as `Ended` with no `Update`: reactivation creates a new mandate at the gateway (`M12-08`).
7. **The empty state is day one of a trial** — meters at zero, no invoice, no mandate, no history; `trialing` is nine days in.
8. **Entry and exit.** In from dunning messages, the strip's act and any blocked act's route; back is More at 375 and a `More / Billing` breadcrumb at 1536. Out to `SCR-M12-03` (`Change plan`, `Choose a plan`), `SCR-M12-04` (`All usage`), the gateway (`Pay`, `Update`, `Reactivate`, `Ask for a refund`), the PDF, and the two history lists.

**Inherited from `SCR-SHELL-06` (designed) — reuse, never redraw.**

- **The billing strip.** Where a frame shows the billing strip or a denial sheet, it is `SCR-SHELL-06`'s, reused exactly as that file draws it (context file, *REUSED, never redrawn*). This screen designs no second banner.
- **Routes.** The strip's act and both denials' act lead to `SCR-M12-03` and return to the surface they were pressed from; the 80% cap's `See usage` leads to `SCR-M12-04`. This screen adds no second route to the same act.
- **`non-owner-read-only`.** `ScopeNote` takes the act's place, its holder in the design system's form — `Mahesh Bhosale (owner)` — and no amount renders.
- **One sample story across the billing screens.** Suryodaya Solar · Growth plan · Owner Mahesh Bhosale · today 15 Sept 2026 · the charge that failed on 11 Sept 2026 is the Growth month — invoice `HG-INV-2026-0902`, ₹3,999 + 18% GST = ₹4,718.82 — the same figure every billing screen prints for that charge (owner ruling).

**Inherited from `SCR-M12-03` (designed) — reuse, never redraw.**

- **`Your plan` is `SCR-M12-03`'s block:** three pairs — `Plan`, `Price` (the cycle and `+ GST` ride the value), `Next bill` with its own `Derived` mark — and the subscription state as its one chip. During a trial or after a lapse the chip changes and the end date takes the price row's place.
- **`Change plan` leads to `SCR-M12-03`**, whose back control returns here; a downgrade returns to this screen's scheduled-downgrade state.
- **Honesty labels:** `Published · India price list · 1 Apr 2026`. A one-of-N choice is a chip strip, directly above what it changes.

**Inherited from `SCR-M12-04` (designed) — reuse, never redraw.**

- **The meter row is `SCR-M12-04`'s:** label left, used of included at the right on one edge, a quiet bar under it, and the state as a chip with its word — `Nearing a limit`, `At a limit`, `Paused`. `Usage this cycle` shows the two meters nearest their limits in exactly that form, and an `All usage` row leads to `SCR-M12-04`.
- **What needs the person** takes `SCR-M12-04`'s `Needs you` row: the meter's name with its chip, the figure, and ONE line saying what happens next and when.
- **The trust label** is two quiet lines at the foot of the region: `Actual usage`, then `Limits and rates · India price list · 1 Apr 2026`.

## Requirements (verbatim)

### docs/prd/04-business-model.md

- **BM-32** (P0) — **The soft-block law.** The product soft-blocks, never hard-blocks. In **every** billing state without exception: **read everything** (search, dashboards included), **export everything** (CSV, data export, existing proposal PDFs, invoices), **customer links keep working** (view AND respond, progress pages — the tenant's customer is never punished for the tenant's billing state), and **billing screens with pay/upgrade/reactivate stay available**. No data is ever deleted for non-payment — deletion happens only through the data-rights erasure workflow (F1-24). Blocked mutations fail with an honest state banner and a route to reactivate (mechanics M12). _(non-UI half, build-side: read/export/customer-links/billing always work in every state; nothing deleted for non-payment — for awareness, not for drawing)_

### docs/prd/modules/M12-platform-billing.md

- **M12-08** (P0) — **Reactivation is always available, from every dead state.** `halted` / `expired` / `cancelled` → `active`: the owner pays from the always-available billing screen; a **new** gateway subscription is created — a halted subscription is never resumed, one live mandate at a time; entitlements are active immediately on confirmation; all data is intact regardless of how long the tenant was halted. _(non-UI half, build-side: new gateway subscription created, never resumed; entitlements immediate; data intact — for awareness, not for drawing)_
- **M12-46** (P0) — **Invoices are exportable by the tenant in every billing state** — the read + export law applied to the bill itself. _(non-UI half, build-side: export ungated in every billing state including halted — for awareness, not for drawing)_
- **M12-47** (P0) — **Refunds: 7-day money-back on the first paid cycle only.** Removes post-trial conversion risk; refund-to-source; the market scheme's credit-note artefact auto-issues against the cycle invoice (IN: GST credit note). Renewal cycles carry no refunds — cancellation runs to period end instead. _(non-UI half, build-side: refund-to-source; credit note auto-issues; renewals carry no refunds — for awareness, not for drawing)_
- **M12-50** (P0) — **Cancellation is owner-initiated from the billing screen, with a reason captured as product signal, never as a gate.** Service runs to the paid period end; data is retained; reactivation is always offered. _(non-UI half, build-side: reason is signal never gate; runs to period end; data retained — for awareness, not for drawing)_
- **M12-55** (P0) — **The billing screens are real, complete, and available in every state:** current plan and cycle with the book's published caps/bundles; plan selection; mandate/payment-method setup and update; invoice list with PDFs; the usage screen (§M12.5); dunning state and history; cancel; reactivate. In `halted`/`expired`/`cancelled` these screens are the guaranteed way back (`BM-32`'s fourth always-on row, enforced here).
  _Shared row: M12-55's plan-selection half lands on SCR-M12-03._

The screen answers three questions at a glance: "what am I on, what am I using (deep link to the usage screen), what needs me (dunning state, refund window, scheduled downgrade)" (`docs/prd/modules/M12-platform-billing.md` §M12.10 behavior detail). Subscription history — every state entered, when, why — is append-only and readable on the billing screen (§M12.2 behavior detail).

## States

- **loading** — plan/invoice/dunning data not yet resolved.
- **empty** — a fresh trialing tenant with no invoices, no dunning history, no mandate yet (signup carried no billing step; billing's first appearance is the trial state itself — M12-14 context).
- **error** — billing data failed to load; honest failure. This screen is the guaranteed way back, so the error state must still route to retry/pay.
- **trialing** — trial state with countdown context (chip itself is SCR-SHELL-06); no mandate exists yet.
- **active** — mandate live, current period paid; current plan and cycle with the book's published caps/bundles.
- **past-due-grace** — the 7-day grace: days 0–3 full function plus banner; days 4–7 metered features paused (M12-06 context); dunning state and history visible.
- **past-due-banner** — the honest state banner naming the state, what changes and the one action that resolves it (§M12.2 behavior detail; banner surface shared with SCR-SHELL-06).
- **halted** — soft-block set in force; read/export/customer-links/billing all still work (BM-32); the screen is the way back.
- **halted-reactivate** — the same screen with one primary action: pay → new gateway subscription, entitlements immediate (M12-08).
- **expired** — trial expired, terminal, behaves as halted; reactivation permanently offered (M12-08; M12-07 context).
- **cancelled-running-to-period-end** — service runs to the paid period end; data retained; reactivation always offered (M12-50).
- **cancelled** — after period end, behaves as halted; the always-on rows hold; reactivation one payment away (M12-08).
- **cancel-reason-dialog** — owner-initiated cancellation with a reason captured as product signal, never as a gate (M12-50).
- **refund-window-visible** — first paid cycle, first 7 days: refund eligibility renders plainly and disappears after — never a hidden clause (M12-47; §M12.8 behavior detail).
- **scheduled-downgrade-pending** — a confirmed downgrade awaiting the cycle boundary shows under "what needs me" (§M12.10 behavior detail).
- **enterprise-contact-us** — Enterprise's sales-assisted arrangements surface here only as "contact us"; no self-serve surface invents Enterprise mechanics (§M12.10 behavior detail).
- **non-owner-read-only** — a non-Owner opens billing: state visible, acts absent, no amounts shown; the screen says whose act it is (M12-56 context).

## Data volume

Design at a mature tenant: an invoice list with PDFs spanning 24+ monthly cycles (every one exportable in every state, M12-46); a dunning history that can be long — the ladder runs day 0/2/4/6/7 then post-halt weekly × 4 then monthly, indefinitely (M12-39 context); an append-only subscription history of every state entered, when and why (§M12.2 behavior detail); plus the current plan's full set of published caps/bundles (the book's ~dozen values).

## Numbers carrying provenance

Each user-visible number/money/date carries its F8 provenance tier in the design. Per the owner ruling carried in M12-34, billing screens use plain "actual usage" language — the word "measured" never appears here.

- Current plan price and cycle; the book's published caps and bundle sizes for the current plan (book data, pointed at, never restated — BM-09 context).
- Every invoice: amount, date, state; the one-time prorated invoice from an upgrade when present.
- Refund window: eligibility and its end date during the first paid cycle only (M12-47).
- Dunning: each rung's date and state; days remaining in grace (M12-06 context).
- Paid-period end date for `cancelled` running to period end (M12-50); scheduled-downgrade boundary date.
- Subscription history dates (state entered, when).
