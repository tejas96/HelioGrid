# ADR-0013: Billing — Razorpay Subscriptions + in-house entitlements/usage on Postgres; trial-only; BYO-Razorpay for tenant collections

Date: 2026-07-24

## Context

Billing is IN v1 by product-owner override of D38 (recorded 2026-07-24). Two money flows must never be confused: (a) **platform SaaS billing** — tenants pay us monthly in INR; (b) **tenant customer collections** — homeowners pay the EPC against project tranches. Launch is next month; a second billing source of truth is unaffordable. Pricing is trial-only, no free tier (earlier user decision stands), benchmarked below ARKA 360 / Reslink.

## Decision

**Platform billing: Razorpay Subscriptions.** UPI AutoPay primary (₹15,000/debit cap comfortably fits tier prices; ~0.5% + GST fees), card e-mandate fallback (~2% + 0.99% + GST). Razorpay's native trial support implements **trial-only, no free tier** (14-day trial full-feature, single 7-day support extension); pre-debit notifications are Razorpay's job.

**Webhooks are at-least-once** — required handling: HMAC signature verify, dedupe on `x-razorpay-event-id`, fast-2xx + queue via BullMQ, `subscription.charged` is the entitlement-granting event, API-polling reconciliation as backstop.

**Entitlements + usage in-house on Postgres**: `plans`, `subscriptions`, `subscription_events`, `entitlements`, append-only `usage_events` (voice minutes, AI detections, OTP, storage) with period rollups — a few days' work in NestJS, one source of truth. Enforcement is **soft-block UX**, and the product law stands: **read + export always work regardless of billing state**.

**GST**: we are supplier of record — Razorpay Invoices generates GST-compliant invoices per cycle (our GSTIN/SAC); e-invoicing IRN validation is ours; Razorpay's 18% GST on its fees is tracked separately.

**Tenant customer collections: BYO-Razorpay payment links per tenant** through `PaymentLinkPort` — each EPC connects its own Razorpay account; funds settle directly to the EPC; **the platform never touches funds, so no RBI Payment Aggregator licence is needed.** Razorpay Route is documented as an alternate adapter only, never the default.

## Consequences

- One vendor, one INR rail, native trials — the fastest compliant path to next-month launch.
- In-house entitlements means we own metering correctness; the money-math locked invariants must cover grant/expiry/rollup.
- Razorpay is a gateway, not merchant-of-record: GST remittance and IRN obligations are ours.
- BYO-Razorpay pushes onboarding friction to tenants (each needs a Razorpay account) — accepted as the price of staying unregulated.
- Multi-currency/global billing is not covered; global expansion revisits this ADR (Chargebee or Stripe-abroad at that point).

## Alternatives rejected

- **Chargebee** — powerful entitlements but ≈$7,188/yr (Performance), sits on top of Razorpay anyway, and adds a second source of truth for a single-currency launch.
- **Zoho Billing** — cheap and GST-native but weak on usage-based pricing; declining mindshare.
- **Stripe** — still not a general domestic India acquirer in 2026 (invite/limited); only wins for USD billing abroad.
- **Free tier instead of trial** — rejected by standing user decision; a perpetual free tier also breaks the capacity-tiered unit economics in 01-business-model.
- **Platform-aggregated collections (Route/Easy Split as default)** — makes us master merchant with KYC burden and drags us toward PA territory; kept strictly as an alternate adapter.

## Sources

- `../research/verify-billing.md` · `../research/integrations.md` · `../research/market.md` (competitor price anchors)
- https://razorpay.com/blog/master-recurring-payments-upi-autopay-guide/ · https://razorpay.com/docs/webhooks/subscriptions/ · https://razorpay.com/docs/webhooks/best-practices/
- https://razorpay.com/blog/cheapest-payment-gateway-for-recurring-billing-e-nach-upi-autopay-and-subscription/ · https://razorpay.com/invoices/ · https://razorpay.com/route/
- https://www.chargebee.com/pricing/
- BLUEPRINT.md — Final-review directive 4 (billing in v1; D38 superseded, owner override 2026-07-24)
