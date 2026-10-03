---
name: ship
description: Close out a task — catch up with main, run the full check once, have a second agent review the code, fix what it finds and run the red proofs it names, mark the task shipped, then commit on the owner's yes, push, raise the PR with its QA report, and fix CI on the same PR. Use when the build and /qa are done.
---

# /ship — review, commit on a yes, PR, CI

## 1. Catch up with main

`git fetch origin`. If the branch is behind, `git merge origin/main` and resolve any conflict. When
main changed a package this task touches, start the servers and devices as `/qa` step 2 does and
run the regression suites from `/qa` step 3 again. For a part, `T-ID` below is the part's id
(`docs/tasks/README.md` rule 0).

## 2. The full check, once

Take the tree stamp (`/qa`, "The QA report"). It equals the QA report's `check:all green at` → print
`check:all unchanged since <stamp>` and go on. Otherwise — a fix, a merge from main, any edit —
`pnpm check:all` on the final tree. Read its output, not only its exit code. Never weaken a check to
make it pass — fix the cause.

## 3. Code review — one review, by a second agent

Dispatch `code-reviewer` with the task id (a part's id for a part), the task file and the QA report's path. It reads the diff
against `origin/main`. It reviews once; it is not run again after the fixes.

## 4. Fix every finding

Fix each finding. A fix that changes what a screen or a route does → the QA checks that cover it
run again — servers and devices started as `/qa` step 2 does, the same agent — and the suites the fix
reaches run again (`/qa` step 8). Then
`pnpm check:all` once more, on the fixed tree.

## 5. Run the red proofs the reviewer named

For each money, tenancy or permission rule the reviewer named, prove its test can fail:

1. Record the tree: `git status --porcelain | shasum` and `git diff | shasum`.
2. Copy the file to break into the scratchpad.
3. Apply the reviewer's smallest break, and run ONLY the test it names.
4. It must fail BY NAME — the test's title on a `FAIL` line. A crash, a missing file or a compile
   error is not red.
5. Copy the saved file back. Both hashes must equal step 1's; if not, stop and restore before
   anything else.
6. Write the rule, the break and the red line into the PR body's "Red proofs" table.

A test that stays green with its rule broken guards nothing: fix the test, then prove it again.

## 6. Mark the task shipped, and fix the docs the change made wrong

- The task's `**Status:**` line becomes `shipped`. A part instead turns its row of the task's
  `#### Parts` table to `shipped`; the task's `**Status:**` turns `shipped` with its last part
  (`docs/tasks/README.md` rule 0).
- A doc this change made wrong is fixed in the same commit (`CLAUDE.md` Law 8).

## 7. Show the owner, and wait for the yes

Show `git status --short`, the commit message and the PR body. Commit only on the owner's yes to
exactly that list and message — a yes to an earlier commit is not this yes.

## 8. Commit, push, open the PR

- `git commit` with the message `feat|fix|chore: T-ID — summary`, ending with the co-author line.
  Never `--no-verify`: the pre-commit runs Biome on the staged files, gitleaks and a cached
  typecheck of every package.
- The first push is `git push -u origin <branch>`. Never to `main`, never a force-push.
- `gh pr create` with the body below. Then bind the PR with the app's PR tools (`get_status`, and
  `bind_pr` if it is not listed). Never poll CI yourself.
- Keep `.qa/<T-id>/` until the PR merges: a CI fix may need its checks again. The next `/start`
  deletes it once the task reads `shipped`.

## 9. CI on the same PR

When a check fails, read its log for the PR head's full SHA, fix the cause, and show the owner the
fix commit; push it after the yes. CI runs on Linux, where paths are case-sensitive and the tools
are GNU — except the `ios` job, on macOS. A red phone flow keeps its screenshot and logs as the run's
artifact. The owner merges.

---

## The PR body

```
## What
T-M02-001 · Quick Add Lead — one short paragraph in simple words

## Plan
Where (packages) · How it works (the flow line) · Example

## Acceptance criteria → proof
| AC1 | ✓ | quick-add.test.ts › "…" · QA G1.1 |

## QA report
(the full report from /qa)

## Review
| finding | fix |

## Red proofs
| rule | break | red line |

## Mistakes found
One line per mistake found in this work — by the author, the review, QA or a check — named by its
kind, with where it is now prevented.

## Deferred
The deferred.md rows this task added.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
