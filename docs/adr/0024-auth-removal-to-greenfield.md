# ADR-0024 — Auth removed to greenfield

**Date:** 2026-08-01

ADR-0010 (Better Auth + MSG91) is **deleted**, not marked superseded — this index's rule is
"replaced architecture → delete the old file and its row". This record exists because the
teardown itself has consequences a future reader needs, not to preserve the old decision.

## Context

Auth was to be rebuilt on a new architecture. The owner ruled that the existing
implementation be removed **completely first** — backend, contract, database and client —
rather than refactored in place, with re-integration happening in a separate change against
the session interface `packages/data` now defines.

Two constraints came with the ruling: both platforms' **designs** survive untouched, and the
**login policy** in `@heliogrid/domain` survives.

## Decision

Remove auth end to end.

**Deleted:** `apps/api/src/modules/auth/` (10 files) · the global `SessionGuard` and the
`@Public()` / `@CurrentClaims()` decorators · `common/tokens.ts` (`SESSION_RESOLVER`) ·
`src/scripts/auth-migrate.ts` · `packages/contracts/src/auth.ts` and `src/ports/session.ts` ·
`sessionClaimsSchema` and `tenantClaimSchema` · both frontend auth clients and the RN cookie
jar · `BETTER_AUTH_*` and `MSG91_*` from the env schema and `.env.example` · **migrations
`0001`–`0006` and the entire Drizzle schema**.

**Kept:** every screen and stylesheet on both platforms · `@heliogrid/domain`'s login policy,
which also absorbed the four OTP protocol constants and `TENANT_SEGMENTS` · the tenancy
precondition in `apps/api`, which inspects role PRIVILEGES rather than tables and so is
valid against an empty database — it must stay armed before the rebuild, not after.

### The owner ruling that broke a law, stated plainly

Deleting `0001`–`0006` **overrode the append-only migration rule in CLAUDE.md §6**, which is
otherwise enforced by a sha256 lock in the runner and a CI diff check. This was an explicit
owner decision on 2026-08-01, not an oversight, and **it is not precedent**. It was taken
because the auth tables could not be removed surgically: `files`, `audit_log`,
`usage_events`, `tenant_phone_numbers` and `sync_mutations` all carry `tenant_id` foreign
keys to `tenants`, and `files.uploaded_by` references `users`. The identity spine had to go
whole or not at all.

### What this costs, stated plainly

- **Tenancy is UNPROVEN.** All four invariants now have nothing to compare and say so out
  loud rather than passing silently: the runner prints `INVARIANTS VACUOUS: 0 application
  tables`, and each invariant reports what it did and did not verify. `tenancy-rls` still
  checks that `app_user` exists without BYPASSRLS and that the connecting role can
  `SET ROLE` — the platform the rebuild binds to — and states that cross-tenant isolation is
  not proven.
- **The login flows run on a stub.** `createWalkthroughSession()` in
  `packages/data/src/session/walkthrough.ts` accepts any correctly shaped phone number and
  any 6-digit code, reaches no server, and exists so both designs stay walkable in QA. It
  is authored ONCE so neither app invents its own, and it is **deleted — not adapted —** by
  the rebuild.
- **`oasdiff` reports 9 breaking API removals.** Correct: the auth paths are gone. The
  enforced half of `check:openapi` (freshness) passes.
- **Every API route is unauthenticated**, because there is no session to check. Restoring
  deny-by-default is part of the rebuild, not something a later module should improvise.
  `HealthController` carried a load-bearing `@Public()` and now needs it back when the guard
  returns, or Fly's probes will 401.

## What the rebuild must do

1. Implement `SessionStore` from `packages/data/src/session/types.ts` — `getSnapshot` /
   `subscribe` / `requestOtp` / `verifyOtp` / `signOut`. Nothing in a screen changes.
2. Delete `walkthrough.ts`.
3. Author migration `0001` for the identity/tenancy spine, reading the `auth/tenancy` row of
   `docs/forward-compat.md` FIRST — stackable roles, JWT claims as PowerSync stream params,
   long-lived refresh for offline, E.164, deactivate-never-delete.
4. Restore the guard as `APP_GUARD`, its `SessionResolver` port in contracts, and `@Public()`
   on `HealthController`.
5. Re-add the enum-parity rows for `tenant_status`, `user_status` and `invite_status`, and
   restore `schema-parity`'s `dbSchema` import.
6. Re-declare its env variables in `packages/env/src/schema/api.ts` and `.env.example`.

## Alternatives rejected

- **Relocate the client only, keep the server.** Smallest change and the one recommended at
  planning time; the owner chose the fuller teardown.
- **Keep the database, drop only Better Auth's own tables.** Impossible surgically — see the
  foreign keys above.
- **Fail-closed seam instead of a walkthrough stub.** Nothing faked, but the OTP, done,
  onboarding and home screens all become unreachable, so the designs being preserved could
  not be verified at all.
