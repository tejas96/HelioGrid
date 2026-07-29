# AI Engineering Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn HelioGrid's prose-enforced AI governance into a mechanically-enforced engineering system — real CI gates, an on-demand instruction architecture, and a repaired documentation authority chain — without rebuilding any working code.

**Architecture:** Every rule moves down an *enforcement ladder* (type system → lint/CI → harness hook → skill → path-scoped rule → CLAUDE.md → docs) so drift becomes a red build instead of a forgotten paragraph. The always-loaded instruction surface shrinks to ~1.3k tokens; procedures live in `.claude/skills/` and load on invocation; layer law lives in per-package `CLAUDE.md` files and path-scoped `.claude/rules/` and loads when matching files are touched.

**Tech Stack:** pnpm 10.34.5 workspaces · Turborepo 2.10.7 · TypeScript 5.8.3 · Biome 2.5.5 · dependency-cruiser 16.10.4 · sherif 1.13.0 · Drizzle + Postgres 16 · ts-rest + Zod 3.25.76 · NestJS · Next.js 15 · bare React Native 0.86 · Lingui v5 · GitHub Actions. New tools introduced: oxlint (token adherence + file-size cap), gitleaks (CI secret scan), knip + jscpd (local-only hygiene). **No test framework is introduced** — no unit tests, no `.test.*`/`.spec.*` files (owner directive).

**Source spec:** `docs/foundation-redesign.md` (§ references throughout point there).

## Owner decisions (resolved 2026-07-29 — binding for this plan)

1. **Studio census:** promote `docs/research/phases710.md` §2 → `docs/product/studio-census.md`. The POC `phase-10-prompts.md` gets a pointer banner; it is never vendored.
2. **Keep-and-improve confirmed:** no package or app is rebuilt. `contracts`, `db`, `ui`, `tokens`, `i18n`, `apps/api`, `apps/web`, `apps/mobile` all stay.
3. **`packages/domain` approved** with ADR-0021, seeded with the shared login state machine, ₹/phone formatters, and invite/role invariants.
4. **Scope:** the S5-derived `docs/03` §14 telephony correction lands in Phase 2. The plan covers Phases 0–4; Phase 5 shakedown (auth-tenancy task 3) resumes normal module work after this plan completes.

## Global Constraints

Every task's requirements implicitly include this section.

- **Node `>=22 <23`**, pnpm `10.34.5` (`packageManager` pin). `.npmrc` sets `save-prefix=` — **all new dependencies are added with exact versions, no `^` or `~`**.
- **Use Edit/Write tools for ALL file changes. Never `sed -i` / `perl -i` / `python … -i`** — in-place stream edits have corrupted files in the predecessor repo. (From Task 5 onward a hook blocks this at tool-call time.)
- **Never edit an applied migration** (`packages/db/migrations/*.sql`). The runner is sha256-locked; add a new file instead.
- **NO UNIT TESTS. NO `.test.*` OR `.spec.*` FILES ANYWHERE** in `apps/web`, `apps/api`, `apps/mobile`, `apps/worker` or `packages/*` (owner directive 2026-07-29). A routine testing program comes **after** the product is complete; authoring tests now is out of scope, not merely optional. The **only** sanctioned executable checks are `tests/invariants/` (the locked invariant set) and the on-demand verification scripts in `scripts/`. Verification of features is by **running the app and looking at it** (`/verify-app`), not by test files. A hook blocks creation of test files; adding any needs an explicit owner request.
- **Files ≲450 lines — and split by RESPONSIBILITY, never by size.** When a file grows past the cap, extract a genuine unit with a name describing what it *does*: `auth.invites.service.ts`, `login.countdown.ts`, `ProposalTotals.tsx`. **Names like `server-part2.ts`, `utils2.ts`, `helpers-extra.ts`, `<name>-continued.ts` are forbidden** — a split that needs a numeric suffix is the wrong split. If no honest name presents itself, the file has one responsibility and needs a different fix (extract a helper module, or leave it).
- **React: separate presentation from logic.** A component file renders; it does not also fetch, orchestrate, or hold flow logic. Use the container/presentational split — `ScreenName.tsx` (container: data, state, handlers) delegating to presentational components that take props and return markup — with shared logic in a `hooks.ts` satellite or, when both platforms need it, in `packages/domain`. A `.tsx` file containing both a data-fetching effect chain and the markup it feeds is a review finding.
- **Environment access is centralized and typed.** Credentials and configuration come from `.env` files (never literals in code, never committed). **No file outside `packages/env` may read `process.env`** — every app imports its fully-typed, validated config object from the shared env service (Phase 5). Biome's `noProcessEnv` enforces this.
- **Git stays manual and simple.** Commits happen when the user asks. Branches and pull requests are created **only on an explicit user command** ("commit this", "raise a PR") or by the user themselves. Never open a PR, push a branch, or run `gh pr create` unprompted.
- **Web + RN lockstep (Law 7):** a change with a mobile surface ships web and React Native in the same slice.
- **No new architectural pattern without an ADR approved first** (Law 2). This plan contains exactly one such change: `packages/domain` (ADR-0021, Task 30).
- **Run `pnpm lint` before every commit.** Biome owns formatting; never hand-format around it.
- **Commit messages record what was VERIFIED, not what was written.**
- **Never weaken a gate config to make a change pass.** A gate that blocks you means the change is wrong.
- **Secrets never enter context or the repo.** `.env.example` documents every var; real values live in `.env.local` / Fly secrets.

## Working environment

**Task 1 MUST run in the main working tree** at `/Volumes/works-space/heliogrid` — it commits ~113 uncommitted files that exist only there. From Task 2 onward, an isolated worktree (via `superpowers:using-git-worktrees`) is optional and safe.

Verify before starting Task 1:

```bash
git -C /Volumes/works-space/heliogrid status --porcelain | wc -l
```

Expected: a non-zero count (~113). If it reports `0`, the restructure was already committed — skip to Task 2 and confirm with `git log --oneline -3`.

---

## File Structure

**Phase 0 — modified:**
- `turbo.json` — add `env` + `cache: false` to the `test` task
- `tests/invariants/src/run.ts` — fail closed in CI
- `.github/workflows/ci.yml` — add the boundaries step
- `apps/api/CLAUDE.md`, `apps/mobile/CLAUDE.md`, `apps/mobile/src/navigation/routes.ts`, `apps/mobile/src/auth/client.ts` — rot sweep

**Phase 1 — created:** the whole harness surface.
- `.claude/settings.json` — permissions + hook registrations (one file owns harness policy)
- `.claude/hooks/{bash-guard,write-guard,edit-checks}.sh` — one guard per concern (shell commands · write-path policy · post-edit advice), each independently testable
- `CLAUDE.md`, `AGENTS.md`, `.claude/rules/00-laws.md` — the always-loaded surface (~1.3k tokens total)
- `.claude/rules/{contracts,db-schema,ui-adherence,i18n}.md` — path-scoped; each ≤25 lines, each names its skill
- `.claude/skills/*/SKILL.md` — eight procedures, one directory each
- `.claude/agents/{ux-lens,epc-lens,qa-breaker}.md` — flat subagent files

**Phase 2 — created/moved:** documentation authority.
- `scripts/check-doc-anchors.mjs` — built first so every later doc edit is verifiable
- `docs/product/{product-journey.md,studio-census.md}` — vendored product truth
- `docs/archive/` — BLUEPRINT and superseded research
- `docs/modules/forward-compat.md` — extracted from docs/14 §4
- `docs/17-engineering-governance.md` — rebuilt as the rule→mechanism matrix

**Phase 3 — created:** gates.
- `tests/invariants/src/{enum-parity.ts,table-tenancy-scan.ts}` — one invariant per concern
- `.oxlintrc.json`, `scripts/check-roadmaps.mjs`, `.github/pull_request_template.md`
- `biome.json`, `.dependency-cruiser.cjs`, `.github/workflows/ci.yml` — extended

**Phase 4 — created:** `packages/domain/` (pure TS), `packages/ui-api/` (types-only parity surface), `scripts/auth-e2e-replay.ts` (on-demand verification, not a test file).

**Phase 5 — created:** `packages/env/` — the one typed environment service for api, worker, web and mobile. Split by responsibility: `schema/` (shapes) · `parse.ts` (validation) · `server.ts` / `web.ts` / `native.ts` (the only three places a raw source is touched).

---

# PHASE 0 — Rescue & P0

**Why first:** the working tree holds enforcement assets that exist nowhere else (the 19-rule dependency-cruiser config with two silent-pass bugfixes). Losing it silently regresses the boundary layer. And until Task 2 lands, the CI test gate reports green without executing a single assertion.

---

### Task 1: Commit the in-flight restructure

**Files:**
- Modify: `packages/i18n/src/locales/{en,hi,mr}/messages.po` (regenerated by extract)
- Commit: ~113 files already modified/renamed/untracked in the working tree

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a clean `git status` and a committed `.dependency-cruiser.cjs` with 19 rules at `error` severity — every later task assumes these exist

- [ ] **Step 1: Capture the pre-commit state as evidence**

```bash
cd /Volumes/works-space/heliogrid
git status --porcelain | wc -l
git diff HEAD --stat | tail -1
grep -c "severity: 'error'" .dependency-cruiser.cjs
```

Expected: ~113 changed paths, and `19` from the last command. If the grep returns `10`, you are looking at the HEAD version — stop and investigate, the working tree changes may have been lost.

- [ ] **Step 2: Prove the i18n extract guard is currently RED**

```bash
pnpm --filter @heliogrid/i18n extract
git diff --exit-code packages/i18n/src/locales
```

Expected: FAIL (exit 1) with ~127 changed lines per locale — message origins moved when `LoginScreen.tsx` relocated to `src/screens/login/`. This is the failure CI would hit; the extract you just ran is also the fix.

- [ ] **Step 3: Run the full gate set**

```bash
pnpm lint && pnpm turbo typecheck && pnpm turbo build && pnpm boundaries
```

Expected: all four PASS. `pnpm lint` prints `no dependency violations found (255 modules, 550 dependencies cruised)`.

- [ ] **Step 4: Verify the extract guard is now green**

```bash
pnpm --filter @heliogrid/i18n extract
git diff --exit-code packages/i18n/src/locales
```

Expected: PASS (exit 0) — the regenerated catalogs are already on disk from Step 2, so a second extract is a no-op.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Restructure landed: module folders (api), screen folders (web+RN), 19 dep-cruiser rules

VERIFIED: pnpm lint (0 violations / 255 modules), turbo typecheck (8/8), turbo build,
turbo boundaries all green; i18n catalogs re-extracted so the CI extract guard passes.

Carries two dependency-cruiser silent-pass bugfixes that exist nowhere else:
- npm-target rules now anchor on the node_modules path segment (pnpm's .pnpm layout
  meant '^(@nestjs|react...)' never matched — those rules could not fire)
- dist/node_modules moved from `exclude` to `doNotFollow` (excluded nodes were deleted
  from the graph entirely, so web-no-db/mobile-no-db/contracts-lean could not see them)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Make the test gate real

**Files:**
- Modify: `turbo.json:11-13`
- Modify: `tests/invariants/src/run.ts:9-17`

**Interfaces:**
- Consumes: committed working tree from Task 1
- Produces: `pnpm turbo test` that actually executes `runTenancyInvariants(url)`; every Phase 3 invariant (Tasks 20, 21) relies on this or it will be silently skipped too

- [ ] **Step 1: Reproduce the vacuous gate**

```bash
cd /Volumes/works-space/heliogrid
DATABASE_URL=postgres://nobody@localhost:5432/nope \
DATABASE_ADMIN_URL=postgres://nobody@localhost:5432/nope \
./node_modules/.bin/turbo run test --filter=@heliogrid/invariants --force
```

Expected: prints `SKIP invariants: DATABASE_URL/DATABASE_ADMIN_URL not set` and **exits 0** — despite both URLs being set in the parent environment. Turborepo 2.x strict env mode stripped them. This is F1; every CI run to date "passed" this step without executing one assertion.

- [ ] **Step 2: Declare the env on the test task**

In `turbo.json`, replace:

```json
    "test": {
      "dependsOn": ["^build"]
    },
```

with:

```json
    "test": {
      "dependsOn": ["^build"],
      "env": ["DATABASE_URL", "DATABASE_ADMIN_URL", "CI"],
      "cache": false
    },
```

`cache: false` is load-bearing: database state is an undeclared input, so a cached "green" against a stale schema is the same silent-pass bug wearing a different hat. `CI` is declared because Step 3 reads it.

- [ ] **Step 3: Make the runner fail closed in CI**

In `tests/invariants/src/run.ts`, replace the whole `main` function:

```ts
async function main() {
  const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.warn('SKIP invariants: DATABASE_URL/DATABASE_ADMIN_URL not set (CI always sets one)');
    return;
  }
  await runTenancyInvariants(url);
  console.log('invariants green');
}
```

with:

```ts
async function main() {
  const url = process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;
  if (!url) {
    // Fail CLOSED in CI: a skipped invariant that reports success is worse than no
    // invariant at all — that is exactly how the tenancy gate went unexecuted for the
    // whole of the foundation phase (docs/foundation-redesign.md F1).
    if (process.env.CI) {
      throw new Error(
        'INVARIANTS NOT RUN: DATABASE_URL/DATABASE_ADMIN_URL missing under CI. ' +
          'Check the `env` list on turbo.json’s test task — Turborepo strict env mode ' +
          'strips undeclared variables.',
      );
    }
    console.warn('SKIP invariants: DATABASE_URL/DATABASE_ADMIN_URL not set (local run only)');
    return;
  }
  await runTenancyInvariants(url);
  console.log('invariants green');
}
```

- [ ] **Step 4: Verify it now fails closed under CI**

```bash
CI=1 ./node_modules/.bin/turbo run test --filter=@heliogrid/invariants --force
```

Expected: FAIL (exit 1) with `INVARIANT FAILURE` then `INVARIANTS NOT RUN: DATABASE_URL/DATABASE_ADMIN_URL missing under CI`. (No URL is set here, so this proves the fail-closed path.)

- [ ] **Step 5: Verify the env now reaches the runner**

Start a throwaway Postgres and migrate it:

```bash
docker run --rm -d --name hg-inv -e POSTGRES_USER=heliogrid -e POSTGRES_PASSWORD=heliogrid \
  -e POSTGRES_DB=heliogrid_ci -p 55432:5432 postgres:16
sleep 5
DATABASE_ADMIN_URL=postgres://heliogrid:heliogrid@localhost:55432/heliogrid_ci \
  pnpm --filter @heliogrid/db migrate
CI=1 DATABASE_URL=postgres://heliogrid:heliogrid@localhost:55432/heliogrid_ci \
DATABASE_ADMIN_URL=postgres://heliogrid:heliogrid@localhost:55432/heliogrid_ci \
  ./node_modules/.bin/turbo run test --filter=@heliogrid/invariants --force
```

Expected: PASS, printing `tenancy invariants OK — N tenant tables scanned: …` then `invariants green`. The named table list is the proof the assertions executed.

- [ ] **Step 6: Prove the gate can go red (the real test)**

Break RLS deliberately, then confirm the invariant catches it:

```bash
psql postgres://heliogrid:heliogrid@localhost:55432/heliogrid_ci \
  -c "alter table users disable row level security;"
CI=1 DATABASE_URL=postgres://heliogrid:heliogrid@localhost:55432/heliogrid_ci \
DATABASE_ADMIN_URL=postgres://heliogrid:heliogrid@localhost:55432/heliogrid_ci \
  ./node_modules/.bin/turbo run test --filter=@heliogrid/invariants --force
```

Expected: FAIL (exit 1) with `INVARIANT FAILURE` and a `tenancy:` assertion message. **This is the step that proves F1 is actually fixed** — before this task, the same broken schema produced a green build.

Restore and clean up:

```bash
psql postgres://heliogrid:heliogrid@localhost:55432/heliogrid_ci \
  -c "alter table users enable row level security;"
docker rm -f hg-inv
```

- [ ] **Step 7: Commit**

```bash
git add turbo.json tests/invariants/src/run.ts
git commit -m "$(cat <<'EOF'
fix: the CI test gate was vacuous — invariants never executed

VERIFIED: with a live migrated Postgres the tenancy invariant now runs and names the
tables it scanned; disabling RLS on `users` turns the gate RED (it stayed green before).
Without a DB URL under CI=1 the runner now exits 1 instead of 0.

Root cause: Turborepo 2.x strict env mode stripped DATABASE_URL/DATABASE_ADMIN_URL from
the test task (undeclared in turbo.json), and run.ts returned 0 when the URL was absent.
Both halves are fixed; cache:false because DB state is an undeclared input.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Wire `pnpm boundaries` into CI

**Files:**
- Modify: `.github/workflows/ci.yml:43-44`

**Interfaces:**
- Consumes: the `boundaries` root script (exists, green, never runs in CI)
- Produces: turbo tag violations become a red build

- [ ] **Step 1: Confirm the gap**

```bash
grep -c boundaries .github/workflows/ci.yml
grep -n '"boundaries"' package.json
```

Expected: `0` from the first (absent from CI), and a match from the second (the script exists). Tag violations currently merge freely.

- [ ] **Step 2: Confirm the script passes locally**

```bash
pnpm boundaries
```

Expected: PASS — reports checked files/packages with no issues.

- [ ] **Step 3: Add the CI step**

In `.github/workflows/ci.yml`, replace:

```yaml
      - run: pnpm turbo lint
      - run: pnpm turbo typecheck
```

with:

```yaml
      - run: pnpm turbo lint
      - name: Package boundaries (turbo tags — docs/17 Law 2)
        run: pnpm boundaries
      - run: pnpm turbo typecheck
```

- [ ] **Step 4: Verify the workflow file is valid**

```bash
python3 -c "import yaml,sys; d=yaml.safe_load(open('.github/workflows/ci.yml')); \
print([s.get('name') or s.get('run') for s in d['jobs']['quality']['steps']])"
```

Expected: prints the step list including `Package boundaries (turbo tags — docs/17 Law 2)` between the lint and typecheck steps.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: run turbo boundaries (the script existed but never ran in CI)

VERIFIED: pnpm boundaries green locally; workflow YAML parses with the new step
ordered between lint and typecheck.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Rot sweep

**Files:**
- Modify: `apps/api/CLAUDE.md` (2 stale facts)
- Modify: `apps/mobile/CLAUDE.md` (1 stale fact)
- Modify: `apps/mobile/src/navigation/routes.ts:6` (doctrine contradicts code)
- Modify: `apps/mobile/src/auth/client.ts` (delete dead export)

**Interfaces:**
- Consumes: committed restructure
- Produces: per-package CLAUDE.mds that state only true things — Task 19's rule→mechanism matrix cites them as authoritative

- [ ] **Step 1: Confirm each stale fact**

```bash
grep -n "contract-exception.ts" apps/api/CLAUDE.md
grep -n "currently \`warn\`" apps/api/CLAUDE.md apps/mobile/CLAUDE.md
ls apps/api/src/common/errors/contract-exception.ts
grep -c "severity: 'error'" .dependency-cruiser.cjs
grep -n "onSignedIn" apps/mobile/src/navigation/routes.ts apps/mobile/src/navigation/RootNavigator.tsx
grep -rn "from '../auth/client'" apps/mobile/src --include=*.ts --include=*.tsx | grep -v "keychain" | wc -l
```

Expected: the CLAUDE.mds claim `src/common/contract-exception.ts` and `currently warn`; the file actually lives under `common/errors/`; all 19 cruiser rules are `error`; `routes.ts` forbids `onSignedIn` callbacks while `RootNavigator.tsx` passes one.

- [ ] **Step 2: Fix the api path fact**

In `apps/api/CLAUDE.md`, replace `` (`src/common/contract-exception.ts`) `` with `` (`src/common/errors/contract-exception.ts`) ``.

- [ ] **Step 3: Fix both severity facts**

In `apps/api/CLAUDE.md`, replace:

```
  (dep-cruiser `db-access-in-repositories-only`, currently `warn` — see Landmines).
```

with:

```
  (dep-cruiser `db-access-in-repositories-only`, severity `error`).
```

In `apps/mobile/CLAUDE.md`, replace:

```
  `App.tsx` renders `RootNavigator` and never imports a screen (dep-cruiser `mobile-app-entry-thin`,
  currently `warn`; flips to `error` with ADR-0020's navigation slice).
```

with:

```
  `App.tsx` renders `RootNavigator` and never imports a screen (dep-cruiser
  `mobile-app-entry-thin`, severity `error` since ADR-0020's navigation slice landed).
```

- [ ] **Step 4: Reconcile the routes.ts doctrine with the code**

In `apps/mobile/src/navigation/routes.ts`, replace:

```ts
 * params; screens never receive `onSignedIn`/`onBack` style callbacks.
```

with:

```ts
 * params. Navigation between screens is by route name, never by prop callback. The one
 * sanctioned exception is the session boundary: `RootNavigator` passes `onSignedIn` to
 * `LoginScreen` because the auth stack is SWAPPED (not navigated) once a session exists.
```

- [ ] **Step 5: Delete the dead untyped fetch helper**

Open `apps/mobile/src/auth/client.ts` and delete the exported `api<T>()` helper (around line 75) in full, including its doc comment. It has zero importers — every call site imports from `src/data/api-client`. The web app already removed its equivalent as a documented landmine (untyped fetch drift).

- [ ] **Step 6: Verify nothing referenced it and gates stay green**

```bash
grep -rn "\bapi<" apps/mobile/src | grep -v "api-client" || echo "no callers — clean"
pnpm lint && pnpm turbo typecheck
```

Expected: `no callers — clean`, then both gates PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/CLAUDE.md apps/mobile/CLAUDE.md apps/mobile/src/navigation/routes.ts apps/mobile/src/auth/client.ts
git commit -m "$(cat <<'EOF'
chore: rot sweep — 4 stale CLAUDE.md/doctrine facts + dead untyped fetch helper

VERIFIED: lint + typecheck green; grep confirms the deleted api<T>() export had zero
callers (all sites use src/data/api-client).

- contract-exception.ts path corrected to src/common/errors/
- db-access-in-repositories-only and mobile-app-entry-thin documented as `error`
  (both have been error severity since the restructure; the docs said `warn`)
- routes.ts now documents the one sanctioned prop callback (onSignedIn at the session
  boundary) instead of forbidding what RootNavigator actually does

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

**PHASE 0 GATE.** Before starting Phase 1, confirm all four tasks hold together:

```bash
git status --porcelain | wc -l   # expect 0
pnpm lint && pnpm boundaries && pnpm turbo typecheck && pnpm turbo build
```

Expected: clean tree, all gates PASS. The CI test gate now executes real assertions (proven in Task 2 Step 6).

---

# PHASE 1 — Instruction architecture

**Why now:** Phase 0 fixed what lies; Phase 1 replaces the ~19.6k-token four-layer prose governance with a ~1.3k always-on surface plus on-demand skills. Hooks land first (Task 5) so every later task in this plan is itself protected by them.

---

### Task 5: Hook scripts + settings.json

**Files:**
- Create: `.claude/hooks/bash-guard.sh`
- Create: `.claude/hooks/write-guard.sh`
- Create: `.claude/hooks/edit-checks.sh`
- Create: `.claude/settings.json`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `.claude/settings.json` — Tasks 6–12 add nothing to it; it is complete after this task. Hook contract: PreToolUse hooks exit `2` to block (stderr message goes to Claude); PostToolUse hooks exit `0` and emit `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"…"}}` on stdout to inject advice.

- [ ] **Step 1: Write the failing test — a probe that should be blocked**

Create `/tmp/hg-hook-probe-bash.json` with a payload shaped like a real PreToolUse Bash event:

```bash
mkdir -p /tmp/hg-hooks
cat > /tmp/hg-hooks/sed.json <<'EOF'
{"session_id":"probe","cwd":"/Volumes/works-space/heliogrid","hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"sed -i '' 's/foo/bar/' docs/00-vision-and-scope.md"}}
EOF
cat > /tmp/hg-hooks/safe.json <<'EOF'
{"session_id":"probe","cwd":"/Volumes/works-space/heliogrid","hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"pnpm turbo typecheck"}}
EOF
```

- [ ] **Step 2: Run the probe to verify it fails (no hook yet)**

```bash
bash .claude/hooks/bash-guard.sh < /tmp/hg-hooks/sed.json
```

Expected: FAIL — `bash: .claude/hooks/bash-guard.sh: No such file or directory`.

- [ ] **Step 3: Write `bash-guard.sh`**

Create `.claude/hooks/bash-guard.sh`:

```bash
#!/usr/bin/env bash
# PreToolUse:Bash — blocks commands the constitution forbids. Exit 2 = block.
# Node is guaranteed present (engines: node >=22 <23), so parse JSON with it.
set -uo pipefail

payload=$(cat)
cmd=$(printf '%s' "$payload" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try { process.stdout.write(JSON.parse(s).tool_input?.command ?? ""); }
    catch { process.stdout.write(""); }
  });
')

deny() {
  printf 'BLOCKED by .claude/hooks/bash-guard.sh: %s\n' "$1" >&2
  exit 2
}

# In-place stream edits have corrupted files in the predecessor repo (CLAUDE.md §Process).
if printf '%s' "$cmd" | grep -Eq '(^|[^[:alnum:]_./-])(sed|perl|python[0-9.]*)([[:space:]]+[^|;&]*)?[[:space:]]-i([[:space:]]|$|'"'"'|")'; then
  deny "in-place stream edits (sed -i / perl -i / python -i) are banned — they have corrupted files in this codebase. Use the Edit or Write tool instead."
fi

# Force-pushing main destroys shared history.
if printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+push([[:space:]]+[^|;&]*)?[[:space:]]+(--force([[:space:]]|$)|-f([[:space:]]|$))' \
  && printf '%s' "$cmd" | grep -Eq '(^|[[:space:]])main([[:space:]]|$|:)'; then
  deny "force-pushing main is not allowed. Push a branch and open a PR (docs/foundation-redesign.md §8)."
fi

# Destructive recursive deletes outside the repo.
if printf '%s' "$cmd" | grep -Eq 'rm[[:space:]]+(-[a-zA-Z]*[rR][a-zA-Z]*[[:space:]]+)*-?[a-zA-Z]*[rR][a-zA-Z]*[[:space:]]+(/|~|\$HOME)([[:space:]]|$)'; then
  deny "recursive delete targeting / or \$HOME. Scope the path inside the repository."
fi

exit 0
```

Make it executable:

```bash
chmod +x .claude/hooks/bash-guard.sh
```

- [ ] **Step 4: Run the probes to verify block-and-allow**

```bash
bash .claude/hooks/bash-guard.sh < /tmp/hg-hooks/sed.json; echo "exit=$?"
bash .claude/hooks/bash-guard.sh < /tmp/hg-hooks/safe.json; echo "exit=$?"
```

Expected: first prints the `BLOCKED by …` message and `exit=2`; second prints `exit=0` with no output.

- [ ] **Step 5: Write `write-guard.sh` and its probes**

One hook owns write-path policy: which paths may be written at all. Two rules today —
migrations are append-only, and test files are not authored in this repo.

Create `.claude/hooks/write-guard.sh`:

```bash
#!/usr/bin/env bash
# PreToolUse:Edit|Write — write-path policy. Exit 2 = block.
#   1. Applied migrations are append-only (packages/db/CLAUDE.md).
#   2. No unit-test files (.test.* / .spec.*) — owner directive 2026-07-29.
set -uo pipefail

payload=$(cat)
path=$(printf '%s' "$payload" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try { process.stdout.write(JSON.parse(s).tool_input?.file_path ?? ""); }
    catch { process.stdout.write(""); }
  });
')

[ -n "$path" ] || exit 0

deny() {
  printf 'BLOCKED by .claude/hooks/write-guard.sh: %s\n' "$1" >&2
  exit 2
}

