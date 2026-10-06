# Build-order walk

Read this file before step 1 emits anything. The walk is read-only and reads the order from
`origin/main`, never from the checked-out branch.

1. Run `git fetch origin`. Read the block table and placement paragraphs in
   `docs/build-order.md` with `git show origin/main:<path>`.
2. For each block from 0, inspect each task file in the row's order:
   `git show origin/main:docs/tasks/<file>.md | rg -n -e '^### T-' -e '^\*\*(Type|Status|Depends on|Blocked|Parked|DESIGN|Design):\*\*' -e '^#### Parts' -e '^\| [a-z] \|'`.
3. Inside one task file, choose the first open row of a `#### Parts` table. Otherwise choose
   engine, policy, integration and port tasks first in file order, then screens in file order.
   A same-block dependency goes before its consumer; a task explicitly placed elsewhere follows
   the block row.
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
file and line that decided it. `owner draws` and `owner clears` end this `/task` run.
