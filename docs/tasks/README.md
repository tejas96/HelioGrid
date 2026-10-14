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

A task is its header lines, written when the task is. The RFC adds its sections under them —
one `#### RFC`, whose `#####` sections below fix; for a split task `#### Parts` and each
part's `#### Part <x> · RFC`; the `#### Design check` of a task that runs one (`.claude/skills/task/references/design.md`); and one `#### Runtime` ledger
under each part's RFC, or under `#### RFC` for an unsplit task. A task approved under the earlier `#### Plan` shape keeps it while
that approval remains valid; if scope voids the approval, the affected task or part gets one
complete replacement RFC and the earlier sections remain as history (`/task` steps 2 and 4). The
header lines:

```
### T-M02-001 · Quick Add Lead
**Type:** screen · **Tier:** P0        (screen | engine | policy | integration | port · the highest tier among its rows)
**Status:** planned                    (planned | designed | shipped | struck — the one ledger)
**PRD rows:** M02-<nn> (P0), M02-<nn> (P0), M02-<nn> (P1)        — every id carries its tier (rule 6)
**DESIGN:** SCR-<module>-<nn> → PENDING          — filled by Claude Code when the owner hands over the drawn screen (`.claude/skills/task/references/design.md`, part A); a screen with more than one board lists the others after the main link: `· also: <board> <link>`; a studio screen reads `ported from the POC`
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
        The RFC copies them into its `##### Acceptance criteria and proof` and extends them there; the PRD's own lines stay word for word
```

Each acceptance line names its proof in the RFC's one proof matrix: a test by file and name, or a
check on the running app. A money, tenancy or permission rule's test is seen to fail once
(`.claude/rules/testing.md`). Nothing checks a task's shape: an incomplete RFC (`/task` step 2) is
not presented for approval.
**A shipped section keeps the shape it shipped in** — its `Risk:`, `Cases:`, `Placement:`,
`Used by:`, `QA plan:`, `Rounds:` and `Verified:` lines, and its verification record, stay as
history and are never rewritten. An open task that still carries one of those lines keeps it the
same way: the RFC adds its sections under the header lines and changes nothing above them.
**A shipped part leaves the live file.** The commit that turns a part's row `shipped` moves its
`#### Part <x> · RFC` body and its `#### Runtime` ledger, unchanged, to
`docs/tasks/archive/<task id>.md` under a `## <task id> · part <x>` heading — never a `### T-`
heading and never a `**Status:**` line: a part is history there, never a task. The
header lines, the task RFC, `#### Design check` and the `#### Parts` table stay here; a later part
reads only them.

## RFC — the one implementation contract

The RFC is the owner's one approval card: headings, short bullets and tables, plus one Mermaid
diagram when a boundary changes. No parallel plan, ASCII diagram, second summary or restated
repository law: cite its owner. Every section below is present and in this order; a section that
does not apply says why. A part writes
`#### Part <x> · RFC`, carries only its own facts and proof rows, and cites the task RFC for shared
facts: every heading is present, and one the part does not change is one declared line
(`.claude/skills/task/SKILL.md` step 2). The task's acceptance lines appear once, except a replacement RFC for an invalidated legacy
part repeats that part's applicable AC and proof rows so the owner reads one complete decision.
An RFC approved with `##### Goals` and `##### Non-goals` keeps them as written; a part written
under it folds its own outcomes and non-goals into its `##### Description`.

1. `##### Title` — `<task id> — <clear change name>`.
2. `##### Description` — opens with the user impact in plain words, two or three sentences: where
   in the product this helps, what the user gets directly, and what they get indirectly;
   `None — internal` when nothing a user meets changes. Then who gains what, the technical problem
   solved, its outcomes as short measurable lines, and the behavior and surfaces deliberately left
   unchanged; cite the task, PRD rows and brief or design record without copying them.
