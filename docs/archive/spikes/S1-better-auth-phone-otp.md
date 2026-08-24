# Spike S1 — Better Auth phone-OTP (self-hosted PG + framework-agnostic client)

**Date:** 2026-07-25 · **Verdict: WORKS WITH CAVEATS — full flow green end-to-end
(hands-on, local PG16); caveats are naming/pattern traps, not breakage. On-device
keychain leg lands with the first Track A device build.**

## Proven hands-on (better-auth@1.6.25, Node 22, PG 16)

- Server: `betterAuth({ database: pg Pool, plugins: [phoneNumber({ sendOTP,
  signUpOnVerification })] })`, migrations via programmatic `getMigrations()` →
  `runMigrations()` (no CLI), served with `toNodeHandler(auth)`.
- Client (`createAuthClient` from `better-auth/client` + `phoneNumberClient()`):
  1. `client.phoneNumber.sendOtp({ phoneNumber })` → code delivered (spike: file sink)
  2. `client.phoneNumber.verify({ phoneNumber, code })` → creates user + session, sets
     cookie; re-verify signs in the SAME user (no dupes, DB-verified)
  3. `client.getSession()` → full session with the cookie replayed from our adapter.

## The traps (feed Track A implementation directly)

1. **`signIn.phoneNumber` is password login, NOT OTP** — the OTP flow is
   `sendOtp` → `verify` (verify itself creates the session). Do not wire signIn.
2. **`signUpOnVerification` is mandatory** for OTP-first onboarding — without it an
   unknown number verifies into nothing.
3. **Cookie glue is ours**: the vanilla client has NO `storage` option — persistence is
   `fetchOptions` glue (`onResponse` absorbs `headers.getSetCookie()` — never
   `.get('set-cookie')`, it joins lossily; `onRequest` sets the `cookie` header) over a
   keychain-backed `{getItem,setItem}` jar under one key.
4. **Colon keys**: core never generates them in this path — the Expo plugin's key
   normalisation is the source of issue #5426. Our own key naming controls this fully.
5. **iOS secure-store size hazard** (better-auth #9151): chunk at ~1800 chars if session
   data is ever cached in keychain (cookie jar itself was 113 bytes).
6. Error shape: bad code → 400 `{ code: "INVALID_OTP" }`; `allowedAttempts` 3,
   `expiresIn` 300 s, `otpLength` 6 — all configurable.

## Not proven here (first device build must smoke-test)

react-native-keychain on-device behaviour (colon keys, size limits, keystore quirks) ·
RN fetch cookie auto-management vs our manual header · MSG91 delivery (DLT clock).

## Recommendation

Proceed, pin better-auth@1.6.25. Mobile auth = vanilla client + phoneNumberClient + the
spike's cookie-jar glue verbatim over `apps/mobile/src/auth/keychain-storage.ts`.
Spike code retained in the session scratchpad (spike-s1/) for Track A to copy.
