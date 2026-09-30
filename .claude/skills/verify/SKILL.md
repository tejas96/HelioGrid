---
name: verify
description: Run end-to-end QA after development on a HIGH-risk task — the QA plan the ticket already carries, driven by one agent per surface the change reaches, checked by the checker and by reading the evidence, triaged and fixed in capped rounds, then the red proofs recorded last and the ticket stamped with the digest of the tree that was driven and the counts the checker prints. Use before calling HIGH work done; git's pre-commit and CI refuse an unstamped runtime tree on a HIGH task. A LOW task never runs it.
---

# `/verify` — run the ticket's QA plan, check the evidence, stamp (HIGH only)

A LOW task (`**Risk:** LOW` in its ticket) has no QA plan and needs no stamp: git's pre-commit and CI
read the tier from the task the branch names (`M113`). For a HIGH task, green gates prove the code
compiles and the boundaries hold; they never prove a screen works. The plan was written and reviewed
at `/start`; this skill executes it and does not plan again.

A run's output lives in the task's proof record,
`R="$(git rev-parse --git-common-dir)/heliogrid-harness/<T-id>/qa"`, never in the tree: the execution
detail `$R/run.md`, each agent's own `$R/verdicts-<surface>.jsonl`, each recorded proof's line and log,
and every evidence file under `$R/evidence/`, where it outlives the session; an earlier run's files move
to `$R/earlier/<UTC time>/` first. Only working files — a curl jar, long output read for its verdict
lines — live in the session scratchpad.

## 1. The surfaces and the depth

`bash scripts/verify-digest.sh --surfaces` prints the surfaces the diff reaches and the changed files
under each — an app is its own surface, a package reaches every app that depends on it, a root file
reaches every surface (`M151`); `/start` §4 ran the same table over the Scope. A surface it prints that
the plan has no step for is a scope change (`/start` §6), never a step added here.

**Depth.** `smoke` — runtime code changed but no behaviour a person meets yet: each surface booted
once, the console read, one `curl -i` or the worker log, no agents; when `git grep` finds no caller of
the changed symbols outside their package, one import of the built package
(`node -e "import('./packages/<name>/dist/index.js')"`). Every smoke check runs through
`scripts/record-proof.sh` into `$R/verdicts-recorded.jsonl`, its expected pattern stating the whole
claim, so the stamp stands on verdict lines only. `delta` — the task already carries a stamp and a fix
changed part of its behaviour: those steps, the steps the checker reports stale, and each touched
surface's `landing`. `full` — the whole plan. State the depth and why; a wrong `smoke` is a finding
against this skill, never a reason to run `full` on everything.

## 2. Execution detail — `$R/run.md`, exact, not reviewed again

Per step: the seed it needs, the sign-in it reuses, the `wire` calls it may make (method, path,
status, count, body). Per surface: the routes or screens the change reaches — the probes' targets
(`references/test-matrix.md` §"Probes") — and the depth, which sets how many. At most ten steps per dispatch, six on the phone; each surface signs in at most
twice; a shared fact is asserted on ONE surface, the other asserting only its landing.

**Each surface its own account and its own company.** A sign-out ends every session of that person
(`apps/api/src/modules/auth/auth.controller.ts`, `signOutEverywhere`), so two surfaces sharing an
account sign each other out mid-run: the development number goes to ONE surface, every other surface
signs up a fresh `+91` number, and each seeds only into its own company, so no count or list step
reads another agent's rows.

**Mobile:** iOS and Android are two dispatches of `qa-mobile`, one platform each. Every step names ONE
platform; only a `landing` may say `mobile`, meaning both. The second platform runs its landing plus
what only it can fail (forced dark, keyboard, back button, permissions).

**Every literal is copied, never remembered.** An expected word names its `packages/i18n` descriptor,
file and line; an expected colour names its token and the resolved value; every designed background a
step crosses is named. Before dispatch, re-read every literal against the final tree — one the build
changed goes back through `/start` §6, never into a failed round. A step that compares with `main` is
measured on `main` in round 0, before round 1: `git stash push -u`, the agents measure, `git stash
pop` — never replaced by literals, and only when the plan has such a step. Markup injected or copied
into a page is never evidence: a step that needs it is `inconclusive` until a component test can mount
the real component.

**Seed at test time only** — a step over an empty list, a zero count or two empty companies proves
nothing. Where no route writes the row yet, a one-off command from `apps/api` calls the module's OWN
writer — never SQL by hand, never a file added to the repo:

