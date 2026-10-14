# Build-order walk

Read this file before step 1 emits anything. The walk is read-only and reads the order from
`origin/main`, never from the checked-out branch.

Every read must succeed. A `git` or `gh` command that exits nonzero or prints an error stops the
walk: emit no step, and name the command and its error. An empty answer counts only from a command
that exited 0, so a failed `gh pr list` never reads as "no open PR".

1. Run `git fetch origin`. Read the block table and placement paragraphs in
   `docs/build-order.md` with `git show origin/main:<path>`.
2. For each block from 0, inspect each task file in the row's order with the command below. It
   prints each task's heading and header lines, and only the rows of the table under `#### Parts`,
   outside fenced blocks — the rows `tests/invariants/src/task-ledger.ts` reads, which the
   invariant `walk-reads-parts` holds. A copy of a Parts table anywhere else, as in an RFC's
   `##### Delivery size`, is history and is never printed.

   ````bash
   git show origin/main:docs/tasks/<file>.md | awk '
     /^[ \t]*```/ { fenced = !fenced; if (table == "in rows") table = ""; next }
     fenced { next }
     /^#### Parts[ \t]*$/ { table = "before rows" }
     table == "before rows" && /^\|/ { table = "in rows" }
     table == "in rows" && !/^\|/ { table = "" }
     table == "before rows" && /^#/ && !/^#### Parts[ \t]*$/ { table = "" }
     /^### T-|^\*\*(Type|Status|Depends on|Blocked|Parked|DESIGN|Design):\*\*|^#### Parts[ \t]*$/ || (table == "in rows" && /^\| [a-z] \|/) { print NR ": " $0 }'
   ````

3. Read the open pull requests once: `gh pr list --state open --limit 1000 --json headRefName`.
   A list of exactly 1000 heads may be cut short, so the walk stops as for a failed read. Inside
   one task file, choose the first open row of a `#### Parts` table. When an open PR's head branch
   is `feat/<task id>` plus one part letter, that task's file is read from that branch with the
   step 2 command, `origin/main` replaced by `origin/<branch>`; every other read stays on
   `origin/main`, and the new part's branch is cut from that head. When two or more heads belong
   to the task, read the one that contains all the others
   (`git merge-base --is-ancestor origin/<other> origin/<head>`: exit 0 is yes, exit 1 is no, any
   other code is a failed read); when none does, the step is `owner clears <id>`. Otherwise
   choose engine, policy, integration and port tasks first in file order, then screens in file
   order. A same-block dependency goes before its consumer; a task explicitly placed elsewhere
   follows the block row.
4. Skip tasks that are `shipped`, `struck`, carry `Parked:`, or serve only V2 screens
   (`docs/prd/registers/screens.md` §2, column `V`).

Classify the first remaining task:

| condition | one step |
|---|---|
| every dependency shipped and every screen it serves drawn | `build <id>`; a part uses its own id |
| its `DESIGN:` is `PENDING` | `owner draws <SCR-…>` |
| its `Design:` names another task's canvas | drawn only when that task's `DESIGN:` has a link; otherwise `owner draws <SCR-…>` |
| a backend has an undrawn V1 screen in its block that it serves, including a screen whose `Depends on:` names it | `owner draws <SCR-…>, …` |
| it has `Blocked:`, waits on a parked task, or depends on an open later-block task or later module's first migration | `owner clears <id>` with the blocker and at most two clearing paths, recommended first |

Emit exactly one line — `build <id>`, `owner draws <SCR-…>`, or `owner clears <id>` — with the
file and line that decided it. A `build <id>` read from an open PR head adds
`from origin/<branch>`: runtime setup cuts the part's branch from it (`references/runtime.md`).
`owner draws` continues with part A of `references/design.md`; `owner clears` ends this
`/task` run.
