# HelioGrid — constitution

Multi-tenant SaaS for solar EPC companies — India-first, global-capable: CRM → survey →
3D design → proposal → customer link → voice follow-up → projects → payments. The 3D Design
Studio is the flagship. Light-only v1 · EN/HI/MR · tenant-currency money (INR v1).

## 1. Core principles

**Think before coding.** State assumptions. Two readings the PRD supports → take the simplest, write
it into the task with one reason, and say it out loud.

**Propose a better approach when you see one** — with an example in *this* codebase and the cost to
switch. Never switch silently.

**Keep changes minimal.** Solve the requested problem only. Remove what your change orphaned.

**Verify reality.** A claim about this repo names the file and line that proves it. A bug is
reproduced on the RUNNING app, never a mock. Read failures, not exit codes, and call sites, not
declarations. A check you add or change is trusted only after it fires on a planted bad line.

**Every mistake leaves a record.** A mistake found in the work — yours, a reviewer's, a check's or
the owner's — is fixed at once and listed in the PR body by its kind. One a rule could have
prevented gets that rule where it fires, as a type, a lint rule or a test wherever one can decide it.

**No new script.** A code fact goes into a type, Biome, dependency-cruiser or a test. Ask the owner
before adding a script or a command.

## 2. The Laws

Law ids are stable — never reuse or renumber one.

1. **Foundation before features.** Feature modules build only on landed foundation.
3. **Contracts before code.** requirements → domain model → contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
5. **Reuse before creation.** Search first; creating what exists is a defect.
7. **One prop contract per shared component.** Both platform files implement the one
   `<Name>.types.ts`; a prop belongs to that contract, never to a single platform.
8. **Fix the docs your change made wrong** — same commit. A change that DELETES or MOVES files
   searches `.claude/`, `docs/`, `.github/`, the configs and `.env.example` for the dead paths.
9. **Incremental schema & API growth.** Tables, enums, contracts and endpoints are authored only
   when their owning module's slice begins.
10. **Platform purity.** A shared package holds no DOM, React Native or Node-only API outside a
    declared platform entry — ui's `.tsx`/`.native.tsx` halves, i18n's `./rn`, a `./server` entry.
11. **Flows are authored once.** Shared state vocabulary and view-model types live in a shared
    package before either screen consumes them. Screens render; they don't hold policy.
12. **A new fact joins its guard.** A brand, enum, token, route, table or error code you add is
    enrolled with the check that holds its kind (`.claude/protections.md` names it) in the same
    change; a kind no check holds is said out loud.

## 3. Workflow

The work follows ONE order, `docs/build-order.md` — the next open part of
a split task, build a task, the owner draws a screen, or the owner clears a blocker. Inside a module
it is design → backend → UI.

| step | what | stops for the owner |
|---|---|---|
| plan | read the task, write its RFC into it | yes — approve RFC |
| build | inside the RFC | only when the scope changes |
| verify | `pnpm check:all`, then the change on the running app | when a check fails three times |
| commit | the commit, the push, the PR, CI | yes — every commit |

**One turn, many calls.** Batch every read, search and check that does not wait on another's result
into one turn.

**Build:**

1. Tests first: each acceptance line's test before its code (`.claude/rules/testing.md`).
2. Stay in the RFC's scope. A new behaviour, table, route, contract or package → stop and ask.
3. After each change, `pnpm check`.
4. When done, one tidy pass over the diff — reuse, names, dead code — then `pnpm check:all` once.
5. After a source file is deleted or a branch switches, a stale `dist/` can keep a check red on code
   that is gone: `pnpm turbo build --force`.

**A PR is one complete task or part:** every acceptance line met and proven before it opens; an RFC
over about 30 files splits into parts, web and phone together.

## 4. Stop and ask the owner before

- Anything billable or external-account-shaped (cloud, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- A layer conflict §7 does not resolve.
- A feature or a number no PRD row implies. A decision that belongs to a LATER module is not an ask:
  write it into that module's task in `docs/tasks/`, and carry on.
- **Committing.** Each commit waits for the owner's yes to the shown file list and message — a go,
  a green check or an earlier yes never counts. In that commit the task's Status (or the part's row
  in its Parts table) turns `shipped`; then push and open the PR. The owner merges. Never
  `--no-verify`, never force-push.

## 5. Commands

| | |
|---|---|
| `pnpm infra:up` · `pnpm infra:down` | **Before anything.** Postgres (3 databases), the object store and Temporal. |
| `pnpm check` | **While building.** Biome on files that differ from `origin/main`, the workspace typecheck (cached), and `vitest related` on changed .ts files. Fast; never the proof. |
| `pnpm check:all` | **Once, when the build is done.** Build, lint (Biome, dependency-cruiser, sherif, turbo boundaries), typecheck, duplication, OpenAPI and catalog freshness, unit tests, invariants. A stale OpenAPI or catalog file is rewritten and the check fails — commit the fresh file. |
| `pnpm lint:fix` | Format and auto-fix. |
| `pnpm test:watch` · `pnpm test:coverage` | Tests while writing · the edge cases you missed (read it, not the pass count). |
| `pnpm db:migration:new` · `pnpm db:migrate` | Where a migration starts; never hand-author one. |

The database invariants need the local Postgres; without it they SKIP loudly, and over an empty
schema they report VACUOUS. Neither is a pass. Never weaken a check to make a change pass.

**Ports are dedicated** — web `3002` · api `8084` · metro `8081` · postgres `5544` · object store
`9000` · temporal `7233` · component tests `3100`; the worker has none. A running HelioGrid server is
reused; a foreign listener on a dev port is freed on purpose with `clean-dev-ports` — a start never
kills it and never moves to another port. A busy infra port means the stack is already up.
Start web, api and metro through the browser preview tool; `pnpm --filter @heliogrid/mobile
ios|android` drives metro.

