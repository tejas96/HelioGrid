# HelioGrid — constitution

Multi-tenant SaaS for Indian solar EPC companies: CRM → survey → 3D design → proposal →
customer link → voice follow-up → projects → payments. The 3D Design Studio is the flagship;
nothing is compromised against it. Light-only v1 · EN/HI/MR · ₹ Indian grouping everywhere.

## How work happens here
- Work exists only as a module-roadmap task (docs/modules/<module>.md). No roadmap → /roadmap.
- Implement through /slice. It loads the task's context; do not read the docs corpus wholesale.
- Conflicts resolve by the decision hierarchy in docs/17. When a doc and code disagree:
  STOP, reconcile the doc first (or flag to the owner). Docs are load-bearing for other agents.
- Stop-and-ask triggers: .claude/rules/00-laws.md (auto-loads).

## Commands
**`pnpm verify`** runs the whole gate set: lint · boundaries · typecheck · test · build.
Individually: pnpm lint · pnpm boundaries · pnpm turbo typecheck · pnpm turbo test · pnpm turbo build
A task is DONE only when gates are green AND the change is verified running — browser AND
both simulators for UI (/verify-app), curl/logs for api/worker. Green gates never prove UI work.
**Never weaken a gate config to make a change pass** — a gate that blocks you means the
change is wrong. Rule→mechanism matrix: docs/17.

## Product law (owner rulings + POC spec — port, don't reinvent)
- Every user-visible number carries a provenance tier: measured / derived / estimated / assumed.
- Money never renders stale: design changed + quote not recomputed → figure reads provisional.
- One money path: BOM ↔ proposal ↔ tranches ↔ project payments reconcile to the paisa.
- Sent proposals keep their original prices; price-book updates create new versions.
- Structural adequacy is NEVER computed — engineer sign-off recorded (who + when), and the
  disclaimer travels with every structure-bearing output.
- ₹ uses Indian grouping (lakh/crore) in every locale; kW/kWh/kWp are never translated.
- Read + export always work regardless of billing state. Never hold data hostage.
- Server assigns all business identifiers. No feature flags — entitlements are the only gating.

## Testing
Deliberately thin by owner decision: `tests/invariants/` (the locked set) + on-demand
`scripts/`. Nothing else, ever, without explicit owner approval.

## Process
- Edit/Write tools for ALL file changes. In-place stream edits are blocked by a hook.
- **NO UNIT TESTS. Never create a `.test.*` or `.spec.*` file** in any app or package
  (owner directive 2026-07-29 — a testing program comes after the product is complete).
  The only executable checks are `tests/invariants/` and on-demand `scripts/`. Verify
  features by RUNNING them (/verify-app). Adding any test needs an explicit owner request.
- **Files ≲450 lines, split by RESPONSIBILITY.** The new file is named for what it does
  (`auth.invites.service.ts`, `login.countdown.ts`) — NEVER `*-part2`, `*2`, `*-extra`,
  `*-continued`. A split needing a numeric suffix is the wrong split.
- **React: presentation and logic live in different files.** Container holds data, state
  and handlers; presentational components take props and return markup. Detail:
  `.claude/rules/ui-adherence.md`.
- **Config comes from `@heliogrid/env`, the ONLY package that reads a raw source.** Schemas
  live in `packages/env/src/schema/` (one per consumer: api, worker, invariants, web, mobile,
  plus shared `fragments.ts`), reached through three entry modules — `@heliogrid/env/server`,
  `/web`, `/native`. Each app's own env file only decides what a failure means. Adding a
  variable edits a schema there and `.env.example` — nothing else. Enforced by Biome
  `noProcessEnv` + `pnpm check:env` + the turbo `env` boundary tag. No secret literal in code.
- **Git is manual.** Commit when the user asks. Create branches or PRs ONLY on an explicit
  user command — never open a PR or push unprompted.
- Match surrounding style; comments only for constraints code can't express.

Laws 1–9, the decision hierarchy and stop-and-ask triggers: `.claude/rules/00-laws.md`
(auto-loads, no `paths:` frontmatter) · layer law: each package's CLAUDE.md · governance:
docs/17 · product truth: docs/15 rulings + the module's specs/ extraction.
