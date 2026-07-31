# @heliogrid/web — Next.js App Router, pure frontend/BFF (NO domain logic)

## What lives here / what must never live here
- Screens, the /design token reference, route handlers ONLY for cookie/session BFF glue.
- Everything domain-shaped calls apps/api through the ts-rest client. NEVER: business
  logic, direct packages/db imports (dependency-cruiser blocks), raw hex/px values.

## Commands
pnpm --filter @heliogrid/web dev      # localhost:3000 (tokens must be built first: turbo handles it)
pnpm --filter @heliogrid/web build | typecheck

## Depends on / depended on by
uses: @heliogrid/tokens, @heliogrid/contracts, @heliogrid/ui, @heliogrid/i18n, @heliogrid/env
used by: nobody

## Local conventions
- **`app/` ROUTES, `features/` OWNS.** A `page.tsx` body is ≤50 lines (Biome
  `noExcessiveLinesPerFunction`): read route params, call one controller hook, render one
  screen. Everything else lives in `features/<feature>/`, imported ONLY through its `index.ts`
  barrel (dependency-cruiser). A feature is named for its module in `docs/modules/`.
- **Inside a feature, structure follows need:** `<Screen>.tsx` composes · `components/` one
  file per sub-component (a folder from the first one) · `hooks/use-<screen>.ts` for the
  controller · `constants.ts` for literals · `types.ts` when two files share a type ·
  `<feature>/shared/` when two SCREENS share. Two FEATURES sharing means it is not
  feature-local: `packages/ui`, `packages/domain` or `lib/`. ADR-0022.
- `globals.css` is the only stylesheet under `app/`. Next reserved files
  (layout/providers/loading/error/not-found/route) stay in `app/`; `route.ts` is cookie/session
  BFF glue ONLY. `lib/` is unchanged: `*-client.ts` · `env.ts` · `hooks/` · `constants.ts`.
- **Styling layers:** components own pixels (`@heliogrid/ui` index only); screens own layout
  via a colocated `<screen>.css` in the feature folder with token `var()`; Tailwind = layout
  only (`flex`, `grid`, `min-h-dvh`). No inline `style`, no new `hg-*`.
- Import UI ONLY from `@heliogrid/ui` index. Business types from `@heliogrid/contracts`;
  locale from `@heliogrid/i18n` — Law 4, no inline unions.
- `.hg-*` scaffold is legacy — new screens use `@heliogrid/ui` only.
- /design renders dist/tokens.json — a token that doesn't render there doesn't exist.

## Landmines
- **Never hand-roll `fetch` for product APIs.** `lib/auth-client.ts` used to export an
  untyped `api<T>()`; the onboarding screen used it with a hand-declared response type, so
  contract drift was invisible to typecheck. `lib/api-client.ts` is the ONLY path — it
  rejects on non-2xx, so a resolved value is always the declared success body. Read error
  copy with `envelopeMessage(err)`, never by re-declaring `{ error: { message } }`.
- **Enum-driven pickers/labels are `Record<TheEnum, …>` and iterate `schema.options`.**
  Onboarding's `SEGMENTS` was an `as const` array — merely subset-assignable, so a new
  `tenantSegmentSchema` value compiled green while being unselectable in the UI.
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