3. `##### Readiness and dependencies` — landed dependencies, design-check verdict for screen work,
   assumptions and blockers; `light cycle` with its reason when the proof matrix names no web,
   phone or api surface (`.claude/skills/task/references/qa.md`). No `TBD` or open blocker when
   shown.
4. `##### Proposal` — end-to-end request, user or event flow; key decisions with one reason;
   implementation order; material errors and refusals; the twin platform screen.
5. `##### Architecture diagram` — Mermaid `flowchart LR` or `sequenceDiagram`, at most 15 nodes or
   participants, showing only changed and directly relevant boundaries. If none:
   `No boundary change — <where the change remains>.` A task RFC always draws its diagram, whole,
   lettered by part; a part's section may read `No boundary change — see the task diagram`, and
   the chat then links the task's (`/task` step 3).
6. `##### Package changes` — each package's responsibility, public exports and dependency direction;
   each new brand, enum, token, route, table or error code's protection row, and any kind no check
   holds (Law 12); otherwise a reasoned `None`.
7. `##### Data and schema changes` — migration, tables, columns, enums, indexes, constraints,
   seed/backfill, old/new readers, rollout and rollback or expand/contract; otherwise
   `None — no stored shape changes`.
8. `##### File and folder changes` — `action | path | purpose | placement reason`, one planned file
    per row. Actions are `add`, `modify`, `move`, `delete`; a new folder carries architecture §4's
    placement answer.
9. `##### API and contract changes` — route/event/activity, method, request and response, errors,
    auth, permission, tenancy and compatibility; otherwise `None — no wire boundary changes`.
10. `##### Risks and rollout` — material tenancy/security, money/data, workflow/release, migration,
    deployment and operational risks, each with its mitigation. No invented risk.
11. `##### Acceptance criteria and proof` — every `DONE WHEN` line verbatim as `AC-1`, `AC-2`, …,
    followed by one matrix: `AC/row | owner | tier | surface | action → expected | proof`. A row
    that needs the api stopped says `api stopped` in its surface column, so local QA runs every such
    row in the task's one api-down window (`.claude/skills/task/references/qa.md`).
12. `##### Delivery size` — estimated files and authored changed lines, one part or split, and the
    planned implementation order. A split gives each part its own files and lines: that part's
    budget.

Proof owners are `main-dev`, `qa-api`, `qa-web`, `qa-ios`, `qa-android`, `evaluator`, or `ci`;
tiers are `required`, `blocked` with what clears it, or `not_applicable` with why. Every required
AC has exactly one proof owner and expected result; a required blocked row fails closed. Where code
outside the diff already decides what a frame shows (a `domain` frame, reducer or policy), the row's
expected result is read from that code, cited by file and line. Main owns
unit, contract and planted-red proofs, never a live API journey. `qa-api` owns reachable running-API
behavior — status, body, headers, sign-in, permission, tenant isolation, idempotency and persistence
only where declared. A task with no reachable API behavior marks it not applicable. An API test
runs on `heliogrid_test`. CI ownership names a path-selected lane that must actually run; a skipped
lane proves nothing. A web journey is a local `qa-web` proof, like an iOS journey. A `test:web`
flow proves regression coverage in CI's `e2e-web` lane, is never run locally, and never replaces
the `qa-web` row (`.claude/skills/task/references/qa.md`). Android phone flows may be CI-owned only when the `Phone flows` step runs;
the step must be `Phone flows (tests/e2e/mobile) on the emulator`. A run of `Phone flows OFF`
proves nothing and the row is `blocked`, never passed. iOS journeys are local `qa-ios` proofs.
A screen task with a board (a studio screen has none) has one `side-by-side` row per board frame
it renders on the web — each state, 375, 1536 — owned by `qa-web`, and one
per phone state owned by `qa-ios` alone, its language rotating state by state (English, Hindi,
Marathi); in Hindi and Marathi it compares the layout, the words being the catalog's. The board
pictures are the ones this run's design check took, in `.qa/board/<SCR-id>/`
(`.claude/skills/task/references/design.md`, part B).
`qa-android` walks the same journey rows and compares no frame: both phones
draw the one shared component; one journey row per part carries the surface `android · Hindi`,
and every phone row measures that no button label wrapped and that the focused field sits above
the keyboard, `n/a` when the row has neither (`.claude/agents/`).
Hindi and Marathi have no board frame: one `main-dev` row per shared component proves them by its
component spec at 375 and 1536 — no sideways scroll, no clipped text box, the act on screen — and
that spec saves one picture per language and width with `page.screenshot`, under
`.qa/components/<name>/<lang>-<width>.png`, which the commit card shows. Web at 375 is compared with the phone frame. A state the board draws only at 375 is compared at 1536 with
its phone frame and the board's stated 1536 rule (`docs/start-here.md`, *The drawing prompt*, Pass 3), not flagged
as missing. A frame with no row, or a built state with no frame and no stated rule, is a finding. A side-by-side row names only a frame the running app reaches today with data QA can make through the app; a frame it cannot reach is decided in the RFC — `not_applicable` with the reason, or proven by its component's spec — never found by QA. In a
light cycle no helper drives a browser: the component spec saves each drawn frame's picture the
same way, and the `qa-web` row names the two files — the board's and the spec's — and compares
them without a browser.

