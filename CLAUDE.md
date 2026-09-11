# HelioGrid — constitution

Multi-tenant SaaS for solar EPC companies — India-first, global-capable: CRM → survey →
3D design → proposal → customer link → voice follow-up → projects → payments. The 3D Design
Studio is the flagship. Light-only v1 · EN/HI/MR · tenant-currency money (INR v1).

**This file states the invariants.** `docs/engineering/architecture.md` places every file ·
`.claude/mechanisms.md` is the ONLY place enforcement is described, cited by row (`M12`) ·
`.claude/landmines.md` holds the live traps. Everything else loads when it applies.

## 1. Core principles

**Think before coding.** State assumptions. Two readings of a request → present both. **Two readings
the PRD supports → decide:** the simplest, most standard one, folded into its PRD row with one
reason, and said out loud. A feature or a number no row implies is the owner's: stop and ask.

**Propose a better approach when you see one** — with an example in *this* codebase and the cost
to switch. A recommendation you withheld is a decision made for the owner. Never switch silently.

**Keep changes minimal.** Solve the requested problem only. Remove what your change orphaned;
mention unrelated dead code, don't delete it.

**Verify reality.** "Fix the bug" means reproducing it on the real surface, then showing those
steps pass. Read failures, not exit codes. **A green gate proves nothing until you have seen it go
red on an injected violation.** Read call sites, not declarations.

## 2. The Laws

Stable ids — never reused or renumbered; a gap is a law that was removed.

1. **Foundation before features.** Feature modules build only on landed foundation.
3. **Contracts before code.** requirements → domain model → contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
5. **Reuse before creation.** Search first; creating what exists is a defect.
7. **One prop contract per shared component.** Both platform files implement the one
   `<Name>.types.ts`; a prop belongs to that contract, never to a single platform.
8. **Fix the docs your change made wrong** — same commit. A change that DELETES or MOVES files
   greps `.claude/`, `docs/`, `scripts/`, `.github/`, configs and `.env.example` for the dead paths.
9. **Incremental schema & API growth.** Tables, enums, contracts and endpoints are authored only
   when their owning module's slice begins.
10. **Platform purity.** Shared packages hold no DOM, no React Native, no Node-only API outside a
    declared server entry.
11. **Flows are authored once.** Shared state vocabulary and view-model types live in a shared
    package before either screen consumes them. Screens render; they don't hold policy.

## 3. Workflow

**`/start` → build, tests first → `/verify`, which stamps the ticket → `/ship`, which refuses an unstamped runtime tree.** `/start` reads the task's own section and the
PRD only for what it does not quote, then explains the task in simple words and waits for the go;
`/ship` sizes the review to the diff, commits on a yes, pushes and prints the PR body. The owner
raises the PR. A screen builds only after its module's screens are designed and verified.

Before writing code, say three things: **which package owns each new file** (§6), **which facts are
new and where their TYPE lives** (§8) — every fact the done-when lines need, beside the row that
carries it — and **what will prove it works**. A fact no row carries is ruled into the row (§1)
before a line is written.

The whole kit. Nothing outside this table fires, and a plugin skill fires only when it names one.

| kit | step |
|---|---|
| the harness's `design` skill · `docs/start-here.md` · `scripts/next-screen.py` | design: the brief is the prompt, `start-here.md` opens the session, the script names the next brief |
| `/start` | task review and explain, before code |
| `/migration` · `/contract-change` | implement: the procedure when schema or the contract changes |
| hooks · `.claude/rules/` · `pnpm check:all` | implement: the guards, loaded by path or run by hand |
| `/verify` → `qa-api` · `qa-web` · `qa-mobile` · `qa-parity` | break and review: only the surfaces the change reaches |
| `/ship` → `arch-reviewer` for a structural diff | owner review: gates, review, commit on a yes, push, PR body |

## 4. Stop and ask the owner before

