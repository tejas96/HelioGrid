# Razorpay — account setup & test-mode integration prep

**State:** the account exists in test mode, its test keys are in `.env.local`, and the
test-mode checks below pass on the real gateway. Live keys wait on KYC. **Account steps are the
owner's** (an agent must not create accounts or handle passwords). Architecture is NOT blocked: the
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
  sold tier × cycle at the amount the gateway collects — the list price, plus GST once the platform
  is registered (`F1-29`) — and mirrors each in `plan_price` (M12-12); run it
  once the keys are in `.env.local`. A row whose plan this account does not hold (made by the
  development gateway, or on test keys before live ones) gets a new plan object in place.
- **Subscriptions settings**: UPI AutoPay primary + card e-mandate fallback; no gateway trial —
  the 14-day trial is the product's own and the mandate is made at conversion (M12-11, M12-14);
  pre-debit notifications = Razorpay-managed.
- **First test-mode check** (passes): Razorpay cancels a monthly subscription nobody has
  authorised yet (status `created`, `cancel_at_cycle_end: 0`), so a new plan pick closes the old
  page (`apps/api/src/modules/billing/checkout.service.ts`, `closeUnpaid`). A test card paid on
  the hosted page is found by the reconcile and turns the company `active`.
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
