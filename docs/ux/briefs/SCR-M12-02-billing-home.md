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
- **BM-41** (P0) — **The India book — the source-derived first instance (IN book; every number below is IN-market data, not the generic model).** Identified by `F1-60`/`F1-61`; canonical here. **Tier prices (INR, ex-GST):** Starter **₹1,999/mo · ₹19,990/yr** — Growth **₹3,999/mo · ₹39,990/yr** — Pro **₹9,999/mo · ₹99,999/yr** — Enterprise **custom, anchored ₹24,999+/mo**, annual contract (owner-set anchors ~₹2k/~₹4k/~₹10k). **Capacity + counts:** single-design ceiling 50 kW / 500 kW / 5 MW / 100 MW (utility: blocks/zones, trackers, terrain); proposals 30 / 300 / 1,500 / unlimited per month; active projects 10 / unlimited / unlimited / unlimited; users unlimited on all four. **Bundles + overage:** AI detections 30 / 100 / 400 / custom per month, then ₹10 each; voice minutes PAYG ₹6/min on Starter and Growth, 400 min/mo bundled then ₹6/min on Pro, custom bundles + BYO number on Enterprise; storage 10 / 50 / 250 GB / custom.
- **M12-52** (P0) — **The trial is modelled in-app only; the gateway subscription is created at conversion.** 14 days, every tier capability, within the trial caps (book data — `BM-41`); no card or mandate to start; one 7-day extension available to support (an audited override, M12-19's family).
- **F1-28** (P0) — The IN tax scheme is **GST**, strategy `per_line_rate`; the tenant tax-registration type is `IN_GST`. All platform prices are **ex-GST**; platform SaaS subscriptions and overage add-ons carry **SAC 998434 (cloud/SaaS) at 18% GST**.

**A price list value's trust label.** Its tier word is `Published` — the PRD's own word for a price list's values (`M12-55`, `M12-35`) — and its source label is the list's name and date. The date is sample content, because a price list is versioned data (`F1-25`): draw `India price list · 1 Apr 2026`.

## Entry & exit

Reached from: dunning messages, which "deep-link to the billing screen's one action" (`docs/prd/modules/M12-platform-billing.md` §M12.6 behavior detail); the honest state banner and blocked-mutation errors, which carry "a route to reactivate" (BM-32; banner surface is SCR-SHELL-06); and it is available in every billing state without exception (M12-55, BM-32). Leads to: plan selection (SCR-M12-03); the usage screen — "what am I using (deep link to the usage screen)" (`docs/prd/modules/M12-platform-billing.md` §M12.10 behavior detail, SCR-M12-04); the gateway's hosted checkout for pay/update-method/reactivate (the platform never sees a payment instrument — M12-10 context); the cancel-reason dialog (M12-50); invoice PDFs (M12-55). Reactivation from a dead state "is the same screen with one primary action" (§M12.10 behavior detail).

**Inherited from `SCR-SHELL-06` (designed) — reuse, never redraw.**

- **The billing strip.** Where a frame shows the billing strip or a denial sheet, it is `SCR-SHELL-06`'s, reused exactly as that file draws it (context file, *REUSED, never redrawn*). This screen designs no second banner.
- **Routes.** The strip's act and both denials' act lead to `SCR-M12-03` and return to the surface they were pressed from; the 80% cap's `See usage` leads to `SCR-M12-04`. This screen adds no second route to the same act.
- **`non-owner-read-only`.** `ScopeNote` takes the act's place, its holder in the design system's form — `Mahesh Bhosale (owner)` — and no amount renders.
- **One sample story across the billing screens.** Suryodaya Solar · Growth plan · Owner Mahesh Bhosale · today 15 Sept 2026 · the charge that failed on 11 Sept 2026 · invoice `HG-INV-2026-0891`, ₹24,600.

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
