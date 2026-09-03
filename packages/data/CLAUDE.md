# @heliogrid/data — the frontend SDK, the ONLY data path for web and RN

Traps: `docs/engineering/landmines.md` · deps: `architecture.md` §2 data.

## What lives here / what must never live here

- The transport and its three modes · the ONE `initClient` call · the repository registry
  (`src/composition.ts`) · repository interfaces and their online-first implementations · the
  session store · query keys · error normalisation · `createDataLayer` · the React Query adapter
  under `src/react/`.
- NEVER: UI, navigation, screens, business logic (that is `@heliogrid/domain`), an environment
  read (`baseUrl` is passed IN), or an import of db, ui, theme, i18n or any app.
- **Three entry points, and no more.** `@heliogrid/data` is framework-free · `./react` is the
  React Query adapter · `./server` is ONE request-scoped context for a Next server render. React
  and React Query may appear only under `src/react/` and `src/server/`.

## Commands

```
pnpm --filter @heliogrid/data build | typecheck     # tsc -b (composite; emits dist/)
```

## Local conventions

- **Repositories are interfaces with factories, and their types are INFERRED from the contract,**
  never hand-written. That is what makes a data-source swap one change for both platforms.
- **Every hook lives in `src/react/`**, feature hooks included — `use-health.ts`, not
  `health/hooks.ts`. Colocation reads better, but the lint boundary would then need a filename
  pattern instead of a directory prefix, and a fuzzy mechanism rots.
- The session is a **store** (`subscribe`/`getSnapshot`), read via `useSyncExternalStore`. A plain
  object with a `status` field cannot re-render a screen.
- `createDataLayer` and `createServerDataContext` are the ONLY construction entries an app gets,
  both through `src/composition.ts`. `createApiClient` and `createTransport` are deliberately not
  exported — re-exporting the client hands apps back the raw wire. **A new repository is one
  edit**: add it to `createRepositoryRegistry` and every host gets it.
- **Every failure leaves this package as a `DataError`.** A repository normalises in its own
  `catch`; raw `ZodError`s and ts-rest classes never reach a screen.
- **Retry is `DataError.retryable`, not a count**, set where the failure is classified:
  network, timeout and 5xx yes (max 2, reads only); cancellation and a declared 4xx no. Mutations
  never retry. Never re-add a bare `retry: N`.
- **Read methods take an `AbortSignal` and forward it.** A repository that ignores it makes
  cancellation a lie all the way up.
- `server` mode forwards an ALLOWLIST (`cookie`, `authorization`, `REQUEST_ID_HEADER` from
  `@heliogrid/contracts` — never the literal), never a spread: the browser's `host` and
  `content-length` corrupt our request, and everything else risks carrying one caller's identity
  into another's. Never a tenant header.
- Paginated screens use `usePaginatedList` (accumulating) or `usePagedList` (numbered pager),
  never a hand-wired `useInfiniteQuery`.
- **`session/walkthrough.ts` is a deliberate stub** — it reaches no server and accepts any 6-digit
  code, and `data-layer.ts` wires it unconditionally (`M15`). The auth rebuild DELETES it and the
  app injects a real implementation instead. Do not extend it.

## Done means

Build, typecheck and lint green · consumed by BOTH platforms (Law 7) · transport, error and retry
behaviour proven by driving the real client against a controllable origin — malformed body,
unknown status, non-envelope, timeout, cancellation, refused connection — never by reading it.
