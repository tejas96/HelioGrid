---
name: doc-sync
description: Keep documentation synchronized with the change in the same commit — update what the diff invalidated, record landmines and UX gaps, and confirm every cross-reference still resolves.
---

# Documentation sync

Law 8 in one sentence: the window between a code commit and a follow-up docs commit is
exactly when the next agent reads the stale version. So they travel together.

## Walk the diff and ask what it invalidated

| If the change touched | Update |
|---|---|
| schema | the `docs/04` section this module owns |
| a contract | the roadmap traceability header; `docs/07` if a port shape moved |
| architecture | `docs/02` — and if it was a new pattern, the ADR should have come first (Law 2) |
| a design-system ruling | `docs/10` |
| **something that cost real debugging time** | the owning package's `CLAUDE.md` Landmines, **date-stamped** — mandatory on first discovery, not optional |
| a surface the mockups don't cover | append a row to `docs/13` |
| a product-shaped call the owner may veto | module rulings in the roadmap |

The landmine row is the one people skip. An hour lost to a trap that nobody wrote down is
an hour the next person will lose too.

## Leave no dangling pointer

Every `docs/NN §M`, relative link and cross-reference you touched must resolve to a real
file and heading. Twelve files once cited constitution sections that were never committed —
nothing detected it because nothing checked. A repo-wide checker lands with the docs
restructure; until then, verify the references in your own diff by hand.

## Update the roadmap row

Status → VERIFIED with concrete evidence. Update `docs/modules/README.md` if the module's
overall status changed.
