# @heliogrid/ui — the _ds component API (web)

## What lives here / what must never live here
- The _ds components (forms/data/feedback/navigation/composites) + behavioral contracts.
  Ships SOURCE (`src/index.ts`); Next transpiles. Import ONLY from the index.
  (Component count lives in `@heliogrid/ui-api`'s scope header — never restate it.)
- NEVER: raw hex/px (tokens only — hand-mixed values use `color-mix()` over tokens),
  inline `style` in our code, new visual patterns, app/business logic, data fetching.

## The correctness chain (every component cites its sources)
1. API: `design/ds-source/_adherence.oxlintrc.json` prop allowlists — a DATA file consumed
   by hand into TS unions (oxlint itself was removed 2026-07-30), so TypeScript makes
   violations compile errors.
2. Pixels: the `_ds_bundle.js` reference implementation (session split: scratchpad
   ds-ref/*.ref.jsx; re-split from the bundle when needed) — spec to implement, NEVER code
   to import.
3. Law: docs/10; conflicts resolve tokens/rulings over mockup bugs
   (e.g. Button `variant="danger"` doesn't exist).

## Commands
pnpm --filter @heliogrid/ui typecheck      # no build — ships source; lint is repo-wide: `pnpm lint`

## Dependency policy
docs/architecture.md §2 ui. The RN mirror is `apps/mobile/src/ui`, parity-locked by
`@heliogrid/ui-api` (Law 7).

## Conventions (locked by the Button exemplar)
- One file pair per component FAMILY: `src/<family>/<Name>.tsx` + `<Name>.css` (imported by the
  component). Class prefix `ui-<name>`; variants via `data-*` attributes. `'use client'`.
  Co-located pairs are deliberate: Badge in `Chip.tsx`, AvatarGroup in `Avatar.tsx`,
  IconCircle in `Card.tsx`.
- Focus rings come from base.css `:focus-visible` — never remove; inputs use the
  elevation focus treatment instead (no outline).
- a11y contracts: icon-only controls REQUIRE `label` (typed, not optional); status never
  colour-alone (StatusChip dot + label); ≥44px targets (sm/32px controls carry an
  invisible ::after hit area when interactive).

## Landmines (incident-driven — 2026-07-27 architecture audit)
- **Business sets come from `@heliogrid/contracts`, never re-typed here.** `WorkflowStatus`
  was an inline union in BOTH this package and the RN mirror, absent from contracts, with
  its labels restated in two galleries — four copies of one enum. `import type` from
  contracts (the dependency exists, erases at runtime).
- **Copy props are REQUIRED.** StatusChip's `label` was optional here with a baked-in
  English `STATUS_LABEL` fallback while the RN mirror required it: callers that forgot the
  prop silently shipped untranslated English, bypassing Lingui, and the two mirrors had
  different APIs. Optional-with-fallback is banned for anything user-visible.
- **Prop parity with the RN mirror is a TYPECHECK now, not a gallery comparison.**
  `src/api-parity.ts` asserts this package against `@heliogrid/ui-api`; drift fails this
  package's own typecheck and names the component. It asserts BOTH directions — making a
  required prop optional AND narrowing a union or dropping an optional prop. Change a prop
  here and the mirror must change in the same slice (Law 7).

## STANDING LAW — surfaces without a mockup
When the data model needs UI the mockups don't cover, design it INSIDE this component
vocabulary — compose existing components/patterns; never invent new visuals. Register the
gap in docs/13 in the same slice.

## Definition of done here
Component renders EVERY variant × state in the /design gallery (a state not in the
gallery doesn't exist) · matches its ds-ref reference + mockup usages at 375/1440 ·
keyboard + axe clean · Hindi render survives expansion · RN mirror ships in the SAME
slice (apps/mobile/src/ui) · typecheck/lint green.
