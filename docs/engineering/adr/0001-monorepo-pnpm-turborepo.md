# ADR-0001: Monorepo on pnpm workspaces + Turborepo

Date: 2026-07-24 · Updated: 2026-08-25 (removed cross-package TS project references)

## Context

HelioGrid is ~4 apps (web, api, worker, mobile) + packages (domain, contracts, db, ui, theme, i18n, env, data) built primarily by AI agents. The repo tooling must be legible and deterministic for agents: every layer readable as plain config, no generated project graph to reverse-engineer. Layer boundaries (domain never imports db/api; no cycles) are load-bearing for the pure-TS domain port.

## Decision

**pnpm workspaces + Turborepo.** Dist-emitting library packages (composite, `tsc -b`) build independently; apps and the invariant runner typecheck with `--noEmit`. **Turbo drives the inter-package build graph** (`^build` dependencies in `turbo.json`) — cross-package `references` arrays in root and app tsconfigs are removed; each package's tsconfig is self-contained. Lint/format is **Biome v2.5** (single binary, one `biome.json`), backed by **dependency-cruiser** (semantic layer rules: `domain` may not import `db`/`api`; no cycles; no orphans), **sherif** (dependency-version drift across packages) and **Turborepo Boundaries** (package encapsulation via exact role tags — `app-web`, `app-mobile`, `app-api`, `app-worker`, `app-invariants` — not a coarse shared `app` tag). Remote cache: Turborepo's free/self-hostable protocol.

**Enforcement ownership (one tool per concern — do not merge concerns):**
- Biome: format, local AST, a11y
- dependency-cruiser: import rules and cycles (authoritative within its scope)
- Turbo Boundaries: undeclared workspace-package imports and role-tag violations (authoritative within its scope)
- Sherif: version drift
- CI yml: generated/runtime/platform proofs (gitleaks, migration append-only, native builds, artifact upload)

## Consequences

- Truth lives in native files (`package.json` scripts + `turbo.json` + `biome.json` + `.dependency-cruiser.cjs`) — agents read exactly what runs.
- Four small tools instead of one integrated graph: boundary enforcement is split across dependency-cruiser (semantic), Turborepo Boundaries (physical) and sherif (versions). Each must stay in CI or its slice of enforcement silently disappears.
- Biome lacks an Nx-style tag-based module-boundary rule — dependency-cruiser is not optional.
- We forgo Nx's generators and its ~7x speed edge on 50+ package repos; at ~12 packages this is immaterial.
- Naming trap recorded: **sherif** (QuiiBz, version linter) is what we use — not **Sheriff** (@softarc, ESLint boundary tool).
- TS project references (cross-package `references` arrays) were removed 2026-08-25: they added no value over Turbo's `^build` ordering, and maintaining them in every tsconfig that added a workspace dependency created constant drift. Composite packages keep their own `tsc -b` setup; apps typecheck in isolation.

## Alternatives rejected

- **Nx** — fastest and richest, but `project.json`, inferred targets, executors and a plugin-inferred task graph are an abstraction layer agents must reverse-engineer and a known source of "why did this target run?" non-determinism; Nx Cloud CI is credit-metered.
- **moon** — legible YAML, but ~50k weekly downloads means a thin ecosystem and thin training-data corpus; agents produce more reliable output against Turborepo's dominant corpus; moonbase cache is a paid tier.
- **ESLint v9 + Prettier** — flat-config + `FlatCompat` shims + two-tool coordination vs one sub-500ms `biome check`; eslint-plugin-boundaries / Nx enforce-module-boundaries would drag the ESLint runtime back in.
- **Single bundler-mode TS graph (no references)** — loses incremental per-package `tsc -b` feedback and hard type boundaries.

## Sources

- https://turborepo.com/docs/reference/boundaries · https://turborepo.dev/blog/turbo-2-4
- https://biomejs.dev/blog/biome-v2-5/ · https://github.com/biomejs/biome/discussions/6245
- https://github.com/QuiiBz/sherif/blob/main/README.md
- https://esb1995.com/en/blog/monorepo-tools-turborepo-nx-moon-2026 · https://www.pkgpulse.com/guides/best-monorepo-tools-2026
- https://hsb.horse/en/blog/typescript-monorepo-best-practice-2026/
