# RFC template

Every section is present, in this order. A section that does not apply says `None — <reason>`.
Short bullets and tables; cite a law, PRD row or file by its id or path, never copy it. A part's RFC
writes only what differs from the task RFC and says `The task RFC's, unchanged` for the rest.

1. **Title** — `<task id> — <what the user gets>`.
2. **User impact** — two or three plain sentences: where in the product this helps and what the
   user gets. `None — internal` when nothing a user meets changes.
3. **Analysis** — each line of the task found wrong, missing or over-built (`/task` step 2): what,
   the source that proves it, and the fix made to the task or the decision it needs.
4. **Scope** — in; out, each with its reason.
5. **Proposal** — the flow end to end (request, user or event); key decisions, one reason each;
   what is reused, by path; the twin screen on the other platform and which parts are shared
   (`.claude/rules/screen-parts.md`); build order.
6. **Frame map** (screen task) — one row per board frame: `frame | state that shows it | element →
   component + props + copy key`. A frame the running app cannot reach with data QA can make
   through the app says how it is proven instead (its component spec, or `not reachable — <why>`).
   The board file and the export date it was read from.
7. **Changes**
   - Packages: new public exports and dependency direction; each new brand, enum, token, route,
     table or error code with the check that guards it (Law 12), or `no check holds it`.
   - Data and schema: migration, tables, columns, enums, indexes, constraints; old and new readers
     both ways (`CLAUDE.md` §8, release safety); rollback.
   - API and contracts: route, method, request, response, errors, auth, permission, tenancy.
   - Files: `action | path | purpose`, one row per file (`add`, `modify`, `move`, `delete`); a new
     folder carries architecture §4's answer.
8. **Diagram** — a Mermaid `flowchart LR` or `sequenceDiagram`, at most 15 nodes, only when a
   boundary changes; else `No boundary change`.
9. **Risks** — tenancy, money, migration, release, performance: each with its mitigation. No
   invented risk.
10. **Acceptance criteria** — every `DONE WHEN` line verbatim as `AC-1`, `AC-2`, …; then each added
    line in Given / When / Then, covering every edge case below that applies.
11. **Proof** — one row per check:
    `row | AC | owner | surface | action → expected | test data`.
    Owners: `main-dev` (a unit, contract or component test, by file and test name), `qa-api`,
    `qa-web`, `qa-ios`, `qa-android`, `ci` (a lane that must run). Every AC has exactly one owner.
    An expected result that code outside the diff decides is read from that code, by file and line.
    A row that needs the api stopped says `api stopped`.
12. **Deferred rows** — each `docs/tasks/deferred.md` row this task meets: joins (and is deleted
    in this commit) or stays (with its new `reopens when`). `None` when none.
13. **Size** — changed files, code lines, test lines; one PR, or the parts (`/task` step 3).
14. **Decisions for the owner** — each open decision with at most two options, recommended first;
    or `none`.

## Edge cases — test each one that applies

| area | the case |
|---|---|
| states | loading · empty · error · success · partial failure (one of several calls fails) |
| network | offline · timeout · retry · the same submit twice (idempotency key) |
| access | each role the PRD names · signed out · session expired · another tenant's record answers 404, never 403 |
| input | empty · too long · invalid format · each boundary and one either side · zero · negative |
| data | two people edit the same record · a record deleted while it is open · a list past one page |
| money | minor units · rounding only in `domain/money` · lakh/crore grouping in every locale · stale price reads provisional |
| words | Hindi and Marathi lengths at 375 · no hard-coded English · provenance tier on every number (`F8-01`) |
| layout | 375 and 1536 · no sideways scroll · 44 px targets · keyboard open on a phone · focus order and screen-reader labels |
| billing | a lapsed tenant still reads and exports (`CLAUDE.md` §9) |
| release | an old app version reads the new shape, and new code reads the old |
