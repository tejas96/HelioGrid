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

## Senior-engineer lens — `superpowers:requesting-code-review`

Run it with that skill, which dispatches a reviewer subagent over the diff. Do NOT try
`/code-review`: it is `disable-model-invocation` and refuses when an agent calls it, so for a
long time this step silently cost nothing — four lenses ran, the fifth reported nothing, and
the review still looked complete.

`/code-review ultra` (the multi-agent cloud review) is the USER's to run and is billed. Offer
it for a whole branch or a risky slice; never claim it ran when it did not.

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
