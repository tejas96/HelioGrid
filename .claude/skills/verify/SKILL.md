---
name: verify
description: Run end-to-end QA after development — the QA plan the ticket already carries, driven by one agent per surface the change reaches, checked for evidence, triaged and fixed in rounds, then the break tests recorded last and the ticket stamped with the digest of the tree that was driven. Use before calling any work done; /ship refuses an unstamped runtime tree.
---

# `/verify` — run the ticket's QA plan, check the evidence, stamp

Green gates prove the code compiles and the boundaries hold. They never prove a screen works. The
plan was written and reviewed at `/start`; this skill executes it and does not plan again.

Everything a run produces lives in the task's proof record,
`R="$(git rev-parse --git-common-dir)/heliogrid-harness/<T-id>/qa"`, which survives the session and
never enters the tree: the execution detail as `$R/run.md`, each agent's `$R/verdicts-<surface>.jsonl`,
parity as `$R/verdicts-parity.jsonl`, each recorded proof's line and log. A run first moves an
earlier run's verdict files and logs into `$R/earlier/<UTC time>/`. Anything else — a curl jar, a
screenshot — lives in the session scratchpad. Long command output goes to a file there; read its
verdict lines, never paste it whole.

## 1. The plan is the one that was reviewed

`bash scripts/verify-digest.sh --ticket <T-id>` must equal `$R/../review.sha`. A difference means the
Scope, the cases or the QA plan moved after the review: `case-reviewer` reads that change first
(`/start` §5). Then confirm the surfaces: `git diff --name-only origin/main` plus untracked files,
paths that cannot change runtime dropped (`*.md`, `.claude/**`, `docs/**`, lint and boundary configs),
the rest mapped —

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

A surface the diff reaches that the QA plan has no step for is a scope change, not a step added here.

**Depth.** `none` — no runtime path changed: report "no runnable surface", a complete result. `smoke`
— runtime code changed but no behaviour a person meets (a type, a module no screen reaches yet, a
config): boot each surface once yourself, read the console, one `curl -i` or the worker log; no
agents. When `git grep` finds no caller of the changed symbols outside their package, the smoke is
one import of the built package, `node -e "import('./packages/<name>/dist/index.js')"`, and nothing boots. `delta` — the task already carries a stamp and a fix changed part of its behaviour: the steps
that behaviour touches plus each surface's `landing`. `full` — the whole QA plan. A refactor with
gates green has no runtime depth. State the depth and why; a wrong `smoke` is a finding against this
skill, never a reason to run `full` on everything.

## 2. Execution detail — `$R/run.md`, not reviewed again

For each step: the seed it needs, the sign-in it reuses, and the `wire` calls it may make (method,
path, status, count, what the body carries). At most ten steps per agent dispatch, six on the phone;
each surface signs in at most twice; a shared fact is asserted on ONE surface, the other asserting
only its landing. **Mobile:** the first platform runs every mobile step; the second runs its `landing`
plus the steps only that platform can fail (forced dark, keyboard, back button, permissions).

**Seed at test time only.** A step over an empty list, a zero count or two empty companies proves
nothing. Where no route writes the row yet, the seed is a one-off command run from `apps/api` that
calls the module's OWN writer — never SQL by hand, never a file added to the repo:

```bash
pnpm --filter @heliogrid/api exec tsx --env-file-if-exists=<repo>/.env.local -e "(async () => {
  const { recordNotification } = await import('./src/modules/notification/notification.repository.ts');
  const { openPools } = await import('./tests/support/fixture.ts');
  const pools = openPools();
  await pools.admin.db.transaction((tx) => recordNotification(tx, { /* one row */ }, quietHours));
  await pools.close();
})()"
```

The seed writes into the run's own fresh company; the cross-tenant step seeds BOTH companies. Where no
writer exists at all, the step is `inconclusive: no writer`, named in the report.

## 3. Execute

**The author does not drive the plan** — driving by hand is diagnosis, never proof (`M113`). Dispatch
one agent per surface — `qa-web`, `qa-mobile`, `qa-api` (which also boots the worker and drives a
workflow through its route) — in ONE message, each with its own steps from the ticket, `run.md` and
`$R`. Each appends one verdict line per step to `$R/verdicts-<surface>.jsonl`; read those files, not
only the final message — a capped agent still recorded what it ran. A surface that returns nothing or
dies is `inconclusive`, never a pass.

