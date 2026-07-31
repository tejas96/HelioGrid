# HelioGrid — constitution

Multi-tenant SaaS for Indian solar EPC companies: CRM → survey → 3D design → proposal →
customer link → voice follow-up → projects → payments. The 3D Design Studio is the flagship.
Light-only v1 · EN/HI/MR · ₹ Indian grouping everywhere.

## What good looks like

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
  simulators for RN (`/verify-app`), curl for api. A task is done when you have looked at it.
- **Small and honest beats broad and hedged.** Say what you checked and what you did not.

## Commands

`pnpm verify` — lint · boundaries · typecheck · test · build. That is the gate set.
Per package: see its own CLAUDE.md §Commands.

**Never weaken a gate to make a change pass.** A gate that blocks you means the change is
wrong. Rule → mechanism matrix: docs/17 §5.

## Product law (owner rulings — port, don't reinvent)

- Every user-visible number carries a provenance tier: measured / derived / estimated / assumed.
- Money never renders stale: design changed + quote not recomputed → the figure reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ project payments reconcile to the paisa.
- Sent proposals keep their prices; a price-book update creates a new version.
- Structural adequacy is NEVER computed — an engineer signs off (who + when), and the
  disclaimer travels with every structure-bearing output.
- ₹ uses Indian grouping in every locale; kW/kWh/kWp are never translated.
- Read + export work regardless of billing state. Never hold data hostage.
- The server assigns business identifiers. No feature flags — entitlements are the only gating.

## Process

- **No unit tests.** Never a `.test.*` or `.spec.*` file (owner directive 2026-07-29). The only
  executable checks are `tests/invariants/`. Verify by running the thing.
- **Files ≲450 lines, split by responsibility.** Name the new file for what it does — never
  `*-part2`, `*2`, `*-extra`. A split needing a number is the wrong split.
- **Presentation and logic in different files.** Detail: `.claude/rules/ui-adherence.md`.
- **Config comes from `@heliogrid/env`** — the only package that reads a raw source. Adding a
  variable edits a schema there and `.env.example`, nothing else.
- **Mechanism order: type → lint rule → instruction → script.** A script encodes today's tree
  and rots. Do not add new checker scripts; a new one needs an owner ruling saying why no type
  and no lint rule can hold it.
- **Git is manual.** Commit when asked. Branches and PRs only on explicit command.
- **One review per change.** Findings get fixed and the change ships. A bug that reaches main is
  fixed as a bug — it does not trigger an audit of the audit. Multi-round adversarial review
  happens only when the owner asks for it by name.
- Edit/Write for all file changes. Match surrounding style; comment only what code cannot say.

## Where things are

Laws 1–9 and the stop-and-ask triggers: `.claude/rules/00-laws.md` (auto-loads).
Governance and the rule → mechanism matrix: docs/17. Product truth: docs/15 rulings plus the
module's `specs/` extraction. Layer law: each package's own CLAUDE.md.
