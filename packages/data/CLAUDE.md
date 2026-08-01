# @heliogrid/data — the frontend SDK (the ONLY data path for web and RN)

## What lives here / what must never live here
- Transport (headers, cookies, retry/logging/tracing seam) · the ONE `initClient` call ·
  repository interfaces + their online-first implementations · the session store · query
  keys · error normalisation · `createDataLayer` · the React Query adapter under `src/react/`.
- NEVER: UI, navigation, screens, business logic (that is `@heliogrid/domain`), an
  environment read (`baseUrl` is passed IN), or an import of db/ui/ui-api/tokens/i18n/apps.
- **Two entry points.** `@heliogrid/data` is framework-free and usable from a Next server
  component. `@heliogrid/data/react` is the only place React or React Query may appear.

## Commands
pnpm --filter @heliogrid/data build | typecheck     # tsc -b (composite; emits dist/)

## Depends on / depended on by
uses: @heliogrid/contracts (the wire), @heliogrid/domain (OtpFailure, OTP constants),
@ts-rest/core, zod. react + @tanstack/react-query are PEER deps, used only in `src/react/`.
used by: apps/web, apps/mobile. Nothing else may consume it.

## Local conventions
- **Repositories are interfaces with factories**, and their types are INFERRED from the
  contract, never hand-written. This is what makes the Track E PowerSync swap a data-layer
  change for both platforms at once (`docs/forward-compat.md`, `mobile` row).
- **Every hook lives in `src/react/`**, including feature hooks — `use-health.ts`, not
  `health/hooks.ts`. Colocation reads better, but the lint boundary would then need a
  filename pattern instead of a directory prefix, and docs/17 says a fuzzy mechanism rots.
- The session is a **store** (`subscribe`/`getSnapshot`), read via `useSyncExternalStore`.
  A plain object with a `status` field cannot re-render a screen.
- `createDataLayer` is the ONLY construction entry an app gets. `createApiClient`,
  `createTransport`, `createHealthRepository` and `createWalkthroughSession` are deliberately
  not exported — re-exporting the client hands apps back the raw wire.

## Landmines
- **`zod` must stay pinned to `3.25.76`.** Without the explicit pin pnpm resolves
  `@ts-rest/core`'s peer to the transitive zod 4 and the typed client silently collapses to
  `never` — every `api.*` call becomes a type error (hit 2026-07-27 on apps/mobile).
- **`credentials` belongs to the TRANSPORT, not the client**, because the platforms need
  OPPOSITE values: `include` on web (browser attaches the HttpOnly cookie cross-origin),
  `omit` on RN (the keychain jar is the only cookie path; with native handling on, iOS
  CFNetwork merges its own copy into our manual header and the server rejects the session).
  One value for both re-introduces a 401 that took a day to find.
- **`tsconfig.json` sets `lib: ["ES2023", "DOM"]` and this is load-bearing.** The shared
  `node-package` preset has no DOM, and without it `Headers` is unknown AND ts-rest's
  `FetchOptions` (derived from `globalThis.Request`) collapses to `never`, which silently
  types every fetch option as `undefined`.
- **Metro resolves the `./react` subpath export with no config change** on RN 0.86 /
  Metro 0.84 (package exports are on by default since Metro 0.82). If a future RN downgrade
  breaks it, the fix is `unstable_enablePackageExports: true` in `apps/mobile/metro.config.js`.
- **`src/session/walkthrough.ts` is a DELIBERATE STUB** (owner ruling 2026-08-01): it reaches
  no server and accepts any 6-digit code, so both login designs stay walkable while auth is
  greenfield. The rebuild DELETES it and implements `SessionStore` — it is not a starting
  point to extend.
- The three gates that fence this package (`data-lean`, `data-core-is-framework-free`,
  `apps-never-touch-the-wire`) each match the **resolved** module path for installed packages
  and the **bare specifier** for unresolvable ones. Two of them were silently inert on first
  authoring for exactly this reason. If you add a rule here, prove it fires by injecting the
  violation it names.

## Definition of done here
`pnpm turbo build typecheck lint` green · consumed by BOTH platforms (Law 7) · the surface
walked in a browser and on both simulators — a repository that only typechecks is unproven.
