# HelioGrid — constitution

Multi-tenant SaaS for solar EPC companies — India-first, global-capable: CRM → survey →
3D design → proposal → customer link → voice follow-up → projects → payments. The 3D Design
Studio is the flagship. Light-only v1 · EN/HI/MR · tenant-currency money (INR v1).

This file and `docs/architecture.md` are the two you must know. Everything else loads when
it applies.

## 1. Core principles

**Architecture decides ownership.** Run `docs/architecture.md` §4 before creating any file,
constant, type or helper — it names the owning package. §2 says what each package may hold
and import; §3 what is web-only, RN-only or shared.

**Never duplicate a definition.** A fact both platforms need lives in a package before
either screen uses it. Enums → contracts. Logic, policy numbers, formatters → domain. Visual
values → theme. Schema → migrations. Copy → i18n. **Product behaviour → `prd/`, never a doc
under `docs/`** — `docs/` describes how this repo is built, `prd/` describes what it does. Compose from `packages/`; if a primitive
is missing, add it there rather than inlining a copy.

**Screens are the unguarded surface.** Gates check packages; almost nothing checks what a
screen writes inline, and that is where every recent defect landed.

**Think before coding.** State assumptions. Two readings of a request → present both.
Unclear → stop and ask; never invent a requirement.

**Found a better approach? Propose it, with an example.** Show what it would look like in
*this* codebase — the shape of the code or the file it would live in — and what it costs to
switch. A recommendation you withheld is a decision you made on the owner's behalf without
telling them. Two limits: only when you have actually found one (a manufactured alternative
wastes their attention), and never switch to it silently — propose, then follow the answer.

**Keep changes minimal.** Solve the requested problem only. No speculative abstraction, no
error handling for impossible states, no refactoring what isn't broken. Match surrounding
style. Remove what your change orphaned; mention unrelated dead code, don't delete it. Every
changed line traces to the request.

**Verify reality.** `/verify` on the real surface — a task is done when you have looked at
it. Read failures, not exit codes: a red probe proves nothing until you know why it went
red, and a green gate proves nothing until you have seen it go red on an injected violation.
Read call sites, not declarations — two platforms reach the same behaviour through
differently-named state.

**Don't move to the next task or to-do until you are 99% confident the current one is
complete and correct.**

**Minimise blast radius.** If something small needs edits across many unrelated files, the
architecture is wrong. Say so before writing the workaround.

**Cross-cutting concerns are built in from day one, never retrofitted.** Anything that will
reach every module later — permissions/RBAC, tenancy, money, audit, i18n, offline — is
provisioned by the first slice that could carry it, even while nothing consumes it yet, and
behind ONE enforcement seam rather than per-handler checks. `docs/forward-compat.md` is the
register: read your module's row before its first migration or contract, and add a row when
you find a new such concern. Retrofitting one of these is a repo-wide sweep — exactly the
blast radius the rule above tells you to refuse.

## 2. The Laws

Stable ids — never reused or renumbered; a gap is a law that was removed. Each is held by a different
mechanism — some by lint or types, some only by review (§7).

1. **Foundation before features.** Feature modules build only on landed foundation.
3. **Contracts before code.** requirements → domain model → contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
5. **Reuse before creation.** Search first; creating what exists is a defect.
7. **Shared component APIs stay in parity.** A prop on one platform only is a defect.
   Held by a TYPE, not a script: both platform files import the one `<Name>.types.ts`
   (docs/17 §2). The v1 three-list arrangement and `check-ui-parity.mjs` are gone.
8. **Fix the docs your change made wrong** — same commit. A change that DELETES or MOVES
   files greps `.claude/`, `docs/`, configs and `.env.example` for the dead paths.
9. **Incremental schema & API growth.** Tables, enums, contracts and endpoints are authored
   only when their owning module's slice begins.
10. **Platform purity.** Shared packages hold no DOM, no React Native, no Node-only API
    outside a declared server entry.
11. **Flows are authored once.** Shared state vocabulary and view-model types live in a
    shared package before either screen consumes them. Screens render; they don't hold policy.

## 3. Workflow

