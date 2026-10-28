# @heliogrid/env — the only package that may read a raw environment source

## What lives here / what must never live here

- `schema/` DESCRIBES shapes and never reads. `parse.ts` VALIDATES. Each entry module —
  `server.ts`, `web.ts`, `native.ts` — is the ONLY place a raw source is touched, and
  `temporal.ts` (re-exported by `server.ts`) reads the Temporal credential files. `server.ts`
  reads Node's `process.env` itself; `web.ts` and `native.ts` take the source as a PARAMETER,
  because neither platform has one this package can reach.
- **A secret never carries `.default()`.** A dev fallback silently ships a predictable signing key
  to production. An absent secret means the app refuses to boot.
- **A non-secret default lives IN THE SCHEMA**, never behind `??` at a call site — that form
  scatters the real default across files and hides it from `.env.example`.

## Where real values come from

Production reads the production host's secrets; local is `.env.local` (git-ignored), loaded by
Node's `--env-file-if-exists` on the api and worker scripts and by Next for web. A real environment
variable always WINS over the file, so CI and the production host are never overridden.

## Local conventions

- A new variable is a schema edit here plus a line in `.env.example`; neither ever holds a real
  secret.
- `parseEnv` throws, never exits: each app's env module decides what failure means. Loaders are
  memoized functions, so importing this package reads nothing.
- Audited exceptions to the repo-wide read ban are the `noProcessEnv` override in `biome.json`,
  each path named there. That override is the authority — do not "fix" an entry you find there.
- A dedicated port is written ONCE: `API_PORT_DEFAULT` here is what the api's default, the web's
  dev origin and the phone's fallbacks read (`CLAUDE.md` §5); no check holds this, review does.
- **Never move env into `packages/config`**: every tag may import `config`, `domain` included, so
  a pure package could then read the environment with no gate objecting.

## Done means

A missing required value fails at STARTUP, naming the key.
