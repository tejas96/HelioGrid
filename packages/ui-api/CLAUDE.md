# @heliogrid/ui-api — the web↔RN component API contract (TYPES ONLY)

## What lives here / what must never live here
- One `*Api` interface per component, grouped by family (`common/forms/data/feedback/
  navigation/composites`), re-exported through `src/index.ts` as `ComponentApiSurface`.
- NEVER: runtime code, a React import, a style, a default value. This package emits no
  JavaScript — it exists so both platforms can be checked against ONE declaration.

## Commands
pnpm --filter @heliogrid/ui-api typecheck      # no build script — emits no JS; lint is repo-wide

## Depends on / depended on by
uses: @heliogrid/contracts (`import type` only — business enums like `WorkflowStatus` are
never re-typed here; the import erases at runtime, so the package still emits no JavaScript)
used by: packages/ui (`src/api-parity.ts`), apps/mobile (`src/ui/api-parity.ts`)

## The scope statement lives in src/index.ts's header — one place
It records which props are IN the contract and the two categories deliberately absent
(platform-owned props like `style`; platform-shaped handlers where no single type can hold
both). **Do not restate the count anywhere else.** It has drifted twice: "99 props" survived
in three files after the contract reached 117, then 117 survived after it reached 118. Every
other file points here instead of repeating a numeral.

## Four mechanisms, and each covers something the others cannot
1. `satisfies ComponentApiSurface` — the implementation is not LOOSER than the contract.
2. `MissingContractProps satisfies never` — no contract prop is missing from a platform.
3. `contractShape satisfies …` — the implementation is not STRICTER (a narrowed union or a
   dropped optional prop passes check 1 in silence).
4. `pnpm check:ui-parity` — the CONTRACT itself is complete. Checks 1–3 all iterate
   `keyof ComponentApiSurface`, so a prop absent from the contract AND both `declare const`
   blocks is invisible to every one of them. That hole hid `AvatarGroup.people`.

## Landmines
- **Adding a component here is not optional.** `UncoveredComponents` in each platform's
  `api-parity.ts` fails that platform's typecheck when its barrel exports a component this
  contract does not name. `AppText` is the one deliberate exclusion (RN needs a typography
  primitive; web gets it from CSS cascade), listed in the RN file with that reason.
- **A prop both platforms declare belongs IN the contract, not in NOT_SHARED.** That
  allowlist in `scripts/check-ui-parity.mjs` is for props no single type can hold — and it
  carries a stale-entry guard, so an exemption that stops being true fails the gate.
- **RN has held the stricter contract every time.** All seven parity defects found in 2026-07
  were web being lax (optional where RN required, `ReactNode` where RN took `string`,
  mutable array where RN took `readonly`). When the two disagree, start by assuming RN is
  right.

## Definition of done here
Both platforms' typechecks green · `pnpm check:ui-parity` green · the scope header in
`src/index.ts` updated in the SAME change if the surface moved.
