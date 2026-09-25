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
### T-M02-001 · Quick Add Lead
**Type:** screen · **Tier:** P0        (screen | engine | policy | integration | port · the highest tier among its rows)
**Status:** planned                    (planned | designed | shipped (#PR) | struck — the one ledger; screens.md mirrors it per screen)
**PRD rows:** M02-<nn> (P0), M02-<nn> (P0), M02-<nn> (P1)        — every id carries its tier (rule 6)
**DESIGN:** SCR-<module>-<nn> → PENDING          — filled when the screen is approved; a screen with more than one board lists the others after the main link: `· also: <board> <link>`
**PORT:** (studio tasks only) POC files from docs/prd/modules/M05-studio/poc-file-claims.md
        — files to READ AND PORT FROM, never files to create here. 66 PORT entries name a
        POC `*.test.ts`; port the LOGIC it proves into the studio package's own
        `tests/` tree, or into tests/invariants where it is a property of the system.
        CLAUDE.md §8 fixes the name and the place (M70).
**DEFECTS:** (studio tasks only) rows from docs/prd/modules/M05-studio/defect-register.md
**Why:** one line, in EPC terms — what an installer gains and what breaks without it
**Impact:** one or two sentences — who gains what when this ships, and the risk it removes or the number it moves
**Scope:** fixed at /start, locked by the go: **In** — the behaviours and the layers they touch ·
        **Out** — what is left out, with why · **Size** — files and lines. A new behaviour, layer,
        table, route or contract, or more than 1.5× the size, goes back to the owner before it is built
**Placement:** one row per NEW fact (a type, a vocabulary, a string, a query, a wire shape, a policy
        number): `| fact | owning package (architecture.md §2) | why it owns it | how others reach it |`
**Data model:** the entity rows this task AUTHORS (a table copied from the data model), with the
        migration number and each table's tenancy; or "none — reads <entities> authored by T-…"
**Contract:** the routes and schemas it adds or changes, under a named packages/contracts file; or "none"
**Depends on:** task ids and migration numbers that must land first
**Out of scope:** what this task deliberately leaves to which other task
**Settle at /start:** the readings the PRD leaves open, each ruled with one reason before the go
**Cases:** (a task with a runtime path) one line per failure case the design was attacked with, and
        one `n/a` line for each of /start §3's nine classes that cannot occur here, with why:
        `- **C1** · <class> · <the case> → <the fix> → proof: <proof>`
        `- **n/a** · <class> · <why it cannot occur>`
        A task with no runtime path writes the one line `**Cases:** none — <why>` instead, and carries
        no QA plan and no `qa-*` proof.
**Schema:** (a task that authors tables) one line per stored fact — a table, a column, an index,
        a grant, a policy: `- **S1** · <the fact> → proof: <proof>`
**QA plan:** (a task with a runtime path) written at /start, before code, and edited only with
        the scope: one line per step a QA agent drives, behaviour-level — what a person does and
        sees, never a selector or a seed (those go in the run's own `run.md`):
        `- **Q1** · <api|web|mobile|worker|parity> · <claim ids, or landing> · <the action> → expect <literal> · observe <kind> · severity <blocker|major|minor>`
        — money, tenancy or provenance is `blocker`; the severity is set here, never by the executor
**Verified:** digest <12 hex> · <date> · <per-surface verdicts> — written by /verify from the runtime
        tree it drove, never by hand; git's pre-commit refuses a runtime change without it (M113)
**DONE WHEN:** the requirement rows' own Given/When/Then, copied verbatim — never paraphrased —
        each line `- **D1** · Given … → proof: <proof>`
```

Every case, schema fact and done-when line is a CLAIM with an id that is never reused in the task.
A proof is one of: `unit `<test file>` › "<test title>"` · `invariant `<invariant file>` ›
"<failure text>"` · `qa-api | qa-web | qa-mobile | qa-worker | qa-parity Q<n>`, naming
the ticket's own QA plan step, whose surface matches · `recorded <id>` (a
proof the author drives, through `scripts/record-proof.sh`) · `gate <M-id>` (a gate whose HELD or
PARTIAL row holds the line, its red proof in the row) · `held <M-id>` (a case an existing HELD or
PARTIAL row already guards, with no new work) · `none — <reason>` (a case nothing can prove here;
the owner sees it at /start). `held` and `none` are for cases only; several proofs join with ` + `.
Gate 32 checks this shape — and that every `qa-*` proof names a QA plan step of its surface and
every step names a claim or `landing` (M139) — and never whether a proof is right.
`**Broken at /start:**` is the retired form of Cases: a shipped ticket may still carry it, and gate
32 refuses it on any other.

A task takes this whole shape at `/start`, before it is built, and keeps it; `/start` fixes a missing
part before the go. No gate checks that every part is present; gate 32 checks only the claims'
shape.

## Binding rules

0. **`Status:` is the ledger.** `planned` until every `DESIGN:` link is filled, `designed` until the
   task ships, `shipped (#PR)` written into the CHANGE commit itself, whose subject names the
   task — never a commit and never a PR of its own — and a shipped id is named by the branch's
   own history. `screens.md` carries the same state per screen. Build, tests and QA are proven
   inside the PR, never tracked as states. A task whose rows moved to another task is `struck` —
   its heading says STRUCK, its stub stays so the id is never reused, and it is never counted as
   open work.
   **The ORDER is `docs/build-order.md`**: its blocks place every task file, and the next task is
   the one the build-order line names on every gate run (`M126`), never one picked from memory. A
   ticket with no `Depends on:` line reads there as waiting on nothing, so `/start` writes the line.
1. **Acceptance criteria are copied, never rewritten.** They were authored and locked in the
   PRD; "task language" paraphrases are how requirements drift.
2. **Reference whitelist.** A task may cite only: `docs/prd/**`, `HelioGrid-UX/**` (the exported artboards and decisions records, one pair per screen, and the design system's source in `_ds-source/` — a git-ignored folder at the repo root that each machine exports itself),
   `docs/engineering/data-model.md` and `docs/engineering/forward-compat.md` (a schema-bearing
   task, where naming its entities or its first-migration row is clearer than restating them),
   `docs/ux/briefs/**`, `docs/prd/modules/M05-studio/defect-register.md`
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
