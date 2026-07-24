# Deferred Integrations: WhatsApp + Payments + PDF + Push (India, July 2026)

## Single recommendation

Design **four narrow ports in the shared TS domain now, ship only the PDF and (optionally) Push adapters in v1, and make WhatsApp + customer-payments strictly BYO-tenant-credential so the platform never becomes a regulated intermediary.** Concretely: each solar-EPC tenant connects **their own WABA** (via Embedded Signup) and **their own Razorpay account** (payment links). The platform is a *Tech Provider* for messaging and a *pure link generator* for collections — it never holds funds and never owns the sender identity. Your own SaaS fees ride a separate `SubscriptionBillingPort` (Razorpay Subscriptions in INR). PDF proposals render via **headless Chromium (Playwright) on a Fly Mumbai worker** — the only option that shapes Devanagari correctly. Push uses **Expo Push** (thin wrapper over FCM/APNs).

## Ports to define now

```ts
// 1. Customer messaging (WhatsApp). v1 impl = ManualCopyAdapter (renders text, rep pastes)
interface MessagingPort {
  renderTemplate(tenantId, templateKey, vars): RenderedMessage;      // always available
  send?(tenantId, to: E164, msg: RenderedMessage): Promise<SendResult>; // optional; BSP adapter later
}
// 2. Customer collections (project tranches). v1 impl = ManualAdapter (returns null)
interface PaymentLinkPort {
  createLink(tenantId, {amount, purpose, customerRef, expiry}): Promise<{url, providerRef}>;
  getStatus(tenantId, providerRef): Promise<PaymentStatus>;
  handleWebhook(tenantId, payload, sig): PaymentEvent;   // idempotent, per-tenant secret
}
// 3. Our SaaS billing (platform → EPC). Razorpay Subscriptions / Stripe
interface SubscriptionBillingPort { createSub; cancel; handleWebhook; }
// 4. Documents & push
interface DocumentRenderPort { renderProposalPdf(proposal): Promise<Buffer>; }
interface PushPort { register(token); send(userId, {title,body,data}); }
```

Key design rule: **`PaymentLinkPort` is tenant-scoped and stores per-tenant provider credentials** (or OAuth grant). Money flows customer → EPC's own merchant account; the platform only generates the link and reads webhooks. This keeps you outside RBI Payment Aggregator (PA) rules entirely.

## WhatsApp — evidence

Meta moved to **per-delivered-message pricing (1 Jul 2025)**, retiring conversation-based billing. India rates (2026): **marketing ≈ ₹0.88, utility ≈ ₹0.13, authentication ≈ ₹0.13** per message; marketing rose ~10% on 1 Jan 2026. **Utility/service messages inside an open 24-hour customer-service window are free** — proposal-status and payment-reminder flows that follow a customer's inbound message cost nothing. ([Meta pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing), [2Factor](https://2factor.in/v3/lp/whatsapp-business-api-pricing.php), [Uptail](https://www.uptail.ai/blog/whatsapp-business-api-pricing-2026-what-it-costs-and-how-billing-works))

