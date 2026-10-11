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
Create the task's `#### Runtime` ledger exactly as that reference requires. No runtime command,
infra start, database switch or device lifecycle action precedes it.

## 1. Select — the walk, fail closed

Read `references/walk.md`, execute it exactly, and emit its one line with the deciding file and
line. A result of `owner draws` or `owner clears` ends this `/task` run. A result of `build <id>`
continues through runtime setup to step 2.

## 2. The RFC — one document, one approval

Read `docs/tasks/README.md` before drafting. It is the sole authority for RFC sections, proof
ownership, delivery size and Parts. Write its complete shape under the task's header lines.

An approved legacy `#### Plan`, `#### Acceptance criteria` and `#### QA plan` remains valid until
step 4 voids it. Then preserve it as history and write one complete replacement RFC for the
remaining task or part, including that part's applicable AC and proof rows. This explicit legacy
migration is the exception to keeping shared AC only in the task RFC. Never append a delta-only
Plan or make the owner reconstruct the decision from old sections.

Before showing the RFC, test every carried requirement from the PRD, brief, design record and task
for a defect, contradiction, ownerless fact or drifting list, and for a simpler way to meet it.
Put each finding, codebase example, switching cost and recommendation in the RFC. A clear higher
source corrects the task before approval. Silence or ambiguity gives the owner at most two options;
the ruling lands in the PRD row or brief first, then the task. Implementation invents nothing.

Before showing the RFC, list every `docs/tasks/deferred.md` row this task meets: `T-<this> starts`,
`T-<x> ships` where x has shipped, and `touches <path>` where a path in the file table sits under
it. Each goes into the decision block as join this task or stays, recommended first; a row that
joins is deleted in this task's commit.

## 3. Design check — screen tasks

