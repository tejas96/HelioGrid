# Governance Rebuild — Phases 0 & 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute Phase 0 ("Stop the lies": purge false enforcement claims + five mechanical
wins) and Phase 1 (author the architecture spine, slim the 15 package/app CLAUDE.mds) of the
approved governance rebuild spec.

**Architecture:** Spec: `docs/superpowers/specs/2026-08-02-governance-rebuild-design.md`
(read §0 decision log and §3 fact-ownership model before starting). Phase 0 makes every
governance claim true *today*; Phase 1 creates `docs/architecture.md` as the single canonical
home for inter-package facts and reduces package CLAUDE.mds to intra-package content.

**Tech Stack:** Markdown governance docs · Biome 2.5.5 · dependency-cruiser 16.10.4 ·
Turborepo 2.10.7 boundaries · tests/invariants (tsx, postgres) · pnpm 10.34.5.

## Global Constraints

- **No unit tests, ever** — no `.test.*`/`.spec.*` files (owner directive 2026-07-29).
  `tests/invariants/` is the only executable check layer; Task 7's new file is an invariant,
  not a test.
- **Zero Biome warnings/errors repo-wide** after every task: `pnpm lint` must stay green.
- **Edit/Write tools only** — never `sed -i` or shell stream edits.
- **Git protocol (spec G-1):** at execution start, propose to the owner: branch
  `governance/phase-0` (commit 1 = the spec + this plan; then one commit per task), PR at
  Phase 0's end; then branch `governance/phase-1` off main after PR 1 merges, one commit per
  task, PR at Phase 1's end. One owner approval covers the flow's commits; **push and PR
  creation each need an explicit yes at that moment.** Commit messages below are the
  proposals.
- **Surgical diffs:** every changed line traces to a numbered fix in this plan or the spec's
  Appendix A. Do not reformat, re-wrap, or "improve" adjacent prose.
- Two files this plan edits are also owned by later phases (CLAUDE.md, docs/17). Phase 0
  makes them *true*, not *restructured* — resist rewriting beyond the listed edits.
- The date is 2026-08-03. Date-stamp any new landmine/ruling lines you author with it.

---

# PHASE 0 — Stop the lies (branch `governance/phase-0`, one PR)

### Task 1: Purge the false PreToolUse-hook claims

The hook was deleted 2026-07-31 (commit a4a453c); two files still claim it exists. Real
enforcement today: the sha256 lock in `packages/db/src/migrate.ts` + CI's
`git diff --diff-filter=MDR` guard (`.github/workflows/ci.yml`, "migrations append-only"
step). A real hook returns in Phase 3 — these files get re-updated then; today they must
not promise a gate that is not there.

**Files:**
- Modify: `.claude/rules/db-schema.md:9-12`
- Modify: `.claude/skills/migration/SKILL.md:17-18`

**Interfaces:** none (prose).

- [ ] **Step 1: Fix db-schema.md**

Replace (exact current text):

```markdown
- **Migrations are append-only** and sha256-locked by the runner. Editing an applied file
  makes `migrate` refuse to run (a PreToolUse hook also blocks the edit). Add a new
  numbered file instead. Overridden once, by owner ruling, in the auth teardown (docs/15
  R19) — not precedent. `migrations/` is empty; the next file is a fresh `0001`.
```

with:

```markdown
- **Migrations are append-only** and sha256-locked by the runner. Editing an applied file
  makes `migrate` refuse to run, and CI's `git diff --diff-filter=MDR` guard rejects the
  PR (no pre-edit hook exists — deleted 2026-07-31). Add a new numbered file instead.
  Overridden once, by owner ruling, in the auth teardown (docs/15
  R19) — not precedent. `migrations/` is empty; the next file is a fresh `0001`.
```

- [ ] **Step 2: Fix migration SKILL.md**

Replace (exact current text):

```markdown
Number one above the highest. Editing an applied file is blocked by a hook, and would make
the sha256-locked runner refuse to run at all.
```

with:

```markdown
Number one above the highest. Editing an applied file makes the sha256-locked runner refuse
to run at all, and CI's append-only guard (`git diff --diff-filter=MDR`) rejects the PR.
```

- [ ] **Step 3: Verify no hook claim remains anywhere**

Run: `grep -rn "PreToolUse\|blocked by a hook" .claude/ docs/ CLAUDE.md`
Expected: zero matches (docs/superpowers/ historical plans/specs excepted — if matches are
only under `docs/superpowers/`, that is PASS; those are dated records, never edited).

- [ ] **Step 4: Commit**

`git commit -m "fix(governance): migration append-only claims match real enforcement (no hook exists)"`

### Task 2: docs/17 truth sweep

Seven verified stalenesses in the one governance document. Edit only the listed lines.

**Files:**
- Modify: `docs/17-engineering-governance.md`

**Interfaces:** none (prose).

- [ ] **Step 1: Fix §3's ".qa committed" contradiction (lines 74-76)**

Replace:

```markdown
What replaces them: **plans are authored per piece of work** under
`docs/superpowers/plans/`, and the record of what was actually run lives in the committed
`.qa/<run-id>/` evidence from `/qa`. `docs/14` remains the cross-module plan of record.
```

with:

```markdown
What replaces them: **plans are authored per piece of work** under
`docs/superpowers/plans/`. `/qa` evidence under `.qa/<run-id>/` is **local-only and
gitignored** (owner ruling 2026-08-02) — a VERIFIED claim must be restated in the PR or the
plan, because the repo carries no proof of it. `docs/14` remains the cross-module plan of
record.
```

- [ ] **Step 2: Fix Law 1's dead roadmap clause (lines 19-21)**

Replace:

```markdown
**Law 1 — Foundation before features.** Feature modules build ONLY on the landed
foundation (tokens → components → contracts → guards). Module work proceeds via per-module
roadmaps (§3).
```

with:

```markdown
**Law 1 — Foundation before features.** Feature modules build ONLY on the landed
foundation (tokens → components → contracts → guards). Module work proceeds via plans
under `docs/superpowers/plans/` (§3).
```

- [ ] **Step 3: Drop the literal rule count (line 118)**

In the "Dependency direction & layer purity" row, replace the mechanism cell text
`dependency-cruiser, 27 rules, all `error`` with `dependency-cruiser, all rules `error``.

- [ ] **Step 4: Delete the dead lens-agents row (line 157)**

Delete the entire row:

