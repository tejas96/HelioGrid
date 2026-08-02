# 17 — Engineering Governance (AI-First Repository Operating System)

The repository — not any agent's memory — is the source of engineering truth. This document
is **the one governance document**: it states the Laws, defines the two traceability systems,
resolves conflicts, and maps every rule to the mechanism that actually enforces it.

`CLAUDE.md` points here. `.claude/rules/00-laws.md` carries the one-line digest of §1 that
loads into every session. Neither restates this document, and it restates neither of them.

---

## 1. The Laws (non-negotiable)

These bind every agent and every change. Conflicts resolve by §4's hierarchy. The
always-loaded one-line digest is `.claude/rules/00-laws.md`. Numbers are stable ids, never
reused or renumbered — a gap is a law that was removed (2, 4 and 6 on 2026-08-01; CLAUDE.md
§1–2 carries what they said).

**Law 1 — Foundation before features.** Feature modules build ONLY on the landed
foundation (tokens → components → contracts → guards). Module work proceeds via plans
under `docs/superpowers/plans/` (§3).

**Law 3 — Contracts before code.** The immutable order:
requirements (docs + D-census) → domain model (docs/04 + `packages/domain`) →
API contracts (`packages/contracts`) → shared types (from contracts/tokens — never
re-declared) → database migration (`packages/db`, owning module's slice) →
implementation → verification-by-running → documentation. Never in reverse.

**Law 5 — Reuse before creation.** Before creating any component/util/service/contract:
search the component indexes (`packages/ui`, `apps/mobile/src/ui`), `packages/contracts`,
and the owning module. Surfaces without a mockup are COMPOSED from the existing vocabulary —
never new visuals (`packages/ui/CLAUDE.md` standing law).

**Law 7 — Shared component APIs stay in parity.** A prop or component authored on one
platform only is a defect — `@heliogrid/ui-api` plus `check:ui-parity` enforce it in both
directions. WHICH screens each platform ships is a plan decision, not a law: the two screen
sets already differ deliberately.

**Law 8 — Fix the docs your change made wrong** — in the same commit, because docs are
load-bearing for the next agent. Docs that are merely adjacent or related are not your
problem. Per-package CLAUDE.md landmines are mandatory on first discovery.

**The deletion sweep.** A change that DELETES or MOVES a file, package, script or skill
greps for its dead paths across `.claude/`, `docs/`, config files and `.env.example` in the
same change. Deletions are where this law fails: ADR-0023 and ADR-0024 each updated the
rules and package docs and each missed `.claude/skills/`, leaving both skills pointing at
files that no longer existed.

**Law 9 — Incremental schema & API growth.** Detail in §2.

**Law 10 — Platform purity.** A shared package is platform-agnostic: no DOM, no React
Native, no Node-only API outside a declared server entry point. Platform-specific work
lives in the owning app behind an adapter. Which package may hold what:
`docs/architecture.md` §2; the platform rules themselves: `docs/architecture.md` §3.

**Law 11 — Flows are authored once.** A flow's state vocabulary and view-model type that
both platforms need is defined in a shared package BEFORE either screen consumes it;
screens render, they do not hold policy. Copy both platforms show lives in
`packages/i18n/src/copy`. The login flow proved the cost: one controller authored twice
drifted into five renamed state fields, an inverted `online`/`offline` polarity, and an
unreachable offline banner.

---

## 2. LAW 9 — INCREMENTAL SCHEMA & API GROWTH (owner directive, 2026-07-26)

**The data model and API surface are NEVER implemented in one shot.**

- `docs/04-data-model.md` is the FROZEN DESIGN of the whole system — the reference that keeps
  future modules coherent. It is NOT a build order.
- **Tables, enums, columns, contracts and endpoints are AUTHORED only when their OWNING
  module's slice begins.** Migrations 0001–0002 carry the identity/platform spine; every
  other table lands with its owning module's FIRST migration, and every endpoint with its
  module's contract diff.
- Designing or migrating schema "ahead" for modules not being built is a violation: big-bang
  schema implementation guarantees refactors and drift once real slices meet reality. The
  forward-compat register exists precisely so each module's first migration can satisfy
  future needs WITHOUT building them early.
- The same applies to contracts, jobs, ports and adapters: skeleton conventions exist
  centrally; concrete definitions arrive module-by-module.

An agent asked to "implement the schema" implements the CURRENT module's slice of it.

---

## 3. Traceability without a roadmap system (owner ruling, 2026-07-31)

Per-module roadmap files under `docs/modules/` were deleted, along with the `/roadmap`,
`/slice`, `/lenses`, `/doc-sync` and `/pr` skills. They cost more to maintain than the
traceability they bought, and a stale roadmap actively misleads.

What replaces them: **plans are authored per piece of work** under
`docs/superpowers/plans/`, and the record of what was actually run is the verification
section `/verify` produces and `/finish` embeds in the pull request. Nothing is written to
the working tree: QA artifacts live in the session scratchpad and are deleted when the run
finishes (owner ruling 2026-08-03, superseding the 2026-08-02 ruling that merely gitignored
`.qa/`). `docs/14` remains the cross-module plan of record.

Status vocabulary, wherever status is recorded: `todo` · `in-progress` · `blocked(reason)` ·
`VERIFIED`. **Never "done" without evidence** — a VERIFIED claim records what was run, on
what surface, and what was seen.

---

## 4. Decision hierarchy (conflict resolution)

1. Repository Laws (§1–2) → 2. Product requirements (`docs/product/` D-census + docs/15
rulings) → 3. Architecture (`docs/architecture.md` — the spine) → 4. Shared domain (docs/04 + domain
purity rules) → 5. API contracts (`packages/contracts`) → 6. UX specification
(`design/mockups/` by filename + the interaction law in docs/10 §11) → 7. Design system
(`design/ds-source` via `packages/tokens` + the component API) → 8. Existing repo standards
(`CLAUDE.md`, per-package `CLAUDE.md`) → 9. Implementation detail.

Don't re-declare at level N what a higher level already defines. Two tiebreakers:

- Where a cross-cutting rule and a **per-package `CLAUDE.md`** disagree, the per-package file
  wins — it is closer to the code and has historically always been the accurate one.
- Where two records disagree, the **later-dated** one wins.

These two tiebreakers live HERE and nowhere else. `.claude/rules/00-laws.md` points at this
section; a second copy is what let them drift with a false "live only here" claim.

When a doc and code disagree: reconcile the doc, or flag it to the owner.

Level 3 (Architecture) is `docs/architecture.md` — the spine. docs/02 and docs/03 are design
records: read them for intent, never for what the repo contains today.

## 4a. Changing governance

- **One canonical home per fact** (`docs/architecture.md` §2 for inter-package facts, this
  file for laws and mechanisms, the package `CLAUDE.md` for intra-package ones). Every other
  mention is a pointer `file §section`. A second copy of a fact is a defect, not redundancy.
- **A digest is declared on both ends.** `.claude/rules/00-laws.md` digests §1 and says so;
  §1 names it. An undeclared restatement is a copy.
- **No hand-maintained counts or consumer lists** anywhere in governance prose. They rot
  fastest: "27 rules" and "21-component" were both wrong within days, and two
  "used by (TODAY)" lists went stale inside 48 hours. State the rule; let `package.json`,
  `turbo.json` and `.dependency-cruiser.cjs` carry the graph.
- **Target-state prose carries a status banner** naming what is not built yet
  (`packages/db/CLAUDE.md` is the pattern — the only doc that survived the auth teardown
  accurate).
- **A rule names the mechanism that holds it** (§5) — and a rule may not claim a mechanism
  that does not exist. Prefer, in order: type → lint rule → instruction → script.

## 4b. Governed surfaces outside this document

- `AGENTS.md` is a symlink to `CLAUDE.md`, giving the constitution a second name for
  non-Claude agents. Renaming or splitting `CLAUDE.md` orphans it — check the symlink in the
  same change.
- `docs/research/` carries its own NORMATIVE tier. It is binding ONLY where a live doc
  delegates to it by name (docs/08 and docs/16 do); otherwise it is background, and two of
  its files recommend a stack this repo rejected.
- `.superpowers/` and any other local-only agent scratch tree is gitignored working state,
  not a record. Nothing may cite it as evidence.

---

## 5. Rule → mechanism matrix

Every rule names the mechanism that enforces it and the stage it fires at. **A rule at stage
`prose` must say why no mechanism can hold it** — that requirement is what stops prose quietly
accumulating again.

Rows are one line. The reasoning behind a mechanism lives in the gate file's own comments and
in git history, not here — this table exists to answer "what actually stops this?" at a glance.

Stages: `lint` · `typecheck` · `build` · `invariant` (CI test) · `CI` · `runtime` · `hook` ·
`skill` · `prose`.

**Holds** answers a question "what enforces this?" hides: can the mechanism express the WHOLE
rule (`full`), only part of it (`partial`, with what escapes), or is it redundant cover for a
rule another mechanism actually holds (`cover`)? A `partial` row is not a failure — it is the
row telling the truth about where review still carries the weight.

### Enforced today

| Rule | Mechanism | Stage | Holds | Where |
|---|---|---|---|---|
| Dependency direction & layer purity | dependency-cruiser, all rules `error` — the authoritative boundary enforcer | lint | full | `.dependency-cruiser.cjs` |
| Web and mobile never touch the database | `web-no-db` / `mobile-no-db`. **Both were silently inert until 2026-08-02** — they matched only `^packages/db/`, but neither app declares the dependency, so an import cannot resolve and stays a bare `@heliogrid/db` specifier the pattern never saw. Now matched in both forms, `uuid` still exempt. A dependency-cruiser rule is only real once you have injected the violation it names | lint | full | `.dependency-cruiser.cjs` |
| Package encapsulation | Turborepo Boundaries tags — in each package's own `turbo.json`, never `package.json` | lint | cover — coarser than the documented bans: the shared `app` tag permits `web→db` (dep-cruiser holds that) and permits api/worker→frontend layers, which policy forbids and nothing enforces | per-package `turbo.json` |
| Only apps read the environment | Biome `noProcessEnv` + `check:env` + the `env` boundary tag; 3 audited exceptions | lint | full | `packages/env/`, `scripts/check-env-access.mjs` |
| apps/web pages route, features own the capability | `noExcessiveLinesPerFunction` (50) on `app/**/page.tsx` + cruiser `web-app-imports-feature-barrel-only`, `web-app-holds-no-components`, `web-feature-no-cross-internals` | lint | full | `biome.json`, `.dependency-cruiser.cjs` |
| RN screen composition component stays small | Biome `noExcessiveLinesPerFunction` (80) on `screens/**/*Screen.tsx` only — no cap on hooks or other screen-folder files | lint | partial — hooks and non-Screen files in the same folder are uncapped | `biome.json` |
| **Screens compose from `@heliogrid/ui`** | `check:adherence` fails on `hg-*` legacy scaffold in a feature screen. Added 2026-07-31 after a screen shipped with 12 `hg-*` classes and zero UI imports past three reviews | lint | partial — catches the known legacy prefix, not every hand-rolled component | `scripts/check-adherence.sh` |
| Screens import components, never re-make them (web) | Biome `noRestrictedElements` on `app/**` + `features/**`; design-reference exempt | lint | full | `biome.json` |
| Screens import components, never re-make them (RN) | Biome `noRestrictedImports` on `screens/**` — interactive primitives may not come from `react-native`; layout ones may | lint | partial — scoped to `src/screens/**`, so `src/lib` and `src/navigation` may use raw primitives unchecked | `biome.json` |
| Flows are authored once (Law 11) | `qa-parity` compares both implementations per feature — state vocabulary, behavioural guards, loading/offline affordances, msgid identity. No static mechanism exists: detecting it means comparing MEANING, not text (jscpd misses same-value-different-name) | skill | partial — catches drift in what a run exercises; a flow nobody verifies is held only by review | `.claude/agents/qa-parity.md` (Phase 3), review |
| Screens import only from component indexes | dependency-cruiser `package-index-only` | lint | full | `.dependency-cruiser.cjs` |
| web ↔ RN component API parity | `@heliogrid/ui-api` + `satisfies` in both platforms' `api-parity.ts`; three directions (not looser, not stricter, no uncovered component) | typecheck | full | `packages/ui-api/` |
| web ↔ RN parity — per PROP | `check:ui-parity` compares authored props to the contract; names props on one platform only | lint | full | `scripts/check-ui-parity.mjs` |
| Domain purity — no clock, randomness or I/O | `check:adherence` grep + cruiser `domain-purity-*` (3 rules, incl. `dependencyTypes: core`) | lint | full | `scripts/check-adherence.sh`, `.dependency-cruiser.cjs` |
| Module public surface | dependency-cruiser `api-module-boundary` | lint | full | `.dependency-cruiser.cjs` |
| db/drizzle only in `*.repository.ts` | dependency-cruiser `db-access-in-repositories-only` | lint | full | `.dependency-cruiser.cjs` |
| No third-party HTTP client in apps | dependency-cruiser `no-raw-http-clients` — no exemptions; matches the bare specifier as well as the resolved path, and carries no `dependencyTypes` filter, because an uninstalled client resolves to `unknown` and a filtered rule drops exactly the case it guards (probed 2026-08-03) | lint | partial — a hand-rolled `fetch` has no import for the graph to see | `.dependency-cruiser.cjs` |
| Apps reach the network ONLY through `@heliogrid/data` | dependency-cruiser `apps-never-touch-the-wire` — `@ts-rest/*` and auth clients are unimportable from `apps/{web,mobile}`; `initClient` is called once in the repo | lint | full | `.dependency-cruiser.cjs` |
| `packages/data` stays an SDK, not a God package | dependency-cruiser `data-lean` — db/ui/ui-api/tokens/i18n/adapters/apps all unimportable, with NO uuid exemption (that exists only for the two apps). Matches the bare workspace SPECIFIER as well as the on-disk path: an undeclared dependency cannot resolve, so a path-only pattern would miss the exact case the rule guards | lint | full | `.dependency-cruiser.cjs` |
| React Query stays swappable | dependency-cruiser `data-core-is-framework-free` — react/react-query importable only under `packages/data/src/react/`. Directory prefix, not a filename pattern, so it cannot rot | lint | full | `.dependency-cruiser.cjs` |
| Zod 4 ban · `@lingui/macro` ban · no `console.log` · no `process.env` outside config | Biome rules. The macro ban is declared in the base block AND both app overrides: Biome overrides REPLACE rule options rather than merging, so a base-only entry is invisible in exactly the trees where `<Trans>` is authored (probed 2026-08-03) | lint | full | `biome.json` |
| Files ≲450 lines · no `.test.*`/`.spec.*` · no raw colour in UI · copy wrapped + translated · tenant pin is transaction-local | `check:adherence`, 8 greps | lint | partial — the copy gate scans app screen trees only, so unwrapped English inside `packages/ui` passes | `scripts/check-adherence.sh` |
| Dependency version drift | sherif | lint | full | lint chain |
| Exact dependency pins | `.npmrc save-prefix=` + `--frozen-lockfile` | install + CI | full | `.npmrc`, `ci.yml` |
| The gate set runs as ONE command, reporting all failures | `pnpm lint` runs six gates and aggregates — no `&&` short-circuit | lint | full | `scripts/lint-all.sh` |
| Boundary rules see workspace edges at all | `pnpm verify` builds BEFORE linting, as CI does — dep-cruiser resolves workspace imports through `dist/`, so linting an unbuilt checkout is partially blind (proven 2026-07-31) | lint | full | `package.json`, `ci.yml` |
| Tenant isolation (cross-tenant read/write, fail-closed, append-only ledgers) | `tenancy-rls.ts` + `rls-armed.ts`: catalog assertions (enabled · FORCEd · canonical policy expression · no partition-child grants · no RLS-bypassing view or SECURITY DEFINER) plus behavioural proof on seeded tables | invariant | partial — VACUOUS while the schema is greenfield, and says so when it runs | `tests/invariants/src/` |
| `tenant_id` on every table · unique keys lead with it | `table-tenancy-scan.ts`, allowlists carry written reasons | invariant | partial — vacuous on an empty schema | `tests/invariants/src/` |
| `tenant_id` never crosses the wire in a body or query | `tenant-id-in-body.ts` walks `apiContract`, unwraps Zod wrappers, rejects `tenant_id`/`tenantId`. Static — runs before the DATABASE_URL check, so it never skips. Job envelopes are out of scope and legitimately carry `tenantId` | invariant | partial — vacuous until a route declares a body or query schema, and says so | `tests/invariants/src/` |
| contracts `z.enum` ↔ db `pgEnum` parity | `enum-parity.ts`, both directions + unmapped-enum check | invariant | partial — vacuous on an empty schema | `tests/invariants/src/` |
| Drizzle model ↔ migrated database | `schema-parity.ts`, names + nullability, both directions | invariant | partial — vacuous on an empty schema | `tests/invariants/src/` |
| Invariants cannot silently skip | turbo `test` env list + fail-closed runner under `CI` | invariant | full | `turbo.json`, `run.ts` |
| Runtime DB role cannot bypass tenancy | boot precondition — the app refuses to start | runtime | full | `apps/api/src/common/db/tenancy-precondition.ts` |
| Concurrent migrators are serialised | `pg_advisory_lock` taken BEFORE the ledger table is created | runtime | full | `packages/db/src/migrate.ts` |
| Migrations are append-only | sha256 lock in the runner + CI `git diff --diff-filter=MDR --no-renames` | runtime + CI | partial — the CI guard runs on pull_request only, so a direct push to main skips it; the runner still refuses to apply | `migrate.ts`, `ci.yml` |
| Token contrast floors (WCAG) + coverage | `DECLARED_PAIRS` gate and `findUndeclaredPairs` refuse to emit; `tokens#build` declares its out-of-package inputs | build | full | `packages/tokens/` |
| Docker build context excludes secrets | `.dockerignore` — 6.5 GB → 27 MB, `.env.local` excluded | build | full | `.dockerignore` |
| The RN JavaScript actually resolves | `pnpm bundle` in CI — `assembleDebug` does not bundle JS | CI | full | `ci.yml` |
| i18n catalogs fresh AND translated | CI `lingui extract` + `git diff --exit-code` (deterministic via `orderBy: 'messageId'`); `check:adherence` counts empty `msgstr` | CI + lint | partial — checks freshness, NOT cross-platform msgid identity; a one-character edit forks a shared string and still passes | `ci.yml`, `scripts/check-adherence.sh` |
| Committed OpenAPI matches the contract | `check:openapi` builds, re-emits, byte-compares. Blind to Zod `.refine()` — prefer expressible Zod on the wire | CI + local | partial — `.refine()` predicates never reach the spec | `scripts/check-openapi-breaking.mjs` |
| No committed secrets | gitleaks over full history | CI | full | `ci.yml` |
| Migrations are append-only — at EDIT time | PreToolUse hook refuses Edit/Write on a migration already in `HEAD`. **Review 2026-09-03:** if it has caught nothing by then, delete it — the 2026-07-31 removal was for exactly that reason | hook | full | `.claude/hooks/block-applied-migration-edit.sh` |
| No `.test.*` / `.spec.*` file is ever created | PreToolUse hook refuses the Write. Complements `check:adherence`, which only catches files already on disk. **Review 2026-09-03** | hook | full | `.claude/hooks/block-test-files.sh` |
| `git commit --no-verify` is never used | PreToolUse hook refuses the Bash call. Matches the flag as an ARGUMENT, not a mention — everything from the first `-m` or heredoc onward is treated as message body, so a commit that discusses the flag still lands. **Review 2026-09-03** | hook | full | `.claude/hooks/block-no-verify.sh` |

### Planned — NOT yet enforced

| Rule | Intended mechanism | Stage |
|---|---|---|
| Arbitrary px / inline style in UI | Not attempted — "arbitrary px" has no stable syntactic shape; review catches it | — |
| Dead code / clone detection | `check:unused` (knip) · `check:dupes` (jscpd) — local hygiene, deliberately not a CI gate | local |
| Auth path is executably verified | deferred into the auth rebuild; build it against the new flow as a `scripts/` entry, never a `.test.*` | local |
| OpenAPI breaking-change detection | `oasdiff` via `check:openapi` — advisory, a human reads the break | local |

### Prose — with justification

| Rule | Why no mechanism | Enforced by |
|---|---|---|
| Push and PR need an explicit owner yes | An agent's own restraint — the harness cannot tell an approved push from an unapproved one | `CLAUDE.md` §Git, `/finish` |
| No in-place stream edits (`sed -i`) | Those edits corrupted files here; a Bash pattern ban would also block legitimate read-only `sed` | `CLAUDE.md` §4 (Edit/Write for all file changes) |
| Market facts resolve from versioned packs, never hard-coded | No checker distinguishes a market-specific literal from a legitimate constant; `+91` is hard-coded at four screen sites today | review + `docs/architecture.md` §2 (domain) |
| Sent proposals keep their prices | A versioning semantic over rows that do not exist yet — lands with the proposals module's invariant | review |
| Money renders with the tenant currency's market grouping; kW/kWh/kWp never translated | The unit half becomes a lint-able string ban once a formatter exists; the grouping half is a rendering judgement | review + `.claude/rules/cross-platform.md` |
| Read + export work regardless of billing state | A negative existence claim over every gated surface | review + docs/16 |
| One money path — BOM ↔ proposal ↔ tranches ↔ payments reconcile | Cross-module arithmetic; becomes an invariant when the money tables land | review + `/verify` always-on core |
| Provenance tier on every user-visible number | No checker distinguishes a number needing provenance from an id or a count | review + per-screen DoD |
| Money never renders while stale | Staleness is a product-semantic judgement about one figure's inputs | review |
| Structural adequacy is NEVER computed | A negative existence claim over arbitrary code. Rated critical when found | review |
| Shared before local — no duplicated business logic | jscpd finds textual clones but cannot judge whether a clone SHOULD be shared | review + `check:dupes` |
| Split by responsibility; never `*-part2` | No checker judges whether a filename honestly names a responsibility | `CLAUDE.md` + review |
| React presentation/logic separation | A cohesion judgement, not a syntactic one | `.claude/rules/ui-adherence.md` + review |
| RN hooks own logic; never a `components.tsx`/`hooks.ts` grab-bag | The 80-line cap binds only `*Screen.tsx` — a bloated hook or a layer-named file lints clean | `apps/mobile/CLAUDE.md` + review |
| Server assigns all business identifiers | Requires knowing which values are business identifiers | review + docs/04 |
| Contract-first ordering · migration procedure · verification · task close-out | Procedures, not properties — they load on demand as skills | `/contract-change`, `/migration`, `/verify`, `/finish` (the last two land in Phase 3) |
| Reference integrity (`docs/NN §M`, section citations, relative links) | Owner ruling 2026-07-30: greps, not a checker script. Three greps over `git ls-files`; two `docs/08 §…` citations inside sha256-locked migrations are unfixable and skipped by name | unowned since the 2026-07-31 skill deletion — returns as an arch-reviewer check (governance rebuild Phase 3) |
| `VERIFIED` claims carry real evidence | Evidence *quality* is a judgement no script can make | `/verify` artifact discipline + review |

## Appendix A — per-package CLAUDE.md template

Every `apps/*` and `packages/*` gets a `CLAUDE.md` at creation. It loads on demand when
Claude Code reads files in that package, so it costs nothing until relevant. Delete sections
that don't apply. **This is the only copy of this template.**

```markdown
# <name> — <one-line role>

## What lives here / what must never live here
<2-6 bullets>

## Commands
pnpm --filter <name> typecheck | lint | test | dev

## Dependency policy
Dependency policy: docs/architecture.md §2 <name>. (Never a hand-maintained consumer
list — two rotted within 48 hours of ADR-0024.)

## Local conventions
<package-specific only — layer-wide law belongs in .claude/rules/ or docs/02 §2>

## Landmines
<incident-driven; date-stamp new ones>

## Definition of done here
<additions to CLAUDE.md §Commands and docs/10 §10>
```

Authoring rules:

- Commands copy-paste runnable.
- Landmines are **mandatory** once the first sharp edge is discovered, and date-stamped. An
  hour lost to a trap nobody wrote down is an hour the next person also loses.
- Update in the SAME commit that changes the convention.
- Never repeat Law N prose — reference it by number.
- Line budget: **≤50 lines default, ≤70 for api/mobile/db/env** — LANDMINES DO NOT COUNT.
  They are the healthiest part of this corpus and capping them would delete the incident
  record. The earlier ≤40/≤65 was exceeded by half the files it governed.
- Where this file and a cross-cutting rule disagree, this file wins (§4).
