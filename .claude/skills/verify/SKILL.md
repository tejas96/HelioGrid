---
name: verify
description: Run end-to-end QA after development on a HIGH-risk task — the QA plan the ticket already carries, driven by one agent per surface the change reaches, checked for evidence, triaged and fixed in rounds, then the red proofs recorded last and the ticket stamped with the digest of the tree that was driven. Use before calling HIGH work done; git's pre-commit and CI refuse an unstamped runtime tree on a HIGH task. A LOW task never runs it.
---

# `/verify` — run the ticket's QA plan, check the evidence, stamp (HIGH only)

A LOW task (`**Risk:** LOW` in its ticket) has no QA plan and needs no stamp: git's pre-commit and CI
read the tier from the task the branch names (`M113`). For a HIGH task, green gates prove the code
compiles and the boundaries hold; they never prove a screen works. The plan was written and reviewed
at `/start`; this skill executes it and does not plan again.

A run's output lives in the task's proof record,
`R="$(git rev-parse --git-common-dir)/heliogrid-harness/<T-id>/qa"`, never in the tree: the execution
detail `$R/run.md`, each agent's `$R/verdicts-<surface>.jsonl`, parity's, each recorded proof's line and
log; an earlier run's files move to `$R/earlier/<UTC time>/` first. Anything else — a curl jar, a
screenshot — lives in the session scratchpad, where long output goes to a file and only its verdict
lines are read.

## 1. The surfaces and the depth

`git diff --name-only origin/main` plus untracked files, paths that cannot change runtime dropped
(`*.md`, `.claude/**`, `docs/**`, lint and boundary configs), the rest mapped —

| Changed path | Surfaces |
|---|---|
| `apps/web/**` | web |
| `apps/mobile/**` | ios, android |
| `apps/api/**`, `packages/db/**` | api |
| `apps/worker/**` | worker |
| `packages/env/**` | every surface — the env schema gates every boot |
| `packages/contracts/**` | api + every consuming surface |
| `packages/data/**`, `packages/i18n/**`, `packages/forms/**` | web, ios, android |
| `packages/ui/**`, `packages/theme/**` | web and mobile |
| `packages/domain/**` | every surface that imports the changed symbol — grep the consumers |

A surface the diff reaches that the plan has no step for is a scope change (`/start` §6), never a step
added here.

**Depth.** `smoke` — runtime code changed but no behaviour a person meets yet: boot each surface once
yourself, read the console, one `curl -i` or the worker log, no agents; when `git grep` finds no caller
of the changed symbols outside their package, one import of the built package
(`node -e "import('./packages/<name>/dist/index.js')"`). `delta` — the task already carries a stamp
and a fix changed part of its behaviour: those steps plus each surface's `landing`. `full` — the whole
plan. State the depth and why; a wrong `smoke` is a finding against this skill, never a reason to run
`full` on everything.

## 2. Execution detail — `$R/run.md`, not reviewed again

Per step: the seed it needs, the sign-in it reuses, the `wire` calls it may make (method, path,
status, count, body). At most ten steps per dispatch, six on the phone; each surface signs in at most
twice; a shared fact is asserted on ONE surface, the other asserting only its landing. **Mobile:** the
first platform runs every step; the second its `landing` plus what only it can fail (forced dark,
keyboard, back button, permissions).

**Seed at test time only** — a step over an empty list, a zero count or two empty companies proves
nothing. Where no route writes the row yet, a one-off command from `apps/api` calls the module's OWN
writer — never SQL by hand, never a file added to the repo:

```bash
pnpm --filter @heliogrid/api exec tsx --env-file-if-exists=<repo>/.env.local -e "(async () => {
  const { recordNotification } = await import('./src/modules/notification/notification.repository.ts');
  const { openPools } = await import('./tests/support/fixture.ts');
  const pools = openPools();
  await pools.admin.db.transaction((tx) => recordNotification(tx, { /* one row */ }, quietHours));
  await pools.close();
})()"
```

It writes into the run's own fresh company; the cross-tenant step seeds BOTH. No writer at all → the
step is `inconclusive: no writer`, named in the report.

## 3. Execute

