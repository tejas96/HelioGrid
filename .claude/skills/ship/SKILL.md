---
name: ship
description: Close out a task — level with main, gates once, the PR review by a second actor before anything is pushed, the done-when check, the misses and the cost recorded, a commit on the owner's yes, then push, the PR and its one CI run. Use when implementation and /verify are done.
---

# `/ship` — gates, the PR review, done-when, commit on a yes, push, one CI run

The PR is the one human gate (`CLAUDE.md` §8), so everything before it is mechanical and everything
in it is written for a five-minute read. This skill raises the PR; the owner merges.

## 1. Level with main, then the gates once

**Merge `main` in first**, so every diff below, the stamp and the gates read the tree that will
merge and the PR never opens `BEHIND`: `git fetch origin`; if `git rev-list --count HEAD..origin/main`
is above zero — never a rebase, never a force-push, and in three steps because git's merge hook
refuses an unstamped runtime tree:
1. `git merge --no-commit origin/main`.
2. `bash scripts/verify-digest.sh --staged` — the digest the ticket's stamp carries, or no runtime
   file changed on the branch → step 3. Otherwise `/verify` runs again on the merged tree (depth
   `delta`) and restamps; stage it.
3. `git commit --no-edit`.

**The stamp (`M113`).** The task's `**Verified:**` digest equals what `scripts/verify-digest.sh`
prints; missing or stale → `/verify` runs now. Docs, ci, config and tests-only changes carry none.

**The gates.** `pnpm check:all` ran once before `/verify`; if the tree changed since, run it again and
read its output, not its exit code. `pnpm verify:clean` (`M112`) runs only on its triggers — the diff
deletes or moves a file, or changes a `package.json`, a tsconfig or a build config — since those are
the faults a warm tree hides; otherwise CI is the clean room. Run it LAST, after §2's fixes. Deleted
a source file? `pnpm turbo build --force` first. Never weaken a gate.

## 2. The PR review — before anything is pushed

**Tier 0, inline, every change.** `git diff --name-status origin/main` plus `git ls-files --others
--exclude-standard`: each added or renamed file named with its `architecture.md` §4 step in one line;
each deleted or moved path grepped for in `.claude/`, `docs/`, `scripts/`, `.github/`, configs and
`.env.example` (Law 8). Every edited task file or ledger is diffed hunk by hunk and each hunk named
for the block it sits in (the first-match trap, `.claude/landmines.md`). A change that deletes or
moves an INSTRUCTION — a rule, a skill step, an agent's check — lists each one in the PR body as
KEPT or MERGED (with the file and line that now carries it) or DROPPED (with why); one with no new
home is not deleted.

**Every claim has its proof — a lookup, not a re-derivation.** `unit`/`invariant` → a CURRENT line in
`scripts/break-and-run.sh --stale <T-id>`, which also lists every WITHDRAWN proof, whose claim needs
one recorded again; `qa-*` → a `pass` for its step in `.git/heliogrid-harness/<T-id>/qa/verdicts-*.jsonl`;
`recorded` → its recorder line; `gate`/`held` → its row, which gate 32 checked (`M139`). A `none` the
owner saw at `/start` goes in the PR body under risks. A claim without a proof is fixed here.

**The second actor: `break-it-reviewer`, for every change to code or to the rules** — anything but
`.md` under `apps/`, `packages/`, `scripts/` or `.github/` (tests-only included), and anything under
`.claude/`, any `CLAUDE.md`, or `docs/engineering/architecture.md`. It reads the diff as the PR reviewer: the logic against the claims, every fact against the Placement table and
`architecture.md`, the proofs (it breaks two its own way), the review hash and the stamp. It edits
files in the main folder, so it runs ALONE — no build, no QA agent, no edit of yours while it works.
The prompt is this and no more:

> Task `<T-id | none — a harness change>` in `docs/tasks/<module>.md`. Proof record
> `.git/heliogrid-harness/<T-id>/` (`proofs.jsonl`, `review.sha`, `qa/`). New: `<files>`. Deleted or
> moved: `<files>`.

