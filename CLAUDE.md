# HelioGrid — constitution

Multi-tenant SaaS for Indian solar EPC companies: CRM → survey → 3D design → proposal →
customer link → voice follow-up → projects → payments. The 3D Design Studio is the flagship.
Light-only v1 · EN/HI/MR · ₹ Indian grouping everywhere.

**Tradeoff:** these rules bias toward caution over speed. For a trivial change, use judgment —
but never skip §1's "you ran it" for anything a user can see.

## 1. What good looks like

- **Compose, don't rebuild.** `packages/` holds the vocabulary; app code spends it. Search
  before you create. When a primitive you need isn't there, ADD it to the package — never
  inline a local copy. If lint says an element or import is restricted, that is this rule.
- **One definition per fact.** A fact both platforms need is defined in a package BEFORE
  either screen uses it — never authored twice and reconciled later. Enums → contracts.
  Shared logic, policy numbers and formatters → domain. Visual values → tokens. Schema →
  migrations. Copy → the i18n catalog.
- **Screens are the unguarded surface.** The gates check packages: their API shape, their
  purity, who may import them. Almost nothing checks what a screen authors inline, and that
  is where every recent defect landed. Writing a constant, type, or helper in a screen is
  the moment to ask which package owns it.
- **Verified means you ran it.** Green gates never prove UI work — browser for web, both
  simulators for RN, curl for api — all of it through `/qa`. A task is done when you have
  looked at it.
  A red probe proves nothing until you read WHY it went red: a syntax error in the probe, an
  earlier gate failing first, or a pipeline's own exit code all look exactly like a catch.
- **Read call sites, not declarations.** Two platforms reach the same behaviour through
  differently-named state. Comparing what each side DECLARES produces confident, wrong findings.
- **Small and honest beats broad and hedged.** Say what you checked and what you did not.

## 2. Think before coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

- **State your assumptions** before you implement. If uncertain, ask.
- **Two readings of the request → present both.** Choosing one silently is the failure the
  stop-and-ask triggers in `.claude/rules/00-laws.md` exist to prevent.
- **A simpler approach exists → say so.** Push back when warranted; a recommendation you
  withheld is a decision you made on the owner's behalf without telling them.
- **Unclear → stop.** Name what is confusing, then ask. Never invent a requirement.

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

## 5. Goal-driven execution

**Define success criteria, then loop until they hold.**

Turn the task into something checkable before starting. **This repo has no unit tests (§8),
so the criterion is never "write a test" — it is running the thing:**

- "Add validation" → drive the invalid inputs through `/qa`; read the error envelope and the
  status the contract declares.
- "Fix the bug" → reproduce it on the real surface first, then show those same steps passing.
- "Refactor X" → gates green before and after, plus the screen actually walked in `/qa`.
- Schema or tenancy work → `pnpm turbo test` runs `tests/invariants/`; that is the proof.

For multi-step work, state the plan first, with one verification per step:

1. [step] → verify: [the command or surface that proves it]
2. [step] → verify: [...]

Weak criteria ("make it work") force constant clarification. Strong ones let you finish
without asking.

## 6. Commands

`pnpm verify` — lint · boundaries · typecheck · test · build. That is the gate set.
(`test` runs only `tests/invariants/` — there are no unit tests anywhere.)
Per package: see its own CLAUDE.md §Commands.

Needs a live postgres (`DATABASE_URL`): without one the invariants skip loudly, so a green
run has NOT proven tenancy. Enumerate files with `git ls-files`, never a bare glob — in zsh a
single unmatched pattern aborts the whole command and prints nothing, which reads as "clean".

**Never weaken a gate to make a change pass.** A gate that blocks you means the change is
wrong. Rule → mechanism matrix: docs/17 §5.

## 7. Product law (owner rulings — port, don't reinvent)

- Every user-visible number carries a provenance tier: measured / derived / estimated / assumed.
- Money never renders stale: design changed + quote not recomputed → the figure reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ project payments reconcile to the paisa.
- Sent proposals keep their prices; a price-book update creates a new version.
- Structural adequacy is NEVER computed — an engineer signs off (who + when), and the
  disclaimer travels with every structure-bearing output.
- ₹ uses Indian grouping in every locale; kW/kWh/kWp are never translated.
- Read + export work regardless of billing state. Never hold data hostage.
- The server assigns business identifiers. No feature flags — entitlements are the only gating.

## 8. Process

- **No unit tests.** Never a `.test.*` or `.spec.*` file (owner directive 2026-07-29). The only
  executable checks are `tests/invariants/`. Verify by running the thing (§5).
- **Files ≲450 lines, split by responsibility.** Name the new file for what it does — never
  `*-part2`, `*2`, `*-extra`. A split needing a number is the wrong split.
- **Presentation and logic in different files.** Detail: `.claude/rules/ui-adherence.md`.
- **Config comes from `@heliogrid/env`** — the only package that reads a raw source. Adding a
  variable edits a schema there and `.env.example`, nothing else. The allowlist in
  `scripts/check-env-access.mjs` is the authority: `apps/web/lib/env.ts` is a deliberate
  exception (Next inlines `NEXT_PUBLIC_*` only in code it compiles), so do not "fix" it.
- **Mechanism order: type → lint rule → instruction → script.** A script encodes today's tree
  and rots. Do not add new checker scripts; a new one needs an owner ruling saying why no type
  and no lint rule can hold it.
- **Git is manual.** Commit only when asked for a commit, in those words. Finishing the work
  is not a trigger, and neither is "fix it" — that authorises the fix, not the commit. Leave
  changes in the working tree and say what is there. When asked, prefer several small commits
  over one sweep: the diff is what the owner reads. Branches and PRs only on explicit command.
- **One review per change.** Findings get fixed and the change ships. A bug that reaches main is
  fixed as a bug — it does not trigger an audit of the audit. Multi-round adversarial review
  happens only when the owner asks for it by name.
- **Write to the gates, don't lint after the fact.** 2-space · LF · width 100 · semicolons ·
  single quotes (JSX double) · trailing commas · organized imports · `import type` for types
  (except apps/api|worker) · no `any` / `!` / `==` / `console.log` / unused symbols ·
  `process.env` only where `scripts/check-env-access.mjs` allows it · indexing yields `T | undefined`
  (noUncheckedIndexedAccess). Then `pnpm exec biome check --write <files>` before presenting.

## 9. Where things are

Laws 1–9 and the stop-and-ask triggers: `.claude/rules/00-laws.md` (auto-loads, as do the
path-scoped rules: `ui-adherence.md`, `contracts.md`, `db-schema.md`, `i18n.md`).
Governance and the rule → mechanism matrix: docs/17. Product truth: docs/15 rulings and the
docs/13 UX-gap register. Layer law: each package's own CLAUDE.md.

**Where work lives** (per-module roadmaps were deleted 2026-07-31, docs/17 §3): a plan per
piece of work under `docs/superpowers/plans/`; what was actually run is the committed
`.qa/<run-id>/` evidence from `/qa`; `docs/14` is the cross-module plan of record; design
constraints that must be honoured early are `docs/forward-compat.md`. Three skills exist —
`/contract-change`, `/migration`, `/qa`.
