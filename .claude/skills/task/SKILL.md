---
name: task
description: Use when the owner asks for HelioGrid's next build-order task, or names a task to start or continue, or asks to prepare a module's design (`design-track.md`). Never starts on its own.
user-invocable: true
disable-model-invocation: true
model: opus
---

# /task — one task, one session, one pull request

You own the task: you pick it, plan it, decide every open point, build, prove and ship it. The
owner keeps what `CLAUDE.md` §4 lists; nothing else waits on them. One `/task` session runs at a
time: the test database, the ports, `.qa/` and `.env.local` are shared. The same failure after two
real fixes, or a third re-check round, stops the task: say what fails and the two ways forward.

**The test-database prefix** points one command at `heliogrid_test`, and stops if it cannot:

```bash
export DATABASE_URL="$(sed -n 's/^DATABASE_URL=//p' .env.local | sed 's/heliogrid_dev/heliogrid_test/')" DATABASE_ADMIN_URL="$(sed -n 's/^DATABASE_ADMIN_URL=//p' .env.local | sed 's/heliogrid_dev/heliogrid_test/')" && [[ "$DATABASE_URL $DATABASE_ADMIN_URL" == *heliogrid_test*heliogrid_test* ]] &&
```

## Pick

A `.qa/env.local.dev` left by a session that stopped is moved back to `.env.local` first.
`git fetch origin`, then walk `git show origin/main:docs/build-order.md` (*One order, walked one
step at a time*). A task the owner names is taken instead. A `git` or `gh` read that fails stops
you; it never means "nothing open". Then, for the task found:

- Its own open PR (`feat/<id>`) with a red CI job or review comments → continue it on that branch:
  fix, then *Ship*. With neither, it is in review: skip it and walk on.
- Another open PR adds a migration, is the `design/<module>` PR this task needs, or builds a task
  this one depends on → say `owner merges #<n>` and stop.
- A screen it builds or serves reads `PENDING` on its `DESIGN:` line, has boards that are not
  locked, or its brief has `## Redesign owed` → run `design-track.md` instead; the session ends at
  the lock, and the task starts in a new `/task`.
- It carries `**Blocked:**` or waits on a parked or later-block task → say `owner clears <id>`
  with at most two ways to clear it, and stop.
- Otherwise continue `feat/<id>`, merging `origin/main` into it first when it is behind, or cut
  it from `origin/main` on a clean tree. A split task (`#### Parts`) is taken by its first part
  that is not shipped and has no open PR, on its own id and branch (`feat/T-SHELL-003a`). A dirty
  tree on another branch is someone else's work: name its files and stop.

## Plan

A branch that already holds its plan, or its code, is resumed where it stands: read the plan,
`git log` and the diff against the merge base, and go on from there.

Never read a task file whole: `grep -n '^### T-' docs/tasks/<file>` gives the task's first line,
and the next task's (or the file's end) its last; read between them with `sed -n`. A PRD row by
its id (`grep -rn '^| <id> ' docs/prd`); a locked board's frames by `grep -o 'data-frame="[^"]*"'`
and its components by `grep -o 'component-from-global-scope="[^"]*"'` over
`.design/<module>/<screen id>-*.dc.html`; the brief whole; the `docs/tasks/deferred.md` rows that
name this task, its screens or a path it touches.

Test every line of the task: wrong (a higher source, `CLAUDE.md` §7, or the code says otherwise),
missing (a state, a role, an edge), over-built (a simpler way meets the same PRD row). Decide each
open point yourself — the simplest build that meets the row — and write the decision with one
reason. On a screen with a board, the board's look wins over saving code.

Write the plan under the task's header lines as `#### RFC`: what the user gets; the decisions; the
files; the build order; the proof, one table row per `DONE WHEN` line —
`| AC-n | main-dev | `<file>` › *<title>* |` for a test, its title as the test file writes it, or
`| AC-n | qa-live | <what is checked live> |` (invariant `rfc-proofs-hold` reads the `main-dev`
rows); `**Deleted:** D…, D…` — the deferred rows this task closes — or `**Deleted:** none`. It is
the plan, never the research, and never copied from an earlier RFC or PR.

## Build

Rebuild `heliogrid_test` once, so no other branch's migration is left in it:

```bash
docker exec heliogrid-pg-local psql -U heliogrid -d heliogrid_dev -v ON_ERROR_STOP=1 -c 'DROP DATABASE IF EXISTS heliogrid_test WITH (FORCE)' && docker exec -i heliogrid-pg-local psql -U heliogrid -d heliogrid_dev -v ON_ERROR_STOP=1 -f - < infra/postgres/init/03-test-database.sql
```

Contracts and shared types first, then the parts both platforms draw — the `domain` view model,
the `i18n` copy, the `packages/ui` component (Laws 7, 11) — then the screens, each frame built from
its board's code. Tests first. A money, tenancy or permission test, and a check you add or change,
is seen red once: copy the file to the scratchpad, break the rule the test checks, see the test
fail by name, copy it back — never `git checkout` a file this task changed — and keep the failing
line for the PR's *Proof*. A new phone screen joins `tests/e2e/mobile/run.sh` with its flow; a new
web route gets its `tests/e2e/web` spec. What a `DONE WHEN` line shows on a screen is asserted in
that flow or spec, so the runner, not an agent, checks it. After the rebuild and after each new
migration, `<prefix> pnpm db:migrate > .qa/migrate.log 2>&1`; an `apps/api/tests` file runs as
`<prefix> pnpm exec vitest run <file> > .qa/<name>.log 2>&1`. Delete the deferred rows the plan
lists. Then `<prefix> pnpm check > .qa/check.log 2>&1` — it runs the unit and api tests related to
the change — start the review (*Review, then live QA*), and run the app while it reads.