```bash
pnpm --filter @heliogrid/api exec tsx --env-file-if-exists=<repo>/.env.local -e "(async () => {
  const { recordNotification } = await import('./src/modules/notification/notification.repository.ts');
  const { openPools } = await import('./tests/support/fixture.ts');
  const { clockTime } = await import('@heliogrid/domain');
  const quietHours = { window: { start: clockTime('22:00'), end: clockTime('07:00') }, timezone: 'Asia/Kolkata' };
  const pools = openPools();
  await pools.admin.db.transaction((tx) => recordNotification(tx, { /* one row */ }, quietHours));
  await pools.close();
})()"
```

`quietHours` is the tenant's `TenantQuietHours` (`notification.repository.ts`); read the writer's own
signature for any other. It writes into the run's own fresh company; the cross-tenant step seeds BOTH.
No writer at all → the step is `inconclusive: no writer`, named in the report.

## 3. Prepare, dispatch, watch

**The author does not drive the plan** — by hand is diagnosis, never proof (`M113`) — and **the author
owns every server and device.** Prepare once, before round 1, while the owner is present:

1. Load `SendMessage`, `Monitor` and `TaskStop` with `ToolSearch` — they are deferred tools.
2. Start every server `run.md` names with `preview_start` (api, web, `mobile-metro`, `worker`), and
   note each server id. The api writes its log to `$(git rev-parse --git-common-dir)/heliogrid-harness/api.log`.
3. Boot and install each device `run.md` names: the simulator (`xcrun simctl boot <udid>`, then the
   simulator tool's `attach`, which asks for access on a device's first use) and the Pixel emulator
   with its window, never `-no-window`. Open the app once on each, so both bundles are warm before an
   agent's first step, and open the browser tab once.
4. Save `git status --short > $R/status-at-dispatch`, and take the round's tree:
   `bash scripts/verify-digest.sh --tree`.
5. When the change reaches a phone, run the phone suite ONCE per device, one after the other —
   `bash tests/e2e/mobile/run.sh <udid>`, then `<serial>`; two at once lose keys — and, when it
   changes a `packages/ui` component,
   only this task's own component specs — `pnpm --filter @heliogrid/e2e test:ct <its spec files>` —
   each through `scripts/record-proof.sh`. The web suite and the whole component suite run in CI
   (`e2e-web`) and never here; no agent re-drives a flow the suite drives.

**Dispatch** one agent per surface — `qa-api`, `qa-web`, `qa-mobile` for iOS and `qa-mobile` for
Android — in ONE message, in the background, and write one `dispatched <surface> <UTC time>` line per
agent into `$R/run.md` (`date -u +%FT%TZ`): the checker's `wall:` runs from it (`M151`). Each prompt names its steps, `run.md`, `$R`, the round,
the stage (`verify`), the tree, every server id, its device (udid or serial), its own account, and says
**"servers and devices are up; never start, boot or stop one."** Tell the owner the run is
watch-only: a click in the pane, the simulator or the emulator lands inside an agent's step; if they
touch one, that surface's steps of the round are driven again.

**Watch.** `Monitor` each surface's verdict file. A file with no new line for 15 minutes is a stuck
agent: `TaskStop` it; its unfinished steps are `inconclusive: agent stopped`. Post the owner ONE line
per agent as it returns, its numbers copied from the checker's `counts:` line, never typed. **No file
is edited while any agent of the round still runs** — `next dev` and Metro reload under a running
step, and the round's tree no longer names what was driven.

A proof no agent can drive — a procedure that edits files, a gate broken on purpose — is `recorded`:
`scripts/record-proof.sh` writes its line to `$R/verdicts-recorded.jsonl` from the command's own output
(`M137`), with `--step` when it decides a plan step and `--max-seconds` so a hang reads
`inconclusive`; the break is set up and restored outside the recorded command.

## 4. Check the record, then the reports

1. `bash scripts/verify-digest.sh --verdicts <T-id>` decides what a machine can (`M151`): the line
   shape, every step and claim the plan's own, a line for every plan step and surface, each step's
   last line a `pass`, no `inconclusive`, no pass stale against the current tree, the round caps, and
   every author line against its log. Read each `REFUSED` line; its `wall:` line gives each surface's
   minutes.
2. Read every failure in full, from the files, not only the agent's final message.
3. **Read every pass's evidence for a workaround** — a retry, a second sign-in, a step out of order, a
   precondition the executor made for itself. That is a finding, not a pass.
4. Spot-check every `blocker` step and two others against their evidence. A spot-check that
   contradicts the report makes the whole run untrusted: re-run it, never correct one row quietly.
5. Every gate this change adds or alters was made to FIRE on it (Law 12); every new fact of a guarded
   kind is named with its `mechanisms.md` row.

## 5. Parity and screens

