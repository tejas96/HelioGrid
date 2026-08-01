# ADR-0023 — packages/data: the frontend SDK

**Date:** 2026-08-01

## Context

The frontend data layer was authored twice. `apps/web/lib/api-client.ts` and
`apps/mobile/src/data/api-client.ts` each called `initClient`. `apps/web/lib/auth-client.ts`
and `apps/mobile/src/auth/client.ts` each built a Better Auth client, the RN one wrapping a
hand-rolled keychain cookie jar. Only mobile had repository interfaces; web had none. Error
handling existed on web (`envelopeMessage`) and nowhere on RN. React Query defaults were
declared per app and had already diverged.

Every one of those is a Law 4 duplicate waiting to drift, and the `mobile` row of
`docs/forward-compat.md` — *"ALL data access behind repository interfaces — the Track E swap
is a data-layer change only"* — was satisfied on one platform out of two.

At the time of writing there were **five** call sites across both apps. After the CRM module
there would be fifty. The cost of this change only ever goes up.

## Decision

Create `packages/data` as the ONLY data path for `apps/web` and `apps/mobile`.

**Two entry points, and the split is the whole design:**

- `@heliogrid/data` — repositories, transport, the ts-rest client, errors, the session
  store, `createDataLayer`. Framework-free: no React, no React Query. Usable from a Next
  server component, a route handler or a script.
- `@heliogrid/data/react` — the React Query adapter, `<DataProvider>` and the hooks.
  Replacing the query library touches this directory and nothing else.

**It may import:** `@heliogrid/contracts`, `@heliogrid/domain`, `@ts-rest/core`, `zod`.
React and `@tanstack/react-query` are peer dependencies, used only under `src/react/`.

**It may never import:** `packages/db`, `packages/ui`, `packages/ui-api`, `packages/tokens`,
`packages/i18n`, `packages/adapters`, or any app.

**Layering:**

```
Screen → useSession() / use<Thing>()   ← @heliogrid/data/react
              ↓
        Repository (interface + factory)
              ↓
        ts-rest client   ← the ONE initClient call in the repository
              ↓
        Transport        ← headers · cookies · retry · logging · tracing
              ↓
        apps/api
```

**Consequences of the shape:**

- `initClient` is called exactly once, in `src/client/client.ts`. `@ts-rest/react-query` is
  dropped from the repo entirely — the core client plus a hand-written adapter is what makes
  the adapter replaceable.
- Repositories are interfaces with factories, so Track E swaps a PowerSync-backed
  implementation behind the same interface for BOTH platforms at once.
- `TokenStorage` is a port, and it is **optional and RN-only**. Web's session is an HttpOnly
  first-party cookie that JavaScript cannot read by design; implementing the port there
  would mean either a no-op or moving to a JS-readable token, which is strictly worse
  security. RN supplies `keychainStorage`; web supplies nothing.
- `credentials` is set in the TRANSPORT, not on the client, because the two platforms need
  opposite values: `include` on web so the browser attaches its cookie cross-origin, `omit`
  on RN because the keychain jar is the only cookie path and iOS CFNetwork otherwise merges
  its own copy into the manual header and the server 401s. Setting one value for both
  re-introduces a defect that took a day to find in 2026-07.
- Every React hook lives under `src/react/`, including feature hooks. Colocating
  `health/hooks.ts` beside `health/repository.ts` reads better, but then the lint boundary
  needs a filename pattern instead of a directory prefix, and docs/17 is explicit that a
  fuzzy mechanism rots.
- The session is a **store** (`subscribe` / `getSnapshot`), read through
  `useSyncExternalStore`. A plain object with a `status` field could never re-render a screen.
- Web now has TWO consumption paths — the framework-free entry server-side, hooks
  client-side. That is inherent to RSC, not a flaw in the split.

**Enforced by** (`.dependency-cruiser.cjs`, all `error`): `data-lean`,
`data-core-is-framework-free`, `apps-never-touch-the-wire`, plus `package-index-only`
extended to this package. Each was verified to FIRE by injecting the violation it names —
two of them were silently inert on first authoring, matching nothing.

## Alternatives rejected

- **Keep per-app clients, share nothing.** The status quo. Five call sites was the cheapest
  moment this would ever cost; fifty would not be.
- **One entry point exporting hooks.** Couples every consumer to React Query and makes the
  library unswappable — the exact risk raised when this architecture was proposed.
- **Export the ts-rest client from the barrel.** Hands apps back the raw wire that
  `apps-never-touch-the-wire` exists to keep away from them. `createDataLayer` is the only
  construction entry an app gets.
- **`TokenStorage` on both platforms**, for symmetry. Rejected: see above, it is a security
  regression dressed as consistency.
