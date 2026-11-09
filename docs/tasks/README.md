# Engineering tasks — structure and rules

One file per module (`M01-onboarding.md` … `M13-dashboards.md`), plus `SHELL.md` for the app
shell, and `F-core.md` / `F-platform.md` / `F5-customer-link.md` where a foundation builds something
itself. `UI.md` is the one
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
**Type:** screen · **Tier:** P0        (screen | engine | policy | integration · the highest tier among its rows)
**Status:** planned                    (the one ledger; a task leaves the file when it ships)
**PRD rows:** M02-<nn> (P0), M02-<nn> (P0), M02-<nn> (P1)        — every id carries its tier (rule 6)
**DESIGN:** SCR-<module>-<nn> · SCR-<module>-<nn>          — the screens this task builds; their look is picked in the task (rule 3)
**Design:** (instead of `DESIGN:`) `none — <reason>` for a task with no screen of its own, or `as <task id>` for one that changes the screens another task builds
**Why:** one or two lines, in EPC terms — who gains what, and what breaks without it
**Depends on:** task ids and migration numbers that must land first
**Blocked:** (only while true) what only the owner can clear — a ruling, an account; the work stops here
**Parked:** (only while true) the owner's reason; the order steps over it
**DONE WHEN:** the requirement rows' own Given/When/Then, copied verbatim — never paraphrased.
        The plan names a test for each of them (`/task`, *Plan*); the PRD's own lines stay word for word
```


While a task is built, its RFC sits under these lines as `#### RFC` (a part: `#### Part <x> · RFC`),
as `/task` (*Plan*) writes it. The commit that ships a task deletes it from this file — heading,
header lines and RFC — so the task files hold open work only, and git holds what shipped. A split
task's `#### Parts` table and task RFC stay until its last part ships.

**Size.** A task is one PR; it splits into parts only on the owner's word.

## Binding rules

0. **`Status:` is the ledger.** `planned` while the task is open; the CHANGE commit that ships it
   deletes the task, and its subject names the task —
   never a commit and never a PR of its own — and the squash commit on main carries the PR
   number. A split task's parts keep their own ledger in its `#### Parts` table (`open` →
   `shipped`, in the part's own change commit), and the task is deleted with its last part. A
   part's id is the task id plus its letter (`T-SHELL-003a`); wherever `<T-id>` is written — the
   branch, the commit subject — a part uses its own id. Build, tests and verification are proven
   inside the PR, never tracked as states. A task whose rows move to another task is deleted in that change. An id is
   never reused: a new task takes the next number its file has never held.
   **The ORDER is `docs/build-order.md`**, walked by `/task` — never a task picked from
   memory, and never a later task because it is ready. A ticket with no `Depends on:` line waits on
   nothing, and the RFC writes the line.
1. **Acceptance criteria are copied, never rewritten.** They were authored and locked in the
   PRD; "task language" paraphrases are how requirements drift.
2. **Requirement reference whitelist.** A task's header and requirement text may cite only:
   `docs/prd/**`, `docs/engineering/data-model.md` and `docs/engineering/forward-compat.md` (a schema-bearing
   task, where naming its entities or its first-migration row is clearer than restating them).
   The RFC may additionally cite
   implementation authorities its sections require: architecture, protections, CI and package
   instructions, and the sample the owner picked. Anything else —
   old research docs, the v1 repo — is a defect in the task. A task never cites an open-question
   id: a PRD row carries its own ruling, and git carries the history.
3. **A screen's look is picked inside its own task** (`CLAUDE.md` §3, `/task` *Plan*), so no task
   waits for a drawing. A screen's UI is not "done" until it follows the sample the owner picked.
5. A task is complete when every DONE WHEN line passes and — for screen tasks — the **three**
   base states (loading, empty, error) plus the states its plan lists exist at both 375px and 1536px
   with full parity. This rule is the completion bar every screen task is measured against.
6. **Every row id shows its tier where it appears.** A verbatim row quote carries it after the
   id — `**M02-02** (P0) — …`; a task that does not quote its rows carries it on the
   `PRD rows:` line instead — `M02-01 (P0), M02-25 (P1)`. A task's own `Tier:` is the highest
   tier among its rows, so a P0 task may still contain P1/P2 rows: those are the cuttable ones,
   and they must be visible as such without opening the register.
