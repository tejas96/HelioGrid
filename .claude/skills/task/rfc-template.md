# RFC template

Every section is present, in this order. A section that does not apply says `None — <reason>`.
Short bullets and tables; cite a law, PRD row or file by its id or path, never copy it. A claim
about the code cites `file:line`, read in its implementation, never only its types — what it draws,
which props each half passes on, what each answer maps to; anything not checked is marked `assumed`. A part's RFC writes
only what differs from the task RFC and says `The task RFC's, unchanged` for the rest.

1. **Title** — `<task id> — <what the user gets>`.
2. **User impact** — two or three plain sentences: the business problem, where in the product this
   helps and what the user gets. `None — internal` when nothing a user meets changes.
3. **Analysis** — each line of the task found wrong, missing or over-built (`/task` step 2): what,
   the source that proves it, and the fix made to the task or the decision it needs. Then the
   assumptions, each marked.
4. **Scope** — in; out, each with its reason; the non-functional targets the PRD states
   (performance, accessibility, security), or `none stated`.
5. **Proposal** — the flow end to end (request, user or event); key decisions, one reason each; a
   real alternative, only when one exists, with its trade-off; what is reused, by path; the twin
   screen on the other platform and which parts are shared (`.claude/rules/screen-parts.md`); on a
   screen task, its motion moments (`F7-51`) — `moment | what moves | the design system's motion |
   the component that owns it` — one row for every change the frames already show: a surface opens
   or closes, a wait turns to content, an act to its result, a value changes in place, a list grows
   or shrinks, a control is pressed. Start from the brief's `## Motion` section when it has one. Each
   row takes the motion that job already has elsewhere (`F7-38`), else one of the design system's
   (`tokens/motion.css`, `tokens/keyframes.css`), in the shared component that owns the job — or
   says in one line why nothing moves. Motion only joins frames already drawn: it adds no state,
   element or step, and holds `F7-51`'s floors — content is readable on its first frame. A moment
   that moves what a built screen did not move before, or needs a motion the design system lacks,
   is a decision for the owner.
6. **Frame map** (screen task) — one row per board frame: `frame | state that shows it | element →
   component + props + copy key + the tokens, size and gaps the board gives it`, read from the board's code in
   `.design/<module>/`, under the module's lock. `qa-web`, `qa-ios` and `qa-android` compare the app
   with these values. A
   frame the running app cannot reach with data QA can make through the app says how it is proven
   instead (its component spec, or `not reachable — <why>`).
7. **Changes**
   - Packages: new public exports and dependency direction; each new brand, enum, token, route,
     table or error code with the check that guards it (Law 12), or `no check holds it`.
   - Data and schema: migration, tables, columns, enums, indexes, constraints, transactions; old
     and new readers both ways (`CLAUDE.md` §8, release safety); rollback.
   - API and contracts: route, method, request, response, errors, auth, permission, tenancy,
     pagination.
   - Jobs and workflows: Temporal workflow or activity, queue, retries, idempotency, timeouts.
   - Files: `action | path | purpose`, one row per file (`add`, `modify`, `move`, `delete`); a new
     folder carries architecture §4's answer.
8. **Diagram** — a Mermaid `flowchart LR` or `sequenceDiagram`, at most 15 nodes, only when a
   boundary changes; else `No boundary change`.
9. **Build steps** — numbered slices in order: `step | files | AC it meets | done when`.
   Contracts and shared types come first. Mark `parallel` on slices with disjoint files that need
   nothing another open slice adds; a slice that holds a money, tenancy or permission rule is never
   parallel.
10. **Risks** — tenancy, money, migration, release, performance: each with its mitigation. No
    invented risk.
11. **Regression** — each existing feature the change touches (by its callers): the test or flow
    that keeps it working, or the QA row added for it.
12. **Acceptance criteria** — every `DONE WHEN` line verbatim as `AC-1`, `AC-2`, …; then each added
    line in Given / When / Then, covering every edge case below that applies — happy path,
    alternate paths and refusals.
