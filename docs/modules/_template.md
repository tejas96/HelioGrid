# MODULE <name> — roadmap (Track <X>, target days <n>–<n>)

> Authored BEFORE implementation begins (docs/17 §3). This file is the module's ONLY
> task list — every task for backend + web + mobile + UX + schema + jobs lives here,
> scoped to THIS module only (Law 9). Keep Status live; a stale roadmap is a Law 8
> violation. Cross-module sequencing stays in docs/14.

## Scope
One paragraph + explicit NON-goals. Forward-compat register row
([./forward-compat.md](./forward-compat.md)) restated.

## Traceability header
- D-decisions: D<n>, D<n>… (+ docs/15 rulings touched)
- Mockups (by filename): `<Screen>.dc.html`, …  · UX gaps to design in-slice (docs/13 rows)
- docs/04 sections owned: §<n> (tables this module's FIRST migration authors)
- Contracts to add: `packages/contracts/src/<area>.ts` routers
- Jobs/ports: names + idempotency keys (contracts/jobs.ts)

## Tasks
Every task lands web+RN in the same slice where a mobile surface exists (Law 7).
Status ∈ todo · in-progress · blocked(reason) · VERIFIED (never "done" without evidence).

| # | Task | Layer(s) | Traces to | Depends on | Status | Evidence |
|---|---|---|---|---|---|---|
| 1 | Contract diff: <routes> | contracts | D<n> | — | todo | |
| 2 | Migration <NNNN>: <tables> + RLS + grants | db | docs/04 §<n> | 1 | todo | |
| 3 | <service/repo slice> | api | D<n> | 2 | todo | |
| 4 | <screen> web + RN | web+mobile+ux | `<Mockup>.dc.html` | 3 | todo | |
| 5 | Jobs: <name> (idempotent) | worker | D<n> | 2 | todo | |
| 6 | i18n keys + Hindi check | web+mobile | docs/10 §7 | 4 | todo | |
| 7 | AI review + DoD pass | all | CLAUDE.md §Slice workflow | 1–6 | todo | |

## Module Definition of Done
CLAUDE.md §Definition of done applies per slice, PLUS: all mockups above implemented · all D-decisions
honored or escalated · invariants touched by this module green · module wired into the
flows that reach it (no orphans) · docs + this roadmap fully updated.
