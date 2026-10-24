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
declarations. A check you add or change is trusted only after it fires on a planted bad line
(`.claude/rules/testing.md`).

**Every mistake leaves a record.** A mistake found in the work — yours, a reviewer's, a check's or
the owner's — is fixed at once and listed in the PR body by its kind. One a machine could have
caught gets that check: a type, a lint rule or a test. One no machine can decide gets one line in
`.claude/agents/code-reviewer.md`, `rfc-template.md`, `board-check.md`, `docs/start-here.md` *The
checklist* or its package's `CLAUDE.md` Traps — never a new rule file or a new step.

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

The work follows ONE order, `docs/build-order.md`, and `/task` (`.claude/skills/task/SKILL.md`)
runs it: one task per session, one PR per task. Design is checked and locked a module ahead of the
build (`.claude/skills/task/design-track.md`), so the build waits only when that track falls behind.

| step | what | stops for the owner |
|---|---|---|
| pick · analyse · RFC | the next task; its gaps; its RFC, checked by `rfc-reviewer` | yes — approve the RFC, once; a part inside the approved task RFC with no open decision needs none |
| build | inside the approved RFC | when scope voids the approval |
| verify | `code-reviewer`, then QA on the changed surfaces in parallel, then clean up, then `pnpm check:all` | when a finding or a failing row survives its fixes |
| ship | commit, push, open the PR, CI | yes — every commit, then the owner merges the PR |

**One turn, many calls.** Batch every read, search and check that does not wait on another's result
into one turn.

**Build:** `/task` step 5 — tests first, inside the RFC's scope, two attempts per step, then one
tidy pass, review, local QA and the gate. After a source file is deleted or a branch switches, a
stale `dist/` can keep a check red on code that is gone. `tsc -p` never removes old output, so
delete the app's git-ignored `dist/` (`rm -r apps/api/dist`), then `pnpm turbo build --force`.

**A PR is one complete task:** every acceptance line is met and proven before it opens, or by its
CI lane. A task splits into parts only on the owner's word (`/task` step 3). The RFC's shape and
its edge-case list are `.claude/skills/task/rfc-template.md`.

## 4. Stop and ask the owner before

- Anything billable or external-account-shaped (cloud, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- A layer conflict §7 **When rules conflict** does not resolve.
- A feature or a number no PRD row implies. A decision that belongs to a LATER module is not an ask:
  write it into that module's task in `docs/tasks/`, and carry on.
- **Building before the RFC is approved.** Nothing is built before the owner's yes to the RFC.
- **Committing.** Each commit waits for the owner's yes to the shown file list and message — a go,
  a green check, an approved RFC or an earlier yes never counts; one yes covers a change commit and
  its clean merge of `origin/main` when they are shown together. Then push and open the PR (`/task`
  step 9). The owner merges. Never `--no-verify`, never force-push, never push to `main`.

## 5. Commands

| | |
|---|---|
| `pnpm infra:up` · `pnpm infra:down` | Before infra-dependent work. The read-only build-order walk and RFC need no stack. |
| `pnpm check` | **While building** (`/task` step 5). Biome on files that differ from `origin/main`, the workspace typecheck (cached), dependency-cruiser, sherif, turbo boundaries, duplication, `vitest related` on changed .ts files, the domain's 100% coverage bars when a barred domain source changed, catalog freshness when copy, ui or app files changed, and OpenAPI freshness and oasdiff when a contract changed. Fast; never the proof. |
| `pnpm check:all` | **Normally once, after review and live QA.** Build, lint (Biome, dependency-cruiser, sherif, turbo boundaries), typecheck, duplication, OpenAPI freshness and oasdiff 1.31.0 against `origin/main`, catalog freshness, unit tests, invariants. Run it on the test database; how often, and when a failure stops for the owner: `/task` step 8. |
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
| `.claude/` | closed set: `rules/` (law spanning more than one package — a one-package rule goes in its `CLAUDE.md`), `protections.md`, `launch.json` (dev servers), `skills/task/` (the one step runner, its RFC template, the design track and the board check), `agents/` (its read-only helpers), `settings.json` (hard-safety denies, the asks before every commit and merge, and the plugins switched off here because `skills/task/` is the one step runner). |
| `.qa/` | git-ignored: `api.log`, `web.log`, `metro.log` — the development logs the launch configurations append to and the e2e suite reads — and `components/<name>/`, the pictures a component spec saves. A task deletes the screenshots it made before its PR opens. |
| `.design/` | committed, written only by the Design track's lock: `<module>/`, that module's locked boards and the support files they load — each one exactly as the Design track checked it, read from the module's canvas — and `design-system.version`, the canvas's design system version at the lock; a read-only copy. A screen is built only while its boards here equal a fresh read (`/task` step 1). |
| `.ops/` | the owner's private infra record, git-ignored: every external account, project and client id, what is still owed, and each environment's values (`env/dev.env`, `env/prod.env`). A console change updates it in the same sitting. |
| `infra/` | deployment and local-stack material that is NOT application code. |
| the module canvases | NOT in the repo: one Design artifact in Claude per module (`docs/start-here.md`, *The canvases*), holding each screen's boards and a copy of the design system artifact — the source of truth for design. Claude Code draws and fixes the boards; the owner reviews them there, and the owner's yes locks them. A task's `DESIGN:` line links the canvas; the Design track (`.claude/skills/task/design-track.md`) locks a copy in `.design/`. A studio screen (`ported from the POC`) has none. |

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