Fetch the record yourself with `DesignSync` `get_file` (the project and file name are in the
task's `DESIGN:` link; the `… decisions … .md` sits beside the board) and hand its text, the brief
and `docs/start-here.md` to `design-check`. Fetch the board file too when it is under the read cap,
save it in the scratchpad by a script — never typed — and hand its path beside the record; a board
over the cap is said in `#### Design check`. `READY` goes into `#### Design check` with the
verdict's date and the record's exact file name, which a later fetch uses in place of a file
listing; anything else goes to the owner as the helper's one prompt. The owner's "done"
means: fetch again, check again. A studio screen reads `ported from the POC` and has no check.

After `READY`, `qa-web` pictures every frame the task renders from the board in the browser pane
Main opened (the owner signed in): each state, at 375 and 1536, and each language render, a phone
frame at least 375 px wide, into the scratchpad as `board/<frame>.png`, and returns their paths; a
frame it reports `BLOCKED` Main captures itself. `#### Design check` lists them; the build reads
the pictures with the record.

The board is the design, not an order. A frame that looks wrong — against a PRD row, the brief, a
law or rule, accessibility or another frame, or with a clearly simpler way to the same row — goes to
the owner with at most two options, recommended first: fix the board (one paste-ready prompt), or
build the better way and record the ruling in the task. Never copy it silently, never depart from
it silently, and build neither way before the owner answers.

Then present the RFC once — the complete section as written under the task, no second summary
and no plan beside it — with two things only the chat adds. The `##### Architecture diagram` is
drawn as a picture in the inline widget — the same nodes and arrows as the Mermaid, which stays
the record in the task file; a chat that cannot draw shows the Mermaid block as it is. The RFC
closes with the decision block, nothing after it:

- `Decisions for you:` each open ruling on one line — the section that holds it, its options,
  the recommended one first — or `none`.
- `Simplest build:` one line — what is reused, what is left out, and the simpler way taken when
  the step 2 test found one.
- exactly `Decision required: approve RFC / request changes`.

Stop. No test, migration or source edit begins before the owner's explicit approval
(`CLAUDE.md` §3). The approval covers the RFC as shown and nothing else. A request for changes is
answered the way step 4 re-shows a delta: the changed sections only, then the decision block.

## 4. Build

Build as `CLAUDE.md` §3 and `.claude/rules/testing.md` say, one slice at a time, each slice the
smallest code that meets its line (`CLAUDE.md` §8 *Solve today's problem*, Law 5); each planted
red line is recorded for the commit card. A new route, table, contract, package, affected package
or behaviour voids the approval: update the RFC and present the delta — a banner with files and
lines built against planned, then each changed section in full under its name; an unchanged
section is named as approved and never reprinted — closing with the decision block as step 3
says. The owner's yes to a delta covers the updated RFC whole. The whole RFC is shown again only
when it is a full replacement RFC for a legacy Plan. A delta-only `Plan` is not a replacement RFC. So does a requirement the build shows to be
wrong or over-built: the step 2 test applies, and the owner hears it before the code follows it.
The RFC's file table and authored-line estimate are the budget and record: a file that lands
outside it is added with its reason as it lands; when the budget rule in `docs/tasks/README.md` is
breached, or a file lands in a package the RFC does not name, approval is void — stop, show the delta
(planned and built · built but not planned, each with its reason · planned but not built),
update the RFC and present the delta as above — never trim a proof to fit. Tick the part's checklist as each file group and proof
lands; the owner reads it, never a transcript.
A planted red that needs a database runs on `heliogrid_test`; no task creates a database of its
own.

## 5. QA — helpers once, on one stack

Read `references/qa.md` before preparing the stack or starting a helper. Follow its database,
account, packet, readiness, hash, timing, log and retry rules exactly.

The normal path has one `pnpm check:all`. If its failure is environmental and changes no checked
file, rerun only the failing command and continue the Evaluator. A checked-file change left by or
made after the first run is never planned: return to `references/qa.md`, rerun every affected proof
row and continue the reviewer. Then run the command that proves the change and `pnpm check`, and
continue the same Evaluator with the updated reports for one final `pnpm check:all`. At most two
full-gate runs belong to one Evaluator. A failure of the second, or a checked-file change after it,
stops for the owner. Never respawn the Evaluator.

## 6. Pre-commit card

Show, and stop: the AC proof summary (the evaluator's rows), the side-by-side images of a screen
task, the review result, every planted-red line, the changed files in three lists (planned and
built · built but not planned, each with its reason · planned but not built), the exact commit message (the task's `Status:` or the part's row
turns `shipped` in this commit), mistakes found and the rule that now prevents each, unresolved
blockers, the runtime cleanup state, and the measurements — tool-call turns, Main's context tokens
from the session's usage reading, each helper's tokens, helper runs, planned versus built —
written under the task's `#### Runtime` in the same commit.

The commit waits for the owner's yes to THIS card (`CLAUDE.md` §4).

## 7. Draft PR and CI

Push, open a DRAFT PR whose body carries the proof and the mistakes record. A failed required job
goes to `ci-investigator` for that job only; show a CI-fix card (cause, files, proof, message);
the owner's `fix` approves that card and the same-PR push, nothing unshown. Judge only the latest
run of the head SHA, step by step for a phone lane (`docs/tasks/README.md` proof rules), never its
colour alone. Mark ready when every required lane has passed; the owner merges.

## 8. Teardown — on success, block, cancellation or failure

Follow `references/runtime.md` teardown on every exit. Report each resource's initial and final
state. `DONE` is refused while a task-owned process lives or database routing differs from its
initial state.

## Helpers — `.claude/agents/`

`design-check` and `qa-web`'s board capture run in step 3; changed-surface QA, `qa-api` and
`reviewer` run in step 5; `evaluator` follows them; `ci-investigator` reads one failed job in step
7. Their own files are the only report contracts. Helpers start no helper and edit no repository
file. QA drives only its assigned API/browser/device surface; Evaluator alone may run the full gate
and cause its declared generated-file writes. Only Main reads the design record. A rerun continues
the same helper with the delta.
