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
(`design/mockups/` by name), and a module-roadmap task (`docs/modules/`). Nothing exists
without a requirement; roadmaps expose implementation status per task (§3).

**Law 7 — Cross-platform lockstep.** Web + RN ship in the SAME slice from the same contract,
verified in the browser AND on both simulators. Platform drift is a violation, not a
follow-up. **Exceptions require an owner ruling recorded in the module roadmap**; the default
is lockstep.

**Law 8 — Documentation is code.** Docs are load-bearing for other agents: a change that
invalidates a doc updates that doc in the SAME commit. Per-package CLAUDE.md landmines are
mandatory on first discovery.

**Law 9 — Incremental schema & API growth.** Detail in §2.

---

## 2. LAW 9 — INCREMENTAL SCHEMA & API GROWTH (owner directive, 2026-07-26)

**The data model and API surface are NEVER implemented in one shot.**

- `docs/04-data-model.md` is the FROZEN DESIGN of the whole system — the reference that keeps
  future modules coherent (forward-compat register: `docs/modules/forward-compat.md`). It is
  NOT a build order.
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

## 3. Per-module roadmaps (the traceability system)

Every module gets ONE roadmap file in `docs/modules/<module>.md` (template:
`docs/modules/_template.md`), authored BEFORE its implementation begins and maintained as
tasks complete. Each roadmap contains ALL of that module's work — **backend + web + mobile +
UX + schema + jobs, scoped to that module only** — with per-task traceability (D-decisions,
mockup filenames, docs/04 sections) and live status.

The module roadmap is the ONLY task list for the module. `docs/14` remains the cross-module
plan of record (tracks and dependencies; the forward-compat register lives at
`docs/modules/forward-compat.md`). `docs/modules/README.md` is the index with per-module
status.

**Task 0 of every module is specs extraction** — per-screen specs plus a `d-decisions.md`
extraction under `docs/modules/<module>/specs/`. This is both the context-loading mechanism
and the UX↔backend drift firewall: the spec is the reviewable contract between mockup and
implementation. The `/roadmap` skill runs this.

Status vocabulary: `todo` · `in-progress` · `blocked(reason)` · `VERIFIED`. **Never "done"
without evidence** — a VERIFIED row records what was run, on what surface, and what was seen.

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

Every rule lists the mechanism that enforces it and the stage at which it fires. **A rule
whose stage is `prose` must carry a justification for why no mechanism can hold it** — that
requirement is what stops prose quietly accumulating again, which is how the previous
governance layer reached ~19.6k tokens of unenforced text.

Stages: `hook` (tool-call time) · `lint` · `typecheck` · `build` · `invariant` (CI test) ·
`CI` · `runtime` · `skill` · `prose`.

### Enforced today

