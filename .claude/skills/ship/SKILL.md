---
name: ship
description: Close out a task — gates once, a review sized to the diff, the size and done-when checks, then a commit on a yes and the push and PR without one. Use when implementation and /verify are done.
---

# `/ship` — gates, review, size, commit on a yes, then push and PR

The PR is the one human gate (`CLAUDE.md` §8), so everything before it is mechanical and
everything in it is written for a five-minute read.

## 1. Gates, once

`pnpm verify` — every stage, read for its verdict, never for the exit code. If it already ran green
on this exact tree in this session (nothing changed since: `git status --short` and
`git diff --stat` identical), cite that run instead of running again. If the invariants ran
vacuously, say so — a green run has NOT proven tenancy. Never weaken a gate. Deleted a source
file? `pnpm turbo build --force` first, then Law 8's sweep.

## 2. Review sized to the diff

**Tier 0, every change, inline, two commands.** `git diff --name-status origin/main...HEAD`: for
each added or renamed file, name its `architecture.md` §4 step in one line; for each deleted or
moved path, grep `.claude/`, `docs/`, configs and `.env.example` for the dead pointer. Fix what
that finds.

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
without one is not done, and the PR is not opened. A task that turned out to be two is split
(`/start` §2), never shipped half.

## 4. Commit on a yes

Show the file list, the line count and the commit message, then STOP. A commit is never automatic.
On the yes: commit with the `Co-Authored-By` trailer, never `--no-verify`, never a QA scratchpad or
artifact directory.

## 5. Push and PR, no further ask

`git push -u origin <branch>`, then `gh pr create --base main` with this body, in this order:

1. **What and why** — one paragraph; the task id is in the title.
2. **Design** — the three things as decided, and any owner ruling applied, by `Q` id.
3. **Done-when** — a table: each line of the task, its proof, where the proof is.
4. **Verification** — the `/verify` section verbatim, including what was not run.
5. **Review and risks** — the review tier, its findings and their fate; what is deliberately not
   handled yet.

End with the generated-with line. Report the PR link and stop. Never merge, never push to `main`,
never force-push, never open a second PR for the same branch.
