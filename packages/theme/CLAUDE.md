# @heliogrid/theme — every visual value, generated from the live design system

The no-raw-values law is `.claude/rules/ui-adherence.md`, which loads with this folder. What each
file is and what the build emits: `packages/theme/README.md`.

- NEVER a hand-written token. Every value arrives from the design system — a missing value is
  missing there, so fix it there, not here.
- NEVER component code (that is `@heliogrid/ui`) or anything product-specific.
- Consumers read `dist/`: after editing `src/` or `_generated/`, run
  `pnpm --filter @heliogrid/theme build`.

## Traps

- There is no `pnpm ds:pull`: read the design system artifact's files with the Artifact tool in a session (`read` with `paths`, under `project/`), save each file byte for byte under the name
  `packages/theme/README.md` maps it to, and commit exactly that.
