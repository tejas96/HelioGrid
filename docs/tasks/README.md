# Engineering tasks — structure and rules

One file per module (`M01-onboarding.md` … `M13-dashboards.md`), plus `SHELL.md` for the app
shell, `F-core.md` / `F-platform.md` / `F5-customer-link.md` where a foundation builds something
itself, and the studio split across `MS-studio-a.md` / `-b.md` / `-c.md`. `UI.md` is the one
file here that is a REGISTER rather than tasks — component gaps with no requirement rows behind
them, so no `T-` ids and no task anatomy. `deferred.md` holds what a task found outside its
scope; each row there is the next task (`CLAUDE.md` §8). Every task was
generated from the requirement register — no task exists without requirement rows behind it,
and no P0 requirement exists without a task (or an explicit `realized-by` pointer to the
requirement that carries it). The proof lives in `docs/prd/registers/screens.md` §gates.

## Task anatomy

A task is its header lines, written when the task is. `/start` adds three sections under them —
`#### Plan`, `#### Acceptance criteria` and `#### QA plan` — in the format
`.claude/skills/start/SKILL.md` gives under "The task format" and "The QA plan format", which is
the one place that format is written. The header lines:

```
### T-M02-001 · Quick Add Lead
**Type:** screen · **Tier:** P0        (screen | engine | policy | integration | port · the highest tier among its rows)
**Status:** planned                    (planned | designed | shipped | struck — the one ledger)
**PRD rows:** M02-<nn> (P0), M02-<nn> (P0), M02-<nn> (P1)        — every id carries its tier (rule 6)
**DESIGN:** SCR-<module>-<nn> → PENDING          — filled when the screen is approved; a screen with more than one board lists the others after the main link: `· also: <board> <link>`
**PORT:** (studio tasks only) POC files from docs/prd/modules/M05-studio/poc-file-claims.md
        — files to READ AND PORT FROM, never files to create here. 66 PORT entries name a
        POC `*.test.ts`; port the LOGIC it proves into the studio package's own
        `tests/` tree, or into tests/invariants where it is a property of the system.
        `.claude/rules/testing.md` fixes the name and the place.
**DEFECTS:** (studio tasks only) rows from docs/prd/modules/M05-studio/defect-register.md
**Why:** one or two lines, in EPC terms — who gains what, and what breaks without it
**Depends on:** task ids and migration numbers that must land first
**Blocked:** (only while true) what only the owner can clear — a ruling, an account; `/start` stops here
**Parked:** (only while true) the owner's reason; `/start` steps over it
**DONE WHEN:** the requirement rows' own Given/When/Then, copied verbatim — never paraphrased.
        `/start` renames it `#### Acceptance criteria` and extends it; the PRD's own lines stay word for word
```

Each acceptance line names its proof: a test by file and name, or a QA check id. A money, tenancy
or permission rule's test is seen to fail once, at `/ship`, on the break `code-reviewer` names.
Nothing checks a task's shape: `/start` fixes a missing part before the go, and `plan-reviewer`
reads the plan when it touches money, tenancy, permissions or the schema.
**A shipped section keeps the shape it shipped in** — its `Risk:`, `Cases:`, `Placement:`,
`Used by:`, `QA plan:`, `Rounds:` and `Verified:` lines, and its verification record, stay as
history and are never rewritten. An open task that still carries one of those lines keeps it the
same way: `/start` adds the three sections under the header lines and changes nothing above them.

## Binding rules

0. **`Status:` is the ledger.** `planned` until every `DESIGN:` link is filled, `designed` until the
   task ships, `shipped` written into the CHANGE commit itself, whose subject names the task —
   never a commit and never a PR of its own — and the squash commit on main carries the PR
   number. Build, tests and QA are proven inside the PR, never tracked as states. A task whose rows moved to another task is `struck` —
   its heading says STRUCK, its stub stays so the id is never reused, and it is never counted as
   open work.
   **The ORDER is `docs/build-order.md`**: its blocks place every task file, each file's backend tasks
   go before its screens, each in the order they are written, a backend waits for the drawings of the
   screens it serves, and a `Depends on:` pulls a task of the same block ahead. The next
   step is the ONE `/start` step 2 picks — build a task, the owner
   draws a screen at its turn, or the owner clears a `**Blocked:**` line — never one picked from
   memory and never a later task because it is ready. A ticket with no `Depends on:` line reads there
   as waiting on nothing, so `/start` writes the line.
1. **Acceptance criteria are copied, never rewritten.** They were authored and locked in the
   PRD; "task language" paraphrases are how requirements drift.
2. **Reference whitelist.** A task may cite only: `docs/prd/**`, `HelioGrid-UX/**` (the exported artboards and decisions records, one pair per screen, and the design system's source in `_ds-source/` — a git-ignored folder at the repo root that each machine exports itself),
   `docs/engineering/data-model.md` and `docs/engineering/forward-compat.md` (a schema-bearing
   task, where naming its entities or its first-migration row is clearer than restating them),
   `docs/ux/briefs/**`, `docs/prd/modules/M05-studio/defect-register.md`
   (studio tasks), and `3d_design_studio/**` (tasks typed `port` only). Anything else —
   old research docs, the v1 repo — is a defect in the task. A task never cites an open-question
   id: a PRD row carries its own ruling, and git carries the history.
3. **`DESIGN: PENDING` blocks the task at its turn.** `/start` names the drawing as the
   step, the owner draws it, then `/start` takes the task. Engine/policy/integration/port tasks wait
   on no drawing, only on their turn. A screen's UI is not "done" until it matches the design.
4. **Studio tasks are ports, not rewrites** (ruling S12-1): engineering core moves as-is with
   its tests; UI is rebuilt to the new design; the defect register is the change list.
5. A task is complete when every DONE WHEN line passes and — for screen tasks — the **three**
   base states (loading, empty, error) plus brief-listed states exist at both 375px and 1536px
   with full parity. This rule is the completion bar every screen task is measured against.
6. **Every row id shows its tier where it appears.** A verbatim row quote carries it after the
   id — `**M02-02** (P0) — …`; a task that defers its quoting to the brief carries it on the
   `PRD rows:` line instead — `M02-01 (P0), M02-25 (P1)`. A task's own `Tier:` is the highest
   tier among its rows, so a P0 task may still contain P1/P2 rows: those are the cuttable ones,
   and they must be visible as such without opening the register.