```markdown
| Review lenses cannot mutate what they review | the three lens agents hold `Read, Grep, Glob` and not Bash | subagent config | `.claude/agents/*.md` |
```

(`.claude/agents/` does not exist; the /lenses skill was deleted 2026-07-31 per §3.
Phase 3 re-creates the directory with the QA/review agents and adds a new, true row.)

- [ ] **Step 5: Repoint the sed-i prose row (line 173)**

Replace its "Enforced by" cell `` `CLAUDE.md` §Process `` with
`` `CLAUDE.md` §4 (Edit/Write for all file changes) `` — the §Process text it cites does
not exist; §4's line does.

- [ ] **Step 6: Re-home the orphaned reference-integrity row (line 183)**

Replace its "Enforced by" cell `` `/doc-sync` `` with
`unowned since the 2026-07-31 skill deletion — returns as an arch-reviewer check (governance rebuild Phase 3)`.

- [ ] **Step 7: Repair the garbled Appendix A line-budget bullet (lines 221-224)**

Replace:

```markdown
- Line budget: **≤50 lines default, ≤70 for api/mobile/db/env** — LANDMINES DO NOT COUNT.
  They are the healthiest part of this corpus and capping them would delete the incident
  record. The earlier ≤40/≤65 was exceeded by half the files it governed. (which carry standing law and the
  most incident history).
```

with:

```markdown
- Line budget: **≤50 lines default, ≤70 for api/mobile/db/env** — LANDMINES DO NOT COUNT.
  They are the healthiest part of this corpus and capping them would delete the incident
  record. The earlier ≤40/≤65 was exceeded by half the files it governed.
```

- [ ] **Step 8: Verify**

Run: `grep -n "27 rules\|/doc-sync\|lens agents\|roadmaps (§3)" docs/17-engineering-governance.md`
Expected: zero matches, except §3's historical sentence naming the /doc-sync deletion and
the reference-integrity row's "unowned since the 2026-07-31 skill deletion" cell (both
describe the deletion; neither claims the skill exists). Then
`grep -n "committed" docs/17-engineering-governance.md` — the only §3 hit must be the new
"local-only and gitignored" sentence (Appendix A's "SAME commit" authoring rule also
matches; that one is fine).

- [ ] **Step 9: Commit**

`git commit -m "docs(17): truth sweep — .qa ruling, Law 1 clause, dead rows, counts, garbled bullet"`

### Task 3: CI label + CLAUDE.md gate-line truth fixes

**Files:**
- Modify: `.github/workflows/ci.yml` (the `Package boundaries` step name)
- Modify: `CLAUDE.md` §6 (gate order — pairs with Task 8) and §8 (push wording)

**Interfaces:** none.

- [ ] **Step 1: Fix the dead law citation in ci.yml**

Replace the step name line:

```yaml
      - name: Package boundaries (turbo tags — docs/17 Law 2)
```

with:

```yaml
      - name: Package boundaries (turbo tags — coarse cover; dependency-cruiser is authoritative)
```

- [ ] **Step 2: Add "push" to CLAUDE.md §8's git line**

In §8, replace the sentence fragment
`Branches and PRs only on explicit command.` with
`Branches, pushes and PRs only on explicit command.`
(This stays true under spec G-1: push always requires an explicit yes.)

- [ ] **Step 3: Update CLAUDE.md §6's gate-order line to match Task 8's reorder**

Replace:

```markdown
`pnpm verify` — lint · boundaries · typecheck · test · build. That is the gate set.
```

with:

```markdown
`pnpm verify` — build · lint · boundaries · typecheck · test. That is the gate set. Build
runs first: dependency-cruiser resolves workspace edges through `dist/`, so linting an
unbuilt checkout is partially blind (proven 2026-07-31, see ci.yml).
```

- [ ] **Step 4: Verify**

Run: `grep -rn "Law 2" .github/workflows/ci.yml; grep -n "Branches and PRs only" CLAUDE.md`
Expected: zero matches for both.

- [ ] **Step 5: Commit**

`git commit -m "fix(governance): dead Law 2 citation, push wording, verify gate order doc"`

### Task 4: Biome ban on @lingui/macro (mechanical win 1)

Zero macro imports exist today; the ban makes the "never mix macro and explicit-id Trans"
convention (which cost real translations on 2026-07-26) a compile-time gate. Repo-wide via
the BASE rules block — packages/i18n deliberately contains no macro either.

**Files:**
- Modify: `biome.json` (base `noRestrictedImports` options block, ~line 54)

**Interfaces:** none.

- [ ] **Step 1: Add the two banned paths**

In the BASE `noRestrictedImports.options.paths` object (the one currently holding only the
two `zod/v4*` entries at ~lines 54-57 — NOT the app override blocks), add:

```json
"@lingui/macro": "Explicit-id <Trans id=…> only — the macro pipeline is blocked on the swc plugin (packages/i18n/CLAUDE.md, THE CONVENTION). Mixing macro and explicit ids corrupted translations once (2026-07-26).",
"@lingui/react/macro": "Explicit-id <Trans id=…> only — the macro pipeline is blocked on the swc plugin (packages/i18n/CLAUDE.md, THE CONVENTION). Mixing macro and explicit ids corrupted translations once (2026-07-26)."
```

- [ ] **Step 2: Probe — inject the violation, expect the gate to fire**

Create `apps/web/features/design-reference/macro-probe.tsx` containing:

```tsx
import { Trans } from '@lingui/macro';
export const Probe = () => <Trans>probe</Trans>;
```

Run: `pnpm exec biome check apps/web/features/design-reference/macro-probe.tsx`
Expected: FAIL with the noRestrictedImports message above. (A lint rule is only real once
you have injected the violation it names — repo lore, `.dependency-cruiser.cjs`.)

- [ ] **Step 3: Delete the probe file, run the full gate**

Delete `apps/web/features/design-reference/macro-probe.tsx`.
Run: `pnpm lint`
Expected: PASS (all six gates green).

- [ ] **Step 4: Commit**

`git commit -m "feat(lint): ban @lingui/macro imports — explicit-id Trans is the only pipeline"`

### Task 5: ui-api gets its own turbo boundary tag (mechanical win 2)

ui-api is tagged `contracts`, so every tag allowing `contracts` (including `data`) may
import it tag-clean — but ADR-0023 says data may never import ui-api. Give it its own tag;
allow it only where legal (ui, app).

**Files:**
- Modify: `turbo.json` (root — `boundaries.tags`: add `ui-api` tag definition; extend `ui`
  and `app` allow lists)
- Modify: `packages/ui-api/turbo.json` (tags: `["contracts"]` → `["ui-api"]`)

**Interfaces:** tag name `ui-api` — Phase 1's spine registry cites it.

- [ ] **Step 1: Root turbo.json — add the tag definition**

In `boundaries.tags`, alongside the existing entries, add:

```json
"ui-api": {
  "dependencies": {
    "allow": ["contracts", "config"]
  }
}
```

(ui-api's real deps: `@heliogrid/contracts` import-type-only + `@heliogrid/config` dev.)

- [ ] **Step 2: Extend the `ui` allow list**

Change `"allow": ["ui", "contracts", "domain", "tokens", "config"]` to
`"allow": ["ui", "ui-api", "contracts", "domain", "tokens", "config"]`.

- [ ] **Step 3: Extend the `app` allow list**

In the `app` tag's allow array, add `"ui-api"` after `"ui"` (apps/mobile imports ui-api
directly in `api-parity.ts`).

- [ ] **Step 4: Retag the package**

`packages/ui-api/turbo.json`: change `"tags": ["contracts"]` to `"tags": ["ui-api"]`.

- [ ] **Step 5: Verify — boundaries green, then probe the fixed hole**

Run: `pnpm boundaries`
Expected: PASS (374 files, 16 packages — counts may drift; green is the assertion).

Probe: add `import type { ButtonProps } from '@heliogrid/ui-api';` plus
`export type _Probe = ButtonProps;` to `packages/data/src/index.ts` (if `ButtonProps` is
not among ui-api's exports, use any type its `src/index.ts` does export), run
`pnpm boundaries`.
Expected: FAIL (data's tag allows contracts but not ui-api — this exact import passed
before this task). Remove both probe lines; re-run; expected PASS.

- [ ] **Step 6: Commit**

`git commit -m "feat(boundaries): ui-api gets its own turbo tag — data can no longer import it tag-clean"`

### Task 6: Delete dead dep-cruiser exemptions (mechanical win 3)

`no-raw-http-clients` exempts four files deleted by ADR-0023/0024 and its comment cites
them as "the four real files" plus a Better-Auth rationale that ADR-0024 voided.

**Files:**
- Modify: `.dependency-cruiser.cjs` (the `no-raw-http-clients` rule, ~lines 236-265)

**Interfaces:** none.

- [ ] **Step 1: Rewrite the rule**

Replace the rule's `comment` and `from` (keep `to` exactly as-is):

```js
    {
      name: 'no-raw-http-clients',
      severity: 'error',
      comment:
        'apps/web and apps/mobile reach the API through @heliogrid/data ONLY — the sole ' +
        'initClient call is packages/data/src/client/client.ts (ADR-0023). A third-party ' +
        'HTTP client bypasses the contract, so contract drift stops being a compile error ' +
        'and becomes a runtime surprise. Complements — does NOT replace — the prose rule ' +
        'in apps/web/CLAUDE.md: that landmine was a native fetch() via an untyped api<T>(), ' +
        'which has no import for a bundler graph to catch. No exemptions: the four app-local ' +
        'client files this rule once anchored were deleted by ADR-0023/0024 (better-auth is ' +
        'banned outright by apps-never-touch-the-wire, not exempt). BOTH forms matched for ' +
        'the same reason as apps-never-touch-the-wire: none of these clients is installed, ' +
        'so an import stays a bare specifier the node_modules half never sees.',
      from: {
        path: '^apps/(web|mobile)/',
      },
```

and extend its `to` — keep `dependencyTypes` as-is, replace the `path` value with the
two-form match (the config's own documented pattern):

```js
        path:
          '(^|/)node_modules/(axios|node-fetch|undici|superagent|got|ky)/' +
          '|^(axios|node-fetch|undici|superagent|got|ky)($|/)',
```

- [ ] **Step 2: Verify — gate fires on an injected violation**

Create `apps/web/features/design-reference/http-probe.ts`:

```ts
import axios from 'axios';
export const probe = () => axios;
```

Run: `pnpm turbo build && pnpm exec depcruise --config .dependency-cruiser.cjs apps/web`
Expected: FAIL on `no-raw-http-clients` (axios is uninstalled, so the import is a bare
specifier — caught by the new second form; before this task's edit, that import was
invisible to the rule). Delete the probe file.

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 3: Commit**

`git commit -m "fix(boundaries): no-raw-http-clients — drop exemptions for four deleted files"`

### Task 7: tenant_id-never-in-request-body invariant (mechanical win 4)

The rule is stated in two files and checked by nothing. tests/invariants already imports
contract schemas (enum-parity.ts), so the plumbing exists. This invariant is static — no
database — so it runs BEFORE run.ts's DATABASE_URL early-return, meaning it always
executes, even locally without a db.

**Files:**
- Create: `tests/invariants/src/tenant-id-in-body.ts`
- Modify: `tests/invariants/src/run.ts` (import + call before the url check)

**Interfaces:**
- Produces: `runTenantIdInBody(): void` (throws on violation) and pure
  `findTenantIdKeys(router: unknown): string[]` (returns violation descriptions; exported
  for probing).

- [ ] **Step 1: Write the invariant**

Create `tests/invariants/src/tenant-id-in-body.ts`:

```ts
import { apiContract } from '@heliogrid/contracts';

/**
 * tenant_id never travels in a request body or query — it derives from the session
 * context server-side (.claude/rules/contracts.md; docs/08). A contract schema carrying
 * it invites the client to assert its own tenant, the exact spoof RLS exists to stop.
 *
 * Static: walks the ts-rest router tree, unwraps common Zod wrappers, and asserts no
 * object schema under `body` or `query` declares a tenant_id / tenantId key. Runs even
 * without DATABASE_URL — nothing here needs a database.
 */