# ── 1. Migrations are append-only ────────────────────────────────────────────
case "$path" in
  *packages/db/migrations/*)
    if git ls-files --error-unmatch "$path" >/dev/null 2>&1; then
      deny "$(printf '%s is an APPLIED migration. Migrations are append-only and sha256-locked by the runner — editing this file makes `pnpm --filter @heliogrid/db migrate` refuse to run. Create a new migration file instead.' "$path")"
    fi
    ;;
esac

# ── 2. No unit-test files ────────────────────────────────────────────────────
case "$path" in
  *.test.ts|*.test.tsx|*.test.js|*.test.jsx|*.spec.ts|*.spec.tsx|*.spec.js|*.spec.jsx)
    deny "$(printf 'test files are not authored in this repo (owner directive 2026-07-29). A routine testing program comes AFTER the product is complete. The only sanctioned executable checks are tests/invariants/ (the locked invariant set) and on-demand scripts in scripts/. Features are verified by RUNNING the app — see the /verify-app skill. If a test is genuinely needed, ask the owner first.')"
    ;;
esac

exit 0
```

```bash
chmod +x .claude/hooks/write-guard.sh
cat > /tmp/hg-hooks/mig-applied.json <<'EOF'
{"session_id":"probe","hook_event_name":"PreToolUse","tool_name":"Edit","tool_input":{"file_path":"packages/db/migrations/0001_foundation.sql"}}
EOF
cat > /tmp/hg-hooks/mig-new.json <<'EOF'
{"session_id":"probe","hook_event_name":"Write","tool_name":"Write","tool_input":{"file_path":"packages/db/migrations/0006_new_thing.sql"}}
EOF
cat > /tmp/hg-hooks/testfile.json <<'EOF'
{"session_id":"probe","hook_event_name":"Write","tool_name":"Write","tool_input":{"file_path":"apps/api/src/modules/auth/auth.service.spec.ts"}}
EOF
cat > /tmp/hg-hooks/normalfile.json <<'EOF'
{"session_id":"probe","hook_event_name":"Write","tool_name":"Write","tool_input":{"file_path":"apps/api/src/modules/auth/auth.service.ts"}}
EOF
```

- [ ] **Step 6: Run the write-path probes**

```bash
for p in mig-applied mig-new testfile normalfile; do
  printf '%-12s ' "$p"
  bash .claude/hooks/write-guard.sh < /tmp/hg-hooks/$p.json >/dev/null 2>&1
  echo "exit=$?"
done
bash .claude/hooks/write-guard.sh < /tmp/hg-hooks/testfile.json 2>&1 >/dev/null | head -2
```

Expected: `mig-applied exit=2` · `mig-new exit=0` · `testfile exit=2` · `normalfile exit=0`, then the test-file block message explaining that verification is by running the app.

- [ ] **Step 7: Write `edit-checks.sh`**

Create `.claude/hooks/edit-checks.sh`:

```bash
#!/usr/bin/env bash
# PostToolUse:Edit|Write — advisory feedback only (exit 0 always).
# Hard enforcement lives in CI (oxlint max-lines + no-raw-hex); this is the fast signal.
set -uo pipefail

payload=$(cat)
path=$(printf '%s' "$payload" | node -e '
  let s = "";
  process.stdin.on("data", (d) => (s += d)).on("end", () => {
    try { process.stdout.write(JSON.parse(s).tool_input?.file_path ?? ""); }
    catch { process.stdout.write(""); }
  });
')

[ -n "$path" ] && [ -f "$path" ] || exit 0

notes=""

lines=$(wc -l < "$path" | tr -d ' ')
if [ "$lines" -gt 450 ]; then
  notes="${notes}${path} is now ${lines} lines (cap ~450). Split by SUBAREA in the same folder before adding more. "
fi

case "$path" in
  *packages/ui/src/*|*apps/mobile/src/ui/*|*apps/mobile/src/screens/*|*apps/web/app/*)
    if grep -Eq "#[0-9a-fA-F]{3,8}\b" "$path"; then
      notes="${notes}${path} contains a raw hex colour. Every visual value comes from @heliogrid/tokens (generated from design/ds-source) — see .claude/rules/ui-adherence.md. "
    fi
    ;;
esac

[ -n "$notes" ] || exit 0

node -e '
  const note = process.argv[1];
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: note,
    },
  }));
' "$notes"
exit 0
```

```bash
chmod +x .claude/hooks/edit-checks.sh
```

- [ ] **Step 8: Verify edit-checks fires on a hex literal and stays quiet otherwise**

```bash
printf 'const c = "#5A4BFF";\n' > /tmp/hg-hooks/Fake.tsx
cat > /tmp/hg-hooks/edit-hex.json <<EOF
{"session_id":"probe","hook_event_name":"PostToolUse","tool_name":"Edit","tool_input":{"file_path":"$PWD/packages/ui/src/index.ts"}}
EOF
bash .claude/hooks/edit-checks.sh < /tmp/hg-hooks/edit-hex.json; echo " exit=$?"
```

Expected: `exit=0`. For `packages/ui/src/index.ts` (no hex, short) it prints nothing. Now prove the hex branch with a real UI file that has colours:

```bash
cat > /tmp/hg-hooks/edit-css.json <<EOF
{"session_id":"probe","hook_event_name":"PostToolUse","tool_name":"Edit","tool_input":{"file_path":"$PWD/design/ds-source/tokens/colors.css"}}
EOF
bash .claude/hooks/edit-checks.sh < /tmp/hg-hooks/edit-css.json; echo " exit=$?"
```

Expected: `exit=0` and no JSON — `design/ds-source/` is deliberately outside the matched paths (it is the token *source*; raw hex there is correct). This confirms the path filter works. To see a positive case, temporarily copy a colours file into a matched path:

```bash
cp design/ds-source/tokens/colors.css packages/ui/src/__probe.css
cat > /tmp/hg-hooks/edit-probe.json <<EOF
{"session_id":"probe","hook_event_name":"PostToolUse","tool_name":"Edit","tool_input":{"file_path":"$PWD/packages/ui/src/__probe.css"}}
EOF
bash .claude/hooks/edit-checks.sh < /tmp/hg-hooks/edit-probe.json; echo " exit=$?"
rm packages/ui/src/__probe.css
```

Expected: prints JSON containing `contains a raw hex colour` and `exit=0`.

- [ ] **Step 9: Write `.claude/settings.json`**

Create `.claude/settings.json`:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "defaultMode": "plan",
  "permissions": {
    "allow": [
      "Bash(pnpm turbo *)",
      "Bash(pnpm lint)",
      "Bash(pnpm lint:fix)",
      "Bash(pnpm boundaries)",
      "Bash(pnpm --filter *)",
      "Bash(pnpm install)",
      "Bash(git status)",
      "Bash(git status *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git show *)",
      "Bash(git ls-files *)",
      "Bash(node scripts/*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./apps/**/.env*)",
      "Read(./**/*.keystore)",
      "Read(./**/*.p8)",
      "Read(./**/*.p12)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/bash-guard.sh"
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/write-guard.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/edit-checks.sh"
          }
        ]
      }
    ]
  }
}
```

Notes on choices: `.env.example` is deliberately **not** denied (it is the documented contract, no secrets). `defaultMode: "plan"` makes module work start in plan mode — the direct fix for "planning is weak before implementation". Project settings may set `plan`; `auto` would be ignored at project scope.

- [ ] **Step 10: Verify the settings file parses and paths resolve**

```bash
node -e "const s=require('./.claude/settings.json');
const hooks=[...s.hooks.PreToolUse,...s.hooks.PostToolUse].flatMap(h=>h.hooks.map(x=>x.command));
console.log(hooks);
const fs=require('fs');
for (const h of hooks) { const p=h.replace('\"\$CLAUDE_PROJECT_DIR\"','.').replace(/\"/g,'');
  if(!fs.existsSync(p)) throw new Error('missing hook script: '+p);
  if(!(fs.statSync(p).mode & 0o111)) throw new Error('not executable: '+p); }
console.log('all hook scripts exist and are executable');"
```

Expected: prints the three commands then `all hook scripts exist and are executable`.

- [ ] **Step 11: Commit**

```bash
git add .claude/settings.json .claude/hooks
git commit -m "$(cat <<'EOF'
feat(harness): hooks + permissions — sed -i, migration edits and test files blocked

VERIFIED by probe payloads: bash-guard exits 2 on `sed -i` and 0 on `pnpm turbo
typecheck`; write-guard exits 2 on 0001_foundation.sql and on auth.service.spec.ts, and 0
on an untracked 0006_*.sql and on auth.service.ts; edit-checks emits additionalContext
JSON for a hex literal under packages/ui/src and stays silent elsewhere. settings.json
parses; all three scripts exist and are executable.

Converts four prose rules into tool-call-time mechanism (foundation-redesign F2),
including the owner's no-unit-tests directive — verification is by running the app.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Root CLAUDE.md + AGENTS.md + the laws digest

**Files:**
- Create: `CLAUDE.md` (repo root — deleted in the current tree)
- Create: `AGENTS.md`
- Create: `.claude/rules/00-laws.md`

**Interfaces:**
- Consumes: `.claude/settings.json` from Task 5
- Produces: the always-loaded surface. Task 19's docs/17 rebuild links back to `.claude/rules/00-laws.md`; Task 13's anchor checker validates every `docs/NN §M` reference these files make.

- [ ] **Step 1: Confirm the current state and the phantom anchors**

```bash
ls CLAUDE.md AGENTS.md 2>&1 | head -2
git show HEAD:CLAUDE.md | grep -cE '^## (Structure|Layer quick-ref|Slice workflow|Definition of done|Enforcement matrix)'
grep -rln 'CLAUDE\.md §\(Structure\|Layer quick-ref\|Slice workflow\|Definition of done\|Enforcement matrix\)' docs apps packages --include=*.md | wc -l
```

Expected: both files absent; `0` phantom headings in the committed constitution; ~12 files citing them. Those citations get repaired in Task 16 and 19 — this task creates the file they should have been pointing at.

- [ ] **Step 2: Write the root `CLAUDE.md`**

Create `CLAUDE.md` with the content drafted in `docs/foundation-redesign.md` §3.1, **with the `## Process` section replaced by the version below** (it carries the owner directives of 2026-07-29: no unit tests, responsibility-based splitting, React separation, centralized env, manual git). Everything else in §3.1 — the identity paragraph, "How work happens here", Commands, Hard boundaries, Product law, and the closing pointer line — is copied verbatim without the surrounding triple-backtick fence.

```markdown
## Process
- Edit/Write tools for ALL file changes. Never sed/perl/python -i (corrupted files before).
- Never edit an applied migration; append a new one.
- Schema/APIs grow module-wise ONLY (Law 9): docs/04 is frozen design, not a build order.
- Web + RN ship in the SAME slice from the same contract (Law 7); exceptions need an owner
  ruling recorded in the module roadmap.
- **NO UNIT TESTS. Never create a `.test.*` or `.spec.*` file** in any app or package
  (owner directive 2026-07-29 — a testing program comes after the product is complete).
  The only executable checks are `tests/invariants/` and on-demand `scripts/`. Verify
  features by RUNNING them (/verify-app). Adding any test needs an explicit owner request.
- **Files ≲450 lines, split by RESPONSIBILITY.** The new file is named for what it does
  (`auth.invites.service.ts`, `login.countdown.ts`) — NEVER `*-part2`, `*2`, `*-extra`,
  `*-continued`. A split needing a numeric suffix is the wrong split.
- **React: presentation and logic live in different files.** A component renders; it does
  not also fetch, orchestrate or hold flow logic. Container (`<Name>Screen.tsx`: data,
  state, handlers) → presentational components (props in, markup out); shared logic in a
  `hooks.ts` satellite, or `packages/domain` when both platforms need it.
- **Config and credentials come from `.env` via `@heliogrid/env` only.** No file outside
  `packages/env` reads `process.env` (Biome `noProcessEnv` enforces it). No secret literal
  in code, ever. `.env.example` documents every var.
- **Git is manual.** Commit when the user asks. Create branches or PRs ONLY on an explicit
  user command — never open a PR or push unprompted.
- Match surrounding style; comments only for constraints code can't express.
```

- [ ] **Step 3: Write `AGENTS.md`**

Create `AGENTS.md`:

```markdown
CLAUDE.md
```

One line, pointing non-Claude agents at the constitution. This is the pattern the previous repo used and it cost nothing.

- [ ] **Step 4: Write the laws digest**

Create `.claude/rules/00-laws.md` (no `paths:` frontmatter — it loads at launch alongside CLAUDE.md):

```markdown
# The Laws (docs/17) — one line each

1. **Foundation before features.** Feature modules build only on landed foundation.
2. **Architecture is fixed; features extend, never redefine.** New pattern → ADR first.
3. **Contracts before code.** requirements → domain model → API contract → shared types →
   migration → implementation → verification → docs. Never in reverse.
4. **Single source of truth.** Business enums/validation → contracts. Visual values →
   tokens (generated). Schema → docs/04 + migrations. i18n → the one catalog.
   Duplicate definitions are defects, not conveniences.
5. **Reuse before creation.** Search the component indexes and contracts first. Creating
   what exists is a defect. Unmocked surfaces are COMPOSED from existing vocabulary.
6. **Requirement traceability.** Every slice traces to a D-decision, a mockup filename,
   and a module-roadmap task.
7. **Cross-platform lockstep.** Web + RN in the SAME slice from the same contract.
   Exceptions require an owner ruling recorded in the module roadmap.
8. **Documentation is code.** A change that invalidates a doc updates it in the SAME commit.
9. **Incremental schema & API growth.** Tables, enums, columns, contracts and endpoints are
   authored only when their OWNING module's slice begins. docs/04 is frozen DESIGN, not a
   build order. Asked to "implement the schema" → implement the CURRENT module's slice.

## Decision hierarchy (conflicts resolve top-down)

1. These Laws → 2. Product requirements (docs/product D-census + docs/15 rulings) →
3. Architecture (ADRs + docs/02 + docs/03) → 4. Shared domain (docs/04 + packages/domain
purity) → 5. API contracts (packages/contracts) → 6. UX spec (design/mockups by filename +
docs/10 interaction law) → 7. Design system (design/ds-source via packages/tokens + the
component API) → 8. Repo standards (CLAUDE.md + per-package CLAUDE.md) → 9. Implementation.

Never invent at level N what a higher level already defines. Where a cross-cutting rule and
a per-package CLAUDE.md disagree, **the per-package file wins** (it is closer to the code
and has historically always been the accurate one).

## Stop and ask the owner before

- Anything billable or external-account-shaped (Fly, store accounts, paid APIs).
- Schema or API work outside the current module (Law 9).
- Any new architectural pattern, folder category, state approach or dependency category
  (Law 2 — needs an ADR approved before code).
- A conflict between layers that the hierarchy above does not resolve.
- A product-shaped finding (missing business rule, UX gap, spec ambiguity): record it in
  the module roadmap / docs/13 / docs/15 FIRST, then continue.
```

- [ ] **Step 5: Verify the size budget**

```bash
wc -l CLAUDE.md .claude/rules/00-laws.md
node -e "const fs=require('fs');
for (const f of ['CLAUDE.md','.claude/rules/00-laws.md']) {
  const b=fs.statSync(f).size; console.log(f, b+'B', '~'+Math.round(b/4)+' tokens'); }"
```

Expected: `CLAUDE.md` ≈ 70 lines / ~650 tokens (the expanded Process section carries the 2026-07-29 owner directives); `00-laws.md` ≈ 45 lines / ~450 tokens. Both comfortably under the official <200-line guidance. If `CLAUDE.md` exceeds 90 lines, cut — content belongs in a skill or a path-scoped rule, not here.

- [ ] **Step 6: Verify no phantom self-references**

```bash
grep -oE '§[A-Za-z][A-Za-z ]+' CLAUDE.md | sort -u
```

Expected: no output, or only references to sections that exist in `CLAUDE.md` itself. The new constitution deliberately uses file pointers (`.claude/rules/00-laws.md`, `docs/17`) rather than `§Section` self-anchors — that is what created F3.

- [ ] **Step 7: Commit**

```bash
git add CLAUDE.md AGENTS.md .claude/rules/00-laws.md
git commit -m "$(cat <<'EOF'
feat(harness): rebuilt constitution — 55 lines replacing ~19.6k tokens of prose governance

VERIFIED: CLAUDE.md ~500 tokens, .claude/rules/00-laws.md ~450 tokens (both under the
official <200-line guidance); no §Section self-anchors, so the class of dangling
reference that broke 12 files (foundation-redesign F3) cannot recur here.

Laws 1-9, the decision hierarchy and the stop-and-ask triggers move to the always-loaded
laws digest; every procedure moves to .claude/skills/ (Tasks 8-10); layer law stays in
per-package CLAUDE.mds.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Path-scoped rules

**Files:**
- Create: `.claude/rules/contracts.md`
- Create: `.claude/rules/db-schema.md`
- Create: `.claude/rules/ui-adherence.md`
- Create: `.claude/rules/i18n.md`

**Interfaces:**
- Consumes: `.claude/rules/00-laws.md` (Task 6)
- Produces: rules that name `/contract-change` and `/migration` — those skills must exist (Task 9) for the pointers to resolve. Write these first; the skills follow.

- [ ] **Step 1: Verify path-scoped loading is available and confirm target paths exist**

```bash
ls packages/contracts/src packages/db/src packages/ui/src apps/mobile/src/ui packages/i18n/src | head
```

Expected: all five directories exist. Rules with a `paths:` frontmatter key load **on demand** when Claude reads a matching file — they cost zero context until then.

- [ ] **Step 2: Write `.claude/rules/contracts.md`**

```markdown
---
paths:
  - "packages/contracts/**/*.ts"
---

# Contracts — the API review surface

- **The contract diff comes FIRST.** Change `packages/contracts` before implementing an
  endpoint or a client. The diff IS the API review.
- `tenant_id` NEVER travels in a request body — it comes from verified session claims.
- **One `z.enum` per business set** (Law 4), exported with its inferred type. Consumers
  import the type; they never re-declare the values. UI status/variant maps are
  `Record<TheEnum, …>` so a new value fails to compile rather than rendering blank.
- Money crosses the wire as a 2-dp decimal string, never a float.
- Every non-2xx response uses the canonical envelope (`error.ts` + `errorHttpStatusByCode`).
- Protocol constants clients need (`OTP_LENGTH`, `PHONE_NSN_LENGTH`, …) are exported here
  so no client hard-codes them.
- Zod is pinned at 3.x and `zod/v4` is Biome-banned (ts-rest Zod-4 support is still RC —
  spike S3). Do not lift the pin.

**After any change to this package, run `/contract-change`** — it re-emits OpenAPI, runs
the enum-parity invariant, and sweeps the typed clients for drift.
```

- [ ] **Step 3: Write `.claude/rules/db-schema.md`**

```markdown
---
paths:
  - "packages/db/**/*.ts"
  - "packages/db/migrations/*.sql"
---

# Database — append-only, tenant-scoped, fail-closed

- **Migrations are append-only** and sha256-locked by the runner. Editing an applied file
  makes `migrate` refuse to run (a PreToolUse hook also blocks the edit). Add a new file.
- **Every tenant-owned table carries `tenant_id`** plus an RLS policy for `app_user`
  checking `app.tenant_id`, fail-closed via `current_setting(..., true)`. A table that is
  genuinely global goes on the allowlist in `tests/invariants/src/table-tenancy-scan.ts`
  with a one-line justification — there is no third option.
- Tenancy is defence in depth, all three always: guard (JWT claims) → repository filter
  (tenantId from context, never from client input) → RLS backstop.
- ids are UUIDv7 generated **app-side**; raw SQL inserts must supply ids.
- Append-only ledgers (`audit_log`, `usage_events`, `sync_mutations`) get no UPDATE/DELETE
  grants. No default privileges exist — a forgotten grant fails closed.
- **pgEnum values are parity-checked against contracts** by the enum-parity invariant.
  A new value = migration here + `z.enum` change there, in the same slice.
- Schema grows module-wise only (Law 9). docs/04 is frozen design, not a build order.

**Authoring a migration? Run `/migration`.**
```

- [ ] **Step 4: Write `.claude/rules/ui-adherence.md`**

```markdown
---
paths:
  - "packages/ui/**"
  - "apps/mobile/src/ui/**"
  - "apps/mobile/src/screens/**"
  - "apps/web/app/**"
---

# UI adherence — tokens only, compose don't invent

- **No raw values.** No hex, no arbitrary px, no inline style. Every visual value comes
  from `@heliogrid/tokens`, which is GENERATED from `design/ds-source` — never
  hand-transcribed. `_ds_manifest.json` is untrusted for values. (oxlint enforces; a
  PostToolUse hook warns immediately.)
- **Primary actions are near-black** (`#0A0A0B`). Accent `#5A4BFF` is focus / links /
  selection / active-tab / control fills ONLY — **never a button fill**. Iridescence is
  atmosphere, never information. Hierarchy from luminance + elevation, not 1px borders.
- **Light-only v1.** The 11px/700/uppercase/0.12em overline is the one sub-12px exception.
- **Compose from the component indexes** (`packages/ui`, `apps/mobile/src/ui`). Screens
  import only from those indexes; raw styling in a screen is a violation. A surface the
  mockups don't cover is composed from the existing vocabulary — never new visuals.
- Copy props are required, never optional-with-English-fallback.
- Touch targets ≥44px · 375px works for every screen · no hover-only meaning ·
  loading/empty/error/offline are all part of done · Hindi renders without clipping
  (allow 20–30% text expansion).
- Web + RN ship together (Law 7) and their component APIs are parity-checked.

## Presentation and logic live in different files

A component renders. It does not also fetch, orchestrate, or hold flow logic.

- **Container** — `<Name>Screen.tsx` (web: `page.tsx`): data loading via the typed client,
  state, handlers, navigation. Returns presentational components; contains little markup.
- **Presentational** — `components.tsx` satellite or `packages/ui` components: props in,
  markup out. No hooks beyond local UI state, no data access, no navigation.
- **Logic** — a `hooks.ts` satellite for screen-local logic; `packages/domain` for anything
  both platforms need (state machines as pure reducers, formatters, invariants).

A `.tsx` holding both a data-fetching effect chain and the markup it feeds is a review
finding. When a file passes ~450 lines, split by RESPONSIBILITY and name the new file for
what it does — never `*-part2`, `*2`, `*-extra`.
```

- [ ] **Step 5: Write `.claude/rules/i18n.md`**

```markdown
---
paths:
  - "packages/i18n/**"
  - "**/*.po"
---

# i18n — one catalog, two platforms

- ONE Lingui catalog (EN/HI/MR) serves web AND React Native. `LOCALES` derives from the
  contracts `uiLanguageSchema` — never restate the locale list (Law 4).
- **Runtime `<Trans id="English source">` is the convention on both platforms** — the
  `@lingui/swc-plugin` fails against this Next version. See `packages/i18n/CLAUDE.md`
  for the exact migration path when that unblocks.
- **Never mix macro `<Trans>` and explicit-id usage for the same string** — the extractor
  forks them into duplicate `.po` entries (this cost real translations on 2026-07-26).
- **Never translate:** kW, kWh, kWp, brand names, DISCOM names. ₹ uses Indian grouping
  (lakh/crore) in every locale, via the shared formatter.
- Language is per USER, not per tenant.
- **Run `pnpm --filter @heliogrid/i18n extract` before committing** — CI fails if the
  catalogs are not freshly extracted.
```

- [ ] **Step 6: Verify frontmatter parses and globs match real files**

```bash
node -e "
const fs=require('fs');
for (const f of ['contracts','db-schema','ui-adherence','i18n']) {
  const p='.claude/rules/'+f+'.md';
  const t=fs.readFileSync(p,'utf8');
  const m=t.match(/^---\n([\s\S]*?)\n---\n/);
  if(!m) throw new Error(p+': missing frontmatter');
  const globs=[...m[1].matchAll(/-\s+\"(.+?)\"/g)].map(x=>x[1]);
  if(!globs.length) throw new Error(p+': no paths');
  console.log(p, globs);
}
console.log('all four rules have paths frontmatter');"
wc -l .claude/rules/*.md
```

Expected: each file prints its glob list, then `all four rules have paths frontmatter`. Keep `contracts.md`, `db-schema.md` and `i18n.md` ≤30 lines; `ui-adherence.md` may reach ~50 (it carries both the token law and the presentation/logic separation pattern). These load only on a matching file read, so their cost is paid by the work that needs them.

- [ ] **Step 7: Commit**

```bash
git add .claude/rules
git commit -m "$(cat <<'EOF'
feat(harness): four path-scoped rules replacing the 9-file always-mandated rules layer

VERIFIED: all four parse with `paths:` frontmatter and non-empty glob lists; each ≤30
lines. They cost zero context until Claude reads a matching file — the old layer had no
loading mechanism at all and depended on the agent obeying a prose read-order (F4).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Skills — `/slice` and `/roadmap`

**Files:**
- Create: `.claude/skills/slice/SKILL.md`
- Create: `.claude/skills/roadmap/SKILL.md`

**Interfaces:**
- Consumes: `.claude/rules/*` (Task 7)
- Produces: `/slice` references `/contract-change`, `/migration`, `/verify-app`, `/lenses`, `/doc-sync`, `/pr` — all created in Tasks 9–10. `/roadmap` produces `docs/modules/<module>/specs/` which the ux-lens agent (Task 11) reviews against.

- [ ] **Step 1: Verify the skills directory is empty and the template exists**

```bash
ls .claude/skills 2>&1 | head -2
ls docs/modules/_template.md docs/modules/auth-tenancy/specs/
```

Expected: no skills directory yet; the roadmap template and the auth-tenancy specs (the pattern `/roadmap` institutionalizes) both exist.

- [ ] **Step 2: Write `.claude/skills/slice/SKILL.md`**

```markdown
---
name: slice
description: Implement one module-roadmap task end to end — loads exactly the right context, enforces contract-first order, web+RN lockstep, gates, run-and-look verification, five-lens review, doc sync and roadmap evidence. Use for any feature implementation in this repo.
argument-hint: <module> <task-number>
---

# The slice loop

One roadmap task = one slice. Work that is not a roadmap task does not exist yet — run
`/roadmap <module>` first.

## 1. Load context — this recipe, nothing more

Read in this order and STOP. Total should land ~22–27k tokens. A full-corpus read is a
defect; anything you needed that is missing from this list is a specs-extraction gap to
fix in the module's `specs/`, not a licence to read the world.

1. The task row + module rulings in `docs/modules/<module>.md`.
2. `docs/modules/<module>/specs/<screen>.md` for each screen in scope.
3. `docs/modules/<module>/specs/d-decisions.md` and the `docs/15` rows it cites.
4. `docs/04-data-model.md` — **only** the section this module owns.
5. If UI: the relevant `docs/10` sections and the mockup files named in the task
   (`design/mockups/<Name>.dc.html`).

Per-package `CLAUDE.md` files and `.claude/rules/*` load themselves as you touch files.

## 2. Plan before editing

You start in plan mode. Produce a plan that answers:
- **Reuse first:** what already exists? Search the component indexes (`packages/ui`,
  `apps/mobile/src/ui`), `packages/contracts`, existing services and ports. Creating what
  exists is a defect (Law 5).
- **Architecture:** does this need a new pattern? If yes → STOP, write an ADR first (Law 2).
- **Risks and edge cases:** empty/error/offline, double-submit, stale data, cross-tenant,
  absurd inputs, realistic volume.
- **Scope:** complete but minimal — no gold-plating, no dropped acceptance criteria.

Get the plan approved before you edit.

## 3. Contract diff FIRST

If the API surface changes at all, run `/contract-change` before writing implementation.
The contract diff is the API review surface (Law 3).

## 4. Migration — this module's tables only

If schema changes, run `/migration`. Tables outside this module are Law 9 violations:
stop and ask.

## 5. Implement web + RN in the same slice

Law 7. Same contract, both platforms, one slice. Wire the new surface into the flows that
reach it — never orphan a screen. Extend existing systems rather than adding parallel ones.
Files ≲450 lines. Comments only for constraints the code cannot express.

## 6. Gates

```bash
pnpm lint && pnpm boundaries && pnpm turbo typecheck && pnpm turbo test && pnpm turbo build
```

All green before you proceed. Never weaken a gate config to pass it.

## 7. Verify by running it

Run `/verify-app`. Green gates never prove UI work — open it and look. Capture the
evidence you will paste into the roadmap row.

## 8. Five-lens review

Run `/lenses`. Resolve every critical finding before continuing.

## 9. Sync the documentation

Run `/doc-sync`. Same commit, always (Law 8).

## 10. Roadmap evidence

Update the task row to **VERIFIED** with concrete evidence (what you ran, on what surface,
what you saw). A VERIFIED row with an empty Evidence cell fails CI.

## 11. Ship

Run `/pr`.

## Stop-and-ask triggers

Requirement uncertainty · an unresolved conflict between layers · anything billable or
external-account-shaped · schema/API outside this module · any new pattern · a
product-shaped finding (record it in the roadmap / docs/13 / docs/15 first).
```

- [ ] **Step 3: Write `.claude/skills/roadmap/SKILL.md`**

```markdown
---
name: roadmap
description: Start a module — extract per-screen specs from its mockups and D-decisions, then author its roadmap from the template. Run this before any implementation begins on a module that has no roadmap.
argument-hint: <module-name>
---

# Module kickoff

A module's roadmap is its ONLY task list (Law 9 scoping, docs/17 §3). It is authored
BEFORE implementation and kept live.

## Task 0 — specs extraction (mandatory, do this first)

This is both the context diet and the UX↔backend drift firewall: it converts 100KB+ of
mockup HTML and the external product spec into per-screen specs of a few thousand tokens
each, and it becomes the reviewable contract the ux-lens agent checks implementations
against. Model it on `docs/modules/auth-tenancy/specs/` — the pattern that dropped
per-task doc load from ~65–80k to ~22–27k tokens.

Produce `docs/modules/<module>/specs/`:

- **One file per screen**, named for its mockup. Each contains: layout, **verbatim copy**
  (never paraphrase mockup strings), component map (which `packages/ui` component renders
  what), the screen's state machine, all four states (loading/empty/error/offline), and an
  explicit CONFLICT list where the mockup contradicts itself or the design system.
- **`d-decisions.md`** — every D-decision this module touches, quoted verbatim from
  `docs/product/product-journey.md`, each annotated with its `docs/15` status
  (HONORED / SUPERSEDED / PARTIAL) and the implication for this module. Superseded
  decisions are marked dead so nobody implements them.

Demo-only mockup strings ("Demo — enter…", "Restart demo") never ship — call them out.

## Then author the roadmap

Copy `docs/modules/_template.md` to `docs/modules/<module>.md` and fill:

1. **Scope** — one paragraph plus explicit NON-goals.
2. **Traceability header** — D-decisions, mockup filenames, `docs/04` sections owned,
   contracts to add, jobs/ports with idempotency keys.
3. **Forward-compat register check** — read `docs/modules/forward-compat.md` and restate
   this module's row: what it must build in NOW so later modules don't need a refactor.
4. **UX gap register** — check `docs/13`, claim the rows this module will design.
5. **Task table** — every task for backend + web + mobile + UX + schema + jobs, scoped to
   this module only. Status ∈ `todo` · `in-progress` · `blocked(reason)` · `VERIFIED`.
   Never "done" without evidence. Tasks with a mobile surface ship web+RN together (Law 7).
6. **Module rulings** — five-lens calls the owner may veto, recorded as you make them.

## Then stop

The owner reviews the roadmap before implementation opens. That review is the scope gate.
Update `docs/modules/README.md` with the module's status in the same commit.
```

- [ ] **Step 4: Verify both skills parse**

```bash
node -e "
const fs=require('fs');
for (const s of ['slice','roadmap']) {
  const p='.claude/skills/'+s+'/SKILL.md';
  const t=fs.readFileSync(p,'utf8');
  const m=t.match(/^---\n([\s\S]*?)\n---\n/);
  if(!m) throw new Error(p+': missing frontmatter');
  const name=m[1].match(/^name:\s*(.+)$/m), desc=m[1].match(/^description:\s*(.+)$/m);
  if(!name||!desc) throw new Error(p+': name and description are required');
  if(name[1].trim()!==s) throw new Error(p+': name must equal directory name');
  console.log(p, '->', '/'+name[1].trim(), '|', desc[1].slice(0,60)+'...');
}"
wc -l .claude/skills/*/SKILL.md
```

Expected: both print their invocation name and description prefix. Each SKILL.md under 500 lines (these are ~80 and ~55).

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/slice .claude/skills/roadmap
git commit -m "$(cat <<'EOF'
feat(harness): /slice and /roadmap skills — the 13-step prose loop becomes on-demand

VERIFIED: both SKILL.md files parse with matching name/description frontmatter.

/slice carries the context-loading recipe (~22-27k tokens, full-corpus reads prohibited)
and the contract-first → lockstep → gates → verify → lenses → doc-sync → evidence order.
/roadmap makes the auth-tenancy specs-extraction pattern mandatory task 0 of every module.
Their bodies cost nothing until invoked; only the ~30-token descriptions stay resident.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Skills — `/contract-change`, `/migration`, `/verify-app`

**Files:**
- Create: `.claude/skills/contract-change/SKILL.md`
- Create: `.claude/skills/migration/SKILL.md`
- Create: `.claude/skills/verify-app/SKILL.md`

**Interfaces:**
- Consumes: `.claude/rules/contracts.md` and `.claude/rules/db-schema.md` (Task 7) name these skills
- Produces: `/contract-change` invokes the enum-parity invariant and `oasdiff` built in Tasks 20 and 25; `/migration` invokes the table-tenancy scan built in Task 21. Write the skills now describing the target commands; Phase 3 makes those commands real.

- [ ] **Step 1: Confirm the commands these skills will call**

```bash
grep -n '"openapi"' packages/contracts/package.json
grep -n '"migrate"' packages/db/package.json
cat .claude/launch.json
```

Expected: the `openapi` and `migrate` scripts exist, and `launch.json` declares the web dev server on port 3000. These are the real commands the skills reference.

- [ ] **Step 2: Write `.claude/skills/contract-change/SKILL.md`**

```markdown
---
name: contract-change
description: Change the API contract correctly — re-emit OpenAPI, check enum parity against the database, sweep every typed client, and diff for breaking changes. Use whenever packages/contracts is edited.
---

# Changing the contract

The contract diff is the API review surface (Law 3). It lands BEFORE implementation.

## 1. Edit the contract

- One `z.enum` per business set, exported with its inferred type. Consumers import the
  type; nobody re-declares the values (Law 4).
- `tenant_id` never appears in a request body.
- Money is a 2-dp decimal string.
- Every non-2xx uses the canonical envelope; a route declaring a NON-base error code
  requires `ContractException` with that literal on the server side.
- Protocol constants clients need are exported from here.

## 2. Re-emit the OpenAPI surface

```bash
pnpm --filter @heliogrid/contracts openapi
git diff --stat packages/contracts/openapi/openapi.json
```

The committed `openapi.json` must be regenerated in the same commit — CI fails on a stale copy.

## 3. Enum parity

If you added or changed any `z.enum` that the database also stores as a `pgEnum`, the two
must match value-for-value. The database side is a NEW migration (`/migration`) — never an
edit to an applied one. Then:

```bash
pnpm turbo test --filter=@heliogrid/invariants
```

The enum-parity invariant compares live `pg_enum` values against the contract schemas and
fails on any mismatch. A value in one and not the other is a silent production defect:
rows the API can never return, or API values the database rejects at insert.

## 4. Sweep the typed clients

```bash
pnpm turbo typecheck
```

Because web and mobile consume the ts-rest contract, a shape change surfaces as a compile
error at every call site. If a call site did NOT break where you expected it to, that site
is hand-rolling HTTP — fix it to use the typed client (`apps/web/lib/api-client.ts`,
`apps/mobile/src/data/api-client.ts`). Hand-rolled fetch is banned by dependency-cruiser.

Check `Record<TheEnum, …>` maps too: adding an enum value must break every exhaustive map
that renders it. If nothing broke, the map is not exhaustive — make it so.

## 5. Breaking-change check

```bash
node scripts/check-openapi-breaking.mjs
```

Fails on a breaking change against `main`. A genuinely intended break needs an owner
ruling recorded in the module roadmap before it merges.

## 6. Commit the contract diff on its own where possible

A reviewable contract commit separate from implementation makes the API review real.
```

- [ ] **Step 3: Write `.claude/skills/migration/SKILL.md`**

```markdown
---
name: migration
description: Author a database migration correctly — append-only file, tenant_id plus RLS policy and grants, enum parity with contracts, applied and verified against a real database. Use whenever schema changes.
---

# Authoring a migration

## Non-negotiables

- **Append-only.** Never edit an applied migration; the runner is sha256-locked and will
  refuse to run. A PreToolUse hook blocks the edit outright. Add a new numbered file.
- **This module's tables only** (Law 9). `docs/04` is frozen design, not a build order.
  A table belonging to a module that has not started is a violation — stop and ask.

## 1. Create the file

`packages/db/migrations/<NNNN>_<snake_case_purpose>.sql`, numbered one above the highest
existing file. Check first:

```bash
ls packages/db/migrations/
```

## 2. Every tenant-owned table needs all four

1. A `tenant_id` column.
2. A composite index leading with `tenant_id`.
3. An RLS policy for `app_user` checking `app.tenant_id`, fail-closed via
   `current_setting('app.tenant_id', true)` — NULL context yields zero rows.
4. Explicit grants. There are no default privileges, so a forgotten grant fails closed.

A genuinely global table (no tenant) goes on the allowlist in
`tests/invariants/src/table-tenancy-scan.ts` **with a one-line justification** in the same
commit. There is no third option — the scan fails on any unlisted, tenant-less table.

Append-only ledgers get no UPDATE or DELETE grants.

## 3. Mirror the Drizzle schema

Update `packages/db/src/schema/*.ts` to match. If you touched a `pgEnum`, the contracts
`z.enum` changes in the same slice — run `/contract-change`.

## 4. Apply and verify

```bash
pnpm --filter @heliogrid/db migrate          # fresh apply
pnpm --filter @heliogrid/db migrate          # idempotent — must skip cleanly
pnpm turbo test --filter=@heliogrid/invariants
```

All three must pass. The invariants prove cross-tenant reads see zero rows, cross-tenant
writes fail, missing tenant context fails closed, ledgers reject UPDATE, the new table
carries `tenant_id` or is justified on the allowlist, and enums match the contracts.

## 5. Document

Add the table to `docs/04-data-model.md` if it is not already in the frozen design, and
note the migration in the module roadmap row. Same commit (Law 8).
```

- [ ] **Step 4: Write `.claude/skills/verify-app/SKILL.md`**

```markdown
---
name: verify-app
description: Run the app and look at it — web in the browser plus iOS and Android simulators, walking all four states, 375px, Hindi and keyboard focus, capturing evidence for the roadmap row. Use before marking any UI work VERIFIED.
---

# Run-and-look verification

**Green gates never prove UI work.** A slice that was never opened was never verified.

## Web

Start the dev server through the preview tooling (never a bare shell command):
`.claude/launch.json` declares `@heliogrid/web` on port 3000.

Then walk the surface and confirm:

- **375px and 1440px** both work. 375 is the field reality, not an afterthought.
- **All four states**: loading, empty, error, offline. Each is part of done, not a follow-up.
- **Keyboard and focus**: tab order is sane, focus is visible (accent `#5A4BFF`), no trap.
- **Hindi renders** without clipping — switch the locale and look. Devanagari needs the
  font chain and 20–30% more width than English.
- **Touch targets ≥44px**; no meaning conveyed by hover alone.
- **Numbers carry provenance** (measured / derived / estimated / assumed) and money never
  renders while stale.
- Console and network are clean — check for errors and failed requests.

## Mobile — BOTH simulators

Law 7 means both platforms in the same slice. Attach the simulator panel first, then build
and launch, then drive the same checklist as above on iOS **and** Android. RN-specific
traps to look for: timers suspended while backgrounded, keyboard covering inputs, and
Devanagari run-splitting in mixed-script text.

## API and worker

`curl` the endpoints and read the logs. Confirm the error envelope shape on a failure path,
not just the happy path.

## Capture evidence

The roadmap Evidence cell needs specifics, not adjectives. Good: "browser 375+1440 happy /
wrong-code / send-error paths; iPhone 16 relaunch restores session; Pixel 8 fresh user
passes; curl 409 returns ALREADY_ONBOARDED". Bad: "verified working".

Screenshots for visual changes; curl output for API changes; log excerpts for worker changes.
```

- [ ] **Step 5: Verify all three parse and names match directories**

```bash
node -e "
const fs=require('fs');
for (const s of ['contract-change','migration','verify-app']) {
  const p='.claude/skills/'+s+'/SKILL.md';
  const m=fs.readFileSync(p,'utf8').match(/^---\n([\s\S]*?)\n---\n/);
  if(!m) throw new Error(p+': missing frontmatter');
  const name=(m[1].match(/^name:\s*(.+)$/m)||[])[1];
  const desc=(m[1].match(/^description:\s*(.+)$/m)||[])[1];
  if(name!==s) throw new Error(p+': name \"'+name+'\" must equal directory name');
  if(!desc) throw new Error(p+': description required');
  console.log('/'+name, '('+desc.length+' char description)');
}"
```

Expected: three lines, one per skill, each with a description under 1024 characters.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/contract-change .claude/skills/migration .claude/skills/verify-app
git commit -m "$(cat <<'EOF'
feat(harness): /contract-change, /migration and /verify-app skills

VERIFIED: all three parse; skill name matches directory name in each.

These are the procedures the path-scoped rules point into. /contract-change and
/migration reference the enum-parity and table-tenancy invariants and the openapi
breaking-change check that Phase 3 builds — the skills describe the target commands so
Phase 3 has an explicit contract to satisfy.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Skills — `/lenses`, `/doc-sync`, `/pr`

**Files:**
- Create: `.claude/skills/lenses/SKILL.md`
- Create: `.claude/skills/doc-sync/SKILL.md`
- Create: `.claude/skills/pr/SKILL.md`

**Interfaces:**
- Consumes: `/slice` (Task 8) calls all three
- Produces: `/lenses` dispatches the three subagents created in Task 11 by name (`ux-lens`, `epc-lens`, `qa-breaker`); `/doc-sync` calls `scripts/check-doc-anchors.mjs` built in Task 13; `/pr` uses `.github/pull_request_template.md` created in Task 29

- [ ] **Step 1: Confirm the bundled review skill exists to delegate to**

The senior-engineer lens delegates to the bundled `/code-review` skill rather than a
bespoke prompt. Confirm it is available in this session's skill list before writing the
orchestration that depends on it. If it is not available, `/lenses` runs that lens inline
with the same checklist instead — note which applies.

- [ ] **Step 2: Write `.claude/skills/lenses/SKILL.md`**

```markdown
---
name: lenses
description: Review a slice through five independent lenses — senior engineer, UX master, solar-EPC domain expert, product owner, and QA trying to break it. Use before marking any slice complete.
---

# The Five Lenses

Every implementation is judged through all five, concretely — not as role-play but as
questions that must each have a defensible answer. **A lens that reports no findings must
state WHY it found nothing.** Silence is not a pass.

## Run the three specialist lenses in parallel

Dispatch these subagents concurrently over the slice diff (`git diff main...HEAD`):

- **ux-lens** — mockup fidelity, design-system adherence, states, 375px, Hindi expansion,
  motion, accessibility.
- **epc-lens** — solar domain semantics, Indian market rules, provenance, money law.
- **qa-breaker** — actively tries to break it.

Give each the module name, the task number, the diff, and the paths to the module's
`specs/` files so it reviews against the spec rather than its own taste.

## Senior-engineer lens

Run `/code-review` over the slice diff. Looking for: simplest correct extension of what
exists · right layer · no duplication · no hidden coupling · no cleverness · failure modes
handled · performance and scalability · security · naming and readability · dead code ·
would a reviewer approve this diff without a verbal explanation?

## Product-owner lens — you run this one yourself

- Does the slice serve the D-decision its roadmap row traces to?
- Is scope complete-but-minimal: no gold-plating, no dropped acceptance criteria?
- Would the owner recognise their requirement in the running app?
- Did anything product-shaped get discovered and silently worked around? If so it belongs
  in the roadmap rulings / `docs/13` / `docs/15` BEFORE this ships.

## Resolve

Every critical finding is fixed before the slice is complete. Findings you consciously
decline get a recorded reason in the roadmap. Summarise per-lens findings for the PR body.
```

- [ ] **Step 3: Write `.claude/skills/doc-sync/SKILL.md`**

```markdown
---
name: doc-sync
description: Keep documentation synchronized with the change in the same commit — update invalidated docs, record UX gaps and rulings, and verify every cross-reference still resolves. Use before completing any slice.
---

# Documentation sync (Law 8)

Docs are load-bearing for other agents. Implementation must never become the hidden source
of truth. A change that invalidates a doc updates that doc in the SAME commit.

## 1. What did this diff invalidate?

Walk the diff and ask, for each change:

- Did a **schema** change? → `docs/04-data-model.md` section for this module.
- Did a **contract** change? → the module roadmap's traceability header; `docs/07` if a
  port shape moved.
- Did **architecture** change? → `docs/02`; a genuinely new pattern needed an ADR before
  the code (Law 2) — if you are only noticing now, stop and write it.
- Did the **design system** gain a ruling? → `docs/10`.
- Did a **landmine** bite you (something that cost real debugging time)? → the owning
  package's `CLAUDE.md` Landmines section, **date-stamped**. This is mandatory on first
  discovery, not optional.
- Did you design a surface the **mockups don't cover**? → append a row to
  `docs/13-ux-gap-register.md`.
- Did you make a **product-shaped call** the owner may want to veto? → module rulings
  section of the roadmap.

## 2. Never leave a dangling pointer

```bash
node scripts/check-doc-anchors.mjs
```

Every `docs/NN §M`, relative link and cross-reference must resolve to a real file and
heading. This is the gate that exists because twelve files once cited constitution
sections that were never committed.

## 3. Update the roadmap row

Status → VERIFIED with concrete evidence. Update `docs/modules/README.md` if the module's
overall status changed.

## 4. Commit together

Docs and code in one commit. A follow-up docs commit is a Law 8 violation — the window
between them is exactly when the next agent reads the stale version.
```

- [ ] **Step 4: Write `.claude/skills/pr/SKILL.md`**

```markdown
---
name: pr
description: Branch, commit and pull-request conventions for a completed slice. Invoke only when the user explicitly asks to commit, branch or raise a PR.
disable-model-invocation: true
---

# Shipping a slice

**Git is manual.** Nothing in this skill runs on your own initiative. Commit when the user
says commit. Create a branch or a PR only when the user says so, in those words. Never
push, never run `gh pr create`, never open a PR because a slice looks finished — the user
may prefer to do it themselves, and an unasked-for PR is noise they have to clean up.

## Branch (when asked to create one)

`mod/<module>-t<NN>-<slug>` for module work — e.g. `mod/auth-tenancy-t03-signup`.
Otherwise `fix/<slug>`, `docs/<slug>`, `chore/<slug>`. Main stays releasable.

Never commit directly to main. Never force-push main (a hook blocks it).

## Commits (when asked to commit)

Small and complete. **The message records what was VERIFIED, not what was written:**

```
auth-tenancy t3: signup screen web+RN VERIFIED — browser 375/1440, both sims, curl
```

Call out dependency additions explicitly — a new dep is a decision, not an implementation
detail. Docs travel in the same commit as the code that invalidated them.

## Before handing work over

```bash
pnpm verify
```

All green. If you could not run something, say so plainly rather than implying it passed.

## PR body (when asked to raise one)

Fill `.github/pull_request_template.md` honestly and briefly: the roadmap task, what
changed, the DoD checklist, the evidence you captured, and known limitations. Skip
sections that do not apply — write "no contract change", not a paragraph explaining why
there is no contract change.

## Changelog

The module roadmap IS the changelog: status plus evidence per task. There is no separate
changelog file to update.
```

- [ ] **Step 5: Verify all three parse**

```bash
node -e "
const fs=require('fs');
for (const s of ['lenses','doc-sync','pr']) {
  const p='.claude/skills/'+s+'/SKILL.md';
  const m=fs.readFileSync(p,'utf8').match(/^---\n([\s\S]*?)\n---\n/);
  const name=(m[1].match(/^name:\s*(.+)$/m)||[])[1];
  if(name!==s) throw new Error(p+': name mismatch');
  console.log('/'+name+' ok');
}
console.log('all eight skills present:', fs.readdirSync('.claude/skills').sort().join(', '));"
```

Expected: three `ok` lines, then all eight skill directories listed: `contract-change, doc-sync, lenses, migration, pr, roadmap, slice, verify-app`.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/lenses .claude/skills/doc-sync .claude/skills/pr
git commit -m "$(cat <<'EOF'
feat(harness): /lenses, /doc-sync and /pr skills — all eight skills now present

VERIFIED: all three parse with matching names; .claude/skills/ contains the full set
(contract-change, doc-sync, lenses, migration, pr, roadmap, slice, verify-app).

/lenses preserves the Five Lenses discipline that demonstrably worked (a lens with no
findings must say why) while delegating the senior-engineer lens to the bundled
/code-review rather than maintaining a fifth bespoke prompt that would drift.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: The three lens subagents

**Files:**
- Create: `.claude/agents/ux-lens.md`
- Create: `.claude/agents/epc-lens.md`
- Create: `.claude/agents/qa-breaker.md`

**Interfaces:**
- Consumes: `/lenses` (Task 10) dispatches these by name
- Produces: nothing downstream depends on these beyond `/lenses`

Subagents are **flat markdown files** at `.claude/agents/<name>.md` (not directories).
Frontmatter carries `name`, `description`, `tools`, `model`; the body is the system prompt.

- [ ] **Step 1: Confirm the directory shape**

```bash
mkdir -p .claude/agents && ls .claude/agents
```

Expected: empty. Files go directly in here — `ux-lens.md`, not `ux-lens/AGENT.md`.

- [ ] **Step 2: Write `.claude/agents/ux-lens.md`**

```markdown
---
name: ux-lens
description: Reviews a slice for mockup fidelity, design-system adherence, states, responsiveness, Hindi rendering and accessibility. Read-only.
tools: Read, Grep, Glob, Bash
---

You are a UX master reviewing an implementation against its specification. You are
read-only: you report findings, you never edit.

Your sources of truth, in order:
1. The module's `docs/modules/<module>/specs/<screen>.md` — layout, verbatim copy,
   component map, state machine, CONFLICT list.
2. The mockup files named in the roadmap task (`design/mockups/<Name>.dc.html`).
3. `docs/10-i18n-and-design-system.md` — the design-system law and interaction contracts.

Check every one of these and report per item:

- **Copy fidelity.** Strings match the spec verbatim. Paraphrasing is a finding. Demo-only
  mockup strings ("Demo — enter…", "Restart demo") must never ship.
- **Component vocabulary.** Screens import only from the component indexes (`packages/ui`,
  `apps/mobile/src/ui`). Raw styling in a screen is a violation. A surface the mockups do
  not cover must be COMPOSED from existing components — new visuals invented in a screen
  are a finding, and the composition decision should be logged as a ruling.
- **Tokens only.** No raw hex, no arbitrary px, no inline style.
- **Colour roles.** Primary actions near-black `#0A0A0B`. Accent `#5A4BFF` only for focus,
  links, selection, active tab, control fills — never a button fill. Iridescence is
  atmosphere, never information.
- **All four states** present and designed: loading, empty, error, offline.
- **375px** works, not just desktop. Touch targets ≥44px. No hover-only meaning.
- **Hindi**: does the layout survive 20–30% text expansion? Devanagari font chain correct?
- **Focus and keyboard**: visible focus, sane tab order, no traps.
- **Motion** respects reduced-motion preferences.
- **Web/RN parity**: the same slice on both platforms, same component API, same behaviour.

Where the spec is silent or self-contradictory, say so explicitly and name the CONFLICT —
do not invent a resolution and do not let the implementation quietly pick one.

If you find nothing, state specifically what you checked and why each check passed. Silence
is not an acceptable report.
```

- [ ] **Step 3: Write `.claude/agents/epc-lens.md`**

```markdown
---
name: epc-lens
description: Reviews a slice for solar-EPC domain correctness, Indian market rules, provenance and money law. Read-only.
tools: Read, Grep, Glob, Bash
---

You are a solar EPC domain expert reviewing an implementation for semantic correctness.
You are read-only: you report findings, you never edit.

Check the domain semantics, not the code style:

- **Units.** kWp (panel capacity) vs kW (power) vs kWh (energy) used correctly and never
  interchanged. DC vs AC sides distinguished. Unit strings are never translated.
- **Indian market rules.** DISCOM behaviour, PM Surya Ghar subsidy mechanics, GST
  treatment, net-metering assumptions. Are these correct, and are they configurable per
  market rather than hard-coded?
- **Money law** (non-negotiable product law):
  - Every user-visible number carries a provenance tier: measured / derived / estimated /
    assumed. A bare number is a finding.
  - Money never renders while stale — design changed and quote not recomputed means the
    figure must read as provisional.
  - One money path: BOM ↔ proposal ↔ tranches ↔ project payments reconcile to the paisa.
  - Sent proposals keep their original prices; price-book updates create new versions.
  - ₹ uses Indian grouping (lakh/crore) in every locale.
  - Read and export always work regardless of billing state.
- **Engineering honesty.** Structural adequacy is NEVER computed — only an engineer's
  sign-off is recorded (who and when), and the disclaimer travels with every
  structure-bearing output. Any computed structural claim is a critical finding.
- **Server-assigned identifiers.** Proposal numbers, project numbers and similar business
  identifiers come from the server, never the client.
- **Field reality.** Surveyors work outdoors, in sunlight glare, wearing gloves, often
  offline, on a 375px phone. Does this survive that? Small targets, thin type, and
  online-only flows are findings.

Verify product claims against `docs/product/product-journey.md` (the D-decision census)
read through `docs/15-spec-resolutions.md` — the overlay that marks superseded decisions.
Never cite a D-decision without checking its docs/15 status first.

If you find nothing, state specifically what you checked and why each check passed.
```

- [ ] **Step 4: Write `.claude/agents/qa-breaker.md`**

```markdown
---
name: qa-breaker
description: Adversarial QA — actively tries to break a slice before it is called done. Read-only.
tools: Read, Grep, Glob, Bash
---

You are QA and your job is to BREAK this slice. A slice that was never attacked was never
verified. You are read-only: you report how it breaks, you never fix it.

Attack systematically:

- **Empty and error paths.** What renders with zero rows? What renders when the request
  fails? When it times out? When the response is a 500 with an unexpected body shape?
- **Offline.** Airplane mode mid-flow. Connection drops between send and verify. Request
  succeeds on the server but the response never arrives.
- **Double-submit.** Rapid double tap. Submit while a request is in flight. Back button
  then resubmit. Is there an in-flight guard, and is it per-action or global?
- **Stale data.** Two tabs, two devices. Data changed underneath. Cached response after a
  mutation. A design changed but the quote not recomputed — does money show as provisional?
- **Cross-tenant probes.** Can any identifier from tenant B be used from a tenant A
  session? What does the API return — a 404 (correct: never reveal existence across
  tenants) or a 403 that leaks existence?
- **Authorization.** Every role against every action. What does a `surveyor` see on an
  owner-only surface? Is the guard deny-by-default?
- **Absurd inputs.** 0, negative numbers, 10⁶ kW, emoji names, 40-character Hindi labels,
  RTL characters, SQL-shaped strings, 500-character free text, leading/trailing whitespace,
  a phone number with the wrong country code.
- **Realistic volume.** 200 leads, a 40-line BOM, 50 team members. Does the list paginate,
  virtualize, or freeze?
- **Timers and lifecycle.** Backgrounded app (RN timers suspend — is the countdown
  wall-clock based?). Screen rotation. Locale switched mid-flow. Session expiring mid-flow.

For every break you find, report: the exact steps, what you expected, what happened, and
your severity assessment. For each attack category you ran that found nothing, say so
explicitly — a category not listed in your report reads as a category not attempted.
```

- [ ] **Step 5: Verify the three agents parse and are flat files**

```bash
node -e "
const fs=require('fs');
const files=fs.readdirSync('.claude/agents');
for (const f of files) {
  if (!f.endsWith('.md')) throw new Error('agents must be flat .md files, found: '+f);
  const m=fs.readFileSync('.claude/agents/'+f,'utf8').match(/^---\n([\s\S]*?)\n---\n/);
  if(!m) throw new Error(f+': missing frontmatter');
  const name=(m[1].match(/^name:\s*(.+)$/m)||[])[1];
  const tools=(m[1].match(/^tools:\s*(.+)$/m)||[])[1];
  if(name+'.md'!==f) throw new Error(f+': name must match filename');
  if(/Edit|Write/.test(tools)) throw new Error(f+': lens agents must be read-only');
  console.log(name, '| tools:', tools);
}
console.log('three read-only lens agents registered');"
```

Expected: three lines listing `Read, Grep, Glob, Bash` for each, then the confirmation. The check enforces read-only — a reviewer that can edit stops being a reviewer.

- [ ] **Step 6: Commit**

```bash
git add .claude/agents
git commit -m "$(cat <<'EOF'
feat(harness): three read-only lens subagents (ux, epc-domain, qa-breaker)

VERIFIED: all three are flat .claude/agents/<name>.md files with matching name
frontmatter; the check asserts none of them can Edit or Write — a reviewer that can edit
stops being a reviewer.

Each lens must report what it checked even when it finds nothing; silence is not a pass.
The senior-engineer lens stays delegated to bundled /code-review and the product-owner
lens is run by /lenses itself, so only three bespoke prompts exist to drift.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Verify the harness end to end

**Files:**
- Modify: `docs/foundation-redesign.md` (record the measured always-on budget)

**Interfaces:**
- Consumes: everything from Tasks 5–11
- Produces: a measured context budget replacing the estimate — Phase 2's docs work assumes the harness is live

This task has no new implementation; it is the Phase 1 acceptance gate.

- [ ] **Step 1: Confirm the complete file inventory**

```bash
find .claude CLAUDE.md AGENTS.md -type f | sort
```

Expected exactly: `AGENTS.md`, `CLAUDE.md`, `.claude/agents/{epc-lens,qa-breaker,ux-lens}.md`, `.claude/hooks/{bash-guard,edit-checks,write-guard}.sh`, `.claude/launch.json`, `.claude/rules/{00-laws,contracts,db-schema,i18n,ui-adherence}.md`, `.claude/settings.json`, and eight `.claude/skills/*/SKILL.md`.

- [ ] **Step 2: Measure the always-on context budget**

Start a **fresh** Claude Code session in the repo and run `/context`.

Record the reported token cost of: the system prompt, `CLAUDE.md`, `.claude/rules/00-laws.md`, skill descriptions, and the MEMORY.md index.

Expected: the project-instruction portion (CLAUDE.md + 00-laws + skill descriptions) lands near ~1.3k tokens. The four path-scoped rules must **not** appear — they load only when matching files are read. If they do appear, their `paths:` frontmatter is malformed; fix it before proceeding.

- [ ] **Step 3: Verify a path-scoped rule loads on demand**

In that same session, read a contracts file:

```bash
sed -n '1,5p' packages/contracts/src/common.ts
```

Then run `/context` again. Expected: `.claude/rules/contracts.md` now appears in the loaded set. This proves progressive disclosure works — the mechanism the old `.claude/rules/` layer lacked entirely.

- [ ] **Step 4: Verify every blocking hook fires in a real session**

Ask the session to run `sed -i '' 's/a/b/' README.md`. Expected: blocked, with the bash-guard message about Edit/Write.

Ask the session to edit `packages/db/migrations/0001_foundation.sql`. Expected: blocked, with the append-only message.

Ask the session to create `apps/api/src/modules/auth/auth.service.spec.ts`. Expected: blocked, with the no-test-files message pointing at `/verify-app`.

Ask the session to run `pnpm turbo typecheck`. Expected: runs without a permission prompt (it is on the allow list).

- [ ] **Step 5: Dry-run `/slice` on a docs-only task**

Invoke `/slice` and confirm it loads the context recipe, starts in plan mode (per
`defaultMode: "plan"`), and does not attempt a full-corpus read. You are checking the
skill's shape, not implementing anything — abandon the plan afterwards.

- [ ] **Step 6: Record the measured budget**

In `docs/foundation-redesign.md`, replace:

```
**Always-on budget (~1.3k tokens, estimated — validate with `/context` after Phase 1):**
```

with the measured figure, keeping the same sentence shape:

```
**Always-on budget (MEASURED <N>k tokens via /context, 2026-07-29):**
```

Substitute the real number from Step 2. If it exceeds 2k, cut `CLAUDE.md` before moving on —
the budget is the point of the redesign, and a budget that is not enforced immediately is a
budget that never will be.

- [ ] **Step 7: Commit**

```bash
git add docs/foundation-redesign.md
git commit -m "$(cat <<'EOF'
docs: record the measured always-on context budget (Phase 1 acceptance)

VERIFIED in a fresh session: /context shows CLAUDE.md + 00-laws + skill descriptions
only; the four path-scoped rules are absent until a matching file is read, then
contracts.md appears on demand. bash-guard blocks `sed -i`, write-guard blocks an edit to
0001_foundation.sql and the creation of a .spec.ts file, `pnpm turbo typecheck` runs
without a prompt. /slice loads its recipe and starts in plan mode.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

**PHASE 1 GATE.** The harness is live and self-protecting. From here on, every task in this plan runs under the hooks it just installed.

---

# PHASE 2 — Documentation restructure

**Why this order:** Task 13 builds the anchor checker first, so every subsequent doc edit in this phase is mechanically verifiable rather than eyeballed. That inversion is deliberate — F3 (twelve files citing sections that never existed) happened precisely because nothing checked.

---

### Task 13: Doc-anchor integrity checker

**Files:**
- Create: `scripts/check-doc-anchors.mjs`
- Modify: `package.json` (add the `check:anchors` script)

**Interfaces:**
- Consumes: nothing from Phase 1
- Produces: `node scripts/check-doc-anchors.mjs` → exit 0 clean / exit 1 with a list of unresolved references. `/doc-sync` (Task 10) calls it; Task 29 wires it into CI. **Every remaining Phase 2 task uses it as its test.**

- [ ] **Step 1: Write the failing test — confirm the corpus currently has dangling references**

```bash
grep -rn 'CLAUDE\.md §' docs --include=*.md | head -5
grep -rc 'CLAUDE\.md §' docs/17-engineering-governance.md
```

Expected: several hits, including `docs/17` citing `CLAUDE.md §Structure`, `§Layer quick-ref`, `§Slice workflow`, `§Definition of done`, `§Enforcement matrix` — none of which exist in the new `CLAUDE.md` either. The checker must find these.

- [ ] **Step 2: Write the checker**

Create `scripts/check-doc-anchors.mjs`:

```js
#!/usr/bin/env node
/**
 * Doc-anchor integrity gate.
 *
 * Twelve files once cited root-CLAUDE.md sections that were never committed
 * (docs/foundation-redesign.md F3). Nothing detected it because nothing checked.
 * This script makes that class of drift a red build.
 *
 * It verifies three reference shapes across the doc corpus:
 *   1. Relative markdown links            [text](./research/foo.md), [x](../adr/0002-...md)
 *   2. Bare doc-file references           docs/04-data-model.md
 *   3. Section references                 docs/17 §4   ·   CLAUDE.md §Structure
 *
 * Exit 0 = every reference resolves. Exit 1 = a list of what does not.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/** Files whose references we check. */
function collectSources() {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'archive') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.md')) out.push(full);
    }
  };
  walk(join(ROOT, 'docs'));
  for (const f of ['CLAUDE.md', 'AGENTS.md']) {
    const p = join(ROOT, f);
    if (existsSync(p)) out.push(p);
  }
  for (const area of ['apps', 'packages']) {
    const base = join(ROOT, area);
    if (!existsSync(base)) continue;
    for (const pkg of readdirSync(base)) {
      const p = join(base, pkg, 'CLAUDE.md');
      if (existsSync(p)) out.push(p);
    }
  }
  const rules = join(ROOT, '.claude', 'rules');
  if (existsSync(rules)) {
    for (const f of readdirSync(rules)) if (f.endsWith('.md')) out.push(join(rules, f));
  }
  return out;
}

