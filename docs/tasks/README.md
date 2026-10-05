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

A task is its header lines, written when the task is. The plan adds its sections under them —
`#### Plan` and `#### Acceptance criteria`; for a split task `#### Parts` and each part's
`#### Part <x> · Plan`. The header lines:

```
### T-M02-001 · Quick Add Lead
**Type:** screen · **Tier:** P0        (screen | engine | policy | integration | port · the highest tier among its rows)
**Status:** planned                    (planned | designed | shipped | struck — the one ledger)
**PRD rows:** M02-<nn> (P0), M02-<nn> (P0), M02-<nn> (P1)        — every id carries its tier (rule 6)
**DESIGN:** SCR-<module>-<nn> → PENDING          — filled when the screen is approved; a screen with more than one board lists the others after the main link: `· also: <board> <link>`; a studio screen reads `ported from the POC`
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
        The plan copies them into `#### Acceptance criteria` and extends them there; the PRD's own lines stay word for word
```

Each acceptance line names its proof: a test by file and name, or a check on the running app. A
money, tenancy or permission rule's test is seen to fail once (`.claude/rules/testing.md`).
Nothing checks a task's shape: the plan fixes a missing part before the owner's go.
**A shipped section keeps the shape it shipped in** — its `Risk:`, `Cases:`, `Placement:`,
`Used by:`, `QA plan:`, `Rounds:` and `Verified:` lines, and its verification record, stay as
history and are never rewritten. An open task that still carries one of those lines keeps it the
same way: the plan adds its sections under the header lines and changes nothing above them.

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
   **The ORDER is `docs/build-order.md`**: its blocks place every task file, each file's backend tasks
   go before its screens, each in the order they are written, a backend waits for the drawings of the
   screens it serves, and a `Depends on:` pulls a task of the same block ahead. The next
   step is the ONE the session picks from it — the next open part of a split task, build a task, the
   owner draws a screen at its turn, or the owner clears a `**Blocked:**` line — never one picked
   from memory and never a later task because it is ready. A ticket with no `Depends on:` line waits
   on nothing, and the plan writes the line.
1. **Acceptance criteria are copied, never rewritten.** They were authored and locked in the
   PRD; "task language" paraphrases are how requirements drift.
2. **Reference whitelist.** A task may cite only: `docs/prd/**`, the screen's board and decisions record in the Claude Design project, by the link on its `DESIGN:` line (the one source of a design — the repo holds no copy),
   `docs/engineering/data-model.md` and `docs/engineering/forward-compat.md` (a schema-bearing
   task, where naming its entities or its first-migration row is clearer than restating them),
   `docs/ux/briefs/**`, `docs/prd/modules/M05-studio/defect-register.md`
   (studio tasks), and `3d_design_studio/**` — the POC repo, today at
   `/Volumes/works-space/Solar-App-POC/` (tasks typed `port` only). Anything else —
   old research docs, the v1 repo — is a defect in the task. A task never cites an open-question
   id: a PRD row carries its own ruling, and git carries the history.
3. **`DESIGN: PENDING` blocks the task at its turn.** The drawing is the step: the owner
   draws it, then the task is built. A backend task waits for the drawings of
   the screens it serves (rule 0). A screen's UI is not "done" until it matches its board in Claude
   Design.
4. **Studio tasks are ports, not rewrites** (ruling S12-1): engineering core moves as-is with
   its tests; the UI is rebuilt from the POC and improved on the way, with no Claude Design board;
   the defect register is the change list.
5. A task is complete when every DONE WHEN line passes and — for screen tasks — the **three**
   base states (loading, empty, error) plus brief-listed states exist at both 375px and 1536px
   with full parity. This rule is the completion bar every screen task is measured against.
6. **Every row id shows its tier where it appears.** A verbatim row quote carries it after the
   id — `**M02-02** (P0) — …`; a task that defers its quoting to the brief carries it on the
   `PRD rows:` line instead — `M02-01 (P0), M02-25 (P1)`. A task's own `Tier:` is the highest
   tier among its rows, so a P0 task may still contain P1/P2 rows: those are the cuttable ones,
   and they must be visible as such without opening the register.
