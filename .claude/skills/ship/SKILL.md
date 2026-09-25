---
name: ship
description: Close out a task — gates once, a review sized to the diff, the done-when check, a commit on a yes, then push and print the PR body for the owner to raise the PR. Use when implementation and /verify are done.
---

# `/ship` — gates, review, done-when, commit on a yes, push, print the PR body

The PR is the one human gate (`CLAUDE.md` §8), so everything before it is mechanical and
everything in it is written for a five-minute read. This skill raises the PR; the owner merges.

## 1. Gates, once

**Bring the branch level with `main` first.** A task takes hours and `main` moves under it:
`git fetch origin`, then `git rev-list --count HEAD..origin/main`. Anything above zero is merged in —
`git merge origin/main`, never a rebase and never a force-push — before any gate runs, so every
diff against `origin/main` below, the stamp and `verify:clean` all read the tree that will
actually merge, and the PR never opens `BEHIND`. A merge that changes the runtime digest means the
stamp is stale and `/verify` runs again; a merge of docs alone leaves it standing.

**The stamp first (`M113`).** The task's section carries `**Verified:** digest …` and
`scripts/verify-digest.sh` prints the same twelve characters for the working tree; missing or
stale means `/verify` runs NOW, in full, before any gate. The author's own driving never stands in
for the agents' verdicts. A tree whose runtime digest equals `origin/main`'s — docs, ci, config —
carries no stamp and needs none.

`pnpm verify:clean` — the proof in CI's room (`M112`): a fresh clone of what git would commit, CI's
environment, every stage read for its verdict, never for the exit code. **Run it LAST, after §2's
reviews are clean**: every fix `break-it-reviewer` forces changes the tree, and a clean run taken
before it is stale the moment that fix lands. If it already ran green
on this exact tree in this session (nothing changed since: `git status --short` and
`git diff --stat` identical), cite that run instead of running again. If the invariants ran
vacuously, say so — a green run has NOT proven tenancy. Never weaken a gate. Deleted a source
file? `pnpm turbo build --force` first, then Law 8's sweep.

## 2. Review sized to the diff

**Tier 0, every change, inline, two commands.** `git diff --name-status origin/main` plus
`git ls-files --others --exclude-standard` — the working tree, so uncommitted work counts: for
each added or renamed file, name its `architecture.md` §4 step in one line; for each deleted or
moved path, grep `.claude/`, `docs/`, `scripts/`, `.github/`, configs and `.env.example` for the
dead pointer. Fix what that finds.

