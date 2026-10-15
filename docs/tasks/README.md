# Engineering tasks — structure and rules

One file per module (`M01-onboarding.md` … `M13-dashboards.md`), plus `SHELL.md` for the app
shell, `F-core.md` / `F-platform.md` / `F5-customer-link.md` where a foundation builds something
itself, and the studio split across `MS-studio-a.md` / `-b.md` / `-c.md`. `UI.md` is the one
file here that is a REGISTER rather than tasks — component gaps with no requirement rows behind
them, so no `T-` ids and no task anatomy. `deferred.md` holds what a task found outside its
scope; each row names what reopens it. Every task was
generated from the requirement register, and no P0 requirement exists without a task (or an
explicit `realized-by` pointer to the requirement that carries it); a task whose `PRD rows:` reads
`none` builds what other tasks' rows need.

## Task anatomy

A task is its header lines, written when the task is:

```
### T-M02-001 · Quick Add Lead
**Type:** screen · **Tier:** P0        (screen | engine | policy | integration | port · the highest tier among its rows)
**Status:** planned                    (planned | designed | shipped | struck — the one ledger)
**PRD rows:** M02-<nn> (P0), M02-<nn> (P0), M02-<nn> (P1)        — every id carries its tier (rule 6)
**DESIGN:** SCR-<module>-<nn> → PENDING          — filled by Claude Code with the module's canvas link when the screen's boards are locked (`.claude/skills/task/design-track.md`, `docs/start-here.md` *Recording a drawn screen*); a studio screen reads `ported from the POC`
**Design:** (older tasks, instead of DESIGN:) `none — <reason>` for a task with no screen, the existing boards it reuses, or `the same canvas as <task id>'s DESIGN line` and the frames it uses — only the last makes the walk wait, until that task's `DESIGN:` holds a link
**PORT:** (studio tasks only) POC files from docs/prd/modules/M05-studio/poc-file-claims.md
        — files to READ AND PORT FROM, never files to create here. A PORT entry that names a
        POC `*.test.ts` ports the LOGIC it proves into the studio package's own
        `tests/` tree, or into tests/invariants where it is a property of the system.
        `.claude/rules/testing.md` fixes the name and the place.
**DEFECTS:** (studio tasks only) rows from docs/prd/modules/M05-studio/defect-register.md
**Why:** one or two lines, in EPC terms — who gains what, and what breaks without it
**Depends on:** task ids and migration numbers that must land first
**Blocked:** (only while true) what only the owner can clear — a ruling, an account; the work stops here
**Parked:** (only while true) the owner's reason; the order steps over it
**DONE WHEN:** the requirement rows' own Given/When/Then, copied verbatim — never paraphrased.
        The RFC copies them into its *Acceptance criteria* (`.claude/skills/task/rfc-template.md`) and extends them there; the PRD's own lines stay word for word
```


While a task is built, its RFC sits under these lines as `#### RFC` (a part: `#### Part <x> · RFC`),
in the shape of `.claude/skills/task/rfc-template.md`. The commit that ships it moves the RFC into
the PR body and out of this file: a shipped task keeps only its header lines, and git and the PR
hold its history. A split task's `#### Parts` table and task RFC stay until its last part ships.

**Size.** A task is one PR; when it splits into parts, and how: `/task` step 3.

## Binding rules

0. **`Status:` is the ledger.** `planned` until every `DESIGN:` line holds a link (or, for a
   studio screen, reads `ported from the POC`), `designed` until the
   task ships, `shipped` written into the CHANGE commit itself, whose subject names the task —
   never a commit and never a PR of its own — and the squash commit on main carries the PR
   number. A split task's parts keep their own ledger in its `#### Parts` table (`open` →
   `shipped`, in the part's own change commit), and the task turns `shipped` with its last part. A
   part's id is the task id plus its letter (`T-SHELL-003a`); wherever `<T-id>` is written — the
   branch, the commit subject — a part uses its own id. Build, tests and verification are proven
   inside the PR, never tracked as states. A task whose rows moved to another task is `struck` —
   its heading says STRUCK, its stub stays so the id is never reused, and it is never counted as
   open work.
   **The ORDER is `docs/build-order.md`**, walked by `/task` step 1 — never a task picked from
   memory, and never a later task because it is ready. A ticket with no `Depends on:` line waits on
   nothing, and the RFC writes the line.
1. **Acceptance criteria are copied, never rewritten.** They were authored and locked in the
   PRD; "task language" paraphrases are how requirements drift.
2. **Requirement reference whitelist.** A task's header and requirement text may cite only:
   `docs/prd/**`, the screen's boards on its module's canvas, by the link on its `DESIGN:` line (the one source of a design; the repo keeps only the git-ignored lock in `.design/<module>/`),
   `docs/engineering/data-model.md` and `docs/engineering/forward-compat.md` (a schema-bearing
   task, where naming its entities or its first-migration row is clearer than restating them),
   `docs/ux/briefs/**`, `docs/prd/modules/M05-studio/defect-register.md`
   (studio tasks), and `3d_design_studio/**` — the POC repo, today at
   `/Volumes/works-space/Solar-App-POC/` (tasks typed `port` only). The RFC may additionally cite
   implementation authorities its sections require: architecture, protections, CI and package
   instructions. Anything else —
   old research docs, the v1 repo — is a defect in the task. A task never cites an open-question
   id: a PRD row carries its own ruling, and git carries the history.
3. **`DESIGN: PENDING` blocks the task at its turn**, and so does a board not yet locked
   (`/task` step 1): the Design track draws, checks and locks the module first. A backend task
   waits for the drawings of the screens it serves. A screen's UI is not "done" until it matches
   its board.
4. **Studio tasks are ports, not rewrites** (ruling S12-1): engineering core moves as-is with
   its tests; the UI is rebuilt from the POC and improved on the way, with no board;
   the defect register is the change list.
5. A task is complete when every DONE WHEN line passes and — for screen tasks — the **three**
   base states (loading, empty, error) plus brief-listed states exist at both 375px and 1536px
   with full parity. This rule is the completion bar every screen task is measured against.
6. **Every row id shows its tier where it appears.** A verbatim row quote carries it after the
   id — `**M02-02** (P0) — …`; a task that defers its quoting to the brief carries it on the
   `PRD rows:` line instead — `M02-01 (P0), M02-25 (P1)`. A task's own `Tier:` is the highest
   tier among its rows, so a P0 task may still contain P1/P2 rows: those are the cuttable ones,
   and they must be visible as such without opening the register.
