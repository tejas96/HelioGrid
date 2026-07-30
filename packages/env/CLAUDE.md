# @heliogrid/env — the only package that may read a raw environment source

## What lives here / what must never live here
- `schema/` DESCRIBES shapes and never reads. `parse.ts` VALIDATES. Each entry module
  (`server.ts`, later `web.ts`/`native.ts`) is the ONLY place a raw source is touched.
- NEVER: business logic, a database or HTTP client, a framework import, or a second read path.
- **Secrets never carry `.default()`.** A dev fallback silently ships a predictable signing key
  to production. Absent secret ⇒ the app refuses to boot.
- **Non-secret defaults live IN THE SCHEMA**, never behind `??` at a call site. The `??` form
  scatters the real default across files and hides it from `.env.example`.

## Commands
pnpm --filter @heliogrid/env typecheck

## Where real values come from
- prod: Fly secrets. local: `.env.local` (git-ignored), loaded by Node's
  `--env-file-if-exists` on the api/worker `dev`/`start` scripts and by Next for apps/web.
  A real environment variable always WINS over the file, so CI and Fly are never overridden.
- `db migrate` and the invariants runner take the URL from the SHELL — the value is expanded
  before Node starts, so the flag cannot help. `set -a; . ./.env.local; set +a` for a session.
- This package is the source of truth for WHICH variables exist and their shape;
  `.env.example` documents them; neither ever holds a real secret.

## Depends on / depended on by
uses: zod (pinned 3.25.76)
used by: apps/api, apps/worker, tests/invariants (via `./server`); apps/web, apps/mobile
next (Task 35). NOT packages/db — its migrator takes the URL as a parameter — and NOT
packages/domain, which may never read the environment (ADR-0021).

## Local conventions
- Adding a variable means editing a schema HERE and `.env.example`, and nothing else.
- `parseEnv` THROWS; it never calls `process.exit`. A library that exits kills its host and
  cannot be exercised. Each app's `src/config/env.ts` decides what failure means — for a
  server that is `console.error` + `exit(1)`, before any logger or DI container exists.
- Loaders are functions, not top-level consts, and memoize. Importing this module therefore
  has no side effect: a consumer that never calls a loader never reads the environment.
- One definition per type: `ApiEnv` comes from the schema and is re-exported, never
  re-declared, or the same name would mean two things depending on the import path.

## Landmines
- **Turborepo boundaries tag is `env`, allowed ONLY from the `app` tag.** That is what makes
  "only apps read the environment" mechanical rather than conventional. Do not add `env` to
  another tag's allowlist to unblock an import — the import is the thing that is wrong.
- **This package was NOT merged into `packages/config`** (owner question, 2026-07-30). That
  package is tsconfig presets: two JSON files, no `src/`, no dependencies, a devDependency
  everywhere. Crucially, every tag's allowlist includes `config` because every package needs
  the presets — including `domain`, whose purity rule does not name `config`. Env living there
  would let `packages/domain` read the environment with neither boundaries nor
  dependency-cruiser objecting.
- **Three mechanisms guard this, and adding a read means editing TWO of them on purpose.**
  Biome `noProcessEnv` catches a file; `pnpm check:env` (scripts/check-env-access.mjs) catches
  the repo, so widening the Biome allowlist alone does not let a read through; the Turborepo
  `env` tag stops non-apps importing this package at all.
- Audited exceptions are three, each with a reason in `scripts/check-env-access.mjs`:
  `packages/env/src/**`, `apps/web/lib/env.ts` (Next inlines `NEXT_PUBLIC_*` only in code IT
  compiles, so the literal cannot live in this pre-built package), and
  `scripts/check-openapi-breaking.mjs` (a developer-tool override read before any app loads).
- The repo-level check matches `process.env`, NOT `process.env.` — the trailing dot misses
  `safeParse(process.env)`, which is how apps/api and apps/worker read it. It also strips
  comments first, because several files legitimately discuss `process.env` while explaining
  why they must not read it.

## Definition of done here
Every variable declared in a schema and documented in `.env.example` · no `process.env` read
outside this package · a missing required value fails at STARTUP naming the key.
