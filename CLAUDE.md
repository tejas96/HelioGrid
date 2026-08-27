# HelioGrid — constitution

Multi-tenant SaaS for solar EPC companies — India-first, global-capable: CRM → survey →
3D design → proposal → customer link → voice follow-up → projects → payments. The 3D Design
Studio is the flagship. Light-only v1 · EN/HI/MR · tenant-currency money (INR v1).

This file and `docs/engineering/architecture.md` are the two you must know; everything else loads when it applies.

## 1. Core principles

**Think before coding.** State assumptions. Two readings of a request → present both. Unclear →
stop and ask; never invent a requirement.

**Found a better approach? Propose it, with an example** in *this* codebase, and what it costs to
switch. A recommendation you withheld is a decision made on the owner's behalf. Never switch
silently — propose, then follow the answer.

**Keep changes minimal.** Solve the requested problem only. Remove what your change orphaned;
mention unrelated dead code, don't delete it.

**Verify reality.** A task is done when you have looked at it — "fix the bug" means reproducing it
on the real surface, then showing those steps pass. Read failures, not exit codes: a red probe
proves nothing until you know why, and **a green gate proves nothing until you have seen it go red
on an injected violation.** Read call sites, not declarations. Don't move on until 99% confident.

## 2. The Laws

Stable ids — never reused or renumbered; a gap is a law that was removed.

1. **Foundation before features.** Feature modules build only on landed foundation.
3. **Contracts before code.** requirements → domain model → contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
5. **Reuse before creation.** Search first; creating what exists is a defect.
7. **Shared component APIs stay in parity.** Held by a TYPE: both platform files import the one
   `<Name>.types.ts`. A prop on one platform only is a compile error.
8. **Fix the docs your change made wrong** — same commit. A change that DELETES or MOVES files
   greps `.claude/`, `docs/`, configs and `.env.example` for the dead paths.
9. **Incremental schema & API growth.** Tables, enums, contracts and endpoints are authored only
   when their owning module's slice begins.
10. **Platform purity.** Shared packages hold no DOM, no React Native, no Node-only API outside a
    declared server entry. Held by dependency-cruiser.
11. **Flows are authored once.** Shared state vocabulary and view-model types live in a shared
    package before either screen consumes them. Screens render; they don't hold policy.

## 3. Workflow

**Understand → build → `/verify` → `/finish`.**

Before writing code, say two things: **which package owns each new file**
(`docs/engineering/architecture.md` §4) and **what will prove it works**. Anything whose shape is
still in question gets settled with the owner first.

## 4. Stop and ask the owner before

