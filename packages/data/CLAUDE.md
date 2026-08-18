# @heliogrid/data — the frontend SDK (the ONLY data path for web and RN)

## What lives here / what must never live here
- Transport (headers, cookies, retry/logging/tracing seam) · the ONE `initClient` call ·
  repository interfaces + their online-first implementations · the session store · query
  keys · error normalisation · `createDataLayer` · the React Query adapter under `src/react/`.
- NEVER: UI, navigation, screens, business logic (that is `@heliogrid/domain`), an
  environment read (`baseUrl` is passed IN), or an import of db/ui/theme/i18n/apps.
- **Two entry points.** `@heliogrid/data` is framework-free and usable from a Next server
  component. `@heliogrid/data/react` is the only place React or React Query may appear.

## Commands
pnpm --filter @heliogrid/data build | typecheck     # tsc -b (composite; emits dist/)

## Dependency policy
docs/architecture.md §2 data. react + @tanstack/react-query are PEER deps, confined to
`src/react/` by `data-core-is-framework-free` — a directory prefix, not a filename pattern.

## Local conventions
- **Repositories are interfaces with factories**, and their types are INFERRED from the
  contract, never hand-written. This is what makes the Track E PowerSync swap a data-layer
  change for both platforms at once (`docs/forward-compat.md`, `mobile` row).
- **Every hook lives in `src/react/`**, including feature hooks — `use-health.ts`, not
  `health/hooks.ts`. Colocation reads better, but the lint boundary would then need a
  filename pattern instead of a directory prefix, and a fuzzy mechanism rots.
- The session is a **store** (`subscribe`/`getSnapshot`), read via `useSyncExternalStore`.
  A plain object with a `status` field cannot re-render a screen.
- `createDataLayer` is the ONLY construction entry an app gets. `createApiClient`,
  the internals listed in `src/index.ts`'s header are deliberately not exported — that
  header is the one authoring of the list; re-exporting the client hands apps back the raw wire.
- Paginated screens use `usePaginatedList` (accumulating: infinite scroll / load-more,
  dedupes by id) or `usePagedList` (numbered pager, keepPreviousData) from `./react` —
  never hand-wire `useInfiniteQuery` or pagination `useQuery` in an app.

## Landmines
- **`zod` pinned to `3.25.76`.** Without it pnpm resolves ts-rest's peer to zod 4 and the
  typed client silently collapses to `never` (hit 2026-07-27).
- **`credentials` lives in the TRANSPORT, not the client** — platforms need opposite values:
  `include` on web, `omit` on RN or iOS CFNetwork merges its own cookie and the server 401s.
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
