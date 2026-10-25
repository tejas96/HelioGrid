# RFC template

Every section is present, in this order. A section that does not apply says `None — <reason>`.
Short bullets and tables; cite a law, PRD row or file by its id or path, never copy it. A claim
about the code cites `file:line`, read in its implementation, never only its types — what it draws,
which props each half passes on, what each answer maps to; anything not checked is marked `assumed`.
A part's RFC writes only what differs from the task RFC and says `The task RFC's, unchanged` for
the rest.

1. **Title** — `<task id> — <what the user gets>`.
2. **User impact** — two or three plain sentences: the business problem, where in the product this
   helps and what the user gets. `None — internal` when nothing a user meets changes.
3. **Scope** — in; out, each with its reason; each line of the task found wrong, missing or
   over-built (`rfc.md` step 2) with the source that proves it and the fix made or the decision it
   needs; the assumptions, each marked; the non-functional targets the PRD states (performance,
   accessibility, security), or `none stated`.
4. **Proposal** — the flow end to end (request, user or event); key decisions, one reason each; a
   real alternative, only when one exists, with its trade-off; what is reused, by path; the twin
   screen on the other platform and which parts are shared (`.claude/rules/screen-parts.md`); on a
   screen task, one line per motion moment the frames show (`F7-51`): the design system's motion it
   takes and the component that owns it, or why nothing moves — a moment that moves what a built
   screen did not move before, or needs a motion the design system lacks, is a decision for the
   owner. Then the changes: new public exports and dependency direction; each new brand, enum,
   token, route, table or error code with the check that guards it (Law 12), or `no check holds it`;
   migration, tables, columns, enums, indexes, constraints, transactions, with old and new readers
   both ways (`CLAUDE.md` §8, release safety) and rollback; route, method, request, response,
   errors, auth, permission, tenancy, pagination; Temporal workflow or activity, queue, retries,
   idempotency, timeouts. Then the files: `action | path | purpose`, one row per file (`add`,
   `modify`, `move`, `delete`); a new folder carries architecture §4's answer. A Mermaid
   `flowchart LR` or `sequenceDiagram`, at most 15 nodes, only when a boundary changes.
5. **Build steps** — numbered slices in order: `step | files | AC it meets | done when`.
   Contracts and shared types come first. Mark `parallel` on slices with disjoint files that need
   nothing another open slice adds; a slice that holds a money, tenancy or permission rule is never
   parallel. Then the regression line: each existing feature the change touches (by its callers)
   and the test, flow or QA row that keeps it working.
6. **Acceptance criteria** — every `DONE WHEN` line verbatim as `AC-1`, `AC-2`, …; then each added
   line in Given / When / Then, covering every edge case below that applies — happy path,
   alternate paths and refusals.
7. **Proof** — one row per check:
   `row | AC | owner | surface | action → expected | test data, setup and cleanup` — test data
   names the account each row signs in with.
   Owners: `main-dev` (a unit, contract or component test, or a `tests/e2e/web` spec run at
   `/task` step 8 item 4, named `` `<file>` › *<title>* `` — the
   file by its path, or a name only one test file has, and each title as the test file writes it,
   cut short at a `${…}` or `%s`; invariant `rfc-proofs-hold` reads them),
   `qa-api`, `qa-web`, `qa-ios`, `qa-android` (live, on the running app), `ci` (a lane that must
   run). Every AC has exactly one owner. An expected result says the status code and body fields,
   the words or state on screen, and the side effect read back. An expected result that code
   outside the diff decides is read from that code, by file and line. A wrong-code step names a
   code other than `DEV_OTP_CODE` (`.env.local`): the api accepts that code for every dev number,
   so it joins instead. A PRD performance target from *Scope* is written into its row's expected
   result as a time limit. A row that needs the api stopped says `api stopped`; only a PRD row that
   names what a phone shows with the api down gets one (`/task` step 7). A behaviour of a `data` hook — each answer a write meets, a late answer,
   a second tap, the api refused — is a `main-dev` test in `packages/data/tests/`; an app's glue (a
   toast, a navigation) has a live row, never a `main-dev` spec: that layer has no unit tests
   (`.claude/rules/testing.md`). A screen task has one Hindi and one Marathi layout row on the
   phone, and its shared component's spec covers both languages at 375 and 1536. Each surface
   `/task` step 7's table picks gets a live row; a phone row runs on one phone as step 7's *Which
   phone runs a row* says; a surface left out names the table's reason. The rows are few: each AC's
   proof, not every path through the screen — the agents' own checks cover every screen a row reaches.
   Last, the `docs/tasks/deferred.md` rows this task meets: joins (deleted when the build ends,
   `/task` step 5) or stays (with its new `reopens when`); a row this task meets only in part stays.
   The rows that join are listed on one line, `**Deleted:** D…, D…`, which invariant
   `rfc-proofs-hold` holds against `deferred.md`; `**Deleted:** none` when none.
8. **Risks and decisions** — tenancy, money, migration, release, performance: each real risk with
   its mitigation, no invented risk; the size (changed files, code lines, test lines — one PR; parts
   only on the owner's word, `/task` step 3); then each open decision for the owner with at most
   two options, recommended first, or `none`.

## Edge cases — test each one that applies

| area | the case |
|---|---|
| states | loading · empty · error · success · partial failure (one of several calls fails) |
| network | offline · timeout · retry · the same submit twice (idempotency key) · the api refused (a `data` test) |
| access | each role the PRD names · signed out · session expired · another tenant's record answers 404, never 403 |
| input | empty · too long · invalid format · each boundary and one either side · zero · negative |
| data | two people edit the same record · a record deleted while it is open · a list past one page · search and filters with no match |
| money | minor units · rounding only in `domain/money` · lakh/crore grouping in every locale · stale price reads provisional · a lapsed tenant still reads and exports (`CLAUDE.md` §9) |
| words | Hindi and Marathi lengths at 375 · no hard-coded English · provenance tier on every money and energy figure, none on dates or counts (`F8-01`) |
| layout | 375 and 1536 · no sideways scroll · 44 px targets · keyboard open on a phone · safe areas · focus order and screen-reader labels · reduced motion shows the end state at once (a component spec on the web with `page.emulateMedia({ reducedMotion: 'reduce' })`; a live row on the phone whose agent switches the setting) · nothing waits on an animation |
| jobs and release | a workflow or job retried · run twice · failing half way · an old app version reads the new shape, and new code reads the old |
