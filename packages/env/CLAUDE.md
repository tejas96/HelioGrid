# @heliogrid/env — the only package that may read a raw environment source

Deps: `architecture.md` §2 env. Two deliberate non-consumers: `packages/db`, whose migrator takes
the URL as a parameter, and `packages/domain`, which is pure and takes injected context instead.

## What lives here / what must never live here

- `schema/` DESCRIBES shapes and never reads. `parse.ts` VALIDATES. Each entry module —
  `server.ts`, `web.ts`, `native.ts` — is the ONLY place a raw source is touched. `server.ts`
  reads Node's `process.env` itself; `web.ts` and `native.ts` take the source as a PARAMETER,
  because neither platform has one this package can reach.
- NEVER: business logic, a database or HTTP client, a framework import, or a second read path.
- **A secret never carries `.default()`.** A dev fallback silently ships a predictable signing key
  to production. An absent secret means the app refuses to boot.
- **A non-secret default lives IN THE SCHEMA**, never behind `??` at a call site — that form
  scatters the real default across files and hides it from `.env.example`.

## Commands

```
pnpm --filter @heliogrid/env build | typecheck
```

## Where real values come from

Production is Fly secrets; local is `.env.local` (git-ignored), loaded by Node's
`--env-file-if-exists` on the api and worker scripts and by Next for web. A real environment
variable always WINS over the file, so CI and Fly are never overridden. `db migrate` and the
invariants runner take the URL from the SHELL — the value is expanded before Node starts, so the
flag cannot help: `set -a; . ./.env.local; set +a` for a session.

This package is the source of truth for WHICH variables exist and their shape; `.env.example`
documents them; neither ever holds a real secret.

## Local conventions

- Adding a variable means editing a schema HERE and `.env.example`, and nothing else.
- **`parseEnv` THROWS; it never calls `process.exit`.** A library that exits kills its host and
  cannot be exercised. Each app's `src/config/env.ts` decides what failure means.
- Loaders are functions, not top-level consts, and they memoize. Importing this module therefore
  has no side effect: a consumer that never calls a loader never reads the environment.
- One definition per type: `ApiEnv` comes from the schema and is re-exported, never re-declared,
  or the same name would mean two things depending on the import path.
- Audited exceptions to the repo-wide read ban live in `scripts/check-env-access.mjs`'s `ALLOWED`
  array, each with its reason. That array is the authority — do not "fix" an entry you find there.
- **This package was NOT merged into `packages/config`** (owner question). Every tag's allowlist
  includes `config` because every package needs the presets, `domain` included — env living there
  would let a pure package read the environment with no gate objecting.

## Done means

Every variable declared in a schema and documented in `.env.example` · no `process.env` read
outside this package (`M5`) · a missing required value fails at STARTUP, naming the key.
