# HelioGrid — constitution

Multi-tenant SaaS for solar EPC companies — India-first, global-capable: CRM → survey →
3D design → proposal → customer link → voice follow-up → projects → payments. The 3D Design
Studio is the flagship. Light-only v1 · EN/HI/MR · tenant-currency money (INR v1).

## 1. Core principles

**Two readings the PRD supports** → take the simplest, write it into the task with one reason, and
say it out loud.

**Propose a better approach when you see one** — with an example in *this* codebase and the cost to
switch. Never switch silently.

**Verify reality.** A claim about this repo names the file and line that proves it. A bug is
reproduced on the RUNNING app, never a mock. Read failures, not exit codes, and call sites, not
declarations. A check you add or change is trusted only after it fires on a planted bad line
(`.claude/rules/testing.md`).

**Every mistake leaves a record.** A mistake found in the work — yours, a reviewer's, a check's or
the owner's — is fixed at once and listed in the PR body by its kind. One a machine could have
caught gets that check: a type, a lint rule or a test. One no machine can decide gets one line in
`.claude/skills/task/SKILL.md`, `.claude/agents/code-reviewer.md` or `qa-live.md`, `board-check.md`,
`docs/start-here.md` *The checklist* or its package's `CLAUDE.md` Traps — never a new rule file or
a new step.

**No new script.** A code fact goes into a type, Biome, dependency-cruiser or a test. Ask the owner
before adding a script or a command.

**A rule is written once, plainly, with no date** — cite it elsewhere, never restate it; when and
why it changed is the commit's job.

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

The work follows ONE order, `docs/build-order.md`, and `/task` (`.claude/skills/task/SKILL.md`)
runs it: one task, one session, one PR. The session decides, builds, proves and ships; the owner
merges. Design is checked and locked a module ahead of the build
(`.claude/skills/task/design-track.md`), so the build waits only when that track falls behind.

**A PR is one complete task:** every acceptance line is met and proven before it opens, or by its
CI lane. After a source file is deleted or a branch switches, a stale `dist/` can keep a check red on code that is gone: `tsc -p` never removes
old output, so delete the app's git-ignored `dist/` (`rm -r apps/api/dist`), then
`pnpm turbo build --force`.

## 4. What the owner keeps

- **The merge.** Every PR is merged by the owner. Never `--no-verify`, never force-push, never
  push to `main` (`.claude/settings.json` denies them).
- **Anything billable or external-account-shaped** (cloud, store accounts, paid APIs): stop and ask.
- **Their data and machines:** never write the database directly, never touch a product volume,
  never stop what they left running except as `/task` says.

Everything else is decided in the session and written down with one reason: a reading of the PRD
(the simplest that meets the row), a layer conflict (§7), a fix outside the task (a
`docs/tasks/deferred.md` row). Nothing is built that no PRD row implies. Schema or API work a later
module owns (Law 9) is written into that module's task in `docs/tasks/`, never built here.

## 5. Commands

| | |
|---|---|
| `pnpm infra:up` · `pnpm infra:down` | Before infra-dependent work. The read-only build-order walk and RFC need no stack. |
| `pnpm check` | **While building.** Biome on files that differ from `origin/main`, the workspace typecheck (cached), dependency-cruiser, sherif, turbo boundaries, duplication, `vitest related` on changed .ts files, the domain's 100% coverage bars when a barred domain source changed, catalog freshness when copy, ui or app files changed, and OpenAPI freshness and oasdiff when a contract or domain source changed. Fast; never the proof. |
| `pnpm check:all` | **Normally once, after review and live QA.** The full gate; what it runs is `.claude/protections.md`, top. Run it on the test database, as `/task` does. |
| `pnpm lint:fix` | Format and auto-fix. |
| `pnpm test:watch` · `pnpm test:coverage` | Tests while writing · the edge cases you missed (read it, not the pass count). |
| `pnpm db:migration:new` · `pnpm db:migrate` | Where a migration starts; never hand-author one. |

The database invariants need the local Postgres; without it they SKIP loudly, and over an empty
schema they report VACUOUS. Neither is a pass. Never weaken a check to make a change pass.

**Ports are dedicated** — web `3002` · api `8084` · metro `8081` · postgres `5544` · object store
`9000` · temporal `7233` · component tests `3100`. Reuse a healthy HelioGrid service; free a
foreign listener only through `clean-dev-ports`, never by port or process name.

## 6. Where everything lives

**`docs/engineering/architecture.md` is the authority** — §2 owns package responsibilities and
allowed imports; §4 decides where a new file goes. Run §4 before creating one.

| tree | what it is |
|---|---|
| `docs/prd/` · `docs/ux/briefs/` · `docs/tasks/` | the product spec · one brief per screen · engineering work. **Source of truth.** |
| `docs/engineering/` | how this repo is built. |
| `.claude/` | closed set: `rules/` (law spanning more than one package — a one-package rule goes in its `CLAUDE.md`), `protections.md`, `launch.json`, `skills/task/` (the one step runner), `agents/`, `hooks/`, `settings.json`. |
| `.qa/` | git-ignored: `api.log`, `web.log`, `metro.log` — the development logs the launch configurations append to and the e2e suite reads — `components/<name>/`, the pictures a component spec saves, and the `<name>.log` files a task's checks write. A task deletes the trees and temporary files it made before its PR opens, and keeps the logs. |
| `.design/` | committed, written only by the Design track's lock (`design-track.md`): each module's locked boards and `design-system.version`; a read-only copy. |
| `.ops/` | the owner's private infra record, git-ignored: every external account, project and client id, what is still owed, and each environment's values (`env/dev.env`, `env/prod.env`). A console change updates it in the same sitting. |
| `infra/` | deployment and local-stack material that is NOT application code. |
| the module canvases | NOT in the repo: one Design artifact in Claude per module (`docs/start-here.md`, *The canvases*) — the source of truth for design; the owner's yes locks a board. A studio screen (`ported from the POC`) has none. |

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
  `theme` · schema and pools → `db`, queries → the api's `*.repository.ts` files · wire calls →
  `data`.
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
  block or lockfile. **Never write the database directly**: schema goes through a migration and
  test or development data through the application.

## 9. Product law

Digest of the foundations `F1`–`F8`, which are canonical.

- Every money and energy figure a user sees carries a provenance tier: measured / derived /
  estimated / assumed. Dates, times, counts, durations and progress carry none; nor do an
  identifier, a limit the product enforces or a value the company sets in its own settings (`F8-01`).
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
