# 16 — Billing & Entitlements

**Billing is in v1.** D38 (deferred billing) is superseded by product-owner override, 2026-07-24
(recorded in [`./15-spec-resolutions.md`](./15-spec-resolutions.md)). Trial-only, **no free tier**.
Source research: [`./research/verify-billing.md`](./research/verify-billing.md),
[`./research/integrations.md`](./research/integrations.md), [`./research/market.md`](./research/market.md);
BLUEPRINT §Billing & entitlements is binding. Schemas: [`./04-data-model.md`](./04-data-model.md).
Webhook/credential security: [`./08-security-and-tenancy.md`](./08-security-and-tenancy.md).

Two money systems live here and they never mix:
1. **Platform SaaS billing** — tenant pays us. Razorpay Subscriptions, our merchant account.
2. **Tenant customer-collections** — homeowner/factory pays the EPC. BYO-Razorpay `PaymentLinkPort`, tenant's own account. We never touch these funds (§9).

---

## 1. Plans & tiers

**Prices, caps and bundle sizes are defined ONCE in
[`./01-business-model.md`](./01-business-model.md)** — restating them here would create a
drift vector — one definition per fact. This document fixes the billing MECHANICS only.

Shape (owner directive, docs/15 §4): org-level and capacity-tiered — **never per-seat**
(Indian EPCs employ many low-cost designers; ARKA and Reslink both price per-org —
[`./research/market.md`](./research/market.md)), priced below both.

What this document owns is the mandate route each tier's price band requires:

| Tier band | Mandate route (monthly) |
|---|---|
| Starter · Growth · Pro — all monthly prices under the ₹15k UPI AutoPay debit cap | UPI AutoPay |
| Enterprise (custom) | e-NACH / invoice |
| **Any yearly variant** — totals incl. 18% GST all exceed ₹15k | Single Razorpay payment link/invoice per year, **no mandate needed**; renewal is a fresh invoice (card e-mandate / e-NACH optional for auto-renew) |

- **Unlimited users on every tier.** Capacity/usage differentiates tiers — never features (owner-confirmed): single-design kW ceiling, **proposal-creation cap per month + Starter active-project cap (owner directive; counts in 01: 30/300/1,500/unlimited proposals; Starter 10 active projects)**, voice-minute bundle, AI-detection bundle, storage GB — values in 01.
- Every tier exists as **two Razorpay Plan objects (monthly + yearly)** mirrored 1:1 by rows in our `plans` table (`billing_cycle` column: monthly/yearly); our table is the source of truth for entitlements, Razorpay's for money. Cycle switches (monthly → yearly) follow the same upgrade mechanics as tier changes (§10): immediate entitlements, prorated delta, new subscription at boundary.

**Trial (the only non-paying state):** 14 days, **every tier capability**, within the Trial caps defined in [`./01-business-model.md`](./01-business-model.md) — the single source (25 AI detections / 15 voice minutes / 5 GB storage). No card/mandate required to start — signup stays phone+OTP+company (Stage 0). One 7-day extension available to support. Trial is modelled **in-app only** (state on `subscriptions`), not as a Razorpay object; the Razorpay subscription is created at conversion with `start_at = now` ([`./research/verify-billing.md`](./research/verify-billing.md): model free access as in-app state, not a gateway plan).

---

## 2. Subscription lifecycle state machine

One row per tenant in `subscriptions` (current) + append-only `subscription_events` (history). States:

```
            pay (mandate authenticated + first charge)
  trialing ──────────────────────────────► active ◄─────────────┐
    │ 14d elapsed, no conversion            │ charge fails       │ charge succeeds /
    ▼                                       ▼                    │ manual payment
  expired (trial ended unconverted)     past_due ────────────────┤
   [terminal]                               │ 7 days unpaid      │
                                            ▼                    │
                                          halted ────────────────┘  (reactivation = new
                                                                      Razorpay subscription,
  active ──── owner cancels ────► cancelled (runs to period end)      same tenant row)
```

