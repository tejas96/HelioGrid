# HelioGrid — constitution

Multi-tenant SaaS for solar EPC companies — India-first, global-capable: CRM → survey →
3D design → proposal → customer link → voice follow-up → projects → payments. The 3D Design
Studio is the flagship. Light-only v1 · EN/HI/MR · tenant-currency money (INR v1).

**This file states the invariants.** `docs/engineering/architecture.md` places every file ·
`.claude/protections.md` says which tool, rule or test holds each protection · each package's
`CLAUDE.md` holds its own rules and traps and loads when you work there.

## 1. Core principles

**Think before coding.** State assumptions. Two readings the PRD supports → take the simplest, write
it into the task with one reason, and say it out loud. A feature or a number no PRD row implies is
the owner's: stop and ask.

**Propose a better approach when you see one** — with an example in *this* codebase and the cost to
switch. Never switch silently.

**Keep changes minimal.** Solve the requested problem only. Remove what your change orphaned.

**Verify reality.** A claim about this repo names the file and line that proves it. A bug is
reproduced on the RUNNING app, never a mock. Read failures, not exit codes, and call sites, not
declarations. A check you add or change is trusted only after it fires on a planted bad line.

**Every mistake leaves a record.** A mistake found in the work — yours, a reviewer's, a check's or
the owner's — is fixed at once and listed in the PR body by its kind. One a rule could have
prevented gets that rule where it fires, as a type, a lint rule or a test wherever one can decide it.
A harness fault met during a task goes to `docs/tasks/deferred.md` and is fixed in its own change.

**The harness earns its size.** A rule, check or agent is added only with what it replaces or the
cost it saves. **No new script:** a code fact goes into a type, Biome, dependency-cruiser or a test;
anything else is a skill step. Ask the owner before adding a script or a command.

## 2. The Laws

Stable ids — never reused or renumbered; a gap is a law that was removed.

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
10. **Platform purity.** Shared packages hold no DOM, no React Native, no Node-only API outside a
    declared server entry.
11. **Flows are authored once.** Shared state vocabulary and view-model types live in a shared
    package before either screen consumes them. Screens render; they don't hold policy.
12. **A new fact joins its guard.** A brand, an enum, a token, a route, a table or an error code
    your change adds is enrolled with the check that holds its kind, in the same change. A kind no
    check holds is said out loud, never assumed safe. Prose and design have no check: a reviewer and
    the owner hold them.

## 3. Workflow

One fresh session per task, and one task per PR. The work follows ONE order: the next step `/start`
picks from `docs/build-order.md` — build a task, the owner draws a screen, or the owner clears a
blocker. Inside a module it is design → backend → UI.

| step | who | stops for the owner |
|---|---|---|
| `/start` | picks the step, critiques the task, writes the plan, the acceptance criteria and the QA plan; `design-reviewer` for a screen, `plan-reviewer` for money, tenancy, permissions or schema | yes — the go |
| build | the main session, inside the plan | only when the scope changes |
| `/qa` | the suites, then one QA agent per surface the change reaches, in parallel; fix and re-check what failed | when a check fails three times |
| `/ship` | `code-reviewer` once, the fixes and red proofs, the commit, the push, the PR, CI | yes — every commit |

**Build:**

1. Tests first: each acceptance line's test before its code (`.claude/rules/testing.md`).
2. Stay in the plan's scope. A new behaviour, table, route, contract or package → stop and ask.
3. After each change, `pnpm check`.
4. A schema change runs `/migration`; a contract change runs `/contract-change`.
5. A bug outside the scope goes to `docs/tasks/deferred.md`, never into this diff.
6. When done, one tidy pass over the diff — reuse, names, dead code — then `pnpm check:all` once,
   then `/qa`.
7. After a source file is deleted or a branch switches, a stale `dist/` can keep a check red on code
   that is gone: `pnpm turbo build --force`.

**A PR is one complete task:** every acceptance line met and proven before it opens; a task that is
really two is split at `/start`. **One review per change:** findings are fixed and the work ships.

## 4. Stop and ask the owner before