**Then check every edit landed where it was meant to.** Every edited task file, ledger or register
is diffed against `origin/main` and each hunk is named for the block it sits in, by reading the lines
either side; a stray blank line, or a hunk in a block this change never meant to touch, is a finding.
The edit discipline that prevents it — anchor on the block's own heading, edit inside that span,
re-read after writing — is `.claude/landmines.md`'s first-match row, and lives there once. An edited
rule, skill or ticket that says a fact is held cites the `mechanisms.md` row by id, read for its
status first — never a gate named in its place (`mechanisms.md`'s own header).

**Then match every fact to its assertion.** Each value, field or rule the ticket's Contract line
and done-when lines name, and each claim (`C`, `S`, `D`) in the ticket, is listed beside
the test line or gate that asserts it; a named fact or case with no assertion is a finding fixed
here, before any agent is paid to find it. A `none` claim the owner saw at `/start` has no
assertion by design: it goes in the PR body under risks, and a `held` one is listed beside its row.

**Then break it.** Start from the ticket's cases (`C` claims): read each fix in the
code, never derive the case again. Then hunt what that block missed. Read the diff as an attacker
and as an EPC expert: correctness, edges, failures, null/empty/invalid, unexpected flows,
regressions, performance, security, tenancy, money rounding, provenance, placement, duplication, a
bypassed contract (a hand-written wire type, a raw HTTP call), complexity, design mismatch, hidden
assumptions. An issue inside the task's scope is fixed now and its area re-reviewed; one outside it
goes to `docs/tasks/deferred.md` (`CLAUDE.md` §8).

**Tier 1, the agent, only for a structural diff.** Dispatch `arch-reviewer` when the diff (docs
excluded) creates a folder, adds a workspace dependency to a `package.json`, adds the FIRST import of
a workspace package into a package or app that never imported it (grep the base for
`from '@heliogrid/<name>'` in that tree), edits `docs/engineering/architecture.md`, or adds or
changes a file under `apps/web/` or `apps/mobile/` other than config. The app trees are in because
what the reviewer holds there has no full gate — a flow kept in a screen (`M80` is PARTIAL) and a
screen part written twice (`M115`, review-only). Outside them it stays off: imports keep to the
declared edges (`M1`), a schema and its contract agree (`M17`, `M18`), a breaking API change is judged
before it merges (`M26`), and a new file's place is tier 0's `architecture.md` §4 line. The prompt is
this and no more:

> Branch `<name>`; diff `origin/main...HEAD` plus uncommitted work. New: `<files>`. Moved or
> deleted: `<files>`. Design decisions to check, not re-litigate: `<the three things>`. Gates are
> green — read, do not run.

**Tier 2, the second actor, for EVERY runtime change.** The author wrote the code, the tests, the
QA plan and the stamp, and a rule obeyed by the one actor it binds is still that actor's honesty.
Dispatch `break-it-reviewer` in `diff` mode whenever the tree's runtime digest differs from
`origin/main`'s. It breaks every new rule in the main folder and runs the test that guards it, so
it runs ALONE — no build, no `verify:clean`, no QA agent and no edit of yours while it works. The
prompt is this and no more:

> Mode `diff`. Task `<T-id>` in `docs/tasks/<module>.md`. Scratch directory `<path>` holds the
> plan and the `verdicts-*.jsonl` files. New: `<files>`. The rules this change adds and the test
> the author says guards each, every case (`C` claim) among them: `<rule → test file>`.

A test it reports GREEN with its rule broken is fixed before anything else: it guarded nothing.
A `stamp` finding means `/verify` runs again. When its answer is clean, delete the plan and the
verdict files. No PR body is printed while a blocker or major from either reviewer stands.

Fix every blocker and major at the root cause and re-run only the gates the fix touches. One review
per change; do not re-review the review. A review that costs more than the change is the defect
this tiering prevents.

## 3. Completeness

Every done-when line of the task has its proof — a test, the `/verify` run's verdict or a gate. A line
without one is not done, and the PR body is not printed. `scripts/break-and-run.sh --stale <T-id>`
runs here and reads CURRENT for every red proof; its lines go into the PR body's done-when table,
each claim beside its proof, so the red runs the build recorded reach the owner. A task that turned out to be two is
split (`/start` §3), never shipped half.

**The size is stated, never enforced (`M111`, review-only).** Count the diff — `git diff --stat origin/main` plus
`git ls-files --others --exclude-standard` — and write the number into the PR body, generated files
said apart. Past **25 files, 1,500 lines, one migration or one contract router** the only question is
whether this is one task or two; a complete task ships whole, and nothing is cut from it to fit.

**Record the misses (`CLAUDE.md` §1).** List every mistake made in this task — yours, or caught by
a reviewer, a gate or the owner — each stated as its KIND, not its instance. For each, find its row
in the misses table of `.claude/landmines.md`. No row: add one, `seen 1`, naming the fix it got in
this change. A row already there: this is its second sighting and a law break — write the general
rule where it fires in this change, as a type, lint rule or gate wherever one can decide it, and
delete the row. The list, even when it is empty, goes into the PR body under Review and risks.

## 4. Flip the ledger, then commit on a yes

**The flip rides the change commit** (`M106`), so the ledger is right from the commit that makes
it true and the PR carries no window in which it is wrong. Before anything is shown: read the
number the next PR will take — the highest issue-or-PR number the repository holds, plus one —
and write `shipped (#n)` into the task's `Status:` line and into its screens in `screens.md`. A
screen task's `DESIGN:` line gains its export path in `HelioGrid-UX/` beside the canvas link, in
the same edit.
`M106` reads commit SUBJECTS, and the change commit's subject names the task, so the claim is
true the moment that commit exists. It reads RED in the seconds between writing the flip and
making the commit, which is why §1's gates run BEFORE the flip is written and are not re-read
after it. A flip never gets a commit or a PR of its own (`docs/tasks/README.md` rule 0).

Show the file list, the line count and the commit message, then END THE TURN. The yes is the
owner's next message, given to exactly what was shown; a go, a green gate, an event or a yes to
an earlier commit is not it, and a changed file list needs a new yes. On the yes: commit with the
`Co-Authored-By` trailer, never `--no-verify`, never a QA scratchpad or artifact directory.

## 5. Push, raise the PR, read its one CI run

`git push -u origin <branch>`, then open the PR — ready, never a draft, because the ledger it
carries is already correct and there is no window to hold shut — with a body in this order:

1. **What and why** — one paragraph; the task id is in the title.
2. **Design** — the three things as decided, and any ruling applied, by row id.
3. **Done-when** — a table: each line of the task, its proof, where the proof is.
4. **Verification** — the `/verify` section verbatim, including what was not run.
5. **Review and risks** — the review tier, its findings and their fate; the misses recorded and any
   law they became; what is deliberately not handled yet.

End with the generated-with line, and print it in chat too — the owner reads it there. Never
merge, never push to `main`, never force-push.

**Then check the number the flip claimed**, because it was read before the PR existed. If
`gh pr create` returned a different one, a PR opened in the seconds between, and ONE mechanical
correction commit fixes the `Status:` line and its screens (`M105`) — the only case this path
costs a second run.

**Then read the commit's OWN CI verdict, and push nothing to the PR while it runs** (`M127`,
review-only). CI cancels an in-flight run when a newer push lands on the same PR, so a second push
cancels the very run that proves the change — and a cancelled run can still hold a step that had
already failed, reading exactly like the harmless kind. Find the run by the FULL commit id, because a
short one matches nothing and "no run" is not a pass; then wait on that run:

```bash
sha=$(git rev-parse HEAD)
for try in $(seq 60); do id=$(gh run list --commit "$sha" --json databaseId -q '.[0].databaseId'); [ -n "$id" ] && break; sleep 5; done
[ -n "$id" ] || { echo "no CI run registered for $sha after five minutes"; exit 1; }
gh run watch "$id" --exit-status
```

- **success** → report the PR link and the verdict, job by job. The owner merges.
- **anything else** → a failed step is read and fixed on this branch, each fix commit with its own
  yes. A job "not started because it repeatedly failed to be acquired", or a run
  that never leaves the queue, is GitHub's runner pool, not the code: re-run it once
  (`gh run rerun "$id"`), and report it if it recurs. No run at all is reported, never read as green.

CI runs only on the PR, so this run is the first time the committed tree is checked whole — and
with the flip already inside it, it is also the only run the task needs.