| Rule | Mechanism | Stage | Where |
|---|---|---|---|
| Dependency direction & layer purity | dependency-cruiser, **23 rules**, all `error`. The `domain-purity-*` rules (three of them now) were INERT until `packages/domain` existed (ADR-0021) — they targeted a path matching nothing, so a green cruise proved less than it looked like. Both proven to fire 2026-07-30. | lint | `.dependency-cruiser.cjs` |
| Only apps read the environment | `@heliogrid/env` is the one package that touches a raw source. THREE mechanisms, deliberately: Biome `noProcessEnv` per file, `pnpm check:env` per repo (so widening the lint allowlist alone is not enough), and the Turborepo `env` tag allowlisted from the `app` tag ONLY — so `packages/domain` (ADR-0021) and `packages/db` (its migrator takes the URL as a parameter) cannot import it. Audited exceptions are 3, each with a written reason: `packages/env/src/**`, `apps/web/lib/env.ts` (Next inlines `NEXT_PUBLIC_*` only in code it compiles), and `scripts/check-openapi-breaking.mjs`. | lint | `packages/env/`, `scripts/check-env-access.mjs`, `turbo.json`, `biome.json` |
| Package encapsulation | Turborepo Boundaries tags. **Tags live in each package's OWN `turbo.json`** (with `"extends": ["//"]`), never in `package.json`'s `turbo.tags` — turbo does not read them there, and while they sat in the wrong place `pnpm boundaries` enforced NOTHING: emptying an allowlist for a package with real dependencies still reported "no issues found" (found and fixed 2026-07-30). Proven to fail on a deliberate cross-tag import. | lint | per-package `turbo.json` + root `turbo.json` + `ci.yml` |
| Screens import only from component indexes | dependency-cruiser `package-index-only` | lint | `.dependency-cruiser.cjs` |
| apps/web pages route, features own the capability | Biome `noExcessiveLinesPerFunction` (maxLines 50) scoped to `apps/web/app/**/page.tsx` — a LINT RULE, not a line-counting script (owner directive 2026-07-31): it measures the function BODY, so imports and the doc comment do not eat the budget, and it reports at the exact line. Plus dependency-cruiser `web-app-imports-feature-barrel-only` (a page reaches a feature only through its `index.ts`) and `web-feature-no-cross-internals`. ADR-0022. The previous ONE-FOLDER-PER-ROUTE convention had no size mechanism at all, and `app/login/page.tsx` reached 388 lines. | lint | `biome.json`, `.dependency-cruiser.cjs`, `apps/web/CLAUDE.md` |
| web ↔ RN component API parity — per PROP | `pnpm check:ui-parity` (TypeScript compiler API) compares each platform's AUTHORED props against the contract and fails naming any prop declared on BOTH but absent from it. The three `satisfies` assertions all iterate `keyof ComponentApiSurface`, so a prop missing from the contract AND both `declare const` blocks was invisible to every one of them — three hand-maintained lists of the same names with nothing comparing them to the components. It found `AvatarGroup.people` (RN `readonly` array, web mutable: `people={X as const}` compiled on RN, failed on web). Authored-vs-inherited is not expressible in type space — web props extend `ButtonHTMLAttributes` — which is why this is a script and not an assertion. Names only; TYPE drift within a contracted prop is the `satisfies` pair's job. | lint | `scripts/check-ui-parity.mjs` |
| Domain purity — no clock, randomness or I/O | ADR-0021 requires reducers to be total and deterministic; until 2026-07-30 NOTHING enforced it, because the `domain-purity-*` cruiser rules are import-graph rules and none of these shapes is an import. Now: a grep in `check:adherence` for `Date.now(`/`Math.random(`/`new Date(`/`fetch(`/`XMLHttpRequest` under `packages/domain/src`, plus cruiser rule `domain-purity-no-core-modules` (`dependencyTypes: ['core']`) — the one matcher that fires on `node:fs` whether or not `@types/node` is installed. Before it, that green was an artifact of a missing devDependency. | lint | `scripts/check-adherence.sh`, `.dependency-cruiser.cjs` |
| web ↔ RN component API parity | `@heliogrid/ui-api` declares the shared surface; each platform's `src/api-parity.ts` asserts it with `satisfies`, so the platform that drifted fails ITS OWN typecheck naming the component. TWO directions are asserted — impl-not-looser catches the StatusChip incident, and a reverse check catches a narrowed union or a dropped optional prop, both of which the first direction passes silently. Scope: the surface stated in @heliogrid/ui-api's header (its numeral is the only one) — the seven drifts the earlier 99-prop scope had deferred were closed 2026-07-30, as were the 10 (not 11) ReactNode-vs-string copy props. DOM/RN-owned props remain outside it by design, and so does any component not hand-listed in `ComponentApiSurface` — a NEW component is not covered until someone adds it. | typecheck | `packages/ui-api/`, `packages/ui/src/api-parity.ts`, `apps/mobile/src/ui/api-parity.ts` |
| Module public surface (one-change-one-file) | dependency-cruiser `api-module-boundary` | lint | `.dependency-cruiser.cjs` |
| db/drizzle only in `*.repository.ts` | dependency-cruiser `db-access-in-repositories-only` | lint | `.dependency-cruiser.cjs` |
| Zod 4 ban · no `console.log` · no `process.env` outside config | Biome rules | lint | `biome.json` |
| Dependency version drift | sherif | lint | `package.json` lint chain |
| Exact dependency pins | `.npmrc save-prefix=` + `--frozen-lockfile` | install + CI | `.npmrc`, `ci.yml` |
| Tenant isolation (cross-tenant read/write, fail-closed, append-only ledgers) | `tests/invariants/src/tenancy-rls.ts`, schema-generated. TWO halves, because the behavioural one alone was vacuous: `assertRlsArmed` reads `pg_class`/`pg_policy` and requires every tenant table to be RLS-**enabled**, **FORCEd** (0005) and covered by policies **all keyed to `app.tenant_id`**; the leak/write loop then exercises isolation for real. The loop can only bite where tenant B has rows and the runner seeds `tenants` and `users` only — so a new module table shipped without `enable row level security`, a regression that disables it, and a `using (true)` policy ALL passed green while leaking, with the table named in the "tables scanned" line (found and fixed 2026-07-30; all four now proven to fail). | invariant | CI test |
| contracts `z.enum` ↔ db `pgEnum` parity | `tests/invariants/src/enum-parity.ts` — live `pg_enum` vs contract schemas, both directions, plus an unmapped-enum check | invariant | CI test |
| `tenant_id` present on every table | `tests/invariants/src/table-tenancy-scan.ts` — every base table carries it or is on a justified global allowlist | invariant | CI test |
| Invariants cannot silently skip | `turbo.json` test `env` + fail-closed runner under `CI` | invariant | `turbo.json`, `run.ts` |
| Token contrast floors (WCAG) | `DECLARED_PAIRS` gate, fails the build. Both token gates depend on `@heliogrid/tokens#build` declaring `inputs` for `design/ds-source/**` and `packages/ui/src/**/*.css` — neither is a workspace dependency, so until 2026-07-30 turbo hashed neither and a cache hit replayed "20 contrast pairs green" over a 1.25:1 value while restoring a stale `dist/`. CI is cold-cache and did catch it; `pnpm verify` locally did not. | build | `packages/tokens/src/contrast.ts`, `packages/tokens/turbo.json` |
| Contrast COVERAGE — no unchecked pairing | `findUndeclaredPairs` scans `packages/ui` CSS and refuses to emit when a rule pairs a fg/bg nobody declared, so the curated list can't silently under-cover. **Partial by construction:** per-rule only, so a background inherited from an ancestor is invisible (proven: SegmentedControl's inactive label — docs/13 UXG-A11Y-03), and RN (`theme.ts` objects, not CSS) is not scanned. A firing is a real finding; green is not proof of total coverage — effective-background review is a `ux-lens` job. Non-pairings (hidden icon stroke over an inactive-state background) sit in `NOT_A_PAIRING` with a reason each. | build | `packages/tokens/src/contrast.ts`, `build.ts` |
| Drizzle model ↔ migrated database | `tests/invariants/src/schema-parity.ts` — every Drizzle table/column compared to `pg_attribute`, BOTH directions plus nullability. Migrations are hand-written SQL and `packages/db/src/schema/` is a second hand-maintained description of the same tables; nothing compared them, and drizzle-kit ships here with a config file and no script. Names and nullability only — comparing pg types to Drizzle constructors needs a mapping table that would itself drift. | invariant | CI test |
| Concurrent migrators are serialised | `pg_advisory_lock` taken BEFORE `create table if not exists schema_migrations`. The order was reversed and crashed real deploys: Fly runs a `release_command` per app, so api and worker migrate simultaneously on a fresh database, and `if not exists` is not atomic against a concurrent creator — the loser dies on 23505 in pg_type. Measured 2/3 concurrent first-deploys failing before, 0/6 after. | runtime | `packages/db/src/migrate.ts` |
| The RN JavaScript actually resolves | `pnpm bundle` in the android CI job. `assembleDebug` does NOT bundle JS (debug loads from Metro at runtime) and the iOS lane builds Debug too, so nothing mechanical walked the module graph the app runs on: a broken import, a renamed asset or a Metro resolution failure of a workspace package all passed green. This is Law 7's only bundling proof. | CI | `ci.yml`, `apps/mobile/package.json` |
| Docker build context excludes secrets | `.dockerignore`. Both app Dockerfiles do `COPY . .` and there was no ignore file at all — the context was the whole 6.5 GB tree including `node_modules`, the iOS/Android toolchains, `.git` and **`.env.local`**, which `.env.example` documents as the local secret store. A secret reaching any layer has leaked even if a later stage discards it. Context now 26.7 MB. | build | `.dockerignore` |
| Every extracted message is translated | `check:adherence` counts empty `msgstr` per non-`en` catalog. The CI extract guard proves catalogs are FRESH, which an empty translation survives — it compiles, and renders English to a Hindi or Marathi user. | lint | `scripts/check-adherence.sh` |
| The tenant pin is transaction-local | `check:adherence` greps every `set_config('app.tenant_id', …)` for a `true` third argument. `false` (or omitting it) pins the tenant to the CONNECTION, so under a pool the next request inherits it — the one way tenancy fails OPEN, and invisible to every RLS proof because the database is doing exactly what it was told. | lint | `scripts/check-adherence.sh` |
| i18n catalogs freshly extracted | `lingui extract` + `git diff --exit-code` | CI | `ci.yml` |
| Committed OpenAPI matches the contract | ONE script (`pnpm check:openapi`) runs in CI and locally, so the two can't diverge: it builds contracts, re-emits, and byte-compares the file before/after — git-independent, so staged/untracked state can't fool it. Stale ⇒ red. **Blind to Zod refinements:** `@ts-rest/open-api` drops `.refine()`/`.superRefine()`/`.transform()`, so tightening request validation through one of those leaves the spec byte-identical and BOTH halves pass. Prefer expressible Zod (`.max()`, `.lte()`, `.regex()`) on anything that governs the wire; a `.refine()` change needs a human callout in the PR. | CI + local | `scripts/check-openapi-breaking.mjs`, `ci.yml` |
| Migrations are append-only | sha256 lock (runner refuses) **+** PreToolUse hook (author, incl. a `mv`/`git mv` rule — a RENAME edits a migration as surely as opening it) **+** CI merge gate (`git diff --diff-filter=MDR --no-renames`; plain `MD` never sees an R, so renaming an applied migration passed all three layers) on PRs) for what the hook cannot see — a human, another tool, a rebase | runtime + hook + CI | `packages/db/src/migrate.ts`, `write-guard.sh` (edits), `bash-guard.sh` (renames, `cp`, redirects), `ci.yml` |
| No committed secrets | gitleaks scans full history on push and PR | CI | `ci.yml` |
| Runtime DB role cannot bypass tenancy | boot precondition — app refuses to start | runtime | `apps/api/src/common/db/tenancy-precondition.ts` |
| Review lenses cannot mutate what they review | `ux-lens`, `epc-lens`, `qa-breaker` are granted `Read, Grep, Glob` and NOT Bash, so "read-only" is a tool grant rather than a promise in prose. They held Bash until 2026-07-30 — and `qa-breaker`'s own prompt is "try to BREAK this slice", so a heredoc or `git checkout --` would have passed bash-guard and silently rewritten the code under review, making its own findings unreproducible. None of the three prompts asks for a command. | subagent config | `.claude/agents/*.md` |
| Never `sed -i` / `perl -i` / `python -i` | PreToolUse hook, exit 2. Matches the FLAG CLUSTER (`-pi`, `-i.bak`, `-i''`, `--in-place`), not a lone `-i` token — the original regex required whitespace after `-i` and so missed every idiom anyone actually types, and this hook is the rule's only mechanism (17-case probe table, 2026-07-30). Residual limit: `perl -e` that opens a file for writing is not flag-shaped and is not caught. | hook | `.claude/hooks/bash-guard.sh` |
| No `.test.*` / `.spec.*` files | PreToolUse hook (Edit/Write **and** shell redirect/touch) **+** lint-chain backstop for files an agent did not author | hook + lint | `write-guard.sh`, `bash-guard.sh`, `scripts/check-adherence.sh` |
| Git stays manual — no unprompted push or PR | PreToolUse hook blocks `git push`, `gh pr create\|merge\|ready` | hook | `bash-guard.sh` + `/pr` is `disable-model-invocation` |
| No `rm -rf` outside the repo | PreToolUse hook | hook | `bash-guard.sh` |
| No third-party HTTP client in apps (axios/got/ky/…) | dependency-cruiser `no-raw-http-clients` — apps reach the API through the typed ts-rest client only. Two honest limits: it catches the client *family*, not native `fetch()` (no import to graph), and an UNINSTALLED package is unresolvable so no edge exists to match — it bites the moment someone actually adds one. Covers `npm` **and** `npm-dev`; with `npm` alone a devDependency import passed clean. | lint | `.dependency-cruiser.cjs` |
| Files ≲450 lines | PostToolUse hook warns at author time; lint chain fails at merge | hook + lint | `edit-checks.sh`, `scripts/check-adherence.sh` |
| No raw hex in UI paths | same pair — advisory then hard. Matches value positions only; comment mentions of reference hex are deliberately not flagged | hook + lint | `edit-checks.sh`, `scripts/check-adherence.sh` |
| Contract-first ordering | `/contract-change` skill + the contract diff in the PR | skill | `.claude/skills/contract-change/` |
| Schema changes follow the migration procedure | `/migration` skill | skill | `.claude/skills/migration/` |
| Web + RN lockstep (Law 7) | `/slice` + `/verify-app` + PR checklist | skill | `.claude/skills/` |
| Five-lens review | `/lenses` + 3 read-only subagents | skill | `.claude/skills/lenses/`, `.claude/agents/` |
| Docs updated in the same commit (Law 8) | `/doc-sync` + the grep reference checks | skill | `.claude/skills/doc-sync/` |
| Per-task context stays ~22–27k tokens | `/slice` loading recipe; full-corpus reads named a defect | skill | `.claude/skills/slice/` |
| The gate set runs as ONE command | `pnpm verify` = lint · boundaries · typecheck · test · build. Deliberately excludes `check:openapi` (its oasdiff half only exists where that binary does — `verify` must mean the same thing on every machine; CI enforces the freshness half) and `check:unused`/`check:dupes` (cleanup tools). | lint/CI | `package.json`, `/pr` |
| PRs state evidence and known limitations | `.github/pull_request_template.md` — traceability header, `pnpm verify`, run-and-look, the product-law rows, plus an explicit "known limitations" section | prose | `.github/pull_request_template.md` |

