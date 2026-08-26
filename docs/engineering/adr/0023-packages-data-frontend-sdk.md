# ADR-0023 — packages/data: the frontend SDK

**Date:** 2026-08-01 · **Updated:** 2026-08-25 (third entry point, transport modes, runtime
validation, named retry policy)

## Context

The frontend data layer was authored twice. `apps/web/lib/api-client.ts` and
`apps/mobile/src/data/api-client.ts` each called `initClient`. Each app also built its own session client, the RN one wrapping a
hand-rolled keychain cookie jar. Only mobile had repository interfaces; web had none. Error
handling existed on web (`envelopeMessage`) and nowhere on RN. React Query defaults were
declared per app and had already diverged.

Every one of those is a Law 4 duplicate waiting to drift, and the `mobile` row of
`docs/engineering/forward-compat.md` — *"ALL data access behind repository interfaces — the Track E swap
is a data-layer change only"* — was satisfied on one platform out of two.

At the time of writing there were **five** call sites across both apps. After the CRM module
there would be fifty. The cost of this change only ever goes up.

## Decision

Create `packages/data` as the ONLY data path for `apps/web` and `apps/mobile`.

**Three entry points, and the split is the whole design:**

- `@heliogrid/data` — repositories, transport, the ts-rest client, errors, the session
  store, `createDataLayer`. Framework-free: no React, no React Query. Usable from a route
  handler or a script.
- `@heliogrid/data/react` — the React Query adapter, `<DataProvider>` and the hooks.
  Replacing the query library touches this directory and nothing else.
- `@heliogrid/data/server` — added 2026-08-25. `createServerDataContext({ baseUrl, headers })`
  returns one render-scoped `{ queryClient, repositories }` for a Next server component or
  server action. It exists because the framework-free entry alone cannot express the thing
  that actually matters here: a server render's repositories are bound to ONE caller's
  identity. A module-level `createDataLayer` on the server would serve the next visitor the
  previous visitor's forwarded cookie and cached data, and nothing in the type system says
  so. Naming the scope makes the request-boundedness the only way to construct it.

**It may import:** `@heliogrid/contracts`, `@heliogrid/domain`, `@ts-rest/core`, `zod`.
React and `@tanstack/react-query` are peer dependencies, used only under `src/react/` and
`src/server/`.

**It may never import:** `packages/db`, `packages/ui`, `packages/theme`, `packages/i18n`, or
any app.

**Layering:**

```
Screen → useSession() / use<Thing>()   ← @heliogrid/data/react
              ↓
        Repository (interface + factory)
              ↓
        Registry         ← src/composition.ts: the one wiring of mode → transport → client
              ↓
        ts-rest client   ← the ONE initClient call · validates · rejects unknown statuses
              ↓
        Transport        ← mode (browser · mobile · server) · timeout · cancellation ·
                           header allowlist · error normalisation
              ↓
        apps/api
```

A Next server render enters the same stack one level higher:

```
Server component → createServerDataContext({ baseUrl, headers })   ← @heliogrid/data/server
              ↓            (request-scoped QueryClient + repositories)
        Registry → client → Transport(mode: 'server')
```

**Consequences of the shape:**

- `initClient` is called exactly once, in `src/client/client.ts`, with `validateResponse`
  and `throwOnUnknownStatus` both on. A typed client that ACCEPTS whatever the wire sends is
  a type system lying to every screen downstream: a proxy's 502 HTML page or a field the
  server quietly changed type on would flow into a component as `Liveness`. Rejecting is
  the only behaviour a "typed" client can honestly have.
- `src/composition.ts` is the one internal registry that turns a mode into a transport, a
  client and a set of repositories. Both public construction doors (`createDataLayer`,
  `createServerDataContext`) go through it, so adding a repository is one edit rather than
  one per host, and neither app is ever handed a raw client or transport factory.
- Repositories are interfaces with factories, so a different data source swaps in behind the
  same interface for BOTH platforms at once.
- `TokenStorage` is a port, and it is **optional and RN-only**. Web's session is an HttpOnly
  first-party cookie that JavaScript cannot read by design; implementing the port there
  would mean either a no-op or moving to a JS-readable token, which is strictly worse
  security. RN supplies `keychainStorage`; web supplies nothing.