Its findings are the PR's review comments. Every blocker and major is fixed at the root cause before
the commit, and only the gates the fix touches re-run; a fix that edits a source file re-runs the red
proofs that break that file. A test it reports GREEN with its rule broken is fixed first. A
`review-hash` or `stamp` finding sends the work back to `/start` §5 or `/verify`. One review per
change; do not review the review. Outside the task's scope → `docs/tasks/deferred.md`.

## 3. Completeness, misses, cost

`scripts/break-and-run.sh --stale <T-id>` again — a fix after tier 0 may have staled a proof; a claim
without a current proof is not done. Its lines go into the done-when table beside their claims.

**Size is stated, never enforced (`M111`, review-only):** `git diff --cached --shortstat` after
staging (it counts new files), generated files said apart. Past 25 files, 1,500 lines, one migration
or one contract router, the only question is one task or two.

**The misses (`CLAUDE.md` §1).** Every mistake made in this task — yours, a reviewer's find, a gate's,
the owner's — as its KIND. No row in `.claude/landmines.md`'s misses table: add one, `seen 1`. A row
already there: a law break — write the general rule where it fires, as a type, lint rule or gate where
one can decide it, delete the row, and delete at least as many harness lines as the rule adds. The
list, even empty, goes in the PR body.

**The cost line**, one line in the PR body: agents dispatched by name, minutes from the go to here,
fix rounds, and which stage found each bug (`/start` review · build · gates · `/verify` · PR review).

## 4. Flip the ledger, then commit on a yes

The flip rides the change commit (`M106`): read the number the next PR will take — the highest issue
or PR number plus one — and write `shipped (#n)` into the task's `Status:` line and its screens in
`screens.md`; a screen task's `DESIGN:` line gains its `HelioGrid-UX/` export path. §1's gates ran
before the flip; they are not re-read after it. A flip never gets its own commit or PR.

Show the file list, the line count and the commit message, then END THE TURN. The yes is the owner's
next message, given to exactly what was shown; a go, a green gate or an earlier yes is not it, and a
changed file list needs a new yes. On the yes: commit with the `Co-Authored-By` trailer, never
`--no-verify`, never a QA scratchpad.

## 5. Push, the PR, its one CI run

`git push -u origin <branch>`, then open the PR — ready, never a draft — with a body in this order:
1. **What and why** — one paragraph and the impact; the task id is in the title.
2. **Design** — the three things, the Placement table, any ruling, by row id.
3. **Done-when** — a table: each claim, its proof, where the proof is. The QA plan is linked in the
   ticket, not copied.
4. **Verification** — `/verify`'s section verbatim, including what was not run.
5. **Review and risks** — break-it's findings and their fate; the misses; the `none` claims; the
   KEPT/MERGED/DROPPED list when instructions moved; the cost line.

End with the generated-with line, and print the body in chat too. Never merge, never push to `main`,
never force-push. If `gh pr create` returned a number other than the flip's, ONE mechanical correction
commit fixes the `Status:` line and its screens (`M105`).

**Read the commit's OWN CI run, and push nothing while it runs** (`M127`, review-only): a second push
cancels the run that proves the change. Find it by the FULL commit id:

```bash
sha=$(git rev-parse HEAD)
for try in $(seq 60); do id=$(gh run list --commit "$sha" --json databaseId -q '.[0].databaseId'); [ -n "$id" ] && break; sleep 5; done
[ -n "$id" ] || { echo "no CI run registered for $sha after five minutes"; exit 1; }
gh run watch "$id" --exit-status
```

- **success** → report the PR link and the verdict, job by job. The owner merges.
- **anything else** → read the failed step and fix it on this branch, each fix commit with its own
  yes. A job "not started because it repeatedly failed to be acquired" is GitHub's runner pool: re-run
  it once (`gh run rerun "$id"`), and report it if it recurs. No run at all is reported, never read as
  green.
