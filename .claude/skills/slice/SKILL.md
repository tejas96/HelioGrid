---
name: slice
description: Implement one module-roadmap task end to end — loads exactly the right context, then works in the fixed order contract → migration → both platforms → gates → run-and-look → review → docs → evidence. Use for any feature implementation in this repo.
argument-hint: <module> <task-number>
---

# The slice loop

One roadmap task = one slice. Work that is not a roadmap task does not exist yet — run
`/roadmap <module>` first.

The Laws, the working principles and the stop-and-ask triggers are already in context
(`.claude/rules/00-laws.md`), and the gate commands are in `CLAUDE.md`. This skill adds the
two things they cannot: **what to read**, and **what order to work in**.

## 1. Load context — this recipe, nothing more

Read these, stop, and start. Target ~22–27k tokens.

1. The task row and module rulings — `docs/modules/<module>.md`
2. The screen specs in scope — `docs/modules/<module>/specs/<screen>.md`
3. `specs/d-decisions.md`, plus the `docs/15` rows it cites
4. `docs/04` — **only** the section this module owns
5. If UI: the relevant `docs/10` sections and the mockup files the task names

Per-package `CLAUDE.md` files and `.claude/rules/*` load themselves as you touch files.

**A full-corpus read is a defect, not diligence.** Anything you needed that is missing from
this list is a gap in the module's `specs/` — fix the spec, don't read the world.

## 2. Plan, and get it approved

You start in plan mode. Answer the working principles concretely for THIS task —
architecture impact, what belongs in a shared package, blast radius — plus the edge cases
you intend to handle and the ones you intend to skip. Do not edit until the plan is approved.

## 3. Then work in this order

| Stage | Do | Why the order matters |
|---|---|---|
| Contract | `/contract-change` | before any implementation — the diff IS the API review (Law 3) |
| Schema | `/migration` | this module's tables only (Law 9) |
| Build | web + RN together (Law 7) | wire it into the flows that reach it — never orphan a screen |
| Gates | the command list in `CLAUDE.md` | all green before you look at it |
| Verify | `/verify-app` | capture the evidence you will cite; green gates never prove UI |
| Review | `/lenses` | resolve every critical finding |
| Docs | `/doc-sync` | same commit as the code (Law 8) |
| Evidence | roadmap row → `VERIFIED` | say what you ran and what you saw; an empty Evidence cell fails CI |
| Ship | `/pr` | only when the user asks for it |

Skipping a stage leaves a trace: the gates, the doc-anchor check and the roadmap linter all
run in CI, and a stage you cannot honestly complete is a finding to raise, not one to omit.
