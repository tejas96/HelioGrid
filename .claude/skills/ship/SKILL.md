---
name: ship
description: Close out a task — level with main, gates once, the PR review by a second actor before anything is pushed, the done-when check, the mistakes and the cost listed for the PR body, a commit on the owner's yes, then push, the PR and its one CI run. Use when implementation — and, for a HIGH task, /verify — is done.
---

# `/ship` — gates, the PR review, done-when, commit on a yes, push, one CI run

The PR is the one human gate (`CLAUDE.md` §8), so everything before it is mechanical and everything
in it is written for a five-minute read. This skill raises the PR; the owner merges.

## 1. Level with main, then the gates once

**Merge `main` in first**: `git fetch origin`; if `git rev-list --count HEAD..origin/main` is above
zero — never a rebase, never a force-push — in three steps, because git's merge hook refuses an
unstamped HIGH runtime tree: `git merge --no-commit origin/main`; `bash scripts/verify-digest.sh
--staged` equals the ticket's stamp, or the task is LOW, or no runtime file changed on the branch —
else `/verify` runs again at depth `delta` and restamps, staged; `git commit --no-edit`.

**The stamp (`M113`), HIGH only.** The ticket's `**Verified:**` digest equals what
`scripts/verify-digest.sh` prints; missing or stale → `/verify` now. LOW, docs, ci, config and
tests-only changes carry none.

**The gates.** `pnpm check:all` once on the finished tree, its output read, not its exit code.
`pnpm verify:clean` (`M112`) only on its triggers — the diff deletes or moves a file, or changes a
`package.json`, a tsconfig or a build config — and LAST, after §2's fixes. Deleted a source file?
`pnpm turbo build --force` first. Never weaken a gate.

## 2. The PR review — before anything is pushed

**Tier 0, inline, every change.** `git diff --name-status origin/main` plus `git ls-files --others
--exclude-standard`: each added or renamed file named with its `architecture.md` §4 step; each deleted
or moved path grepped for in `.claude/`, `docs/`, `scripts/`, `.github/`, configs and `.env.example`
(Law 8). Every edited task file or ledger is diffed hunk by hunk, each hunk named for the block it sits
in (the first-match trap, `.claude/landmines.md`). A change that deletes or moves an INSTRUCTION — a
rule, a skill step, an agent's check — lists each in the PR body as KEPT or MERGED (with the file and
line that now carries it) or DROPPED (with why); one with no new home is not deleted.

**Every case and done-when line has its proof — a lookup, not a re-derivation.** A test name → the
test passes, and for a money, tenancy, permission or safety rule, or a gate this change adds or alters,
a CURRENT line in `scripts/break-and-run.sh --stale <T-id>` (a WITHDRAWN proof needs one recorded
again); `Q<n>` → a `pass` in `.git/heliogrid-harness/<T-id>/qa/verdicts-*.jsonl`; `recorded` → its
recorder line; `none` → the PR body, under risks. A claim without a proof is fixed here.

**The second actor: `break-it-reviewer`, for every change to code or to the rules** — anything but
`.md` under `apps/`, `packages/`, `scripts/` or `.github/` (tests-only included), anything under
`.claude/`, any `CLAUDE.md`, or `docs/engineering/architecture.md`. It reads the logic against the
cases, every fact against the Placement table, the proofs (it breaks two its own way), the Risk tier
and, HIGH, the stamp against the verdicts. It edits files in the main folder, so it runs ALONE. The
prompt is this and no more:

> Task `<T-id | none — a harness change>` in `docs/tasks/<module>.md`, `Risk: <LOW|HIGH>`. Proof
> record `.git/heliogrid-harness/<T-id>/` (`proofs.jsonl`, `qa/`). New: `<files>`. Deleted or moved:
> `<files>`.

Its findings are the PR's review comments. Every blocker and major is fixed at the root cause before
the commit; only the gates the fix touches re-run, and a fix to a source file re-runs the red proofs
that break it. A test reported GREEN with its rule broken is fixed first. A `tier` finding sends the
task back to `/start` §2 as HIGH — `case-reviewer` and `/verify` included; a `stamp` finding to
`/verify`. One review per change. Outside the task's scope → `docs/tasks/deferred.md`.

## 3. Completeness, mistakes, cost

`scripts/break-and-run.sh --stale <T-id>` again where proofs were recorded, and cite the lines it
prints now. **Size is stated, never enforced:** `git diff --cached --shortstat` after staging (it counts
new files), generated files said apart; past `/start` §2's signal, the only question is one task or two.

**The mistakes (`CLAUDE.md` §1)** — every one made in this task, yours or found by a reviewer, a gate
or the owner, as its KIND, in the PR body even when none; one a rule could have prevented goes to
`docs/tasks/deferred.md` for the next harness PR. **The cost line**: agents by name, minutes from the
go, fix rounds, the stage that found each bug (`/start` review · build · gates · `/verify` · PR review).

## 4. Flip the ledger, then commit on a yes

The flip rides the change commit (`M106`): the number the next PR will take — the highest issue or PR
number plus one — written as `shipped (#n)` into the task's `Status:` line and its screens in
`screens.md`; a screen task's `DESIGN:` line gains its `HelioGrid-UX/` export path. §1's gates are not
re-read after the flip. A flip never gets its own commit or PR.

Show the file list, the line count and the commit message, then END THE TURN. The yes is the owner's
next message, given to exactly what was shown (`CLAUDE.md` §4); a changed file list needs a new yes.
On the yes: commit with the `Co-Authored-By` trailer, never a QA scratchpad.

## 5. Push, the PR, its one CI run

`git push -u origin <branch>`, then the PR — ready, never a draft — with a body in this order:
1. **What and why** — one paragraph and the impact; the task id is in the title.
2. **Design** — the tier and why, the three things, the Placement table, any ruling by row id.
3. **Done-when** — a table: each case and done-when line, its proof, where the proof is.
4. **Verification** — HIGH: `/verify`'s section verbatim, what was not run included. LOW: `Risk: LOW —
   no /verify` and the gates that ran.
5. **Review and risks** — break-it's findings and their fate; the mistakes; the `none` claims; the
   KEPT/MERGED/DROPPED list when instructions moved; the cost line.

End with the generated-with line, and print the body in chat too. Never merge (`CLAUDE.md` §4). If
`gh pr create` returned a number other than the flip's, ONE mechanical correction commit fixes the
`Status:` line and its screens — the one commit that needs no yes, by owner ruling.

**Read the commit's OWN CI run, and push nothing while it runs** — a second push cancels the run that
proves the change. Find it by the FULL commit id:

```bash
sha=$(git rev-parse HEAD)
for try in $(seq 60); do id=$(gh run list --commit "$sha" --json databaseId -q '.[0].databaseId'); [ -n "$id" ] && break; sleep 5; done
[ -n "$id" ] || { echo "no CI run registered for $sha after five minutes"; exit 1; }
gh run watch "$id" --exit-status
```

**success** → the PR link and the verdict, job by job; the owner merges. **anything else** → read the
failed step and fix it on this branch, each fix commit with its own yes. "Not started because it
repeatedly failed to be acquired" is GitHub's runner pool: `gh run rerun "$id"` once, report it if it
recurs. No run at all is reported, never read as green.
