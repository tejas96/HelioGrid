# @heliogrid/web — Next.js App Router, pure frontend/BFF (NO domain logic)

Deps: `architecture.md` §2 apps/web. Platform rules: `architecture.md` §3 · what both apps share:
`CLAUDE.md` §6 · UI law: `.claude/rules/ui-adherence.md`.

## What lives here / what must never live here

- `app/` holds routes, the layout and the providers; `features/<capability>/` holds the work.
  A route handler is cookie/session BFF glue ONLY.
- NEVER: authored business logic (import it — Law 11), a `packages/db` import, a raw hex or px
  value, a hand-rolled HTTP client.

## Where files go — a closed set; never invent a folder

```
app/(<group>)/<route>/page.tsx  routing ONLY — reads params, renders one screen, ≤50 lines; the
                       group is the gate: (door) signed-out only · (open) anyone · (inside) signed in
                       with a company — its layout.tsx mounts the session gate once
app/                   layout · providers · loading · error · not-found · route (BFF glue)
features/<capability>/ <Name>Screen.tsx composes · components/ one per component ·
                       hooks/use-<thing>.ts the platform adapter only (DOM, router, clipboard) ·
                       <screen>.css token var() only · constants.ts · types.ts ·
                       shared/ when two SCREENS here share · index.ts the barrel
lib/                   app infrastructure (env.ts)
```

Same shape as mobile, different location. A part BOTH platforms draw leaves this tree —
`.claude/rules/screen-parts.md`, loaded with this folder. A feature is named for the CAPABILITY it owns,
matching the API module that serves it, so one name spans both sides. `app/` imports a feature ONLY
through its barrel or a screen barrel one level down — nothing deeper. Two FEATURES sharing
something means it is not feature-local: it belongs in a package (`architecture.md` §4).

## Commands

```
pnpm --filter @heliogrid/web dev | build | typecheck      # dev = localhost:3002
```

## Rules

- **`app/` ROUTES, `features/` OWNS.** `page.tsx` renders one screen and holds no work. A screen
  owns no flow: its reducer is `@heliogrid/domain`'s and its hook `@heliogrid/data`'s, both
  imported (Law 11); a `useState` here holds a purely visual fact.
- **The Server/Client boundary is `architecture.md` §3**, not restated here. What it means at edit
  time: a `'use client'` at the route level opts every child in, so know which level you are on.
- **DOM-only APIs (`window`, `document`, `navigator`, `localStorage`) appear only in a Client
  Component or an effect** — module scope runs on the server during SSR and will crash the render.
- **Server-only work stays server-only.** Route handlers, server actions and secrets never become
  imports of shared UI: `@heliogrid/env/server` is unimportable from a client file.
- **Language comes from `@heliogrid/i18n/react`.** `app/providers.tsx` builds the runtime in a
  `useState` initialiser (one per mount: `packages/i18n/CLAUDE.md`) and syncs `<html lang>` and
  `dir` on each switch. Keep the loader specifiers literal or catalog splitting stops.
- **Client vs server render.** A client component reaches data through `@heliogrid/data/react`
  hooks under `<DataProvider>`. A server component or action uses `createServerDataContext` from
  `@heliogrid/data/server`, called INSIDE the render.
- **Styling layers:** components own pixels (`@heliogrid/ui` index only); screens own layout via
  a colocated `<screen>.css` with token `var()`; Tailwind is layout only (`flex`, `grid`,
  `min-h-dvh`), never a value (ADR-0026). `globals.css` is the only stylesheet under `app/`.
- **An enum-driven picker or label map is `Record<TheEnum, …>` and iterates the CANONICAL list** —
  `schema.options` for a contract enum, the exported tuple for a domain one. What matters is that
  the list is not authored in the screen.
- API failures render a shared error component, never a hand-written string; forms branch
  `VALIDATION_FAILED` through `applyServerErrors` first. `ApiErrorText` is owed to `packages/ui`
  so both platforms share one.

## Done means

The per-screen DoD in `docs/prd/foundations/F7-design-language.md` `F7-43`, verified in the
running browser — a task is done only when it has been driven, not read.

## Traps

- A feature barrel that re-exports both a Server Component and a `'use client'` screen attaches the client chunk to EVERY page reaching the barrel, and tree-shaking cannot remove it; two routes reporting the same First Load JS is the sign → give the client screen its own barrel.
- `turbo build`, `pnpm check:all` or `rm -rf */dist` while `next dev` runs makes every chunk 404: unstyled HTML and `undefined (reading 'call')`, which looks like a code bug → kill port 3002, `rm -rf apps/web/.next`, restart.
- `"sideEffects": ["**/*.css"]` in `package.json` is load-bearing: without it webpack keeps every module a barrel names, and it holds only while every side-effect import here is CSS → keep it, and recheck it when a non-CSS side-effect import lands.
- `lib/env.ts` must write each `process.env.NEXT_PUBLIC_*` out literally: Next substitutes text, so `process.env[key]` or a spread reads `undefined` in the browser and falls back to the schema default with nothing failing → literal reads only.
- The stylesheet import order in `app/layout.tsx` is load-bearing → `@heliogrid/theme/tokens.css`, then `base.css`, then `@heliogrid/ui/styles.css`, then `globals.css`; keep it.
