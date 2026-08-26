# @heliogrid/data — the frontend SDK (the ONLY data path for web and RN)

## What lives here / what must never live here
- Transport (mode, headers, cookies, timeout/cancellation, retry/logging/tracing seam) ·
  the ONE `initClient` call · the repository registry (`src/composition.ts`) · repository
  interfaces + their online-first implementations · the session store · query
  keys · error normalisation · `createDataLayer` · the React Query adapter under `src/react/`.
- NEVER: UI, navigation, screens, business logic (that is `@heliogrid/domain`), an
  environment read (`baseUrl` is passed IN), or an import of db/ui/theme/i18n/apps.
- **Three entry points**, and `package-index-only` names exactly these three.
  `@heliogrid/data` is framework-free. `@heliogrid/data/react` is the React Query adapter.
  `@heliogrid/data/server` is ONE request-scoped context for a Next server render.
  React and React Query may appear only under `src/react/` and `src/server/`.

## Commands
pnpm --filter @heliogrid/data build | typecheck     # tsc -b (composite; emits dist/)

## Dependency policy
docs/engineering/architecture.md §2 data. react + @tanstack/react-query are PEER deps, confined to
`src/react/` and `src/server/` by `data-core-is-framework-free` — a directory prefix, not a
filename pattern.

## Local conventions
- **Repositories are interfaces with factories**, and their types are INFERRED from the
  contract, never hand-written. This is what makes a data-source swap a data-layer
  change for both platforms at once (`docs/engineering/forward-compat.md`, `mobile` row).
- **Every hook lives in `src/react/`**, including feature hooks — `use-health.ts`, not
  `health/hooks.ts`. Colocation reads better, but the lint boundary would then need a
  filename pattern instead of a directory prefix, and a fuzzy mechanism rots. `src/server/`
  shares the carve-out because a render scope owns a QueryClient — it holds no hooks.
- The session is a **store** (`subscribe`/`getSnapshot`), read via `useSyncExternalStore`.
  A plain object with a `status` field cannot re-render a screen.
- `createDataLayer` (browser/mobile) and `createServerDataContext` (one Next render) are the
  ONLY construction entries an app gets, and both go through `src/composition.ts`.
  `createApiClient`, `createTransport` and the internals listed in `src/index.ts`'s header
  are deliberately not exported — that header is the one authoring of the list; re-exporting
  the client hands apps back the raw wire. **A new repository is one edit**: add it to
  `createRepositoryRegistry`, and every host gets it.
- **Every failure leaves this package as a `DataError`** — `ApiError`/`UnauthorizedError`,
  `NetworkError`, `RequestTimeoutError`, `RequestCancelledError`, `InvalidResponseError`.
  A repository normalises in its own `catch` (`normalizeClientError`); raw ZodErrors and
  ts-rest classes never reach a screen.
- **Retry is `DataError.retryable`, not a count.** It is set where the failure is
  classified: network/timeout/5xx yes (max 2, reads only), cancellation and declared 4xx no.
  Mutations never retry. Never re-add a bare `retry: N` — see ADR-0023.
- **Read methods take an `AbortSignal` and forward it**; hooks pass React Query's signal.
  A repository that ignores it makes cancellation a lie all the way up.
- Paginated screens use `usePaginatedList` (accumulating: infinite scroll / load-more,
  dedupes by id) or `usePagedList` (numbered pager, keepPreviousData) from `./react` —
  never hand-wire `useInfiniteQuery` or pagination `useQuery` in an app.

## Landmines
- **`zod` pinned to `3.25.76`.** Without it pnpm resolves ts-rest's peer to zod 4 and the
  typed client silently collapses to `never` (hit 2026-07-27).
- **`credentials` lives in the TRANSPORT, not the client** — platforms need opposite values:
  `include` on web, `omit` on RN or iOS CFNetwork merges its own cookie and the server 401s.
- **ts-rest runs client response validation INSIDE the fetcher**, not after it. A contract
  mismatch therefore surfaces in the transport's own `catch` as a raw `ZodError`, where it
  looks exactly like a failed request — classify it as a network error and a bad response
  becomes retryable. The transport rethrows `ZodError` untouched for that reason.
- **`server` mode forwards an allowlist** (`cookie`, `authorization`, `x-request-id`) and
  never a spread: the browser's `host`/`content-length` corrupt our request, and everything
  else risks carrying one caller's identity into another's. Never a tenant header.
- **`createServerDataContext` must not be hoisted to a module constant.** Both fields are
  request-bound; a process-global serves the next visitor another visitor's session and cache.
- **`lib: ["ES2023", "DOM"]` in tsconfig is load-bearing.** Without DOM, `Headers` is unknown
  and ts-rest's `FetchOptions` collapses to `never`, typing every fetch option `undefined`.
- **Metro resolves `./react` with no config change** on RN 0.86 / Metro 0.84. If a downgrade
  breaks it: `unstable_enablePackageExports: true` in metro.config.js.
- **`session/walkthrough.ts` is a deliberate stub** (owner ruling 2026-08-01) — no server,
  accepts any 6-digit code. The rebuild DELETES it; do not extend it.
- The three gates fencing this package match the resolved path AND the bare specifier. Two
  were inert on first authoring. Add a rule here → prove it fires by injecting the violation.

## Definition of done here
`pnpm turbo build typecheck lint` green · consumed by BOTH platforms (Law 7) · the surface
walked in a browser and on both simulators — a repository that only typechecks is unproven.
Transport/error/retry behaviour is proven by driving the real client against a controllable
origin (malformed body, unknown status, non-envelope, timeout, cancellation, refused
connection), never by reading the code.