## 6. Where everything lives

**`docs/engineering/architecture.md` is the authority** — §2 what each package owns and may
import, §4 where a new file goes. Run §4 before creating one. This is the digest.

| package | owns |
|---|---|
| `contracts` | enums, wire shapes, string-literal unions, ports, workflow messages. The API review surface. |
| `domain` | logic, policy numbers, formatters, money maths. Pure — no clock, no I/O. |
| `theme` | every visual value. Generated; never hand-edited. |
| `ui` | one component package, both platforms (`.tsx` + `.native.tsx`). |
| `db` | schema and append-only migrations. |
| `i18n` | every user-visible string. |
| `env` | env schemas and loaders — the only `process.env` reader outside the `noProcessEnv` override in `biome.json`. |
| `forms` · `data` · `config` | the form layer · the typed client · shared build config and the Biome plugins. |

| tree | what it is |
|---|---|
| `docs/prd/` · `docs/ux/briefs/` · `docs/tasks/` | the product spec · one brief per screen · engineering work. **Source of truth.** |
| `docs/engineering/` | how this repo is built. |
| `.claude/` | closed set: `rules/` (law spanning more than one package — a one-package rule goes in its `CLAUDE.md`), `protections.md`, `launch.json` (dev servers), `skills/task/` (the one step runner — it walks the order and holds the two gates), `agents/` (its read-only helpers), `settings.json` (hard-safety denies). |
| `.qa/` | git-ignored: `api.log`, `web.log`, `metro.log` — the development logs the launch configurations append to and the e2e suite reads. |
| `.ops/` | the owner's private infra record, git-ignored: every external account, project and client id, what is still owed, and each environment's values (`dev.env`, `prod.env`). A console change updates it in the same sitting. |
| `infra/` | deployment and local-stack material that is NOT application code. |
| the Claude Design project | NOT in the repo: each screen's board and decisions record — the pixel-perfect reference. A task's `DESIGN:` line links it; read it with `DesignSync`; keep no copy on disk. A studio screen (`ported from the POC`) has none. |

Import a package only through an entry its `package.json` `exports` declares. **Never invent a folder**: every tree is a closed set, and a new category is a
plan-time decision. `docs/README.md` maps every document.

## 7. When rules conflict

Higher wins: **the product spec (`docs/prd/`; a row carries its own ruling) →
`docs/engineering/architecture.md` → contracts → design system → this file → package `CLAUDE.md`
→ implementation detail.** A package `CLAUDE.md` beats a cross-cutting rule, being closer to the
code; between two records the later-dated one wins. If a doc and the code disagree, fix the doc or
ask.

## 8. Coding standards

- **A shared fact is unspeakable outside its owner.** If a consumer could type the value itself,
  make it a branded type in its owner so importing is the only way to get one. Owners: money and policy numbers → `domain` ·
  user-visible copy → `i18n` · vocabularies → `domain`, derived in `contracts` · visual values →
  `theme` · queries → `db` · wire calls → `data`.
- **Zero duplication.** A second copy of a definition, formula or shape is a defect even when both
  are correct — they will diverge.
- **Code reads like English or it is rewritten.** Names say WHAT, never how; a reader new to this
  codebase follows a function top to bottom without scrolling back. Needing a comment to explain it
  means the code is wrong. A comment states the CONSTRAINT — what breaks if you change this — and
  never a date; when and why it changed goes in the commit.
- **Solve today's problem.** No speculative abstraction, no config for one caller, no indirection
  for a future that has not been specified — unless a PRD row asks for the extension point; then
  it is built, and an acceptance line proves it.
- **Shape.** A file stays under 300 lines, split by responsibility and named for what it does —
  never `*2`/`*-extra`, never for a layer or a document id. A package builds and typechecks with
  `tsc -p`, never `tsc -b`.
- **Queries are correct the first time.** Index-backed, no N+1, no `select *`, no unbounded scan,
  every tenant-scoped read carrying its tenant predicate.
- **Every boundary has a contract.** Nothing crosses a package or process edge on an inferred or
  `any` shape; where two sides must agree, the agreement is a type in `packages/contracts`.
- **A release is safe at every step of its roll.** Old app versions, old machines and running
  workflows outlive a release. A change to anything stored or sent between runtimes (row, column,
  enum value, response, workflow message, queued job, cached payload, pack) names its readers and
  proves both ways: old readers read the new shape, new code reads what the old wrote. If it can't,
  ship two releases: expand, then contract.
- **A bug you find is reported at once.** In scope: fix it now. Out of scope: one row in
  `docs/tasks/deferred.md` (issue, next step, `reopens when`), never in this diff.
- **Dependencies change only through `pnpm add`/`pnpm remove`** — never a hand-edited dependency
  block or lockfile. **The database is read-only to you**: schema through a migration, data through
  the application.

## 9. Product law

Digest of the foundations `F1`–`F8`, which are canonical.

- Every user-visible number carries a provenance tier: measured / derived / estimated / assumed —
  an identifier, and a count of the reader's own listed records, excepted (`F8-01`).
- Money never renders stale — a design changed since the proposal was computed reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ payments reconcile to the currency's minor unit.
- One market and one currency per tenant; market facts (tax, stages, checklists, rails, phone spec)
  resolve from versioned market packs, never hard-coded.
- Sent proposals keep their prices; a price-book update creates a new version.
- Structural adequacy is NEVER computed — an engineer signs off, and the disclaimer travels with
  every structure-bearing output.
- Money renders in the tenant currency's grouping in every locale (INR: lakh/crore); kW/kWh/kWp are
  never translated.
- Read and export work regardless of billing state. Never hold data hostage.
- The server assigns business identifiers. No feature flags — entitlements are the only gating.
