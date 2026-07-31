# ADR-0022: apps/web feature folders — pages route, features own the capability

**Status:** Accepted (owner request 2026-07-31)
**Date:** 2026-07-31

## Context

`apps/web/CLAUDE.md` prescribed ONE FOLDER PER ROUTE: `app/<route>/` held `page.tsx` plus
`styles.css`, `components.tsx`, `hooks.ts` and `constants.ts` satellites. Under it
`app/login/page.tsx` reached 388 lines carrying a state machine, four sub-components, timers
and transport error handling in one file, and `app/design/page.tsx` reached 317. Nothing
capped page size, so the shape degraded silently. It also scattered one capability across
route folders: auth spans login, signup and onboarding, which under a route layout can share
nothing without a satellite that belongs to neither.

## Decision

`app/` is Next.js ROUTING ONLY. A `page.tsx` is a controller of **at most 50 lines**: it reads
route params, calls one controller hook, and renders one screen component. Everything else —
screens, sub-components, hooks, CSS — lives in `apps/web/features/<feature>/`, exposed through
an `index.ts` barrel that is the only path `app/` may import.

**Amended 2026-08-01 — barrels exist at TWO levels, and must not mix server and client.**
`app/` may import `features/<feature>/index.ts` or a screen barrel one level down,
`features/<feature>/<screen>/index.ts`. Nothing deeper: `<screen>/components/index.ts`, hooks
and constants stay internal. The second level is not a convenience — a barrel that re-exports
both a Server Component and a `'use client'` screen attaches the client screen's whole chunk to
every page that reaches the barrel, and no tree-shaking removes it. That cost `/design` 147 kB
against a 102 kB baseline until `GalleryScreen` moved to `features/design-reference/gallery/`.
Rule of thumb: one barrel per feature until a screen is a different rendering kind or the
feature grows past a couple of screens, then give the screen its own.

A feature is named for the MODULE that owns it (`apps/api/src/modules/<module>/`), which keeps Law 6
traceability intact and makes "where does this go?" answerable without judgement.

`lib/` is unchanged: `api-client.ts`, `auth-client.ts`, `env.ts` are app-wide infrastructure,
not a capability.

## Consequences

- The 50-line cap is mechanical — Biome `noExcessiveLinesPerFunction` (maxLines 50) scoped to
  `apps/web/app/**/page.tsx`, added by this plan's Task 6 — so the shape cannot degrade
  silently the way the previous convention did. A lint rule rather than a line-counting script
  is a standing preference (owner directive 2026-07-31): it measures the function BODY, so
  imports and comments do not eat the budget, and it is versioned with the toolchain.
- A capability's files change together and now live together; auth's three screens can share
  `features/auth/shared/` without a satellite that belongs to no route.
- `apps/web/package.json` declares `"sideEffects": ["**/*.css"]`. Every screen imports its own
  stylesheet, and a bare `import './x.css'` is a side effect, so without this webpack must keep
  every module a barrel names — all three auth routes shipped an identical 183 kB because each
  pulled all three screens. The declaration is true of this app (every side-effect import under
  `apps/web` is CSS) and must be rechecked if that ever stops being the case.
- One more indirection: a reader following a route now opens two files instead of one. Accepted
  — it is the same trade the container/presentational split already makes, and 388 lines in a
  route folder was not actually one file's worth of reading.
- **apps/mobile is deliberately NOT changed.** RN has no router-driven `app/` directory;
  `src/screens/<name>/` is already the equivalent shape. The asymmetry is intentional, not
  drift; this plan's Task 7 records it in both CLAUDE.md files so a later agent does not
  "align" one to the other.
- Migration touches screens the auth rebuild (auth-tenancy ruling 6) will replace. Accepted:
  the move is mechanical, and it is what allows the cap to be enabled before the rebuild lands
  rather than after.

**Amended 2026-07-31 — the asymmetry is LOCATION, not structure.** RN keeps
`src/screens/<name>/`; web keeps `features/<feature>/`. Inside that folder both platforms use
the same split: screen composes · `components/` one file each · `hooks/use-<thing>.ts` ·
styles beside them. Reading the ADR as licence for a single-file RN screen produced a 446-line
LoginScreen against web's 70. Structural parity is also what lets a reviewer diff the two
platforms file-for-file.

## Alternatives rejected

- **Keep route folders, add a line cap.** Caps the symptom, leaves auth scattered across three
  route folders with nowhere shared to put `use-online.ts`.
- **`src/features/` next to `app/`.** Next.js already treats `app/` as special; a sibling
  `features/` under `apps/web/` is one fewer level and matches how `lib/` already sits.
- **Feature-per-route (`features/login`, `features/signup`).** Reproduces the scattering this
  ADR exists to remove — auth's three screens share state shape and copy.

## Sources

- Owner request, 2026-07-31 (this session).
- `apps/web/CLAUDE.md` (the superseded convention), `docs/17-engineering-governance.md` §5.
- Measured: `app/login/page.tsx` 388 lines, `app/design/page.tsx` 317 lines, 2026-07-31.
