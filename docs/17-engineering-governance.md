# 17 — Engineering Governance (AI-First Repository Operating System)

The repository — not any agent's memory — is the source of engineering truth. This document
is **the one governance document**: it states the Laws, defines the two traceability systems,
resolves conflicts, and maps every rule to the mechanism that actually enforces it.

`CLAUDE.md` points here. `.claude/rules/00-laws.md` carries the one-line digest of §1 that
loads into every session. Neither restates this document, and it restates neither of them.

---

## 1. The Laws (non-negotiable)

Laws 1–9 bind every agent and every change. Conflicts resolve by §4's hierarchy. The
always-loaded one-line digest is `.claude/rules/00-laws.md`.

**Law 1 — Foundation before features.** Feature modules build ONLY on the landed
foundation (tokens → components → contracts → guards). Module work proceeds via per-module
roadmaps (§3).

**Law 2 — Architecture is fixed; features extend, never redefine.** No new architectural
patterns, folder categories, state approaches, API styles or dependency categories without
an ADR approved before implementation (`docs/adr/`). Enforced mechanically:
dependency-cruiser layer rules, Turborepo Boundaries tags, Biome restricted imports, and
the pinned stack in docs/03.

**Law 3 — Contracts before code.** The immutable order:
requirements (docs + D-census) → domain model (docs/04 + `packages/domain`) →
API contracts (`packages/contracts`) → shared types (from contracts/tokens — never
re-declared) → database migration (`packages/db`, owning module's slice) →
implementation → verification-by-running → documentation. Never in reverse.

**Law 4 — Single source of truth.** Business enums/validation → `packages/contracts`.
Visual values → `packages/tokens` (generated). Schema → docs/04 + migrations. Money
formatting → `formatInr()` (`packages/domain`, once it lands). i18n strings →
`packages/i18n` catalog. Duplicate definitions are defects, not conveniences.

**Law 5 — Reuse before creation.** Before creating any component/util/service/contract:
search the component indexes (`packages/ui`, `apps/mobile/src/ui`), `packages/contracts`,
and the owning module. Surfaces without a mockup are COMPOSED from the existing vocabulary —
never new visuals (`packages/ui/CLAUDE.md` standing law).

**Law 6 — Requirement traceability.** Every slice traces to: a D-decision
(`docs/product/product-journey.md` D1–D39, read through the docs/15 overlay), a mockup file
(`design/mockups/` by name). Nothing exists without a requirement; §3 says where status
is recorded now that per-module roadmaps are gone.

**Law 7 — Cross-platform lockstep.** Web + RN ship in the SAME slice from the same contract,
verified in the browser AND on both simulators. Platform drift is a violation, not a
follow-up. **Exceptions require an explicit owner ruling**; the default
is lockstep.

**Law 8 — Documentation is code.** Docs are load-bearing for other agents: a change that
invalidates a doc updates that doc in the SAME commit. Per-package CLAUDE.md landmines are
mandatory on first discovery.

**Law 9 — Incremental schema & API growth.** Detail in §2.

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
`docs/superpowers/plans/`, and the record of what was actually run lives in the committed
`.qa/<run-id>/` evidence from `/qa`. `docs/14` remains the cross-module plan of record.

Status vocabulary, wherever status is recorded: `todo` · `in-progress` · `blocked(reason)` ·
`VERIFIED`. **Never "done" without evidence** — a VERIFIED claim records what was run, on
what surface, and what was seen.

---

## 4. Decision hierarchy (conflict resolution)

1. Repository Laws (§1–2) → 2. Product requirements (`docs/product/` D-census + docs/15
rulings) → 3. Architecture (ADRs + docs/02 + docs/03) → 4. Shared domain (docs/04 + domain
purity rules) → 5. API contracts (`packages/contracts`) → 6. UX specification
(`design/mockups/` by filename + the interaction law in docs/10 §11) → 7. Design system
(`design/ds-source` via `packages/tokens` + the component API) → 8. Existing repo standards
(`CLAUDE.md`, per-package `CLAUDE.md`) → 9. Implementation detail.

Never invent at level N what a higher level already defines. Two tiebreakers:

- Where a cross-cutting rule and a **per-package `CLAUDE.md`** disagree, the per-package file
  wins — it is closer to the code and has historically always been the accurate one.
- Where a prose doc and a **dated ADR** disagree, the ADR wins.

When a doc and code disagree: STOP, reconcile the doc first, or flag it to the owner.

---

## 5. Rule → mechanism matrix

Every rule names the mechanism that enforces it and the stage it fires at. **A rule at stage
`prose` must say why no mechanism can hold it** — that requirement is what stops prose quietly
accumulating again.

Rows are one line. The reasoning behind a mechanism lives in the gate file's own comments and
in git history, not here — this table exists to answer "what actually stops this?" at a glance.

Stages: `lint` · `typecheck` · `build` · `invariant` (CI test) · `CI` · `runtime` · `skill` · `prose`.

### Enforced today

| Rule | Mechanism | Stage | Where |
|---|---|---|---|
| Dependency direction & layer purity | dependency-cruiser, 24 rules, all `error` | lint | `.dependency-cruiser.cjs` |
| Package encapsulation | Turborepo Boundaries tags — in each package's own `turbo.json`, never `package.json` | lint | per-package `turbo.json` |
| Only apps read the environment | Biome `noProcessEnv` + `check:env` + the `env` boundary tag; 3 audited exceptions | lint | `packages/env/`, `scripts/check-env-access.mjs` |
| apps/web pages route, features own the capability | `noExcessiveLinesPerFunction` (50) on `app/**/page.tsx` + cruiser `web-app-imports-feature-barrel-only`, `web-app-holds-no-components`, `web-feature-no-cross-internals` | lint | `biome.json`, `.dependency-cruiser.cjs` |
| RN screen composition component stays small | Biome `noExcessiveLinesPerFunction` (80) on `screens/**/*Screen.tsx` only — no cap on hooks or other screen-folder files | lint | `biome.json` |
| **Screens compose from `@heliogrid/ui`** | `check:adherence` fails on `hg-*` legacy scaffold in a feature screen. Added 2026-07-31 after a screen shipped with 12 `hg-*` classes and zero UI imports past three reviews | lint | `scripts/check-adherence.sh` |
| Screens import components, never re-make them (web) | Biome `noRestrictedElements` on `app/**` + `features/**`; design-reference exempt | lint | `biome.json` |
| Screens import components, never re-make them (RN) | Biome `noRestrictedImports` on `screens/**` — interactive primitives may not come from `react-native`; layout ones may | lint | `biome.json` |
| A fact both platforms need lives in a package | **Nothing enforces this.** Parity is checked at the component API; what a SCREEN authors inline is unchecked, so the same constant, type or helper gets written twice and drifts. Detecting it mechanically means comparing meaning, not text — jscpd misses it (same value, different name). Held by review and by defining shared facts before the screens | review | review, `packages/domain` |
| Screens import only from component indexes | dependency-cruiser `package-index-only` | lint | `.dependency-cruiser.cjs` |
| web ↔ RN component API parity | `@heliogrid/ui-api` + `satisfies` in both platforms' `api-parity.ts`; three directions (not looser, not stricter, no uncovered component) | typecheck | `packages/ui-api/` |
| web ↔ RN parity — per PROP | `check:ui-parity` compares authored props to the contract; names props on one platform only | lint | `scripts/check-ui-parity.mjs` |
| Domain purity — no clock, randomness or I/O | `check:adherence` grep + cruiser `domain-purity-*` (3 rules, incl. `dependencyTypes: core`) | lint | `scripts/check-adherence.sh`, `.dependency-cruiser.cjs` |
| Module public surface | dependency-cruiser `api-module-boundary` | lint | `.dependency-cruiser.cjs` |
| db/drizzle only in `*.repository.ts` | dependency-cruiser `db-access-in-repositories-only` | lint | `.dependency-cruiser.cjs` |
| No third-party HTTP client in apps | dependency-cruiser `no-raw-http-clients`, exemptions fully anchored | lint | `.dependency-cruiser.cjs` |
| Zod 4 ban · no `console.log` · no `process.env` outside config | Biome rules | lint | `biome.json` |
| Files ≲450 lines · no `.test.*`/`.spec.*` · no raw colour in UI · copy wrapped + translated · tenant pin is transaction-local | `check:adherence`, 8 greps | lint | `scripts/check-adherence.sh` |
| Dependency version drift | sherif | lint | lint chain |
| Exact dependency pins | `.npmrc save-prefix=` + `--frozen-lockfile` | install + CI | `.npmrc`, `ci.yml` |
| The gate set runs as ONE command, reporting all failures | `pnpm lint` runs six gates and aggregates — no `&&` short-circuit | lint | `scripts/lint-all.sh` |
| Tenant isolation (cross-tenant read/write, fail-closed, append-only ledgers) | `tenancy-rls.ts` + `rls-armed.ts`: catalog assertions (enabled · FORCEd · canonical policy expression · no partition-child grants · no RLS-bypassing view or SECURITY DEFINER) plus behavioural proof on seeded tables | invariant | `tests/invariants/src/` |
| `tenant_id` on every table · unique keys lead with it | `table-tenancy-scan.ts`, allowlists carry written reasons | invariant | `tests/invariants/src/` |
| contracts `z.enum` ↔ db `pgEnum` parity | `enum-parity.ts`, both directions + unmapped-enum check | invariant | `tests/invariants/src/` |
| Drizzle model ↔ migrated database | `schema-parity.ts`, names + nullability, both directions | invariant | `tests/invariants/src/` |
| Invariants cannot silently skip | turbo `test` env list + fail-closed runner under `CI` | invariant | `turbo.json`, `run.ts` |
| Runtime DB role cannot bypass tenancy | boot precondition — the app refuses to start | runtime | `apps/api/src/common/db/tenancy-precondition.ts` |
| Concurrent migrators are serialised | `pg_advisory_lock` taken BEFORE the ledger table is created | runtime | `packages/db/src/migrate.ts` |
| Migrations are append-only | sha256 lock in the runner + CI `git diff --diff-filter=MDR --no-renames` | runtime + CI | `migrate.ts`, `ci.yml` |
| Token contrast floors (WCAG) + coverage | `DECLARED_PAIRS` gate and `findUndeclaredPairs` refuse to emit; `tokens#build` declares its out-of-package inputs | build | `packages/tokens/` |
| Docker build context excludes secrets | `.dockerignore` — 6.5 GB → 27 MB, `.env.local` excluded | build | `.dockerignore` |
| The RN JavaScript actually resolves | `pnpm bundle` in CI — `assembleDebug` does not bundle JS | CI | `ci.yml` |
| i18n catalogs fresh AND translated | CI `lingui extract` + `git diff --exit-code` (deterministic via `orderBy: 'messageId'`); `check:adherence` counts empty `msgstr` | CI + lint | `ci.yml`, `scripts/check-adherence.sh` |
| Committed OpenAPI matches the contract | `check:openapi` builds, re-emits, byte-compares. Blind to Zod `.refine()` — prefer expressible Zod on the wire | CI + local | `scripts/check-openapi-breaking.mjs` |
| No committed secrets | gitleaks over full history | CI | `ci.yml` |
| Review lenses cannot mutate what they review | the three lens agents hold `Read, Grep, Glob` and not Bash | subagent config | `.claude/agents/*.md` |

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
| No unprompted push, branch or PR | An agent's own restraint; the harness no longer blocks it (hooks removed 2026-07-31 — they caught zero real mistakes and blocked legitimate work) | `CLAUDE.md` §Process |
| No in-place stream edits (`sed -i`) | Same. The rule stands because those edits corrupted files here; nothing enforces it | `CLAUDE.md` §Process |
| Provenance tier on every user-visible number | No checker distinguishes a number needing provenance from an id or a count | review + per-screen DoD |
| Money never renders while stale | Staleness is a product-semantic judgement about one figure's inputs | review |
| Structural adequacy is NEVER computed | A negative existence claim over arbitrary code. Rated critical when found | review |
| Shared before local — no duplicated business logic | jscpd finds textual clones but cannot judge whether a clone SHOULD be shared | review + `check:dupes` |
| Split by responsibility; never `*-part2` | No checker judges whether a filename honestly names a responsibility | `CLAUDE.md` + review |
| React presentation/logic separation | A cohesion judgement, not a syntactic one | `.claude/rules/ui-adherence.md` + review |
| RN hooks own logic; never a `components.tsx`/`hooks.ts` grab-bag | The 80-line cap binds only `*Screen.tsx` — a bloated hook or a layer-named file lints clean | `apps/mobile/CLAUDE.md` + review |
| Server assigns all business identifiers | Requires knowing which values are business identifiers | review + docs/04 |
| Contract-first ordering · migration procedure · Law 7 lockstep · Law 8 docs-in-commit | Procedures, not properties — they load on demand as skills | `/contract-change`, `/migration`, `/qa` |
| Reference integrity (`docs/NN §M`, section citations, relative links) | Owner ruling 2026-07-30: greps, not a checker script. Three greps over `git ls-files`; two `docs/08 §…` citations inside sha256-locked migrations are unfixable and skipped by name | `/doc-sync` |
| `VERIFIED` claims carry real evidence | Evidence *quality* is a judgement no script can make | `/qa` artifact verification + review |

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

## Depends on / depended on by
uses: <packages>        used by: <apps/packages>

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
  record. The earlier ≤40/≤65 was exceeded by half the files it governed. (which carry standing law and the
  most incident history).
- Where this file and a cross-cutting rule disagree, this file wins (§4).
