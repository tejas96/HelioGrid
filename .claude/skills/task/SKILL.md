---
name: task
description: Use when the owner asks for HelioGrid's next build-order task, or names a task to start or continue, or asks to prepare a module's design (`design-track.md`). Never starts on its own.
user-invocable: true
disable-model-invocation: true
model: opus
---

# /task — one task, one session, one pull request

You own the task: you pick it, plan it, decide every open point, build, prove and ship it. The
owner merges the PR; nothing else waits on them. The laws are `CLAUDE.md`.

**The test-database prefix** points one command at `heliogrid_test`, never the owner's
`heliogrid_dev`:

```bash
export $(grep -E '^DATABASE_(ADMIN_)?URL=' .env.local | sed 's/heliogrid_dev/heliogrid_test/' | xargs) &&
```

## Pick

`git fetch origin`, then walk `docs/build-order.md` (*One order, walked one step at a time*) as it
stands on `origin/main`. A task the owner names is taken instead. A `git` or `gh` read that fails
stops you; it never means "nothing open". Then, for the task found:

- An open PR adds a migration, is the `design/<module>` PR this task needs, or builds a task this
  one depends on → say `owner merges #<n>` and stop: the shared local database and the locked
  boards are right only after it merges.
- A screen it builds or serves reads `PENDING` on its `DESIGN:` line, has boards that are not
  locked, or its brief has `## Redesign owed` → run `design-track.md` instead.
- It carries `**Blocked:**` or waits on a parked or later-block task → say `owner clears <id>`
  with at most two ways to clear it, and stop.
- Otherwise continue `feat/<id>`, or cut it from `origin/main` on a clean tree. A dirty tree on
  another branch is someone else's work: name its files and stop.

## Plan

Never read a task file whole. `grep -n '^### T-' docs/tasks/<file>` gives the task's first line and
the next task's; read between them with `sed -n`. A PRD row by its id (`grep -n '^| <id> '`); a
locked board by `grep -o 'data-frame="[^"]*"'` and `grep -o 'component-from-global-scope="[^"]*"'`
over `.design/<module>/<screen id>-*.dc.html`; the brief whole; the `docs/tasks/deferred.md` rows
that name this task, its screens or a path it touches.

Test every line of the task: wrong (a higher source, `CLAUDE.md` §7, or the code says otherwise),
missing (a state, a role, an edge), over-built (a simpler way meets the same PRD row). Decide each
open point yourself — the simplest build that meets the row — and write the decision with one
reason. On a screen with a board, the board's look wins over saving code.

Write the plan under the task's header lines as `#### RFC`: what the user gets; the decisions; the
files; the build order; the tests, each `` `<file>` › *<title>* `` as the test file writes it
(invariant `rfc-proofs-hold` reads them); `**Deleted:** D…, D…` — the deferred rows this task
closes — or `**Deleted:** none`. It is the plan, never the research, and never copied from an
earlier RFC or PR.

## Build

Contracts and shared types first, then the parts both platforms draw — the `domain` view model,
the `i18n` copy, the `packages/ui` component (Laws 7, 11) — then the screens. Tests first. A
money, tenancy or permission test, and a check you add or change, is seen red once: copy the file
to the scratchpad, break the one line its test names, see the test fail by name, copy it back —
never `git checkout` a file this task changed. A new phone screen joins `tests/e2e/mobile/run.sh`
with its flow; a new web route gets its `tests/e2e/web` spec. An `apps/api/tests` file runs as
`<prefix> pnpm db:migrate && pnpm exec vitest run <file> > .qa/<name>.log 2>&1`. Delete the
deferred rows the plan lists. `pnpm check > .qa/check.log 2>&1` before the review.

## Run the app

What is running before you start — listeners on 3002, 8084, 8081 and 3100, booted phones
(`xcrun simctl list devices booted`, `adb devices`), `docker ps` — is the owner's and is left as
found, except an `api` or `web` it holds: stop that one by its preview id, since the seed, the
database switch and the gate need those ports, and start it again at the end. Then:

1. Switch both database lines of `.env.local` to `heliogrid_test`
   (`sed -i '' 's/heliogrid_dev/heliogrid_test/' .env.local`), then `<prefix> pnpm db:migrate` and
   `pnpm --filter @heliogrid/api pack:publish`.
2. Start `worker` through `.claude/launch.json` (`preview_start`), then seed the QA companies
   while port 8084 is free — the seed starts its own api:
   `pnpm turbo build --filter=@heliogrid/api > .qa/build-api.log 2>&1;
   <prefix> pnpm --filter @heliogrid/e2e test:web --project qa-seed > .qa/seed.log 2>&1`.
3. Start `api`, then what the changed surfaces need: `web`, `mobile-metro`, `android-emulator`,
   and the simulator that holds `com.heliogrid.app`. Rebuild a native app only when native files
   changed.

## Review and live QA

Start both in one message, and give each the text it needs pasted, never a path into a big file:

- `code-reviewer` (Opus): the plan, the changed files (`git diff --name-only origin/main` and the
  new untracked files), and the locked board paths of each screen.
- `qa-live` (Sonnet): the `DONE WHEN` lines, the screens and routes the change reaches, the
  simulator UDID and the emulator serial.

Fix every confirmed Critical, High and Medium finding and every `FAIL`. A fix to `data`, `domain`,
`i18n` or `contracts` needs `pnpm --filter <package> build` before the app sees it. Re-check with a
fresh agent given only the fixed items: a finished agent's cache has gone cold.

## Clean up, then the gate

Switch `.env.local` back. Stop every server, phone and browser tab this task started, by its
preview id or `xcrun simctl shutdown <udid>`. Never quit Docker. Delete the temporary files you
made; keep `.qa/*.log`. Then:

```bash
<prefix> pnpm db:migrate && pnpm check:all > .qa/gate.log 2>&1; grep -nE 'error|fail|FAIL|ERR|SKIP' .qa/gate.log | head -40
<prefix> pnpm --filter @heliogrid/e2e test:web <the task's specs> > .qa/e2e-web.log 2>&1
```

A `SKIP ` line fails the gate. Playwright reads a spec path as a pattern: escape a route's
brackets (`'web/more-\[row\]'`) and check the log names every spec. Start again what you stopped
from the owner's list.

## Ship

One commit: the change, the task's `**Status:** shipped`, and the task cut to its title and header
lines (those above its first `####`) — the plan moves into the PR body. Message
`feat: <id> — <what the user gets>`. Merge `origin/main` when the branch is behind; never rebase.
Push `feat/<id>`, open the PR as a draft from `.github/pull_request_template.md`, its `## Cost`
from `python3 -I ~/.claude/projects/-Volumes-works-space-heliogrid/harness-meter.py <id>`, and
mark it ready (`gh pr ready`) when every CI job of the head's latest run has passed. A red job:
`gh run view <run> --log-failed > .qa/ci.log`, fix, push.

The same failure after two real fixes: leave the PR a draft, write in its body what fails and the
two ways forward, and stop.
