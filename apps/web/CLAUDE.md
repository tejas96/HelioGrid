# @heliogrid/web — Next.js App Router, pure frontend/BFF (NO domain logic)

Traps: `docs/engineering/landmines.md` · deps and platform rules: `architecture.md` §2 apps/web,
§3 · what both apps share: `.claude/rules/cross-platform.md` · UI law:
`.claude/rules/ui-adherence.md`.

## What lives here / what must never live here

- `app/` holds routes, the layout and the providers; `features/<capability>/` holds the work.
  A route handler is cookie/session BFF glue ONLY.
- NEVER: authored business logic (import it — Law 11), a `packages/db` import, a raw hex or px
  value, a hand-rolled HTTP client.

## Where files go — a closed set; never invent a folder

```
app/<route>/page.tsx   routing ONLY — reads params, renders one screen, ≤50 lines
app/                   layout · providers · loading · error · not-found · route (BFF glue)
features/<capability>/ <Name>Screen.tsx composes · components/ one per component ·
                       hooks/use-<thing>.ts the controller, which belongs to the SCREEN ·
                       <screen>.css token var() only · constants.ts · types.ts ·
                       shared/ when two SCREENS here share · index.ts the barrel
lib/                   app infrastructure (env.ts)
```

Same shape as mobile, different location. A feature is named for the CAPABILITY it owns, matching
the API module that serves it, so one name spans both sides. `app/` imports a feature ONLY
through its barrel or a screen barrel one level down — nothing deeper. Two FEATURES sharing
something means it is not feature-local: it belongs in a package (`architecture.md` §4).

## Commands

```
pnpm --filter @heliogrid/web dev | build | typecheck      # dev = localhost:3002
```

## Rules

- **`app/` ROUTES, `features/` OWNS.** `page.tsx` renders one screen and holds no work; the
  controller hook belongs to the SCREEN.
- **The Server/Client boundary is `architecture.md` §3**, not restated here. What it means at edit
  time: a `'use client'` at the route level opts every child in, so know which level you are on.
- **DOM-only APIs (`window`, `document`, `navigator`, `localStorage`) never appear in a shared
  package** (Law 10), and inside this app only in a Client Component or an effect — module scope
  runs on the server during SSR and will crash the render.
- **Server-only work stays server-only.** Route handlers, server actions and secrets never become
  imports of shared UI: `@heliogrid/env/server` is unimportable from a client file.
- **Language comes from `@heliogrid/i18n/react`**, never `@lingui/react`, which this app does not
  declare. `app/providers.tsx` builds ONE runtime per mount (a `useState` initialiser, never
  module scope — Next shares module scope across every server request) and syncs `<html lang>`
  and `dir` on each switch. Keep the loader specifiers literal or catalog splitting stops.
- **Client vs server render.** A client component reaches data through `@heliogrid/data/react`
  hooks under `<DataProvider>`. A server component or action uses `createServerDataContext` from
  `@heliogrid/data/server`, called INSIDE the render. No route uses it yet.
- **Styling layers:** components own pixels (`@heliogrid/ui` index only); screens own layout via
  a colocated `<screen>.css` with token `var()`; Tailwind is layout only (`flex`, `grid`,
  `min-h-dvh`), never a value (ADR-0026). No inline `style`. `globals.css` is the only stylesheet
  under `app/`.
- **An enum-driven picker or label map is `Record<TheEnum, …>` and iterates the CANONICAL list** —
  `schema.options` for a contract enum, the exported tuple for a domain one. What matters is that
  the list is not authored in the screen.
- API failures render a shared error component, never a hand-written string; forms branch
  `VALIDATION_FAILED` through `applyServerErrors` first. `ApiErrorText` is owed to `packages/ui`
  so both platforms share one.

## Done means

The per-screen DoD in `docs/prd/foundations/F7-design-language.md` `F7-43`, verified in the
running browser — a task is done only when it has been driven, not read.
