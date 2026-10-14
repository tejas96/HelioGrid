---
name: task
description: Use when the owner asks for HelioGrid's next build-order step or asks to start, continue, or finish a specific task or part. Never starts on its own.
user-invocable: true
disable-model-invocation: true
---

# /task — one engineering step, from the walk to the owner's merge

You are Main: the one writer. Helpers read and report; you decide, build, fix and clean up. The
laws are `CLAUDE.md`, cited by section and never copied; the order is `docs/build-order.md`; the
task in `docs/tasks/` is the operational source; the PRD rows and brief it cites are the higher
authority when it is unclear, silent or contradicts them.

Two approval classes and only two: the RFC is authored in step 2 and approved at the end of step
3; the initial commit uses the step 6 card and each additional CI-fix commit uses its step 7 card.
A design or dependency blocker is a prerequisite, not a gate: the step ends with the blocker
named. `/task <id>` for a task that is not the walk's step is refused with the step named.

## 0. Runtime rules — nothing runs before the walk

Step 1 is read-only and comes first. When it answers `build <id>`, read
`references/runtime.md` before switching a branch, inspecting a runtime or changing anything.
Create the `#### Part <x> · RFC` heading (`#### RFC` for an unsplit task) with the `#### Runtime`
ledger under it, exactly as that reference requires; step 2 writes the RFC sections above the
ledger. No runtime command,
infra start, database switch or device lifecycle action precedes it.

## 1. Select — the walk, fail closed

Read `references/walk.md`, execute it exactly, and emit its one line with the deciding file and
line. A result of `owner draws` or `owner clears` ends this `/task` run. A result of `build <id>`
continues through runtime setup to step 2.

## 2. The RFC — one document, one approval

A screen task runs step 3's design check and board capture (its first four paragraphs) before this
step: the RFC needs its verdict, its record and the owner's rulings on its `against code` rows.

Read `docs/tasks/README.md` before drafting a task RFC. It is the sole authority for RFC sections,
proof ownership, delivery size and Parts. A task RFC is written in its complete shape under the
task's header lines. A part RFC reads the task RFC and its own Parts row, never a shipped part or
its ledger, and does not re-read the README: this step holds the part's shape, and the task RFC
holds the proof owners and budget the part extends. It keeps every heading: its
own Title, Description, Proposal, File and folder changes, Acceptance criteria and proof and
Delivery size in full; each other section is one declared line — `The task RFC's, unchanged`,
`None — <reason>`, Readiness's `light cycle — <reason>`, or the diagram's `No boundary change —
see the task diagram` — and is written in full only where the part differs from the task RFC. A missing heading is a defect; a copied task section is one too.

An approved legacy `#### Plan`, `#### Acceptance criteria` and `#### QA plan` remains valid until
step 4 voids it. Then preserve it as history and write one complete replacement RFC for the
remaining task or part, including that part's applicable AC and proof rows. This explicit legacy
migration is the exception to keeping shared AC only in the task RFC. Never append a delta-only
Plan or make the owner reconstruct the decision from old sections.

Before showing the RFC, test every carried requirement from the PRD, brief, design record and task
— for a part, the lines its Parts row carries — for a defect, contradiction, ownerless fact or
drifting list, and for a simpler way to meet it.
Put each finding, codebase example, switching cost and recommendation in the RFC. A clear higher
source corrects the task before approval. Silence or ambiguity gives the owner at most two options;
the ruling lands in the PRD row or brief first, then the task. Implementation invents nothing.

Before showing the RFC, list every `docs/tasks/deferred.md` row this task meets: `T-<this> starts`,
`T-<x> ships` where x has shipped, and `touches <path>` where a path in the file table sits under
it. Each goes into the decision block as join this task or stays, recommended first; a row that
joins is deleted in this task's commit, a `T-<task> starts` row that joins a later part is
rewritten to that part's trigger (`T-<task><x> starts`), and a `starts` row that stays gets a new
`reopens when` cell, all in this commit, since its trigger is spent (the `deferred-rows` invariant
fails it otherwise).

## 3. Design check — screen tasks

