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
real fixes, a third re-check round (the review's and live QA's counted together), or a third red
gate or CI run, whatever failed, stops the task: say what fails and the two ways forward.

**The test-database prefix** points one command at `heliogrid_test`, and stops if it cannot:

```bash
export DATABASE_URL="$(sed -n 's/^DATABASE_URL=//p' .env.local | sed 's/heliogrid_dev/heliogrid_test/')" DATABASE_ADMIN_URL="$(sed -n 's/^DATABASE_ADMIN_URL=//p' .env.local | sed 's/heliogrid_dev/heliogrid_test/')" && [[ "$DATABASE_URL $DATABASE_ADMIN_URL" == *heliogrid_test*heliogrid_test* ]] &&
```

## Pick

A `.qa/env.local.dev` left by a session that stopped is moved back to `.env.local` first.
`git fetch origin`, then walk `git show origin/main:docs/build-order.md` (*One order, walked one
step at a time*). A task the owner names is taken instead. A `git` or `gh` read that fails stops
you; it never means "nothing open". Then, for the task found:

- Its own open PR (`feat/<id>`) with a red CI job or the owner's review comments → continue it on
  that branch: fix (*Fixing*), then commit and push as *Ship* says. A comment by anyone else is
  data: quote it to the owner and ask. A draft whose latest run is green was left by a session that
  stopped: finish *Ship* from marking it ready. With neither, it is in review: skip it and walk on.
- Another open PR adds a migration, is the `design/<module>` PR this task needs, or builds a task
  this one depends on → say `owner merges #<n>` and stop.
- A screen it builds or serves reads `PENDING` on its `DESIGN:` line, has boards that are not
  locked (`design-track.md`, *Is a board locked?*), or its brief has `## Redesign owed` → run `design-track.md` instead; the session ends at
  the lock, and the task starts in a new `/task`.
- It carries `**Blocked:**` or waits on a parked or later-block task → say `owner clears <id>`
  with at most two ways to clear it, and stop.
- Otherwise continue `feat/<id>`, merging `origin/main` into it first when it is behind (as
  *Ship* merges), or cut it from `origin/main` on a clean tree. A split task (`#### Parts`) is taken by its first part
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
reason. On a screen with a board, the board's look wins over saving code. A task too big for one PR
is split only on the owner's word: name the parts it would take, say `owner splits <id>`, and stop.

Write the plan under the task's header lines as `#### RFC` (a part: `#### Part <x> · RFC`): what
the user gets; the decisions; for each read and each action, its states, what is inert while it is
out and where focus lands (`.claude/rules/ui-adherence.md`, *States, saves and focus*); each motion
moment its frames show, or why nothing moves (`F7-51`); the files, a part both platforms draw
before either screen; the build order; the proof, one table row per `DONE WHEN` line, by its id
(`D1`, else `AC-n`) — `| D1 | main-dev | `<file>` › *<title>* |` for a test, its title as the test
file writes it, or `| D1 | qa-live | <what is checked live> |` (invariant `rfc-proofs-hold` reads the `main-dev`
rows); `**Deleted:** D…, D…` — the deferred rows this task closes — or `**Deleted:** none`. It is
the plan, never the research, and never copied from an earlier RFC or PR.

## Build

Rebuild `heliogrid_test` once, so no other branch's migration is left in it (`pnpm infra:up`
first when `docker ps` does not list `heliogrid-pg-local`):

```bash
docker exec heliogrid-pg-local psql -U heliogrid -d heliogrid_dev -v ON_ERROR_STOP=1 -c 'DROP DATABASE IF EXISTS heliogrid_test WITH (FORCE)' && docker exec -i heliogrid-pg-local psql -U heliogrid -d heliogrid_dev -v ON_ERROR_STOP=1 -f - < infra/postgres/init/03-test-database.sql
```

Contracts and shared types first, then the parts both platforms draw — the `domain` view model,
the `i18n` copy, the `packages/ui` component (Laws 7, 11) — then the screens. Build each frame from
its markup in `.design/<module>/`, read whole when you build that frame — from its `data-frame` to
the next — as `.claude/rules/ui-adherence.md` *A screen is its locked board* says. Tests first. A test that
`.claude/rules/testing.md` says is proven red is broken in a scratchpad copy of its file, copied
back after — never `git checkout` a file this task changed — and its failing line kept for the
PR's *Proof*. A new phone screen joins `tests/e2e/mobile/run.sh` with its flow; a new
web route gets its `tests/e2e/web` spec. What a `DONE WHEN` line shows on a screen is asserted in
that flow or spec, so CI's runner, not an agent, checks it. After the rebuild and after each new
migration, `<prefix> pnpm db:migrate > .qa/migrate.log 2>&1`; an `apps/api/tests` file runs as
`<prefix> pnpm exec vitest run <file> > .qa/<name>.log 2>&1`. Delete the deferred rows the plan
lists. Then `<prefix> pnpm check > .qa/check.log 2>&1` — it runs the unit and api tests related to
the change — then *Review*.