**Own-WABA vs platform-owned:** Since **April 2026, Embedded Signup is Meta's default onboarding** and you must register as a Tech Provider. Under it the **WABA, phone number, and Business Portfolio stay owned by the EPC tenant** — you get delegated access, revocable from Meta Business Suite, and assets survive a provider switch. For a multi-tenant EPC SaaS this is the right model: each EPC's own verified number preserves brand trust, template approval, opt-in accountability, and deliverability reputation isolation. A single platform-owned number would pool spam risk across tenants and muddy opt-in consent. ([Meta Embedded Signup](https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/overview), [Twilio Tech Provider](https://www.twilio.com/docs/whatsapp/isv/tech-provider-program/integration-guide))

**BSP shortlist behind the port:** for India-first SMB EPCs, **AiSensy** (from ~₹999–$45/mo, no per-conversation markup on Pro) or **Interakt** (Jio-Haptik, cheapest Indian SMB, Shopify-grade onboarding). For clean pass-through at scale, **360dialog** (~$49 base + flat $0.005/msg, no markup). **Twilio/Gupshup** = per-message markup, pick only if you want one vendor for SMS+WhatsApp. Because you hold `MessagingPort`, the BSP is swappable; the tenant's WABA is not locked to it. ([BSP comparison](https://getkanal.com/blog/whatsapp-business-api-providers-compared), [Codingclave India](https://codingclave.com/guides/whatsapp-api-pricing-india-2026-comparison))

**WhatsApp Pay:** live to all India users since NPCI lifted onboarding caps, and Meta is investing heavily (Kunal Shah/$900M push, PayU recharge partnership), **but UPI share is ~0.65% — negligible.** Do *not* design around in-chat WhatsApp Pay; treat payments as ordinary UPI/card links. ([TechCrunch](https://techcrunch.com/2026/04/23/whatsapp-adds-prepaid-phone-recharges-in-india-as-its-payments-usage-still-lags/), [TechTimes](https://www.techtimes.com/articles/319025/20260624/whatsapp-india-payments-meta-bets-900m-kunal-shah-fix-065-upi-share.htm))

## Payments — evidence

**Razorpay now holds all three RBI authorisations: PA-Online (Dec 2023), PA-Cross-Border (Dec 2025), PA-Physical (Jan 2026)** — fully de-risked regulatorily. Cashfree and PayU are also licensed PAs. ([Razorpay PA-P](https://razorpay.com/newsroom/razorpay-pos-receives-rbi-approval-for-offline-payment-aggregator-licence/), [PayU final approval](https://www.caalley.com/news-updates/indian-news/payu-gets-final-rbi-approval-to-operate-as-online-payment-aggregator))

**Avoiding a PA licence for the platform** is the central architecture call. Two clean patterns:
- **(Recommended) Pure link generator / BYO-gateway:** each EPC connects its own Razorpay; funds settle directly to the EPC; you never touch money → no PA obligation, no escrow. Simplest, and correct for "customer pays EPC."
- **Marketplace/route:** if you ever *must* aggregate, use **Razorpay Route / Cashfree Easy Split** linked-accounts split-settlement so a *licensed* PA moves the money on your behalf — but this makes you the master merchant with KYC/onboarding burden. Design the port so this is an alternate adapter, not the default. ([Razorpay Route](https://razorpay.com/route/))

**Our SaaS subscriptions:** use **Razorpay Subscriptions** — India-domestic recurring in INR, UPI-AutoPay/e-mandate native. **Stripe still isn't a general domestic India acquirer in 2026** (invite/limited); it only wins if you bill overseas EPCs in USD. Razorpay is a gateway, not merchant-of-record, so you own GST/seller obligations. Keep SaaS billing on a *separate* port from customer collections. ([triggerAll](https://triggerall.com/blog/razorpay-vs-stripe-india/), [Dodo review](https://dodopayments.com/blogs/razorpay-review))

## PDF — Devanagari is the decider

**react-pdf is disqualified:** its fontkit path does not fully shape Devanagari — long-standing broken conjuncts/matras (issues [#454](https://github.com/diegomura/react-pdf/issues/454), [#856](https://github.com/diegomura/react-pdf/issues/856)). **Playwright headless Chromium** uses the browser's HarfBuzz engine — correct Devanagari shaping, HTML/CSS layout you already know; bundle **Noto Sans Devanagari** in the Fly image (`fonts-noto`), budget 300–500 MB RAM per instance, pool processes. **Typst** (Rust, uses rustybuzz — a HarfBuzz port kept current) is a strong lighter-weight alternative with genuine Indic shaping and far lower memory, but a new templating language for agents to author. **Recommend Playwright now**, keep `DocumentRenderPort` clean so Typst is a swap if Chromium RAM cost bites. ([State of Text Rendering](https://behdad.org/text2024/), [Playwright PDF](https://www.browserstack.com/guide/playwright-pdf-html-generation))

## Push

**Expo Push** — free, one token/payload across iOS+Android, auto-manages APNs/FCM credentials; ideal for a fresh Expo/RN app. It *wraps* FCM, so `PushPort` can drop to **FCM-direct** later if you need delivery receipts, data-only messages, or fine-grained analytics. Start Expo. ([Courier compare](https://www.courier.com/integrations/compare/expo-vs-firebase-fcm), [SuprSend](https://www.suprsend.com/post/expo-push-notifications))