# Screen briefs — how to run the design loop

One file per screen, named `SCR-<module>-<nn>-<slug>.md` (e.g. `SCR-M02-01-quick-add-lead.md`).
The master list — every screen, its status, its design link — is
`docs/prd/registers/screens.md`. That register is the single source of truth for what exists and
what is done; this folder is its working material.

## The loop (one screen per Claude Design session)

1. Open a fresh Claude Design session (the HelioGrid design system already selected).
2. Paste `docs/ux/claude-design-context.md` — unchanged, every session.
3. Paste ONE brief from this folder.
4. Send the four messages `docs/start-here.md` carries, word for word: the 375px layout with its
   word plan, the 1536px layer, every state, then the self-audit with the word inventory first.
5. Record the result in **two** places — both, or the trail breaks:
   - `docs/prd/registers/screens.md`: the screen's row, `Status` → `designed`, `Design link` → the artifact.
   - `docs/tasks/<module>.md`: that screen's `DESIGN: SCR-… → PENDING` line → the artifact link, and
     the task's `Status:` → `designed` once every link it carries is filled. Gate-checked.
6. If the brief said **"not pinned by PRD — designer decides"** anywhere and you made the call,
   write the decision back into the brief so the next screen inherits it.

**`docs/start-here.md` holds the exact messages and both edits.** They are written once, there.

Do not batch screens into one session. A session that has drawn several screens starts
forgetting the laws.

## What a brief contains (and what it never contains)

Contains: who uses the screen and where; **the screen's one job and its order of attention**;
**the words on the screen** — every fact it carries, its kind and its form; the verbatim requirement
rows it must satisfy; the states it needs; entry and exit points; realistic
data volume; which numbers carry provenance tiers. Never contains: colours, spacing, typography,
component styling — the design system in Claude Design owns all of that.

**One job · Order of attention.** Two lines under the header, and the reason they exist is
composition: a brief that lists only obligations makes every row read as equally important, and a
screen where nothing is subordinate is the cluttered screen the product's first UX goal forbids.

```
**One job:** what a person opens this screen to do — one sentence.
**Order of attention:** 1 … · 2 … · 3 … — what they read first, second, third.
```

**Words on this screen.** A table under those two lines: one row per fact the screen carries, its
kind from the context file's §2 — data, status, action, help, more detail — and the form it takes
here. It is where a requirement row is sorted BEFORE the session, so the session does not turn the
row into a sentence. Where the screen shows prices or limits, a `Sample data` section quotes the
PRD rows that carry them, in the gate-checked quote form, so no session invents a name or a figure.

A session obeys the form cell to the letter, so when a drawn screen reads wrong, check the brief
first — and grep every other brief for the same line and fix each one. A word plan never states a
fact the brief does not pin.

Write them **before** the design session, for the screen you are about to draw. A brief whose
screen is already designed is left alone: editing it moves its digest and gate 31 refuses the
design until it is reviewed again, which buys nothing for a screen already drawn.

## The one thing no gate checks: the States list

Gate 4 holds every verbatim requirement quote in this folder against its PRD cell — but
**nothing checks that a brief's States list is complete**. It cannot be checked: states are a
design decomposition, not a projection of the
requirement rows, so no 1:1 rule exists to enforce (three formulations were measured on
2026-08-26 and all three fired on 17–43% of correct briefs).

**So read the States list against the requirement rows by hand, once, before the design session.**
A requirement whose failure, empty, refused or in-progress frame has no state is a screen that
gets built without it, and the first thing that catches it is `/verify` on the real surface.

## If a design decision splits or merges a screen

That is allowed — the register is updated, never bypassed: the SCR row is split/merged there
first, briefs are regenerated to match, and the affected engineering tasks in `docs/tasks/` are
re-pointed. A screen that exists only in a Claude Design artifact and not in the register does
not exist.