## Delivery size and Parts

Target each task or part at no more than about 30 changed files **and** 1,000 authored changed
lines (additions plus deletions). List generated artifacts and lockfiles, but exclude them from the
line estimate. A change to a shared primitive's look counts every spec that measures the old value (`tests/e2e/components/`) in its file table. The estimate gives code lines and test lines on separate lines; a part's tests are
counted, never assumed small. It counts every authored line the diff will show — a constraint comment is a line, and a row that changes is two, one removed and one added. A file moved and rewritten counts whole on both sides, as one file deleted and one added: git records a move only when the two are at least half alike. An inseparable end-to-end deliverable may exceed a target only when its RFC explains
why no smaller part can be independently accepted and the owner approves that exact size.

`#### Parts` is a separate heading because the build-order walk reads it: one row per part, its
first cell the part's letter and its last cell its status (a new table:
`part | what | AC | depends on | status`). Each part's files and lines are its budget in the task
RFC's `##### Delivery size`; its file table and proof rows are in its own RFC. Each part is end to
end and independently acceptable; web and phone halves of one flow stay together. Each
part carries one checklist item per file group and proof. A cap decides where work splits; it never
drops a test, proof, protection or required doc fix.

During build, a new behavior, route, contract, table, package or affected package voids approval.
Update the complete RFC including a fresh `##### Delivery size` ruling: split into parts, or an
inseparable deliverable approved at its new exact size. Obtain approval again. Actual files or
authored lines more than 20% above the estimate void nothing: the commit card states the overrun
and its reason, and the next RFC's estimate learns from it. A legacy Plan invalidated this way is
preserved as history and followed by one complete replacement RFC, never a delta-only Plan.

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
   on nothing, and the RFC writes the line.
1. **Acceptance criteria are copied, never rewritten.** They were authored and locked in the
   PRD; "task language" paraphrases are how requirements drift.
2. **Requirement reference whitelist.** A task's header and requirement text may cite only:
   `docs/prd/**`, the screen's board and decisions record in the Claude Design project, by the link on its `DESIGN:` line (the one source of a design — the repo holds no copy),
   `docs/engineering/data-model.md` and `docs/engineering/forward-compat.md` (a schema-bearing
   task, where naming its entities or its first-migration row is clearer than restating them),
   `docs/ux/briefs/**`, `docs/prd/modules/M05-studio/defect-register.md`
   (studio tasks), and `3d_design_studio/**` — the POC repo, today at
   `/Volumes/works-space/Solar-App-POC/` (tasks typed `port` only). The RFC may additionally cite
   implementation authorities its sections require: architecture, protections, CI and package
   instructions. Anything else —
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