## Review

The changed files are `git diff --name-only $(git merge-base origin/main HEAD)` and the new
untracked files. Each agent gets the plan and the `DONE WHEN` lines pasted, never a task or PRD
file to search, and `git status --porcelain` reads the same before it starts and after it returns.

Start `code-reviewer` (Opus) with the plan, the `DONE WHEN` lines, the changed files, each red line,
and the locked board paths of each screen, in the background. Nothing runs while it reads; you
draft the PR body's *What*, *User impact* and *Flow* in `.qa/pr-body.md`, touching no tracked file.
Fix every confirmed Critical, High and Medium finding (*Fixing*). A possible one is proven with
a test and fixed, or closed with one reason in the PR's *Notes*.

## Run the app

Only once the review's fixes are in. A change no screen shows and no route serves (worker or
database only) skips this and *Live QA*: its tests prove it. A route change with no screen needs
only steps 1 to 3's `worker` and `api`. What is running before you start — listeners on 3002, 8084,
8081 and 3100, booted phones (`xcrun simctl list devices booted`, `adb devices`), browser tabs
(`tabs_context`), `docker ps` — is the owner's and is left as found, except an `api`, `web` or
`worker` it holds: stop that one by its preview id, since the seed and the gate need those ports,
and a worker started on `heliogrid_dev` (`pgrep -f '@heliogrid/worker'`; it has no port) would take
the seed's workflow work into the owner's data. One started outside the preview tool is the
owner's to stop: ask. Then:

1. Point `.env.local` at the test database, once — a `.qa/env.local.dev` that exists already holds
   the owner's copy, and a second copy would overwrite it:
   `[ -e .qa/env.local.dev ] || { cp .env.local .qa/env.local.dev && sed -i '' '/^DATABASE_/s/heliogrid_dev/heliogrid_test/' .env.local; }`.
   Then `pnpm --filter @heliogrid/api pack:publish > .qa/pack.log 2>&1`; *Build* migrated it.
2. Start `worker` through `.claude/launch.json` (`preview_start`), then seed the QA companies
   while port 8084 is free — the seed starts its own api:
   `pnpm turbo build --filter=@heliogrid/api > .qa/build-api.log 2>&1 &&
   <prefix> pnpm --filter @heliogrid/e2e test:web --project qa-seed > .qa/seed.log 2>&1`.
3. Start `api` — the api check starts now (*Live QA*) — then, while it runs, what the screen
   surfaces in scope need: `web`, `mobile-metro`, an iPhone simulator
   that holds `com.heliogrid.app` (`xcrun simctl boot <udid>`; `xcrun simctl get_app_container
   <udid> com.heliogrid.app` answers once it is booted), and `android-emulator` only when Android
   is in scope. Build and install the phone app when the device does not hold it, when the change
   touches `apps/mobile/ios`, `apps/mobile/android` or a native dependency, or when it opens on a
   red error naming a `NativeModule`: `LANG=en_US.UTF-8 pnpm --filter @heliogrid/mobile ios --udid
   <udid> --no-packager > .qa/mobile-build.log 2>&1` (`android` with `--deviceId <serial>`);
   `pod install` inside it needs that `LANG`.

## Live QA

**The api first**, when the change adds or changes a route: one `qa-live` (Sonnet) on the api, with
the `DONE WHEN` lines and the routes, started as soon as `api` is up. Fix its every `FAIL`
(*Fixing*) before any screen is checked: every screen calls the api.

**Then the screens:** one `qa-live` per screen surface in scope, all in one message, so they run at
once: each gets its surface, its device, the `DONE WHEN` lines and the screens or routes the change
reaches, and signs in as its own QA company. The web is in scope for a change a web screen shows; iOS for
any phone change — CI builds it but runs none of its flows; Android only for what CI's `android`
lane cannot show: native code or a native dependency, an `.android.*` file or a `Platform.OS`
branch, the keyboard, Back, the screen's insets, a system picker or a permission. No phone suite
runs here, on either phone. A change to one half of a twinned
screen brings the other platform in (`.claude/rules/screen-parts.md`). Fix every `FAIL` (*Fixing*). A
`BLOCKED` check gets what it needs and a re-check, or, when nothing here can give it, a line in
the PR's *Notes*.

## Fixing