const BANNED_KEYS = ['tenant_id', 'tenantId'];

type ZodLike = { _def?: { typeName?: string; schema?: ZodLike; innerType?: ZodLike } } & {
  shape?: Record<string, unknown>;
};

function unwrap(schema: ZodLike | undefined): ZodLike | undefined {
  let current = schema;
  for (let i = 0; i < 10 && current?._def; i += 1) {
    const inner = current._def.schema ?? current._def.innerType;
    if (!inner) return current;
    current = inner;
  }
  return current;
}

function isRoute(node: Record<string, unknown>): boolean {
  return typeof node.method === 'string' && typeof node.path === 'string';
}

/** Pure walker, exported so the gate can be probed against a fabricated router. */
export function findTenantIdKeys(router: unknown, prefix = 'apiContract'): string[] {
  const problems: string[] = [];
  if (router === null || typeof router !== 'object') return problems;
  const node = router as Record<string, unknown>;
  if (isRoute(node)) {
    for (const part of ['body', 'query'] as const) {
      const shape = unwrap(node[part] as ZodLike | undefined)?.shape;
      if (!shape) continue;
      for (const key of Object.keys(shape)) {
        if (BANNED_KEYS.includes(key)) {
          problems.push(`${prefix}.${part} declares "${key}" (${String(node.method)} ${String(node.path)})`);
        }
      }
    }
    return problems;
  }
  for (const [key, child] of Object.entries(node)) {
    problems.push(...findTenantIdKeys(child, `${prefix}.${key}`));
  }
  return problems;
}