/** Strip fenced code blocks and inline code so examples are not treated as references. */
function stripCode(text) {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

/** Headings of a markdown file, lowercased, for §-anchor resolution. */
const headingCache = new Map();
function headingsOf(file) {
  if (headingCache.has(file)) return headingCache.get(file);
  let hs = [];
  if (existsSync(file)) {
    hs = readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => /^#{1,6}\s/.test(l))
      .map((l) => l.replace(/^#{1,6}\s+/, '').trim().toLowerCase());
  }
  headingCache.set(file, hs);
  return hs;
}

/** Resolve `docs/NN` or `docs/NN-name.md` to a real path. */
function resolveDocsPrefix(numOrName) {
  const docsDir = join(ROOT, 'docs');
  if (numOrName.endsWith('.md')) {
    const direct = join(docsDir, numOrName.replace(/^docs\//, ''));
    return existsSync(direct) ? direct : null;
  }
  const num = numOrName.padStart(2, '0');
  const match = readdirSync(docsDir).find((f) => f.startsWith(`${num}-`) && f.endsWith('.md'));
  return match ? join(docsDir, match) : null;
}

const failures = [];
function fail(file, line, message) {
  failures.push(`${relative(ROOT, file)}:${line}  ${message}`);
}

for (const file of collectSources()) {
  const raw = readFileSync(file, 'utf8');
  const lines = stripCode(raw).split('\n');

  lines.forEach((line, i) => {
    const lineNo = i + 1;

    // 1. Relative markdown links to local files
    for (const m of line.matchAll(/\[[^\]]*\]\((\.{1,2}\/[^)\s#]+|[a-zA-Z0-9_./-]+\.md)(#[^)]*)?\)/g)) {
      const target = m[1];
      if (/^https?:/.test(target)) continue;
      const abs = resolve(dirname(file), target);
      if (!existsSync(abs)) fail(file, lineNo, `broken link → ${target}`);
    }

    // 2. Bare docs/NN-name.md references
    for (const m of line.matchAll(/\bdocs\/([0-9]{2}-[a-z0-9-]+\.md)\b/g)) {
      if (!existsSync(join(ROOT, 'docs', m[1]))) fail(file, lineNo, `missing doc → docs/${m[1]}`);
    }

    // 3a. Section references: docs/NN §M  or  docs/NN-name.md §M
    for (const m of line.matchAll(/\bdocs\/([0-9]{2}(?:-[a-z0-9-]+\.md)?)\s*§\s*([0-9]+(?:\.[0-9]+)?)/g)) {
      const target = resolveDocsPrefix(m[1]);
      if (!target) {
        fail(file, lineNo, `missing doc for section ref → docs/${m[1]} §${m[2]}`);
        continue;
      }
      const section = m[2];
      const found = headingsOf(target).some(
        (h) => h.startsWith(`${section}.`) || h.startsWith(`${section} `) || h.includes(`§${section}`),
      );
      if (!found) fail(file, lineNo, `no §${section} heading in ${relative(ROOT, target)}`);
    }

    // 3b. Section references into CLAUDE.md files by heading NAME
    for (const m of line.matchAll(/\bCLAUDE\.md\s*§\s*([A-Za-z][A-Za-z0-9 -]{2,40}?)(?=[,.;:)\]]|\s{2}|$)/g)) {
      const wanted = m[1].trim().toLowerCase();
      // A per-package CLAUDE.md reference resolves against its own package first,
      // then the root constitution.
      const candidates = [join(dirname(file), 'CLAUDE.md'), join(ROOT, 'CLAUDE.md')];
      const found = candidates.some((c) => headingsOf(c).some((h) => h.includes(wanted)));
      if (!found) fail(file, lineNo, `CLAUDE.md has no section matching "${m[1].trim()}"`);
    }
  });
}

if (failures.length) {
  console.error(`\nDOC ANCHOR FAILURES (${failures.length}):\n`);
  for (const f of failures) console.error('  ' + f);
  console.error(
    '\nEvery cross-reference must resolve. Fix the reference or the target — never leave a pointer to nowhere.\n',
  );
  process.exit(1);
}
console.log('doc anchors OK — every cross-reference resolves');
```

- [ ] **Step 3: Run it to verify it FAILS on the current corpus**

```bash
node scripts/check-doc-anchors.mjs
```

Expected: FAIL (exit 1) listing the `docs/17` phantom `CLAUDE.md §…` references plus any other dangling links. **If it exits 0, the checker is broken** — it must catch the known-bad state before it is trustworthy. Verify at minimum that `docs/17-engineering-governance.md` appears in the failure list.

- [ ] **Step 4: Add the script entry**

In `package.json`, replace:

```json
    "boundaries": "turbo boundaries"
```

with:

```json
    "boundaries": "turbo boundaries",
    "check:anchors": "node scripts/check-doc-anchors.mjs"
```

- [ ] **Step 5: Verify a clean file passes and a deliberate break fails**

```bash
node -e "
const fs=require('fs');
fs.writeFileSync('docs/__anchor_probe.md','See [vision](./00-vision-and-scope.md) and docs/04 §1.\n');
" && pnpm check:anchors 2>&1 | tail -3
```

Expected: the probe alone does not introduce failures (the pre-existing docs/17 ones remain). Now prove a break is caught:

```bash
node -e "
const fs=require('fs');
fs.writeFileSync('docs/__anchor_probe.md','See [ghost](./99-does-not-exist.md).\n');
" && pnpm check:anchors 2>&1 | grep "__anchor_probe"
rm docs/__anchor_probe.md
```

Expected: the grep prints `docs/__anchor_probe.md:1  broken link → ./99-does-not-exist.md`.

- [ ] **Step 6: Commit**

```bash
git add scripts/check-doc-anchors.mjs package.json
git commit -m "$(cat <<'EOF'
feat(gates): doc-anchor integrity checker — the F3 fix

VERIFIED: run against the current corpus it FAILS, correctly naming docs/17's phantom
`CLAUDE.md §Structure/§Layer quick-ref/§Slice workflow/§Definition of done/§Enforcement
matrix` references; a probe file with a broken relative link is caught by path and line;
a probe with valid references is not flagged.

Built BEFORE the rest of the Phase 2 doc work so every subsequent edit has a mechanical
test. The corpus goes green in Task 19 when docs/17 is rebuilt.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Vendor the product truth

**Files:**
- Create: `docs/product/README.md`
- Create: `docs/product/product-journey.md` (vendored from the POC repo)
- Create: `docs/product/studio-census.md` (promoted from `docs/research/phases710.md` §2)
- Modify: `docs/research/phases710.md` (pointer banner)

**Interfaces:**
- Consumes: the anchor checker (Task 13)
- Produces: `docs/product/product-journey.md` — cited by `CLAUDE.md`, `.claude/agents/epc-lens.md`, and the `/roadmap` skill. Until this task lands, those three references dangle.

**Owner decision applied:** the studio census is the promoted in-repo `phases710.md` §2. The POC `phase-10-prompts.md` is never vendored.

- [ ] **Step 1: Confirm the external dependency and the source files**

```bash
ls -la /Volumes/works-space/Solar-App-POC/docs/product-journey.md
wc -l /Volumes/works-space/Solar-App-POC/docs/product-journey.md
grep -n "^## " docs/research/phases710.md | head -10
grep -rn "product-journey" docs --include=*.md | wc -l
```

Expected: the POC file exists at ~1,768 lines; `phases710.md` has a `§2` census section; the corpus references `product-journey` in several places while the file lives in a **different repository**.

- [ ] **Step 2: Vendor the product journey**

```bash
mkdir -p docs/product
cp /Volumes/works-space/Solar-App-POC/docs/product-journey.md docs/product/product-journey.md
```

Then edit `docs/product/product-journey.md`:

1. **Insert this banner as the first lines of the file**, above the existing title:

```markdown
> **VENDORED PRODUCT TRUTH — read only through the `docs/15-spec-resolutions.md` overlay.**
>
> This is the master product specification (D1–D39 census, the nine-stage journey, the
> customer journey C1–C13, roles and permissions). It is the root requirement source for
> Law 6 traceability.
>
> **Roughly 40% of the decision text below is SUPERSEDED.** `docs/15-spec-resolutions.md`
> carries the conformance table (HONORED / SUPERSEDED / PARTIAL) and is the only safe way
> to read the D-decisions — D3, D4, D12, D19, D26, D33 and D38 in particular have all been
> overridden. Never cite a D-decision without checking its docs/15 row first.
>
> Vendored from the POC repository 2026-07-29 so product truth no longer lives outside this
> repo. The mockup-generation prompt library that trailed the original has been removed —
> it is history, not specification, and remains in the POC repo's git history.
```

2. **Delete the trailing prompt-library / arc-nav section** (~the last 190 lines — the
   Claude-Design mockup-generation prompts). Confirm you are cutting the right block: it
   begins where the document stops describing the product and starts describing how the
   mockups were generated.

- [ ] **Step 3: Promote the studio census**

Create `docs/product/studio-census.md` containing the §2 tool census extracted verbatim from `docs/research/phases710.md`, under this header:

```markdown
# Studio tool census — the binding port acceptance gate

> **CANONICAL (owner ruling 2026-07-29).** This census is THE acceptance checklist for the
> 3D Design Studio port (ADR-0017): every tool and every computed output listed here must
> survive the port, refactored to the design system and touch-first. It is a merge gate for
> port PRs, on par with typecheck and lint.
>
> Promoted verbatim from `docs/research/phases710.md` §2, which is now historical. The POC
> repository's `phase-10-prompts.md` is NOT canonical and must not be cited.

<!-- verbatim §2 content from docs/research/phases710.md follows -->
```

- [ ] **Step 4: Point the old census at the new one**

At the top of `docs/research/phases710.md`, insert:

```markdown
> **§2 PROMOTED — see `docs/product/studio-census.md`.** The studio tool census moved out
> of research and became canonical product truth (owner ruling 2026-07-29). This file is
> retained as historical evidence for its other sections and for inbound ADR citations;
> its §2 is a stale copy and must not be cited.
```

- [ ] **Step 5: Write the directory README**

Create `docs/product/README.md`:

```markdown
# docs/product — vendored product truth

The requirement root. Everything here is product specification, not architecture and not
implementation guidance.

| File | What it is | How to read it |
|---|---|---|
| `product-journey.md` | Master spec: D1–D39 census, nine-stage journey, customer journey C1–C13, roles matrix | **Only through `docs/15-spec-resolutions.md`** — ~40% of the D-text is superseded |
| `studio-census.md` | The binding studio-port acceptance gate (ADR-0017) | As a literal checklist; the census never shrinks |

Per-module extractions in `docs/modules/<module>/specs/d-decisions.md` are the intended
per-task access path — they quote the relevant D-decisions verbatim with their docs/15
status already applied, at a fraction of the token cost of reading the master spec.
```

- [ ] **Step 6: Verify anchors and the vendoring**

```bash
wc -l docs/product/product-journey.md docs/product/studio-census.md
grep -c "VENDORED PRODUCT TRUTH" docs/product/product-journey.md
grep -c "phase-10-prompts" docs/product/studio-census.md
pnpm check:anchors 2>&1 | tail -5
```

Expected: the journey is ~190 lines shorter than the POC original and carries the banner; the census names `phase-10-prompts` only in the "not canonical" line; the anchor checker reports the same pre-existing docs/17 failures and **no new ones**.

- [ ] **Step 7: Commit**

```bash
git add docs/product docs/research/phases710.md
git commit -m "$(cat <<'EOF'
docs: vendor product truth — the external-repo dependency ends here

VERIFIED: product-journey.md vendored (~190-line prompt-library tail removed) with the
docs/15-overlay banner; studio-census.md promoted from research/phases710.md §2 per the
owner ruling; phases710.md marked historical. Anchor checker shows no new failures.

Product truth no longer lives in a sibling repository, and the studio-port acceptance
gate now has ONE canonical source instead of two competing ones (foundation-redesign F5).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 15: Extract the N1–N10 interaction law

**Files:**
- Modify: `docs/10-i18n-and-design-system.md` (add the interaction-law section)
- Modify: `docs/research/design.md` (pointer banner)

**Interfaces:**
- Consumes: Task 13's checker
- Produces: an in-repo, non-superseded home for N1–N10 — `docs/13` and `docs/10` already cite these rules by number

- [ ] **Step 1: Confirm the problem — binding law inside a SUPERSEDED file**

```bash
head -20 docs/research/design.md
grep -n "N1\|N10\|hard rules" docs/research/design.md | head -10
grep -rn "N1–N10\|N1-N10\|N3\|N4\|N10" docs/10-i18n-and-design-system.md docs/13-ux-gap-register.md | head -8
```

Expected: `design.md` opens with a SUPERSEDED-FOR-VISUALS banner yet contains the only in-repo definition of the ten hard rules; `docs/10` and `docs/13` cite `N3`, `N4`, `N10` and "N1–N10" **by number without defining them**. An agent told to ignore superseded files cannot resolve those citations.

- [ ] **Step 2: Extract the rules into docs/10**

Read the "10 hard rules" section of `docs/research/design.md` and copy each rule **verbatim** into a new section of `docs/10-i18n-and-design-system.md`, placed immediately after the design-system canon section:

```markdown
## Interaction & accessibility law (N1–N10)

> Promoted verbatim from the POC design brief 2026-07-29. The "Instrument" graphite+brass
> VISUAL identity that accompanied these rules is retired (R19-E) — every visual value now
> comes from `design/ds-source` via `packages/tokens`. **These ten interaction and
> accessibility contracts survive unchanged as product law** and are cited by number
> throughout docs/10 and docs/13.

<!-- N1 … N10, verbatim, one subsection each -->
```

Preserve the original numbering and wording exactly — these are cited by number elsewhere, so renumbering or paraphrasing breaks the citations.

- [ ] **Step 3: Mark the research file as fully superseded**

Replace the banner at the top of `docs/research/design.md` with:

```markdown
> **FULLY SUPERSEDED (2026-07-29) — do not cite.** The visual identity here was retired by
> R19-E; the N1–N10 interaction and accessibility law it contained has been promoted
> verbatim into `docs/10-i18n-and-design-system.md` §Interaction & accessibility law.
> Retained only as historical evidence.
```

- [ ] **Step 4: Verify the rules are now reachable outside a superseded file**

```bash
grep -c "^### N" docs/10-i18n-and-design-system.md
grep -n "Interaction & accessibility law" docs/10-i18n-and-design-system.md
pnpm check:anchors 2>&1 | tail -3
```

Expected: 10 N-rule subsections in docs/10; the section heading exists; no new anchor failures.

- [ ] **Step 5: Commit**

```bash
git add docs/10-i18n-and-design-system.md docs/research/design.md
git commit -m "$(cat <<'EOF'
docs: promote N1-N10 interaction law into docs/10 (verbatim)

VERIFIED: 10 N-rule subsections now live in docs/10; research/design.md is marked fully
superseded and no longer holds binding law.

docs/10 and docs/13 cited N3/N4/N10 and "N1-N10" by number while the only in-repo
definition sat inside a file banner-marked SUPERSEDED — a one-change-one-file violation
and a trap for any agent told to ignore superseded files (foundation-redesign F5).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 16: Authority chain repair

**Files:**
- Create: `docs/archive/README.md`
- Move: `docs/BLUEPRINT.md` → `docs/archive/BLUEPRINT.md`
- Modify: `docs/15-spec-resolutions.md` (absorb the owner directives)
- Modify: `docs/adr/README.md`, `docs/02-system-architecture.md` (re-point authority)
- Modify: `docs/03-tech-stack.md` §14 (S5 telephony correction)
- Modify: `docs/04-data-model.md` (Law 9 banner + header fix)
- Modify: `docs/05-domain-migration.md` (self-citation fix)
- Modify: `docs/13-ux-gap-register.md`, `docs/10-i18n-and-design-system.md` (mockup count)

**Interfaces:**
- Consumes: Task 13's checker
- Produces: a single authority chain — Laws (docs/17) → product truth (docs/product + docs/15) → ADRs + docs/02/03 → module docs. Task 19's rule→mechanism matrix assumes this ordering.

- [ ] **Step 1: Confirm the triple authority claim and the stale facts**

```bash
grep -n "BLUEPRINT" docs/adr/README.md docs/02-system-architecture.md | head -5
grep -n "85 mockups\|85 vendored\|the 85" docs/13-ux-gap-register.md docs/10-i18n-and-design-system.md docs/BLUEPRINT.md
ls design/mockups/*.dc.html | wc -l
grep -n "hosted/ported\|sendDtmf\|1600" docs/03-tech-stack.md | head -5
grep -n "05-domain-migration.md" docs/05-domain-migration.md | head -2
```

Expected: `adr/README` calls BLUEPRINT "top-layer authority" and `docs/02` calls it "binding source", while `docs/17` §4 ranks it third; the "85 mockups" claim appears in three files but the disk has **80**; `docs/03` §14 still describes BYO telephony as hosted/ported with DTMF; `docs/05` cites itself as a binding source.

- [ ] **Step 2: Fold BLUEPRINT's unique content into docs/15**

BLUEPRINT holds two things that exist nowhere else: the numbered owner-directive list and the user-decisions log. Everything else duplicates docs/02, 03, 15 and 16.

Add to `docs/15-spec-resolutions.md` a new section:

```markdown
## Owner directives (absorbed from BLUEPRINT, 2026-07-29)

The ten binding directives from the original planning session, preserved here because
BLUEPRINT is now archived. Where a directive was later amended, the amendment is stated
first and the original is marked SUPERSEDED — the archived file interleaved them, which
let an agent quote stale law from above a correction.
```

Copy the ten directives across. For directive 7 (telephony), lead with the ADR-0019/S5
reality — **BYO is inbound forwarding to the ExoPhone with no outbound CLI porting; DTMF-send
is absent from Exotel AgentStream; the 1600-series is closed to non-BFSI so promotional
outbound uses the 140-series** — and mark the original wording SUPERSEDED beneath it.
Append the user-decisions log as a subsection.

- [ ] **Step 3: Archive BLUEPRINT**

```bash
mkdir -p docs/archive
git mv docs/BLUEPRINT.md docs/archive/BLUEPRINT.md
```

Add a banner at the top of `docs/archive/BLUEPRINT.md`:

```markdown
> **ARCHIVED 2026-07-29 — NOT BINDING.** This was the original planning-session output.
> Its architecture content is duplicated (and kept current) in docs/02, docs/03, docs/16
> and the ADRs; its owner-directive list and user-decisions log moved to docs/15.
> Retained for provenance only. **Do not cite this file.** Its telephony directive in
> particular contains pre-S5 wording that ADR-0019 overturned.
```

Create `docs/archive/README.md`:

```markdown
# docs/archive — historical, never binding

Files here are retained for provenance and for inbound citations that predate their
archiving. **Nothing in this directory is binding.** If you find yourself needing a fact
from here, that fact belongs in a live document — promote it, then cite the live one.

| File | Archived | Superseded by |
|---|---|---|
| `BLUEPRINT.md` | 2026-07-29 | docs/02, docs/03, docs/16, ADRs; directives → docs/15 |
```

- [ ] **Step 4: Re-point the authority headers**

In `docs/adr/README.md`, replace the line naming BLUEPRINT as top-layer authority with:

```markdown
Authority order: the Laws (docs/17) → product truth (docs/product + docs/15 overlay) →
ADRs + docs/02 + docs/03 → module docs. An ADR supersedes any earlier planning prose.
```

In `docs/02-system-architecture.md`, replace the `Binding source: BLUEPRINT.md` header with:

```markdown
Binding sources: the ADRs (docs/adr/) + docs/03-tech-stack.md. This document is the
canonical architecture record; where it and an ADR disagree, the ADR wins (it is dated).
```

Also fix its dangling constitution pointer: replace `full rules in CLAUDE.md §Structure`
with `full rules in CLAUDE.md and each package's CLAUDE.md`.

- [ ] **Step 5: Fix docs/03 §14 telephony (the S5 correction)**

In `docs/03-tech-stack.md` §14, replace the BYO/DTMF/1600-series wording with:

```markdown
**Telephony (Exotel) — corrected by spike S5, binding form ADR-0019.** BYO numbers are
**inbound forwarding to the platform ExoPhone only** — outbound CLI is not portable, so a
tenant's own number cannot originate calls. **DTMF-send is a declared capability that
Exotel AgentStream does NOT provide**; IVR traversal degrades honestly until a capable
adapter exists. The **1600-series is closed to non-BFSI** — promotional outbound uses the
140-series RTM route. Telephony is a provider-agnostic capability framework (ADR-0019),
not a direct Exotel integration.
```

- [ ] **Step 6: Fix the remaining stale pointers and counts**

In `docs/04-data-model.md`, add immediately under the title:

```markdown
> **LAW 9 — this is FROZEN DESIGN, not a build order.** Every table below is the reference
> that keeps future modules coherent. Tables, enums and columns are AUTHORED only when
> their OWNING module's slice begins. An agent asked to "implement the schema" implements
> the CURRENT module's slice of it. Designing or migrating ahead for modules not being
> built is a violation.
```

Replace its `CLAUDE.md read order` header reference with `CLAUDE.md + .claude/rules/00-laws.md`.

In `docs/05-domain-migration.md`, remove the line that cites `05-domain-migration.md`
itself as a binding source and replace it with `CLAUDE.md (hard rules) + docs/17 (Laws)`.

Fix the mockup count in three places — `docs/13-ux-gap-register.md` (2 occurrences),
`docs/10-i18n-and-design-system.md` (1 occurrence): **80**, not 85.

- [ ] **Step 7: Verify**

```bash
ls design/mockups/*.dc.html | wc -l
grep -rn "85 mockup\|the 85" docs --include=*.md | grep -v archive || echo "no stale 85-count outside archive"
grep -rn "BLUEPRINT" docs --include=*.md | grep -v "docs/archive" | grep -v "15-spec" || echo "no live BLUEPRINT citations"
pnpm check:anchors 2>&1 | tail -5
```

Expected: `80`; then both "no stale…" / "no live…" confirmations; the anchor checker shows only the docs/17 failures still outstanding (fixed in Task 19).

- [ ] **Step 8: Commit**

```bash
git add -A docs
git commit -m "$(cat <<'EOF'
docs: collapse the authority chain to one order; archive BLUEPRINT

VERIFIED: mockup count corrected to 80 (matches `ls design/mockups/*.dc.html`); no live
BLUEPRINT citations remain outside docs/15 and docs/archive; anchor checker shows no new
failures.

- BLUEPRINT archived; its owner directives + user-decisions log absorbed into docs/15
  with amendments stated ABOVE the superseded originals (the archived file interleaved
  them, so an agent could quote stale law from above a correction)
- Authority is now: Laws (docs/17) → product truth (docs/product + docs/15) → ADRs +
  docs/02/03 → module docs. adr/README and docs/02 re-pointed.
- docs/03 §14 telephony corrected per spike S5 / ADR-0019: BYO is inbound forwarding
  only, AgentStream has no DTMF-send, 1600-series closed to non-BFSI
- docs/04 carries the Law 9 "frozen design, not a build order" banner
- docs/05 no longer cites itself as a binding source

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 17: Rewrite docs/14 dateless + extract the forward-compat register

**Files:**
- Create: `docs/modules/forward-compat.md`
- Modify: `docs/14-build-roadmap.md` (rewrite)

**Interfaces:**
- Consumes: Task 13's checker
- Produces: `docs/modules/forward-compat.md` — the `/roadmap` skill (Task 8) already instructs modules to read it

- [ ] **Step 1: Confirm the split personality**

```bash
grep -n "^## Day\|^## §4\|^## §5\|^## §6" docs/14-build-roadmap.md
grep -c "Day [0-9]" docs/14-build-roadmap.md
grep -rn "docs/14 §4\|forward-compat" docs --include=*.md | wc -l
```

Expected: day-numbered track headings (a calendar that reality has already invalidated — work started 07-25, store accounts and Fly billing are owner-blocked) alongside §4's forward-compat register, which is declared "mandatory reading" and is genuinely load-bearing.

- [ ] **Step 2: Extract the forward-compat register**

Create `docs/modules/forward-compat.md` containing §4's table verbatim, under:

```markdown
# Forward-compatibility register

> **Mandatory reading before any module's first migration or contract.** Each row states
> what a module must build in NOW so that later modules do not force a refactor. This is
> the anti-collision device that makes Law 9 (schema grows module-wise) safe: a module can
> author only its own tables precisely because this register tells it which future needs
> its first migration must already satisfy.
>
> Extracted verbatim from docs/14 §4 on 2026-07-29 so it can be cited without loading the
> whole build roadmap. `/roadmap` requires every module to restate its row.
```

- [ ] **Step 3: Rewrite docs/14 dateless**

Rewrite `docs/14-build-roadmap.md` keeping, in this order:

1. A new header explaining the change:

```markdown
# 14 — Build plan: tracks, dependencies, launch gate

> **Dateless by design (rewritten 2026-07-29).** This document previously carried a 20-day
> calendar that reality invalidated: foundation work ran on its own path, and store
> accounts plus billable Fly infrastructure are owner-blocked
> (docs/ops/company-registration-blockers.md). What survives — and what actually governs —
> is the TRACK DEPENDENCY STRUCTURE, the launch gate and the risk register. Sequencing
> within a module lives in that module's roadmap (docs/modules/), never here.
>
> The forward-compatibility register moved to `docs/modules/forward-compat.md`.
```

2. The tracks A–E/M with their **dependencies and ordering**, day numbers removed. Keep "Track D depends on Track B's design slot" style statements; delete "Days 14–18".
3. The launch gate.
4. The risk register (keep the owner-blocked bracketed notes — they are current state).

**Delete** §4 (now extracted) and §5 (the per-module ticket template — `docs/modules/_template.md` is canonical and newer).

- [ ] **Step 4: Verify**

```bash
grep -c "Day [0-9]" docs/14-build-roadmap.md
grep -n "forward-compat" docs/14-build-roadmap.md
grep -c "^|" docs/modules/forward-compat.md
pnpm check:anchors 2>&1 | tail -3
```

Expected: `0` day references in docs/14; a pointer to the extracted register; the register table retains all its rows; no new anchor failures.

- [ ] **Step 5: Commit**

```bash
git add docs/14-build-roadmap.md docs/modules/forward-compat.md
git commit -m "$(cat <<'EOF'
docs: docs/14 rewritten dateless; forward-compat register extracted

VERIFIED: zero "Day N" references remain in docs/14; the register keeps all its rows at
docs/modules/forward-compat.md; anchor checker clean of new failures.

The 20-day calendar was fiction (foundation ran its own path; store accounts and Fly
billing are owner-blocked) while §4's register, the track dependencies, the launch gate
and the risk register are load-bearing. Separating them stops agents reading dead dates
as commitments. §5's duplicate ticket template deleted — modules/_template.md is canonical.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 18: Label research/ in two tiers

**Files:**
- Modify: all 26 files in `docs/research/` (one-line status header each)
- Create: `docs/research/README.md`

**Interfaces:**
- Consumes: Tasks 14–15 (which already promoted `phases710` §2 and `design.md`'s N-rules)
- Produces: no downstream dependency; this closes the "binding law under research/" inversion

**Archive nothing.** There are 100+ inbound links and several ADR citations that must keep resolving. This task labels; it does not move or delete.

- [ ] **Step 1: Confirm the mixed corpus and the dangerous files**

```bash
ls docs/research/*.md | wc -l
grep -l "SUPERSEDED\|OVERTURNED\|PROMOTED" docs/research/*.md
head -12 docs/research/backend.md
head -12 docs/research/fly.md
```

Expected: 26 files; only a few carry banners. `backend.md` recommends Hono + oRPC and **explicitly rejects NestJS**; `fly.md` recommends Crunchy Bridge + AWS S3 and rejects Tigris. Both were overturned by ADRs. Read standalone, they hand an agent the wrong stack.

- [ ] **Step 2: Add NORMATIVE headers**

To each of `journey.md`, `ds-reconciliation.md`, `uxAL.md`, `uxMZ.md`, `ds-usage.md`, `calc.md`, `geo3d.md`, `market.md`, add as the first line:

```markdown
> **NORMATIVE** — binding, cited by live documents. Do not archive without promoting its content first.
```

(`phases710.md` and `design.md` already received their promotion banners in Tasks 14–15.)

- [ ] **Step 3: Add HISTORICAL EVIDENCE headers**

To each of `appShape.md`, `auth.md`, `buildplan.md`, `ds-brand-law.md`, `ds-tokens.md`, `integrations.md`, `scale3d.md`, `sync.md`, `tooling.md`, `voice.md`, `verify-bareRn.md`, `verify-billing.md`, `verify-flyNative.md`, `verify-nestContracts.md`, add as the first line:

```markdown
> **HISTORICAL EVIDENCE** — conclusions already promoted into the ADRs and docs/00–17. Cite the ADR, not this file.
```

- [ ] **Step 4: Add OVERTURNED banners to the two dangerous files**

At the top of `docs/research/backend.md`:

```markdown
> **⚠ OVERTURNED — see ADR-0002 (NestJS), ADR-0003 (ts-rest + Zod 3) and ADR-0008 (BullMQ).**
> This file recommends Hono + oRPC + Graphile Worker and explicitly rejects NestJS. That
> direction was reversed by the verify-nestContracts spike. **The shipped stack is NestJS +
> ts-rest + BullMQ.** Retained only as considered-alternatives evidence for those ADRs.
```

At the top of `docs/research/fly.md`:

```markdown
> **⚠ OVERTURNED — see ADR-0006 (Fly postgres-flex), ADR-0007 (Tigris, sin) and ADR-0008
> (Upstash).** This file recommends Crunchy Bridge and AWS S3 and rejects Tigris. That
> direction was reversed by the verify-flyNative spike. Retained only as
> considered-alternatives evidence and for its bom-capacity and DPDP notes.
```

- [ ] **Step 5: Write the directory README**

Create `docs/research/README.md`:

```markdown
# docs/research — exploration corpus, two tiers

Every file carries a status banner on its first line. **Read the banner before the file.**

- **NORMATIVE** — still binding, cited by live documents: `journey.md`,
  `ds-reconciliation.md`, `uxAL.md`, `uxMZ.md`, `ds-usage.md`, `calc.md`, `geo3d.md`,
  `market.md`. These hold truth that has not yet been promoted into `docs/` proper.
  Promoting them is the goal; until then they are law.
- **PROMOTED** — content moved into a live document: `phases710.md` (§2 →
  `docs/product/studio-census.md`), `design.md` (N1–N10 → `docs/10`).
- **HISTORICAL EVIDENCE** — conclusions already live in the ADRs. Cite the ADR.
- **⚠ OVERTURNED** — `backend.md` and `fly.md` recommend stacks that were subsequently
  reversed. Never read either without its banner.

Nothing here is deleted: over a hundred inbound links and several ADR citations depend on
these paths resolving. When a NORMATIVE file's content is promoted into `docs/`, change its
banner to PROMOTED and point at the new home — do not remove the file.
```

- [ ] **Step 6: Verify every file is labelled**

```bash
node -e "
const fs=require('fs');
const dir='docs/research';
const missing=[];
for (const f of fs.readdirSync(dir).filter(x=>x.endsWith('.md') && x!=='README.md')) {
  const first=fs.readFileSync(dir+'/'+f,'utf8').split('\n').slice(0,14).join(' ');
  if(!/NORMATIVE|HISTORICAL EVIDENCE|OVERTURNED|PROMOTED|SUPERSEDED/.test(first)) missing.push(f);
}
if(missing.length) throw new Error('unlabelled research files: '+missing.join(', '));
console.log('all 25 research files labelled + README');"
pnpm check:anchors 2>&1 | tail -3
```

Expected: `all 25 research files labelled + README`; no new anchor failures.

- [ ] **Step 7: Commit**

```bash
git add docs/research
git commit -m "$(cat <<'EOF'
docs: two-tier status banners on all 26 research files

VERIFIED: a script asserts every research/*.md carries a NORMATIVE / HISTORICAL EVIDENCE /
OVERTURNED / PROMOTED / SUPERSEDED banner in its opening lines; anchor checker clean.

backend.md and fly.md now carry OVERTURNED banners — read standalone they recommend Hono
+ oRPC and Crunchy Bridge + AWS S3, i.e. the wrong stack. Nothing is deleted: 100+ inbound
links and several ADR citations depend on these paths resolving.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 19: Rebuild docs/17 as the rule→mechanism matrix

**Files:**
- Modify: `docs/17-engineering-governance.md` (rebuild)
- Modify: `docs/16-billing-and-entitlements.md` (dedup: tier table → pointer)
- Modify: `docs/02-system-architecture.md`, `docs/04-data-model.md` (dedup: role matrix → pointer)

**Interfaces:**
- Consumes: everything in Phase 2; `.claude/rules/00-laws.md` (Task 6)
- Produces: **the anchor checker goes green here.** This is the Phase 2 acceptance gate.

- [ ] **Step 1: Confirm the outstanding failures this task must clear**

```bash
pnpm check:anchors 2>&1 | grep "17-engineering-governance"
grep -n "CLAUDE.md §" docs/17-engineering-governance.md
```

Expected: the phantom `§Structure`, `§Layer quick-ref`, `§Slice workflow`, `§Definition of done`, `§Enforcement matrix` references — the last dangling anchors in the corpus.

- [ ] **Step 2: Rebuild docs/17**

Rewrite `docs/17-engineering-governance.md` with exactly these sections:

1. **Header** — "the one governance document; CLAUDE.md points here; nothing duplicates it."
2. **§1 The Laws 1–9** — verbatim from the current file (they are the durable core). Add a line: "One-line digest for agents: `.claude/rules/00-laws.md` (always loaded)."
3. **§2 Decision hierarchy** — verbatim, with level 2 re-pointed at `docs/product/` (Task 14) and level 3 at ADRs + docs/02/03 (Task 16, BLUEPRINT no longer named).
4. **§3 Per-module roadmap system** — verbatim, plus: specs extraction is mandatory task 0 (`/roadmap`), and `docs/modules/forward-compat.md` is required reading.
5. **§4 The rule→mechanism matrix** — replaces the old governance map. Every row: rule · mechanism · stage · where. Stage ∈ `typecheck | lint | hook | CI | invariant | skill | prose`. **A `prose` row must carry a justification for why no lower rung can hold it.** Seed it from the enforcement inventory:

```markdown
| Rule | Mechanism | Stage | Where |
|---|---|---|---|
| Dependency direction & layer purity | dependency-cruiser (19 rules, all `error`) | lint | `.dependency-cruiser.cjs` |
| Package encapsulation | turbo boundaries tags | lint | `turbo.json` + CI |
| Screens import only from component indexes | dependency-cruiser `package-index-only` | lint | `.dependency-cruiser.cjs` |
| Module public surface (one-change-one-file) | dependency-cruiser `api-module-boundary` | lint | `.dependency-cruiser.cjs` |
| Tenant isolation (RLS, fail-closed, append-only ledgers) | `tests/invariants/tenancy-rls.ts` | invariant | CI test |
| `tenant_id` on every new table | `tests/invariants/table-tenancy-scan.ts` | invariant | CI test |
| contracts `z.enum` ↔ db `pgEnum` parity | `tests/invariants/enum-parity.ts` | invariant | CI test |
| No raw hex / arbitrary px / inline style | oxlint `no-restricted-syntax` | lint | `.oxlintrc.json` |
| Files ≲450 lines | oxlint `max-lines` + PostToolUse hook | lint + hook | `.oxlintrc.json`, `.claude/hooks/edit-checks.sh` |
| Never `sed -i` / `perl -i` | PreToolUse hook, exit 2 | hook | `.claude/hooks/bash-guard.sh` |
| Migrations append-only | PreToolUse hook + CI diff guard | hook + CI | `.claude/hooks/write-guard.sh`, `ci.yml` |
| No unit tests (`.test.*` / `.spec.*`) | PreToolUse hook + `check:no-tests` in the lint chain | hook + lint | `.claude/hooks/write-guard.sh`, `package.json` |
| Config read only via `@heliogrid/env` | Biome `noProcessEnv` (allowlist = `packages/env/src/**`) + `check:env` | lint + CI | `biome.json`, `scripts/check-env-access.mjs` |
| Formatting + general lint rule set | Biome (explicit formatter settings; no separate Prettier) | lint | `biome.json` |
| No hand-rolled HTTP in apps | dependency-cruiser `no-raw-http-clients` | lint | `.dependency-cruiser.cjs` |
| API breaking changes | oasdiff vs main + openapi freshness diff | CI | `scripts/check-openapi-breaking.mjs` |
| Doc cross-references resolve | anchor checker | CI | `scripts/check-doc-anchors.mjs` |
| VERIFIED rows carry evidence | roadmap linter | CI | `scripts/check-roadmaps.mjs` |
| i18n catalogs extracted | lingui extract + git diff guard | CI | `ci.yml` |
| Token contrast floors | tokens build gate (DECLARED_PAIRS) | typecheck/build | `packages/tokens/src/contrast.ts` |
| Zod 4 ban · no `process.env` outside config · no `console.log` | Biome rules | lint | `biome.json` |
| Exact dependency pins | `.npmrc save-prefix=` + sherif + `--frozen-lockfile` | lint + CI | root |
| No secrets committed | gitleaks | CI | `ci.yml` |
| Dead code / clones | knip + jscpd | CI | `ci.yml` |
| Contract-first ordering | `/contract-change` skill + contract diff in PR body | skill | `.claude/skills/contract-change/` |
| Web + RN lockstep (Law 7) | `/slice` + `/verify-app` + PR DoD checklist | skill | `.claude/skills/` |
| Five-lens review | `/lenses` + 3 subagents | skill | `.claude/skills/lenses/`, `.claude/agents/` |
| Docs updated in same commit (Law 8) | `/doc-sync` + anchor checker | skill + CI | `.claude/skills/doc-sync/` |
| Split by responsibility, no `-part2` names | **prose** — no linter can judge whether a filename honestly describes a responsibility. `max-lines` forces the split; naming is reviewed. | prose | `CLAUDE.md`, `/lenses` |
| React presentation/logic separation | **prose** — the container/presentational boundary is a judgement about cohesion, not a syntactic property. Reviewed by ux-lens and `/code-review`. | prose | `.claude/rules/ui-adherence.md` |
| Git stays manual (no unasked PRs) | `disable-model-invocation: true` on `/pr` + CLAUDE.md Process | skill | `.claude/skills/pr/SKILL.md` |
| Provenance tier on every number | **prose** — no mechanism can tell a "number that needs provenance" from an id or a count. Enforced by epc-lens review + per-screen DoD. | prose | `.claude/agents/epc-lens.md` |
| Money never renders stale | **prose** — staleness is a product-semantic judgement about a specific figure's inputs. Enforced by epc-lens + the fingerprint system when the studio lands. | prose | `.claude/agents/epc-lens.md` |
| Structural adequacy never computed | **prose** — a negative existence claim over arbitrary code. Enforced by epc-lens (critical severity). | prose | `.claude/agents/epc-lens.md` |
```

6. **§5 Definition of Done** — the single copy (from `docs/foundation-redesign.md` §7.4).
7. **§6 Per-package CLAUDE.md template** — the single copy. Resolve the old contradiction explicitly: **≤40 lines default, ≤65 for api/mobile/db.** Landmines mandatory on first incident, date-stamped, same commit.

**Delete** the historical foundation-gate section and every `CLAUDE.md §…` reference.

- [ ] **Step 3: Dedup per Law 4**

In `docs/16-billing-and-entitlements.md` §1, replace the restated pricing/tier/caps table with:

```markdown
Prices, tiers, caps and trial terms are defined once in
[docs/01-business-model.md](./01-business-model.md). This document covers billing
MECHANICS only — restating the numbers here would create a drift vector (Law 4).
```

In `docs/02-system-architecture.md` and `docs/04-data-model.md`, replace the restated
6-role capability matrices with a pointer:

```markdown
The role capability matrix is normative in
[docs/08-security-and-tenancy.md](./08-security-and-tenancy.md) §3. Do not restate it.
```

- [ ] **Step 4: Run the anchor checker — this is the Phase 2 gate**

```bash
pnpm check:anchors
```

Expected: **PASS** — `doc anchors OK — every cross-reference resolves`. This is the first time the corpus has been clean. If anything remains, fix the reference or the target; do not relax the checker.

- [ ] **Step 5: Verify the matrix has no unjustified prose rows**

```bash
node -e "
const fs=require('fs');
const rows=fs.readFileSync('docs/17-engineering-governance.md','utf8')
  .split('\n').filter(l=>l.startsWith('|') && l.includes('prose'));
const bad=rows.filter(r=>!/prose\*\*\s*—|prose\*\*\s*-/.test(r) && !/—/.test(r));
if(bad.length) throw new Error('prose rows without justification:\n'+bad.join('\n'));
console.log(rows.length+' prose rows, all justified');"
```

Expected: a small number of prose rows, each carrying its justification. If a prose row can be mechanized, mechanize it instead of justifying it.

- [ ] **Step 6: Commit**

```bash
git add docs/17-engineering-governance.md docs/16-billing-and-entitlements.md docs/02-system-architecture.md docs/04-data-model.md
git commit -m "$(cat <<'EOF'
docs: rebuild docs/17 as the rule→mechanism matrix — anchor checker now GREEN

VERIFIED: `pnpm check:anchors` passes over the whole corpus for the first time; every
prose row in the matrix carries a justification for why no lower rung can hold it.

- §4 replaces the old governance map (whose ~15 rows pointed at a CLAUDE.md that was
  never committed) with rule · mechanism · stage · where, every row resolving to a real
  file and gated by the anchor checker
- Laws 1-9 and the decision hierarchy kept verbatim; level 2 re-pointed at docs/product,
  level 3 at ADRs + docs/02/03
- single copies of the DoD and the per-package template; the ≤40/≤65 line-budget
  contradiction resolved explicitly
- Law 4 dedup: docs/16 tier table → pointer to docs/01; role matrix normative only in
  docs/08

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

**PHASE 2 GATE.**

```bash
pnpm check:anchors && pnpm lint && pnpm turbo typecheck
```

Expected: all pass. The documentation authority chain is single, resolvable, and machine-checked.

---

# PHASE 3 — New gates

**The rule for every task in this phase:** a gate you have not seen go red is not a gate. Each task proves its gate with a deliberate violation before wiring it in.

**Prerequisite for Tasks 20, 21, 28:** a local Postgres. Start one once for the whole phase:

```bash
docker run --rm -d --name hg-gates -e POSTGRES_USER=heliogrid -e POSTGRES_PASSWORD=heliogrid \
  -e POSTGRES_DB=heliogrid_ci -p 55432:5432 postgres:16
sleep 5
export DATABASE_URL=postgres://heliogrid:heliogrid@localhost:55432/heliogrid_ci
export DATABASE_ADMIN_URL=$DATABASE_URL
pnpm --filter @heliogrid/db migrate
```

Tear down after Task 28: `docker rm -f hg-gates`.

---

### Task 20: Enum parity invariant

**Files:**
- Create: `tests/invariants/src/enum-parity.ts`
- Modify: `tests/invariants/src/run.ts`
- Modify: `tests/invariants/package.json` (add the contracts dependency)

**Interfaces:**
- Consumes: the real test gate from Task 2 (without it this invariant would silently skip)
- Produces: `runEnumParity(url)` exported from `enum-parity.ts`, called by `run.ts`. `/contract-change` and `/migration` both invoke `pnpm turbo test --filter=@heliogrid/invariants`.

This closes the repo's self-declared "highest-risk drift". `db-no-upward` forbids `packages/db` importing contracts, so parity cannot be a type-level check — but `tests/invariants` is tagged `app` and may import contracts, and it can read live `pg_enum` values. That is the seam.

- [ ] **Step 1: Confirm the drift is real and unguarded**

```bash
grep -n "pgEnum('user_status'\|pgEnum('role_preset'\|pgEnum('invite_status')" packages/db/src/schema/enums.ts
grep -n "memberStatusSchema\|rolePresetSchema\|inviteStatusSchema" packages/contracts/src/auth.ts packages/contracts/src/common.ts | head
grep -n "highest-risk drift" packages/db/CLAUDE.md
```

Expected: the same value lists hand-written in both places, and `packages/db/CLAUDE.md` admitting nothing checks them.

- [ ] **Step 2: Add the contracts dependency to the invariants package**

In `tests/invariants/package.json`, replace:

```json
  "dependencies": {
    "postgres": "3.4.9"
  },
```

with:

```json
  "dependencies": {
    "@heliogrid/contracts": "workspace:*",
    "postgres": "3.4.9"
  },
```

Then `pnpm install`.

- [ ] **Step 3: Write the failing test — a deliberate mismatch**

Temporarily add a value to a contract enum. In `packages/contracts/src/auth.ts`, change:

```ts
export const inviteStatusSchema = z.enum(['pending', 'accepted', 'expired', 'revoked']);
```

to:

```ts
export const inviteStatusSchema = z.enum(['pending', 'accepted', 'expired', 'revoked', 'bogus']);
```

This is exactly the defect the gate must catch: an API value the database will reject at insert.

- [ ] **Step 4: Write the invariant**

Create `tests/invariants/src/enum-parity.ts`:

```ts
import {
  inviteStatusSchema,
  memberStatusSchema,
  tenantSegmentSchema,
  tenantStatusSchema,
} from '@heliogrid/contracts';
import { rolePresetSchema, uiLanguageSchema, unitsPrefSchema } from '@heliogrid/contracts';
import postgres from 'postgres';

/**
 * Enum parity invariant.
 *
 * packages/db hand-mirrors the contracts z.enums and `db-no-upward` (dependency-cruiser)
 * correctly forbids importing contracts there — so the two lists were kept in sync by
 * discipline alone, which packages/db/CLAUDE.md itself called "the highest-risk drift in
 * the repo". tests/invariants is tagged `app` and MAY import contracts, and it can read
 * live pg_enum values. That is the seam this invariant uses.
 *
 * A value in one and not the other is a silent production defect: rows the API can never
 * return, or API values the database rejects at insert.
 */

/** pg enum type name → the contract schema that must match it, value for value. */
const MAPPED: Record<string, { options: readonly string[]; contract: string }> = {
  tenant_segment: { options: tenantSegmentSchema.options, contract: 'tenantSegmentSchema' },
  tenant_status: { options: tenantStatusSchema.options, contract: 'tenantStatusSchema' },
  ui_language: { options: uiLanguageSchema.options, contract: 'uiLanguageSchema' },
  unit_pref: { options: unitsPrefSchema.options, contract: 'unitsPrefSchema' },
  user_status: { options: memberStatusSchema.options, contract: 'memberStatusSchema' },
  role_preset: { options: rolePresetSchema.options, contract: 'rolePresetSchema' },
  invite_status: { options: inviteStatusSchema.options, contract: 'inviteStatusSchema' },
};

/**
 * pg enums that intentionally have NO contract counterpart yet — each with the reason.
 * A new pg enum that is neither mapped nor listed here FAILS, forcing a conscious call.
 */
const NO_CONTRACT_YET: Record<string, string> = {
  file_kind: 'files module not started — no API surface yet',
  file_subject: 'files module not started',
  file_status: 'files module not started',
  usage_metric: 'billing module not started (full metric enum seeded per forward-compat register)',
  audit_actor_type: 'audit log is server-internal; never crosses the wire',
  phone_provider: 'telephony module not started (ADR-0019 seams only)',
  phone_number_type: 'telephony module not started',
  cli_series: 'telephony module not started',
  number_status: 'telephony module not started',
  phone_purpose: 'telephony module not started',
  mutation_result: 'offline sync module not started (Track E)',
};

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`enum-parity: ${msg}`);
}

export async function runEnumParity(adminUrl: string) {
  const sql = postgres(adminUrl, { max: 1, onnotice: () => {} });
  try {
    const rows = await sql<{ typname: string; enumlabel: string }[]>`
      select t.typname, e.enumlabel
      from pg_type t
      join pg_enum e on e.enumtypid = t.oid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
      order by t.typname, e.enumsortorder`;

    const dbEnums = new Map<string, string[]>();
    for (const r of rows) {
      const list = dbEnums.get(r.typname) ?? [];
      list.push(r.enumlabel);
      dbEnums.set(r.typname, list);
    }
    assert(dbEnums.size > 0, 'found pg enums (is the database migrated?)');

    const problems: string[] = [];

    // Every mapped pair must match value for value (order-insensitive).
    for (const [typname, { options, contract }] of Object.entries(MAPPED)) {
      const dbValues = dbEnums.get(typname);
      if (!dbValues) {
        problems.push(`pg enum "${typname}" is missing but ${contract} expects it`);
        continue;
      }
      const inDb = [...dbValues].sort();
      const inContract = [...options].sort();
      const onlyDb = inDb.filter((v) => !inContract.includes(v));
      const onlyContract = inContract.filter((v) => !inDb.includes(v));
      if (onlyDb.length || onlyContract.length) {
        problems.push(
          `${typname} ↔ ${contract} DRIFT` +
            (onlyDb.length ? `\n    only in database: ${onlyDb.join(', ')}` : '') +
            (onlyContract.length ? `\n    only in contract: ${onlyContract.join(', ')}` : ''),
        );
      }
    }

    // A new pg enum must be consciously mapped or consciously excused.
    for (const typname of dbEnums.keys()) {
      if (typname in MAPPED || typname in NO_CONTRACT_YET) continue;
      problems.push(
        `pg enum "${typname}" is neither mapped to a contract schema nor listed in ` +
          `NO_CONTRACT_YET. Add it to MAPPED (with its z.enum) or to NO_CONTRACT_YET ` +
          `with the reason it has no API surface.`,
      );
    }

    if (problems.length) {
      throw new Error(
        `enum-parity: ${problems.length} problem(s)\n  - ${problems.join('\n  - ')}\n\n` +
          'A value in one side and not the other is a silent production defect: rows the ' +
          'API can never return, or API values the database rejects at insert.',
      );
    }

    console.log(
      `enum parity OK — ${Object.keys(MAPPED).length} contract-backed enums match, ` +
        `${Object.keys(NO_CONTRACT_YET).length} intentionally contract-free`,
    );
  } finally {
    await sql.end();
  }
}
```

- [ ] **Step 5: Wire it into the runner**

In `tests/invariants/src/run.ts`, replace:

```ts
import { runTenancyInvariants } from './tenancy-rls';
```

with:

```ts
import { runEnumParity } from './enum-parity';
import { runTenancyInvariants } from './tenancy-rls';
```

and replace:

```ts
  await runTenancyInvariants(url);
  console.log('invariants green');
```

with:

```ts
  await runTenancyInvariants(url);
  await runEnumParity(url);
  console.log('invariants green');
```

- [ ] **Step 6: Run to verify it CATCHES the deliberate drift**

```bash
pnpm turbo test --filter=@heliogrid/invariants --force
```

Expected: FAIL (exit 1) with `invite_status ↔ inviteStatusSchema DRIFT` and `only in contract: bogus`.

- [ ] **Step 7: Revert the deliberate drift and verify green**

Restore `packages/contracts/src/auth.ts`:

```ts
export const inviteStatusSchema = z.enum(['pending', 'accepted', 'expired', 'revoked']);
```

```bash
pnpm turbo test --filter=@heliogrid/invariants --force
```

Expected: PASS, printing `enum parity OK — 7 contract-backed enums match, 11 intentionally contract-free`.

- [ ] **Step 8: Verify the unmapped-enum branch also fires**

```bash
psql "$DATABASE_ADMIN_URL" -c "create type public.probe_status as enum ('a','b');"
pnpm turbo test --filter=@heliogrid/invariants --force 2>&1 | grep probe_status
psql "$DATABASE_ADMIN_URL" -c "drop type public.probe_status;"
```

Expected: the grep prints the "neither mapped … nor listed in NO_CONTRACT_YET" message. This is what stops a future module quietly adding an enum with no contract decision.

- [ ] **Step 9: Commit**

```bash
git add tests/invariants packages/contracts/src/auth.ts pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(gates): enum parity invariant — the repo's self-declared highest-risk drift

VERIFIED by deliberate violation: adding 'bogus' to inviteStatusSchema turns the gate RED
with "only in contract: bogus"; reverting turns it green (7 contract-backed enums match,
11 intentionally contract-free); creating an unmapped pg enum also turns it RED.

db-no-upward correctly forbids packages/db importing contracts, so parity could never be
a type-level check. tests/invariants is tagged `app`, may import contracts, and can read
live pg_enum — that is the seam. packages/db/CLAUDE.md called this drift "kept in sync by
discipline alone"; it is now kept in sync by CI.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 21: tenant_id presence scan

**Files:**
- Create: `tests/invariants/src/table-tenancy-scan.ts`
- Modify: `tests/invariants/src/run.ts`

**Interfaces:**
- Consumes: Task 20's runner wiring
- Produces: `runTableTenancyScan(url)`; `/migration` (Task 9) already instructs authors to add global tables to this file's allowlist

The existing tenancy invariant tests tables that **already have** `tenant_id`. A new table created without one is invisible to it and to RLS — so "every tenant table carries tenant_id" only *looked* mechanical.

- [ ] **Step 1: Confirm the blind spot**

```bash
grep -n "tenantTables.length >= 7" tests/invariants/src/tenancy-rls.ts
```

Expected: the only presence check is a count floor. A table with no `tenant_id` simply does not appear in the scan — it escapes silently.

- [ ] **Step 2: Write the failing test — a tenant-less table**

```bash
psql "$DATABASE_ADMIN_URL" -c "create table public.leaky_probe (id uuid primary key, note text);"
```

This is precisely the defect: a table with no `tenant_id`, no RLS policy, readable across every tenant.

- [ ] **Step 3: Write the scan**

Create `tests/invariants/src/table-tenancy-scan.ts`:

```ts
import postgres from 'postgres';

/**
 * Inverse tenancy scan.
 *
 * tenancy-rls.ts proves isolation for tables that ALREADY carry tenant_id. This proves the
 * other half: that no table escaped tenancy entirely. Without it, "every tenant-owned table
 * carries tenant_id" is prose wearing a mechanical costume.
 *
 * Every base table in `public` must either carry tenant_id or be justified below.
 */

/** Tables that are genuinely global. Each needs a one-line reason — no silent entries. */
const GLOBAL_TABLES: Record<string, string> = {
  tenants: 'the tenant registry itself — RLS restricts it to the caller’s own row',
  __drizzle_migrations: 'migration ledger, server-internal',
  // Better Auth owns these via its own migrator and they are keyed by its own identity model.
  user: 'Better Auth internal',
  session: 'Better Auth internal',
  account: 'Better Auth internal',
  verification: 'Better Auth internal',
  organization: 'Better Auth internal',
  member: 'Better Auth internal',
  invitation: 'Better Auth internal',
  jwks: 'Better Auth internal (jwt plugin)',
};

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`table-tenancy: ${msg}`);
}

export async function runTableTenancyScan(adminUrl: string) {
  const sql = postgres(adminUrl, { max: 1, onnotice: () => {} });
  try {
    // Base tables only: exclude views and partition children (they inherit the parent's
    // columns and policies, so scanning them would double-report).
    const tables = (
      await sql<{ table_name: string }[]>`
        select c.relname as table_name
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relkind in ('r', 'p')
          and not exists (select 1 from pg_inherits i where i.inhrelid = c.oid)
        order by c.relname`
    ).map((r) => r.table_name);

    assert(tables.length > 0, 'found tables in public (is the database migrated?)');

    const withTenant = new Set(
      (
        await sql<{ table_name: string }[]>`
          select table_name from information_schema.columns
          where table_schema = 'public' and column_name = 'tenant_id'`
      ).map((r) => r.table_name),
    );

    const offenders = tables.filter((t) => !withTenant.has(t) && !(t in GLOBAL_TABLES));

    if (offenders.length) {
      throw new Error(
        `table-tenancy: ${offenders.length} table(s) carry neither tenant_id nor a global ` +
          `justification:\n  - ${offenders.join('\n  - ')}\n\n` +
          'Add tenant_id (plus a composite index leading with it, an RLS policy for ' +
          'app_user checking app.tenant_id, and explicit grants), or — if the table is ' +
          'genuinely global — add it to GLOBAL_TABLES in this file WITH THE REASON. ' +
          'A table that escapes tenancy is readable across every tenant.',
      );
    }

    // Guard the allowlist itself against rot: an entry for a table that no longer exists
    // hides the fact that nobody has revisited these decisions.
    const stale = Object.keys(GLOBAL_TABLES).filter((t) => !tables.includes(t));
    if (stale.length) {
      console.warn(
        `table-tenancy: GLOBAL_TABLES lists ${stale.length} table(s) not present in this ` +
          `database (fine if the module has not landed yet): ${stale.join(', ')}`,
      );
    }

    console.log(
      `table tenancy scan OK — ${tables.length} base tables: ` +
        `${tables.length - offenders.length - Object.keys(GLOBAL_TABLES).filter((t) => tables.includes(t)).length} tenant-scoped, ` +
        `${Object.keys(GLOBAL_TABLES).filter((t) => tables.includes(t)).length} justified global`,
    );
  } finally {
    await sql.end();
  }
}
```

- [ ] **Step 4: Wire it into the runner**

In `tests/invariants/src/run.ts`, add the import alongside the others:

```ts
import { runTableTenancyScan } from './table-tenancy-scan';
```

and call it after the tenancy invariants:

```ts
  await runTenancyInvariants(url);
  await runTableTenancyScan(url);
  await runEnumParity(url);
  console.log('invariants green');
```

- [ ] **Step 5: Run to verify it CATCHES the tenant-less table**

```bash
pnpm turbo test --filter=@heliogrid/invariants --force
```

Expected: FAIL (exit 1) naming `leaky_probe` and explaining both remedies.

- [ ] **Step 6: Drop the probe and verify green**

```bash
psql "$DATABASE_ADMIN_URL" -c "drop table public.leaky_probe;"
pnpm turbo test --filter=@heliogrid/invariants --force
```

Expected: PASS, printing the base-table count with the tenant-scoped/justified-global split.

- [ ] **Step 7: Commit**

```bash
git add tests/invariants
git commit -m "$(cat <<'EOF'
feat(gates): inverse tenancy scan — a table cannot escape tenancy silently

VERIFIED by deliberate violation: `create table leaky_probe (id uuid, note text)` turns
the gate RED and names it; dropping it turns the gate green.

tenancy-rls.ts proved isolation for tables that already carried tenant_id — its only
presence check was `length >= 7`, so a new table without tenant_id was invisible to both
the invariant and RLS. Every base table must now carry tenant_id or appear in
GLOBAL_TABLES with a written reason; there is no third option.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 22: Lint hardening — Biome rules, token adherence, file-size cap

**Files:**
- Modify: `biome.json` (rule hardening + formatter settings)
- Create: `.oxlintrc.json`
- Modify: `package.json` (devDependency + lint chain)

**Interfaces:**
- Consumes: nothing
- Produces: `pnpm lint` fails on raw hex/px in UI code, on files over 450 lines, on test files, and on the tightened Biome rule set. `.claude/rules/ui-adherence.md` (Task 7) promises this enforcement; Task 19's matrix records it.

Two halves. Biome is the formatter and the general linter (it also owns what Prettier would
otherwise do — there is no separate Prettier in this repo, and adding one would mean two
tools fighting over the same files). oxlint covers what Biome cannot express: raw-value bans
via `no-restricted-syntax` and `max-lines`.

- [ ] **Step 1: Harden the Biome rule set**

In `biome.json`, extend the `linter.rules` block with the rules below. Each is chosen
because it catches a class of defect this codebase has actually seen or is exposed to —
not because it exists.

```jsonc
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error",
        "noUnusedFunctionParameters": "error",
        // Effect dependency mistakes caused the stale-response bugs both login screens
        // had to guard around by hand.
        "useExhaustiveDependencies": "error",
        "useHookAtTopLevel": "error"
      },
      "suspicious": {
        "noConsole": { "level": "error", "options": { "allow": ["error", "warn"] } },
        // `any` erases exactly the contract typing the whole architecture depends on.
        "noExplicitAny": "error",
        "noDoubleEquals": "error",
        "noArrayIndexKey": "error",
        "noMisplacedAssertion": "error"
      },
      "style": {
        "noProcessEnv": "error",
        // A non-null assertion is a silent claim the type system disagrees with.
        "noNonNullAssertion": "error",
        "useConst": "error",
        "useTemplate": "error",
        "noParameterAssign": "error",
        "useImportType": "error",
        "useExportType": "error"
      },
      "complexity": {
        "noExcessiveCognitiveComplexity": { "level": "warn", "options": { "maxAllowedComplexity": 15 } },
        "noUselessFragments": "error",
        "noForEach": "off"
      },
      "a11y": {
        "recommended": true
      },
      "nursery": {
        "noFloatingPromises": "error"
      }
```

Also confirm the `formatter` block states the house style explicitly rather than relying on
defaults, so a Biome upgrade cannot silently reformat the repo:

```jsonc
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    }
  }
