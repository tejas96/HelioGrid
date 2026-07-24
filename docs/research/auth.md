# Auth for HelioGrid — phone-OTP-first, multi-tenant, India

## Recommendation (one stack)
**Better Auth (self-hosted on Fly.io Mumbai + your Postgres) with the `organization` + `phoneNumber` + `jwt` + `expo` plugins, sending OTP via MSG91 (SMS primary, WhatsApp fallback through the same vendor).** Web uses Better Auth's cookie session; the Expo app uses a bearer token persisted in `expo-secure-store` with a long (30–90 day) expiry. A short-lived Better Auth-issued JWT (JWKS) carries `tenant_id` (active org) + roles into API authz and Postgres RLS via a per-transaction GUC.

This is the only option that keeps **all PII (phone numbers) inside India** — a hard DPDP-alignment win — because Better Auth is a TS library that owns your users in *your* Mumbai Postgres, not a US SaaS. It's TS-native (fits your shared domain layer), multi-tenant from day one, and has a real Expo client.

## Why Better Auth
- **Maturity/adoption:** v1.0 late-2024; latest **v1.6.24 (22 Jul 2026)**, ~29k GitHub stars, actively released (multiple patches/week), documented production users. v1.6 added OpenTelemetry, SAML hardening, non-blocking scrypt. ([1.6 blog](https://better-auth.com/blog/1-6), [changelog](https://better-auth.com/changelog), [prod users](https://github.com/better-auth/better-auth/discussions/2581))
- **Multi-tenant + 6 stackable roles:** `organization` plugin = orgs, members, teams, phone-based invites; `createAccessControl()` defines resource/action statements and composable roles — stackable presets map cleanly. ([org best practices](https://www.claudepluginhub.com/skills/pleaseai-better-auth-plugins-better-auth/organization-best-practices), [admin/AC docs](https://better-auth.com/docs/plugins/admin))
- **Sessions for offline mobile:** server-side sessions in Postgres; the Expo client persists a virtual cookie/session map to a storage adapter (`expo-secure-store`), so sessions survive restarts and long offline windows. Pair with the `jwt` plugin to mint short-lived JWTs on reconnect for stateless API/RLS. ([Expo client](https://deepwiki.com/better-auth/better-auth/6.3-expo-(react-native)-client), [phone docs](https://better-auth.com/docs/plugins/phone-number))
- **Caveat (verify in a spike):** the `phoneNumber` plugin has an open Expo integration rough edge (`sendOtp` in Expo, [#4679](https://github.com/better-auth/better-auth/issues/4679)) and API-shape churn vs email-OTP ([#6943](https://github.com/better-auth/better-auth/issues/6943)). v1.4 added custom OTP verification, so wiring MSG91 as the sender is supported. Prototype phone-OTP-on-Expo first; fallback is calling the server OTP endpoint directly from RN.

## OTP provider — MSG91
- **Cost:** ~**₹0.15/OTP**, direct Airtel/Jio/VI/BSNL binds, **99%+ delivery <5s**, built-in **DLT/TRAI** help (principal-entity + header + template registration). ([MSG91 pricing](https://productgrowth.in/tools/engagement/msg91/), [providers 2026](https://www.smscountry.com/blog/top-otp-service-providers/))
- **WhatsApp OTP:** Meta's Jan-2026 auth-template rate ~**₹0.115/delivered**, 99%+ deliverability, **outside DLT scope** (no entity fee/header wait). MSG91 offers both channels, so one vendor covers SMS + a WhatsApp path for opt-in users / SMS-failure retries. ([WhatsApp vs SMS](https://quickauth.in/blog/whatsapp-otp-vs-sms-otp-india))
- **TRAI/DLT reality:** DLT registration is mandatory for commercial SMS; unregistered = blocked. Budget 1–2 weeks for entity + template approval.

### OTP alternatives rejected
- **Twilio Verify:** effective **~₹0.45–0.63/OTP** (3× MSG91), you self-manage DLT, India delivery only 92–95%, data leaves India. ([alt](https://www.messagecentral.com/blog/twilio-verify-alternative-india))
- **AWS SNS:** must pass DLT entity/template IDs per message, weak OTP tooling, no verify/retry orchestration — more plumbing for no cost edge.
- **Exotel:** solid Indian option but pricier and thinner OTP/WhatsApp API than MSG91.

## Auth-platform alternatives rejected
- **Clerk:** free ≤10k MAU then paid; Pro tier scales to ~**$1,025/mo** and adds $/MAU; India **SMS is opaque/Twilio-priced**; **no India data residency** (EU residency itself is enterprise-only) — a DPDP liability since it stores phone PII in the US. Consensus: don't start a new SaaS on Clerk in 2026. ([comparison](https://makerkit.dev/blog/tutorials/better-auth-vs-clerk), [Clerk pricing](https://www.promptstoproduct.com/clerk-pricing-explained))
- **WorkOS/AuthKit:** generous (free ≤**1M MAU**, then **$2,500/mo per 1M**) but it's an **enterprise-SSO/SAML/SCIM** product, not phone-OTP-first; wrong shape for Indian EPC crews, and no India residency story. ([WorkOS pricing](https://workos.com/pricing.md))
- **Supabase Auth:** great phone-OTP + native RLS, but couples you to Supabase's hosting/regions (residency + you said Postgres-generic), and its org/roles model is thinner than Better Auth's. Best only if you were already all-in on Supabase. ([RLS](https://supabase.com/docs/guides/database/postgres/row-level-security))
- **Auth.js v5:** perpetual beta, **no first-class orgs, no built-in phone OTP**, maintenance concerns — too much to build. ([v5 discussion](https://github.com/nextauthjs/next-auth/discussions/8487))
- **Custom JWT+OTP:** maximum control but you rebuild org/roles/invites/session-rotation/JWKS — Better Auth already ships this; not worth it.

## tenant_id + roles → API authz + Postgres RLS
1. On OTP verify, Better Auth creates the session; resolve the user's **active org** = `tenant_id`.
2. `jwt` plugin issues a short-lived JWT (asymmetric, served via **JWKS**) with claims `{ tenant_id, roles[] }`.
3. **API layer:** verify JWT; enforce the 6 stackable roles via Better Auth `access-control` (primary authz).
4. **Postgres RLS (defense-in-depth):** per request, `SET LOCAL app.tenant_id = <verified claim>` (or `request.jwt.claims`); policies `USING (tenant_id = current_setting('app.tenant_id')::uuid)`. **The app DB role must not have `BYPASSRLS`/superuser** or policies silently no-op. ([RLS + JWT claims](https://dev.to/josh_blair/multi-tenant-auth-with-cognito-and-postgresql-row-level-security-part-2-5d30), [PostgREST authz](https://docs.postgrest.org/en/v12/explanations/db_authz.html))

## Customer no-login links (orthogonal)
Keep entirely separate from auth: mint **stateless signed tokens** (HMAC/JWT with `project_id` + scope + short expiry), validated by a public route that never touches sessions or RLS-user context.

## Sources
[Better Auth 1.6](https://better-auth.com/blog/1-6) · [phone plugin](https://better-auth.com/docs/plugins/phone-number) · [Expo client](https://deepwiki.com/better-auth/better-auth/6.3-expo-(react-native)-client) · [#4679](https://github.com/better-auth/better-auth/issues/4679) · [comparison](https://makerkit.dev/blog/tutorials/better-auth-vs-clerk) · [MSG91](https://productgrowth.in/tools/engagement/msg91/) · [WhatsApp vs SMS OTP](https://quickauth.in/blog/whatsapp-otp-vs-sms-otp-india) · [Twilio alt](https://www.messagecentral.com/blog/twilio-verify-alternative-india) · [WorkOS pricing](https://workos.com/pricing.md) · [Clerk pricing](https://www.promptstoproduct.com/clerk-pricing-explained) · [RLS multi-tenant](https://dev.to/josh_blair/multi-tenant-auth-with-cognito-and-postgresql-row-level-security-part-2-5d30)