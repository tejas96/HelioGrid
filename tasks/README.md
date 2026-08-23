# Engineering tasks — structure and rules

One file per module (`M01-onboarding.md` … `M13-dashboards.md`), plus `SHELL.md` for the app
shell, `F-core.md` / `F-platform.md` / `F5-customer-link.md` where a foundation builds something
itself, and the studio split across `MS-studio-a.md` / `-b.md` / `-c.md`. Every task was
generated from the requirement register — no task exists without requirement rows behind it,
and no P0 requirement exists without a task (or an explicit `realized-by` pointer to the
requirement that carries it). The proof lives in `prd/registers/screens.md` §gates.

## Task anatomy

```
T-M02-001 · Quick Add Lead
Type: screen            (screen | engine | policy | integration | port)
Tier: P0
PRD:    M02-01 (P0), M02-03 (P0), M02-<nn> (P0), M02-05 (P0), M02-06 (P0)
DESIGN: SCR-<module>-<nn> → PENDING               — filled when the screen is approved
PORT:   (studio tasks only) POC files from prd/_process/studio/inventory/file-claims.md
DEFECTS:(studio tasks only) rows from prd/_process/studio/defect-register.md
DONE WHEN: the requirement rows' own Given/When/Then, copied verbatim — never paraphrased
```

## Binding rules

1. **Acceptance criteria are copied, never rewritten.** They were authored and locked in the
   PRD; "task language" paraphrases are how requirements drift.
2. **Reference whitelist.** A task may cite only: `prd/**`, `design/ds-source/**`,
   `ux/briefs/**`, `prd/_process/studio/inventory/**` and `prd/_process/studio/defect-register.md`
   (studio tasks), and `3d_design_studio/**` (tasks typed `port` only). Anything else —
   old research docs, the v1 repo — is a defect in the task.
3. **`DESIGN: PENDING` blocks build, not start.** Engine/policy/integration/port tasks have no
   design dependency and can start immediately. A screen task may be scaffolded but its UI is
   not "done" until the link is filled and matched.
4. **Studio tasks are ports, not rewrites** (ruling S12-1): engineering core moves as-is with
   its tests; UI is rebuilt to the new design; the defect register is the change list.
5. A task is complete when every DONE WHEN line passes and — for screen tasks — the **three**
   base states (loading, empty, error) plus brief-listed states exist at both 375px and 1536px
   with full parity. *(Was "four base states" until 2026-08-16; the fourth was `offline`, removed
   by owner ruling `Q61` on 2026-08-07. This rule is the completion bar every screen task is
   measured against, so it outlived the sweep that should have caught it.)*
6. **Every row id shows its tier where it appears.** A verbatim row quote carries it after the
   id — `**M02-02** (P0) — …`; a task that defers its quoting to the brief carries it on the
   `PRD rows:` line instead — `M02-01 (P0), M02-25 (P1)`. A task's own `Tier:` is the highest
   tier among its rows, so a P0 task may still contain P1/P2 rows: those are the cuttable ones,
   and they must be visible as such without opening the register.
