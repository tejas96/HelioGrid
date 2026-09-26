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

Two risk tiers (`CLAUDE.md` §3), said on the ticket's `Risk:` line. **LOW**: the lines below, target
under 40. **HIGH**: the same plus the four marked HIGH. No `Risk:` line reads as HIGH.

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
**Risk:** LOW — <why>                  (or `HIGH — <why>`; git's pre-commit and CI read it from the task the branch names, M113)
**Why:** one or two lines, in EPC terms — who gains what, and what breaks without it
**Scope:** fixed at /start, locked by the go: **In** — the behaviours and the layers they touch ·
        **Out** — what is left out, with why · **Size** — files and lines. A new behaviour, layer,
        table, route or contract, or more than 1.5× the size, goes back to the owner before it is built
**Placement:** one row per NEW fact (a type, a vocabulary, a string, a query, a wire shape, a policy
        number): `| fact | owning package (architecture.md §2) | why it owns it | how others reach it |`,
        naming the guard each fact joins (Law 12)
**Data model:** (HIGH) the entity rows this task AUTHORS (a table copied from the data model), with the
        migration number and each table's tenancy; or "none — reads <entities> authored by T-…"
**Contract:** (HIGH) the routes and schemas it adds or changes, under a named packages/contracts file; or "none"
**Depends on:** task ids and migration numbers that must land first
**Cases:** one line per REAL risk the design was attacked with, nothing for one that cannot occur here:
        `- **C1** · <risk> → <fix> → <proof>`
**Used by:** the later tasks that consume what this one lands, in one line — written here, never into their tickets
**QA plan:** (HIGH) written at /start, before code, and edited only with the scope: the steps a person
        would notice plus one `landing` per surface, behaviour-level — what a person does and sees,
        never a selector or a seed (those go in the run's own `run.md`):
        `- **Q1** · <api|web|mobile|worker|parity> · <case ids, or landing> · <the action> → expect <literal> · observe <kind> · severity <blocker|major|minor>`
        — money, tenancy or provenance is `blocker`; the severity is set here, never by the executor
**Verified:** (HIGH) digest <12 hex> · <date> · <per-surface verdicts> — written by /verify from the
        runtime tree it drove, never by hand; git's pre-commit refuses a HIGH runtime change without it (M113)
**DONE WHEN:** the requirement rows' own Given/When/Then, copied verbatim — never paraphrased —
        each line `- **D1** · Given … → <proof>`
```

A case or done-when line's proof is one of: `<test file> › "<test title>"` · `tsc` — a type refuses
it, with the `@ts-expect-error` line that shows it · `Q<n>`, a step of the ticket's own QA plan ·
`recorded <id>`, a proof the author drives through `scripts/record-proof.sh` · `none — <reason>`, a
case nothing can prove here, which the owner sees at /start. A money, tenancy, permission or safety
rule, and a gate the task adds or alters, names a test that `scripts/break-and-run.sh` proves red;
its proof is filed under the line that names the test (`.claude/rules/testing.md`). No gate checks the
ticket's shape; `/start` fixes a missing part before the go and `break-it-reviewer` reads the tier.
Tickets written before this shape carry the earlier grammar (`→ proof:`, `**n/a**` lines, `**S<n>**`
claims, unnumbered done-when lines): `/start` rewrites a ticket into this shape before the go, and a
shipped ticket stays as history.

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
