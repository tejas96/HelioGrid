# HelioGrid — constitution

Multi-tenant SaaS for solar EPC companies — India primary, global-capable backend: CRM →
survey → 3D design → proposal → customer link → voice follow-up → projects → payments. The
3D Design Studio is the flagship. Light-only v1 · EN/HI/MR UI · tenant-currency money (INR v1).

**Tradeoff:** these rules bias toward caution over speed. For a trivial change, use judgment —
but never skip §1's "you ran it" for anything a user can see.

## 1. What good looks like

- **Architecture decides placement, not habit.** Run `docs/architecture.md` §4 before writing
  any new file, constant, type or helper — it names the owning package.
- **Compose, don't rebuild.** `packages/` holds the vocabulary; app code spends it. When a
  primitive you need isn't there, ADD it to the package — never inline a local copy. If lint
  says an element or import is restricted, that is this rule.
- **One definition per fact** (Law 11). A fact both platforms need is defined in a package
  BEFORE either screen uses it — never authored twice and reconciled later.
- **Screens are the unguarded surface.** The gates check packages; almost nothing checks what
  a screen authors inline, and that is where every recent defect landed. Writing a constant,
  type or helper in a screen is the moment to ask which package owns it.
- **Verified means you ran it** — `/verify`, on the real surface. A task is done when you
  have looked at it. A red probe proves nothing until you read WHY it went red; a GREEN gate
  proves nothing until you have seen it go red on an injected violation.
- **Read call sites, not declarations.** Two platforms reach the same behaviour through
  differently-named state. Comparing what each side DECLARES produces confident, wrong findings.
- **Minimise blast radius.** If something small needs edits across many unrelated files, the
  architecture is wrong. Say so before writing the workaround.
- **Small and honest beats broad and hedged.** Say what you checked and what you did not.

## 2. Think before coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- **State your assumptions** before you implement. If uncertain, ask.
- **Two readings of the request → present both.** Choosing one silently is the failure the
  stop-and-ask triggers in `.claude/rules/00-laws.md` exist to prevent.
- **A simpler approach exists → say so.** Push back when warranted; a recommendation you
  withheld is a decision you made on the owner's behalf without telling them.
- **Unclear → stop.** Name what is confusing, then ask. Never invent a requirement.
- **Architecture shifts at plan time.** Better fit found while coding → say so; never switch
  silently.
- **Every change traces to something asked for** — a docs/product D-decision or a mockup
  file. Don't build what nobody requested.

## 3. Simplicity first

**The minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or configurability nobody requested.
- No error handling for states that cannot occur.
- Wrote 200 lines where 50 would do? Rewrite it.
- The test: would a senior engineer call this overcomplicated? Then it is.

This does not contradict "compose, don't rebuild" (§1). Reach for an existing package
primitive every time; do not *invent* a new one to serve a single caller.

## 4. Surgical changes

**Touch only what you must. Clean up only your own mess.**

- Don't "improve" adjacent code, comments or formatting.
- Don't refactor what isn't broken.
- Match the surrounding style, even where you would do it differently.
- Spot unrelated dead code → mention it, don't delete it.
- Remove the imports, variables and helpers that YOUR change orphaned — the no-unused-symbols
  rule in §8 fails on them anyway.
- The test: every changed line traces to the request.

Edit/Write for all file changes; comment only what the code cannot say.

## 5. The loop — every piece of work

**Brainstorm → plan → implement → `/verify` → `/finish`.**

1. **Brainstorm** (superpowers) — a spec under `docs/superpowers/specs/`. Skip only for a
   change whose shape is not in question.
2. **Plan** (superpowers) — a plan under `docs/superpowers/plans/`. Every plan carries two
   mandatory sections: **Architecture Placement** (each new file's owning package per
   `docs/architecture.md` §4, decided BEFORE code) and **Verification Plan** (which surfaces
   `/verify` will drive and what proves each step).
3. **Implement** — the plan's tasks in order, each ending in a working state.
4. **`/verify`** — the QA loop. This repo has NO unit tests (§8); running the thing is the
   only proof.
5. **`/finish`** — gates, architecture review, then the PR proposal.

Turn the task into something checkable before starting — "fix the bug" means reproduce it on
the real surface first, then show those steps passing. Weak criteria ("make it work") force
constant clarification. Strong ones let you finish without asking.

## 6. Commands

`pnpm verify` — build · lint · boundaries · typecheck · test. Build runs FIRST:
dependency-cruiser resolves workspace edges through `dist/`, so linting an unbuilt checkout
is partially blind. `test` is only `tests/invariants/`. Per package: its own §Commands.

Needs a live postgres (`DATABASE_URL`): without one the invariants skip loudly, so a green
run has NOT proven tenancy — and read their output, since an invariant over an empty schema
announces itself VACUOUS. Enumerate files with `git ls-files`, never a bare glob — in zsh one
unmatched pattern aborts the command and prints nothing, which reads as "clean".

**Never weaken a gate to make a change pass.** A gate that blocks you means the change is
wrong. What each gate can actually hold: docs/17 §5.

**Deleted a source file? `pnpm turbo build --force`** — `tsc -b` leaves its output behind and
turbo's cache restores it, so `boundaries` keeps failing on a module you removed. (Deleting
also triggers Law 8's deletion sweep. `knip`/`jscpd` are on-demand, not gates.)

