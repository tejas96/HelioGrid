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

- Generate **test API key pair** → `.env.local` (`BILLING_GATEWAY_KEY_ID` / `BILLING_GATEWAY_KEY_SECRET`;
  the names are the capability's, never the vendor's — T-M12-007).
- **Webhooks**: endpoint `https://api.<domain>/billing/gateway-events`, added once the api is
  deployed on its own domain — Razorpay refuses tunnel hosts (`loca.lt` was refused), so local QA
  runs without a webhook and the 6-hour reconcile finds its charges. Secret →
  `BILLING_GATEWAY_WEBHOOK_SECRET`. Events the api acts on: `subscription.charged`,
  `payment_link.paid`, `subscription.pending` (a failed charge), `subscription.paused`,
  `subscription.resumed` (alerted, never applied — M12-13). Every other event is acknowledged and
  logged. Transport dedupe on `x-razorpay-event-id` is `billing_gateway_event` (migration 0036).
- **Plan objects**: NOT made by hand. `pnpm --filter @heliogrid/api pack:publish` creates one per
  sold tier × cycle at the tax-included amount and mirrors each in `plan_price` (M12-12); run it
  once the keys are in `.env.local`.
- **Subscriptions settings**: UPI AutoPay primary + card e-mandate fallback; no gateway trial —
  the 14-day trial is the product's own and the mandate is made at conversion (M12-11, M12-14);
  pre-debit notifications = Razorpay-managed.
- **First test-mode check**: cancel a monthly subscription nobody has authorised yet (status
  `created`, `cancel_at_cycle_end: 0`). The api counts on Razorpay accepting it; if Razorpay
  refuses, a new plan pick answers 502 until the trial ends (`apps/api/src/modules/billing/checkout.service.ts`, `closeUnpaid`).
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