- Anything billable or external-account-shaped (cloud, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- A layer conflict §7 does not resolve.
- A feature or a number no PRD row implies. A decision that belongs to a LATER module is not an ask:
  write it into that module's task in `docs/tasks/`, and carry on.
- **Committing.** Every commit waits for its own yes, given to the shown file list and message; a
  go, a green check or the yes to an earlier commit is never that yes. The task's Status turns
  `shipped` in that commit; then push and raise the PR. The owner merges. `main` is PR-only; never
  `--no-verify`, never a force-push.

## 5. Commands

| | |
|---|---|
| `pnpm infra:up` · `pnpm infra:down` | **Before anything.** One Postgres container (3 databases) + Temporal, from a clean clone. |
| `pnpm check` | **While building.** Biome on what differs from `origin/main`, the typecheck of the changed packages, and the related unit tests. Fast, and never the proof. |
| `pnpm check:all` | **Once, when the build is done.** Build → lint (Biome and its plugins, dependency-cruiser, sherif, turbo boundaries) → typecheck → duplication → OpenAPI freshness → catalog freshness → every unit test → the invariants. The two freshness checks rewrite a stale file before they fail — commit the fresh one. |
| `pnpm lint:fix` | Format and auto-fix. |
| `pnpm test:watch` · `pnpm test:coverage` | Tests while writing · the edge cases you missed (read it, not the pass count). |
| `pnpm db:migration:new` · `pnpm db:migrate` | Where a migration starts; never hand-author one. |

The database invariants need the local Postgres; without it they SKIP loudly, and over an empty
schema they report VACUOUS. Neither is a pass. Never weaken a check to make a change pass.

**Ports are dedicated, never reassigned** — web `3002` · api `8084` · metro `8081` · postgres
`5544` · object store `9000` · temporal `7233` · design exports `3004` · component tests `3100` ·
the worker has no listener. A busy port is a stale service: kill it, never fall back to another.
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
| `env` | the only reader of `process.env`. |
| `forms` · `data` · `config` | the form layer · the typed client · shared build config and the Biome plugins. |

| tree | what it is |
|---|---|
| `docs/prd/` · `docs/ux/briefs/` · `docs/tasks/` | the product spec · one brief per screen · engineering work. **Source of truth.** |
| `docs/engineering/` | how this repo is built, ranked **below** `docs/prd/`. |
| `.claude/` | the agent's own instructions — `skills/`, `agents/`, `hooks/`, `rules/` and `protections.md`, a closed set. `rules/` is law that spans MORE than one package; a rule for exactly one package lives in that package's own `CLAUDE.md`. |
| `infra/` · `HelioGrid-UX/` | deployment and local-stack material that is NOT application code · the exported Claude Design artboards and decisions records, one pair per screen — the pixel-perfect reference a screen is built and measured against; never edited, re-exported when a design changes, ignored by git. |

Everything public is re-exported from a package's `src/index.ts`; consumers import the index, never
a deep path. **Never invent a folder**: every tree is a closed set, and a new category is a
plan-time decision. `docs/README.md` maps every document.

## 7. When rules conflict

Higher wins: **the product spec (`docs/prd/`; a row carries its own ruling) →
`docs/engineering/architecture.md` → contracts → design system → this file → package `CLAUDE.md`
→ implementation detail.** A package `CLAUDE.md` beats a cross-cutting rule, being closer to the
code; between two records the later-dated one wins. If a doc and the code disagree, fix the doc or
ask.

## 8. Coding standards

Every line, every app, every package.

- **A shared fact is UNSPEAKABLE outside its owner.** If a consumer could type the value itself, it
  will be typed twice: give it a branded type in its owner, so importing is the only way to obtain
  one. Never `as <Brand>` outside that package. Owners: money and policy numbers → `domain` ·
  user-visible copy → `i18n` · vocabularies → `domain`, derived in `contracts` · visual values →
  `theme` · queries → `db` · wire calls → `data`.
- **Zero duplication.** Search before you write. A second copy of a definition, a formula or a
  shape is a defect even when both copies are correct — they will diverge.
- **Code reads like English or it is rewritten.** Names say WHAT, never how; a reader new to this
  codebase follows a function top to bottom without scrolling back. Needing a comment to explain it
  means the code is wrong. A comment states the CONSTRAINT — what breaks if you change this — and
  never a date; when and why it changed goes in the commit.
- **Solve today's problem.** No speculative abstraction, no config for one caller, no indirection
  for a future that has not been specified.
- **Shape.** Files ≲300 lines, split by responsibility and named for what they do — never
  `*2`/`*-extra`, never for a layer or a document id · no `any`, `!`, `==`, or `console.log` in
  anything SERVED · style outside the component file · no app-declared enum, union, lookup or
  policy number · `process.env` read only in `packages/env` · a package compiles and typechecks
  with `tsc -p`, never `tsc -b`.
- **Queries are correct the first time.** Index-backed, no N+1, no `select *`, no unbounded scan,
  every tenant-scoped read carrying its tenant predicate.
- **Every boundary has a contract.** Nothing crosses a package or process edge on an inferred or
  `any` shape; where two sides must agree, the agreement is a type in `packages/contracts`.
- **A release is safe at every step of its roll.** Machines roll one by one, apps in the field
  update weeks late, and a workflow or job started before a release runs on after it. A change to
  anything stored or sent between runtimes — a row, a column, an enum value, a response, a workflow
  message, a queued job, a cached payload, a pack — names who reads it and proves both directions:
  every OLDER reader still running reads the NEW shape, and the new code reads everything the old
  one wrote. What cannot be read both ways ships in two releases: expand, then contract.
- **A bug you find is reported at once.** Inside the task's scope it is fixed now. Outside it, it
  goes to `docs/tasks/deferred.md` as one row — the issue, the next step and who picks it up —
  never inside the current change, and never parked.
- **Dependencies change only through `pnpm add`/`pnpm remove`** — never a hand-edited dependency
  block or lockfile. **The database is read-only to you**: schema through a migration, data through
  the application.
- **Testing law is `.claude/rules/testing.md`.**

Writing rules, not code: a rule carries no date (a trap goes to its package's `CLAUDE.md`, and when
and why something changed is the commit's job) · one fact lives in one file — cite it, never restate
it · say the instruction plainly, in words a new reader can act on.

## 9. Product law

Digest of the foundations `F1`–`F8`, which are canonical.

- Every user-visible number carries a provenance tier: measured / derived / estimated / assumed.
- Money never renders stale — design changed and quote not recomputed reads provisional.
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