**Zero Biome warnings and zero typecheck errors, repo-wide** — `--error-on-warnings` makes a
warning fail exactly like an error. The pre-commit hook runs biome on staged files and
typecheck on the whole repo. Fix the diagnostic; never widen the gate or use `--no-verify`.

## 7. Product law — digest of docs/15 (owner rulings; docs/15 is canonical)

- Every user-visible number carries a provenance tier: measured / derived / estimated / assumed.
- Money never renders stale: design changed + quote not recomputed → the figure reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ project payments reconcile to the minor unit
  of the tenant's currency (paisa for INR).
- Every tenant belongs to ONE market (country) and ONE currency. Market facts — tax scheme,
  stage labels, document checklists, payment rails, phone spec, compliance rules — resolve
  from versioned market packs (docs/02 §10), never hard-coded.
- Sent proposals keep their prices; a price-book update creates a new version.
- Structural adequacy is NEVER computed — an engineer signs off (who + when), and the
  disclaimer travels with every structure-bearing output.
- Money renders with the tenant currency's market grouping in every locale (INR: lakh/crore,
  never a locale-default separator); kW/kWh/kWp are never translated.
- Read + export work regardless of billing state. Never hold data hostage.
- The server assigns business identifiers. No feature flags — entitlements are the only gating.

## 8. Process

- **No unit tests.** Never a `.test.*` or `.spec.*` file (owner directive 2026-07-29). The only
  executable checks are `tests/invariants/`. Verify by running the thing (§5).
- **Files ≲450 lines, split by responsibility.** Name the new file for what it does — never
  `*-part2`, `*2`, `*-extra`. A split needing a number is the wrong split.
- **An instruction earns its length.** Rules load every turn; a long one gets skimmed, which
  makes it worse than no rule. State the rule, its cost, and the fix — 1–3 lines. The war
  story belongs in the commit or the ADR, not here. Before adding one, check whether it
  replaces an existing rule instead of stacking beside it.
- **Presentation and logic in different files.** Detail: `.claude/rules/ui-adherence.md`.
- **Repo law beats a plugin skill.** Installed skills may trigger on work this repo governs
  differently; where they disagree, this file wins. Named: the test-driven-development skill
  never applies here — there are no unit tests, and `/verify` is the verification mechanism.
- **Config comes from `@heliogrid/env`.** Adding a variable edits a schema there and
  `.env.example`, nothing else. Who else may read a raw source: `docs/architecture.md` §2 env
  (the `scripts/check-env-access.mjs` allowlist is the authority).
- **Mechanism order: type → lint rule → instruction → script.** A script encodes today's tree
  and rots. Do not add new checker scripts; a new one needs an owner ruling saying why no type
  and no lint rule can hold it.
- **Git: branch, propose, never push unasked.** `/finish` proposes the branch, commit
  batching and PR body; **committing, pushing and opening the PR each need an explicit yes**.
  `main` is PR-only. Never `--no-verify`. Small commits over one sweep — the diff is what the
  owner reads.
- **One review per change.** Findings get fixed and the change ships. A bug that reaches main is
  fixed as a bug — it does not trigger an audit of the audit. Multi-round adversarial review
  happens only when the owner asks for it by name.
- **Write to the gates, don't lint after the fact.** 2-space · LF · width 100 · semicolons ·
  single quotes (JSX double) · trailing commas · organized imports · `import type` for types
  (except apps/api|worker) · no `any` / `!` / `==` / `console.log` / unused symbols ·
  `process.env` only where `scripts/check-env-access.mjs` allows it · indexing yields `T | undefined`
  (noUncheckedIndexedAccess). Then `pnpm exec biome check --write <files>` before presenting.

## 9. Where things are

**`docs/architecture.md`** — §1 module map · §2 package registry · §3 platform rules ·
§4 placement. docs/02 and docs/03 are design records: intent, not current contents.

The Laws and the stop-and-ask triggers: `.claude/rules/00-laws.md` (auto-loads, as do the
path-scoped rules: `web-platform.md`, `mobile-platform.md`, `cross-platform.md`,
`ui-adherence.md`, `contracts.md`, `db-schema.md`, `i18n.md`). Governance, the decision
hierarchy and the rule → mechanism matrix: docs/17 — read the matrix's **Holds** column
before trusting a rule to be mechanically enforced. Product truth: docs/15 rulings and the
docs/13 UX-gap register. Package-local conventions and landmines: each package's own
CLAUDE.md. `docs/adr/` is reference only — never a gate, never write one before building;
replaced architecture deletes the old file.

**Frontend data path is `@heliogrid/data`, nothing else** (ADR-0023) — a frontend app
importing `@ts-rest/*` or an auth client fails the lint gate. **Auth is absent** (ADR-0024):
db is greenfield, tenancy unproven, both logins on a walkthrough stub the rebuild deletes.

**Where work lives:** a spec per piece of work under `docs/superpowers/specs/`, a plan under
`docs/superpowers/plans/`, and the verification record in the PR body — `/verify` writes
nothing to the working tree. `docs/14` is the cross-module plan of record; design constraints
that must be honoured early are `docs/forward-compat.md`.

**Skills:** `/contract-change`, `/migration`, `/verify`, `/finish`.