- Anything billable or external-account-shaped (Fly, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- A layer conflict §7 does not resolve.
- A feature or a number no PRD row implies. A finding BETWEEN readings the PRD supports is not an
  ask: rule it into the row (§1) and continue.
- **Committing.** Every commit waits for its own yes, given to the shown file list and message; a
  go, a green gate, an event, or the yes to an earlier commit is never that yes. After it: push the
  branch, print the PR body, STOP. The owner raises the PR and merges. `main` is PR-only; never
  `--no-verify`, never a force-push.

## 5. Commands

| | |
|---|---|
| `pnpm infra:up` | **Before anything.** One Postgres container (3 databases) + Temporal, from a clean clone. |
| `pnpm check:all` | Every gate that runs without a database, DURING the work. It builds, because typecheck does. |
| `pnpm verify:clean` | **The proof, in CI's room.** A fresh clone of what git would commit, CI's environment, then `pnpm verify`: build · lint · boundaries · typecheck · gates · unit tests · invariants. |
| `pnpm test:unit` | Unit tests; `pnpm test:watch` while writing. |
| `pnpm test:coverage` | Which edge cases you MISSED. Read this, not the pass count. |
| `pnpm db:migration:new` | Where a migration starts: generate, review, move it in. Never hand-author one. |

The db-backed invariants need a live postgres; without one they SKIP loudly, and over an empty
schema they report VACUOUS. Neither is a pass. **Read gate output, not exit codes**, and never
weaken a gate to make a change pass.

**Ports are dedicated, never reassigned** — web `3002` · api `8084` · metro `8081` · postgres
`5544` · temporal UI `8233` · design exports `3004` · worker has no listener. A busy port is a stale service: kill it,
never fall back to another. Start web/api/metro through the browser preview tool;
`pnpm --filter @heliogrid/mobile ios|android` drives metro.

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
| `forms` · `data` · `config` | the form layer · the typed client · shared build config. |

| tree | what it is |
|---|---|
| `docs/prd/` · `docs/ux/briefs/` · `docs/tasks/` | the product spec · one brief per screen · engineering work. **Source of truth.** |
| `docs/engineering/` | how this repo is built, dissolving: each file carries its fate at its top and the folder only shrinks. Ranked **below** `docs/prd/`. |
| `.claude/` | the agent's own instructions — `skills/`, `agents/`, `hooks/`, `rules/` and the two ledgers `mechanisms.md` and `landmines.md`, a closed set. `rules/` is law that spans MORE than one package; a rule for exactly one package lives in that package's own `CLAUDE.md`. |
| `infra/` · `HelioGrid-UX/` | deployment and local-stack material that is NOT application code · the exported Claude Design artboards and decisions records, one pair per screen, rendering from disk with the bundle in `_ds/` — the pixel-perfect reference a screen is built and measured against; never edited, re-exported when a design changes, kept at the repo root and ignored by git (each machine holds its own export). |

Everything public is re-exported from a package's `src/index.ts`; consumers import the index, never
a deep path. Each app and package has its own `CLAUDE.md`, loaded with that folder. **Never invent a
folder**: every tree is a closed set, and a new category is a plan-time decision. `docs/README.md`
maps every document; `docs/tasks/<module>.md` holds the work.

## 7. When rules conflict

Higher wins, and don't re-declare at a lower level what a higher one already fixes:

**the product spec (`docs/prd/`; a row carries its own ruling, and the row IS the ruling) →
`docs/engineering/architecture.md` → contracts → design system → this file → package `CLAUDE.md`
→ implementation detail.**

Two tiebreakers: a **package `CLAUDE.md` beats a cross-cutting rule**, being closer to the code;
and between two records the **later-dated** one wins. If a doc and the code disagree, fix the doc
or ask.

## 8. Coding standards

Every line, every app, every package. No exceptions for "just this once".

- **A shared fact is UNSPEAKABLE outside its owner.** If a consumer could simply type the value
  themselves, it will be typed twice: give it a branded type in its owner, so importing is the only
  way to obtain one. Never `as <Brand>` outside that package — the one hole a brand has. Owners:
  money and policy numbers → `domain` · user-visible copy → `i18n` · vocabularies → `contracts` ·
  visual values → `theme` · queries → `db` · wire calls → `data`.
- **Zero duplication.** Search before you write. A second copy of a definition, a formula or a
  shape is a defect even when both copies are correct — they will diverge.
- **Code reads like English or it is rewritten.** Names say WHAT, never how; a reader new to this
  codebase follows a function top to bottom without scrolling back. Needing a comment to explain it
  means the code is wrong. A comment states the CONSTRAINT — what breaks if you change this. When
  and why we changed it goes in the commit, undated and un-rotting.
- **Solve today's problem.** No speculative abstraction, no config for one caller, no indirection
  for a future that has not been specified.
- **Shape.** Files ≲300 lines, split by responsibility and named for what they do — never
  `*2`/`*-extra`, never for a layer or a document id (`survey.ts`, not `m04.ts`) · no `any`, `!`,
  `==` or `console.log` · style outside the component file · no app-declared enum, union, lookup or
  policy number · `process.env` read only in `packages/env`.
- **Queries are correct the first time.** Index-backed, no N+1, no `select *`, no unbounded scan,
  every tenant-scoped read carrying its tenant predicate. One written to be fixed later never is.
- **Every boundary has a contract.** Nothing crosses a package or process edge on an inferred or
  `any` shape; where two sides must agree, the agreement is a type in `packages/contracts`.
- **A bug you find is reported at once.** Inside the task's scope it is fixed now and its area
  re-reviewed. Outside it, it goes to `docs/tasks/deferred.md` — the issue, why not now, what it
  depends on, who picks it up — and becomes the next task; never inside the current change, which
  hides it in an unrelated diff, and never parked.
- **Dependencies change only through `pnpm add`/`pnpm remove`** — never a hand-edited dependency
  block or lockfile. **The database is read-only to you**: schema through a migration, data through
  the application.
- **Testing law is `.claude/rules/testing.md`** — which layers get unit tests, the one name and
  place a test has, what a test proves, and why it never replaces `tests/invariants/`.

Writing rules, not code:

- **A rule states an invariant, and carries NO DATE** — not a leading one, and not one buried
  mid-sentence in a `hit …`, `measured …` or `since …` clause. A dated sentence is a war story,
  and war stories are how this corpus doubled before. The trap goes to `landmines.md`; when and
  why we changed something is the commit's job. `mechanisms.md` is the one exception: a date there
  is the day a gate was proven red, which is the only date that stays true.
- **One fact, one file.** Cite a rule by its id; never restate it. When a file goes, its stories go
  with it — Law 8's sweep covers the ledgers too.
- **Name no gate outside `mechanisms.md`** — not the tool, not the config, not the check: an
  instruction file cites the row id and nothing else — bare for a HELD or PARTIAL row, with the
  word `review-only` beside it for a NONE row, so a citation is never read as enforcement.
- **Mechanism before rule: type → lint rule → invariant → script.** A script encodes today's tree
  and rots; a new one needs an owner ruling saying why no type and no lint rule can hold it. If
  nothing can hold it, add ONE review-only row to `mechanisms.md` and stop there.
- **Budgets are ceilings, not targets.** This file ≤ 215 lines · a package or app
  `CLAUDE.md` ≤ 85 · a `.claude/rules/` file ≤ 85. Hitting one means the file has taken on
  something that belongs in `mechanisms.md`, `landmines.md` or the tree itself.
- **One review per change.** Findings get fixed and the work ships; multi-round adversarial review
  only when asked for by name.
- **A PR is one complete task.** Every done-when line is met and proven before the PR opens; a
  task that is really two is split at `/start`, never shipped half. The PR is the one human gate,
  so its body carries the design, the done-when proof and the verification record.

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
