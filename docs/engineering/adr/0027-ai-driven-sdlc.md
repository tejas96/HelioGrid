# ADR-0027: An AI-driven SDLC — one human gate, skills sized to the change

Date: 2026-09-06 · Records the process the owner ruled on the day the first Block 0 task shipped.

## Context

The repository is built by AI sessions; a person verifies the code, not the process. The first
task under the previous process cost more tokens in its architecture review than in its build: the
review agent inherited the session's top model, re-ran every gate the session had already run, and
injected violations to prove them. Plugin skills loaded a second copy of the constitution's design
gate on every task. Three rule files restated law that lived elsewhere.

## Decision

1. **Five skills, one pipeline.** `/start` (read the task's section, the three things, the size,
   the branch, stop) → build, tests first → `/verify` (depth: none, smoke, full) → `/ship` (gates
   once, a review sized to the diff, the size and done-when checks, a commit on a yes, then the
   push and the PR without one). `/contract-change` and `/migration` stay as the two cross-cutting
   procedures.
2. **One human gate: the PR.** A commit waits for a yes every time. After it, the push and the PR
   are the skill's. Merge is the owner's; `main` stays PR-only.
3. **A PR is one complete task and at most 1,000 non-generated lines** (`M93`). A task that cannot
   fit is split into complete slices before it is built.
4. **Agents run on Sonnet 5 at medium effort with a turn cap, never below Sonnet 5.**
   `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` is the default for any agent without its own model. The
   architecture reviewer reads; it never runs a gate, and it is dispatched only for a structural
   diff.
5. **The `superpowers` plugin is off for this repository.** It duplicates §1, §3 and §8 of the
   constitution, and its session hook forces a skill before every response. Other repositories
   keep it.
6. **Rules live once.** `.claude/rules/` keeps only law that spans packages and is not already the
   constitution's (`ui-adherence.md`). The brand example moved to `architecture.md` §4; the i18n
   file layout to `packages/i18n/CLAUDE.md`; the cross-platform file said nothing another file did
   not.

## Consequences

- A small change costs no agent tokens; a structural one costs a capped Sonnet review.
- The PR body is the design record, the done-when proof and the verification record in one place.
- What is review-held is stated as such: a PR's completeness (`M93`'s second half) and the
  reviewer's judgement. What is mechanical is a row in `mechanisms.md`.
- Superseded: `/finish` (rewritten as `/ship`), `.claude/rules/architecture-ownership.md`,
  `.claude/rules/cross-platform.md`, `.claude/rules/i18n.md`.
