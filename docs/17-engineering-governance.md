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
| Dependency direction & layer purity | dependency-cruiser, 19 rules, all `error` | lint | `.dependency-cruiser.cjs` |
| Package encapsulation | Turborepo Boundaries tags | lint | `turbo.json` + `ci.yml` |
| Screens import only from component indexes | dependency-cruiser `package-index-only` | lint | `.dependency-cruiser.cjs` |
| Module public surface (one-change-one-file) | dependency-cruiser `api-module-boundary` | lint | `.dependency-cruiser.cjs` |
| db/drizzle only in `*.repository.ts` | dependency-cruiser `db-access-in-repositories-only` | lint | `.dependency-cruiser.cjs` |
| Zod 4 ban · no `console.log` · no `process.env` outside config | Biome rules | lint | `biome.json` |
| Dependency version drift | sherif | lint | `package.json` lint chain |
| Exact dependency pins | `.npmrc save-prefix=` + `--frozen-lockfile` | install + CI | `.npmrc`, `ci.yml` |
| Tenant isolation (cross-tenant read/write, fail-closed, append-only ledgers) | `tests/invariants/tenancy-rls.ts`, schema-generated | invariant | CI test |
| contracts `z.enum` ↔ db `pgEnum` parity | `tests/invariants/enum-parity.ts` — live `pg_enum` vs contract schemas, both directions, plus an unmapped-enum check | invariant | CI test |
| `tenant_id` present on every table | `tests/invariants/table-tenancy-scan.ts` — every base table carries it or is on a justified global allowlist | invariant | CI test |
| Invariants cannot silently skip | `turbo.json` test `env` + fail-closed runner under `CI` | invariant | `turbo.json`, `run.ts` |
| Token contrast floors (WCAG) | `DECLARED_PAIRS` gate, fails the build | build | `packages/tokens/src/contrast.ts` |
| Contrast COVERAGE — no unchecked pairing | `findUndeclaredPairs` scans `packages/ui` CSS and refuses to emit when a rule pairs a fg/bg nobody declared, so the curated list can't silently under-cover. Scope stated honestly: per-rule only — a pairing split across a base rule and a state selector is invisible, and RN (`theme.ts` objects, not CSS) is not scanned. Non-pairings (hidden icon stroke over an inactive-state background) sit in `NOT_A_PAIRING` with a reason each. | build | `packages/tokens/src/contrast.ts`, `build.ts` |
| i18n catalogs freshly extracted | `lingui extract` + `git diff --exit-code` | CI | `ci.yml` |
| Committed OpenAPI matches the contract | ONE script (`pnpm check:openapi`) runs in CI and locally, so the two can't diverge: it builds contracts, re-emits, and byte-compares the file before/after — git-independent, so staged/untracked state can't fool it. Stale ⇒ red. | CI + local | `scripts/check-openapi-breaking.mjs`, `ci.yml` |
| Migrations are append-only | sha256 lock (runner refuses) **+** PreToolUse hook (author) **+** CI merge gate (`git diff --diff-filter=MD` on PRs) for what the hook cannot see — a human, another tool, a rebase | runtime + hook + CI | `packages/db/src/migrate.ts`, `write-guard.sh`, `ci.yml` |
| No committed secrets | gitleaks scans full history on push and PR | CI | `ci.yml` |
| Runtime DB role cannot bypass tenancy | boot precondition — app refuses to start | runtime | `apps/api/src/common/db/tenancy-precondition.ts` |
| Never `sed -i` / `perl -i` / `python -i` | PreToolUse hook, exit 2 | hook | `.claude/hooks/bash-guard.sh` |
| No `.test.*` / `.spec.*` files | PreToolUse hook (Edit/Write **and** shell redirect/touch) **+** lint-chain backstop for files an agent did not author | hook + lint | `write-guard.sh`, `bash-guard.sh`, `scripts/check-adherence.sh` |
| Git stays manual — no unprompted push or PR | PreToolUse hook blocks `git push`, `gh pr create\|merge\|ready` | hook | `bash-guard.sh` + `/pr` is `disable-model-invocation` |
| No `rm -rf` outside the repo | PreToolUse hook | hook | `bash-guard.sh` |
| No third-party HTTP client in apps (axios/got/ky/…) | dependency-cruiser rule 20 — apps reach the API through the typed ts-rest client only. Catches the client *family*, not native `fetch()` (no import to graph); that stays prose + review | lint | `.dependency-cruiser.cjs` |
| Files ≲450 lines | PostToolUse hook warns at author time; lint chain fails at merge | hook + lint | `edit-checks.sh`, `scripts/check-adherence.sh` |
| No raw hex in UI paths | same pair — advisory then hard. Matches value positions only; comment mentions of reference hex are deliberately not flagged | hook + lint | `edit-checks.sh`, `scripts/check-adherence.sh` |
| Contract-first ordering | `/contract-change` skill + the contract diff in the PR | skill | `.claude/skills/contract-change/` |
| Schema changes follow the migration procedure | `/migration` skill | skill | `.claude/skills/migration/` |
| Web + RN lockstep (Law 7) | `/slice` + `/verify-app` + PR checklist | skill | `.claude/skills/` |
| Five-lens review | `/lenses` + 3 read-only subagents | skill | `.claude/skills/lenses/`, `.claude/agents/` |
| Docs updated in the same commit (Law 8) | `/doc-sync` + the grep reference checks | skill | `.claude/skills/doc-sync/` |
| Per-task context stays ~22–27k tokens | `/slice` loading recipe; full-corpus reads named a defect | skill | `.claude/skills/slice/` |