export function runTenantIdInBody(): void {
  const problems = findTenantIdKeys(apiContract);
  if (problems.length > 0) {
    throw new Error(
      `tenant-id-in-body: tenant identity must come from session context, never the wire:\n  ${problems.join('\n  ')}`,
    );
  }
  console.log('tenant-id-in-body: no contract body/query declares tenant identity');
}
```

- [ ] **Step 2: Wire into run.ts, before the url check**

Add the import alongside the others:

```ts
import { runTenantIdInBody } from './tenant-id-in-body';
```

and as the FIRST line of `main()` (before `const env = loadInvariantsEnv();`):

```ts
  runTenantIdInBody(); // static — needs no database, must never be skipped
```

- [ ] **Step 3: Probe the walker with a fabricated violation**

Run:

```bash
pnpm --filter @heliogrid/invariants exec tsx -e "const { findTenantIdKeys } = await import('./src/tenant-id-in-body.ts');
const bad = { leads: { create: { method: 'POST', path: '/leads', body: { _def: { typeName: 'ZodObject' }, shape: { tenant_id: 1, name: 1 } } } } };
const found = findTenantIdKeys(bad);
if (found.length !== 1) throw new Error('probe expected 1 violation, got ' + JSON.stringify(found));
console.log('probe OK:', found[0]);"
```

(If the workspace filter name differs, check `tests/invariants/package.json` `name` and use
it verbatim.) Expected: `probe OK: apiContract.leads.create.body declares "tenant_id" …`

- [ ] **Step 4: Run the real invariant suite**

Run: `pnpm turbo test`
Expected: PASS with the new `tenant-id-in-body: no contract body/query declares tenant
identity` line printed BEFORE any db-skip warning.

- [ ] **Step 5: Commit**

`git commit -m "feat(invariants): tenant_id never in request body/query — static contract walk"`

### Task 8: Reorder pnpm verify — build first (mechanical win 5)

CI builds before linting because dep-cruiser resolves workspace edges through `dist/`;
local `verify` lints first, so its dep-cruiser pass is partially vacuous on clean checkouts.

**Files:**
- Modify: `package.json` (root, the `verify` script)

**Interfaces:** none. (CLAUDE.md §6's description was already updated in Task 3.)

- [ ] **Step 1: Reorder**

Replace:

```json
"verify": "pnpm lint && pnpm boundaries && pnpm turbo typecheck && pnpm turbo test && pnpm turbo build",
```

with:

```json
"verify": "pnpm turbo build && pnpm lint && pnpm boundaries && pnpm turbo typecheck && pnpm turbo test",
```

(The trailing build is dropped — build already ran first; turbo caches make a second run a
no-op.)

- [ ] **Step 2: Verify**

Run: `pnpm verify`
Expected: PASS, with the build stage output appearing before the lint stage.

- [ ] **Step 3: Commit**

`git commit -m "fix(gates): pnpm verify builds before linting — dep-cruiser needs dist/ to see workspace edges"`

### Task 9: Phase 0 close-out — full gates, sweep, PR

**Files:** none new.

- [ ] **Step 1: Full verification**

Run: `pnpm verify`
Expected: PASS end-to-end.

- [ ] **Step 2: Stale-reference sweep over everything Phase 0 touched**

Run:

```bash
grep -rn "PreToolUse\|blocked by a hook\|27 rules\|docs/17 Law 2\|/doc-sync" \
  CLAUDE.md .claude/rules .claude/skills docs/17-engineering-governance.md .github/workflows/ci.yml
```

Expected: zero matches, except the docs/17 §3 line that *names* the /doc-sync deletion
historically and the reference-integrity row's "unowned since the 2026-07-31 skill
deletion" cell (those describe the deletion; they do not claim the skill exists).

- [ ] **Step 3: Propose push + PR to the owner (G-1 gate)**

Present: branch `governance/phase-0`, the commit list, and a PR body containing: summary of
the nine fixes, the probe evidence from Tasks 4-7 (gate fired on injected violation), and
`pnpm verify` green. **Wait for an explicit yes, then** push and open the PR against main.

---

# PHASE 1 — The spine (branch `governance/phase-1` off main after PR 1 merges)

### Task 10: Author docs/architecture.md — skeleton, §1 map, §3 platform rules, §4 placement

The spine holds POLICY (who may depend on what), never SNAPSHOTS (who depends on what
today). No counts, no consumer lists, no version numbers — those live in package.json,
turbo.json, dep-cruiser, docs/03. Where a section describes something unbuilt, it carries a
status banner (spec §3 anti-rot rules).

**Files:**
- Create: `docs/architecture.md`

**Interfaces:**
- Produces: section anchors `§1 Module map`, `§2 Package registry`, `§3 Platform rules`,
  `§4 Placement procedure` — Tasks 11-16 and every later phase cite them as
  `docs/architecture.md §N`.

- [ ] **Step 1: Create the file with §1, §3, §4 (Task 11/12 fill §2)**

```markdown
# HelioGrid architecture — the spine

The single canonical home for inter-package facts: what each package owns, what it may
depend on, its platform scope, and where new code goes. Other documents POINT here; none
restates it (spec: docs/superpowers/specs/2026-08-02-governance-rebuild-design.md §3).
This file states POLICY. The current dependency graph lives in package.json files;
enforcement lives in .dependency-cruiser.cjs (authoritative) and turbo boundaries tags
(coarse cover). Anything describing unbuilt design carries a STATUS banner.

## §1 Module map & dependency direction

Layers, top to bottom — imports point strictly downward:

    apps (web · mobile · api · worker)  +  tests/invariants
      ↓
    feature-facing packages: data · forms · i18n · ui · ui-api
      ↓
    foundation packages: contracts · domain · tokens · db · env
      ↓
    config

- Packages NEVER import apps. Lower layers never import higher ones.
- The only wire path for frontend apps is @heliogrid/data (ADR-0023) — the sole
  initClient call in the repo lives there.