```

- [ ] **Step 2: Run Biome and fix what the new rules surface**

```bash
pnpm exec biome check . 2>&1 | tail -30
```

Expected: new findings — most likely unused imports, a few `any`s, and non-null assertions.
**Fix the code, do not relax the rules.** `pnpm lint:fix` handles the mechanical ones:

```bash
pnpm lint:fix && pnpm exec biome check .
```

If a rule proves genuinely wrong for this codebase, turn it off **with a comment naming the
reason** — the existing `noForEach: "off"` and the mobile `useValidAriaRole` override are
the precedent. A silent `"off"` is not acceptable.

- [ ] **Step 3: Confirm the dead oxlint config and the unguarded rules**

```bash
ls design/ds-source/_adherence.oxlintrc.json
grep -rl "oxlint" --include=package.json . --exclude-dir=node_modules || echo "oxlint installed NOWHERE"
grep -rEn "#[0-9a-fA-F]{6}" apps/web/app --include=*.tsx --include=*.css | head -3
```

Expected: the vendored config exists; oxlint is installed nowhere; any raw hex in app code is currently unblocked.

- [ ] **Step 4: Install oxlint at an exact pin**

```bash
pnpm add -Dw oxlint@1.44.0
grep -n "oxlint" package.json
```

Verify the recorded version has no `^` prefix (`.npmrc` sets `save-prefix=`). If 1.44.0 is not the current release, pin whatever `pnpm view oxlint version` reports — but pin it exactly.

- [ ] **Step 5: Write the failing test — a violation of each rule**

```bash
cat > apps/web/app/__probe.tsx <<'EOF'
export function Probe() {
  return <div style={{ color: '#5A4BFF', paddingTop: '13px' }}>probe</div>;
}
EOF
node -e "
const fs=require('fs');
fs.writeFileSync('apps/web/app/__probe_long.tsx',
  'export const x = 1;\n'.repeat(460));
