# @heliogrid/web — Next.js App Router, pure frontend/BFF (NO domain logic)

## What lives here / what must never live here
- Screens, the /design token reference, route handlers ONLY for cookie/session BFF glue.
- Everything domain-shaped calls apps/api through the ts-rest client. NEVER: business
  logic, direct packages/db imports (dependency-cruiser blocks), raw hex/px values.

## Commands
pnpm --filter @heliogrid/web dev      # localhost:3000 (tokens must be built first: turbo handles it)
pnpm --filter @heliogrid/web build | typecheck

## Depends on / depended on by
uses: @heliogrid/tokens, @heliogrid/contracts, @heliogrid/ui, @heliogrid/i18n
used by: nobody

## Local conventions
- ONE FOLDER PER ROUTE: `app/<route>/` holds `page.tsx` plus satellites — `styles.css`
  (never `<route>.css`), `components.tsx`, `hooks.ts`, `constants.ts`, overflow folders.
  See CLAUDE.md §Structure. Next.js reserved files (layout/loading/error/not-found/route…)
  are exempt; `route.ts` is cookie/session BFF glue ONLY. Root `page.tsx` is a redirect stub.
  A route segment is never named `components`/`hooks`/`constants`.
  `lib/` = `*-client.ts` · `env.ts` · `hooks/` · `constants.ts` — **no `lib/format/`, no
  `utils.ts`**; formatters belong to `packages/domain` (web and RN both need them, Law 7).
- **Styling layers:** components own pixels (`@heliogrid/ui` index only); screens own layout
  via route `styles.css` with token `var()`; Tailwind = layout only (`flex`, `grid`, `min-h-dvh`).
  No inline `style`, no new `hg-*`.
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
- Import order in layout.tsx: tokens.css → base.css → globals.css (base before Tailwind).
- Geist woff2 urls resolve relative to tokens.css — Next bundles automatically.

## Definition of done here
docs/10 §10 + CLAUDE.md §Definition of done. Verified in the running browser.
