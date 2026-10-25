# /task · the RFC phase — steps 1 to 4

Read `SKILL.md` first; it holds the rules every phase keeps. This session ends when the owner's
yes is written under the RFC.

## 1. Pick the task

Nothing but reads runs before it — the only files it writes are boards, the support files they load
and a canvas's `project/canvas.json`, read into the scratchpad.
Every `git`, `gh` or Artifact read must succeed: a failed read stops the step with the command
and its error, and a failed `gh pr list` never reads as "no open PR".

1. `git fetch origin`, then read `docs/build-order.md` with `git show origin/main:docs/build-order.md`.
2. Walk its blocks from 0. Inside a block, take the task files in the order its row writes them;
   inside a file, its backend tasks (engine, policy, integration, port) before its screens, each in
   file order; a `Depends on:` in the same block pulls that task ahead, and its own `Depends on:`
   pulls in turn — the first task with nothing open under it is the one taken. Read each task's header
   lines from `origin/main`. Skip a task that is `shipped` or `struck`, carries `**Parked:**`, or
   serves only V2 screens (`docs/prd/registers/screens.md` §2, column `V`).
3. A task with a `#### Parts` table is taken by its first row that is not `shipped` and has no open
   PR, by its own id (`T-SHELL-003a`).
4. Read the open pull requests once:
   `gh pr list --state open --json number,headRefName,files,statusCheckRollup,reviewDecision`.
5. Two cases skip the walk. A task's open PR has a red CI job or review comments: take it on its
   own branch, at step 9's CI loop (`verify.md`). The owner names a task: take that task, still
   classified by the table below.

Classify the first task left, and say one line with the file and line that decided it:

| the task | the step |
|---|---|
| any open PR adds a migration (a file under `packages/db/migrations/`), or is the `design/<module>` PR of a module this task builds or serves | `owner merges #<n>` — the shared local database and the `DESIGN:` lines read from `origin/main` are only right after it merges. Stop. |
| an earlier part of the same task has an open PR | `owner merges #<n>` — this part builds on that code. Stop. |
| the task itself has an open PR (`feat/<id>`) | in review: skip it and walk on — its `shipped` reaches `origin/main` when the owner merges. |
| a task it depends on has an open PR | `owner merges #<n>` — this task builds on that code. Stop. |
| carries `**Blocked:**`, waits on a parked task or on an open task of a later block | `owner clears <id>` — the blocker and at most two ways to clear it, recommended first. Stop. |
| an owner-named task that serves only V2 screens (`docs/prd/registers/screens.md` §2) | `owner rules <screen>` — draw it ahead of V1, or not now; the Design track draws only V1 screens. Stop. |
| a screen it builds or serves reads `PENDING` on its `DESIGN:` line — or its older `**Design:**` line names another task's canvas whose `DESIGN:` reads `PENDING` | `design <module>` — run `design-track.md` on `design/<module>`, cut from `origin/main` on a clean tree; its step 1 draws the missing boards. |
| a screen it builds or serves, whose own task is not `shipped`, has boards that are not locked (`design-track.md`, *Is a board locked?*), or its brief has a `## Redesign owed` section | `design <module>` — run `design-track.md` on `design/<module>`, cut from `origin/main` on a clean tree, then walk again. |
| a task it depends on is not `shipped` and has no PR (an owner-named task) | take that task instead, walked the same way, and say so |
| otherwise | `build <id>` |

A studio screen reads `ported from the POC`: it has no board, and the POC
(`/Volumes/works-space/Solar-App-POC`) is its reference.

**Branch.** Continue `feat/<id>` when it exists, else cut it from `origin/main` on a clean tree. A
dirty tree on another branch belongs to its owner: name its files and stop. An RFC that already
carries `**RFC approved:**` is past this phase: say `next: /task in a new session` and stop.

## 2. Analyse

Read, in one batch, by id and range (`SKILL.md`): the task's header lines and `DONE WHEN`; each
PRD row it cites, by its id; its brief (`docs/ux/briefs/`), whole; for a screen task, each locked
board's frames and the components they name — `grep -o 'data-frame="[^"]*"'` and
`grep -o 'component-from-global-scope="[^"]*"' | sort -u` over `.design/<module>/<screen id>-*.dc.html`
(`.claude/rules/ui-adherence.md`, *A screen is its locked board*); every `docs/tasks/deferred.md`
row it meets (`T-<this> starts`, `T-<x> ships` where x has shipped, and `touches <path>` where a
planned file sits under that path), and also every row naming a screen it builds whatever its
trigger — a `Depends on:` can pull this task ahead of the one the row names, and a row whose change
this task draws joins it; `docs/engineering/architecture.md` §4. The `CLAUDE.md` of a package loads
itself when its files are read. Search the code for what already exists before planning anything
new (Law 5) — `grep` from Main; an `Explore` agent only for a sweep across many packages.

A planned file that an open PR adds or changes, or an export only an open PR adds, stops the
task: `owner merges #<n>`. `docs/tasks/` files are excepted: step 9 merges them.

Test every line the task carries, once, quickly:

- **Wrong** — it contradicts a higher source (`CLAUDE.md` §7) or the code as it stands.
- **Missing** — a state, an edge case from the table in `rfc-template.md`, or a role is not covered.
- **Over-built** — a simpler way meets the same PRD row, or the line builds for a future no row asks for.

A higher source corrects the task. Silence or ambiguity goes to the owner as a decision in the RFC,
at most two options, recommended first; the ruling lands in the PRD row or brief first, then in the
task. The build invents nothing.

## 3. Write the RFC

Write it under the task's header lines as `#### RFC` (a part: `#### Part <x> · RFC`), in the shape
of `rfc-template.md`. It is the one plan every agent works from: nobody downstream invents a
requirement it does not hold. Before the review, walk `rfc-template.md` against the RFC line by
line — its rule for reading code, its Proof rules and its edge-case table: a plan written from a
types file is the first review's most common blocker.

**A task is one PR, whatever its size.** It splits into parts only when the owner asks for it: each
part is then end to end and holds the web and phone halves of its flow together, and the task gets a
`#### Parts` table (`part | what | AC | depends on | status`).

## 4. Review the RFC, then ask once

Give `rfc-reviewer` the RFC pasted whole, the task's `DONE WHEN` lines, the PRD row ids, the brief
path and, for a screen task, each locked board path. Fix every finding it confirms in the RFC. A
finding you reject gets one line of reason in the RFC.

Then show the owner the short view, never the whole RFC: the title; a link to the `#### RFC`
heading by file and line; the user impact; the diagram as a Mermaid block when a boundary changes,
else the user's flow in one line per act; the size on one line; what the review changed, one line
each; then:

- `Decisions for you:` each open decision on one line — options, recommended first — or `none`. A
  motion moment new to a built screen is one of them.
- `Simplest build:` one line — what is reused, what is left out.
- `Decision required: approve RFC / request changes`

Stop. Nothing is built before the owner's yes. On the yes, write `**RFC approved:** <date>` as the
first line under the RFC heading just approved (a part: `#### Part <x> · RFC`). A part with no open
decision inside the approved task RFC needs no new yes (`CLAUDE.md` §3) and gets the line too,
citing the task RFC's approval; a part with one asks. A change request is answered with one line
per changed section, then the same three lines.

Then say `next: /task in a new session` and stop. The build starts there.