| State | Meaning | Grace/timer |
|---|---|---|
| `trialing` | Day 0–14, every tier capability within Trial caps (01) | Auto-transition at day 14; nudges at day 7/12/14 |
| `active` | Mandate live, current period paid (`entitled_until = period_end + 3 days` buffer for webhook lag) | — |
| `past_due` | A charge failed; Razorpay is retrying | 7-day grace. Day 0–3: full function + banner. Day 4–7: metered features pause (§3) |
| `halted` | Grace exhausted, or Razorpay `subscription.halted` | Soft-block (§3). Data retained indefinitely — never held hostage |
| `expired` | **Terminal**: trial ended unconverted | Soft-block (§3, behaves as halted). Data retained indefinitely |
| `cancelled` | **Terminal**: owner-initiated; service runs to paid period end, then behaves as halted | Reactivation offered permanently |

**Reactivation** (halted/cancelled/expired → active): owner pays from the always-available billing screen → we create a **new** Razorpay subscription (halted Razorpay subs are not resumed — clean cut, one live mandate at a time), state → active immediately on `subscription.activated`/first `charged`. All data intact regardless of how long the tenant was halted.

**Soft-block, never hard-block:** blocked mutations return a typed `ENTITLEMENT_BLOCKED` error; UI renders the state banner + "Reactivate" path. No data is ever deleted for non-payment; deletion happens only via the DPDP erasure workflow ([`./08`](./08-security-and-tenancy.md) §9).

---

## 3. Soft-block matrix (per state)

Product law (CLAUDE.md): **read + export ALWAYS work.** Journey law: **never punish the tenant's customer** — links stay live.

| Capability | trialing | active | past_due d0–3 | past_due d4–7 | halted | cancelled (post-period) |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Read everything, search, dashboards | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export: CSV, data export, existing proposal PDFs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Customer links (view AND respond) + customer progress pages | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Billing screens, pay/upgrade/reactivate | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create/edit leads, tasks, activities, surveys | ✓ | ✓ | ✓ | ✓ | — | — |
| Studio: create/edit designs (read-only open always works) | ✓ | ✓ | ✓ | ✓ | — | — |
| Generate/send proposals, mark won/lost, project updates | ✓ | ✓ | ✓ | ✓ | — | — |
| File/photo uploads (offline queue drains too) | ✓ | ✓ | ✓ | ✓ | — | — |
| Voice agent (outbound + AI inbound) | ✓* | ✓* | ✓* | paused | — | — |
| AI roof detections | ✓* | ✓* | ✓* | paused | — | — |
| Team invites (OTP spend) | ✓ | ✓ | ✓ | — | — | — |

`✓*` = within plan/trial allowance (§6). `expired` (trial ended unconverted) behaves exactly as the `halted` column. "Paused" in late past_due covers only features that cost us per-use money; core selling continues through the whole grace window. When halted, inbound agent calls degrade to missed-call log + voicemail (no AI minutes burned); offline-captured survey data still syncs and reads — the block is on *new* mutations from the UI, never on draining a field crew's already-captured queue.

---

## 4. Razorpay Subscriptions integration