- Anything billable or external-account-shaped (Fly, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- A layer conflict §7 does not resolve.
- A product-shaped finding (missing rule, UX gap, spec ambiguity) — record it in
  `docs/prd/registers/open-questions.md` or `docs/prd/registers/conflicts.md` first, then continue.
- **Committing, pushing, or opening a PR.** Each needs its own yes, every time. An instruction to
  do work is never approval to commit it, and one approval never carries to the next. `main` is
  PR-only; never `--no-verify`.

## 5. Commands

| | |
|---|---|
| `pnpm infra:up` | **Before anything.** One Postgres container (3 databases) + Temporal, from a clean clone. |
| `pnpm check:all` | **Before you push.** Fixes formatting, then every gate. Fast, no build, no DB. |
| `pnpm verify` | **The full proof.** Build · lint · boundaries · typecheck · all gates · invariants. |
| `pnpm db:migration:new` | The only way a migration is created. Never hand-author one. |

- `verify` needs a live postgres (`pnpm infra:up`, then `DATABASE_URL`) or the invariants fail —
  a run without one has NOT proven tenancy. **Read gate output, not exit codes**: an invariant
  over an empty schema reports VACUOUS, which is not a pass.
- Deleted a source file? `pnpm turbo build --force` — stale `dist/` keeps `boundaries` red.
- Enumerate with `git ls-files`, never a bare glob — in zsh one unmatched pattern aborts the
  command and prints nothing, which reads as "clean".
- **Never weaken a gate to make a change pass.**

**Ports are dedicated, never reassigned** — web `3002` · api `8084` · metro `8081` ·
postgres `5544` · temporal UI `8233` · worker has no listener. A busy port is a stale service:
kill it, never fall back to another. Start web/api/metro through the browser preview tool, which
reads `.claude/launch.json` and kills stale listeners first; iOS/Android are not servers —
`pnpm --filter @heliogrid/mobile ios|android` drives metro.

## 6. Where everything lives

**Never invent a folder.** Every tree is a closed set — a new category is a plan-time decision.

| package | owns |
|---|---|
| `contracts` | enums, wire shapes, string-literal unions, ports. The API review surface. |
| `domain` | logic, policy numbers, formatters, money maths. Pure — no clock, no I/O. |
| `theme` | every visual value. Generated; never hand-edited. |
| `ui` | one component package, both platforms (`.tsx` + `.native.tsx`). |
| `db` | schema and append-only migrations. |
| `i18n` | every user-visible string. |
| `env` | the only reader of `process.env`. |
| `forms`, `data`, `config` | the form layer · the typed client · shared build config. |

| tree | what it is |
|---|---|
| `docs/prd/` | **the product spec** — what the product does. Source of truth. |
| `docs/ux/briefs/` | one design brief per screen. Source of truth. |
| `docs/tasks/` | engineering work, one file per module. Source of truth. |
| `docs/engineering/` | how this repo is built. Ranked **below** `docs/prd/`. |
| `.claude/rules/` | path-scoped deltas — load automatically for the paths they name. |
| `infra/` | deployment and local-stack material that is NOT application code. |

Each app and package has its own `CLAUDE.md` — folder shape and landmines — loaded when you read
that folder. **Start from the right file; searching costs more than opening it:**

| doing | open |
|---|---|
| designing a screen | `docs/start-here.md` |
| building | `docs/build-order.md`, then `docs/tasks/<module>.md` |
| finding any doc | `docs/README.md` — the map, with a status per file |
| placing a new file | `docs/engineering/architecture.md` §4 |
| a first migration | `docs/engineering/forward-compat.md` |
| the screen register | `docs/prd/registers/screens.md` — 150 screens, 99 locked to V1 |
| the UI layer | `docs/engineering/17-ui-architecture-v2.md` |

**Naming.** A file is named for what it does — never `*-part2`/`*2`/`*-extra`, never for its
layer (a `components.tsx` grab-bag is the same defect). A split that needs a number is wrong.

## 7. When rules conflict

Higher wins, and don't re-declare at a lower level what a higher one already fixed:

**owner rulings (`docs/prd/registers/open-questions.md`, `conflicts.md`) → the product spec
(`docs/prd/`) → architecture (`docs/engineering/architecture.md`) → contracts → design system →
this file → package `CLAUDE.md` → implementation detail.**

Two tiebreakers: a **package `CLAUDE.md` beats a cross-cutting rule** — it is closer to the code
and has historically been the accurate one; and between two records, the **later-dated** one wins.
If a doc and the code disagree, fix the doc or ask.

**A rule is not enforced just because it is written.** Before trusting one, check whether a type, a
lint rule or an invariant actually holds it — several here are held only by review.

## 8. Coding standards

Every line, every app, every package. No exceptions for "just this once".

- **The gates hold the mechanics.** Formatting · `any`/`!`/`==`/`console.log` · env access ·
  **files ≲300 lines, split by responsibility** · no test files · style out of the component file ·
  no app-declared enum, union or lookup. All enforced — run `pnpm check:all` and fix what it says.
- **Zero duplication.** Before writing anything, search for it. A second copy of a definition,
  a formula or a shape is a defect even when both copies are correct — they will diverge.
  `check:dupes` catches clones of 12+ lines; a duplicated constant or a re-derived formula it
  cannot see, and that one is yours to refuse.
- **Code reads like English or it is rewritten.** Names say WHAT, never how. A reader who does
  not know this codebase follows a function top to bottom without scrolling back. If
  explaining it needs a comment, the code is wrong — fix the code, not the comment.
- **Solve today's problem.** No speculative abstraction, no config for one caller, no
  indirection for a future that has not been specified. The simplest thing that is correct.
- **Queries are correct the first time.** Index-backed, no N+1, no `select *`, no unbounded
  scan, and every tenant-scoped read carries its tenant predicate. A query written to be fixed
  later never is.
- **Every boundary has a contract.** Nothing crosses a package or process edge on an inferred
  or `any` shape. If two sides need to agree, the agreement is a type in `packages/contracts`.
- **A bug you find is reported immediately and fixed next.** Never silently, never inside the
  current change — that hides it in an unrelated diff. Say it, finish the scope you are on,
  then fix it before starting anything new.
- **Dependencies change only through `pnpm add`/`pnpm remove`.** Never hand-edit a dependency
  block, never touch a lockfile. **The database is read-only to you** — schema through
  `pnpm db:migration:new`, data through the application. Both are hook-enforced.
- **No unit tests** — never a `.test.*`/`.spec.*` file. `tests/invariants/` is the only
  executable check layer; behaviour is proven by running it.

Writing rules, not code:

- **An instruction earns its length.** State the rule, its cost, the fix — 1–3 lines. The war
  story belongs in the commit. Before adding a rule, check whether it REPLACES an existing one.
- **Mechanism order: type → lint rule → instruction → script.** A script encodes today's tree
  and rots; a new one needs an owner ruling saying why no type and no lint rule can hold it.
- **One review per change.** Findings get fixed and the work ships; multi-round adversarial
  review only when asked for by name.
- **Repo law beats a plugin skill.** Named: the test-driven-development skill never applies
  here; planning skills write to `.superpowers/`, never `docs/superpowers/`.

## 9. Product law

Digest of `docs/prd/registers/open-questions.md` and the foundations `F1`–`F8`, which are canonical.

- Every user-visible number carries a provenance tier: measured / derived / estimated / assumed.
- Money never renders stale — design changed and quote not recomputed reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ payments reconcile to the currency's minor unit.
- One market and one currency per tenant; market facts (tax, stages, checklists, rails, phone
  spec) resolve from versioned market packs, never hard-coded.
- Sent proposals keep their prices; a price-book update creates a new version.
- Structural adequacy is NEVER computed — an engineer signs off, and the disclaimer travels with
  every structure-bearing output.
- Money renders in the tenant currency's grouping in every locale (INR: lakh/crore); kW/kWh/kWp
  are never translated.
- Read and export work regardless of billing state. Never hold data hostage.
- The server assigns business identifiers. No feature flags — entitlements are the only gating.

**Skills:** `/contract-change` · `/migration` · `/verify` · `/finish`.
