# ADR-0001: Monorepo on pnpm workspaces + Turborepo + TypeScript project references

Status: Accepted
Date: 2026-07-24

## Context

HelioGrid is ~5 apps (web, api, worker, voice, mobile) + ~7 packages (domain, contracts, db, ui, tokens, i18n, config) built primarily by AI agents. The repo tooling must be legible and deterministic for agents: every layer readable as plain config, no generated project graph to reverse-engineer. Layer boundaries (domain never imports db/api; no cycles) are load-bearing for the pure-TS domain port.

## Decision

**pnpm workspaces + Turborepo + TypeScript project references.** Ship source (not pre-built dist) — Next.js and Metro bundle downstream; references exist purely for incremental `tsc -b` ordering and hard type boundaries. Lint/format is **Biome v2.5** (single binary, one `biome.json`), backed by **dependency-cruiser** (semantic layer rules: `domain` may not import `db`/`api`; no cycles; no orphans), **sherif** (dependency-version drift across packages) and **Turborepo Boundaries** (package encapsulation, undeclared-dependency imports). Remote cache: Turborepo's free/self-hostable protocol.

## Consequences

- Truth lives in native files (`package.json` scripts + `turbo.json` + `biome.json` + `.dependency-cruiser.js`) — agents read exactly what runs.
- Four small tools instead of one integrated graph: boundary enforcement is split across dependency-cruiser (semantic), Turborepo Boundaries (physical) and sherif (versions). Each must stay in CI or its slice of enforcement silently disappears.
- Biome lacks an Nx-style tag-based module-boundary rule — dependency-cruiser is not optional.
- We forgo Nx's generators and its ~7x speed edge on 50+ package repos; at ~12 packages this is immaterial.
- Naming trap recorded: **sherif** (QuiiBz, version linter) is what we use — not **Sheriff** (@softarc, ESLint boundary tool).

## Alternatives rejected

- **Nx** — fastest and richest, but `project.json`, inferred targets, executors and a plugin-inferred task graph are an abstraction layer agents must reverse-engineer and a known source of "why did this target run?" non-determinism; Nx Cloud CI is credit-metered.
- **moon** — legible YAML, but ~50k weekly downloads means a thin ecosystem and thin training-data corpus; agents produce more reliable output against Turborepo's dominant corpus; moonbase cache is a paid tier.
- **ESLint v9 + Prettier** — flat-config + `FlatCompat` shims + two-tool coordination vs one sub-500ms `biome check`; eslint-plugin-boundaries / Nx enforce-module-boundaries would drag the ESLint runtime back in.
- **Single bundler-mode TS graph (no references)** — loses incremental per-package `tsc -b` feedback and hard type boundaries.

## Sources

- `../research/tooling.md`
- https://turborepo.com/docs/reference/boundaries · https://turborepo.dev/blog/turbo-2-4
- https://biomejs.dev/blog/biome-v2-5/ · https://github.com/biomejs/biome/discussions/6245
- https://github.com/QuiiBz/sherif/blob/main/README.md
- https://esb1995.com/en/blog/monorepo-tools-turborepo-nx-moon-2026 · https://www.pkgpulse.com/guides/best-monorepo-tools-2026
- https://hsb.horse/en/blog/typescript-monorepo-best-practice-2026/
