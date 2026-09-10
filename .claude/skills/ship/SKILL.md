---
name: ship
description: Close out a task — gates once, a review sized to the diff, the done-when check, a commit on a yes, then push and print the PR body for the owner to raise the PR. Use when implementation and /verify are done.
---

# `/ship` — gates, review, done-when, commit on a yes, push, print the PR body

The PR is the one human gate (`CLAUDE.md` §8), so everything before it is mechanical and
everything in it is written for a five-minute read. The owner raises the PR; this skill never does.

## 1. Gates, once

`pnpm verify:clean` — the proof in CI's room (`M112`): a fresh clone of what git would commit, CI's
environment, every stage read for its verdict, never for the exit code. If it already ran green
on this exact tree in this session (nothing changed since: `git status --short` and
`git diff --stat` identical), cite that run instead of running again. If the invariants ran
vacuously, say so — a green run has NOT proven tenancy. Never weaken a gate. Deleted a source
file? `pnpm turbo build --force` first, then Law 8's sweep.

## 2. Review sized to the diff

**Tier 0, every change, inline, two commands.** `git diff --name-status origin/main` plus
`git ls-files --others --exclude-standard` — the working tree, so uncommitted work counts: for
each added or renamed file, name its `architecture.md` §4 step in one line; for each deleted or
moved path, grep `.claude/`, `docs/`, `scripts/`, `.github/`, configs and `.env.example` for the
dead pointer. Fix what that finds.

**Then break it.** Read the diff as an attacker and as an EPC expert: correctness, edges, failures,
null/empty/invalid, unexpected flows, regressions, performance, security, tenancy, money rounding,
provenance, placement, duplication, complexity, design mismatch, hidden assumptions. An issue
inside the task's scope is fixed now and its area re-reviewed; one outside it goes to
`docs/tasks/deferred.md` (`CLAUDE.md` §8).

**Tier 1, the agent, only for a structural diff.** Dispatch `arch-reviewer` when the diff (docs
excluded) creates a folder, spans two or more packages or apps, touches `packages/contracts` or
`packages/db`, or edits `docs/engineering/architecture.md` or `mechanisms.md`. The prompt is this
and no more:

> Branch `<name>`; diff `origin/main...HEAD` plus uncommitted work. New: `<files>`. Moved or
> deleted: `<files>`. Design decisions to check, not re-litigate: `<the three things>`. Gates are
> green — read, do not run.

Fix every blocker and major at the root cause and re-run only the gates the fix touches. One review
per change; do not re-review the review. A review that costs more than the change is the defect
this tiering prevents.

## 3. Completeness

Every done-when line of the task has its proof — a test, a `/verify` verdict or a gate. A line
without one is not done, and the PR body is not printed. A task that turned out to be two is
split (`/start` §3), never shipped half.

**The ceiling holds here too (`M111`).** Count the diff — `git diff --stat origin/main` plus
`git ls-files --others --exclude-standard`. Above **25 files or 1,500 lines**, or more than one
migration or one contract router, the PR body is not printed and the work goes back to `/start`
§3 to be split — unless the owner has ruled, in chat, that this one task ships whole.

## 4. Commit on a yes

Show the file list, the line count and the commit message, then END THE TURN. The yes is the
owner's next message, given to exactly what was shown; a go, a green gate, an event or a yes to
an earlier commit is not it, and a changed file list needs a new yes. On the yes: commit with the
`Co-Authored-By` trailer, never `--no-verify`, never a QA scratchpad or artifact directory.

## 5. Push, print the PR body, stop

`git push -u origin <branch>`. Then print the PR body in chat for the owner to paste, in this order:

1. **What and why** — one paragraph; the task id is in the title.
2. **Design** — the three things as decided, and any ruling applied, by row id.
3. **Done-when** — a table: each line of the task, its proof, where the proof is.
4. **Verification** — the `/verify` section verbatim, including what was not run.
5. **Review and risks** — the review tier, its findings and their fate; what is deliberately not
   handled yet.

End with the generated-with line. Then stop. Never open the PR, never merge, never push to `main`,
never force-push.

When the PR exists — the owner's, or one the owner told you to open — watch its checks
(`gh pr checks <n> --watch`) and report the verdict. A red lane is fixed on the same branch before
the merge, each commit with its own yes; CI runs only on the PR, so this is the first time the
committed tree is checked whole.