- db is backend-only, except the @heliogrid/db/uuid subpath (app-side id generation).
- dependency-cruiser is the authoritative boundary enforcer; turbo tags are redundant
  coarse cover (they cannot express data↛ui-api or web↛db — dep-cruiser holds those).

## §2 Package registry

<!-- One block per package/app — Tasks 11 and 12. Block shape:
     purpose · owns · allowed deps (policy) · forbidden (the notable ones) ·
     platform scope · belongs here / never here · extension points -->

## §3 Platform rules — React Native · Next.js · shared

### React Native (apps/mobile)
- UI composes from apps/mobile/src/ui ONLY — the RN half of the design system,
  parity-locked to @heliogrid/ui-api. Interactive RN primitives (Text, Pressable,
  TextInput…) are lint-banned in screens; layout primitives (View, ScrollView) allowed.
- No web-only dependencies, no DOM APIs. No expo, no EAS, no AsyncStorage (owner rulings;
  see apps/mobile/CLAUDE.md landmines for the dated reasons).
- Platform APIs (camera, storage, notifications, keychain) stay isolated in dedicated
  modules under apps/mobile/src/ (today: push/; adapter packages land with their modules).
- Navigation is React Navigation static config; navigation state derives from shared
  session/domain state, never duplicated into screens.
- Metro is the bundler: RN debug builds serve JS lazily — a screen "running" on a
  loading view proves nothing (QA lore, measured property of Metro).

### Next.js (apps/web)
- UI composes from @heliogrid/ui ONLY (raw elements lint-banned across app/ and
  features/). app/ routes; features/ own capability; page.tsx never holds logic.
- Server/Client boundary: product screens are client components ("use client" at the
  screen/feature level, not sprinkled per-widget); server components are the default only
  for pure-render routes (today: /design). DOM-only APIs (window, navigator) live in
  hooks under features/*/shared/, never in shared packages, never at module top level
  (SSR executes it).
- No React Native imports of any kind. Web-specific optimization (SSR/RSC/caching)
  never leaks into shared packages.

### Shared (packages/*)
- Platform-agnostic by law (Law 10): no DOM, no react-native, no Node-only APIs outside
  declared server entries (env/server, db, data's client is isomorphic-fetch).
- Business logic, policy numbers, protocol constants → domain. Flow view-models shared by
  both platforms → authored once in domain/data BEFORE either screen consumes them
  (Law 11). Copy both platforms need → packages/i18n/src/copy. Visual values → tokens.
  Wire shapes → contracts. Form state → forms.
- Platform-specific implementations are injected via app-side modules (adapter packages
  land per-module; the fences for them already exist in dep-cruiser and turbo tags —
  deliberate pre-landing, per admin-pool-fenced's pattern).

## §4 Placement procedure — run BEFORE writing any new file

Walk top-down; first match wins. Every implementation plan's "Architecture Placement"
section records the answer per new file.

1. Is it a wire shape (request/response/enum crossing HTTP)? → packages/contracts
   (+ /contract-change).
2. Is it stored schema? → packages/db via /migration, in the owning module's slice (Law 9).
3. Is it business logic, a policy number, a protocol constant, or a flow view-model both
   platforms read? → packages/domain (pure TS only).
4. Is it data access (fetch, cache, session store)? → packages/data (react only under
   src/react/).
5. Is it form state/validation wiring? → packages/forms.
6. Is it user-visible copy needed by both platforms? → packages/i18n/src/copy.
7. Is it a visual value (color, spacing, type scale)? → design/ds-source via
   packages/tokens — never a literal in a screen.
8. Is it a reusable visual component? → the design system pair: packages/ui (web) +
   apps/mobile/src/ui (RN) + its @heliogrid/ui-api contract entry, all in one change
   (Law 7).
9. Is it screen composition/rendering for one platform? → that app's screens/features
   tree, composing the layers above. Screens hold rendering, not policy.
10. Is it environment/config? → a schema in packages/env + .env.example (never a raw
    process.env read elsewhere).
11. None of the above fits → STOP. Name the mismatch to the owner before creating a new
    package or directory (00-laws.md stop-and-ask).
```

- [ ] **Step 2: Verify structure**

Run: `grep -n "^## §" docs/architecture.md`
Expected: exactly four section headers, §1-§4.

- [ ] **Step 3: Commit**

`git commit -m "feat(architecture): the spine — module map, platform rules, placement procedure"`

### Task 11: Spine §2 registry — the eleven packages

**Files:**
- Modify: `docs/architecture.md` (§2, replacing the placeholder comment)

**Interfaces:**
- Produces: anchors `§2 config` … `§2 ui-api` (one `###` block per package) cited by the
  slimmed package CLAUDE.mds in Tasks 13-15.

- [ ] **Step 1: Write the eleven blocks**

Replace §2's `<!-- … -->` comment with the following (verified against package.json files
and dep-cruiser on 2026-08-03; the "allowed deps" lines are POLICY — the workspace
packages a block may import — not snapshots; third-party deps stay in package.json/docs/03):

```markdown
### config — shared tsconfig presets
Owns: tsconfig presets (node-package, nest-app) and nothing else. Allowed deps: none.
Platform scope: all. Belongs: a new compiler preset. Never: runtime code, lint config
(biome.json is root-owned). Extension point: a new preset per new runtime class — note
that apps/web, packages/ui and packages/tokens extend tsconfig.base.json directly (no
browser preset exists yet), and apps/mobile deliberately skips config to extend
@react-native/typescript-config, hand-mirroring base strictness flags.

### env — the only raw environment reader
Owns: env schemas + loaders (server/web/native); the .env.example contract. Allowed deps:
config. Platform scope: shared (per-runtime entry points). Belongs: every new variable, as
a schema edit + .env.example line. Never: business logic; a process.env read anywhere else
(scripts/check-env-access.mjs allowlist is the authority). Extension point: a new loader
per new runtime.

### contracts — the wire truth
Owns: ts-rest routers, request/response Zod schemas, wire enums, error envelope. Allowed
deps: domain (for z.enum over domain constants — returns with the auth rebuild), config.
Platform scope: shared. Belongs: anything crossing HTTP. Never: tenant_id in a body/query
schema (invariant-enforced); implementation; storage shapes. Extension points: a feature
module mounts its router into apiContract (Law 3: contract before implementation);
ports/<capability>.ts re-lands with its consumer.

### domain — pure business truth
Owns: business logic, policy numbers, protocol constants, formatters, flow view-model
types shared by platforms (Law 11). Allowed deps: config. Platform scope: shared, pure TS
— no react, no node builtins, no clock/randomness/I-O (domain-purity gates). Belongs: a
constant two screens read; a flow state machine. Never: fetch, storage, rendering.
Extension point: one folder per module slice (auth/, tenancy/, format/ today).

### db — schema mirror, migrations, backend client
Owns: append-only migrations, Drizzle schema mirror, migrate runner (sha256-locked,
advisory-locked), admin pool, uuid subpath. Allowed deps: config. Platform scope: backend
only — EXCEPT @heliogrid/db/uuid, importable by frontend for app-side id generation
(web-no-db/mobile-no-db exempt it). Belongs: DDL for the current module's slice (Law 9).
Never: contracts imports (db-no-upward — the enum-parity invariant is the seam that keeps
pgEnum ↔ z.enum honest); business logic. Extension point: /migration authors the next
numbered file.

### data — the ONLY frontend wire path (ADR-0023)
Owns: the typed client (sole initClient), repositories, session store, react-query
adapters under src/react/ only. Allowed deps: contracts, domain, config. Platform scope:
shared frontend (core framework-free; react confined to src/react/). Belongs: every new
endpoint's repository + hook. Never: ui/ui-api/tokens/i18n imports (data-lean); a second
client; platform APIs. Extension point: one repository per contract router.

### forms — the fenced form layer
Owns: useZodForm, the translated zod error map (installFormsErrorMap), the z re-export
apps must use. Allowed deps: config (react-hook-form/zod are its third-party internals).
Platform scope: shared frontend. Belongs: form-state wiring. Never: schemas themselves
(contracts) or copy (i18n). Extension point: new form primitives, exported through the
index only.

### i18n — catalogs and shared copy
Owns: Lingui catalogs (compiled messages committed), LOCALES derived from contracts'
uiLanguageSchema (never restated), src/copy/ shared-copy modules (React-free /*i18n*/
descriptors — JSX is banned there for the dual-instance ESM/CJS hazard). Allowed deps:
contracts, config. Platform scope: shared frontend. Belongs: copy both platforms render
(Law 11). Never: macro imports (lint-banned); locale-default number formats for money
(CLAUDE.md §7: tenant-currency grouping). Extension point: new copy modules keyed by
contract enums where applicable.

