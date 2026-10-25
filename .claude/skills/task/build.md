# /task · the build phase — step 5

Read `SKILL.md` first; it holds the rules every phase keeps. This session starts on `feat/<id>`
with `**RFC approved:**` under the RFC, and ends when the `**Build note:**` is written.

## 5. Build

Read the RFC by its heading's line range, once. Build inside it only, slice by slice in the order
of its *Build steps*. Contracts and shared types land first (Law 3). After that, the slices the RFC
marks `parallel` — disjoint files — may go to `general-purpose` agents on Opus at once, each with:
its slice's rows pasted, the RFC sections it builds from (the proposal, the files table, its
acceptance lines), and, for a screen slice, the path of its locked board files
(`.claude/rules/ui-adherence.md`, *A screen is its locked board*). The prompt says: edit only the
slice's files; run nothing — no `pnpm`, no test, no formatter; the package's `CLAUDE.md` loads
itself when a file is opened, never `cat` it; report only the files written, the
tests written, and anything the RFC did not settle — no narrative. A slice that holds a money, tenancy or
permission rule is never parallel: Main builds it.

When an agent returns, Main reads its report and `git diff --stat origin/main -- <its files>`,
runs its tests on the test database and `pnpm check` (to `.qa/check.log`), and reads a diff only
where a test or the check is red. The reviewer reads every line at step 6.

For each slice Main builds:

1. Tests first: each AC's test before its code (`.claude/rules/testing.md`). A money, tenancy or
   permission test, and a check you add or change, is seen red once, as `.claude/rules/testing.md`
   says; note each for the PR body.
   An `apps/api/tests` file runs with the test-database prefix: `pnpm db:migrate && pnpm exec vitest run <file> > .qa/<name>.log 2>&1`.
   A component spec runs with `pnpm --filter @heliogrid/e2e test:ct <spec> > .qa/ct.log 2>&1`. A `tests/e2e/web` spec
   runs as step 8 item 4 runs it — the test-database prefix, after `pnpm turbo build`, with nothing
   listening on 3002 or 8084 — and its red is seen there.
2. The smallest code that meets the line. Reuse what step 2 found.
3. `pnpm check` (to `.qa/check.log`) after each slice, and again after every later edit — so the gate meets no lint,
   catalog or coverage failure the fast check could have shown. Biome on the one file
   (`pnpm exec biome check --error-on-warnings <file>`) right after an edit catches a complexity or
   role-literal error before the slice ends.
4. One step gets two attempts. After both fail, stop with the evidence and at most two ways forward.

A new route, table, contract, package, affected package or behaviour voids the approval: update the
RFC, show what changed, and wait for a yes again. One asked for after QA is offered as its own PR
first: added here, it costs another round of review, QA and the gate. A file outside the RFC's file
table is added to it with its reason as it lands.

When the build is done, one tidy pass over the whole diff: reuse, names, dead code, files over 300
lines, comments that explain code instead of a constraint. Then delete each `deferred.md` row the
RFC lists as `**Deleted:**`, and give a `starts` row that stays its new `reopens when` — the gate's
invariant `rfc-proofs-hold` holds the list.

**The Build note.** Write `**Build note:**` as the last lines of the RFC, five lines at most: what
landed, by slice; the tests seen red, by name; what the reviewer should read first; what the RFC
left open, if anything; the `pnpm check` result. It goes to the PR body with the RFC.

Then say `next: /task in a new session` and stop. The review, QA, gate and PR run there.
