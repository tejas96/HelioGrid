---
name: start
description: Begin a task or a bug fix the controlled way — read only the task's own section, state the three things, size the PR, create the branch, stop for the go. Use at the start of every piece of work.
---

# `/start <T-id | bug>` — understand, size, branch, stop

The cheapest token is the one never read. This skill reads the task, not the corpus.

## 1. Read only what the task carries

1. The task's own section of `docs/tasks/<module>.md` — from its `### T-…` heading to the next
   `---`. Its requirement rows are VERBATIM copies of the PRD (`docs/tasks/README.md` rule 1), so
   the PRD is never re-read for them.
2. The PRD only for what the section does not quote: the owning feature area's **Behavior
   detail** and **Edge cases** blocks, by heading, never the whole document.
3. `docs/prd/registers/open-questions.md` only for the `Q` ids the rows cite.
4. The worked example the task names, if any, in full — shape is copied from code, not described.

A bug is a task whose rows are the report. Its first proof is the reproduction on the real
surface, and the failing test comes before the fix (`CLAUDE.md` §1, §8).

## 2. Say the three things, then the reach

`CLAUDE.md` §3: which package owns each new file (`architecture.md` §4), which facts are new and
where each TYPE lives, and what will prove it works. Then the reach: the files that will change,
so the owner sees the shape before a line is written.

**A task that is really two tasks is split now, not shipped half.** Split at a seam that leaves
each slice complete on its own — a done-when list that passes, docs that agree, gates green — and
propose the slices in order. A slice that cannot pass its done-when alone is not a slice.

## 3. Branch, and stop

`git checkout -b <kind>/<t-id>-<slug> origin/main` — `feat` for a task, `fix` for a bug, `ci`,
`chore` or `docs` for work with no task rows. Then stop and wait for the go. The go covers this
branch and, later, the push and the PR (`CLAUDE.md` §4); every commit still waits for its own yes.

## What this skill never does

Read a whole task file or PRD "for context" · invent a requirement the rows do not state — record
the gap in `docs/prd/registers/open-questions.md` and ask · build before the go.
