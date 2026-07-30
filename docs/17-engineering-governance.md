# 17 — Engineering Governance (AI-First Repository Operating System)

The repository — not any agent's memory — is the source of engineering truth. This
document is the CONSTITUTION MAP: it states the laws, shows where every governance
concern already lives as enforceable repo law, and defines the two systems added
2026-07-26 (incremental schema growth, per-module roadmaps). Where a concern is already
implemented, this document points — it never duplicates (Law: Single Source of Truth).

---

## 1. The Laws (non-negotiable)

Laws 1–8 below bind every agent and every slice. Conflicts resolve by §4's hierarchy.

**Law 1 — Foundation before features.** Feature modules build ONLY on the landed
foundation (tokens → components → contracts → guards). Foundation gate: **APPROVED
2026-07-26** (§6). Module work proceeds via per-module roadmaps (§3).

**Law 2 — Architecture is fixed; features extend, never redefine.** No new architectural
patterns, folder categories, state approaches, API styles or dependency categories
without an ADR approved before implementation (docs/adr/, CLAUDE.md working style).
Enforced mechanically: dependency-cruiser layer rules, Turborepo Boundaries tags,
Biome restricted imports, the pinned stack in docs/03.

**Law 3 — Contracts before code.** The immutable order:
requirements (docs + D-census) → domain model (docs/04 + packages/domain) →
API contracts (packages/contracts) → shared types (from contracts/tokens — never
re-declared) → database migration (packages/db, owning module's slice) →
implementation → verification-by-running → documentation. Never in reverse.

**Law 4 — Single source of truth.** Business enums/validation → `packages/contracts`.
Visual values → `packages/tokens` (generated). Schema → docs/04 + migrations. Money
formatting → `formatInr()` (packages/domain). i18n strings → `packages/i18n` catalog.
Duplicate definitions are defects, not conveniences.

**Law 5 — Reuse before creation.** Before creating any component/util/service/contract:
search the component indexes (`packages/ui`, `apps/mobile/src/ui`), packages/contracts,
and the owning module. Surfaces without a mockup are COMPOSED from the existing
vocabulary — never new visuals (packages/ui/CLAUDE.md standing law).

**Law 6 — Requirement traceability.** Every slice traces to: a D-decision
(product-journey D1–D39 + docs/15 rulings), a mockup file (design/mockups/ by name),
and a module-roadmap task (docs/modules/). Nothing exists without a requirement;
roadmaps expose implementation status per task (§3).

**Law 7 — Cross-platform lockstep.** Web + RN ship in the SAME slice from the same
contract, verified in the browser AND on both simulators (CLAUDE.md owner directive).
Platform drift is a violation, not a follow-up. **Exceptions require an owner ruling
recorded in the module roadmap** (e.g. owner-only onboarding steps web-only); default is lockstep.

**Law 8 — Documentation is code.** Docs are load-bearing for other agents: a change
that invalidates a doc updates the doc in the SAME commit (CLAUDE.md working style;
per-package CLAUDE.md landmines are mandatory on first discovery).

---

## 2. LAW 9 — INCREMENTAL SCHEMA & API GROWTH (owner directive, 2026-07-26)

**The data model and API surface are NEVER implemented in one shot.**

- `docs/04-data-model.md` is the FROZEN DESIGN of the whole system — the reference that
  keeps future modules coherent (forward-compat register:
  `docs/modules/forward-compat.md`). It is NOT a build order.
- **Tables, enums, columns, contracts and endpoints are AUTHORED only when their OWNING
  module's slice begins.** Migration 0001/0002 carry the identity/platform spine; every
  other table lands with its owning module's FIRST migration; every endpoint lands with
  its module's contract diff.
- Designing or migrating schema "ahead" for modules not being built is a violation:
  big-bang schema implementation guarantees refactors and drift once real slices meet
  reality. The forward-compat register exists precisely so each module's first migration
  can satisfy future needs WITHOUT building them early.
- The same applies to contracts, jobs, ports and adapters: skeleton conventions exist
  centrally; concrete definitions arrive module-by-module.

An agent asked to "implement the schema" implements the CURRENT module's slice of it.

---

## 3. Per-module roadmaps (the traceability system)

Every module gets ONE roadmap file in `docs/modules/<module>.md` (template:
`docs/modules/_template.md`), authored BEFORE its implementation begins and maintained
as tasks complete. Each roadmap contains ALL of that module's work — **backend + web +
mobile + UX + schema + jobs — scoped to that module only**, with per-task traceability
(D-decisions, mockup filenames, docs/04 section) and live status. The module roadmap is
the ONLY task list for the module; docs/14 remains the cross-module plan of record
(tracks, day ranges, forward-compat register).

Planned next (owner direction): author roadmaps for each Track A–E module separately
before its build begins. `docs/modules/README.md` is the index with per-module status.

---

## 4. Decision hierarchy (conflict resolution)

1. Repository Laws (this doc §1–2) → 2. Product requirements (product-journey D-census +
docs/15 rulings) → 3. Architecture contracts (BLUEPRINT + docs/02/03 + ADRs) →
4. Shared domain (docs/04 + packages/domain purity rules) → 5. API contracts
(packages/contracts) → 6. UX specification (design/mockups by filename; interaction law
docs/10) → 7. Design system (ds-source via packages/tokens + the 21-component API) →
8. Existing repo standards (`CLAUDE.md`, per-package `CLAUDE.md`) → 9. Implementation detail.
Never invent at level N what a higher level already defines. When a doc and code
disagree: STOP, reconcile the doc first or flag to the owner (CLAUDE.md).

---

## 5. Governance map — where each concern lives (do not duplicate)

| Framework concern | Enforced by (already exists) |
|---|---|
| Repository constitution | `CLAUDE.md` (single file — Claude Code always-on) + per-package `CLAUDE.md` |
| Frontend architecture | docs/02, docs/10, `CLAUDE.md` §Design + §Structure; scaffolds landed |
| Backend architecture | docs/02, `CLAUDE.md` §Layer quick-ref API + `apps/api/CLAUDE.md` |
| Shared domain strategy | `CLAUDE.md` hard rules + docs/05 port plan |
| API governance | `CLAUDE.md` + packages/contracts/CLAUDE.md (contract-first, error envelope) |
| Database governance | `CLAUDE.md` + packages/db/CLAUDE.md (append-only, RLS) + **Law 9** |
| Design system governance | docs/10 + `CLAUDE.md` §Design + packages/tokens + galleries |
| Dependency governance | docs/03 pin policy + sherif + lockfile authority |
| Cross-platform sync | Law 7 + `CLAUDE.md` §Slice workflow step 7 |
| Requirement traceability | §3 module roadmaps + docs/15 + mockups-by-filename |
| Documentation strategy | Law 8 + landmine sections + docs/ops/ + spike verdicts |
| AI workflow / operating manual | `CLAUDE.md` §Slice workflow (Five Lenses + 13-step loop) |
| Architecture protection | dependency-cruiser + Turbo Boundaries + Biome + TS project refs |
| Quality gates | `pnpm turbo typecheck lint test build` + run-and-look (`CLAUDE.md` Commands) |
| Automated review | `CLAUDE.md` §Slice workflow step 10 (Five Lenses self-review) |
| Definition of Done | `CLAUDE.md` §Definition of done + docs/10 §10 + module roadmap |
| Repo structure | `CLAUDE.md` §Structure — closed sets for backend/web/RN/packages; imports enforced by dependency-cruiser, naming review-only; new top-level dirs need ADR |
| CI/CD enforcement | .github/workflows/ci.yml + branch protection + PR template |
| Testing policy | `CLAUDE.md` §Testing (locked invariants — additions need owner approval) |
| Foundation phase | §6 gate below |
| Law 4 enums (review) | `CLAUDE.md` §Enforcement matrix + contracts |

## 6. Foundation gate — current status (2026-07-26)

DONE: monorepo/gates/CI · tokens pipeline + contrast gate · 21-component libraries
web+RN + static fonts + Lucide runtime + galleries (browser + both sims verified) ·
contracts skeleton + OpenAPI · db spine (0001–0002) + RLS proven · api/worker/web/mobile
scaffolds · auth backend E2E · telephony platform ADR · external services staged.

COMPLETED 2026-07-26 (closing the technical gate):
1. `packages/i18n` — ONE shared Lingui catalog (EN/HI/MR), compiled messages, CI
   extract-guard; Hindi verified rendered on web + both simulators from the same package.
   Convention + swc-plugin landmine: packages/i18n/CLAUDE.md.
2. Typed ts-rest clients (`@ts-rest/react-query` + TanStack Query) wired on web
   (providers + /home on typed hooks) and RN (custom fetcher with the keychain cookie
   jar; health repository on the typed client).

**GATE APPROVED by the owner, 2026-07-26** ("approved, start auth tenancy module").
Module implementation is open. Module roadmaps (§3) are authored per module as each
begins — auth-tenancy first.

---

## Appendix A — per-package CLAUDE.md template

Every `apps/*` and `packages/*` gets a `CLAUDE.md` at creation. Keep under ~60 lines;
loads when Claude Code reads files in that package. Delete sections that don't apply.

```markdown
# <name> — <one-line role>

## What lives here / what must never live here
<2-6 bullets>

## Commands
pnpm --filter <name> typecheck | lint | test | dev

## Depends on / depended on by
uses: <packages>        used by: <apps/packages>

## Local conventions
<package-specific only — else: see CLAUDE.md §Layer quick-ref>

## Landmines
<incident-driven; date-stamp new ones>

## Definition of done here
<additions to CLAUDE.md §Definition of done>
```

Authoring rules:
- Commands copy-paste runnable.
- Landmines mandatory once first sharp edge discovered.
- Update in SAME commit that changes the convention.
- Never repeat Law N prose — reference by number.
- Line budget: ≤40 default; ≤60 for ui/mobile/db standing law or critical landmines.