`qa-parity` runs when the diff touches a shared package, both app trees, or a screen with a twin
(review-only); otherwise say it was skipped and why. It runs ONCE, after the surface rounds settle, on
the final tree, and again only when the checker reports its line stale. Give it both paths and every
observed value the surface agents recorded for the same quantity; it appends its own lines to
`$R/verdicts-parity.jsonl`, one per plan step. A value mismatch is a blocker (Law 11).

A screen is measured against its `HelioGrid-UX/` frames at 375 and 1536 — computed styles in the
browser, the simulator at 375 — never judged by eye; a difference the code must keep is ruled in the
ticket. A screen also reports its prose split (`F7-46`, review-only): the facts kept on screen, the
teaching behind the ask, the ask opened by tap and by keyboard, closed by Escape and an outside tap,
focus returned. A state that appears only on hover is a blocker.

## 6. Triage, fix, re-run — capped

**bug** — in scope, fix now; outside, `docs/tasks/deferred.md`. **product-question** — rule it into
the row between readings the PRD supports; a new feature or number is the owner's, asked with a pick.
**design flaw** — back to `/start` §6. **false-positive** — the agent drives the step again with the
corrected expectation, a new line in the current round; never a line typed by hand. **environment** —
fix and re-run in the same round; at most two `inconclusive` lines per step. A failure takes its step's
`severity`. Present findings with root causes before fixing; the QA agents never edit source.

A fix waits until every agent of the round has returned or been stopped. Each fix round takes the next
`round` number and the current `--tree`, and re-runs only the failed steps, by **continuing the same
agent** (`SendMessage`). After the LAST fix, ONE stale pass: every step the checker reports stale,
driven again under the same round number, then parity if its line is stale. **A verdict changes only
by a new drive** — never re-judged from an earlier round's values. `/verify` stops at round 3; only the
owner raises it, with a `**Rounds:** verify <n> — owner, <reason>` line in the ticket. A cap reached is
a STOP: show the owner what failed, with two picks — fix the machine or the code and allow one more
round, or re-plan the step through `/start` §6. Never edit the plan to make a failure disappear. When
the owner says testing is enough, stop and say what was and was not proven. A full re-run in fresh
context is offered, never assumed, when the change touches money, tenancy or auth.

## 7. Red proofs — last, once

The code has stopped changing, so every case or done-when line naming a test of a money, tenancy,
permission or safety rule, and every gate this change adds or alters, is proven red now, once, through
`scripts/break-and-run.sh --task <T-id> --claims <ids> …` (`M140`, `.claude/rules/testing.md`) — a type
guard with `--pattern` copied from the broken run's `tsc` line, a gate with `--runs 1`. `--stale <T-id>`
lists every author proof CURRENT before the stamp — a proof goes stale when any file of its package's
`src/` changes; a proof built wrong is withdrawn (`--withdraw <id> --task <T-id>`), never edited.

## 8. Close, report, stamp

Whoever started a thing stops it. Every agent has returned or been stopped, and every `Monitor` is
stopped. `preview_stop` each server, closing its tab — a reused tab's old console errors read as the
current page's. Turn the network back on for each Android device the run used, whatever a step left —
`adb -s <serial> shell cmd connectivity airplane-mode disable` — then shut each device the run booted:
`xcrun simctl shutdown <udid>`, `adb -s <serial> emu kill`. Then prove it, each command printing nothing: `lsof -nP -iTCP:3002 -iTCP:8084 -iTCP:8081 -sTCP:LISTEN -t` (listeners only: the browser pane keeps client connections open) ·
`pgrep -f '@heliogrid/worker'` · `xcrun simctl list devices booted | grep -F <each udid the run
booted>` · `adb devices | grep emulator` · `git status --short | diff - $R/status-at-dispatch`; and
`bash scripts/verify-digest.sh --tree` prints the last round's tree.

Emit the `## Verification` section for `/ship`: the checker's `counts:` and `wall:` lines, every failure
with its observed value, every parity comparison with both values, every `inconclusive` with its
reason, the depth and why — specifics, not adjectives ("browser 375+1536 happy / wrong-code paths;
curl 409 returns ALREADY_ONBOARDED", never "verified working").

A clean run ends with the stamp, one line above `**DONE WHEN:**` in the task's OWN section, replacing an
earlier one:

`**Verified:** digest <what scripts/verify-digest.sh prints> · <date> · <the checker's counts: text, copied>`

git's pre-commit refuses a HIGH task's runtime commit whose stamp is missing, sits in another task's
section, stands on a record the checker refuses, or carries counts that are not the record's (`M113`,
`M151`); CI reads the stamp's place again. The record stays in `$R` for `break-it-reviewer` at `/ship`.
Never write the line for a run that did not happen, for a `smoke` that should have been `full`, or in
place of the agents.
