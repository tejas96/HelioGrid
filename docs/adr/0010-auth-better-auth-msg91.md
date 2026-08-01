# ADR-0010: Auth — Better Auth self-hosted + MSG91 phone OTP

Date: 2026-07-24

## Context

Indian EPC field crews authenticate by phone OTP, not email/SSO. Phone numbers are personal data; keeping them in India is the cleanest DPDP posture and a procurement trust signal. We need multi-tenant organisations, six stackable preset roles, long offline mobile sessions, and JWT claims that drive both NestJS guards and the Postgres RLS backstop (ADR-0005).

## Decision

**Better Auth, self-hosted on our `bom` Postgres, with the `organization` + `phoneNumber` + `jwt` plugins.** OTP delivery via **MSG91** (~₹0.15/SMS, direct carrier binds, DLT handled; WhatsApp-OTP fallback through the same vendor). **DLT registration lead time (1–2 weeks) is a Launch-1 critical-path item.**

- Web: cookie sessions. **Bare RN: the framework-agnostic Better Auth client with a custom storage adapter over `react-native-keychain`** — verified pattern; keychain tolerates Better Auth's colon-separated storage keys (which `expo-secure-store` rejects), making the custom adapter cleaner than the Expo plugin. Week-1 spike confirms phone-OTP end-to-end on bare RN.
- The `jwt` plugin issues short-lived asymmetric JWTs (JWKS) with claims `{tenant_id, roles[]}` → NestJS guards are primary authz (6 stackable preset roles, OR-across-roles, widest visibility wins) → `SET LOCAL app.tenant_id` feeds RLS.
- **Customer no-login links are orthogonal**: stateless HMAC-signed tokens (scope + expiry) validated on public routes; they never touch sessions or user context.

## Consequences

- All auth PII lives in our Mumbai Postgres — no US SaaS holds Indian phone numbers; no per-MAU bill, ever.
- We operate the auth service: session storage, JWKS rotation and upgrade cadence are ours (Better Auth ships multiple patches/week — pin and review).
- The pure bare-RN path is not Better Auth's documented happy path (docs assume the Expo plugin); the custom keychain adapter is our maintenance to own, hence the spike.
- MSG91 is a single point of OTP failure; the WhatsApp-OTP channel through the same vendor is the in-place fallback (outside DLT scope, ~₹0.115/delivered).

## Alternatives rejected

- **Clerk** — phone PII stored in the US (EU residency is enterprise-only), opaque Twilio-priced India SMS, cost scales to ~$1,025/mo+ — a DPDP liability and a bill.
- **WorkOS/AuthKit** — enterprise SSO/SAML/SCIM shape, not phone-OTP-first; no India residency story.
- **Supabase Auth** — decent phone OTP + RLS, but couples auth to Supabase hosting/regions; thinner org/roles model.
- **Auth.js v5** — perpetual beta, no first-class orgs, no built-in phone OTP.
- **Custom JWT+OTP** — rebuilds orgs/roles/invites/session rotation/JWKS that Better Auth ships.
- **Twilio Verify / AWS SNS for OTP** — 3x MSG91 cost, self-managed DLT, weaker India delivery.

## Sources

- `../research/auth.md` · `../research/verify-bareRn.md`
- https://better-auth.com/blog/1-6 · https://better-auth.com/docs/plugins/phone-number
- https://github.com/better-auth/better-auth/issues/6810 · https://github.com/better-auth/better-auth/issues/4679
- https://productgrowth.in/tools/engagement/msg91/ · https://quickauth.in/blog/whatsapp-otp-vs-sms-otp-india
- https://makerkit.dev/blog/tutorials/better-auth-vs-clerk · https://workos.com/pricing.md
