# Screen briefs — how to run the design loop

One file per screen, named `SCR-<module>-<nn>-<slug>.md` (e.g. `SCR-M02-01-quick-add-lead.md`).
The master list — every screen, its brief, whether it is V1 — is `docs/prd/registers/screens.md`.
That register is the single source of truth for what exists; whether a screen is drawn is its
task's `DESIGN:` line in `docs/tasks/`. This folder is the register's working material.

## How a brief becomes a screen

Claude Code checks the brief, and one drawing agent draws the screen from it on the module's
canvas (`.claude/skills/task/design-track.md`); the owner reviews the board there. The drawing
prompt, the fix prompt and the checklist a drawn screen is judged by are written once, in
`docs/start-here.md`.

## What a brief contains (and what it never contains)

Contains: who uses the screen and where; **the screen's one job and its order of attention**;
**the words on the screen** — every fact it carries, its kind and its form; the verbatim requirement
rows it must satisfy; the states it needs; entry and exit points; realistic
data volume; which numbers carry provenance tiers. Never contains: colours, spacing, typography,
component styling — the design system owns all of that.

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
PRD rows that carry them, in the verbatim quote form, so no session invents a name or a figure.

A session obeys the form cell to the letter, so when a drawn screen reads wrong, check the brief
first — and grep every other brief for the same line and fix each one. A word plan never states a
fact the brief does not pin.

Write them **before** the design session, for the screen you are about to draw. A brief whose
screen is already drawn changes only as `docs/start-here.md` *When a brief changes after its screen
was drawn* says.

## The one thing no check can hold: the States list

A drawn screen's board is checked on its canvas and locked
(`.claude/skills/task/design-track.md`) — but **nothing checks that a brief's States
list is complete**. It cannot be checked: states are a design decomposition, not a projection of the
requirement rows, so no 1:1 rule exists to enforce (three formulations were measured on
2026-08-26 and all three fired on 17–43% of correct briefs).

**So read the States list against the requirement rows by hand, once, before the design session.**
A requirement whose failure, empty, refused or in-progress frame has no state is a screen that
gets built without it, and the first thing that catches it is verify on the running app.

## If a design decision splits or merges a screen

That is allowed — the register is updated, never bypassed: the SCR row is split/merged there
first, briefs are regenerated to match, and the affected engineering tasks in `docs/tasks/` are
re-pointed. A screen that exists only on a canvas and not in the register does
not exist.