"
```

The first file breaks the token rule twice (raw hex plus an arbitrary px value in an inline style); the second breaks the 450-line cap.

- [ ] **Step 6: Write `.oxlintrc.json`**

Create `.oxlintrc.json` at the repo root:

```json
{
  "$schema": "https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json",
  "plugins": ["typescript", "react"],
  "categories": {},
  "rules": {
    "max-lines": ["error", { "max": 450, "skipBlankLines": false, "skipComments": false }]
  },
  "overrides": [
    {
      "files": [
        "packages/ui/src/**/*.tsx",
        "apps/mobile/src/ui/**/*.tsx",
        "apps/mobile/src/screens/**/*.tsx",
        "apps/web/app/**/*.tsx"
      ],
      "rules": {
        "no-restricted-syntax": [
          "error",
          {
            "selector": "Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]",
            "message": "Raw hex colour. Every visual value comes from @heliogrid/tokens, generated from design/ds-source. See .claude/rules/ui-adherence.md."
          },
          {
            "selector": "Literal[value=/^[0-9]+(\\.[0-9]+)?px$/]",
            "message": "Arbitrary px value. Use a spacing/size token from @heliogrid/tokens."
          },
          {
            "selector": "JSXAttribute[name.name='style'] > JSXExpressionContainer > ObjectExpression",
            "message": "Inline style object. Styling lives in the component's CSS (web) or StyleSheet (RN), sourced from tokens."
          }
        ]
      }
    },
    {
      "files": ["packages/tokens/**", "design/ds-source/**"],
      "rules": { "no-restricted-syntax": "off" }
    }
  ],
  "ignorePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/*.d.ts",
    "packages/i18n/src/locales/**"
  ]
}
```

The `packages/tokens` and `design/ds-source` override is load-bearing: those are the token
*source and generator*, where raw hex is not merely allowed but required.

- [ ] **Step 6b: Add the no-test-files backstop to the lint chain**

The PreToolUse hook (Task 5) stops an agent creating a test file. It cannot stop a human, a
generator, or a file arriving via a branch. Add a one-line CI-side backstop to
`package.json` so the rule holds at merge as well:

```json
    "check:no-tests": "! git ls-files 'apps/**' 'packages/**' | grep -E '\\.(test|spec)\\.(ts|tsx|js|jsx)$' || (echo 'Test files are not authored in this repo (owner directive 2026-07-29). Only tests/invariants/ and scripts/ are sanctioned; features are verified by running them.' && exit 1)",