**Understand → build → `/verify` → `/finish`.**

Before writing code, know two things and say them: **which package owns each new file**
(`docs/architecture.md` §4) and **what will prove it works**. Anything whose shape is still in
question gets settled with the owner first — never invent a requirement.

Turn the task into something checkable — "fix the bug" means reproduce it on the real surface,
then show those steps passing.

## 4. Stop and ask the owner before

- Anything billable or external-account-shaped (Fly, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- A layer conflict §7 does not resolve.
- A product-shaped finding (missing rule, UX gap, spec ambiguity) — record it in
  `prd/registers/open-questions.md` or `prd/registers/conflicts.md` first, then continue.
- **Committing, pushing, or opening a PR.** Each needs its own yes, every time. An
  instruction to do work is never approval to commit it, and one approval never carries to
  the next. `main` is PR-only; never `--no-verify`.

## 5. Commands

`pnpm verify` — build · lint · boundaries · typecheck · test. Build runs FIRST: dep-cruiser
resolves workspace edges through `dist/`, so linting an unbuilt checkout is partially blind.

- Needs a live postgres (`DATABASE_URL`) or the invariants skip — a green run has NOT proven
  tenancy. **Read gate output, not exit codes**; an invariant over an empty schema says VACUOUS.
- Deleted a source file? `pnpm turbo build --force` — stale `dist/` keeps `boundaries` red.
- Enumerate files with `git ls-files`, never a bare glob: in zsh one unmatched pattern aborts
  the command and prints nothing, which reads as "clean".
- **Never weaken a gate to make a change pass.** Not every rule is mechanically held — see §7.

## 6. File and folder structure

**Never invent a folder.** Every tree below is a closed set — a new category is a plan-time
decision, not something to create mid-task. Put the file where the pattern already puts it.

| Where | Shape |
|---|---|
| `apps/web` | `app/<route>/page.tsx` routes only · `features/<capability>/` owns the work: `<Name>Screen.tsx` composes · `components/` one file per component · `hooks/use-<thing>.ts` · `constants.ts` · `types.ts` · `shared/` when two screens in the feature share · `lib/` for app infrastructure |
| `apps/mobile` | `src/{auth,lib,navigation,push,screens}` + root `env.ts`, `i18n.ts` · `screens/<name>/` mirrors web's feature shape: `<Name>Screen.tsx` · `components/` · `hooks/` · `styles.ts` · `types.ts` |
| `apps/api`, `apps/worker` | `src/{config,common,modules}` · one folder per module, `<m>.module.ts` + `<m>.controller.ts` + `<m>.service.ts` + `<m>.repository.ts` |
| `packages/*` | `src/` with everything public re-exported from `src/index.ts`; consumers import the index, never a deep path |
| `tests/invariants` | one file per invariant in `src/`, called from `run.ts` |
| `prd/` | the product spec — `0N-*.md` overview · `foundations/F1–F8` · `modules/M01–M13` · `registers/` (screens, traceability, conflicts, open-questions) · `_process/` |
| `tasks/` | one file per module, written to as tasks complete |
| `ux/` | `briefs/` one per screen, plus `claude-design-context.md` |
| `docs/` | how the repo is built — `docs/README.md` is the map, and every entry there carries a status |
| `docs/archive/` | frozen history: research, spikes, the offline removal, the closed design-gap register. Never cited by new work |

**Web and mobile use the SAME shape** — a screen folder composes, `components/` holds one
file each, `hooks/use-<thing>.ts` holds the logic, style sits in its own file. Only the
location and a few filenames differ.

**Naming.** A file is named for what it does. Never `*-part2`, `*2`, `*-extra`, and never for
its layer — a `components.tsx` or `hooks.ts` grab-bag is the same defect as `*-part2`. If a
split needs a number, it is the wrong split.

The full per-package registry — what each package owns, may import, and may never hold —
is `docs/architecture.md` §2. Read §4 before creating any file.

## 7. When rules conflict

Higher wins, and don't re-declare at a lower level what a higher one already fixed:

**owner rulings (`prd/registers/open-questions.md`, `conflicts.md`) → the product spec (`prd/`)
→ architecture (`docs/architecture.md`) → contracts →
design system → this file → package `CLAUDE.md` → implementation detail.**

Two tiebreakers: a **package `CLAUDE.md` beats a cross-cutting rule** — it is closer to the
code and has historically been the accurate one; and between two records, the **later-dated**
one wins. If a doc and the code disagree, fix the doc or ask.

**A rule is not enforced just because it is written.** Before trusting one, check whether a
type, a lint rule or an invariant actually holds it — several here are held only by review,
and a few are narrower than they read.

## 8. Repository rules

- **No unit tests** — never a `.test.*`/`.spec.*` file. `tests/invariants/` is the only
  executable check layer; behaviour is proven by running it.
- **Files ≲300 lines**, split by responsibility. Never `*-part2`, `*2`, `*-extra`.
- **Style never lives in the component file** — `<Name>.css` on web, `styles.ts` on RN.
- **An instruction earns its length.** State the rule, its cost, the fix — 1–3 lines. The war
  story belongs in the commit. Before adding a rule, check whether it REPLACES an existing
  one rather than stacking beside it.
- **Presentation and logic in different files** (`.claude/rules/ui-adherence.md`).
- **Config comes from `@heliogrid/env`** — a variable is a schema edit plus `.env.example`.
  Who else may read a raw source: `scripts/check-env-access.mjs`'s allowlist.
- **Mechanism order: type → lint rule → instruction → script.** A script encodes today's tree
  and rots; a new one needs an owner ruling saying why no type and no lint rule can hold it.
- **One review per change.** Findings get fixed and the work ships; multi-round adversarial
  review only when asked for by name.
- **Repo law beats a plugin skill.** Named: the test-driven-development skill never applies
  here.
- **Write to the gates.** 2-space · LF · width 100 · semicolons · single quotes (JSX double) ·
  trailing commas · organised imports · `import type` · no `any`/`!`/`==`/`console.log`/unused
  symbols · `noUncheckedIndexedAccess`. Then `pnpm exec biome check --write <files>`.

## 9. Product law

Digest of `prd/registers/open-questions.md` and the foundations `F1`–`F8`, which are canonical.

- Every user-visible number carries a provenance tier: measured / derived / estimated / assumed.
- Money never renders stale — design changed and quote not recomputed reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ payments reconcile to the currency's minor unit.
- One market and one currency per tenant; market facts (tax, stages, checklists, rails, phone
  spec) resolve from versioned market packs, never hard-coded.
- Sent proposals keep their prices; a price-book update creates a new version.
- Structural adequacy is NEVER computed — an engineer signs off, and the disclaimer travels
  with every structure-bearing output.
- Money renders in the tenant currency's grouping in every locale (INR: lakh/crore);
  kW/kWh/kWp are never translated.
- Read and export work regardless of billing state. Never hold data hostage.
- The server assigns business identifiers. No feature flags — entitlements are the only gating.

## 10. Where things are

| | |
|---|---|
| `docs/architecture.md` | **The spine** — §1 map · §2 package registry · §3 platform rules · §4 placement |
| `docs/README.md` | **The docs map** — what every file under `docs/` is, and whether it is law, live, superseded or archive |
| `START-HERE.md` | **Designing a screen** — the one file a design session starts from |
| `prd/registers/screens.md` | The screen register — 150 screens, 99 locked to V1 |
| `prd/registers/open-questions.md` · `conflicts.md` | Owner rulings · contradictions and their resolutions |
| `docs/17` | **UI architecture V2** — the design system, theme and component layer |
| `BUILD-ORDER.md` · `tasks/` | Build order · per-module tasks |
| `docs/forward-compat.md` | What each module's first migration must satisfy |
| `.claude/rules/` | Path-scoped deltas — load automatically for the paths they name |
| package `CLAUDE.md` | Local conventions and landmines |
| `docs/adr/` | Reference only — never a gate |

The verification record lives in the PR body — `/verify` writes nothing to the tree.

**Skills:** `/contract-change` · `/migration` · `/verify` · `/finish`.

What is built and what is not: `docs/architecture.md`.
