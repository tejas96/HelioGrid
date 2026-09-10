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

```
T-M02-001 · Quick Add Lead
Type: screen            (screen | engine | policy | integration | port)
Tier: P0
Status: planned         (planned | designed | shipped (#PR) — the one ledger; screens.md mirrors it per screen)
PRD:    M02-01 (P0), M02-03 (P0), M02-<nn> (P0), M02-05 (P0), M02-06 (P0)
DESIGN: SCR-<module>-<nn> → PENDING               — filled when the screen is approved
PORT:   (studio tasks only) POC files from docs/prd/modules/M05-studio/poc-file-claims.md
        — files to READ AND PORT FROM, never files to create here. 66 PORT entries name a
        POC `*.test.ts`; port the LOGIC it proves into the studio package's own
        `tests/` tree, or into tests/invariants where it is a property of the system.
        CLAUDE.md §8 fixes the name and the place; check-adherence.sh fails on either.
DEFECTS:(studio tasks only) rows from docs/prd/modules/M05-studio/defect-register.md
Why:    one line, in EPC terms — what an installer gains and what breaks without it
Data model: the entity rows this task AUTHORS (a table copied from the data model), with the
        migration number and each table's tenancy; or "none — reads <entities> authored by T-…"
Contract: the routes and schemas it adds or changes, under a named packages/contracts file; or "none"
Depends on: task ids and migration numbers that must land first
Out of scope: what this task deliberately leaves to which other task
DONE WHEN: the requirement rows' own Given/When/Then, copied verbatim — never paraphrased —
        each line ending "→ proof: <unit | invariant | gate | qa-api | qa-web | qa-mobile | qa-parity> <name>"
```

A task takes this whole shape at `/start`, before it is built, and keeps it; a task with a `Why:`
line and any part missing fails the docs gate.

## Binding rules

0. **`Status:` is the ledger.** `planned` until every `DESIGN:` link is filled, `designed` until the
   PR merges, `shipped (#PR)` after — and a shipped id must be in `main`'s history. `screens.md`
   carries the same state per screen. Build, tests and QA are proven inside the PR, never tracked
   as states.
1. **Acceptance criteria are copied, never rewritten.** They were authored and locked in the
   PRD; "task language" paraphrases are how requirements drift.
2. **Reference whitelist.** A task may cite only: `docs/prd/**`, `design/ds-source/**`, `HelioGrid-UX/**` (the exported artboards and decisions records, one pair per screen — a git-ignored folder at the repo root that each machine exports itself),
   `docs/engineering/data-model.md` and `docs/engineering/forward-compat.md` (a schema-bearing
   task, where naming its entities or its first-migration row is clearer than restating them),
   `docs/ux/briefs/**`, *retired: studio inventory***` and `docs/prd/modules/M05-studio/defect-register.md`
   (studio tasks), and `3d_design_studio/**` (tasks typed `port` only). Anything else —
   old research docs, the v1 repo — is a defect in the task. A task never cites an open-question
   id: a PRD row carries its own ruling, and git carries the history.
3. **`DESIGN: PENDING` blocks build, not start.** Engine/policy/integration/port tasks have no
   design dependency and can start immediately. A screen task may be scaffolded but its UI is
   not "done" until the link is filled and matched.
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