```

Verify both directions:

```bash
pnpm check:no-tests && echo "clean"
touch apps/web/app/__probe.spec.ts && git add -N apps/web/app/__probe.spec.ts
pnpm check:no-tests; echo "exit=$?"
git rm --cached -q apps/web/app/__probe.spec.ts && rm apps/web/app/__probe.spec.ts
```

Expected: `clean` first; then the probe prints the directive message and `exit=1`.

- [ ] **Step 7: Run oxlint to verify both rules FIRE**

```bash
./node_modules/.bin/oxlint --config .oxlintrc.json apps packages
```

Expected: FAIL, reporting on `apps/web/app/__probe.tsx` the raw hex, the `13px` literal and the inline style object; and on `apps/web/app/__probe_long.tsx` the `max-lines` violation.

- [ ] **Step 8: Delete the probes and verify the real tree is clean**

```bash
rm apps/web/app/__probe.tsx apps/web/app/__probe_long.tsx
./node_modules/.bin/oxlint --config .oxlintrc.json apps packages
```

Expected: PASS. **If the real tree has violations, fix the code — do not relax the config.** Known candidate: `apps/web/app/globals.css` legacy `.hg-*` scaffold classes are CSS, not TSX, so they are outside these selectors; genuine TSX violations must be moved to tokens.

- [ ] **Step 9: Wire it into the lint chain**

In `package.json`, replace:

```json
    "lint": "biome check . && dependency-cruiser --config .dependency-cruiser.cjs apps packages tests && sherif",
```

with:

```json
    "lint": "biome check . && oxlint --config .oxlintrc.json apps packages && dependency-cruiser --config .dependency-cruiser.cjs apps packages tests && sherif && pnpm check:no-tests",
```

- [ ] **Step 10: Verify the full chain**

```bash
pnpm lint
```

Expected: PASS with oxlint included.

- [ ] **Step 11: Commit**

```bash
git add biome.json .oxlintrc.json package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(gates): lint hardening — Biome rule set, token adherence, 450-line cap, no test files

VERIFIED by deliberate violation: a probe TSX with `#5A4BFF`, `13px` and an inline style
object fails all three oxlint selectors; a 460-line file fails max-lines; a staged
__probe.spec.ts fails check:no-tests; deleting the probes leaves the real tree green.
Biome's tightened rules were fixed in the code, not relaxed in the config.

Biome owns formatting and general linting (no separate Prettier — two tools over the same
files is a fight, not a safety net); formatter settings are now explicit so an upgrade
cannot silently reformat the repo. oxlint covers what Biome cannot express: raw-value bans
and max-lines. The most-cited hard rule of the old constitution ("no raw values") had zero
mechanical coverage — the design system vendored _adherence.oxlintrc.json but oxlint was
installed nowhere. packages/tokens and design/ds-source are exempt: they are the token
source, where raw hex is required.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 23: Ban hand-rolled HTTP in apps

**Files:**
- Modify: `.dependency-cruiser.cjs` (add one rule)

**Interfaces:**
- Consumes: the committed 19-rule config (Task 1)
- Produces: rule #20. `/contract-change` (Task 9) tells authors that a call site which did not break is hand-rolling HTTP — this makes that a build failure instead of a hope.

Contract drift is only a type error where clients actually import the ts-rest contract. A hand-rolled `fetch` bypasses it undetected — the exact drift bug already documented in `apps/web/CLAUDE.md`.

- [ ] **Step 1: Confirm the current client discipline**

```bash
grep -rn "axios\|node-fetch\|undici" apps/web apps/mobile --include=*.ts --include=*.tsx | grep -v node_modules || echo "no third-party HTTP clients today"
ls apps/web/lib/api-client.ts apps/mobile/src/data/api-client.ts
grep -c "severity: 'error'" .dependency-cruiser.cjs
```

Expected: no third-party HTTP clients yet, both typed clients exist, 19 rules. The rule locks in a property that currently holds by discipline.

- [ ] **Step 2: Write the failing test — a hand-rolled client**

```bash
cat > apps/web/app/__http_probe.ts <<'EOF'
import axios from 'axios';
export const leak = () => axios.get('/api/me');
EOF
```

- [ ] **Step 3: Add the rule**

In `.dependency-cruiser.cjs`, add to the `forbidden` array, after the `mobile-no-db` rule:

```js
    {
      name: 'no-raw-http-clients',
      severity: 'error',
      comment:
        'apps/web and apps/mobile reach the API through the typed ts-rest client ONLY ' +
        '(apps/web/lib/api-client.ts, apps/mobile/src/data/api-client.ts). A hand-rolled ' +
        'HTTP client bypasses the contract, so contract drift stops being a compile error ' +
        'and becomes a runtime surprise — this already happened once (apps/web/CLAUDE.md ' +
        'untyped api<T>() landmine). Auth clients are exempt: Better Auth owns its own ' +
        'transport.',
      from: {
        path: '^apps/(web|mobile)/',
        pathNot: '(lib/api-client\\.|src/data/api-client\\.|auth/client\\.|lib/auth-client\\.)',
      },
      to: {
        dependencyTypes: ['npm'],
        // pnpm resolves to node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/… —
        // always anchor on the node_modules segment (see domain-purity-no-frameworks).
        path: '(^|/)node_modules/(axios|node-fetch|undici|superagent|got|ky)/',
      },
    },
```

- [ ] **Step 4: Run to verify it FIRES**

```bash
./node_modules/.bin/dependency-cruiser --config .dependency-cruiser.cjs apps packages tests
```

Expected: FAIL with `no-raw-http-clients` naming `apps/web/app/__http_probe.ts → axios`.

- [ ] **Step 5: Verify the exemption works**

```bash
rm apps/web/app/__http_probe.ts
grep -c "severity: 'error'" .dependency-cruiser.cjs
pnpm lint
```

Expected: `20` rules, all at error severity, and `pnpm lint` PASSES — the real typed clients and the Better Auth clients are correctly exempt.

- [ ] **Step 6: Commit**

```bash
git add .dependency-cruiser.cjs
git commit -m "$(cat <<'EOF'
feat(gates): dependency-cruiser rule 20 — no hand-rolled HTTP clients in apps

VERIFIED by deliberate violation: a probe importing axios in apps/web fails the cruise;
removing it leaves 20 rules green, with the typed ts-rest clients and Better Auth clients
correctly exempt.

Contract drift is only a compile error where clients import the contract. A hand-rolled
fetch bypasses it silently — which already happened once (the untyped api<T>() landmine
in apps/web/CLAUDE.md). Now the bypass itself fails the build.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 24: Migration append-only CI guard + secret scanning

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the hook from Task 5 (which guards the editing loop; this guards the merge)
- Produces: two CI steps

The hook stops an agent editing an applied migration. It cannot stop a human, another tool, or a rebase. The merge gate closes that.

- [ ] **Step 1: Verify the guard command distinguishes modify from add**

```bash
git fetch origin main 2>/dev/null || true
git diff --diff-filter=MD --name-only origin/main...HEAD -- packages/db/migrations || true
```

Expected: empty on a clean branch. `--diff-filter=MD` matches Modified and Deleted only — a **new** migration (Added) correctly passes.

- [ ] **Step 2: Add both CI steps**

In `.github/workflows/ci.yml`, in the `quality` job, replace:

```yaml
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
```

with:

```yaml
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Secret scan
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ github.token }}
      - name: Migrations are append-only (packages/db/CLAUDE.md)
        if: github.event_name == 'pull_request'
        run: |
          git fetch --no-tags origin ${{ github.base_ref }}
          if ! git diff --diff-filter=MD --quiet origin/${{ github.base_ref }}...HEAD -- packages/db/migrations; then
            echo "::error::An APPLIED migration was modified or deleted. Migrations are"
            echo "::error::append-only and sha256-locked by the runner — editing one makes"
            echo "::error::`pnpm --filter @heliogrid/db migrate` refuse to run. Add a new file."
            git diff --diff-filter=MD --name-only origin/${{ github.base_ref }}...HEAD -- packages/db/migrations
            exit 1
          fi
          echo "migrations append-only: OK"
      - uses: pnpm/action-setup@v4
```

`fetch-depth: 0` is required — both gitleaks and the migration diff need history.

- [ ] **Step 3: Verify the guard logic locally against a simulated violation**

```bash
git checkout -b probe/append-only-check
printf -- "-- probe\n" >> packages/db/migrations/0001_foundation.sql
git add packages/db/migrations/0001_foundation.sql && git commit -q -m "probe: modify an applied migration"
git diff --diff-filter=MD --name-only main...HEAD -- packages/db/migrations
```

Expected: prints `packages/db/migrations/0001_foundation.sql` — the guard would fail this PR.

Note: appending here with `>>` is a shell redirect creating a probe commit that is immediately discarded, not an in-place stream edit of a tracked file you intend to keep — the constitution's ban targets `sed -i`-style rewriting. Discard it now:

```bash
git checkout main && git branch -D probe/append-only-check
```

- [ ] **Step 4: Verify the workflow parses**

```bash
python3 -c "import yaml; d=yaml.safe_load(open('.github/workflows/ci.yml')); \
steps=[s.get('name') or s.get('uses') or s.get('run','')[:40] for s in d['jobs']['quality']['steps']]; \
print(steps); assert any('append-only' in str(s) for s in steps); assert any('Secret scan' in str(s) for s in steps)"
```

Expected: prints the step list and both assertions pass.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
ci: migration append-only guard + gitleaks secret scan

VERIFIED: `git diff --diff-filter=MD` on a probe branch that appended to
0001_foundation.sql correctly names the file (Added files pass, Modified/Deleted fail);
workflow YAML parses with both steps present.

The PreToolUse hook guards the editing loop but cannot stop a human, another tool or a
rebase — this closes the merge gate. fetch-depth: 0 is required by both steps.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 25: OpenAPI freshness + breaking-change gate

**Files:**
- Create: `scripts/check-openapi-breaking.mjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:**
- Consumes: the `openapi` script in `packages/contracts`
- Produces: `node scripts/check-openapi-breaking.mjs` — `/contract-change` (Task 9) calls it by this exact path

CI emits `openapi.json` and uploads it as an artifact, but nothing diffs it. A stale committed copy and a breaking change both merge silently.

- [ ] **Step 1: Confirm both gaps**

```bash
grep -n "openapi" .github/workflows/ci.yml
ls packages/contracts/openapi/openapi.json
pnpm --filter @heliogrid/contracts openapi && git diff --stat packages/contracts/openapi/openapi.json
```

Expected: CI emits and uploads but never diffs; a fresh emit produces no diff today (so the committed copy is currently in sync — the gate locks that in).

- [ ] **Step 2: Write the failing test — a breaking contract change**

In `packages/contracts/src/auth.ts`, temporarily remove a field from a response schema — for example delete `name` from the `me` response object. Then:

```bash
pnpm --filter @heliogrid/contracts openapi
git diff --stat packages/contracts/openapi/openapi.json
```

Expected: the emitted file changes. Removing a response field is a breaking change for every consumer.

- [ ] **Step 3: Write the checker**

Create `scripts/check-openapi-breaking.mjs`:

```js
#!/usr/bin/env node
/**
 * OpenAPI drift gate — two checks in one:
 *
 *   1. FRESHNESS: the committed openapi.json matches what the contract emits right now.
 *      A stale committed surface is a lie told to every reader.
 *   2. BREAKING CHANGES: the emitted surface introduces no breaking change against the
 *      base branch, via oasdiff.
 *
 * A genuinely intended break needs an owner ruling recorded in the module roadmap.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SPEC = join(ROOT, 'packages/contracts/openapi/openapi.json');
const BASE = process.env.OPENAPI_BASE_REF ?? 'origin/main';

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });

// ── 1. Freshness ──────────────────────────────────────────────────────────────
run('pnpm', ['--filter', '@heliogrid/contracts', 'openapi'], { stdio: 'inherit' });
const dirty = run('git', ['status', '--porcelain', '--', 'packages/contracts/openapi']).trim();
if (dirty) {
  console.error(
    '\nOPENAPI STALE: the committed openapi.json does not match what the contract emits.\n' +
      'Run `pnpm --filter @heliogrid/contracts openapi` and commit the result in the same\n' +
      'change as the contract edit (/contract-change step 2).\n',
  );
  process.exit(1);
}
console.log('openapi freshness OK — committed spec matches the contract');

// ── 2. Breaking changes vs the base branch ────────────────────────────────────
let baseSpec;
try {
  baseSpec = run('git', ['show', `${BASE}:packages/contracts/openapi/openapi.json`]);
} catch {
  console.log(`openapi breaking-change check skipped — no spec at ${BASE} (new file or shallow clone)`);
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), 'oasdiff-'));
const basePath = join(dir, 'base.json');
writeFileSync(basePath, baseSpec);

if (!existsSync(SPEC)) {
  console.error(`OPENAPI MISSING: expected ${SPEC}`);
  process.exit(1);
}

try {
  const out = run('oasdiff', ['breaking', basePath, SPEC, '--fail-on', 'ERR']);
  console.log(out.trim() || 'openapi breaking-change check OK — no breaking changes');
} catch (err) {
  console.error('\nOPENAPI BREAKING CHANGE vs ' + BASE + ':\n');
  console.error(err.stdout || err.message);
  console.error(
    '\nA breaking API change needs an owner ruling recorded in the module roadmap before\n' +
      'it merges. Additive changes (new optional fields, new endpoints) are not breaking.\n',
  );
  process.exit(1);
}
```

- [ ] **Step 4: Verify the freshness half fires**

With the breaking edit from Step 2 still in place but the spec **not** re-emitted:

```bash
git checkout packages/contracts/openapi/openapi.json
node scripts/check-openapi-breaking.mjs
```

Expected: FAIL with `OPENAPI STALE`. This is the half that catches "changed the contract, forgot to emit".

- [ ] **Step 5: Revert the probe and verify green**

```bash
git checkout packages/contracts/src/auth.ts packages/contracts/openapi/openapi.json
node scripts/check-openapi-breaking.mjs
```

Expected: `openapi freshness OK`, then either the breaking-change result or the skip message if `oasdiff` is not installed locally. Install it locally to exercise the second half:

```bash
brew install oasdiff 2>/dev/null || go install github.com/oasdiff/oasdiff@latest
node scripts/check-openapi-breaking.mjs
```

Expected: `openapi breaking-change check OK — no breaking changes`.

- [ ] **Step 6: Wire into CI and package.json — freshness in CI, breaking-change locally**

In `package.json`, add after the `check:anchors` entry:

```json
    "check:openapi": "node scripts/check-openapi-breaking.mjs",
```

In `.github/workflows/ci.yml`, replace:

```yaml
      - name: Emit OpenAPI (contract surface)
        run: pnpm --filter @heliogrid/contracts openapi
```

with:

```yaml
      - name: OpenAPI freshness (committed spec matches the contract)
        run: |
          pnpm --filter @heliogrid/contracts openapi
          git diff --exit-code packages/contracts/openapi/openapi.json
```

**CI runs the freshness half only** — three lines, no new binary to install. It catches the
common defect (changed the contract, forgot to emit) and costs nothing.

The oasdiff breaking-change half runs **locally, on demand**, via `/contract-change` — it
needs a Go binary and a base-ref fetch, which is real CI weight for a check that fires
rarely and is best read by a human anyway. The script already skips cleanly when `oasdiff`
is absent, so `pnpm check:openapi` degrades to the freshness check on any machine without
it.

- [ ] **Step 7: Commit**

```bash
git add scripts/check-openapi-breaking.mjs package.json .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
feat(gates): OpenAPI freshness in CI; oasdiff breaking-change check on demand

VERIFIED: editing a response schema without re-emitting fails with OPENAPI STALE;
reverting passes freshness; with oasdiff installed the breaking-change half reports clean
against main, and the script skips cleanly without it.

CI previously emitted openapi.json and uploaded it as an artifact without ever diffing it,
so a stale committed surface merged silently. CI now runs the freshness half as three
lines with no new binary; the heavier oasdiff comparison runs locally via
/contract-change, where a human reads it.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 26: Roadmap evidence linter

**Files:**
- Create: `scripts/check-roadmaps.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `docs/modules/*.md` roadmaps and `docs/modules/README.md`
- Produces: `node scripts/check-roadmaps.mjs` — `/pr` (Task 10) calls it by this path

P5: evidence beats assertion. A VERIFIED row with an empty Evidence cell is an assertion.

- [ ] **Step 1: Confirm the current roadmap shape**

```bash
grep -n "VERIFIED" docs/modules/auth-tenancy.md | head -5
grep -n "^| # | Task" docs/modules/auth-tenancy.md
```

Expected: task-table rows with a Status column containing `VERIFIED` and an Evidence column. Confirm the existing VERIFIED rows genuinely carry evidence — they should (tasks 0–2 cite curl/browser/simulator runs).

- [ ] **Step 2: Write the failing test — a VERIFIED row with no evidence**

Append a probe row to the task table in `docs/modules/auth-tenancy.md`:

```markdown
| 99 | Probe row | api | D5 | — | VERIFIED | |
```

- [ ] **Step 3: Write the linter**

Create `scripts/check-roadmaps.mjs`:

```js
#!/usr/bin/env node
/**
 * Module roadmap linter.
 *
 * "VERIFIED" is the repo's strongest claim: it asserts someone ran the thing and watched
 * it work. A VERIFIED row with an empty Evidence cell is an assertion wearing a claim's
 * clothes (docs/foundation-redesign.md P5). This makes the distinction mechanical.
 *
 * Also checks that every roadmap is listed in docs/modules/README.md, so a module cannot
 * exist without appearing in the index agents read to find work.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIR = join(ROOT, 'docs/modules');
const VALID_STATUS = ['todo', 'in-progress', 'blocked', 'VERIFIED'];

const failures = [];
const roadmaps = readdirSync(DIR).filter(
  (f) => f.endsWith('.md') && !['README.md', '_template.md', 'forward-compat.md'].includes(f),
);

if (!roadmaps.length) {
  console.log('roadmap linter: no module roadmaps yet');
  process.exit(0);
}

const indexText = existsSync(join(DIR, 'README.md'))
  ? readFileSync(join(DIR, 'README.md'), 'utf8')
  : '';

for (const file of roadmaps) {
  const moduleName = file.replace(/\.md$/, '');
  const lines = readFileSync(join(DIR, file), 'utf8').split('\n');

  if (indexText && !indexText.includes(moduleName)) {
    failures.push(`docs/modules/README.md does not list "${moduleName}"`);
  }

  lines.forEach((line, i) => {
    if (!line.startsWith('|')) return;
    const cells = line.split('|').map((c) => c.trim());
    // | # | Task | Layer(s) | Traces to | Depends on | Status | Evidence |
    if (cells.length < 9) return;                       // not a task row
    if (!/^[0-9]+$/.test(cells[1])) return;             // header or separator
    const status = cells[6];
    const evidence = cells[7];
    const where = `docs/modules/${file}:${i + 1}`;

    const known = VALID_STATUS.some((s) => status.startsWith(s));
    if (!known) {
      failures.push(`${where}  task ${cells[1]}: status "${status}" is not one of ${VALID_STATUS.join(' · ')}`);
    }
    if (status === 'VERIFIED' && !evidence) {
      failures.push(
        `${where}  task ${cells[1]}: VERIFIED with an EMPTY Evidence cell. ` +
          'Record what you ran, on what surface, and what you saw — or set the status back.',
      );
    }
    if (status.startsWith('blocked') && !/blocked\(.+\)/.test(status)) {
      failures.push(`${where}  task ${cells[1]}: blocked status must name the reason — blocked(<reason>)`);
    }
  });
}

if (failures.length) {
  console.error(`\nROADMAP FAILURES (${failures.length}):\n`);
  for (const f of failures) console.error('  ' + f);
  console.error('');
  process.exit(1);
}
console.log(`roadmap linter OK — ${roadmaps.length} module roadmap(s) consistent`);
```

- [ ] **Step 4: Run to verify it CATCHES the evidence-free row**

```bash
node scripts/check-roadmaps.mjs
```

Expected: FAIL naming `task 99: VERIFIED with an EMPTY Evidence cell`.

- [ ] **Step 5: Remove the probe and verify green**

Delete the probe row from `docs/modules/auth-tenancy.md`, then:

```bash
node scripts/check-roadmaps.mjs
```

Expected: PASS — `roadmap linter OK — 1 module roadmap(s) consistent`. If a real VERIFIED row fails, that row was overclaiming: either add its evidence or lower its status.

- [ ] **Step 6: Add the script entry**

In `package.json`, add after `check:openapi`:

```json
    "check:roadmaps": "node scripts/check-roadmaps.mjs",
```

- [ ] **Step 7: Commit**

```bash
git add scripts/check-roadmaps.mjs package.json docs/modules/auth-tenancy.md
git commit -m "$(cat <<'EOF'
feat(gates): roadmap evidence linter — VERIFIED must carry evidence

VERIFIED by deliberate violation: a probe row `| 99 | Probe | … | VERIFIED | |` fails with
its file and line; removing it leaves the existing auth-tenancy roadmap green (tasks 0-2
already cite real curl/browser/simulator evidence).

Also enforces the status vocabulary (todo · in-progress · blocked(reason) · VERIFIED),
requires blocked rows to name their reason, and requires every roadmap to appear in
docs/modules/README.md.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 27: Dead code and clone detection (local tools, not CI)

**Files:**
- Create: `knip.json`
- Create: `.jscpd.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing
- Produces: `pnpm check:unused` and `pnpm check:dupes` — local commands, deliberately not CI steps

These are hygiene tools a human runs during a cleanup pass, not gates. Wiring them into CI on day one against pre-existing duplication would produce a step that either always fails or never can — both are noise.

- [ ] **Step 1: Install both at exact pins**

```bash
pnpm add -Dw knip@5.64.4 jscpd@4.0.5
grep -nE "knip|jscpd" package.json
```

Verify no `^` prefixes. Substitute current versions if these are stale, but pin exactly.

- [ ] **Step 2: Configure knip**

Create `knip.json`:

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    "packages/*": { "entry": ["src/index.ts", "build.ts"], "project": "src/**/*.ts" },
    "apps/api": { "entry": ["src/main.ts", "src/scripts/*.ts"], "project": "src/**/*.ts" },
    "apps/worker": { "entry": ["src/main.ts"], "project": "src/**/*.ts" },
    "apps/web": { "entry": ["app/**/page.tsx", "app/**/layout.tsx"], "project": "{app,lib}/**/*.{ts,tsx}" },
    "apps/mobile": { "entry": ["index.js", "App.tsx"], "project": "src/**/*.{ts,tsx}" },
    "tests/invariants": { "entry": ["src/run.ts"], "project": "src/**/*.ts" }
  },
  "ignoreDependencies": ["@heliogrid/config"],
  "ignore": ["**/dist/**", "**/.next/**", "packages/i18n/src/locales/**"]
}
```

- [ ] **Step 3: Configure jscpd**

Create `.jscpd.json`:

```json
{
  "threshold": 12,
  "reporters": ["consoleFull"],
  "absolute": true,
  "gitignore": true,
  "minLines": 12,
  "minTokens": 80,
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/*.d.ts",
    "packages/i18n/src/locales/**",
    "apps/web/app/design/**",
    "apps/mobile/src/screens/gallery/**"
  ],
  "format": ["typescript", "tsx"]
}
```

The two galleries are ignored deliberately: they are intentional mirrors of each other, and
that mirroring is the parity-detection instrument, not a defect. The `packages/ui` ↔
`apps/mobile/src/ui` duplication is **not** ignored — Task 32 addresses it properly, and
until then the number should stay visible.

- [ ] **Step 4: Establish the baseline**

```bash
./node_modules/.bin/knip --no-exit-code
./node_modules/.bin/jscpd --config .jscpd.json apps packages || true
```

Record both numbers in the commit message. Expected: knip finds some unused exports (the
placeholder screens especially); jscpd reports the web/RN UI mirror clones. **Do not fix
these now** — Task 32 handles the structural half and the rest is future cleanup.

- [ ] **Step 5: Add the scripts**

In `package.json`, add after `check:roadmaps`:

```json
    "check:dupes": "jscpd --config .jscpd.json apps packages",
    "check:unused": "knip"
```

- [ ] **Step 6: Keep these OUT of CI — they are local hygiene tools**

Do **not** add a CI step. A `continue-on-error` gate that never fails the build is
decoration: it costs minutes on every run and teaches everyone to scroll past it. These two
are for a human deciding to clean up — run them during a cleanup pass or when `/lenses`
flags duplication:

```bash
pnpm check:unused    # what is dead
pnpm check:dupes     # what is copy-pasted
```

Record the current baseline in the commit message so the next cleanup has a number to beat.
If duplication becomes a recurring review finding, promote `check:dupes` to a blocking CI
step **then** — with a threshold the codebase already meets.

- [ ] **Step 7: Commit**

```bash
git add knip.json .jscpd.json package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore: knip + jscpd as local hygiene tools (deliberately not in CI)

VERIFIED: both run and produce a baseline (record the counts here when running this task).

Kept out of CI on purpose. A continue-on-error step that can never fail the build is
decoration — it costs time on every run and trains everyone to scroll past it. These are
for a human doing a cleanup pass; promote check:dupes to blocking later, if and when the
codebase already meets a threshold.

The two galleries are ignored (their mirroring IS the parity instrument); the
packages/ui ↔ apps/mobile/src/ui duplication is NOT ignored, so it stays visible until
Task 32 addresses it structurally.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 28: Contrast coverage derivation

**Files:**
- Modify: `packages/tokens/src/contrast.ts`
- Modify: `packages/tokens/build.ts`

**Interfaces:**
- Consumes: the existing `DECLARED_PAIRS` contrast gate
- Produces: a build failure when a UI component uses a foreground/background pairing nobody declared

The gate fails the build below WCAG floors — but only for pairs on a hand-curated list. A component using an undeclared combination is simply unchecked, so coverage silently erodes as `packages/ui` grows.

- [ ] **Step 1: Confirm the coverage gap**

```bash
grep -n "DECLARED_PAIRS" packages/tokens/src/contrast.ts | head -3
grep -c "DECLARED_PAIRS" packages/tokens/src/contrast.ts
grep -rohE "var\(--color-[a-z0-9-]+\)" packages/ui/src --include=*.css | sort -u | wc -l
```

Expected: a curated pair list, and a larger number of distinct colour tokens actually referenced in component CSS than the list covers.

- [ ] **Step 2: Write the failing test — an undeclared pairing**

Add to any component CSS in `packages/ui/src` a rule pairing two colour tokens that do not appear together in `DECLARED_PAIRS`, for example:

```css
.__probe { color: var(--color-text-muted); background: var(--color-surface-raised); }
```

(Substitute two real token names from the grep in Step 1 that are not already a declared pair.)

- [ ] **Step 3: Add usage derivation to the contrast gate**

In `packages/tokens/src/contrast.ts`, add an exported function that scans component CSS for co-occurring foreground/background token pairs and reports any that `DECLARED_PAIRS` does not cover:

```ts
/**
 * Coverage derivation.
 *
 * DECLARED_PAIRS is hand-curated, so a component using a fg/bg combination nobody declared
 * is simply unchecked — the gate under-covers silently as packages/ui grows. This scans the
 * component CSS for rules that set BOTH a colour and a background from tokens, and reports
 * any pairing that is not declared.
 */
export function findUndeclaredPairs(cssFiles: { path: string; text: string }[]): string[] {
  const undeclared = new Set<string>();
  const declared = new Set(DECLARED_PAIRS.map((p) => `${p.fg}|${p.bg}`));

  for (const { path, text } of cssFiles) {
    // Each rule body: capture colour and background-colour token references together.
    for (const block of text.matchAll(/\{([^}]*)\}/g)) {
      const body = block[1];
      const fg = body.match(/(?:^|[;\s])color:\s*var\((--[a-z0-9-]+)\)/i)?.[1];
      const bg = body.match(/background(?:-color)?:\s*var\((--[a-z0-9-]+)\)/i)?.[1];
      if (!fg || !bg) continue;
      if (!declared.has(`${fg}|${bg}`)) undeclared.add(`${fg} on ${bg}  (${path})`);
    }
  }
  return [...undeclared].sort();
}
```

- [ ] **Step 4: Fail the build on undeclared pairs**

In `packages/tokens/build.ts`, after the existing contrast check, read the component CSS and call the new function:

```ts
// Coverage: a pairing used by a component but never declared is unchecked, not safe.
const uiCssDir = resolve(__dirname, '../ui/src');
const cssFiles = existsSync(uiCssDir)
  ? readdirSync(uiCssDir, { recursive: true })
      .filter((f) => String(f).endsWith('.css'))
      .map((f) => ({ path: `packages/ui/src/${f}`, text: readFileSync(join(uiCssDir, String(f)), 'utf8') }))
  : [];