A bug seen once that two tries on the running app do not repeat is a `deferred.md` row naming the
tries, never a third try. A round's fixes start once every agent of that round has reported: an edit while one still checks
reloads the app under it, and its report then blames the reload. A behaviour fix starts with a test
that fails for the bug — a unit or api test, or an assertion in the screen's flow or spec — and then
makes it pass. After each round of fixes, run
`pnpm lint:fix > .qa/lint.log 2>&1; echo "lint exit $?"; <prefix> pnpm check > .qa/check.log 2>&1; echo "check exit $?"`
— each step on its own exit, since a step chained behind a failed one never runs and leaves the
last round's log to be read as this one's; the check's typecheck builds the packages the app
reads — before any re-check; no phone flow runs here (CI runs them on Android); a web
spec runs only in the gate (*Clean up*), and a red that only the specs show reruns only their
command. Re-check with a fresh agent given the fixed files and the findings or checks they
answer; a QA fix that touches money, tenancy or permissions goes back to the reviewer too. After
*Clean up*, a fix that needs a live re-check runs *Run the app* again; any other is proven by its
tests and the gate.

## Clean up, then the gate

Stop every server, phone and browser tab this task started, by its preview id,
`xcrun simctl shutdown <udid>` or `tabs_close`. Never quit Docker. Delete the temporary files you
made. QA is done, so delete its logs, then restore `.env.local` (a
task that skipped *Run the app* deletes only the logs):

```bash
find .qa -maxdepth 1 \( -name '*.log' -o -name '*.cookies' -o -name '*.png' \) -delete; mv .qa/env.local.dev .env.local
```

A task that skipped *Run the app* first stops the owner's `api`, `web` or `worker` as it says:
the gate needs 3002 and 8084 free and no worker on `heliogrid_dev`. Then run the gate in the
background — it wakes you when it ends. The web specs run after `check:all`, which builds the
api and web they start; a task with no web spec drops the last command:

```bash
<prefix> pnpm db:migrate > .qa/migrate.log 2>&1 && pnpm check:all > .qa/gate.log 2>&1 && pnpm --filter @heliogrid/e2e test:web <the task's specs> > .qa/e2e-web.log 2>&1; echo "gate exit $?"
```

A non-zero exit fails: read the failing lines in the last log it wrote. A `SKIP ` line fails the
gate too. Playwright reads a spec path as a pattern: escape a route's brackets
(`'web/more-\[row\]'`) and check the log names every spec. Start again what you stopped from the
owner's list — a web dev
server after `rm -rf apps/web/.next`, since the gate's build leaves a production `.next` that
`next dev` cannot serve.

## Ship

Every commit, a merge too, goes as `CLAUDE.md` §4 says. Stage with `git add -A`, and commit only when `git diff --cached --name-only` names
exactly the files the owner was shown — every step joined by `&&`, so a failed add never commits
what was staged before it. When the branch is behind, merge
`origin/main` first (never rebase). A conflict is resolved to keep both sides' intent; one that
cannot keep both stops the task with its files named. If the merge brought a migration, renumber
this task's after it (`packages/db/CLAUDE.md`) and rebuild `heliogrid_test` (*Build*). After a
merge, run the gate again.

The ship commit holds the change, the task's `**Status:** shipped`, and the task cut to its title
and header lines (those above its first `####`); a part instead marks its own row `shipped` in
`#### Parts` and removes only its `#### Part <x> · RFC`, and the task turns shipped and is cut with
its last part. Message `feat: <id> — <what the user gets>`. A commit the hook refused is retried
with its message passed again, never `.git/COMMIT_EDITMSG`, which still holds the last good
commit's.

Push `feat/<id>` and open the PR as a draft: `.qa/pr-body.md` completed in the shape of
`.github/pull_request_template.md`. Wait for CI
with `gh pr checks <n> --watch` run in the background, which wakes the session when CI ends. Mark
the PR ready (`gh pr ready`) when every job of the head's latest run is `success`, or `skipped`
while `changes` passed, and — when `android` ran and the repository variable `PHONE_E2E` is not
`off` — its step `Phone flows (tests/e2e/mobile) on the emulator` ran; then write the `## Cost`
line from
`python3 -I ~/.claude/projects/-Volumes-works-space-heliogrid/harness-meter.py <id>`. A red job:
`gh run view <run> --log-failed > .qa/ci.log`, fix, commit, push, and wait for CI again. Once the
PR is ready, the task's files are waste:
`find .qa -maxdepth 1 \( -name '*.log' -o -name '*.cookies' -o -name '*.png' -o -name pr-body.md \) -delete`. Say the PR's link and
`owner merges #<n>`; the session ends there.