### Planned — NOT yet enforced

Listed so nobody reads this matrix as claiming coverage that does not exist. Plan of record:
`docs/foundation-redesign.md` §5.2 (Phase 3).

| Rule | Intended mechanism | Stage |
|---|---|---|
| Arbitrary px / inline style in UI | Not attempted. Raw hex has a stable syntactic shape; "arbitrary px" does not — spacing, border and icon sizes are legitimately numeric, so the rule would be mostly false positives. Reviewed by `ux-lens` instead. | — |
| Dead code / clone detection | Installed: `pnpm check:unused` (knip) · `pnpm check:dupes` (jscpd). Local hygiene a human runs during cleanup — deliberately NOT a CI gate: a `continue-on-error` step that can never fail is decoration everyone learns to scroll past. Promote `check:dupes` to blocking only once the tree already meets a threshold. | local |
| Auth path is executably verified | Deferred into the auth rebuild (owner 2026-07-30): scripting the current flow would be obsolete before it was useful, and that flow's local dev-login is already broken. Build it against the new flow as an on-demand `scripts/` entry — never a `.test.*` file. | local |
| OpenAPI breaking-change detection | `oasdiff` via `pnpm check:openapi` — advisory, a human reads the break | local |

### Prose — with justification

| Rule | Why no mechanism | Enforced by |
|---|---|---|
| Shared before local — no business logic duplicated across apps | No checker can tell duplicated business logic from two screens that legitimately do similar things: `jscpd` finds textual clones (it is `pnpm check:dupes`, local only) but cannot judge whether a clone SHOULD be shared, and the honest cases — the login state machine implemented twice with behavioural drift (ADR-0021 Context) — were textually quite different. `packages/domain` gives shared logic a home and the layer gates keep apps out of each other (`no-app-to-app`); what remains is the judgement call, made at review. | `.claude/rules/00-laws.md` §Working principles + `/lenses` + `pnpm check:dupes` |
| Provenance tier on every user-visible number | No checker can distinguish a number needing provenance from an id, count or index. | `epc-lens` review + the per-screen DoD (docs/10 §10) |
| Money never renders while stale | Staleness is a product-semantic judgement about one figure's inputs, not a syntactic property. | `epc-lens` + the fingerprint system when the studio lands |
| Structural adequacy is NEVER computed | A negative existence claim over arbitrary code. Rated **critical** when found. | `epc-lens` (docs/05 honesty rules) |
| Split by responsibility; never `*-part2` | No checker can judge whether a filename honestly names a responsibility. The 450-line gate forces the split; the naming is reviewed. | `CLAUDE.md` + `/lenses` |
| React presentation/logic separation | The container/presentational boundary is a cohesion judgement, not a syntactic one. | `.claude/rules/ui-adherence.md` + `ux-lens` |
| Server assigns all business identifiers | Requires knowing which values are business identifiers. | code review + docs/04 conventions |
| Reference integrity (`docs/NN §M`, `CLAUDE.md §<Section>`, relative links) | Owner ruling 2026-07-30: grep checks, not a checker script. **Three** greps over every tracked-or-untracked file (`git ls-files`), which replaced a hand-listed root set that omitted repo-root files, `scripts/` and `tests/` — and so walked a live `§Structure` citation in `.dependency-cruiser.cjs` and a `docs/08 §124` in `.env.example` through the "27 → 0" repair. Citations RESOLVE (a section citation under `apps/foo` resolves against that package's own CLAUDE.md, per §4), rather than being printed as two lists to eyeball. Exclusions are by SOURCE FILE, never by section name — the earlier `Structure` skip blinded the check to the exact citation it was built to catch. Two `docs/08 §…` citations inside sha256-locked migrations cannot be fixed at all. | `/doc-sync` grep block |
| `VERIFIED` rows carry real evidence | Owner ruling 2026-07-30: no bespoke roadmap linter. A script can only check a cell is non-empty, which "done" satisfies while proving nothing — evidence *quality* ("browser 375/1440, both sims, curl 409") is a judgement. Prefer instruction + review over a script. | `/slice` Evidence stage + `/pr` + `/roadmap` template + review |

---

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