const undeclared = findUndeclaredPairs(cssFiles);
if (undeclared.length) {
  throw new Error(
    `tokens: ${undeclared.length} foreground/background pairing(s) used by components but ` +
      `not in DECLARED_PAIRS — they are UNCHECKED, not safe:\n  - ${undeclared.join('\n  - ')}\n\n` +
      'Add each to DECLARED_PAIRS with its WCAG floor (so the contrast gate covers it), or ' +
      'change the component to use a declared pairing.',
  );
}
console.log(`contrast coverage OK — every component fg/bg pairing is declared`);
```

Add the imports `readdirSync`, `readFileSync`, `existsSync`, `join`, `resolve` if not already present, and `findUndeclaredPairs` from `./src/contrast`.

- [ ] **Step 5: Run to verify it CATCHES the probe**

```bash
pnpm --filter @heliogrid/tokens build
```

Expected: FAIL naming the probe pairing and its file.

- [ ] **Step 6: Remove the probe; declare or fix any real findings**

Delete the probe CSS rule, then:

```bash
pnpm --filter @heliogrid/tokens build
```

Expected: PASS with `contrast coverage OK`. **If real components surface undeclared pairings, add them to `DECLARED_PAIRS` with their WCAG floors and verify each passes** — that is the gate doing its job on day one, and each addition is a real accessibility check gained.

- [ ] **Step 7: Commit**

```bash
git add packages/tokens
git commit -m "$(cat <<'EOF'
feat(gates): derive contrast coverage from component usage

VERIFIED by deliberate violation: an undeclared fg/bg pairing in a component CSS rule
fails the tokens build and names the file; removing it (and declaring any real pairings
found, with their WCAG floors) turns it green.

DECLARED_PAIRS was hand-curated, so a component using an undeclared combination was
unchecked rather than safe — coverage eroded silently as packages/ui grew. The gate now
knows what the components actually do.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

Tear down the Phase 3 database: `docker rm -f hg-gates`

---

### Task 29: PR template + full CI wiring

**Files:**
- Create: `.github/pull_request_template.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:**
- Consumes: every gate from Tasks 13–28
- Produces: `pnpm verify` — the single command `/pr` and CI both run. This is the Phase 3 acceptance gate.

- [ ] **Step 1: Inventory what must be wired**

```bash
node -e "const s=require('./package.json').scripts; console.log(Object.keys(s))"
grep -c "name:" .github/workflows/ci.yml
```

Expected: scripts include `check:anchors`, `check:openapi`, `check:roadmaps`, `check:dupes`, `check:unused`. Confirm each new gate from this phase has either a script or a CI step.

- [ ] **Step 2: Add the aggregate script**

In `package.json`, add:

```json
    "verify": "pnpm lint && pnpm boundaries && pnpm turbo typecheck && pnpm turbo test && pnpm turbo build && pnpm check:anchors && pnpm check:roadmaps"
```

Deliberately excluded from `verify`: `check:openapi` (needs a base ref and network), and
`check:unused` / `check:dupes` (cleanup tools, not gates). One command that always means the
same thing beats one that sometimes needs a network.

- [ ] **Step 3: Add the doc/roadmap gates to CI**

In `.github/workflows/ci.yml`, add after the i18n extract guard step:

```yaml
      - name: Doc anchors resolve (docs/17 §4 — the F3 gate)
        run: pnpm check:anchors
      - name: Roadmap evidence (VERIFIED rows must cite evidence)
        run: pnpm check:roadmaps
```

- [ ] **Step 4: Write the PR template**

Create `.github/pull_request_template.md`. Keep it short — a template long enough to skim
past is a template nobody fills in:

```markdown
## What changed

Roadmap task: `docs/modules/<module>.md` #<N> · Traces to: D<n>

<!-- One paragraph. Not a file list — the diff shows that. -->

## Checklist

- [ ] `pnpm verify` green
- [ ] Verified running (browser + both simulators for UI; curl/logs otherwise)
- [ ] Contract change landed first, OpenAPI re-emitted — or: no contract change
- [ ] Docs + roadmap updated in the same commit
- [ ] Web AND RN together (Law 7) — or an owner ruling in the roadmap

## Evidence

<!-- Specifics, not adjectives: "browser 375+1440 happy/wrong-code/send-error;
     iPhone 16 relaunch restores session; curl 409 ALREADY_ONBOARDED" — not "tested". -->

## Review findings & known limitations

<!-- Anything the five lenses surfaced that is worth a reviewer's attention, and what is
     deliberately not handled yet. Omitting the latter is how reviewers get surprised. -->
```

- [ ] **Step 5: Run the full verification**

```bash
pnpm verify
```

Expected: every gate PASSES. This is the first run of the complete gate set.

- [ ] **Step 6: Verify the CI workflow is complete and parses**

```bash
python3 -c "
import yaml
d=yaml.safe_load(open('.github/workflows/ci.yml'))
steps=[s.get('name') or s.get('uses') or s.get('run','')[:50] for s in d['jobs']['quality']['steps']]
print('\n'.join('  '+str(s) for s in steps))
need=['Secret scan','append-only','boundaries','Doc anchors','Roadmap evidence','OpenAPI freshness','extract guard']
missing=[n for n in need if not any(n in str(s) for s in steps)]
assert not missing, 'missing CI steps: '+str(missing)
banned=['knip','jscpd','oasdiff','playwright','continue-on-error']
present=[b for b in banned if any(b in str(s).lower() for s in steps)]
assert not present, 'CI should stay simple — remove: '+str(present)
print('\nall required gates present; no decorative steps')"
```

Expected: the full step list, then `all required gates present; no decorative steps`. The
second assertion is the guard against CI creep: cleanup tools, optional binaries and
never-failing steps stay out.

- [ ] **Step 7: Commit**

```bash
git add .github/pull_request_template.md .github/workflows/ci.yml package.json
git commit -m "$(cat <<'EOF'
feat(gates): PR template + CI wiring; `pnpm verify` runs the gate set

VERIFIED: `pnpm verify` green across lint (biome + oxlint + cruiser + sherif +
no-test-files), boundaries, typecheck, test (tenancy + table scan + enum parity), build,
doc anchors and roadmap evidence; a script asserts every required gate is present in
ci.yml AND that no decorative step (knip/jscpd/oasdiff/continue-on-error) has crept in.

CI stays deliberately small: install, lint, boundaries, typecheck, migrate, test, build,
openapi freshness, i18n extract, doc anchors, roadmap evidence, secret scan, append-only —
plus the existing android and ios build lanes. Cleanup tools and optional binaries run
locally. The PR template is short on purpose; a long one goes unfilled.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

**PHASE 3 GATE.** Every gate in the matrix has been observed going red on a deliberate violation and green on clean code. `pnpm verify` is the one command that runs them.

---

# PHASE 4 — Structural deduplication

**Owner-approved (decision ③):** `packages/domain` is created with ADR-0021, seeded with the shared login state machine, ₹/phone formatters, and the invite/role invariants.

**Why this is last:** it is the only phase that changes application architecture. It runs after the gates exist so the change is verified by them rather than by inspection.

---

### Task 30: ADR-0021 + the `packages/domain` skeleton

**Files:**
- Create: `docs/adr/0021-packages-domain.md`
- Create: `packages/domain/{package.json,tsconfig.json,CLAUDE.md,src/index.ts}`
- Modify: `docs/adr/README.md` (index row)

**Interfaces:**
- Consumes: the gate set from Phase 3
- Produces: `@heliogrid/domain` exporting from `src/index.ts`. Task 31 adds the login machine to it; Task 32 is independent. Package tag: `domain` (turbo boundaries — may depend only on `domain`).

`packages/domain` is currently a phantom: two dependency-cruiser rules target it, `turbo.json` has a `domain` boundaries tag, five per-package CLAUDE.mds point at it, and it does not exist. Either it becomes real or those eleven references get deleted. The owner chose real.

- [ ] **Step 1: Confirm the phantom references**

```bash
ls packages/
grep -n "packages/domain" .dependency-cruiser.cjs | head
grep -n '"domain"' turbo.json
grep -rn "packages/domain" apps/*/CLAUDE.md packages/*/CLAUDE.md
```

Expected: no `packages/domain` directory; two cruiser rules (`domain-purity-no-layers`, `domain-purity-no-frameworks`) matching nothing; a `domain` boundaries tag; five CLAUDE.md mentions treating it as the home for domain logic. Those two cruiser rules are **inert** — a green cruise today proves less than it appears to.

- [ ] **Step 2: Write the ADR**

Create `docs/adr/0021-packages-domain.md`:

```markdown
# ADR-0021 — packages/domain: the pure isomorphic domain layer

**Status:** Accepted (owner approval 2026-07-29)
**Date:** 2026-07-29

## Context

The original architecture (BLUEPRINT, now archived; docs/02) specified
`apps/* → packages/contracts → packages/domain` with `domain` as pure isomorphic TypeScript.
The package was never created. Eleven references treat it as load-bearing anyway: two
dependency-cruiser purity rules that match nothing, the `domain` turbo boundaries tag, and
five per-package CLAUDE.md files stating that business logic and shared formatters "belong
to packages/domain".

Meanwhile domain behaviour accumulated where it could: invite TTL and token hashing, the
redemption state machine and the LAST_OWNER invariant live in `apps/api` services, and the
login flow state machine is implemented **twice** — once in `apps/web/app/login/page.tsx`
and once in `apps/mobile/src/screens/login/LoginScreen.tsx` — with measurable behavioural
drift between them (different done-step dwell, different offline detection, differently
shaped failure unions).

Web and React Native must ship the same behaviour from the same slice (Law 7). Two
hand-maintained copies of a state machine cannot satisfy that, and every future flow
(signup, invite accept, each CRM screen) would replicate the pattern.

## Decision

Create `packages/domain` as pure isomorphic TypeScript.

**It may import:** nothing but TypeScript standard library and `packages/contracts` **types**.

**It may never import:** NestJS, React, React Native, any storage, any fetch client, any
environment read, `packages/db`, `packages/ui`, or any app. Rules, catalogs and market
configuration are **injected parameters, never module-level globals** — the POC's
`resolveRules()` singleton is the anti-pattern this rule exists to prevent.

Seeded with:
1. The login flow state machine as a pure reducer, consumed by both platforms (Task 31).
2. Shared formatters — ₹ Indian grouping (`formatInr`) and E.164 phone display.
3. The invite and role invariants currently embedded in `apps/api` service code.

## Consequences

- The two inert dependency-cruiser purity rules become live and meaningful.
- The eleven dangling references resolve.
- Platform-specific concerns (timers, navigation, storage, rendering) stay in the apps; only
  the decision logic is shared. This is deliberate — a shared *renderer* would require
  react-native-web and would break the bare-RN and pixel-fidelity constraints (ADR-0011).
- New domain logic has an obvious home, which is what stops it accreting in service classes.

## Rejected alternatives

- **Delete the eleven references instead.** Cheaper today, but leaves the login drift with
  nowhere to go and every future flow repeating it.
- **Share via `packages/contracts`.** Contracts is the wire format; putting behaviour there
  would couple the API surface to client state machines.
- **A shared component/renderer layer (react-native-web, Tamagui).** Conflicts with bare RN
  (ADR-0011) and with pixel fidelity to the design system. A true rebuild for marginal gain.
```

Add the index row to `docs/adr/README.md` following the existing format.

- [ ] **Step 3: Create the package**

`packages/domain/package.json`:

```json
{
  "name": "@heliogrid/domain",
  "version": "0.0.1",
  "private": true,
  "description": "Pure isomorphic domain logic — no framework, no storage, no env, no fetch (ADR-0021)",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": {
    "build": "tsc -b",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@heliogrid/config": "workspace:*",
    "typescript": "5.8.3"
  },
  "turbo": { "tags": ["domain"] }
}
```

`packages/domain/tsconfig.json` — copy the shape of `packages/contracts/tsconfig.json`, extending the shared node-package preset from `@heliogrid/config`.

`packages/domain/src/index.ts`:

```ts
/**
 * @heliogrid/domain — pure isomorphic domain logic (ADR-0021).
 *
 * Imports allowed: TypeScript stdlib and packages/contracts TYPES only.
 * Never: NestJS · React · React Native · storage · fetch · env reads · packages/db ·
 * packages/ui · any app. Rules, catalogs and market config are INJECTED parameters,
 * never module-level globals.
 *
 * dependency-cruiser enforces this (domain-purity-no-layers, domain-purity-no-frameworks) —
 * rules that were inert until this package existed.
 */
export {};
```

`packages/domain/CLAUDE.md`:

```markdown
# @heliogrid/domain — pure isomorphic domain logic

## What lives here / what must never live here
- Decision logic both platforms need: state machines as pure reducers, formatters,
  business invariants, calculations.
- NEVER: NestJS, React, React Native, storage, fetch, env reads, packages/db, packages/ui,
  or any app import. No side effects, no I/O, no clock reads at module scope.
- Rules, catalogs and market config arrive as INJECTED parameters. A module-level global
  (the POC's `resolveRules()` pattern) is the specific anti-pattern this package exists
  to prevent.

## Commands
pnpm --filter @heliogrid/domain typecheck | build

## Depends on / depended on by
uses: packages/contracts (types only)     used by: apps/web, apps/mobile, apps/api, apps/worker

## Local conventions
- Reducers are `(state, event) => state` — total, synchronous, no timers. The APP owns
  timers, navigation, storage and rendering; the reducer owns the decision.
- Time enters as a parameter (`now: number`), never `Date.now()` inside a reducer — this is
  what makes behaviour testable and what stops RN's suspended-timer bug from being a
  platform special case.
- Every exported symbol is re-exported from `src/index.ts` (dependency-cruiser
  `package-index-only`).

## Definition of done here
Pure (cruiser purity rules green) · consumed by BOTH platforms where a mobile surface
exists (Law 7) · `pnpm turbo typecheck lint` green.
```

- [ ] **Step 4: Install and verify the purity rules are now live**

```bash
pnpm install
pnpm --filter @heliogrid/domain typecheck
./node_modules/.bin/dependency-cruiser --config .dependency-cruiser.cjs apps packages tests
pnpm boundaries
```

Expected: all pass. The cruiser now has a real `packages/domain/` to cruise.

- [ ] **Step 5: Prove the purity rules actually fire**

```bash
cat > packages/domain/src/__purity_probe.ts <<'EOF'
import { Injectable } from '@nestjs/common';
export const probe = Injectable;
EOF
./node_modules/.bin/dependency-cruiser --config .dependency-cruiser.cjs apps packages tests
rm packages/domain/src/__purity_probe.ts
```

Expected: FAIL with `domain-purity-no-frameworks`. **This is the first time that rule has ever fired** — before this task it targeted a directory that did not exist.

- [ ] **Step 6: Verify and commit**

```bash
pnpm verify
git add docs/adr/0021-packages-domain.md docs/adr/README.md packages/domain pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(domain): create packages/domain per ADR-0021 — the phantom becomes real

VERIFIED: pnpm verify green; a probe importing @nestjs/common into packages/domain fails
domain-purity-no-frameworks — the FIRST time that rule has ever fired, since it targeted
a directory that did not exist.

Eleven references (2 inert cruiser rules, the turbo `domain` tag, 5 per-package CLAUDE.md
mentions, 3 in the old constitution) treated this package as load-bearing while domain
behaviour accumulated in apps/api services and the login machine was implemented twice.
ADR-0021 records the decision and the rejected alternatives.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 31: Extract the login state machine

**Files:**
- Create: `packages/domain/src/auth/login-machine.ts`
- Modify: `packages/domain/src/index.ts`
- Modify: `apps/web/app/login/page.tsx`
- Modify: `apps/mobile/src/screens/login/LoginScreen.tsx`
- Modify: `docs/modules/auth-tenancy.md` (record the timing ruling)

**Interfaces:**
- Consumes: `@heliogrid/domain` (Task 30)
- Produces: `loginReducer`, `initialLoginState`, `LoginState`, `LoginEvent`, `RESEND_SECONDS`, `AUTO_VERIFY_DELAY_MS`, `DONE_DWELL_MS` — imported by both login screens

**Measured drift being fixed:** done-step dwell 1400ms (web) vs 900ms (RN); offline detection via `navigator.onLine` (web) vs local state (RN); failure unions `'mismatch' | 'verify-failed' | 'resend-failed'` (web) vs `'mismatch' | 'transport'` plus a separate offline flag (RN).

- [ ] **Step 1: Confirm the drift precisely**

```bash
grep -n "RESEND_SECONDS\|DONE_REDIRECT_DWELL_MS\|AUTO_VERIFY_DELAY_MS\|CALL_OFFER_AFTER_RESENDS" apps/web/app/login/page.tsx
grep -n "RESEND_SECONDS\|DONE_DWELL_MS\|AUTO_VERIFY_DELAY_MS\|CALL_OFFER" apps/mobile/src/screens/login/LoginScreen.tsx
grep -n "OtpFailure\|otpFailure" apps/web/app/login/page.tsx apps/mobile/src/screens/login/LoginScreen.tsx | head -6
wc -l apps/web/app/login/page.tsx apps/mobile/src/screens/login/LoginScreen.tsx
```

Expected: `RESEND_SECONDS = 30` and `AUTO_VERIFY_DELAY_MS = 140` agree; the dwell constants differ (1400 vs 900); the failure unions differ in name and shape; the files are ~388 and ~441 lines.

- [ ] **Step 2: Record the timing ruling before changing behaviour**

The dwell difference is a **user-visible behavioural decision**, not an implementation detail — it must be a recorded ruling, not a silent unification. Add to the "Module rulings" section of `docs/modules/auth-tenancy.md`:

```markdown
4. **Done-step dwell unified at 1400ms** (2026-07-29, ADR-0021 extraction — owner may veto).
   Web used 1400ms and RN 900ms; the drift was invisible because the state machine was
   implemented twice. 1400ms is adopted as canonical: the success state needs long enough
   to register before the screen changes under the user, and it is the value that was
   verified against the mockup's motion spec. RN's dwell changes 900 → 1400ms.
```

- [ ] **Step 3: Write the reducer**

Create `packages/domain/src/auth/login-machine.ts`:

```ts
/**
 * Phone-OTP login flow — the decision logic, shared by web and React Native (ADR-0021).
 *
 * This reducer owns WHAT happens; each app owns HOW: timers, navigation, storage, network
 * and rendering stay in the app. Time enters as a parameter — never `Date.now()` in here —
 * which is what lets RN drive the countdown from wall-clock (its timers suspend while
 * backgrounded) while web drives it from an interval, without the two behaving differently.
 *
 * Before this existed the machine was implemented twice and had already drifted: done-step
 * dwell 1400ms vs 900ms, different offline detection, differently shaped failure unions.
 */

export const RESEND_SECONDS = 30;
export const AUTO_VERIFY_DELAY_MS = 140;
/** Unified 2026-07-29 (auth-tenancy module ruling 4; web 1400 adopted over RN 900). */
export const DONE_DWELL_MS = 1400;
export const CALL_OFFER_AFTER_RESENDS = 2;

export type LoginStep = 'phone' | 'otp' | 'done';

/** One union for both platforms. `offline` is a failure, not a parallel boolean. */
export type LoginFailure = 'mismatch' | 'send-failed' | 'verify-failed' | 'offline';

export interface LoginState {
  step: LoginStep;
  phone: string;
  otp: string;
  /** Increments on each resend so the OTP input remounts and stale responses are ignored. */
  otpEpoch: number;
  sending: boolean;
  verifying: boolean;
  failure: LoginFailure | null;
  /** Seconds until resend is allowed; 0 means allowed. */
  secondsLeft: number;
  resendCount: number;
  callRequested: boolean;
  online: boolean;
}

export type LoginEvent =
  | { type: 'phone-changed'; phone: string }
  | { type: 'send-requested' }
  | { type: 'send-succeeded' }
  | { type: 'send-failed'; offline: boolean }
  | { type: 'otp-changed'; otp: string }
  | { type: 'verify-requested' }
  | { type: 'verify-succeeded' }
  | { type: 'verify-failed'; reason: 'mismatch' | 'transport'; offline: boolean }
  | { type: 'resend-requested' }
  | { type: 'tick'; secondsLeft: number }
  | { type: 'call-requested' }
  | { type: 'connectivity-changed'; online: boolean };

export const initialLoginState: LoginState = {
  step: 'phone',
  phone: '',
  otp: '',
  otpEpoch: 0,
  sending: false,
  verifying: false,
  failure: null,
  secondsLeft: RESEND_SECONDS,
  resendCount: 0,
  callRequested: false,
  online: true,
};

/** Total, synchronous, side-effect free. */
export function loginReducer(state: LoginState, event: LoginEvent): LoginState {
  switch (event.type) {
    case 'phone-changed':
      return { ...state, phone: event.phone, failure: null };

    case 'send-requested':
      if (state.sending) return state;              // in-flight guard: no double-submit
      return { ...state, sending: true, failure: null };

    case 'send-succeeded':
      return {
        ...state,
        sending: false,
        step: 'otp',
        otp: '',
        otpEpoch: state.otpEpoch + 1,
        secondsLeft: RESEND_SECONDS,
        failure: null,
      };

    case 'send-failed':
      return { ...state, sending: false, failure: event.offline ? 'offline' : 'send-failed' };

    case 'otp-changed':
      return { ...state, otp: event.otp, failure: state.failure === 'mismatch' ? null : state.failure };

    case 'verify-requested':
      if (state.verifying) return state;            // in-flight guard
      return { ...state, verifying: true, failure: null };

    case 'verify-succeeded':
      return { ...state, verifying: false, step: 'done', failure: null };

    case 'verify-failed':
      return {
        ...state,
        verifying: false,
        otp: '',
        otpEpoch: state.otpEpoch + 1,              // remount clears the input
        failure: event.offline ? 'offline' : event.reason === 'mismatch' ? 'mismatch' : 'verify-failed',
      };

    case 'resend-requested':
      if (state.secondsLeft > 0 || state.sending) return state;
      return { ...state, sending: true, resendCount: state.resendCount + 1, failure: null };

    case 'tick':
      return { ...state, secondsLeft: Math.max(0, event.secondsLeft) };

    case 'call-requested':
      return { ...state, callRequested: true };

    case 'connectivity-changed':
      return {
        ...state,
        online: event.online,
        failure: event.online && state.failure === 'offline' ? null : state.failure,
      };

    default: {
      const _exhaustive: never = event;
      return state;
    }
  }
}

/** Derived: the call-me escalation appears only after enough resends have failed. */
export function shouldOfferCall(state: LoginState): boolean {
  return state.resendCount >= CALL_OFFER_AFTER_RESENDS && !state.callRequested;
}

/** Derived: resend is allowed only when the countdown has elapsed and nothing is in flight. */
export function canResend(state: LoginState): boolean {
  return state.secondsLeft === 0 && !state.sending && !state.verifying;
}
```

- [ ] **Step 4: Export it**

Replace the contents of `packages/domain/src/index.ts`'s export line with:

```ts
export * from './auth/login-machine';
```

(keeping the file's existing header comment).

- [ ] **Step 5: Consume it from both screens**

In `apps/web/app/login/page.tsx`: delete the local constants (`RESEND_SECONDS`,
`AUTO_VERIFY_DELAY_MS`, `DONE_REDIRECT_DWELL_MS`, `CALL_OFFER_AFTER_RESENDS`), the local
`OtpFailure` type, and the individual `useState` calls that the reducer now owns. Replace
with `useReducer(loginReducer, initialLoginState)` and dispatch the events. Keep in the
component: the router push, `navigator.onLine` listeners (dispatching
`connectivity-changed`), the countdown interval (dispatching `tick`), the auto-verify
`setTimeout`, and all rendering.

In `apps/mobile/src/screens/login/LoginScreen.tsx`: the same substitution. Keep the RN
specifics — the wall-clock countdown (compute `secondsLeft` from a stored end timestamp and
dispatch `tick`, so backgrounding cannot stall it), `KeyboardAvoidingView`, the `onSignedIn`
call after `DONE_DWELL_MS`, and all rendering. The `stepRef` stale-response guard is now
handled by `otpEpoch` — compare the epoch at request time against the current epoch before
dispatching a response event.

Both screens import from `@heliogrid/domain`, and both add `"@heliogrid/domain": "workspace:*"` to their `package.json` dependencies.

- [ ] **Step 6: Verify the machine is genuinely shared and the drift is gone**

```bash
pnpm install
grep -c "RESEND_SECONDS = \|DONE_DWELL_MS = \|DONE_REDIRECT_DWELL_MS = \|AUTO_VERIFY_DELAY_MS = " \
  apps/web/app/login/page.tsx apps/mobile/src/screens/login/LoginScreen.tsx
grep -n "@heliogrid/domain" apps/web/app/login/page.tsx apps/mobile/src/screens/login/LoginScreen.tsx
pnpm verify
```

Expected: **zero** local constant definitions in either screen (they import them); both import from `@heliogrid/domain`; `pnpm verify` green. The drift is now dead by construction — there is one definition to drift from.

- [ ] **Step 7: Verify by running both platforms**

Run `/verify-app` for the login flow on web and **both** simulators. Walk: happy path,
wrong code, resend countdown, call-me offer after two resends, send error, offline. Confirm
the done-step dwell now feels identical on all three surfaces (1400ms).

Capture the evidence for the roadmap row.

- [ ] **Step 8: Commit**

```bash
git add packages/domain apps/web apps/mobile docs/modules/auth-tenancy.md pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
refactor(domain): one login state machine, consumed by web and RN

VERIFIED: pnpm verify green; zero local flow constants remain in either screen (both
import from @heliogrid/domain); login walked on browser + both simulators through happy /
wrong-code / resend / call-offer / send-error / offline paths with identical behaviour.

Kills the measured drift between two hand-maintained copies: done-step dwell 1400 vs
900ms, `navigator.onLine` vs local-state offline detection, and failure unions that
differed in both name and shape. Unified dwell is 1400ms — recorded as auth-tenancy module
ruling 4 (owner may veto) because it is user-visible, not an implementation detail.

Time enters the reducer as a parameter, so RN keeps its wall-clock countdown (its timers
suspend while backgrounded) without that becoming a behavioural difference.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 32: Component API parity check

**Files:**
- Create: `packages/ui-api/{package.json,tsconfig.json,src/index.ts}`
- Create: `packages/ui-api/src/parity.test-d.ts`
- Modify: `packages/ui/src/index.ts` and `apps/mobile/src/ui/index.ts` (satisfies assertions)

**Interfaces:**
- Consumes: nothing from Tasks 30–31
- Produces: a compile error when one platform's component prop types diverge from the other's

25 component APIs are hand-mirrored across `packages/ui` and `apps/mobile/src/ui` with parity checked by humans comparing two galleries. The `StatusChip` incident already happened once — optional label with an English fallback on web, required on RN — and was fixed by prose.

**Explicitly rejected:** unifying via react-native-web or Tamagui. That conflicts with bare RN (ADR-0011) and pixel fidelity, and would be a true rebuild for marginal gain. Only the *shared surface* (prop types) gets a single source of truth; rendering stays platform-specific.

- [ ] **Step 1: Confirm the duplication and find a real divergence**

```bash
ls packages/ui/src/**/*.tsx | wc -l
ls apps/mobile/src/ui/**/*.tsx | wc -l
grep -rn "interface ButtonProps" -A 12 packages/ui/src apps/mobile/src/ui
grep -rn "parity\|api-parity" --include=*.json --include=*.ts . --exclude-dir=node_modules || echo "no parity tooling exists"
```

Expected: ~25 components each side, near-identical prop interfaces, and no parity tooling.

- [ ] **Step 2: Create the types-only package**

`packages/ui-api/package.json`:

```json
{
  "name": "@heliogrid/ui-api",
  "version": "0.0.1",
  "private": true,
  "description": "Types-only component API contract — the single source of truth both UI implementations must satisfy",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc -p tsconfig.json --noEmit" },
  "devDependencies": {
    "@heliogrid/config": "workspace:*",
    "typescript": "5.8.3"
  },
  "turbo": { "tags": ["contracts"] }
}
```

Tagged `contracts` (not `ui`) because it is a type contract with no rendering and no token
dependency — it must be importable from both the web package and the mobile app.

`packages/ui-api/src/index.ts` — declare the shared surface for each component, importing
business enums from `@heliogrid/contracts` so a new contract value breaks both platforms:

```ts
/**
 * The component API contract.
 *
 * packages/ui (web DOM+CSS) and apps/mobile/src/ui (RN StyleSheet) render differently by
 * necessity — that split is legitimate and stays. What must NOT differ is the prop surface:
 * a prop added on one platform used to ship silently absent on the other, checked only by
 * humans comparing two galleries (the StatusChip optional-label incident).
 *
 * Each implementation asserts `satisfies` against these types, so divergence is a compile
 * error in the platform that drifted.
 */
import type { WorkflowStatus } from '@heliogrid/contracts';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonApi {
  /** Required — optional-with-English-fallback is banned for anything user-visible. */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
}

export interface StatusChipApi {
  status: WorkflowStatus;
  /** Required on BOTH platforms — the divergence this package exists to prevent. */
  label: string;
}

/* … one interface per component in the 25-component set … */

/** The shape every implementation index must satisfy. */
export interface ComponentApiSurface {
  Button: ButtonApi;
  StatusChip: StatusChipApi;
  /* … */
}
```

Declare all 25 components. Where the platforms legitimately differ (e.g. web `type="submit"`,
RN `hitSlop`), those props stay in the platform files and are simply absent here — this
package declares the **shared** surface, not the union.

- [ ] **Step 3: Write the failing test — assert both implementations satisfy the contract**

Add to `packages/ui/src/index.ts` (and the mirror in `apps/mobile/src/ui/index.ts`):

```ts
import type { ComponentApiSurface } from '@heliogrid/ui-api';

/**
 * Parity assertion (ADR-0021 era). If this stops compiling, this platform's component API
 * has drifted from the shared contract in packages/ui-api — fix the props, not this line.
 */
type _ApiParity = {
  Button: React.ComponentProps<typeof Button>;
  StatusChip: React.ComponentProps<typeof StatusChip>;
  /* … one entry per component … */
} extends Record<keyof ComponentApiSurface, unknown>
  ? true
  : never;
const _apiParityHolds: _ApiParity = true;
void _apiParityHolds;
```

Add `"@heliogrid/ui-api": "workspace:*"` to both packages' dependencies.

- [ ] **Step 4: Prove the check fires on a real divergence**

Temporarily make `label` optional in the web `StatusChip` props — reproducing the exact
historical incident:

```bash
pnpm install
pnpm turbo typecheck
```

Expected: FAIL — the web implementation no longer satisfies `StatusChipApi`, and the error
names `StatusChip`. **This is the check the galleries could not perform.**

- [ ] **Step 5: Revert and verify green**

Restore the required `label`, then:

```bash
pnpm turbo typecheck && pnpm boundaries && pnpm lint
```

Expected: all PASS.

- [ ] **Step 6: Verify the boundaries allow the new package**

```bash
pnpm boundaries
grep -n '"contracts"' turbo.json
```

Expected: pass — `ui` may depend on `contracts`-tagged packages, and `app` may depend on both.

- [ ] **Step 7: Commit**

```bash
git add packages/ui-api packages/ui apps/mobile pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(ui): types-only parity contract for the 25-component API

VERIFIED by deliberate violation: making `label` optional on the web StatusChip — the
exact historical incident — fails typecheck naming StatusChip; restoring it passes
typecheck, boundaries and lint.

Parity was previously checked by humans comparing two galleries, so a prop added on one
platform could ship silently absent on the other. Rendering stays platform-specific
(CSS vs StyleSheet) — react-native-web/Tamagui unification was rejected: it conflicts with
bare RN (ADR-0011) and pixel fidelity, and would be a rebuild for marginal gain.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 33: Auth verification replay script

**Files:**
- Create: `scripts/auth-e2e-replay.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: the dev `OtpPort` fallback in `apps/api`
- Produces: `pnpm verify:auth` — an on-demand replay, run by a human or by `/verify-app`

**This is a verification script, not a test file.** It lives in `scripts/`, it is not named
`.spec` or `.test`, it introduces no test framework, and it is **not wired into CI** — it
needs a running API and a database, which is exactly the CI weight the owner asked to avoid.
It replaces the manual curl session that commit `a66a4c3` recorded in prose: the same
sequence, runnable in one command, so the next person verifying auth does not re-derive it.

Run it when touching auth, before claiming an auth slice VERIFIED, or when a regression is
suspected.

- [ ] **Step 1: Confirm the dev OTP seam exists**

```bash
grep -rn "DevLogOtp\|dev fallback\|DLT-pending" apps/api/src/modules/auth/ | head -5
grep -n "sendOtp\|verify" packages/contracts/src/auth.ts | head -8
```

Expected: a dev `OtpPort` adapter that logs the OTP instead of sending SMS (DLT registration is still pending), and the contract routes the script will drive.

- [ ] **Step 2: Write the replay script**

Create `scripts/auth-e2e-replay.ts` driving the full path against a running API:

1. `POST` send-OTP for a fresh E.164 phone number.
2. Read the OTP from the dev adapter (log line or dev-only endpoint — use whichever the adapter exposes).
3. Verify the OTP; assert a session cookie comes back.
4. `GET /me`; assert `401`-free and no tenant yet.
5. `completeOnboarding`; assert success.
6. `completeOnboarding` **again**; **assert `409` with code `ALREADY_ONBOARDED`** — this is the exact regression that shipped as a silent `500` with the right code in the body, caught only by an end-to-end curl (`apps/api/CLAUDE.md` landmine). Typecheck was green at the time.
7. `listTeam`; assert the caller appears with the `owner` role.
8. Create an invite, accept it as a second phone, assert role assignment.
9. Assert the last-owner invariant: attempting to remove the only owner returns `422 LAST_OWNER`.
10. Clean up the created tenant.

Each assertion prints PASS/FAIL with the actual response; the script exits non-zero on the first failure.

- [ ] **Step 3: Run it against a local API and verify it passes**

```bash
docker run --rm -d --name hg-e2e -e POSTGRES_USER=heliogrid -e POSTGRES_PASSWORD=heliogrid \
  -e POSTGRES_DB=heliogrid_ci -p 55432:5432 postgres:16
sleep 5
export DATABASE_URL=postgres://heliogrid:heliogrid@localhost:55432/heliogrid_ci
export DATABASE_ADMIN_URL=$DATABASE_URL
pnpm --filter @heliogrid/db migrate
pnpm --filter @heliogrid/api dev &
sleep 10
pnpm verify:auth
```

Expected: every step PASSES, including the `409 ALREADY_ONBOARDED` assertion.

- [ ] **Step 4: Prove it catches the historical regression**

Temporarily change the `completeOnboarding` conflict path to throw a bare
`ConflictException` instead of `ContractException` with the explicit status — recreating the
shipped bug:

```bash
pnpm verify:auth
```

Expected: FAIL at step 6, showing a `500` where `409 ALREADY_ONBOARDED` was expected.
**This is the regression that typecheck could not see.** Revert the change and re-run to
confirm green.

- [ ] **Step 5: Add the script entry (no CI wiring)**

In `package.json`:

```json
    "verify:auth": "tsx scripts/auth-e2e-replay.ts"
```

Deliberately **not** added to `pnpm verify` and **not** added to `ci.yml`: it needs a
running API and a live database. Booting a server inside CI to replay one flow is the kind
of weight that makes a pipeline slow and flaky, and it would partly duplicate what the
invariants already prove about the database. The script's value is that a human runs one
command instead of re-deriving nine curls.

Reference it from `.claude/skills/verify-app/SKILL.md` under the API section so it is found
when it is needed.

- [ ] **Step 6: Tear down and commit**

```bash
kill %1 2>/dev/null; docker rm -f hg-e2e
git add scripts/auth-e2e-replay.ts package.json .claude/skills/verify-app/SKILL.md
git commit -m "$(cat <<'EOF'
feat(scripts): auth verification replay — one command instead of nine manual curls

VERIFIED: full path green against a local API (send OTP then verify, me, onboard,
duplicate onboard, team, invite, accept, last-owner invariant). Reverting
completeOnboarding to a bare ConflictException makes step 6 FAIL with 500 where
409 ALREADY_ONBOARDED was expected — reproducing the exact bug that shipped once with a
green typecheck and was caught only by a manual curl.

Not a test file and not in CI: it lives in scripts/, introduces no test framework, and
needs a running API plus a database. It replaces the manual session commit a66a4c3
recorded in prose, so the next person verifying auth does not re-derive it.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

**PHASE 4 GATE.**

```bash
pnpm verify && pnpm check:openapi && pnpm verify:auth
```

Expected: all green. Then continue to Phase 5.

---

# PHASE 5 — The centralized typed environment service

**Owner directive (2026-07-29):** credentials and configuration come from `.env`; no code reads `process.env` directly; **one** central, 100%-typed service serves api, worker, web and mobile.

**What exists today** — partial and inconsistent:
- `packages/contracts/src/env.ts` holds shared Zod *fragments* (shapes only, no reads) — a good idea living in the wrong package: contracts is the wire format, not the config layer.
- `apps/api/src/config/{env.schema.ts,env.ts}` composes fragments and does the single read. This is the pattern to generalize.
- `apps/web/lib/env.ts` does `process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'` — **a `??` fallback at a call site, which the repo's own convention explicitly forbids** ("Non-secret convenience values may default IN THE SCHEMA — never via `??` at a call site").
- `packages/db/src/migrate.ts` and `tests/invariants/src/run.ts` read `process.env` directly.
- `apps/mobile` has no env layer at all.
- Biome's `noProcessEnv` is `error` but with a **seven-pattern allowlist** that includes `**/scripts/**` and `**/*.config.*` — wide enough that the rule proves little.

---

### Task 34: Create `packages/env` and migrate the server apps

**Files:**
- Create: `packages/env/{package.json,tsconfig.json,CLAUDE.md}`
- Create: `packages/env/src/{index.ts,parse.ts,server.ts}`
- Create: `packages/env/src/schema/{fragments.ts,api.ts,worker.ts,web.ts,mobile.ts}`
- Modify: `apps/api/src/config/`, `apps/worker/src/config/`, `packages/db/src/migrate.ts`
- Modify: `packages/contracts/src/env.ts` (remove — fragments move here)

**Interfaces:**
- Consumes: nothing from Phases 1–4
- Produces: `@heliogrid/env` exporting `serverEnv()` per app plus the typed `Env` types. Task 35 adds the web and native entries; Task 36 tightens the Biome allowlist to this package alone.

**Split by responsibility** (the naming rule this plan added): `schema/` describes shapes, `parse.ts` validates, and each platform entry file is the *only* place a raw source is touched. No file is named for its size.

- [ ] **Step 1: Inventory every current env read**

```bash
grep -rn 'process\.env\.' apps packages tests --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '/dist/'
sed -n '112,133p' biome.json
```

Expected: reads in `apps/web/lib/env.ts` (with the forbidden `??` fallback), `packages/db/src/migrate.ts`, `tests/invariants/src/run.ts`, plus the api/worker config files; and a seven-pattern `noProcessEnv` allowlist. Record this list — Task 36 verifies it has collapsed to one entry.

- [ ] **Step 2: Write the failing test — assert the end state before building it**

```bash
node -e "
const {execSync}=require('child_process');
const out=execSync(\"grep -rln 'process\\\\.env\\\\.' apps packages tests --include='*.ts' --include='*.tsx' | grep -v node_modules | grep -v '/dist/' || true\",{encoding:'utf8'}).trim();
const files=out?out.split('\n'):[];
const offenders=files.filter(f=>!f.startsWith('packages/env/src/'));
if(offenders.length) { console.error('process.env read outside packages/env:\n  '+offenders.join('\n  ')); process.exit(1); }
console.log('env access is centralized');"
```

Expected: FAIL, listing every file from Step 1. This exact check becomes `check:env` in Task 36.

- [ ] **Step 3: Create the package skeleton**

`packages/env/package.json` — name `@heliogrid/env`, private, `type: module`, exports for
`.`, `./server`, `./web`, `./native`; `turbo.tags: ["contracts"]` (it is a typed contract
with no framework and no token dependency, so every layer may import it); devDeps
`@heliogrid/config`, `typescript@5.8.3`; dependency `zod` at the repo's pinned 3.x.

`packages/env/CLAUDE.md` (≤40 lines) stating: this is the ONLY package permitted to read a
raw environment source; fragments describe shapes and never read; secrets never carry
`.default()`; non-secret defaults live IN THE SCHEMA, never behind `??` at a call site;
adding a variable means editing the schema here **and** `.env.example`, and nothing else.

- [ ] **Step 4: Move the fragments and add the parser**

Move the contents of `packages/contracts/src/env.ts` to `packages/env/src/schema/fragments.ts`
unchanged — the schemas are already correct and well-commented. Delete the contracts file
and its re-export from `packages/contracts/src/index.ts`.

`packages/env/src/parse.ts` — the one validator:

```ts
import type { z } from 'zod';

/**
 * The single validation path. Every platform entry (server/web/native) reads its raw source
 * and hands it here; nothing else in the repo parses environment values.
 *
 * Failure is fatal and LOUD: a missing DATABASE_URL used to coerce to '' and fail at the
 * first query. It now fails at startup with the key named.
 */
export function parseEnv<T extends z.ZodTypeAny>(
  schema: T,
  source: Record<string, string | undefined>,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment for ${label}:\n${detail}\n\n` +
        'Every variable is declared in packages/env/src/schema/ and documented in ' +
        '.env.example. Secrets never have defaults — an absent value must stop startup.',
    );
  }
  return result.data;
}
```

`packages/env/src/schema/api.ts` — move `apps/api/src/config/env.schema.ts` here verbatim
(it is already the right shape). Add `worker.ts` for the worker's schema.

`packages/env/src/server.ts` — the only Node-side read:

```ts
import { parseEnv } from './parse';
import { apiEnvSchema } from './schema/api';
import { workerEnvSchema } from './schema/worker';