- `credentials` is set in the TRANSPORT, not on the client, because the platforms need
  opposite values: `include` on web so the browser attaches its cookie cross-origin, `omit`
  on RN because the keychain jar is the only cookie path and iOS CFNetwork otherwise merges
  its own copy into the manual header and the server 401s. Setting one value for both
  re-introduces a defect that took a day to find in 2026-07. The transport therefore takes a
  discriminated `mode` (`browser` · `mobile` · `server`) rather than an optional storage
  argument — one place decides credentials, cookies and header forwarding together.
- A server render forwards an ALLOWLIST — `cookie`, `authorization`, `x-request-id` — and
  nothing else. A spread of the incoming headers sends the browser's `host` and
  `content-length` (which corrupt our request) and is one header away from carrying a
  caller's identity into a request it never made. No tenant header: tenancy is resolved
  from the session, never sent (`packages/contracts/CLAUDE.md`).
- Every failure crosses the package boundary as a `DataError` — `ApiError` /
  `UnauthorizedError` (the server described it), `NetworkError`, `RequestTimeoutError`,
  `RequestCancelledError`, `InvalidResponseError`. Raw Zod issues and ts-rest internals stop
  here: a screen must never be asked to pattern-match a provider's error shape, and a Zod
  dump can carry submitted values.
- **Retry is a named policy, not a count.** `retry: 1` retried everything — a 403 re-sent to
  be refused again, a validation failure re-submitted, a cancelled request re-issued.
  `DataError.retryable` is decided at construction by the layer that knows which kind of
  failure it is: network, timeout and 5xx retry (at most twice, reads only); cancellation
  and every declared 4xx do not. Mutations never retry, because this layer cannot know
  whether the first attempt reached the server.
- Every React hook lives under `src/react/`, including feature hooks. Colocating
  `health/hooks.ts` beside `health/repository.ts` reads better, but then the lint boundary
  needs a filename pattern instead of a directory prefix, and a
  fuzzy mechanism rots.
- The session is a **store** (`subscribe` / `getSnapshot`), read through
  `useSyncExternalStore`. A plain object with a `status` field could never re-render a screen.
- Web now has TWO consumption paths — `./server` during a render, hooks client-side. That
  is inherent to RSC, not a flaw in the split. `./server` deliberately ships no prefetch
  helper and no `HydrationBoundary`: the current page is static, and hydration that binds
  server-fetched data to an identity has to land WITH that identity (M01), not before it.

**Enforced by** (`.dependency-cruiser.cjs`, all `error`): `data-lean`,
`data-core-is-framework-free` (React Query confined to `src/react/` and `src/server/`),
`apps-never-touch-the-wire`, plus `package-index-only` extended to this package. Each was
verified to FIRE by injecting the violation it names — two of them were silently inert on
first authoring, matching nothing. Re-probed 2026-08-25 with the `./server` entry: raw
ts-rest in an app and React Query in the data core both go red, `src/server/` stays green,
and a resolvable deep path into `src/` goes red. The BARE-specifier deep import
(`@heliogrid/data/src/...`) is held by the COMPILER instead — every package here declares
`exports`, so it cannot resolve and fails typecheck with TS2307 before dep-cruiser is
reached. A gate is not evidence for a case the compiler already refuses.

## Alternatives rejected

- **Keep per-app clients, share nothing.** The status quo. Five call sites was the cheapest
  moment this would ever cost; fifty would not be.
- **One entry point exporting hooks.** Couples every consumer to React Query and makes the
  library unswappable — the exact risk raised when this architecture was proposed.
- **Export the ts-rest client from the barrel.** Hands apps back the raw wire that
  `apps-never-touch-the-wire` exists to keep away from them. `createDataLayer` and
  `createServerDataContext` are the only construction entries an app gets.
- **Reuse `createDataLayer` on the Next server** by passing headers into it. Rejected: it
  returns a session store and is shaped to be built once per app, so the request-scoped
  case would look identical to the process-global one at the call site. The mistake this
  guards against is invisible in review and only shows up as one user seeing another's
  data.
- **Retry counts instead of a policy** (`retry: 2` on reads). Rejected: the count cannot
  tell a timeout from a 403, so it re-sends work the server has already definitively
  refused, and re-issues requests the user cancelled by navigating away.
- **`TokenStorage` on both platforms**, for symmetry. Rejected: see above, it is a security
  regression dressed as consistency.
