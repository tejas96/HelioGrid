---
name: lenses
description: Review a slice through five independent lenses — senior engineer, UX, solar-EPC domain, product owner, and QA trying to break it. Use before marking any slice complete.
---

# The Five Lenses

Five genuinely different failure detectors, not five phrasings of one. **A lens that reports
nothing must say what it checked and why each check passed.** Silence is not a pass.

## Dispatch the three specialists in parallel

Over the slice diff, run these concurrently. **Get the diff with plain `git diff` (plus
`git diff --cached`) unless the slice is already on its own branch with commits** — this repo
keeps git manual and reviews BEFORE shipping (CLAUDE.md §Process; /slice puts Review ahead of
Ship), so at review time the work is normally uncommitted on `main` and `git diff main...HEAD`
resolves to nothing. A lens handed an empty diff reports no findings, which reads exactly like
a clean review. If `git diff main...HEAD --stat` is empty, use the working tree.

| Agent | Hunts for |
|---|---|
| `ux-lens` | mockup fidelity, design-system adherence, the four states, 375px, Hindi, a11y |
| `epc-lens` | solar domain semantics, Indian market rules, provenance and money law |
| `qa-breaker` | how to break it |

Each needs the module and task number, the diff, and the paths to the module's `specs/`
files — so it reviews against the spec rather than against its own taste.

Their checklists live in `.claude/agents/`. Do not restate them here: if a lens keeps
missing something, fix the agent, or every future review inherits the gap.

## Senior-engineer lens — the USER runs this one

**You cannot invoke it.** `/code-review` is marked `disable-model-invocation` and refuses to
start when an agent calls it, so "run /code-review" silently cost this step every time: four
lenses ran, the fifth reported nothing, and the review still looked complete.

Ask the user to run `/code-review` over the same diff (or `/code-review ultra` for the
multi-agent cloud review of the branch), and say plainly in your summary that the
senior-engineer lens is PENDING until they do. Four lenses reported is not five.

## Product-owner lens — you run this one yourself

- Does the slice serve the D-decision its roadmap row traces to?
- Complete but minimal — no gold-plating, no quietly dropped acceptance criteria?
- Would the owner recognise their requirement in the running app?
- Did anything product-shaped get discovered and worked around? That belongs in the roadmap
  rulings, `docs/13` or `docs/15` **before** this ships.

## Resolve

Fix every critical finding before the slice is complete. A finding you consciously decline
gets its reason written into the roadmap — declining silently is how the next person
inherits it as a surprise.
