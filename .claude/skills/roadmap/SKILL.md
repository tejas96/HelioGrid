---
name: roadmap
description: Start a module — extract per-screen specs from its mockups and D-decisions, then author its roadmap from the template. Run before any implementation begins on a module that has no roadmap.
argument-hint: <module-name>
---

# Module kickoff

A module's roadmap is its ONLY task list. Author it before implementation begins, and keep
its status live — a stale roadmap is a Law 8 violation.

## Task 0 — specs extraction, always first

This is simultaneously the context diet and the UX↔backend drift firewall: it turns 100KB+
of mockup HTML and the master product spec into per-screen specs of a few thousand tokens,
and each spec becomes the reviewable contract that `ux-lens` checks the implementation
against. Model it on `docs/modules/auth-tenancy/specs/` — the pattern that cut per-task
context from ~65–80k to ~22–27k tokens.

Produce `docs/modules/<module>/specs/`:

- **One file per screen**, named for its mockup. Each carries: layout · **verbatim copy**
  (never paraphrase a mockup string) · component map (which component renders what) ·
  the screen's state machine · all four states · and an explicit **CONFLICT** list where
  the mockup contradicts itself or the design system.
- **`d-decisions.md`** — every D-decision this module touches, quoted verbatim, each
  annotated with its `docs/15` status (HONORED / SUPERSEDED / PARTIAL) and what it implies
  here. Mark superseded ones dead so nobody implements them.

Demo-only mockup strings ("Demo — enter…", "Restart demo") never ship. Call them out in the
spec rather than discovering them in review.

## Then author the roadmap

Copy `docs/modules/_template.md` to `docs/modules/<module>.md` and fill it. Three things
the template assumes you will do:

- **Restate this module's forward-compat row** (`docs/14` §4) — what it must build in NOW
  so a later module is not forced into a refactor. This is what makes Law 9's
  module-by-module growth safe rather than short-sighted.
- **Claim the `docs/13` UX-gap rows** this module will design.
- **Record five-lens calls as module rulings** as you make them. The owner may veto any of
  them, which is why they are written down rather than absorbed into the code.

## Then stop

The owner reviews the roadmap before implementation opens — that review is the scope gate,
and it is the point of authoring the roadmap separately from building. Update
`docs/modules/README.md` in the same commit.
