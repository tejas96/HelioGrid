# @heliogrid/web — Next.js App Router, pure frontend/BFF (NO domain logic)

Deps: `architecture.md` §2 apps/web · platform rules, the Server/Client boundary included: §3.

## Where files go

```
app/(<group>)/<route>/page.tsx  routing ONLY — reads params, renders one screen; the
                       group is the gate: (door) signed-out only · (open) anyone · (inside) signed in
                       with a company — its layout.tsx mounts the session gate once
app/                   layout · providers · not-found · globals.css
features/<capability>/ <Name>Screen.tsx composes · components/ one per component ·
                       hooks/use-<thing>.ts the platform adapter only (DOM, router, clipboard) ·
                       <screen>.css token var() only · constants.ts · types.ts ·
                       shared/ when two SCREENS here share · index.ts the barrel
lib/                   app infrastructure and what two features share that only the web has:
                       env.ts, use-image-file.ts, leave-guard.tsx
```

A feature is named for the CAPABILITY it owns. Two FEATURES sharing a part means it belongs in a
package (`architecture.md` §4); only a web-only platform piece sits in `lib/`.

## Commands

```
pnpm --filter @heliogrid/web dev | build | typecheck      # dev = localhost:3002
```

## Rules

- A `'use client'` at the route level opts every child in, so know which level you are on.
- Env is read only through `lib/env.ts`, never `@heliogrid/env/server`.
- Language comes from `@heliogrid/i18n/react`; `app/providers.tsx` builds the runtime once per
  mount (`packages/i18n/CLAUDE.md`).
- A server component or action reaches data through `createServerDataContext`
  (`@heliogrid/data/server`), called INSIDE the render.
- Paginated screens use `usePaginatedList` (accumulating) or `usePagedList` (numbered), never a
  hand-wired `useInfiniteQuery`.
- Tailwind is for layout only (`flex`, `grid`, `min-h-dvh`), never a value; `globals.css` is the
  only stylesheet under `app/`.
- Forms branch `VALIDATION_FAILED` through `applyServerErrors` first.

## Done means

The per-screen DoD in `docs/prd/foundations/F7-design-language.md` `F7-43`, verified in the
running browser — a task is done only when it has been driven, not read.

## Traps

- A feature barrel that re-exports both a Server Component and a `'use client'` screen attaches the client chunk to EVERY page reaching the barrel, and tree-shaking cannot remove it; two routes reporting the same First Load JS is the sign → give the client screen its own barrel.
- `turbo build`, `pnpm check:all` or `rm -rf */dist` while `next dev` runs makes every chunk 404: unstyled HTML and `undefined (reading 'call')`, which looks like a code bug → `/task`'s *Clean up* stops `next dev` first.
- `"sideEffects": ["**/*.css"]` in `package.json` is load-bearing: without it webpack keeps every module a barrel names, and it holds only while every side-effect import here is CSS → keep it, and recheck it when a non-CSS side-effect import lands.
- `lib/env.ts` must write each `process.env.NEXT_PUBLIC_*` out literally: Next substitutes text, so `process.env[key]` or a spread reads `undefined` in the browser and falls back to the schema default with nothing failing → literal reads only.
- The stylesheet import order in `app/layout.tsx` is load-bearing → `@heliogrid/theme/tokens.css`, then `base.css`, then `@heliogrid/ui/styles.css`, then `globals.css`; keep it.
- `next dev` transpiles only `@heliogrid/ui` and `@heliogrid/theme` from source (`next.config`'s `transpilePackages`); every other workspace package — `data`, `domain`, `i18n`, `contracts` — is read from its `dist/`, so a hook change does nothing on the running page and QA reads the old behaviour as a failed fix → `pnpm --filter <package> build` after the change, then reload.
