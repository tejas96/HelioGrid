# Foundation slim-down — next session

**Goal:** cut the governance machinery to what catches real defects, and make the instructions
short enough that agents actually follow them. Owner directive 2026-07-31, after a session that
spent ~10M tokens and still shipped a screen that ignores the design system.

**Success is measured, not asserted:**
- instruction corpus (CLAUDE.md + .claude/rules/ + per-package CLAUDE.md) under ~150 lines total
  (today: 389, plus 259 in docs/17)
- zero hooks, zero permission denies
- every surviving gate either has caught a real defect, or guards tenancy/money/contracts/parity
  with no other backstop
- `OnboardingScreen.tsx` composed from `@heliogrid/ui` — 0 raw `hg-*`
- a written stopping rule for reviews, in CLAUDE.md

**Non-goal:** another audit. If something is wrong, fix that thing. Do not review the reviewer.

---

## The evidence this plan responds to

`apps/web/features/auth/onboarding/OnboardingScreen.tsx` — 0 imports from `@heliogrid/ui`,
12 raw `hg-*` classes. `apps/web/CLAUDE.md` forbids exactly this in two separate bullets. It
passed implementation, task review, and a whole-branch opus review, because none of the 24
cruiser rules / 6 lint gates / 7 adherence checks / 118-prop parity contract looks at it.

The parity contract verifies web and RN components MATCH. Nothing verifies anyone USES them.

---

## Task 1 — Delete the hooks and permission denies

**Files:** `.claude/hooks/*` (3 files, 260 lines) · `.claude/settings.json` · `docs/17` §5 rows

- [ ] Delete `bash-guard.sh`, `write-guard.sh`, `edit-checks.sh` and their `hooks` wiring in
      `.claude/settings.json`.
- [ ] Remove `permissions.deny` entries. Keep `permissions.allow` — that reduces prompts, which
      is the opposite problem.
- [ ] docs/17 §5: delete the rows whose only mechanism was a hook. For each, either the rule
      moves to lint, or it becomes prose with an honest justification. Do NOT leave a row
      claiming hook enforcement.
- [ ] Verify: `pnpm lint` green; `git status` clean.

Rationale to record in the commit: measured zero real mistakes prevented in the 2026-07-31
session, ~5 false blocks of legitimate probe commands. Test-file and migration protection both
survive at lint and in the migration runner's sha256 lock.

## Task 2 — The gate that was actually missing, and the bug it let through

**Files:** `.dependency-cruiser.cjs` · `apps/web/features/auth/onboarding/*`

- [ ] Add cruiser rule `web-screens-compose-from-ui`: a file under `apps/web/features/**` that
      renders markup must import `@heliogrid/ui`. If a graph rule cannot express it, use a
      Biome `noRestrictedSyntax`-shaped rule on `className` values matching `hg-`. Pick whichever
      actually fires — prove it on a probe before committing.
- [ ] Rewrite `OnboardingScreen.tsx` using `Card`, `Input`, `Button`, `SegmentedControl` from
      `@heliogrid/ui`. Keep `SEGMENT_LABEL` as `Record<TenantSegment,…>` (documented landmine)
      and keep every msgid byte-identical.
- [ ] Check the other two offenders: `DesignScreen.tsx` (3 `hg-*`) and `GalleryScreen.tsx` (3).
      The design reference may legitimately use raw markup to demo tokens — if so, exempt it by
      path WITH the reason, do not weaken the rule.
- [ ] Verify: gate fires on a planted `hg-*` in a feature screen; `pnpm lint` green; walk
      `/onboarding` in the browser and confirm it looks unchanged.

## Task 3 — Instructions become goals

**Files:** `CLAUDE.md` · `.claude/rules/*.md` · `apps/*/CLAUDE.md` · `packages/*/CLAUDE.md`

The test for every surviving line: **could an agent act differently because of it?** If it
describes history, restates a working gate, or explains procedure, delete it.

- [ ] `CLAUDE.md` → what this product is, the handful of laws that change decisions, and where
      to look. Target ≤40 lines.
- [ ] `.claude/rules/` → merge the four files. Most of their content is either enforced by a
      gate (delete) or narrative (delete).
- [ ] Per-package `CLAUDE.md` → keep §Commands and §Landmines. Landmines are the highest-value
      thing in this corpus — they are incident records that cost real debugging. Cut the rest.
- [ ] docs/17 → it is the rule→mechanism matrix and nothing else. Delete restated laws.
- [ ] Verify: `wc -l` the corpus and record before/after in the commit.

## Task 4 — Prune the gates

**Files:** `scripts/*` (741 lines across 5) · `.dependency-cruiser.cjs`

For each gate ask: has it caught a real defect, or does it guard tenancy/money/contracts/parity
with no other backstop? Keep those. Everything else goes.

- [ ] KEEP without question: `tests/invariants/*` (found real RLS holes), the layer rules in
      dependency-cruiser, boundaries, biome, the ui-api parity assertions.
- [ ] `scripts/check-adherence.sh` is 7 checks in ~250 lines, most of it comments about past
      bugs. Keep the checks that guard something real; move the comments to git history.
- [ ] Verify each surviving gate still fires on a probe. A gate nobody proves is a gate nobody
      has.

## Task 5 — Write the stopping rule

**Files:** `CLAUDE.md`

- [ ] Add, in about four lines: one review per change. Findings get fixed. A bug that ships
      gets fixed as a bug — it does not trigger an audit of the audit. Adversarial multi-round
      review happens only when the owner asks for it, by name.

---

## Execution

Use `superpowers:subagent-driven-development` — the skill works; the previous session's failures
were in the plan text, not the loop. Two changes to how it is driven:

1. **The controller does not write prose the reviewer must then catch.** Six of nine fix rounds
   last time were defects in plan text. Keep briefs short and factual.
2. **One fix round per task.** If a second is needed, that is a signal the task was wrong —
   stop and re-scope rather than iterating.
