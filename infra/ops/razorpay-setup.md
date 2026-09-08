# Razorpay — account setup & test-mode integration prep

**State (2026-07-26):** no account exists. **Account creation is the owner's step** (an
agent must not create accounts or handle passwords). Everything below is staged so the
integration proceeds the same day the account exists. Architecture is NOT blocked: the
billing module builds against test keys + the webhook contract, and the entitlement
machinery is in-house (docs/16, ADR-0013).

## 1. Owner: create the account (≈15 min)

1. https://dashboard.razorpay.com/signup — sign up with the business email.
2. Complete the basic business profile (name: your registered entity; category: SaaS /
   Software). **Test Mode is available immediately** — full KYC only gates LIVE keys.
3. Start KYC early (it's the long pole, days–2 weeks): GSTIN, PAN, bank account proof,
   business registration docs. The 20-day plan's fallback stands: launch trial-only and
   charge on live-key arrival if KYC overruns.

## 2. Then I configure (test mode, via the visible browser)

- Generate **test API key pair** → `.env.local` (`RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`).
- **Webhooks**: endpoint `https://api.<domain>/webhooks/razorpay` (dev: tunnel), secret →
  `RAZORPAY_WEBHOOK_SECRET`. Events: `subscription.activated`, `subscription.charged`,
  `subscription.halted`, `subscription.cancelled`, `subscription.paused`,
  `subscription.resumed`, `payment.failed`, `invoice.paid`, `refund.processed`.
  (Transport dedupe on `x-razorpay-event-id` is already in the schema —
  `webhook_events`, authored by the billing module's migration.)
- **Plan objects** (Subscriptions → Plans), monthly + yearly per the price anchors in `docs/prd/04-business-model.md`:
  Starter ₹1,999/mo · ₹19,990/yr — Growth ₹3,999/mo · ₹39,990/yr — Pro ₹9,999/mo ·
  ₹99,999/yr (Enterprise = custom, no plan object). Plan ids → `plans.razorpay_plan_id`.
- **Subscriptions settings**: UPI AutoPay primary + card e-mandate fallback; trial
  support ON (14-day, docs/16); pre-debit notifications = Razorpay-managed.
- **Invoices**: GST settings with our GSTIN/SAC once KYC provides them (supplier of
  record = us; IRN e-invoicing validation is ours).
- **Security**: dashboard 2FA, restricted team access, webhook secret rotation note.

## 3. What stays pending after test-mode config

Live keys (KYC) · settlement account verification · production webhook URL (needs the
deployed api) · GST invoice fields (GSTIN from KYC). None of these block Track A/B code.

## 4. Tenant-side collections (unchanged, for clarity)

Platform billing (above) is OUR Razorpay account. Tenant customer-collections are
**BYO-Razorpay per tenant** (`PaymentLinkPort`, `tenant_integration_credentials` —
encrypted at rest with a per-tenant DEK envelope, see `docs/engineering/08-security-and-tenancy.md`); tenants connect their own keys in Settings. Nothing to
prepare on our account for that.