Per [`./research/verify-billing.md`](./research/verify-billing.md) (verified July 2026): [Subscriptions + UPI AutoPay guide](https://razorpay.com/blog/master-recurring-payments-upi-autopay-guide/), [UPI AutoPay vs card e-mandates](https://razorpay.com/blog/upi-autopay-vs-card-e-mandates/), [webhook events](https://razorpay.com/docs/webhooks/subscriptions/), [best practices](https://razorpay.com/docs/webhooks/best-practices/).

- **Mandate ladder:** UPI AutoPay primary (**₹15,000/debit cap** — every monthly tier fits; ~0.5% + 18% GST, cheapest + highest-converting) → card e-mandate fallback (~2% gateway + 0.99% subscription fee + GST) → e-NACH for Enterprise (up to ₹10L/debit). Annual = one-shot invoice, no mandate (§1).
- **Pre-debit notifications** (mandatory 24–48h before each charge) are Razorpay's job — we build nothing, but our dunning copy references them (§10).
- Checkout: hosted Razorpay flow from the billing screen. We never see payment instruments — RBI localisation stays Razorpay's problem ([`./08`](./08-security-and-tenancy.md) §9).

### Webhook events map

| Razorpay event | Our transition / action |
|---|---|
| `subscription.authenticated` | Mandate created (conversion started) — record; entitlements unchanged until charge |
| `subscription.activated` | → `active`; set `entitled_until` |
| `subscription.charged` | **Source of truth for entitlement**: extend `entitled_until = period_end + 3d`; write payment row; trigger GST invoice (§8); clear dunning |
| `subscription.pending` | → `past_due`; start dunning clock (§10) |
| `payment.failed` | Dunning notification (no state change by itself — `pending` carries state) |
| `subscription.halted` | → `halted` (Razorpay exhausted retries) — our own 7-day cap applies even if this arrives late |
| `subscription.cancelled` | → `cancelled` |
| `subscription.completed` | Total count exhausted (annual ladders) → renewal invoice flow |
| `subscription.paused/resumed` | Not offered in v1; log + alert if ever received |
| `invoice.paid` | Reconcile invoice row (annual one-shots + add-ons) |

### At-least-once handling (the only correct pipeline)

Razorpay delivers at-least-once, retries with backoff for 24h, duplicates and reordering guaranteed to happen. Pipeline, in order, nothing skipped:

1. **HMAC verify** `X-Razorpay-Signature` (webhook secret from Fly secrets) — constant-time; fail → 400, no processing.
2. **Dedupe** on `x-razorpay-event-id`: `INSERT ... ON CONFLICT DO NOTHING` into `subscription_events` (unique index on event id). Conflict → return 2xx immediately (already seen).
3. **Fast 2xx** — respond before processing; handler does zero business logic.
4. **Enqueue** to BullMQ (`billing.webhook` queue); processor applies the state machine transition idempotently (transitions are guarded — a stale `pending` arriving after `charged` is a no-op because event timestamps are compared against the row's `updated_from_event_at`).
5. **Reconcile-by-poll backstop**: BullMQ repeatable job **every 6 hours** fetches every non-terminal subscription from the Razorpay API and repairs drift (missed webhook, 24h-retry exhaustion). Any repair emits an alert — reconciliation should be boring.

---

## 5. Entitlements model — the ONLY runtime gating

**There are no feature flags in this product** (BLUEPRINT directive 8). Features ship enabled when merged. The single runtime gate is billing entitlements: plan entitlements (ceilings/booleans) + usage allowances (metered bundles).

Tables (per BLUEPRINT): `plans`, `subscriptions`, `subscription_events`, `entitlements` (effective per-tenant view: plan defaults + support overrides, overrides audited), `usage_events`, `usage_period_rollups`.

`EntitlementsService` (api-side, cached per-tenant 60s in Upstash, invalidated on webhook apply):
- `assertState(tenantId, mutationClass)` — the §3 matrix.
- `assertAllowance(tenantId, metric, qty)` — bundle remaining vs rollup + current-period ledger.
- `ceiling(tenantId, key)` — e.g. `design_kw_ceiling`. Ceilings are read from the `plans.bundles` JSONB column, not an `entitlement_key` enum.

### Enforcement points (complete list — adding a gated feature means adding a row here)

| Feature | Gate location | On deny |
|---|---|---|
| All UI mutations (leads/surveys/designs/proposals/projects) | `BillingStateGuard` on every non-GET ts-rest route (state matrix §3) | `ENTITLEMENT_BLOCKED` + reactivate CTA |
| Design capacity (kW tier ceiling) | Design **save/creation** + proposal Generate — never mid-edit in the studio; the flagship is never interrupted per-keystroke | Save blocked with upgrade prompt; existing designs always open |
| Proposal count/mo (30/300/1,500/∞ per 01) | Proposal **create** endpoint — plain `COUNT(*)` over the billing-cycle window, no new metering infra; banner at 80%, 7-day grace at 100% | New proposal creation pauses; editing/sharing/duplicating EXISTING proposals, and all reads/exports, never pause |
| Active projects (Starter: 10; others ∞) | Mark-won → project **create**; "active" = not handed over/cancelled | Mark-won blocked with upgrade prompt; existing projects fully workable — never strand a live installation |
| Voice agent outbound | Before queue insert AND before dial (queue entries can outlive allowance) | Call not placed; queue entry marked `blocked_entitlement`, owner notified |
| Voice agent AI inbound | CallSession accept hook | Fallback: human ring-group/voicemail per tenant IVR config |
| AI roof detection (Gemini/Google Solar) | Server proxy pre-call check | Detection blocked; manual outline always available (it costs us nothing) |
| OTP sends (team invites) | Invite endpoint | Blocked in late past_due/halted per §3 |
| Storage | Presigned-upload issuance (Tigris) when gauge > ceiling × 1.1 (10% soft headroom) | Upload blocked; reads/exports never |

Never gated, by law: reads, search, exports, customer links, billing screens, engineer sign-off on already-submitted designs (safety workflow), offline sync drain of already-captured data.

---

## 6. Usage metering

Append-only `usage_events` — the ledger is the bill; no other counter exists:

```
usage_events(id, tenant_id, metric, quantity numeric, unit text, subject_type, subject_id,
             provider_ref nullable, cost_estimate_paise nullable, idempotency_key, occurred_at, period_key)
metric ∈ billable { voice_minutes, ai_detections, otp_sms (fair-use, NOT billed v1), storage_gb }
       ∪ non-billable observability { solar_data_fetch, map_tile_fetch, dem_tile_fetch, push_sent, document_rendered }
```

Every writer supplies an `idempotency_key` (unique index) so a retried job or duplicate webhook can never double-meter.

- **voice_minutes**: one event per completed call from the CallSession ledger (BLUEPRINT: every call ledgered with cost breakdown), qty = billed minutes.
- **ai_detections**: one per Gemini/Google Solar detection request that returned a result (failures don't bill).
- **otp_sms**: one per MSG91 dispatch (auth + invites), for cost visibility; fair-use capped, NOT billed in v1.
- **storage_gb**: gauge, not counter — nightly worker job sums the tenant's Tigris prefix and writes a snapshot event.
- `usage_period_rollups(tenant_id, metric, period_key, total)` recomputed by a nightly BullMQ job **and** incrementally on write; a rollup is always reproducible from the ledger (append-only ⇒ auditability; same discipline as the money path).

**Tenant-visible usage screen honesty** (agent-performance "Usage" screen and billing): shows exactly the rollups we enforce and bill from — same query, same numbers, no smoothing, labelled with the period and "measured" provenance. If a bundle is 80% consumed, the screen says so before the gate ever fires. Overage (voice minutes, AI detections beyond bundle): billed at published per-unit rates via **Razorpay add-ons on the next subscription invoice**; the usage screen shows accruing overage in ₹ (Indian grouping) as it happens.

---

## 7. GST invoicing (platform billing)

- **We are the supplier of record** — Razorpay is a gateway, not merchant-of-record ([`./research/integrations.md`](./research/integrations.md)). Our GSTIN, our GST remittance, our liability.
- **Razorpay Invoices** auto-generates a GST-compliant invoice per billing cycle (subscription-linked) with our GSTIN, the tenant's GSTIN (captured at conversion — B2B tenants need it for ITC), place-of-supply logic (intra-state CGST+SGST / inter-state IGST), and SAC code.
- **SAC: 998434** (cloud/SaaS software service, 18% GST). Single ruling for all tiers and overage add-ons; confirm with the CA before the first live invoice — a SAC change is config, not code.
- **e-invoicing (IRN)**: not applicable until our turnover crosses the ₹5-crore threshold. Razorpay does NOT file IRNs for us (research nuance). Path when crossed: invoice rows already carry nullable `irn`, `ack_no`, `ack_date`, `qr_payload`; integrate a GSP/IRP API then, backfill nothing. Validation of the threshold sits with the CA at each FY close.
- **Razorpay's own fees carry 18% GST** — Razorpay issues its own fee invoice; tracked as a separate expense ledger line monthly and claimed as ITC. Never mixed with tenant-facing invoice data.
- Invoices are exportable by the tenant in every billing state (read+export law).

---

## 8. Tenant customer-collections — BYO Razorpay (`PaymentLinkPort`)

For C9 "pay the advance" and project tranches, the EPC's customer pays the **EPC**, never us:

- Each tenant connects **their own Razorpay account** (key id + secret + webhook secret) — stored in `tenant_integration_credentials` (AES-256-GCM app-layer encryption, per-tenant DEK envelope, master key in Fly secrets), decrypt-in-memory at mint time only ([`./08`](./08-security-and-tenancy.md) §7).
- `PaymentLinkPort.createLink(tenantId, tranche)` mints a Razorpay Payment Link **on the tenant's account**; funds settle directly to the tenant's bank. `handleWebhook(tenantId, payload, sig)` verifies with the tenant's own webhook secret, idempotent on event id, marks the tranche received and attaches the receipt.
- **The platform never touches funds → no RBI Payment Aggregator licence required.** This is the load-bearing regulatory line ([`./research/integrations.md`](./research/integrations.md); [Razorpay Route](https://razorpay.com/route/) context).
- **Razorpay Route (split-settlement, us as master merchant) is REJECTED for now** and documented only as an alternate adapter behind the same port: it would make us the KYC-bearing master merchant with escrow obligations — wrong trade for v1. Revisit only if a marketplace revenue model ever appears.
- Tenants without a Razorpay account: manual modes stand (record UPI/NEFT/cheque + attach receipt) — the port is an accelerator, not a dependency. Tranche math stays on the one money path (BOM ↔ proposal ↔ tranches ↔ project payments, to the paisa).

---

## 9. Dunning

Razorpay retries failed charges on its own backoff for the mandate; our layer is communication + the 7-day grace clock. Channels: in-app banner (owner + managers), push (Notifee), SMS via MSG91 (DLT-registered templates), WhatsApp utility template via MSG91 where the owner opted in (platform→tenant messaging is ours; D32 only constrains tenant→customer messaging).

| Day (from first failure) | Action | Template |
|---|---|---|
| 0 | → `past_due`; banner + push + SMS "payment failed, we'll retry — update method here" | `HG_PAY_FAIL` |
| 2 | SMS + push reminder; banner persists | `HG_PAY_RETRY` |
| 4 | Metered features pause (§3); SMS states exactly what paused and what still works | `HG_PAY_PAUSE` |
| 6 | Final warning: halt tomorrow; one-tap pay link | `HG_PAY_FINAL` |
| 7 | → `halted`; SMS confirms read+export+customer links still work | `HG_HALTED` |
| Post-halt | Weekly ×4, then monthly; reactivation always one payment away | `HG_REACTIVATE` |

Trial nudges reuse the pipeline: day 7 ("half way"), day 12, day 14 (expiry). All dunning copy is honest about state — no "your data will be deleted" threats, because it won't be.

---

## 10. Refunds, proration, cancellation

- **Refunds**: 7-day money-back on the **first paid cycle only** (removes conversion risk after trial); via Razorpay refund-to-source; GST credit note auto-issued against the cycle invoice. Renewal cycles: no refunds — cancellation runs to period end.
- **Upgrade** (Growth → Pro): entitlements apply **immediately** (never make a paying customer wait); prorated delta for the remaining cycle charged as a one-time Razorpay invoice; the subscription's plan swaps at the next cycle boundary (new subscription object, old cancelled at cycle end — cleaner than in-place plan mutation with mandate re-auth edge cases).
- **Downgrade**: takes effect at the next cycle; no mid-cycle refund. If current usage exceeds the lower tier's ceilings, the downgrade screen shows exactly what will be blocked before confirming (honesty rule) — existing over-ceiling designs remain readable/exportable forever.
- **Cancellation**: owner-initiated from billing screen, reason captured (product signal, not a gate); Razorpay subscription cancelled `at_cycle_end`; state → `cancelled`; data retained; reactivation always offered.
- **Trial → no conversion**: no charge ever occurred; nothing to refund; → `expired` (trial ended unconverted).
- Support-issued goodwill credits: entitlement override rows (audited, [`./08`](./08-security-and-tenancy.md) §11) — never manual DB edits.