### tokens — the design-token emitter
Owns: parsing design/ds-source into tokens.css (web) + theme.ts (RN) + the committed
native splash canvas; the WCAG DECLARED_PAIRS gate. Allowed deps: none at runtime (config
dev-only). Platform scope: shared. Belongs: every visual value. Never: hand-edited
outputs (CI freshness-guards them); workspace imports. Extension point: ds-source is the
input; emit targets grow here.

### ui — the web half of the design system
Owns: web components (React DOM), their css, the web api-parity.ts assertion. Allowed
deps: ui-api, contracts, domain, tokens, config. Platform scope: web only. Belongs: a new
shared visual component (with its RN twin + ui-api entry, same change — Law 7). Never:
screens/routes; data access; RN imports; raw colour (adherence gate). Extension point:
component families under src/<family>/.

### ui-api — the types-only parity contract
Owns: component API types both platforms satisfy (import type react/contracts only — no
runtime emit). Allowed deps: contracts, config (type-only). Platform scope: shared
frontend types. Turbo tag: ui-api (own tag; importable by ui and apps only — data may
not). Belongs: the prop contract for every shared component. Never: runtime code, styles,
defaults. Extension point: scope header records the component census (the single count
source).
```

- [ ] **Step 2: Verify**

Run: `grep -c "^### " docs/architecture.md`
Expected: 11 (blocks in §2 only, so far).

- [ ] **Step 3: Commit**

`git commit -m "feat(architecture): spine §2 — package registry, eleven packages"`

### Task 12: Spine §2 registry — the four apps + tests/invariants

**Files:**
- Modify: `docs/architecture.md` (§2, appended after ui-api)

**Interfaces:**
- Produces: anchors `§2 apps/web` … `§2 tests/invariants` for Tasks 15-16.

- [ ] **Step 1: Append the five blocks**

```markdown
### apps/web — Next.js
Owns: routes (app/ — routing only), features/ (capability owners), web screens. Allowed
deps: contracts, data, domain, env, forms, i18n, tokens, ui, config. Platform scope: web.
Belongs: screen composition, web-only hooks (DOM APIs) under features/*/shared/. Never:
db (web-no-db; uuid subpath exempt), @ts-rest/* or any HTTP client
(apps-never-touch-the-wire, no-raw-http-clients), react-hook-form/zod directly (forms is
the fence), RN imports. Platform rules: §3.

### apps/mobile — React Native
Owns: src/screens, src/ui (the RN design-system half, parity-locked to ui-api), src/
navigation, src/push, src/lib. Allowed deps: contracts, data, domain, env, forms, i18n,
tokens, ui-api. Deliberately NOT config (extends @react-native/typescript-config;
hand-mirrors base strictness flags — a new base flag must be copied here). Never:
@heliogrid/ui (web half), db (uuid exempt), wire/form internals (same fences as web),
expo/EAS/AsyncStorage (owner rulings). Platform rules: §3.

### apps/api — NestJS BFF
Owns: API modules (health today; feature modules land per slice), ContractException
error envelope, tenancy runtime precondition. Allowed deps: contracts, db, env, config
(+ domain when the rebuild re-adds its consumer). Never: ui/tokens/i18n/data (frontend
layers); raw process.env (env owns it). Extension point: one Nest module per contract
router, repositories fenced by db-access-in-repositories-only.

### apps/worker — queue processors
Owns: BullMQ processors and their binding config (queues land with their owning modules).
Allowed deps: contracts, db, env, config. Never: HTTP handlers (api owns the edge);
frontend layers. Extension point: one processor per queue, registered in worker.module.

### tests/invariants — the proof layer
Owns: executable invariants (tenancy/RLS, table scoping, enum parity, schema parity,
tenant-id-in-body) run by pnpm turbo test; fail-closed under CI, loud-skip locally
without DATABASE_URL. Turbo tag: app (may import contracts/domain — that seam is the
point). Belongs: a new invariant when a rule can be proven mechanically against the live
schema or contracts. Never: unit tests (owner directive 2026-07-29); anything needing a
mock. Extension point: one file per invariant + a run.ts call.
```

- [ ] **Step 2: Verify**

Run: `grep -c "^### " docs/architecture.md`
Expected: 16.

- [ ] **Step 3: Commit**

`git commit -m "feat(architecture): spine §2 — apps and the proof layer"`

### Task 13: Slim the core package CLAUDE.mds (contracts, data, domain, db, env)

For every file in Tasks 13-15: (a) replace the `## Depends on / depended on by` section
(heading and body) with:

```markdown
## Dependency policy
docs/architecture.md §2 <block-name>.
```

(matching the Appendix A template as amended in Task 16) — (b) apply that file's listed
defect fixes — (c) keep Commands, Local conventions, Landmines, Definition of done
untouched except where a fix names them. Landmines are never deleted.

**Files:**
- Modify: `packages/contracts/CLAUDE.md`, `packages/data/CLAUDE.md`,
  `packages/domain/CLAUDE.md`, `packages/db/CLAUDE.md`, `packages/env/CLAUDE.md`

**Interfaces:**
- Consumes: Task 11's §2 anchors.

- [ ] **Step 1: contracts** — deps section → pointer line. Fixes: remove "tenancy claim"
from What-lives-here (deleted with ADR-0024; common.ts:102 records it); change the
present-tense `uses: @heliogrid/domain` claim to "domain edge returns with the auth
rebuild (segment.ts documents it as future)"; mark `ports/<capability>.ts` as
"re-authored by the rebuild", not current.

- [ ] **Step 2: data** — deps section → pointer line. Fix: align the deliberately-not-
exported list's fourth item with src/index.ts's doc comment (read the file; index.ts is
canonical — one authoring, the CLAUDE.md defers to it with a pointer instead of a list).

- [ ] **Step 3: domain** — deps section → pointer line. Fixes: rewrite the "contracts and
apps/api consume it — do not read this edge as inert" paragraph to: "the contracts/api
edges were removed by the same-day ADR-0024 teardown and return with the rebuild"; add
auth/otp.ts and tenancy/segment.ts to the Landed-so-far inventory.

- [ ] **Step 4: db** — deps section → pointer line. Fixes: add two lines under What lives
here: "./uuid subpath export exists for frontend id generation" and "web/mobile may import
NOTHING else here (web-no-db / mobile-no-db)". Keep the greenfield banner verbatim — it is
the pattern the spec §3 canonizes.

- [ ] **Step 5: env** — deps section → pointer line. No other fixes (audit: fully
accurate).

- [ ] **Step 6: Verify**

Run: `grep -rn "Depends on / depended on by" packages/contracts packages/data packages/domain packages/db packages/env`
Expected: zero matches. Then `grep -rln "docs/architecture.md §2" packages/*/CLAUDE.md`
lists these five files.

- [ ] **Step 7: Commit**

`git commit -m "docs(packages): core CLAUDE.mds — dep facts move to the spine; ADR-0024 rot fixed"`

### Task 14: Slim the platform package CLAUDE.mds (ui, ui-api, tokens, i18n, forms, config)

Same three-part treatment as Task 13.

**Files:**
- Modify: `packages/ui/CLAUDE.md`, `packages/ui-api/CLAUDE.md`, `packages/tokens/CLAUDE.md`,
  `packages/i18n/CLAUDE.md`, `packages/forms/CLAUDE.md`, `packages/config/CLAUDE.md`
- Modify: `packages/ui/package.json` (description), `packages/ui/src/index.ts` (header)

**Interfaces:** consumes Task 11's §2 anchors.

- [ ] **Step 1: ui** — deps → pointer. Fixes: delete the "21-component" numeral from
package.json's description AND src/index.ts's header comment (point both at "the ui-api
scope header records the census"); soften "One file pair per component" to "One file pair
per component family — co-located pairs (Badge in Chip.tsx, AvatarGroup in Avatar.tsx,
IconCircle in Card.tsx) are deliberate"; annotate the `_adherence.oxlintrc.json` reference:
"a data file consumed by hand into TS types — oxlint itself was removed 2026-07-30".

- [ ] **Step 2: ui-api** — deps → pointer. Fixes: reword the NEVER line to "no RUNTIME
import — react and contracts are `import type` only (type-only imports erase at emit)";
add one line: "Turbo tag: `ui-api` (own tag since Phase 0) — importable by ui and apps
only; data may not."

- [ ] **Step 3: tokens** — deps → pointer. Fix: change "uses: nothing in the workspace" to
"zero workspace imports at runtime (config is dev-only)" and align the turbo-inputs
landmine's quotation of it.

- [ ] **Step 4: i18n** — deps → pointer. Fixes: rewrite the src/copy description to match
the React-free /*i18n*/ descriptor reality (api-error.ts's own header is canonical —
defer to it); change "(formatMoney when domain lands)" to "(formatMoney when domain's
money slice lands)".

- [ ] **Step 5: forms** — deps → pointer. Fix: add installFormsErrorMap/error-map.ts (the
package's most incident-prone surface) and the z re-export to What-lives-here.

- [ ] **Step 6: config** — deps → pointer. Fix: replace the "used by every package and app
except apps/mobile" claim with the truthful split now recorded in spine §2 config
(three consumers extend tsconfig.base.json directly; mobile skips deliberately).

- [ ] **Step 7: Verify**

Run: `grep -rn "21-component" packages/ && grep -rn "Depends on / depended on by" packages/`
Expected: zero matches for both.

- [ ] **Step 8: Commit**

`git commit -m "docs(packages): platform CLAUDE.mds slimmed; counts and stale claims fixed"`

### Task 15: Slim the app CLAUDE.mds (web, mobile, api, worker)

Same treatment. The five near-verbatim duplicated blocks across web/mobile (data path,
domain-import, forms/useZodForm, ApiErrorText, shared-copy) SHRINK to one-line pointers at
spine §3-§4 — their canonical text now lives in the spine; Phase 2's cross-platform.md
rule will carry the edit-time delivery.

**Files:**
- Modify: `apps/web/CLAUDE.md`, `apps/mobile/CLAUDE.md`, `apps/api/CLAUDE.md`,
  `apps/worker/CLAUDE.md`

**Interfaces:** consumes Task 12's §2 anchors.

- [ ] **Step 1: web** — deps → pointer (spine §2 apps/web). Fixes: rewrite §Local
conventions' lib/ description to reality (lib/ holds ApiErrorText.tsx + api-error-text.css
+ env.ts; NO *-client.ts — they were the ADR-0023 deletion its own landmine records);
reconcile the page.tsx line to ui-adherence's version ("page.tsx routes only — screens own
the controller hook"); shrink the five duplicated blocks to pointers.

- [ ] **Step 2: mobile** — deps → pointer (spine §2 apps/mobile). Fixes: rewrite the metro
landmine to what metro.config.js holds (monorepo watchFolders/nodeModulesPaths + the
PowerSync will-add-a-blockList note — no Lingui transformer exists); add
@react-navigation/bottom-tabs + elements to the nav line; shrink the duplicated blocks to
pointers.

- [ ] **Step 3: api** — deps → pointer (spine §2 apps/api). Fixes: remove @heliogrid/
domain from the dep claims (no consumer since ADR-0024) and re-phrase the protocol-
constants landmine to future tense ("re-imported when the rebuild lands its consumer").

- [ ] **Step 4: worker** — deps → pointer (spine §2 apps/worker). No other fixes (audit:
accurate).

- [ ] **Step 5: Verify**

Run: `pnpm lint` (proves nothing else broke) and
`grep -rn "api-client\|auth-client" apps/web/CLAUDE.md apps/mobile/CLAUDE.md`
Expected: matches only inside landmine text describing the DELETED files historically.

- [ ] **Step 6: Commit**

`git commit -m "docs(apps): CLAUDE.mds slimmed to spine pointers; ADR-0023/24 rot fixed"`

### Task 16: Docs banners + template alignment

**Files:**
- Modify: `docs/02-system-architecture.md` (header banner)
- Modify: `docs/04-data-model.md` (header banner)
- Modify: `docs/03-tech-stack.md` (§4 client-binding row; §3 cruiser filename)
- Modify: `docs/17-engineering-governance.md` (Appendix A template only)

**Interfaces:** consumes Task 10's file existence.

- [ ] **Step 1: Banner docs/02** — insert directly under the H1:

```markdown
> **STATUS (2026-08-03): design record, not repo state.** Sections describe the TARGET
> system in present tense; large parts (voice, PowerSync, the module/queue tables, the
> auth request path) are unbuilt, and §2's package layout predates env/forms/ui-api.
> Current architectural truth — package registry, platform rules, placement — lives in
> `docs/architecture.md` (the spine). Where the two disagree, the spine wins.
```

- [ ] **Step 2: Banner docs/04** — insert directly under the H1:

```markdown
> **STATUS (2026-08-03): frozen DESIGN (Law 9), not repo state.** The database is
> greenfield since ADR-0024 (migrations/ is empty); auth-era references (Better Auth)
> describe a design superseded by the pending auth rebuild. Tables land only with their
> owning module's slice.
```

- [ ] **Step 3: Fix docs/03** — §4's client-binding row: replace the
`@ts-rest/react-query 3.52.1 (+ TanStack Query 5.x) on web and RN` cell with
`@heliogrid/data wrapping @ts-rest/core + TanStack Query (ADR-0023) — @ts-rest/react-query
is not installed`; §3: `.dependency-cruiser.js` → `.dependency-cruiser.cjs`.

- [ ] **Step 4: Align docs/17 Appendix A's template** — in the template code block, replace
the section:

```markdown
## Depends on / depended on by
uses: <packages>        used by: <apps/packages>
```

with:

```markdown
## Dependency policy
Dependency policy: docs/architecture.md §2 <name>. (Never a hand-maintained consumer
list — two rotted within 48 hours of ADR-0024.)
```

- [ ] **Step 5: Verify**

Run: `grep -n "STATUS (2026-08-03)" docs/02-system-architecture.md docs/04-data-model.md && grep -n "dependency-cruiser.js\b" docs/03-tech-stack.md`
Expected: one banner hit per doc; zero hits for the stale filename.

- [ ] **Step 6: Commit**

`git commit -m "docs: status banners on 02/04, docs/03 stale rows fixed, Appendix A template aligned with the spine"`

### Task 17: contract-change skill truth fixes

The skill is the last remaining copy of the falsified "nothing checks enum parity" claim
(corrected in db-schema.md, packages/db/CLAUDE.md and docs/17, never here), and its §4
points at two client files ADR-0023 deleted. It loads exactly when someone runs the
procedure, so it must not lie.

**Files:**
- Modify: `.claude/skills/contract-change/SKILL.md`

**Interfaces:** none (prose).

- [ ] **Step 1: Fix §3's enum-parity claim**

Locate the §3 sentence claiming enum parity is unchecked ("nothing checks this for you" or
equivalent — read the section). Replace the claim with:

```markdown
`tests/invariants/src/enum-parity.ts` PROVES pgEnum ↔ z.enum parity (live pg_enum against
the contract schemas, both directions) via `pnpm turbo test` — needs `DATABASE_URL`
locally; CI fails closed. Change both sides in the same slice via `/migration`.
`packages/db/src/schema/` returns with the first greenfield migration.
```

- [ ] **Step 2: Fix §4's dead client paths**

Replace the two deleted file references (`apps/web/lib/api-client.ts`,
`apps/mobile/src/data/api-client.ts`) with the real path:

```markdown
The sole typed client lives in `packages/data/src/client/client.ts` (ADR-0023 — the only
`initClient` call in the repo). A call site that did not break after a contract change is
hand-rolling HTTP: find it and route it through `@heliogrid/data`.
```

- [ ] **Step 3: Verify**

Run: `grep -n "api-client\|nothing checks" .claude/skills/contract-change/SKILL.md`
Expected: zero matches.

- [ ] **Step 4: Commit**

`git commit -m "fix(skills): contract-change — enum-parity invariant exists, client lives in @heliogrid/data"`

### Task 18: Phase 1 close-out — full gates, cross-file consistency sweep, PR

**Files:** none new.

- [ ] **Step 1: Full verification**

Run: `pnpm verify`
Expected: PASS.

- [ ] **Step 2: One-definition sweep**

Run:

```bash
grep -rn "used by\|21-component\|Depends on / depended on by" packages/*/CLAUDE.md apps/*/CLAUDE.md
grep -rn "packages/adapters" docs/architecture.md
```

Expected: zero matches for the first (pointer lines say "Dependency policy:"); zero for
the second except §3's explicit "adapter packages land per-module" forward note.

- [ ] **Step 3: Fresh-eyes read of the spine**

Read docs/architecture.md top to bottom once: every §2 block must have all seven fields
(purpose · owns · allowed deps · forbidden · scope · belongs/never · extension point), no
counts, no consumer lists, no version pins. Fix inline anything missing.

- [ ] **Step 4: Propose push + PR to the owner (G-1 gate)**

Present: branch `governance/phase-1`, commit list, PR body summarizing the spine +
15 slimmed files + banners, with `pnpm verify` green stated. **Wait for an explicit yes,
then** push and open the PR.