**A proof no agent can drive** — a procedure that edits files, a gate broken on purpose — is a
`recorded` claim: it runs through `scripts/record-proof.sh`, which writes its verdict line to
`$R/verdicts-recorded.jsonl` from the command's own output (`M137`); the break is set up and restored
outside the recorded command. A line the recorder did not write is `inconclusive`.

## 4. Check the reports before believing them

1. Every `pass` carries an `observed` value and evidence; without, it is `inconclusive`.
2. Read every failure in full.
3. **Read every pass's evidence for a workaround** — a retry, a second sign-in, a step out of order, a
   precondition the executor made for itself. That is a finding, not a pass.
4. Spot-check every `blocker` step and two others against their evidence. A spot-check that
   contradicts the report makes the whole run untrusted: re-run it, never correct one row quietly.
5. **A gate's silence is checked** (Law 12): for every gate cited green, say what made it FIRE on this
   change; one that scanned none of your files abstained. Every fact the change adds to a guarded kind
   is named with its `mechanisms.md` row and the injection that proved it red.

## 5. Parity and screens

`qa-parity` runs when the diff touches a shared package, both app trees, or a screen with a twin
(review-only); otherwise say it was skipped and why. Give it both paths and every observed
value the surface agents recorded for the same quantity, and write its answer to
`$R/verdicts-parity.jsonl`. A value mismatch is a blocker (Law 11).

A screen is measured against its `HelioGrid-UX/` frames at 375 and 1536 — computed styles in the
browser, the simulator at 375 — never judged by eye; a difference the code must keep is ruled in the
ticket. A screen also reports its prose split (`F7-46`, review-only): the facts kept on screen,
the teaching behind the ask, the ask opened by tap and by keyboard, closed by Escape and an outside
tap, focus returned. A state that appears only on hover is a blocker.

## 6. Triage, fix, re-run

- **bug** — in scope, fix now; outside, `docs/tasks/deferred.md` (`CLAUDE.md` §8).
- **product-question** — rule it into the row between readings the PRD supports; a new feature or
  number is the owner's, asked with a pick.
- **design flaw** — back to `/start` §5: the ticket changes, the change is reviewed.
- **false-positive** — justified with evidence. **environment** — fix and re-run; not a round.

A failure takes the `severity` its step carries. Present findings with root causes before fixing. The QA agents never edit source. Each round re-runs
the failed steps plus the `landing` of any surface the fix changed, by **continuing the same agent**
(`SendMessage`) so it keeps its session and sign-in. A refactor fix needs no round. At most three
rounds, then escalate. Never edit the plan to make a failure disappear. When the owner says testing is
enough, stop and say what was and was not proven. A full re-run in fresh context is opt-in: offer it
when the change touches money, tenancy or auth.

## 7. Break tests — last, once

The code has stopped changing, so every `unit` and `invariant` claim is proven red now, once, through
`scripts/break-and-run.sh --task <T-id> --claims <ids> …` (`M140`, `.claude/rules/testing.md`); a type
guard through `tsc`, its `--pattern` copied from the broken run's `tsc` line; a gate or `tsc`, which
reads only files, with `--runs 1`. `--stale <T-id>` lists every author proof CURRENT before the stamp.
A proof built wrong is withdrawn with `--withdraw <id> --task <T-id>`, never edited by hand.

## 8. Clean up, report, stamp

Stop every process this run started (`preview_stop`, Metro, an emulator you booted), close each tab
when its server stops, and wait on a signal, never a timed loop. `git status --short` shows nothing
from the run.

Emit the `## Verification` section for `/ship`: per-surface counts, every failure with its observed
value, every parity comparison with both values, every `inconclusive` with its reason, the depth and
why — specifics, not adjectives ("browser 375+1536 happy / wrong-code paths; curl 409 returns
ALREADY_ONBOARDED", never "verified working"). A surface that could not run is stated plainly.

A clean run ends with the stamp. `scripts/verify-digest.sh` prints the digest of the runtime tree this
run drove (`apps/` and `packages/`, `.md` files and `tests/` folders aside). One line above
`**DONE WHEN:**`, replacing an earlier one:

`**Verified:** digest <12 hex> · <date> · <surface: pass/fail/inconclusive> … · parity <verdict>`

git's pre-commit refuses a runtime commit with no stamp for its digest (`M113`). Every count is copied
from the verdict files, which stay in `$R`, where `break-it-reviewer` matches them at `/ship`. Never
write the line for a run that did not happen, for a `smoke` that should have been `full`, or in place
of the agents. Work with no runtime change needs no stamp.