13. **Proof** — one row per check:
    `row | AC | owner | surface | action → expected | test data, setup and cleanup` — test data
    names the account each row signs in with.
    Owners: `main-dev` (a unit, contract or component test, or a `tests/e2e/web` spec run at
    `/task` step 8 item 4, named `` `<file>` › *<title>* `` — the
    file by its path, or a name only one test file has, and each title as the test file writes it,
    cut short at a `${…}` or `%s`; invariant `rfc-proofs-hold` reads them),
    `qa-api`, `qa-web`, `qa-ios`, `qa-android` (live, on the running app), `ci` (a lane that must
    run). Every AC has exactly one owner. An expected result says the status code and body fields,
    the words or state on screen, and the side effect read back. An expected result that code
    outside the diff decides is read from that code, by file and line. A row that needs the api
    stopped says `api stopped`. A wrong-code step names a code other than `DEV_OTP_CODE`
    (`.env.local`): the api accepts that code for every dev number, so it joins instead. A PRD
    performance target from *Scope* is written into its row's expected result as a time limit.
    A behaviour of a `data` hook — each answer a write meets, a late answer, a second tap — is a
    `main-dev` test in `packages/data/tests/`; an app's glue (a toast, a navigation) has a live row,
    never a `main-dev` spec: that layer has no unit tests (`.claude/rules/testing.md`).
    A screen task has one Hindi and one Marathi layout row on the phone, and its shared
    component's spec covers both languages at 375 and 1536.
    Each surface `/task` step 7's table picks gets a live row; every `qa-ios` row has its
    `qa-android` twin; a surface left out names the table's reason.
14. **Deferred rows** — each `docs/tasks/deferred.md` row this task meets: joins (deleted when the
    build ends, `/task` step 5) or stays (with its new `reopens when`); a row this task meets only
    in part stays. The rows that join are listed on one line, `**Deleted:** D…, D…`, which invariant
    `rfc-proofs-hold` holds against `deferred.md`. `None` when none.
15. **Size** — changed files, code lines, test lines (one PR; parts only on the owner's word,
    `/task` step 3).
16. **Decisions for the owner** — each open decision with at most two options, recommended first;
    or `none`.

## Edge cases — test each one that applies

| area | the case |
|---|---|
| states | loading · empty · error · success · partial failure (one of several calls fails) |
| network | offline · timeout · retry · the same submit twice (idempotency key) |
| access | each role the PRD names · signed out · session expired · another tenant's record answers 404, never 403 |
| input | empty · too long · invalid format · each boundary and one either side · zero · negative |
| data | two people edit the same record · a record deleted while it is open · a list past one page · search and filters with no match |
| money | minor units · rounding only in `domain/money` · lakh/crore grouping in every locale · stale price reads provisional |
| words | Hindi and Marathi lengths at 375 · no hard-coded English · provenance tier on every money and energy figure, none on dates or counts (`F8-01`) |
| layout | 375 and 1536 · no sideways scroll · 44 px targets · keyboard open on a phone · safe areas · focus order and screen-reader labels |
| jobs | a workflow or job retried · run twice · failing half way |
| billing | a lapsed tenant still reads and exports (`CLAUDE.md` §9) |
| release | an old app version reads the new shape, and new code reads the old |
| motion | reduced motion on shows the end state at once — a component spec on the web (`page.emulateMedia({ reducedMotion: 'reduce' })`), a live row on each phone, where its QA agent turns the setting on before the row and off after it (Android: `adb shell settings put global transition_animation_scale 0`, back to `1`; iOS: the simulator's Settings → Accessibility → Motion → Reduce Motion) · nothing waits on an animation: a tap during it lands · a loop stops when its state ends, off screen and in the background · no dropped frames: Android `adb shell dumpsys gfxinfo <package>` janky frames no higher with motion on than with it off — the emulator is a proxy, and the mid-range phone of `F7-51` is the owner's check — and on the `web-built` server in Chromium no long animation frame while it runs |
