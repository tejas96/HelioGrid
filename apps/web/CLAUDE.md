# @heliogrid/web — Next.js App Router, pure frontend/BFF (NO domain logic)

## What lives here / what must never live here
- Screens, the /design token reference, route handlers ONLY for cookie/session BFF glue.
- Everything domain-shaped calls apps/api through the ts-rest client. NEVER **author**
  business logic here — shared decisions, formatters and policy constants are IMPORTED from
  `@heliogrid/domain`; writing one inline is the defect. NEVER: direct packages/db imports
  (dependency-cruiser blocks), raw hex/px values.

## Commands
pnpm --filter @heliogrid/web dev      # localhost:3002 (tokens must be built first: turbo
                                       # handles it; kills a stale listener on that port first)
pnpm --filter @heliogrid/web build | typecheck

## Dependency policy
docs/architecture.md §2 apps/web; platform rules §3 (Next.js). `@heliogrid/data` is THE
data path — transport, repositories, session; this app authors none. Shared login types,
policy constants and formatters are imported from `@heliogrid/domain`, never re-authored
(Law 11).

## Local conventions
- **`app/` ROUTES, `features/` OWNS.** A `page.tsx` body is ≤50 lines (Biome
  `noExcessiveLinesPerFunction`): read route params and render one screen — routing only.
  The controller hook belongs to the SCREEN, not the page (`.claude/rules/ui-adherence.md`,
  which every page follows today). Everything else lives in `features/<feature>/`, imported ONLY through a barrel
  (dependency-cruiser) — either `features/<feature>/index.ts` or a screen barrel one level
  down, `features/<feature>/<screen>/index.ts`. Nothing deeper.
  **A barrel must not re-export both a Server Component and a `'use client'` screen** — see
  Landmines. Rule of thumb: ONE barrel per feature until a screen is a different rendering
  kind, or the feature grows past a couple of screens — then give that screen its own.
  A feature is named for the CAPABILITY it owns, matching the API module that
  serves it (`apps/api/src/modules/<module>/`) so one name spans both sides.
- **apps/mobile is NOT migrating to this shape** — RN keeps `src/screens/<name>/`, its own
  equivalent; the asymmetry is deliberate. **It is LOCATION, not structure:** inside the
  folder both platforms use the same split (screen composes · `components/` one file each ·
  `hooks/use-<thing>.ts` · styles beside them). Reading the asymmetry as licence for a
  single-file RN screen once produced a 446-line LoginScreen against web's 70.
- **Inside a feature, structure follows need:** `<Screen>.tsx` composes · `components/` one
  file per sub-component (a folder from the first one) · `hooks/use-<screen>.ts` for the
  controller · `constants.ts` for literals · `types.ts` when two files share a type ·
  `<feature>/shared/` when two SCREENS share. Two FEATURES sharing means it is not
  feature-local: `packages/ui`, `packages/domain` or `lib/`.
- `globals.css` is the only stylesheet under `app/`. Next reserved files
  (layout/providers/loading/error/not-found/route) stay in `app/`; `route.ts` is cookie/session
  BFF glue ONLY. `lib/` holds `ApiErrorText.tsx` + `api-error-text.css` + `env.ts` — NO
  `*-client.ts`: those were deleted by ADR-0023 (see the fetch landmine below).
- **Styling layers:** components own pixels (`@heliogrid/ui` index only); screens own layout
  via a colocated `<screen>.css` in the feature folder with token `var()`; Tailwind = layout
  only (`flex`, `grid`, `min-h-dvh`). No inline `style`, no new `hg-*`.
- Import UI ONLY from `@heliogrid/ui` index. Business types from `@heliogrid/contracts`;
  locale from `@heliogrid/i18n` — one definition per fact, no inline unions.
- Forms: `useZodForm(<contract schema>)` from `@heliogrid/forms`; wire fields with its
  `Controller`; map server rejections with `applyServerErrors`. react-hook-form directly
  is a lint failure. Live example: design-reference gallery, Patterns sections.
- API failures render `<ApiErrorText error={e} />` (lib/ApiErrorText.tsx) — never a
  hand-written failure string. Forms branch VALIDATION_FAILED through applyServerErrors first.
- Copy BOTH platforms need lives in `packages/i18n/src/copy` (extractor-swept, enum-keyed
  Record). Screen-specific copy stays in its screen. Platform files hold presentation only.
- `.hg-*` scaffold is legacy — new screens use `@heliogrid/ui` only.
- /design renders dist/tokens.json — a token that doesn't render there doesn't exist.

## Landmines
- **A feature barrel must not mix a Server Component and a `'use client'` screen** (2026-07-31).
  Next attaches the client screen's chunk to EVERY page that reaches the barrel, used or not,
  and tree-shaking cannot remove it: `/design` shipped the entire component gallery at 147 kB
  against a 102 kB baseline. Give the client screen its own barrel
  (`features/<feature>/<screen>/index.ts`). Symptom to recognise: two routes reporting the
  IDENTICAL First Load JS — that is one bundle serving both, not a coincidence.
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
docs/10 §10 + CLAUDE.md §Commands (a task is DONE only when verified running).
Verified in the running browser.