### Planned — NOT yet enforced

Listed so nobody reads this matrix as claiming coverage that does not exist. Plan of record:
`docs/foundation-redesign.md` §5.2 (Phase 3).

| Rule | Intended mechanism | Stage |
|---|---|---|
| Arbitrary px / inline style in UI | Not attempted. Raw hex has a stable syntactic shape; "arbitrary px" does not — spacing, border and icon sizes are legitimately numeric, so the rule would be mostly false positives. Reviewed by `ux-lens` instead. | — |
| Dead code / clone detection | Installed: `pnpm check:unused` (knip) · `pnpm check:dupes` (jscpd). Local hygiene a human runs during cleanup — deliberately NOT a CI gate: a `continue-on-error` step that can never fail is decoration everyone learns to scroll past. Promote `check:dupes` to blocking only once the tree already meets a threshold. | local |
| Auth path is executably verified | `scripts/auth-e2e-replay.ts` | local |
| OpenAPI breaking-change detection | `oasdiff` via `pnpm check:openapi` — advisory, a human reads the break | local |

### Prose — with justification

| Rule | Why no mechanism | Enforced by |
|---|---|---|
| Provenance tier on every user-visible number | No checker can distinguish a number needing provenance from an id, count or index. | `epc-lens` review + the per-screen DoD (docs/10 §10) |
| Money never renders while stale | Staleness is a product-semantic judgement about one figure's inputs, not a syntactic property. | `epc-lens` + the fingerprint system when the studio lands |
| Structural adequacy is NEVER computed | A negative existence claim over arbitrary code. Rated **critical** when found. | `epc-lens` (docs/05 honesty rules) |
| Split by responsibility; never `*-part2` | No checker can judge whether a filename honestly names a responsibility. The 450-line gate forces the split; the naming is reviewed. | `CLAUDE.md` + `/lenses` |
| React presentation/logic separation | The container/presentational boundary is a cohesion judgement, not a syntactic one. | `.claude/rules/ui-adherence.md` + `ux-lens` |
| Server assigns all business identifiers | Requires knowing which values are business identifiers. | code review + docs/04 conventions |
| Reference integrity (`docs/NN §M`, links) | Owner ruling 2026-07-30: use the two grep checks, not a checker script. | `/doc-sync` grep block |
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
- Line budget: **≤40 lines default, ≤65 for api/mobile/db** (which carry standing law and the
  most incident history).
- Where this file and a cross-cutting rule disagree, this file wins (§4).