## Run the app

What is running before you start — listeners on 3002, 8084, 8081 and 3100, booted phones
(`xcrun simctl list devices booted`, `adb devices`), browser tabs (`tabs_context`), `docker ps` — is
the owner's and is left as found, except an `api`, `web` or `worker` it holds: stop that one by its
preview id, since the seed and the gate need those ports, and a worker started on `heliogrid_dev`
(`pgrep -f '@heliogrid/worker'`; it has no port) would take the seed's workflow work into the
owner's data. Start it again at the end. One started outside the preview tool is the owner's to
stop: ask. Then:

1. `cp .env.local .qa/env.local.dev`, then `sed -i '' '/^DATABASE_/s/heliogrid_dev/heliogrid_test/' .env.local`,
   `<prefix> pnpm db:migrate > .qa/migrate.log 2>&1` and
   `pnpm --filter @heliogrid/api pack:publish > .qa/pack.log 2>&1`.
2. Start `worker` through `.claude/launch.json` (`preview_start`), then seed the QA companies
   while port 8084 is free — the seed starts its own api:
   `pnpm turbo build --filter=@heliogrid/api > .qa/build-api.log 2>&1 &&
   <prefix> pnpm --filter @heliogrid/e2e test:web --project qa-seed > .qa/seed.log 2>&1`.
3. Start `api`, then what the surfaces in scope need: `web`, `mobile-metro`, the simulator that
   holds `com.heliogrid.app`, and `android-emulator` only when Android is in scope. Rebuild a
   native app when native files differ from the build it holds.

## Review, then live QA

The changed files are `git diff --name-only $(git merge-base origin/main HEAD)` and the new
untracked files. Each agent gets its text pasted, never a path into a big file, and
`git status --porcelain` reads the same before it starts and after it returns.

1. `code-reviewer` (Opus), in the background while the app starts: the plan, the `DONE WHEN`
   lines, the changed files, each red line, and the locked board paths of each screen. Fix every
   confirmed Critical, High and Medium finding.
2. `qa-live` (Sonnet), once the review's fixes are in, so it checks the final code: the
   `DONE WHEN` lines, the surfaces in scope, the screens and routes the change reaches, the
   simulator UDID and the emulator serial. iOS is in scope for any phone change — CI never runs
   it; Android only for native code, an `.android.*` file, the keyboard or Back, since CI's
   `android` lane runs its flows. Fix every `FAIL`.

Each fix starts with a test that fails for the bug — a unit or api test, or an assertion in the
screen's flow or spec — and then makes it pass. After each round of fixes, run
`<prefix> pnpm check` and any flow or spec the round changed, before any re-check. A fix to `data`, `domain`, `i18n` or `contracts` needs
`pnpm --filter <package> build` before the app sees it. Re-check with a fresh agent given the
fixed files and the findings or checks they answer; a QA fix that touches money, tenancy or
permissions goes back to the reviewer too.

## Clean up, then the gate

`mv .qa/env.local.dev .env.local`. Stop every server, phone and browser tab this task started, by
its preview id, `xcrun simctl shutdown <udid>` or `tabs_close`. Never quit Docker. Delete the
temporary files you made; keep `.qa/*.log`. Then:

```bash
rm -f .qa/gate.log; <prefix> pnpm db:migrate > .qa/migrate.log 2>&1 && pnpm check:all > .qa/gate.log 2>&1; echo "gate exit $?"
<prefix> pnpm --filter @heliogrid/e2e test:web <the task's specs> > .qa/e2e-web.log 2>&1; echo "e2e exit $?"
```

A non-zero exit fails; read its failing lines in the log. A `SKIP ` line fails the gate too.
Playwright reads a spec path as a pattern: escape a route's brackets (`'web/more-\[row\]'`) and
check the log names every spec. Start again what you stopped from the owner's list — a web dev
server after `rm -rf apps/web/.next`, since the gate's build leaves a production `.next` that
`next dev` cannot serve.

## Ship

The ship commit holds the change, the task's `**Status:** shipped`, and the task cut to its title
and header lines (those above its first `####`). Message `feat: <id> — <what the user gets>`;
every commit goes as `CLAUDE.md` §4 says. A commit the hook refused is retried with its message
passed again, never `.git/COMMIT_EDITMSG`, which still holds the last good commit's. When the
branch is behind, merge `origin/main` (never rebase); if it brought a migration, renumber this
task's after it (`packages/db/CLAUDE.md`) and rebuild `heliogrid_test` (*Build*). Then run the gate
again.

Push `feat/<id>` and open the PR as a draft from `.github/pull_request_template.md`. Wait for CI
with `gh pr checks <n> --watch` run in the background, which wakes the session when CI ends. Mark
the PR ready (`gh pr ready`) when every job of the head's latest run is `success`, or `skipped`
while `changes` passed, and — when `android` ran and the repository variable `PHONE_E2E` is not
`off` — its step `Phone flows (tests/e2e/mobile) on the emulator` ran; then write the `## Cost`
line from
`python3 -I ~/.claude/projects/-Volumes-works-space-heliogrid/harness-meter.py <id>`. A red job:
`gh run view <run> --log-failed > .qa/ci.log`, fix, commit, push.
