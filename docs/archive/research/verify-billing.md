> **HISTORICAL EVIDENCE** — its conclusions are already promoted into the authority named below. Cite that, not this file. Promoted into ADR-0013, docs/16, docs/01 and docs/04.

# VERDICT

**Use Razorpay Subscriptions (UPI AutoPay as primary mandate, card e-mandate fallback) + build entitlements & usage-ledger in-house on Postgres in your NestJS stack. Do NOT add Chargebee/Zoho as a billing layer for a next-month launch.** Razorpay covers trials, recurring debit, and invoice generation natively; a dedicated billing platform adds cost, integration time, and a second source of truth you don't need at launch. Revisit Chargebee only when you have multi-currency, complex proration, or dunning-analytics needs at scale.

## Razorpay Subscriptions — verified (July 2026)

- **Trials:** Supported natively. Plans allow a trial with delayed first charge that auto-converts to paid; set `start_at`/trial handling on the subscription. Trial-only (no perpetual free tier) is the natural fit — model a "free" tier as no subscription + in-app entitlement flag, not a Razorpay plan.
- **UPI AutoPay / e-mandate:** Single Subscriptions API manages UPI AutoPay, card e-mandates (e-NACH), and NACH. Limits: **UPI AutoPay ₹15,000/debit** standard (₹1 lakh for SIP/insurance/IPO categories); **e-NACH up to ₹10 lakh/debit**. Razorpay handles the auth transaction + mandatory **pre-debit notification 24–48h before each charge**. For typical monthly SaaS fees under ₹15k, UPI AutoPay is cheapest and highest-converting.
- **Webhooks:** **At-least-once delivery** — you WILL get duplicates and out-of-order events. Required patterns: verify HMAC signature; dedupe on `x-razorpay-event-id`; return 2xx fast (queue async processing); tolerate reordering. Failures retried with exponential backoff for 24h. Treat `subscription.charged` as the source-of-truth for granting entitlement, and reconcile via API polling as backstop.
- **GST invoicing (key nuance):** Razorpay's Invoices product + Subscriptions can auto-generate **GST-compliant invoices per billing cycle** (with your GSTIN, HSN/SAC, tax rate). BUT **your platform is the supplier of record** — you must configure tax settings and remit GST; Razorpay separately issues *its own* GST invoice for the **18% GST on its fees**. For e-invoicing (IRN/mandatory above turnover thresholds) validate against your ERP; don't assume Razorpay files IRNs for you.
- **Fees:** No setup/AMC. **UPI AutoPay ~0.5% + 18% GST**; **card recurring ≈ 2% gateway + 0.99% subscription fee + GST**. Custom rates above ~₹5 lakh/month GMV.

## Billing-platform layer vs in-house

- **Chargebee:** Starter free to **$250K cumulative billing, then 0.75%**; **Performance ≈ $7,188/yr** (up to $100K/mo billing). Powerful entitlements/usage-based billing but heavy for a single-currency India SaaS launch, and it sits *on top of* Razorpay anyway.
- **Zoho Billing:** Cheap (~$29/mo), India/GST-native, but weaker on complex/usage-based pricing; declining mindshare.
- **In-house on Postgres:** For NestJS, a `plans`/`subscriptions`/`entitlements` + append-only `usage_events` ledger (rolled up per period) is a few days' work, keeps one source of truth, and maps cleanly to Razorpay webhooks. Best launch choice.

## Sources
- [Razorpay Subscriptions/UPI AutoPay 2026 guide](https://razorpay.com/blog/master-recurring-payments-upi-autopay-guide/) · [UPI AutoPay vs card e-mandates](https://razorpay.com/blog/upi-autopay-vs-card-e-mandates/)
- [Cheapest recurring gateway — fees & limits](https://razorpay.com/blog/cheapest-payment-gateway-for-recurring-billing-e-nach-upi-autopay-and-subscription/) · [Pricing explained](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/)
- [Subscriptions webhook events](https://razorpay.com/docs/webhooks/subscriptions/) · [Webhook best practices](https://razorpay.com/docs/webhooks/best-practices/)
- [GST e-invoicing](https://razorpay.com/learn/gst-e-invoicing-system/) · [Razorpay Invoices](https://razorpay.com/invoices/)
- [Chargebee pricing](https://www.chargebee.com/pricing/) · [Chargebee vs Zoho Billing 2026](https://www.softwareadvice.com/accounting/chargebee-profile/vs/zoho-subscriptions/)