---
name: lenses
description: Review a slice through five independent lenses — senior engineer, UX, solar-EPC domain, product owner, and QA trying to break it. Use before marking any slice complete.
---

# The Five Lenses

Five genuinely different failure detectors, not five phrasings of one. **A lens that reports
nothing must say what it checked and why each check passed.** Silence is not a pass.

## Dispatch the three specialists in parallel

Over the slice diff (`git diff main...HEAD`), run these concurrently:

| Agent | Hunts for |
|---|---|
| `ux-lens` | mockup fidelity, design-system adherence, the four states, 375px, Hindi, a11y |
| `epc-lens` | solar domain semantics, Indian market rules, provenance and money law |
| `qa-breaker` | how to break it |

Each needs the module and task number, the diff, and the paths to the module's `specs/`
files — so it reviews against the spec rather than against its own taste.

Their checklists live in `.claude/agents/`. Do not restate them here: if a lens keeps
missing something, fix the agent, or every future review inherits the gap.

## Senior-engineer lens

Run `/code-review` over the same diff. Delegating beats writing a fifth bespoke prompt that
would drift out of step with the other four.

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
