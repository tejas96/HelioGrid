# @heliogrid/web — Next.js App Router, pure frontend/BFF (NO domain logic)

## What lives here / what must never live here
- Route handlers ONLY for cookie/session BFF glue. `app/` holds a redirect stub, a home
  screen route, the layout and the data/i18n providers. `features/app/home/` holds the first
  screen composition — `HomeScreen.tsx` composes `@heliogrid/ui` `EmptyState`; more features
  land per module slice.
- NEVER: authored business logic (import it — Law 11), direct packages/db imports, raw
  hex/px values.

## Commands
pnpm --filter @heliogrid/web dev      # localhost:3002 (tokens must be built first: turbo
                                       # handles it; kills a stale listener on that port first)
pnpm --filter @heliogrid/web build | typecheck

## Dependency policy
docs/engineering/architecture.md §2 apps/web; platform rules §3 (Next.js). `@heliogrid/data` is THE
data path — transport, repositories, session; this app authors none. Shared login types,
policy constants and formatters are imported from `@heliogrid/domain`, never re-authored
(Law 11).

**Language.** `<Trans>`, `useI18n()` and `useTranslate()` come from `@heliogrid/i18n/react` —
never `@lingui/react`, which this app no longer declares. `app/providers.tsx` builds ONE
runtime per mount (a `useState` initialiser, never module scope: Next shares module scope
across every server request) and syncs `<html lang>`/`dir` on each switch. Inactive catalogs
are separate chunks fetched on switch — keep the loader specifiers literal or that stops.

**Client vs server render.** A client component reaches data through `@heliogrid/data/react`
hooks under `<DataProvider>`. A server component or server action uses
`createServerDataContext({ baseUrl, headers })` from `@heliogrid/data/server` — call it
INSIDE the render and let it fall out of scope. Never hoist it to a module constant: its
repositories close over that one caller's forwarded cookie and its QueryClient holds that
one caller's data, so a process-global serves the next visitor the previous visitor's
session. No route uses it yet; it lands with the first server-rendered product screen.

## Local conventions
- **`app/` ROUTES, `features/` OWNS.** `page.tsx` reads route params and renders one screen
  — routing only, ≤50 lines (Biome); the controller hook belongs to the SCREEN. Everything
  else lives in `features/<feature>/`, imported ONLY through `features/<feature>/index.ts`
  or a screen barrel one level down. Nothing deeper.
- A feature is named for the CAPABILITY it owns, matching the API module that serves it
  (`apps/api/src/modules/<module>/`) so one name spans both sides. One barrel per feature
  until a screen is a different rendering kind — then give that screen its own (see the
  bundle landmine).
- **Same structure as mobile, different location and names.** `features/<capability>/` is
  RN's `src/screens/<name>/`; only the path and a few filenames differ, never the shape.
- **Inside a feature, structure follows need:** `<Screen>.tsx` composes · `components/` one
  file per sub-component (a folder from the first one) · `hooks/use-<screen>.ts` for the
  controller · `constants.ts` for literals · `types.ts` when two files share a type ·
  `<feature>/shared/` when two SCREENS share. Two FEATURES sharing means it is not
  feature-local: `packages/ui`, `packages/domain` or `lib/`.
- `globals.css` is the only stylesheet under `app/`. Next reserved files
  (layout/providers/loading/error/not-found/route) stay in `app/`; `route.ts` is cookie/session
  BFF glue ONLY. `lib/` holds `env.ts` — NO
  `*-client.ts`: those were deleted by ADR-0023 (see the fetch landmine below).
- **Styling layers:** components own pixels (`@heliogrid/ui` index only); screens own layout
  via a colocated `<screen>.css` in the feature folder with token `var()`; Tailwind = layout
  only (`flex`, `grid`, `min-h-dvh`). No inline `style`.
- Where UI, data, forms, shared copy and shared types come from:
  `.claude/rules/cross-platform.md` (both apps) — not restated here.
- API failures render a shared error component, never a hand-written string; forms branch
  VALIDATION_FAILED through `applyServerErrors` first. **`lib/ApiErrorText.tsx` was deleted
  with the v1 UI (2026-08-19) — rebuild it in `packages/ui` so both platforms share one.**

## Landmines
- **A feature barrel must not mix a Server Component and a `'use client'` screen** (2026-07-31).
  Next attaches the client screen's chunk to EVERY page that reaches the barrel, used or not,
  and tree-shaking cannot remove it: `/design` shipped the entire component gallery at 147 kB
  against a 102 kB baseline. Give the client screen its own barrel
  (`features/<feature>/<screen>/index.ts`). Symptom to recognise: two routes reporting the
  IDENTICAL First Load JS — that is one bundle serving both, not a coincidence.
  (Measured on `/design`, the v1 component gallery, since deleted.)
- **Never run `turbo build`, `pnpm verify` or `rm -rf */dist` while `next dev` is live**
  (2026-08-02). Both share `apps/web/.next`: every chunk 404s → unstyled raw HTML plus
  webpack `undefined (reading 'call')`. Looks like a code bug, isn't. Fix: kill 3002,
  `rm -rf apps/web/.next`, restart. The dev console keeps the errors after recovery —
  confirm with `curl -s localhost:3002/login | grep -c 'rel="stylesheet"'`.
- **`"sideEffects": ["**/*.css"]` in `package.json` is load-bearing** (2026-07-31). Each screen
  does `import './x.css'`, which is a side effect, so without the declaration webpack keeps
  every module a barrel names — all three auth routes shipped an identical 183 kB. True today
  because every side-effect import under `apps/web` is CSS; recheck if you add a non-CSS one.
- **Never hand-roll `fetch` for product APIs.** `lib/auth-client.ts` once exported an untyped
  `api<T>()`; the onboarding screen used it with a hand-declared response type, so contract
  drift was invisible to typecheck. Both `lib/*-client.ts` files are gone (2026-08-01):
  `@heliogrid/data` is the ONLY path, its repositories throw a typed `ApiError` on non-2xx,
  and `apps-never-touch-the-wire` makes importing `@ts-rest/*` here a build failure.
- **Enum-driven pickers/labels are `Record<TheEnum, …>` and iterate the CANONICAL list** —
  `schema.options` for a contract enum, the exported tuple for a domain one (onboarding
  iterates `TENANT_SEGMENTS`). Onboarding's `SEGMENTS` was once a LOCAL `as const` array,
  merely subset-assignable, so a new segment value compiled green while being unselectable
  in the UI. What matters is that the list is not authored in the screen.
- **`lib/env.ts` must write `process.env.NEXT_PUBLIC_*` out LITERALLY.** Next inlines those
  at build time by textual substitution; `process.env[key]` or a spread is not substituted
  and reads `undefined` in the browser, silently falling back to the schema default — a
  production URL would be ignored with nothing failing. The schema and validation live in
  `@heliogrid/env/web`; only the literal read lives here.
- Import order in layout.tsx: tokens.css → base.css → globals.css (base before Tailwind).
- Geist woff2 urls resolve relative to tokens.css — Next bundles automatically.

## Definition of done here
`docs/prd/foundations/F7-design-language.md` `F7-43` (per-screen DoD) + CLAUDE.md §Commands (a task is DONE only when verified running).
Verified in the running browser.