/** The ONE place Node reads process.env. Memoized: parse once, fail once, at startup. */
let apiCache: ReturnType<typeof loadApiEnv> | undefined;
export function loadApiEnv() {
  return (apiCache ??= parseEnv(apiEnvSchema, process.env, 'apps/api'));
}

let workerCache: ReturnType<typeof loadWorkerEnv> | undefined;
export function loadWorkerEnv() {
  return (workerCache ??= parseEnv(workerEnvSchema, process.env, 'apps/worker'));
}

export type ApiEnv = ReturnType<typeof loadApiEnv>;
export type WorkerEnv = ReturnType<typeof loadWorkerEnv>;
```

- [ ] **Step 5: Migrate api, worker and the db migrator**

`apps/api/src/config/env.ts` becomes a thin re-export of `loadApiEnv()` from
`@heliogrid/env/server`; delete `env.schema.ts`. Same for the worker.

`packages/db/src/migrate.ts` currently does
`process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL`. Replace with a required
parameter: the migrator takes the URL from its caller (the CLI entry point reads it via
`@heliogrid/env/server`). A library that reads the environment is a library that cannot be
tested or reused — this also removes `packages/db` from the Biome allowlist.

- [ ] **Step 6: Verify the server side**

```bash
pnpm install && pnpm turbo typecheck && pnpm lint && pnpm boundaries
DATABASE_ADMIN_URL=postgres://heliogrid:heliogrid@localhost:55432/heliogrid_ci \
  pnpm --filter @heliogrid/db migrate
```

Then prove the failure path is loud:

```bash
env -u BETTER_AUTH_SECRET pnpm --filter @heliogrid/api start 2>&1 | head -8
```

Expected: startup FAILS with `Invalid environment for apps/api:` naming `BETTER_AUTH_SECRET`
— not a runtime surprise at the first signing operation.

- [ ] **Step 7: Commit**

```bash
git add packages/env packages/contracts apps/api apps/worker packages/db pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(env): packages/env — one typed config service; api, worker and db migrated

VERIFIED: typecheck, lint and boundaries green; migrate runs against a live database;
starting apps/api without BETTER_AUTH_SECRET fails at STARTUP naming the key, instead of
surfacing at the first signing operation.

Env fragments move out of packages/contracts (which is the wire format, not the config
layer). packages/db/migrate.ts no longer reads the environment — the URL is a parameter,
so the library is reusable and drops off the Biome allowlist.

Split by responsibility: schema/ describes, parse.ts validates, server.ts is the only
Node-side read.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 35: Web and mobile env entries

**Files:**
- Create: `packages/env/src/web.ts`, `packages/env/src/native.ts`
- Create: `packages/env/src/schema/{web.ts,mobile.ts}`
- Modify: `apps/web/lib/env.ts`, `apps/mobile/src/config/env.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `parseEnv` and the fragments from Task 34
- Produces: `@heliogrid/env/web` and `@heliogrid/env/native`. Task 36 verifies no `process.env` remains outside this package.

The client platforms differ only in **where raw values come from** — Next.js inlines `NEXT_PUBLIC_*` at build time; bare React Native has no `process.env` at runtime. The schema and the validation are shared; only the source differs. That is the correct seam and the reason this is one service rather than three.

- [ ] **Step 1: Confirm the web violation and the mobile gap**

```bash
cat apps/web/lib/env.ts
ls apps/mobile/src/config 2>&1 | head -2
grep -rn "API_URL\|apiUrl" apps/mobile/src/data/api-client.ts | head -5
grep -n "react-native-config" apps/mobile/package.json || echo "no RN config module installed"
```

Expected: the web file's `?? 'http://localhost:8080'` call-site fallback; no mobile config
directory; the mobile API base URL hard-coded or inline; no RN env module.

- [ ] **Step 2: Write the web entry**

`packages/env/src/schema/web.ts` declares only browser-safe values (never a secret — anything
here ships to the client):

```ts
import { z } from 'zod';
import { originSchema } from './fragments';

/**
 * Browser-visible configuration ONLY. Every value here is shipped to the client and is
 * public by construction — a secret in this schema is a leaked secret. Defaults live HERE,
 * never behind `??` at a call site (that was the old apps/web/lib/env.ts defect).
 */
export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: originSchema.default('http://localhost:8080'),
});
```

`packages/env/src/web.ts`:

```ts
import { parseEnv } from './parse';
import { webEnvSchema } from './schema/web';

/**
 * Next.js inlines NEXT_PUBLIC_* at BUILD time, so the property must be written out
 * literally — a computed lookup like process.env[key] is not substituted and yields
 * undefined in the browser.
 */
export const webEnv = parseEnv(
  webEnvSchema,
  { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL },
  'apps/web',
);
```

Rewrite `apps/web/lib/env.ts` to re-export `webEnv.NEXT_PUBLIC_API_URL` as `API_URL`,
deleting the `??` fallback.

- [ ] **Step 3: Write the native entry**

Bare RN has no `process.env` at runtime. Install `react-native-config` (exact pin) — the
mainstream choice for bare RN, which exposes `.env` values to both JS and the native build:

```bash
pnpm add --filter @heliogrid/mobile react-native-config@1.5.6
cd apps/mobile/ios && pod install && cd ../../..
```

`packages/env/src/schema/mobile.ts` mirrors the web schema's shape for the values the app
needs (API base URL today). `packages/env/src/native.ts` reads from `react-native-config`
and hands the result to the same `parseEnv`, so web and mobile validate identically.

Wire `apps/mobile/src/config/env.ts` as the app's import point and update
`apps/mobile/src/data/api-client.ts` to use it.

- [ ] **Step 4: Document every variable**

Update `.env.example` so every key in every schema appears with its role, and no key appears
that no schema declares. This file is the contract between the repo and whoever deploys it.

- [ ] **Step 5: Verify on all three surfaces**

```bash
pnpm turbo typecheck && pnpm lint && pnpm turbo build
```

Then run it — this is a config change, so it is exactly the kind that compiles and still
breaks at runtime. Use `/verify-app`:

- **Web**: the app loads and reaches the API. Then set `NEXT_PUBLIC_API_URL` to a bad value
  and confirm the failure names the key rather than producing a silent network error.
- **iOS and Android** (Law 7): the app builds, launches, and reaches the API on both
  simulators. A native module was added, so a clean build on both platforms is mandatory —
  `pod install` for iOS and a Gradle sync for Android.

- [ ] **Step 6: Commit**

```bash
git add packages/env apps/web apps/mobile .env.example pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(env): web and native entries — one schema, one validator, three sources

VERIFIED: typecheck, lint and build green; web loads and reaches the API, and a bad
NEXT_PUBLIC_API_URL now fails naming the key; app builds, launches and reaches the API on
both iOS and Android simulators after pod install and a Gradle sync (Law 7).

Removes the `?? 'http://localhost:8080'` call-site fallback in apps/web/lib/env.ts — the
repo's own convention says non-secret defaults live in the schema, never behind `??` at a
call site. Mobile gains an env layer it never had, via react-native-config.

Only the SOURCE of raw values differs per platform (Next inlines NEXT_PUBLIC_* at build
time; bare RN has no runtime process.env). Schema and validation are shared, which is what
makes this one service instead of three.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 36: Lock it — narrow the Biome allowlist and gate it

**Files:**
- Modify: `biome.json` (collapse the `noProcessEnv` allowlist)
- Modify: `package.json` (add `check:env`)
- Modify: `tests/invariants/src/run.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Tasks 34–35
- Produces: `pnpm check:env`. This is the Phase 5 acceptance gate.

- [ ] **Step 1: Collapse the allowlist**

In `biome.json`, replace the seven-pattern `noProcessEnv: "off"` override list with exactly:

```json
      "includes": ["packages/env/src/**"],
```

`**/scripts/**` and `**/*.config.*` come off the list: a script that needs configuration
imports `@heliogrid/env/server` like everything else.

`tests/invariants/src/run.ts` keeps its direct read — it is the invariant runner, which must
work standalone against a database URL passed by CI, and importing the app config service
into the thing that verifies the database would be a circular dependency. Add it as the one
explicit exception **with that reason written in the config**:

```json
    {
      "includes": ["packages/env/src/**", "tests/invariants/src/run.ts"],
```

- [ ] **Step 2: Add the gate**

In `package.json`:

```json
    "check:env": "node scripts/check-env-access.mjs",
```

Create `scripts/check-env-access.mjs` implementing the check drafted in Task 34 Step 2:
every file reading `process.env` must be under `packages/env/src/` or be
`tests/invariants/src/run.ts`; anything else fails with the file list and an explanation.

- [ ] **Step 3: Verify it passes now and fails on a regression**

```bash
pnpm check:env
```

Expected: PASS — `env access is centralized`.

```bash
printf 'export const leak = process.env.SECRET_KEY;\n' > apps/web/lib/__probe.ts
pnpm check:env; echo "exit=$?"
rm apps/web/lib/__probe.ts
```

Expected: FAIL naming `apps/web/lib/__probe.ts`, `exit=1`.

- [ ] **Step 4: Verify Biome agrees**

```bash
printf 'export const leak = process.env.SECRET_KEY;\n' > apps/web/lib/__probe.ts
pnpm exec biome check apps/web/lib/__probe.ts; echo "exit=$?"
rm apps/web/lib/__probe.ts
```

Expected: `noProcessEnv` fires. Two independent mechanisms now cover the rule — the linter
at the file level and the script at the repo level.

- [ ] **Step 5: Wire into `verify` and CI**

Add `pnpm check:env` to the `verify` script chain, and add a CI step beside the doc-anchor
step. One line each — this stays within the "CI stays simple" budget.

- [ ] **Step 6: Full verification and commit**

```bash
pnpm verify
```

```bash
git add biome.json package.json scripts/check-env-access.mjs tests/invariants .github/workflows/ci.yml
git commit -m "$(cat <<'EOF'
feat(env): lock centralized env access — allowlist collapsed, gate added

VERIFIED: pnpm check:env passes; a probe file reading process.env in apps/web fails both
check:env (by path) and Biome noProcessEnv (by rule); pnpm verify green.

The noProcessEnv allowlist went from seven patterns (including **/scripts/** and
**/*.config.*, wide enough that the rule proved little) to packages/env/src/** plus one
documented exception: tests/invariants/src/run.ts, the invariant runner, which must work
standalone against a CI-supplied URL and cannot import the app config service without a
circular dependency. The reason is written in the config, not left to be rediscovered.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
EOF
)"
```

---

**PHASE 5 GATE — and the plan's acceptance criteria.**

```bash
pnpm verify && pnpm check:openapi && pnpm verify:auth
```

Every finding F1–F10 plus the 2026-07-29 owner directives are now fixed or mechanically guarded:

| Finding | Closed by | Proof |
|---|---|---|
| F1 vacuous test gate | Task 2 | Disabling RLS turns CI red |
| F2 prose-only laws | Tasks 5, 20–28 | Each gate observed red on a deliberate violation |
| F3 dangling authority | Tasks 13, 16, 19 | `pnpm check:anchors` green |
| F4 4-layer duplication | Tasks 6–10, 19 | Measured always-on budget; single copies |
| F5 external product truth | Tasks 14, 15 | `docs/product/` vendored; census single-sourced |
| F6 enum drift | Task 20 | Fake enum value turns CI red |
| F7a login drift | Task 31 | One machine; both screens import it |
| F7b UI parity | Task 32 | Optional prop on one platform fails typecheck |
| F8 phantom domain | Task 30 | Purity rules fire for the first time |
| F9 stranded assets | Tasks 1, 3, 22 | Committed; boundaries and oxlint in CI |
| F10 no executable verification | Task 33 | `verify:auth` catches the historical 500-vs-409 regression |
| **No unit tests** (owner 2026-07-29) | Tasks 5, 6, 22 | Hook blocks `.spec.ts` creation; `check:no-tests` blocks it at merge |
| **Split by responsibility, no `-part2`** | Tasks 6, 22 | CLAUDE.md rule + oxlint `max-lines` + edit-checks hook advice |
| **React presentation/logic split** | Tasks 6, 7 | CLAUDE.md rule + `ui-adherence.md` pattern; ux-lens reviews it |
| **Centralized typed env** | Tasks 34–36 | `check:env` + Biome `noProcessEnv`; startup fails naming the key |
| **Simple CI, manual git** | Tasks 10, 25, 27, 29 | CI-creep assertion in Task 29; `/pr` is `disable-model-invocation` |

**Then:** move `docs/foundation-redesign.md` to `docs/archive/` (its §9 is now executed, plus the three phases this plan added) and add the archive README row. Normal module work resumes with auth-tenancy task 3 (signup) via `/slice` — the shakedown of the new system on real feature work.

---

## Self-Review

**Spec coverage.** Every section of `docs/foundation-redesign.md` maps to a task: §3.1 → Task 6 · §3.2 → Tasks 6–7 · §3.3 → Task 4 · §3.4 → Tasks 8–10 · §3.5 → Task 11 · §3.6–3.7 → Task 5 · §4 → Task 12 · §5.1 → Tasks 2–3 · §5.2 → Tasks 20–29 · §5.3 → Task 19 · §6.1 → Tasks 14–15 · §6.2 → Task 16 · §6.3 → Task 18 · §6.4 → Task 19 · §6.5 → Task 8 (`/roadmap`) · §7 → Tasks 8–10 · §8 → Tasks 10, 29 · §9 → Tasks 1–33.

**Owner directives of 2026-07-29** are covered as follows. *No unit tests*: Global Constraints, the `write-guard` hook (Task 5), the CLAUDE.md Process rule (Task 6), `check:no-tests` in the lint chain (Task 22); the Playwright task was **deleted** and the auth replay demoted from a CI gate to an on-demand script (Task 33). *Responsibility-based file splitting with real names*: Global Constraints, CLAUDE.md, `ui-adherence.md`, oxlint `max-lines`, and the edit-checks hook. *React presentation/logic separation*: CLAUDE.md Process and the `ui-adherence.md` section, reviewed by `ux-lens`. *Simple git*: `/pr` carries `disable-model-invocation: true` and opens nothing unasked (Task 10); the PR template is now five checkboxes. *Simple CI*: oasdiff moved out of CI (Task 25), knip/jscpd moved out entirely (Task 27), and Task 29 asserts no decorative step creeps back. *Centralized typed env*: the whole of Phase 5. *Biome lint/format hardening*: Task 22 Steps 1–2.

Deliberately **not** covered, with reasons: §3.8 memory policy is a convention needing no file change; §3.9 records what is not adopted; `claude-code-action@v1` is dropped rather than deferred — it conflicts with "git stays manual", and GitHub org setup is owner-blocked anyway.

**Known gaps a reviewer should hold me to.** Task 32 declares two of twenty-five component interfaces explicitly and marks the rest with `/* … */`; the implementer must enumerate all twenty-five from the existing index files — the pattern is fully specified but the inventory is not transcribed. Task 33 describes its ten assertions rather than shipping the script body, because the dev `OtpPort` seam's exact interface must be read from `apps/api` first. Task 15's N1–N10 and Task 14's census extraction are verbatim copies whose source text is not reproduced here. Task 21's `GLOBAL_TABLES` allowlist is seeded from the migration files; Better Auth's table names must be confirmed against the live database. Task 35 pins `react-native-config@1.5.6` and adds a native module — if that version is stale at execution time, pin the current one, and budget for the iOS/Android clean-build verification the task requires. Task 22's Biome rule set will surface real findings on first run; the task says fix the code rather than relax the rules, which means its true size depends on what the tightened rules find.

**Type consistency.** `runEnumParity`, `runTableTenancyScan`, `runTenancyInvariants` are all `(url: string) => Promise<void>` and all called from `run.ts`. `loginReducer`/`initialLoginState`/`LoginState`/`LoginEvent`/`DONE_DWELL_MS` are defined in Task 31 and consumed by both login screens under those exact names. `ComponentApiSurface` is defined and consumed in Task 32. `parseEnv(schema, source, label)` is defined in Task 34 and consumed by `server.ts`, `web.ts` and `native.ts` across Tasks 34–35. Script paths are stable across references: `scripts/check-doc-anchors.mjs` (Tasks 13, 19, 29 and `/doc-sync`), `scripts/check-roadmaps.mjs` (Tasks 26, 29 and `/pr`), `scripts/check-openapi-breaking.mjs` (Tasks 25, 29 and `/contract-change`), `scripts/check-env-access.mjs` (Tasks 34, 36), `scripts/auth-e2e-replay.ts` (Task 33 and `/verify-app`). The hook is `write-guard.sh` everywhere — no reference to the earlier `migration-guard.sh` name survives.

**Ordering dependencies verified.** Task 2 precedes Tasks 20–21 (invariants would silently skip without the real gate). Task 13 precedes Tasks 14–19 (each uses the anchor checker as its test). Task 22's Biome hardening precedes nothing that depends on it, but running it before Phase 4 means the new `packages/domain` and `packages/env` code is written under the tightened rules rather than retrofitted. Task 30 precedes Task 31. Task 34 precedes Tasks 35–36. Task 5's hooks precede all later editing, so the plan runs under its own guards — including the no-test-files rule.

---

**Plan updated and saved to `docs/superpowers/plans/2026-07-29-ai-engineering-foundation.md`.**
