# @heliogrid/web — Next.js App Router, pure frontend/BFF (NO domain logic)

Deps: `architecture.md` §2 apps/web · platform rules: §3.

## What lives here / what must never live here

- NEVER: a `@heliogrid/db` import.

## Where files go

```
app/(<group>)/<route>/page.tsx  routing ONLY — reads params, renders one screen; the
                       group is the gate: (door) signed-out only · (open) anyone · (inside) signed in
                       with a company — its layout.tsx mounts the session gate once
app/                   layout · providers · loading · error · not-found · route (BFF glue)
features/<capability>/ <Name>Screen.tsx composes · components/ one per component ·
                       hooks/use-<thing>.ts the platform adapter only (DOM, router, clipboard) ·
                       <screen>.css token var() only · constants.ts · types.ts ·
                       shared/ when two SCREENS here share · index.ts the barrel
lib/                   app infrastructure (env.ts)
```

A feature is named for the CAPABILITY it owns, matching the API module that serves it, so one
name spans both sides. `app/` imports a feature ONLY through its barrel or a screen barrel one
level down — nothing deeper. Two FEATURES sharing something means it is not feature-local: it
belongs in a package (`architecture.md` §4).

## Commands

```
pnpm --filter @heliogrid/web dev | build | typecheck      # dev = localhost:3002
```

## Rules

- A screen's `useState` holds only a visual fact; its flow is a `@heliogrid/domain` reducer
  driven by a `@heliogrid/data` hook.
- **The Server/Client boundary is `architecture.md` §3**, not restated here. What it means at edit
  time: a `'use client'` at the route level opts every child in, so know which level you are on.
- Web reads env only through `lib/env.ts`. Never import `@heliogrid/env/server` into apps/web —
  no check refuses it.
- Language comes from `@heliogrid/i18n/react`; `app/providers.tsx` builds the runtime once per
  mount (`packages/i18n/CLAUDE.md`). Keep catalog loader specifiers literal, or catalog splitting
  stops.
- **Client vs server render.** A client component reaches data through `@heliogrid/data/react`
  hooks under `<DataProvider>`. A server component or action uses `createServerDataContext` from
  `@heliogrid/data/server`, called INSIDE the render.
- Paginated screens use `usePaginatedList` (accumulating) or `usePagedList` (numbered), never a
  hand-wired `useInfiniteQuery`.
- Tailwind is for layout only (`flex`, `grid`, `min-h-dvh`), never a value (ADR-0026);
  `globals.css` is the only stylesheet under `app/`.
- **An enum-driven picker or label map is `Record<TheEnum, …>` and iterates the CANONICAL list** —
  `schema.options` for a contract enum, the exported tuple for a domain one. What matters is that
  the list is not authored in the screen.
- Forms branch `VALIDATION_FAILED` through `applyServerErrors` first; any other API failure takes
  its words from `@heliogrid/i18n`, never a hand-written string. The first screen that renders one
  builds `ApiErrorText` in `packages/ui` (deferred D68).

## Done means

The per-screen DoD in `docs/prd/foundations/F7-design-language.md` `F7-43`, verified in the
running browser — a task is done only when it has been driven, not read.

## Traps

- A feature barrel that re-exports both a Server Component and a `'use client'` screen attaches the client chunk to EVERY page reaching the barrel, and tree-shaking cannot remove it; two routes reporting the same First Load JS is the sign → give the client screen its own barrel.
- `turbo build`, `pnpm check:all` or `rm -rf */dist` while `next dev` runs makes every chunk 404: unstyled HTML and `undefined (reading 'call')`, which looks like a code bug → stop the web server (the `clean-dev-ports` launch configuration), `rm -rf apps/web/.next`, restart.
- `"sideEffects": ["**/*.css"]` in `package.json` is load-bearing: without it webpack keeps every module a barrel names, and it holds only while every side-effect import here is CSS → keep it, and recheck it when a non-CSS side-effect import lands.
- `lib/env.ts` must write each `process.env.NEXT_PUBLIC_*` out literally: Next substitutes text, so `process.env[key]` or a spread reads `undefined` in the browser and falls back to the schema default with nothing failing → literal reads only.
- The stylesheet import order in `app/layout.tsx` is load-bearing → `@heliogrid/theme/tokens.css`, then `base.css`, then `@heliogrid/ui/styles.css`, then `globals.css`; keep it.
