# HelioGrid

Multi-tenant SaaS for Indian solar EPC companies — CRM → survey (remote + physical) →
3D Design Studio → proposal → tokenised customer link → AI voice-agent follow-up →
project tracking → payments. India-first (GST, DISCOM, PM Surya Ghar, TRAI/DND, ₹
lakh/crore, EN/HI/MR), architected for global expansion. **The 3D Design Studio is the
flagship feature.** Light-only in v1.

This README is the map: how to get the repo running, how the pieces fit together, and —
critically — what you must do **by hand** after common changes (bump a dependency, add a
package, touch a shared schema) so the rest of the repo doesn't silently drift. It
deliberately does not repeat what's already documented elsewhere; it tells you where that is.

For the rules AI agents (and humans) follow when changing this codebase, see
[`CLAUDE.md`](CLAUDE.md) — read
those before your first non-trivial change, not after.

## Contents

- [Repo map](#repo-map)
- [Prerequisites](#prerequisites)
- [First-time setup (cold start)](#first-time-setup-cold-start)
- [Running the apps](#running-the-apps)
- [Ports](#ports)
- [Environment variables](#environment-variables)
- [Commands reference](#commands-reference)
- [Working with packages](#working-with-packages-add--update--remove)
- [Code quality gates & pre-commit hook](#code-quality-gates--pre-commit-hook)
- [Schema, contract & cross-cutting changes](#schema-contract--cross-cutting-changes)
- [Git workflow](#git-workflow)
- [Where to find things](#where-to-find-things)
- [Per-package gotchas index](#per-package-gotchas-index)

## Repo map

A pnpm workspace (`pnpm-workspace.yaml`): `apps/*`, `packages/*`, `tests/*` are each their own
`@heliogrid/<name>` package. Every package/app has its own `CLAUDE.md` — that is the
authoritative doc for that layer; this table is only the index.

| Path | What it is | Commands doc |
|---|---|---|
| `apps/api` | NestJS modular monolith — the only tenant-facing HTTP surface | [apps/api/CLAUDE.md](apps/api/CLAUDE.md) |
| `apps/web` | Next.js App Router — pure frontend/BFF, no domain logic | [apps/web/CLAUDE.md](apps/web/CLAUDE.md) |
| `apps/mobile` | Bare React Native (iOS + Android), no Expo — field-first app | [apps/mobile/CLAUDE.md](apps/mobile/CLAUDE.md) |
| `apps/worker` | NestJS standalone worker — BullMQ processors, heavy compute (scaffold stage) | [apps/worker/CLAUDE.md](apps/worker/CLAUDE.md) |
| `packages/contracts` | ts-rest + Zod API contracts — the single source of truth for the API surface | [packages/contracts/CLAUDE.md](packages/contracts/CLAUDE.md) |
| `packages/data` | Frontend SDK — the **only** data path for web + mobile: transport, ts-rest client, repositories, session, React Query adapter | [packages/data/CLAUDE.md](packages/data/CLAUDE.md) |
| `packages/db` | Drizzle schema + append-only SQL migrations + RLS/tenancy — **greenfield since 2026-08-01**, awaiting the auth+tenancy rebuild's `0001` | [packages/db/CLAUDE.md](packages/db/CLAUDE.md) |
| `packages/domain` | Pure, isomorphic domain logic (formatters, policy, invariants) — bottom of the graph | [packages/domain/CLAUDE.md](packages/domain/CLAUDE.md) |
| `packages/env` | The **only** package allowed to read a raw environment source | [packages/env/CLAUDE.md](packages/env/CLAUDE.md) |
| `packages/i18n` | One Lingui catalog (EN/HI/MR) shared by web + mobile | [packages/i18n/CLAUDE.md](packages/i18n/CLAUDE.md) |
| `packages/theme` | Tokens, semantic layer and the RN theme object — GENERATED from the live design system, never hand-edited | — |
| `packages/ui` | The design system, BOTH platforms: 95 components as `<Name>.tsx` (web) + `<Name>.native.tsx` (RN) over one shared `<Name>.types.ts` | — |
| `tests/invariants` | Cross-cutting invariant checks (tenancy, enum parity, schema parity) — the only "tests" in this repo | — |
| `docs/` | How THIS REPO is built — architecture, tech stack, gates, ADRs | — |
| `prd/` | **What the product does** — product overview, personas, journey, 8 foundations, 13 modules, and the registers | — |
| `tasks/` | Per-module build tasks, written to as work completes | — |
| `ux/` | The 150 screen briefs plus the context file every design session is given | — |
| `design/` | Design-system gap register and the round prompts that closed it | — |
| `.claude/` | Rules, skills and agent configuration that govern AI-assisted changes here | — |

## Prerequisites

- **Node 22** (`.nvmrc` pins `22`; `engines` in `package.json` enforces `>=22 <23` and
  `.npmrc` sets `engine-strict=true`, so a wrong Node version hard-fails install). Run `nvm use`.
- **pnpm** — pinned via `packageManager: pnpm@10.34.5` in root `package.json`; `.npmrc` sets
  `manage-package-manager-versions=true` so pnpm self-installs the pinned version. You don't
  need to install a specific pnpm globally, just have any recent pnpm/Corepack available.
- **Docker** (or a local Postgres 16) — for `DATABASE_URL`. Most gates skip loudly without it;
  they never silently pass.
- **Xcode + Android Studio** — only if you're running `apps/mobile` on a simulator/emulator.

## First-time setup (cold start)

Order matters. Steps 2–3 are not optional: workspace packages resolve through their `dist/`,
so anything before a build dies on `MODULE_NOT_FOUND` with nothing pointing at the cause.

```bash
nvm use
pnpm install --frozen-lockfile
pnpm turbo build                          # REQUIRED before anything below

docker run --rm -d --name heliogrid-db \
  -e POSTGRES_USER=heliogrid -e POSTGRES_PASSWORD=heliogrid \
  -e POSTGRES_DB=heliogrid -p 5432:5432 postgres:16

cp .env.example .env.local                # then fill in:
#   DATABASE_ADMIN_URL -> the container above (owner/superuser: runs migrations)
#   DATABASE_URL       -> the app_runtime role, NOT a superuser. The api refuses to boot
#                         on a SUPERUSER/BYPASSRLS role because RLS would silently no-op.

pnpm --filter @heliogrid/db migrate       # roles + schema. NOTE: greenfield since
                                          # 2026-08-01 (ADR-0024) — there are no migrations
                                          # to apply until the auth+tenancy rebuild lands.
pnpm verify                               # lint · boundaries · typecheck · test · build
```

`pnpm install` also installs this repo's git pre-commit hook automatically (via the root
`prepare` script — see [Code quality gates](#code-quality-gates--pre-commit-hook)).

## Running the apps

Each app has its own dev server; there is no single "start everything" command today (no
`apps/*` are wired into one `turbo run dev` invocation in this repo — run what you need):

```bash
pnpm --filter @heliogrid/api dev        # NestJS, tsx watch, http://localhost:8084
pnpm --filter @heliogrid/web dev        # Next.js, http://localhost:3002
pnpm --filter @heliogrid/mobile start   # Metro bundler (default port 8081)
pnpm --filter @heliogrid/mobile ios     # or: android — builds + launches on a simulator
pnpm --filter @heliogrid/worker dev     # NestJS worker, no HTTP surface (BullMQ processors)
```

Or from inside the app's own directory, plain `pnpm dev`/`pnpm start` works the same way.

**api and web kill whatever's already on their port before starting.** Both have a `predev`/
`prestart` npm hook that runs `kill-port <port>` first — so a leftover process from a crashed
previous run never causes `EADDRINUSE` or silently pushes the server onto a different port.
This is deliberately just npm's native `pre*` lifecycle hooks + the `kill-port` package — no
custom wrapper script. See `apps/api/package.json` / `apps/web/package.json` scripts.

`apps/web`'s dev-server port is a **literal** in `apps/web/package.json` (`next dev --port
3002`), not read from `.env` — Next.js's CLI has no environment-variable equivalent for its
own port, only a `--port` flag, so this is the standard convention almost every Next app uses.
`apps/api`'s port **is** env-driven (`ENV.API_PORT`, default `8084`) — see
[Environment variables](#environment-variables).

## Ports

| App | Port | Where it's set | Env-overridable? |
|---|---|---|---|
| `apps/api` | `8084` | `packages/env/src/schema/api.ts` (`API_PORT`, default `8084`) | Yes — set `API_PORT` in `.env.local` |
| `apps/web` | `3002` | Literal in `apps/web/package.json` (`next dev/start --port 3002`) | No — edit the script (Next has no port env var) |
| `apps/mobile` | `8081` (Metro default) | React Native CLI default | Yes — `--port` flag to `react-native start` |
| Postgres (local dev) | `5432` | Whatever you pass to `docker run` | N/A |

`.claude/launch.json` mirrors the api/web ports for this repo's browser-preview tooling — if
you ever change either port, update that file too.

Production (Fly.io) ports live in `apps/api/fly.toml` / `apps/web/fly.toml`
(`internal_port` + `[env]`) and are **not** driven by the same local dev port — they're kept
in sync by hand when the local port changes; there's no shared source between the two.

## Environment variables

**`@heliogrid/env` (`packages/env`) is the only package in this repo allowed to read a raw
`process.env`.** This is enforced by three independent mechanisms — Biome's `noProcessEnv`
rule, a repo-wide grep gate (`pnpm check:env` → `scripts/check-env-access.mjs`), and
Turborepo's `boundaries` tags (the `env` tag is only importable from the `app` tag) — so you
cannot accidentally read an env var from the wrong place; you'll get a build failure naming
exactly where.

**To add or change a variable:**
1. Edit the relevant schema in `packages/env/src/schema/` (`api.ts`, `web.ts`, `worker.ts`,
   `native.ts`, or a shared fragment in `fragments.ts`). Non-secret defaults live **in the
   schema** (`.default(...)`) — never as a `??` fallback at the call site. Secrets never carry
   a default (a missing secret must fail loudly at startup, not silently ship a dev key).
2. Add it to `.env.example` with a comment.
3. Nothing else. `pnpm --filter @heliogrid/env build` regenerates the typed loader; every
   consumer (`apps/api`, `apps/worker`, `apps/web` via `apps/web/lib/env.ts`, `apps/mobile`
   via `apps/mobile/src/env.ts`, `tests/invariants`) picks it up automatically next time it
   imports `@heliogrid/env/*`. **Rebuild `packages/env` (`pnpm turbo build` is safe and
   sufficient) whenever you touch its schema** — consumers resolve it through `dist/`, so a
   schema edit that isn't rebuilt is invisible to everything downstream. This bit us mid-work
   on the port migration in this repo's history — don't skip it.

**Where real values live:**
- Local dev: `.env.local` (git-ignored, never committed — copy from `.env.example`).
- Production: Fly.io secrets.
- **Which commands actually load `.env.local`, and how**, is documented at the top of
  `.env.example` itself — read that comment block before assuming a value is picked up; a few
  commands (`db migrate`, the invariants runner) take the URL from the **shell environment**
  instead, because the value is needed before Node starts (`set -a; . ./.env.local; set +a`).

## Commands reference

All run from the repo root unless noted. Per-package equivalents: `pnpm --filter
@heliogrid/<name> <script>`.

| Command | What it does |
|---|---|
| `pnpm install` | Install deps; also installs the git pre-commit hook |
| `pnpm turbo build` | Build every package (respects the dependency graph — safe to run anytime) |
| `pnpm typecheck` | `turbo run typecheck` across every package |
| `pnpm test` | `turbo run test` — runs `tests/invariants/` only; **there are no unit tests anywhere in this repo** (owner directive) |
| `pnpm lint` | `scripts/lint-all.sh` — 6 gates: Biome (zero warnings, zero errors), dependency-cruiser, sherif, repo adherence, env centralisation, web↔RN prop parity. Runs every gate and reports all failures, not just the first |
| `pnpm lint:fix` | `biome check --write .` — auto-fixes what Biome can fix |
| `pnpm boundaries` | `turbo boundaries` — enforces the package-tag dependency allowlists |
| `pnpm verify` | The full local gate: `build && lint && boundaries && typecheck && test`. Build runs first — dependency-cruiser resolves workspace edges through `dist/`, so linting an unbuilt checkout is partially blind. This is what "green" means before you call something done |
| `pnpm precommit` | The subset of `verify` the git hook runs automatically: Biome (staged files only, zero warnings) + full typecheck |
| `pnpm check:adherence` | UI/design-token/i18n adherence scan (also part of `pnpm lint`) |
| `pnpm check:openapi` | Re-emits and diffs `packages/contracts/openapi/openapi.json` — run after any contract change |
| `pnpm check:env` | The env-centralisation gate standalone (also part of `pnpm lint`) |
| `pnpm check:ui-parity` | The web↔RN component-prop parity gate standalone (also part of `pnpm lint`) |
| `pnpm check:unused` | `knip` — finds unused exports/files (not part of `pnpm verify`, run manually) |
| `pnpm check:dupes` | `jscpd` — duplicate-code scan (not part of `pnpm verify`, run manually) |

CI (`.github/workflows/ci.yml`) runs a superset of `pnpm verify` in one job — build first (so
dependency-cruiser can resolve workspace `dist/` output), then lint, boundaries, typecheck,
apply migrations against a real CI Postgres, run the invariants, build again, check OpenAPI
freshness, and guard that i18n messages are extracted — plus separate Android/iOS build jobs
and a Gitleaks secret scan. If it's not green in CI, `pnpm verify` locally should already have
told you (except the DB-dependent and i18n-extraction steps, which need real Postgres to run).

## Working with packages (add / update / remove)

This is the part most monorepos leave undocumented and it's the #1 source of "why isn't my
change showing up" confusion. Read it once.

### Adding a new package

1. Create `apps/<name>/` or `packages/<name>/` (workspace globs in `pnpm-workspace.yaml` are
   `apps/*`, `packages/*`, `tests/*` — any folder matching one of these with a `package.json`
   is automatically a workspace package, no registration step needed).
2. Copy the shape of an existing small package as a template, e.g. `packages/domain/package.json`:
   ```jsonc
   {
     "name": "@heliogrid/<name>",
     "version": "0.0.1",
     "private": true,
     "scripts": { "build": "tsc -b", "typecheck": "tsc -p tsconfig.json --noEmit" },
     "devDependencies": { "@heliogrid/config": "workspace:*", "typescript": "5.8.3" }
   }
   ```
   `@heliogrid/config` is the shared tsconfig presets package — every package needs it as a
   devDependency. Use exact versions everywhere (`.npmrc` sets `save-prefix=`, so no `^`/`~`).
3. Add a `turbo.json` in the new package declaring its **boundaries tag**:
   ```jsonc
   { "$schema": "https://turborepo.com/schema.json", "extends": ["//"], "tags": ["<tag>"] }
   ```
   If it's a genuinely new tag (not reusing `domain`/`db`/`ui`/`contracts`/`env`/`i18n`/
   `tokens`/`app`), also add that tag's allowed-dependencies block to root `turbo.json`'s
   `boundaries.tags`, and add it to any other tag's `allow` array that should be permitted to
   depend on it. `pnpm boundaries` enforces this — it will tell you exactly what's missing.
4. Run `pnpm install` (links the new package into `node_modules`), then `pnpm turbo build`.
5. If the new package should be off-limits to `packages/domain` (pure, no workspace imports)
   or restricted to exports-only access from outside, check `.dependency-cruiser.cjs` — most
   rules are path-glob-based and apply automatically, but a few enumerate specific package
   names in a regex alternation (search for existing package names in that file) and may need
   your new package name added by hand.

### Updating a dependency

```bash
pnpm add <pkg>@<exact-version> --filter @heliogrid/<name>      # add or bump
pnpm remove <pkg> --filter @heliogrid/<name>                   # remove
```
Or hand-edit the `package.json` version and run `pnpm install` (no `^`/`~` — this repo pins
exact versions everywhere; `.npmrc`'s `save-prefix=` makes `pnpm add` do this automatically).

**After any dependency or source change: `pnpm turbo build` is always the safe, correct thing
to run from the repo root.** Turbo hashes file contents (including transitive workspace deps
via each task's `^build` dependency) and only rebuilds what actually changed — you never need
to manually clear a cache. The one gotcha: this only works if every file a package's build
actually reads is declared as a turbo `input` or a workspace dependency. If a package reads
files **outside** the workspace graph (e.g. `packages/tokens/build.ts` reads
`design/ds-source/**`, which isn't a workspace dependency), its `turbo.json` must manually
restate `inputs` to cover them — otherwise `pnpm turbo build` can silently serve a stale cache
after you edit one of those untracked files. If you add a package that reads non-workspace
files, give it the same explicit `inputs` treatment (see `packages/tokens/turbo.json` as the
reference example).

**Workspace-internal packages consuming another workspace package's changes:** since
everything resolves through `dist/` (not source), a package whose code changed needs
`pnpm turbo build` to actually run before anything that imports it sees the new behavior —
`tsx watch`/`next dev`'s hot-reload watches *your* app's own source, not an upstream
workspace package's source, so a change to e.g. `packages/domain` or `packages/env` needs an
explicit rebuild (`pnpm turbo build`, or scoped: `pnpm --filter @heliogrid/domain build`)
before a running `pnpm --filter @heliogrid/api dev` picks it up.

### Removing a package

Deleting the folder is enough for the workspace glob (automatic), but check these by hand —
none of them error on a dangling reference, they just silently rot:
- Its tag may still be referenced in other packages' `turbo.json boundaries.tags.<tag>.allow`
  arrays in root `turbo.json` — harmless but worth cleaning up.
- `.dependency-cruiser.cjs` may still name it in an enumerated regex alternation.
- Root `tsconfig.json`'s `references` array explicitly lists `packages/contracts` and
  `packages/db` by path (not a glob) — if you ever remove one of those two specific packages,
  edit this by hand.
- `.github/workflows/ci.yml` has a few package-specific steps by name (`@heliogrid/db migrate`,
  `@heliogrid/i18n extract`) — only relevant if you're removing one of those two.

## Code quality gates & pre-commit hook

**Zero Biome warnings, zero Biome errors, zero typecheck errors — repo-wide, not just on
files you touch.** `pnpm lint` runs Biome with `--error-on-warnings`, so a warning fails the
gate exactly like an error (this repo runs Biome's `noExcessiveCognitiveComplexity` and every
other rule at zero tolerance).

A git pre-commit hook enforces the same bar automatically, scoped to whatever you're
committing:
- Installed via `simple-git-hooks` (a root devDependency), wired up by the root `prepare`
  script — so it's installed automatically the moment you run `pnpm install`, no manual step.
- Runs `pnpm precommit` → `biome check --error-on-warnings --no-errors-on-unmatched --staged .`
  (only the files you staged) + `pnpm turbo typecheck` (the full project — always fast, always
  cached when nothing relevant changed).
- **Don't work around it** — not by narrowing what you stage, not by dropping
  `--error-on-warnings`, not by `git commit --no-verify`. Fix the diagnostic. If a gate is
  wrong, that's a conversation to have explicitly, not a flag to quietly drop.

`pnpm verify` is the full local gate (lint + boundaries + typecheck + test + build) — run it
before considering any non-trivial change done. See [Commands reference](#commands-reference).

## Schema, contract & cross-cutting changes

Some changes need more than "edit the file" — a dedicated skill exists for each, and skipping
it is how drift enters the repo silently:

| You changed... | Run this | Why |
|---|---|---|
| `packages/contracts` (any endpoint, schema, or type) | `/contract-change` | Re-emits `packages/contracts/openapi/openapi.json`, sweeps every typed client (`apps/web`, `apps/mobile`) for breakage via typecheck, and judges whether the change is breaking |
| `packages/db` (new table, new/changed column, pgEnum) | `/migration` | Authors a new append-only SQL file (never edit an applied one), wires tenancy/RLS/grants, applies it twice to prove idempotency, and runs the invariants against a real database |
| A `z.enum` that's also a Postgres `pgEnum` | Both of the above, same slice | `packages/db` hand-mirrors contract enums (dependency-cruiser forbids `db` importing `contracts`) — `tests/invariants/src/enum-parity.ts` catches drift, but only if you run it |
| Any feature/bugfix slice, before calling it done | `/verify` | Green gates (`pnpm verify`) prove code correctness, never UI or cross-surface behavior. `/verify` drives the real app — browser for web, simulator for iOS, adb for Android, curl for the API — across only the surfaces the change reaches, and loops until clean |
| A completed task, before review | `/finish` | Gates, an architecture review of the diff, then a proposed branch/commits/PR carrying the verification record. Nothing is committed or pushed without an explicit yes |

## Git workflow

Work happens on a branch and ends PR-ready via `/finish`, which proposes the branch, the
commits and the PR body. **Committing, pushing and opening the PR each need an explicit
yes.** `main` is PR-only. Full detail: [`CLAUDE.md`](CLAUDE.md) §8.

## Where to find things

| Doc | Covers |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | The constitution — rules governing every change in this repo |
| [`.claude/rules/`](.claude/rules/) | Path-scoped rules that load automatically for the paths they name |
| [`START-HERE.md`](START-HERE.md) | **Designing a screen** — the one file a design session starts from |
| [`prd/01-product-overview.md`](prd/01-product-overview.md) | Product vision, V1 scope, non-goals |
| [`prd/registers/screens.md`](prd/registers/screens.md) | **The screen register** — 150 screens, 99 locked to V1, and which are designed |
| [`BUILD-ORDER.md`](BUILD-ORDER.md) | Build order across modules |
| [`docs/architecture.md`](docs/architecture.md) | **The spine** — package registry, dependency direction, platform rules (RN/Next.js), and where new code goes |
| `docs/02-system-architecture.md` | System design record — intent and target state, not current contents (see the spine) |
| `docs/03-tech-stack.md` | Every technology choice, pinned and justified |
| `docs/04-data-model.md` | Full multi-tenant Postgres schema |
| `docs/08-security-and-tenancy.md` | Security & tenancy model |
| [`docs/17-ui-architecture-v2.md`](docs/17-ui-architecture-v2.md) | The UI layer: theme, primitives, the 95 components, and the gates that hold them |
| [`prd/foundations/F3-localization.md`](prd/foundations/F3-localization.md) | i18n law (EN/HI/MR) |
| [`prd/foundations/F7-design-language.md`](prd/foundations/F7-design-language.md) | Design language |
| [`prd/registers/open-questions.md`](prd/registers/open-questions.md) | Owner rulings — check before re-deciding something already decided |
| [`prd/registers/conflicts.md`](prd/registers/conflicts.md) | Contradictions found in the spec and how each was resolved |
| `docs/forward-compat.md` | What each module's first migration must satisfy so later modules aren't blocked |
| `docs/adr/` | Why each architecture choice was made — reference only |
| [`docs/README.md`](docs/README.md) | **The docs map** — every file under `docs/`, and whether it is law, live, superseded or archive |
| `docs/archive/` | Frozen history — research, spikes, the offline removal, the closed design-gap register |
| `.claude/skills/` | `/contract-change`, `/migration`, `/verify`, `/finish` — see [above](#schema-contract--cross-cutting-changes) |
| `.claude/agents/` | QA executors (web · mobile · api · parity) and the architecture reviewer |

## Per-package gotchas index

The single most load-bearing thing to know per package before you touch it. Each package's own
`CLAUDE.md` has the full list under "Landmines" — this is only the one most likely to bite a
newcomer immediately.

| Package | Watch out for |
|---|---|
| `apps/api` | `pnpm dev` runs via `tsx` (esbuild) — **no decorator metadata**, so every constructor param needs an explicit `@Inject(Token)`, including framework types like `Reflector` |
| `apps/web` | Never author business logic here — shared decisions/formatters/policy import from `@heliogrid/domain`; writing one inline is the defect |
| `apps/mobile` | Repository types are **inferred from contracts**, never hand-declared — a hand-written interface silently drifts when the contract changes |
| `apps/worker` | `bullmq`/`@nestjs/bullmq` are only importable from processors, schedulers, `common/queue/`, and `worker.module.ts` — no module may build a `Queue` itself |
| `packages/contracts` | Zod is pinned to 3.25.x — `zod/v4` exists in the ecosystem but is banned here (ts-rest's Zod-4 support isn't stable yet) |
| `packages/db` | pgEnum values must hand-mirror `packages/contracts`' `z.enum`s — enforced only at runtime by `tests/invariants`, not by any import-time check |
| `packages/domain` | Zero workspace imports, by design (ADR-0021) — importing `packages/contracts` from here would create a cycle |
| `packages/env` | `process.env` may **only** be read inside this package — see [Environment variables](#environment-variables) |
| `packages/i18n` | Never mix macro `<Trans>` with explicit-`id` `<Trans>` for the same string — forks into duplicate catalog entries |
| `packages/tokens` | Never hand-transcribe a value; never read `_ds_manifest.json` — `design/ds-source/*.css` is the only source of truth |
| `packages/ui` | `src/api-parity.ts` typechecks this package against `packages/ui-api` in both directions — a prop change here without the RN mirror fails typecheck |
| `packages/ui-api` | When web and RN disagree on a prop shape, RN has been the one that's right, historically — the contract generally follows RN's stricter shape |
