# GENERATED — never hand-edit

Pulled **2026-08-19** from Claude Design project `c8aa4326-21bf-453a-8d11-749cc81dee12`
(HelioGrid Design System) via **DesignSync**.

Every file in this folder is a byte-verbatim copy of the live design system:

- `tokens/*.css` — the 11 token/stylesheet source files
- `styles.css` — the DS global stylesheet (an `@import` manifest over `tokens/`)
- `manifest.json` — the component + prop census, consumed by the `ds:check` drift gate
- `adherence.oxlintrc.json` — per-component prop contracts

Hand-editing anything here is a bug (docs/17 §6): this folder exists so the repo carries no
hand-copied mirror that can drift. The re-pull happens in a Claude session — see
`packages/theme/README.md` for the contract.
