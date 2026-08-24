# SCR-M12-02 · Billing Home

Plan, cycle, payment method, invoices, dunning state and history; the guaranteed way back from dead states.

**Module:** M12 · Platform billing · **Personas:** EPC Owner — the only persona that manages billing (plan, cycle, payment method, reactivation, cancellation, `F2.M12.manage-billing`); non-Owner employees may open the screen and see state but never amounts or acts (M12-56 context: "the state is visible, the acts are not; the screen says whose act it is") · **Context of use:** web emphasis for plan/mandate/invoice work; the dunning banner and one-tap pay are fully mobile (`docs/prd/modules/M12-platform-billing.md` §2). This screen must work when the tenant is in a dead state — it is the way back, so it is opened under stress, often from a dunning message on a phone.

## Entry & exit

Reached from: dunning messages, which "deep-link to the billing screen's one action" (`docs/prd/modules/M12-platform-billing.md` §M12.6 behavior detail); the honest state banner and blocked-mutation errors, which carry "a route to reactivate" (BM-32; banner surface is SCR-SHELL-06); and it is available in every billing state without exception (M12-55, BM-32). Leads to: plan selection (SCR-M12-03); the usage screen — "what am I using (deep link to the usage screen)" (`docs/prd/modules/M12-platform-billing.md` §M12.10 behavior detail, SCR-M12-04); the gateway's hosted checkout for pay/update-method/reactivate (the platform never sees a payment instrument — M12-10 context); the cancel-reason dialog (M12-50); invoice PDFs (M12-55). Reactivation from a dead state "is the same screen with one primary action" (§M12.10 behavior detail).

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
