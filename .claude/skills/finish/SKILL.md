---
name: finish
description: Close out a piece of work — full gates, architecture review, then propose the branch, commits and PR with the verification record. Use when implementation and /verify are done.
---

# `/finish` — gates, review, then propose the PR

Nothing here commits, pushes or opens anything without being asked — **every time, for every
action.** No approval carries forward: a yes to one commit is not a yes to the next, and an
instruction to do the work is never approval to commit it.

## 1. Gates

```bash
pnpm verify
```

All five stages must pass. **Never weaken a gate to make a change pass.** If the invariants
skipped (no `DATABASE_URL`) or ran vacuously, say so — a green run has NOT proven tenancy.

Deleted a source file? `pnpm turbo build --force` first, and run Law 8's deletion sweep.

## 2. Architecture review

Dispatch `arch-reviewer` on the diff. Fix every `blocker` and `major` at the root cause, then
re-run the gates.

**One review per change** (CLAUDE.md §8): findings get fixed and the work ships. Do not
re-review the review.

## 3. Propose the git plan

Present, and wait for an explicit yes before running anything:

- **Branch** — a name derived from the work. Never commit to `main`; it is PR-only.
- **Commit batching** — recommend one, state the alternative:
  - *one commit per task, one PR* — the default for a multi-task flow with a shared goal;
  - *a PR per task* — when tasks are independently reviewable or revertable;
  - *one squashed commit* — only for a small single-purpose change.
- **PR body** — summary, task list, and the `## Verification` section `/verify` produced,
  verbatim. That section is the only durable record that the work was run.

## 4. Execute what was approved

Commit, push and open the PR — each only after the yes that covers **that** action. End
commit messages with the `Co-Authored-By` trailer. If the owner approves the commits but not
the push, stop there and say what is staged. If they approve nothing, leave the work in the
tree and say what is there — that is a complete and correct outcome.

Never push or open a PR on your own initiative. Never `--no-verify`. Never commit a QA
scratchpad or artifact directory — `/verify` deletes its own; anything left is a bug in the
run, not something to commit.
