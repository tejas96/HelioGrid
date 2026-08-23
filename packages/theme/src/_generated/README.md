# GENERATED — never hand-edit

Pulled **2026-08-19** from Claude Design project `c8aa4326-21bf-453a-8d11-749cc81dee12`
(HelioGrid Design System) via **DesignSync**.

Every file in this folder is a byte-verbatim copy of the live design system:

- `tokens/*.css` — the 11 token/stylesheet source files
- `styles.css` — the DS global stylesheet (an `@import` manifest over `tokens/`)
- `manifest.json` — the component + prop census, consumed by the `ds:check` drift gate
- `adherence.oxlintrc.json` — per-component prop contracts
- `contracts/<family>/<Name>.d.ts.txt` — the 95 component typings, pulled verbatim and **never
  hand-edited**. These are the design system's own declarations, prop names *and prop types*,
  which is what makes the `ds:contract` gate possible: `adherence.oxlintrc.json` carries names
  only, so it can say a prop is missing but never that a prop was ported with a weaker type. If a
  typing here looks wrong, the fix is a re-pull, not an edit — an edited contract is a hand-copied
  mirror, which is the exact failure docs/17 §6 exists to abolish.

  **Why `.d.ts.txt` and not `.d.ts`.** These files are DATA, not code: nothing compiles them,
  nothing imports them, nothing type-checks them — `scripts/ds-contract/` opens them as TEXT.
  But the bytes are the design system's real typings, and all 95 open with
  `import React from "react"`. Named `<Name>.d.ts`, every toolchain pointed at this package
  claimed them as live TypeScript: `turbo boundaries` parsed all 95 and reported **94**
  "cannot import package `react` because it is not a dependency" violations, because
  `packages/theme` declares no react **by design** — its `theme-standalone` rule in
  `.dependency-cruiser.cjs` says it "depends on nothing in the workspace". `tsc` swept them in
  too, via this package's `src/**/*.ts` include (silent only because `skipLibCheck` skips
  declaration files). The `.txt` suffix is the one fix that costs nothing: no tool claims a
  `.txt`, so boundaries, tsc, biome, knip and jscpd all stop parsing them, **with not one byte
  of content altered** — still `cmp`-identical to the design system originals. `.d.ts` stays in
  the middle of the name so the file still announces what it is. A re-pull must land them under
  this extension; the reader is `CONTRACT_EXT` in `scripts/ds-contract/contracts.mjs`.

  The two alternatives were rejected: adding `react` to `packages/theme` buys a lint pass by
  breaking the standalone rule that is the package's whole architecture, and path-excluding the
  folder from boundaries both leans on ignore support turbo does not really have and installs a
  blind spot over a directory inside a shipping package.

Hand-editing anything here is a bug (docs/17 §6): this folder exists so the repo carries no
hand-copied mirror that can drift. The re-pull happens in a Claude session — see
`packages/theme/README.md` for the contract.