**The author does not drive the plan** — by hand is diagnosis, never proof (`M113`). One agent per
surface — `qa-web`, `qa-mobile`, `qa-api` (the worker too, driving a workflow through its route) — in
ONE message, each with its own steps, `run.md` and `$R`. Read `$R/verdicts-*.jsonl`, not only the final
message; a surface that returns nothing or dies is `inconclusive`, never a pass. A proof no agent can
drive — a procedure that edits files, a gate broken on purpose — is `recorded`: `scripts/record-proof.sh`
writes its verdict line to `$R/verdicts-recorded.jsonl` from the command's own output (`M137`), the
break set up and restored outside the recorded command; a line the recorder did not write is
`inconclusive`.

## 4. Check the reports before believing them

1. Every `pass` carries an `observed` value and evidence; without, it is `inconclusive`.
2. Read every failure in full.
3. **Read every pass's evidence for a workaround** — a retry, a second sign-in, a step out of order, a
   precondition the executor made for itself. That is a finding, not a pass.
4. Spot-check every `blocker` step and two others against their evidence. A spot-check that
   contradicts the report makes the whole run untrusted: re-run it, never correct one row quietly.
5. Every gate this change adds or alters was made to FIRE on it (Law 12); every new fact of a guarded
   kind is named with its `mechanisms.md` row.

## 5. Parity and screens

`qa-parity` runs when the diff touches a shared package, both app trees, or a screen with a twin
(review-only); otherwise say it was skipped and why. Give it both paths and every observed value the
surface agents recorded for the same quantity; its answer goes to `$R/verdicts-parity.jsonl`. A value
mismatch is a blocker (Law 11).

A screen is measured against its `HelioGrid-UX/` frames at 375 and 1536 — computed styles in the
browser, the simulator at 375 — never judged by eye; a difference the code must keep is ruled in the
ticket. A screen also reports its prose split (`F7-46`, review-only): the facts kept on screen, the
teaching behind the ask, the ask opened by tap and by keyboard, closed by Escape and an outside tap,
focus returned. A state that appears only on hover is a blocker.

## 6. Triage, fix, re-run

**bug** — in scope, fix now; outside, `docs/tasks/deferred.md`. **product-question** — rule it into
the row between readings the PRD supports; a new feature or number is the owner's, asked with a pick.
**design flaw** — back to `/start` §6. **false-positive** — justified with evidence. **environment** —
fix and re-run; not a round. A failure takes its step's `severity`. Present findings with root causes
before fixing; the QA agents never edit source. Each round re-runs the failed steps plus the `landing`
of any surface the fix changed, by **continuing the same agent** (`SendMessage`). At most three rounds,
then escalate. Never edit the plan to make a failure disappear. When the owner says testing is enough,
stop and say what was and was not proven. A full re-run in fresh context is offered, never assumed,
when the change touches money, tenancy or auth.

## 7. Red proofs — last, once

The code has stopped changing, so every case or done-when line naming a test of a money, tenancy,
permission or safety rule, and every gate this change adds or alters, is proven red now, once, through
`scripts/break-and-run.sh --task <T-id> --claims <ids> …` (`M140`, `.claude/rules/testing.md`) — a type
guard with `--pattern` copied from the broken run's `tsc` line, a gate with `--runs 1`. `--stale <T-id>`
lists every author proof CURRENT before the stamp; a proof built wrong is withdrawn
(`--withdraw <id> --task <T-id>`), never edited.

## 8. Clean up, report, stamp

Stop every process this run started (`preview_stop`, Metro, an emulator you booted); close each tab
when its server stops — a reused tab's old console errors read as the current page's; wait on a
signal, never a timed loop. `git status --short` shows nothing from the run.

Emit the `## Verification` section for `/ship`: per-surface counts, every failure with its observed
value, every parity comparison with both values, every `inconclusive` with its reason, the depth and
why — specifics, not adjectives ("browser 375+1536 happy / wrong-code paths; curl 409 returns
ALREADY_ONBOARDED", never "verified working").

A clean run ends with the stamp. `scripts/verify-digest.sh` prints the digest of the runtime tree this
run drove. One line above `**DONE WHEN:**`, replacing an earlier one:

`**Verified:** digest <12 hex> · <date> · <surface: pass/fail/inconclusive> … · parity <verdict>`

git's pre-commit refuses a HIGH task's runtime commit with no stamp for its digest (`M113`). Every
count is copied from the verdict files, which stay in `$R` for `break-it-reviewer` at `/ship`. Never
write the line for a run that did not happen, for a `smoke` that should have been `full`, or in place
of the agents: an author's smoke is worded as what was booted and seen, never as a verdict.
