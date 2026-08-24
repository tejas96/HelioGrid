# Screen briefs — how to run the design loop

One file per screen, named `SCR-<module>-<nn>-<slug>.md` (e.g. `SCR-M02-01-quick-add-lead.md`).
The master list — every screen, its status, its design link — is
`docs/prd/registers/screens.md`. That register is the single source of truth for what exists and
what is done; this folder is its working material.

## The loop (one screen per Claude Design session)

1. Open a fresh Claude Design session (the HelioGrid design system already selected).
2. Paste `docs/ux/claude-design-context.md` — unchanged, every session.
3. Paste ONE brief from this folder.
4. Ask for the **mobile (375px) layout first**. Review.
5. Then: "Now the 1536px desktop layer — full parity, nothing dropped in either direction."
6. Then: "Now every state listed in the brief — the three base states plus the screen-specific
   ones."
7. Then run the self-audit (bottom of the context file): PASS/FAIL per requirement row, with
   the satisfying element named. Fix every FAIL in the same session.
8. Record the result in **two** places — both, or the trail breaks:
   - `docs/prd/registers/screens.md`: the screen's row, `UX status` → `designed`, `Design link` → the artifact.
   - `docs/tasks/<module>.md`: that screen's `DESIGN: SCR-… → PENDING` line → the artifact link.
9. If the brief said **"not pinned by PRD — designer decides"** anywhere and you made the call,
   write the decision back into the brief so the next screen inherits it.

**`docs/start-here.md` at the repo root is the fuller version of this loop**, with the exact messages
to send and worked before/after examples of both edits. If the two ever disagree, `docs/start-here.md`
is the one being maintained.

Do not batch screens into one session. A session that has drawn several screens starts
forgetting the laws.

## What a brief contains (and what it never contains)

Contains: who uses the screen and where; the verbatim requirement rows it must satisfy; the
states it needs; entry and exit points; realistic data volume; which numbers carry provenance
tiers. Never contains: colours, spacing, typography, component styling — the design system in
Claude Design owns all of that.

## If a design decision splits or merges a screen

That is allowed — the register is updated, never bypassed: the SCR row is split/merged there
first, briefs are regenerated to match, and the affected engineering tasks in `docs/tasks/` are
re-pointed. A screen that exists only in a Claude Design artifact and not in the register does
not exist.