Fetch the record yourself with `DesignSync` `get_file` (the project and file name are in the
task's `DESIGN:` link; the `… decisions … .md` sits beside the board) and hand its text, the brief
and `docs/start-here.md` to `design-check`. Fetch the board file too when it is under the read cap,
save it in the scratchpad by a script — never typed — and hand its path beside the record; a board
over the cap is said in `#### Design check`. `READY` goes into `#### Design check` with the
verdict's date and the record's exact file name, which a later fetch uses in place of a file
listing, and every entry — a first `READY` or a later part's "the verdict stands" — ends in one
line per screen the task designs, its digests the first 12 hex of `shasum -a 256` on the files as
read, never typed:
``Read: `<SCR-id>` · brief sha256:<12> · record sha256:<12> · board main sha256:<12>``, then
`· board <name> sha256:<12>` for each `also:` board its DESIGN line names; a board too large to
read says `board <name> over the read cap`. A brief edited after it fails the invariant
`design-check-fresh`: check the board again. Anything
else goes to the owner as the helper's one prompt. The owner's "done"
means: fetch again, check again. A studio screen reads `ported from the POC` and has no check.

A screen's board is pictured ONCE, at its first `READY`: `qa-web` pictures every frame of the
board in the browser pane Main opened (the owner signed in) — each state, at 375 and 1536, a phone
frame whole in one shot — into `.qa/board/<SCR-id>/<digests>/<frame>.png`, a git-ignored folder
named by its `Read:` line's record and board digests joined by `-` (a board over the cap adds none,
so its change is held only by the owner's word) that outlives the session, and returns their paths; Main's capture prompt names the folder a pane screenshot lands in,
`~/.claude/projects/<project>/<session id>/tool-results/` (the session id is in the scratchpad
path). `#### Design check` lists them beside
the `Read:` line. Every later part reuses them: it pictures again a frame missing from the folder
its own `Read:` line names — so a record or board that changed, under the same file name, starts
an empty folder — or every frame when the owner says the board changed. A frame reported `BLOCKED` is
retried once with the pane shown; still `BLOCKED`, it goes to the owner. Main never pictures a
board and never reads a picture: the helpers compare, and the card shows the files.

The check's `against code` rows go to the owner once, before the task's first RFC: the helper's
prompt for the rows the board must change, a brief ruling for each of the rest. Each row goes into
`#### Design check` as `| frame | the board | the code | ruling |`, the last cell `ruled: <the
owner's decision>` — the helper's `board`, `code` or `owner` is its suggestion, never a ruling; the
task's first RFC is written only when every row is ruled (the invariant `design-check-fresh`). A later part reads only what the board changed since.

The board is the design, not an order. A frame that looks wrong — against a PRD row, the brief, a
law or rule, accessibility or another frame, or with a clearly simpler way to the same row — goes to
the owner with at most two options, recommended first: fix the board (one paste-ready prompt), or
build the better way and record the ruling in the task. Never copy it silently, never depart from
it silently, and build neither way before the owner answers.

The RFC is written in full under the task, then the chat shows its short view, never the whole
text: the title; a link to the `#### … RFC` heading by file and line; the user impact from
`##### Description`; the `##### Architecture diagram` — drawn for a task RFC in the inline widget
by the Mermaid library from the file's own Mermaid block, never hand-placed, so the picture and
the record are one text (`references/diagram.md` holds the one widget recipe), and for a part
linked by file and line, drawn only when the part has a diagram of its own; a chat that cannot
draw shows the Mermaid block as it is; the `##### Delivery size` numbers on one line; then the
decision block, nothing after it. Every other section is read at the link.

- `Decisions for you:` each open ruling on one line — the section that holds it, its options,
  the recommended one first — or `none`.
- `Simplest build:` one line — what is reused, what is left out, and the simpler way taken when
  the step 2 test found one.
- exactly `Decision required: approve RFC / request changes`.

Stop. No test, migration or source edit begins before the owner's explicit approval
(`CLAUDE.md` §3). The approval covers the RFC as written at the link and nothing else. A request
for changes is answered the way step 4 shows a delta: one line per changed section, then the
decision block. One case does not stop: a part whose card reads `Decisions for you: none` and
whose file table sits inside the files and lines the approved task RFC's `##### Delivery size`
gave that part. Its short view is
shown with `Decision required: none — inside the approved task RFC` and the build begins; the
owner's approval of the task RFC covers it.

## 4. Build

Build as `CLAUDE.md` §3 and `.claude/rules/testing.md` say, one slice at a time, each slice the
smallest code that meets its line (`CLAUDE.md` §8 *Solve today's problem*, Law 5); each planted
red line is recorded for the commit card. Before the first edit under a package or app, read its
`CLAUDE.md`; an edit from the shell loads nothing. A new route, table, contract, package, affected
package or behaviour voids the approval: update the RFC and present the delta — a banner with files and
lines built against planned, the link, then one line per changed section saying what changed and
why; an unchanged section is not named — closing with the decision block as step 3 says. The
owner's yes to a delta covers the updated RFC whole. The chat never shows the whole RFC, not even
for a full replacement RFC for a legacy Plan, which gets the step 3 short view. A delta-only
`Plan` is not a replacement RFC. So does a requirement the build shows to be wrong or over-built:
the step 2 test applies, and the owner hears it before the code follows it.
The RFC's file table and authored-line estimate are the budget and record: a file that lands
outside it is added with its reason as it lands; a file in a package the RFC does not name voids
approval — stop, show the delta (planned and built · built but not planned, each with its reason ·
planned but not built), update the RFC and present the delta as above — never trim a proof to
fit. Files or lines more than 20% above the estimate void nothing: the commit card says by how
much and why (`docs/tasks/README.md`, Delivery size). Tick the part's checklist as each file group and proof
lands; the owner reads it, never a transcript.
A planted red that needs a database runs on `heliogrid_test`; no task creates a database of its
own.

## 5. QA — helpers once, on one stack

Read `references/qa.md` before preparing the stack or starting a helper. Follow its database,
account, packet, readiness, hash, timing, log and retry rules exactly. Only the surfaces the proof
rows name are started; a phone is booted for its rows and shut at teardown.

The full gate's limits are the Evaluator's own rules (`.claude/agents/evaluator.md`). Main's part:
fix an environmental failure and rerun only the failing command; a checked-file change left by or
made after a run is never planned — return to `references/qa.md`, continue the reviewer, rerun
every affected proof row, then run the command that proves the change and `pnpm check` before
continuing the same Evaluator. Never respawn the Evaluator; one lost to a restart follows
`references/qa.md`.

## 6. Pre-commit card

Show, and stop. First, five fixed lines: the surfaces QA ran on with each one's rows and results;
the board compared, `yes` with the frames or `no` with the reason; the reviewer's last verdict;
the gate's result; mistakes found. Then the AC proof summary (the evaluator's rows), the
side-by-side images of a screen task and its built Hindi and Marathi pictures, attached as files
Main composed by name and never read, the review result, every planted-red line, the changed files in three lists (planned and built · built
but not planned, each with its reason · planned but not built; more than 20% above the estimate
says by how much and why), the exact commit message (the task's `Status:` or the part's row turns
`shipped` in this commit), the rule that now prevents each mistake, unresolved blockers, the
runtime cleanup state, and two measurements — Main's context tokens from the session's usage reading, the helpers'
tokens summed from their completion notices — written under the `#### Runtime` ledger (step 0)
in the same commit, which also moves a shipped part's RFC body and ledger to the archive
(`docs/tasks/README.md`, Task anatomy).

The commit waits for the owner's yes to THIS card (`CLAUDE.md` §4).

## 7. Draft PR and CI

Push, open a DRAFT PR whose body carries the proof, the mistakes record and the reviewer's notes
left outside the diff (`references/qa.md`). The session stays
bound to its PR after the task ends: the app sends it every CI event, and it reads each one
without being asked. Judge only the latest run of the head SHA, step by step for a phone lane
(`docs/tasks/README.md`, the proof owners under RFC), never its colour alone. When every required lane has passed,
mark the PR ready yourself (`gh pr ready <number>`); the owner merges. A failed required job goes
to `ci-investigator` for that job only; show a CI-fix card (cause, files, proof, message); the
owner's `fix` approves that card and the push, nothing unshown. When the folder is already held
by a later part of the same task — its branch checked out, or a dirty tree — the fix lands on that
later branch, which carries this part, and this PR is closed as superseded by the later PR, whose
body says so; the folder is never switched under a running task.

## 8. Teardown — on success, block, cancellation or failure

Follow `references/runtime.md` teardown on every exit. Report each resource's initial and final
state. `DONE` is refused while a task-owned server, watcher, tab or phone lives or database
routing differs from its initial state.

## Helpers — `.claude/agents/`

`design-check` and `qa-web`'s board capture run in step 3; changed-surface QA, `qa-api` and
`reviewer` run in step 5; `evaluator` follows them; `ci-investigator` reads one failed job in step
7. Their own files are the only report contracts. Helpers start no helper and edit no repository
file. QA drives only its assigned API/browser/device surface; Evaluator alone may run the full gate
and cause its declared generated-file writes. Only Main reads the design record. A rerun continues
the same helper with the delta.
