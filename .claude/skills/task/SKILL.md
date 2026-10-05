---
name: task
description: Use when the owner asks for the next engineering step of HelioGrid's build order, or to start, continue or finish one task or part through plan, build, QA, review, commit, draft PR and CI. Never starts on its own.
user-invocable: true
disable-model-invocation: true
---

# /task — one engineering step, from the walk to the owner's merge

You are Main: the one writer. Helpers read and report; you decide, build, fix and clean up. The
laws are `CLAUDE.md`, cited by section and never copied; the order is `docs/build-order.md`; the
task in `docs/tasks/` is the operational source; the PRD rows and brief it cites are the higher
authority when it is unclear, silent or contradicts them.

Two owner gates and only two: the complete contract (step 3) and every commit (step 7, again for
each CI fix). A design or dependency blocker is a prerequisite, not a gate: the step ends with the
blocker named. `/task <id>` for a task that is not the walk's step is refused with the step named.

## 0. Runtime ledger — before anything runs

First the branch, before any edit: `git switch -c feat/<task or part id> origin/main` on a clean
tree (`git status`); the folder is shared with every other session, so a dirty tree is theirs.

Record every resource you will touch as `pre_existing` or `started_by_task`, with the identity
that stops or restores it, in the task's `#### Runtime` section:

| resource | how you look | identity |
|---|---|---|
| web `3002` · api `8084` · metro `8081` | `lsof -nP -iTCP:<port> -sTCP:LISTEN`; `curl -s localhost:8084/health/ready` | pid, launch name, preview serverId |
| postgres `5544` · object store `9000` · temporal `7233` | `docker ps` | container name |
| simulators · emulators | `xcrun simctl list devices booted` · `adb devices` | UDID · serial, host pid |
| browser tabs | `tabs_context` | tabId |
| database routing | `grep -E '^DATABASE_(ADMIN_)?URL=' .env.local` | both database names |
| logs | `wc -c .qa/api.log .qa/web.log .qa/metro.log` | byte marks |

A healthy HelioGrid server (its pid's command names this repository and `/health/ready` answers
200) is reused as it is. A foreign listener is the owner's to free with the `clean-dev-ports`
launch configuration; you never kill by port or name. You start a server only through
`.claude/launch.json` with the preview tool. A simulator is chosen by the NEWEST install of
`com.heliogrid.app` (`xcrun simctl get_app_container <udid> com.heliogrid.app`, then `stat` its
binary); a native rebuild happens only when native files changed after that install or the app is
absent. Metro is shared by both phones; JavaScript changes reload through it.

## 1. Select — the walk, fail closed

1. Read the block table and the placement paragraphs in `docs/build-order.md` ("The order").
2. For each block from 0, for each task file in the row's order, list the tasks once:
   `grep -n -E '^### T-|^\*\*(Type|Status|Depends on|Blocked|Parked|DESIGN|Design):\*\*|^#### Parts|^\| [a-z] \|' docs/tasks/<file>.md`.
   Inside a file: the first open row of a `#### Parts` table, else engine, policy, integration and
   port tasks first in file order, then screens in file order; a `Depends on:` task of the same
   block goes before the task that names it; a task placed apart from its file sits where the
   block row puts it.
3. The step is the first task that is not `shipped` or `struck` and carries no `Parked:` line,
   whose screens are V1 (`docs/prd/registers/screens.md` §2, column `V`; a V2 screen is skipped):

   | the task | the step |
   |---|---|
   | ready: every `Depends on:` shipped, every screen it serves drawn | `build <id>` (a part: its own id) |
   | a screen whose `DESIGN:` reads `PENDING` | `owner draws <SCR-…>` |
   | a screen whose `Design:` line names another task's canvas | drawn when that task's `DESIGN:` holds a link; otherwise `owner draws` that screen |
   | a backend whose V1 screens in its block are not all drawn — its file's, and any whose `Depends on:` names it | `owner draws <SCR-…>, …` |
   | a `Blocked:` line · waits on a parked task · waits on an open task of a later block (a `Depends on:` naming a later-block task or a later module's first migration) | `owner clears <id>` — the blocker, at most two clearing paths, the recommended first |

4. Emit exactly one line — `build <id>` · `owner draws <SCR-…>` · `owner clears <id>` — with the
   file and line that decided it. `owner draws` and `owner clears` end the step here.

## 2. The contract — one document, one approval

Write under the task's header lines (`docs/tasks/README.md` keeps the shape):

- `#### Plan` — first a summary of at most ten lines: what changes, the files by package, the
  size, the routes and tables, the proofs — the owner reads this before anything else; then
  scope in one paragraph; each decision with ONE reason; UX readiness; every new
  file with its placement answer from `docs/engineering/architecture.md` §4; interfaces and
  migration numbers; rollout safety (old readers, new readers, expand then contract);
  the twin screen on the other platform (`.claude/rules/screen-parts.md`).
- `#### Acceptance criteria` — every `DONE WHEN` line verbatim, labelled `AC-1`, `AC-2`, …;
  an extension gets the next label; each line names its proof by test file and name, or by the
  running-app check that proves it.
- `#### QA plan` — one row per proof: `id · owner · tier · surface · action → expected · proof`.
  Owners: `main-dev` (unit, contract, curl against `8084`, request ids), `qa-web`, `qa-ios`,
  `qa-android`, `evaluator`, `ci`. Tiers: `required`, `blocked` (names what clears it),
  `not_applicable` (names why). CI lanes today: `quality`, `e2e-web`, `mobile-js`, `android`,
  `ios`, chosen by the path rules in `.github/workflows/ci.yml`; a lane an AC needs that the
  paths skip is `FAIL`, never a pass. An API behaviour is proven by its test file on
  `heliogrid_test` (`pnpm exec vitest run <file>`, both database names switched —
  `infra/README.md`) and CI. Before PR C no row claims phone CI proof: phone rows are local, by
  `qa-ios` and `qa-android`.
- `#### Parts` — the `Where` table is complete or the plan is not, and it is the budget: a part
  holds about 20 files and 1,000 lines, or holds one independently rejectable deliverable. The
  cap decides WHERE the work splits, never what is cut: a test, a protection row or a doc line is
  never dropped to fit, and a cut that would drop a proof splits the part instead. Each part is
  an end-to-end deliverable with its id, AC subset, dependency, files, rows and proof; web and
  phone of one flow stay in one part. Each part carries a checklist — one box per file group of
  its `Where` rows and one per proof — ticked as it lands.

A clear PRD or brief answer corrects the task before approval. Silence or ambiguity: at most two
options to the owner, the ruling written into the PRD row or brief first, then the task. Nothing
is invented in implementation.

## 3. Design check — screen tasks

Fetch the record yourself with `DesignSync` `get_file` (the project and file name are in the
task's `DESIGN:` link; the `… decisions … .md` sits beside the board) and hand its text, the brief
and `docs/start-here.md` to `design-check`. `READY` goes into `#### Design check` with the
verdict's date; anything else goes to the owner as the helper's one prompt. The owner's "done"
means: fetch again, check again. A studio screen reads `ported from the POC` and has no check.

Then present the contract and stop. Nothing is built before the owner's go (`CLAUDE.md` §3).

## 4. Build

Tests first (`.claude/rules/testing.md`): one slice at a time — failing test, minimal code,
targeted pass, `pnpm check`. Every money, tenancy or permission rule and every check you add or
change is seen red on a planted bad line, and the line is recorded for the commit card. A new
route, table, contract, package or behaviour stops you: repartition and go back to step 2. The
planned file list is the budget: when the changed set passes it by a fifth, or a file lands in a
package the plan does not name, stop, show the delta (planned and built · built but not planned,
each with its reason · planned but not built) and repartition — never trim a proof to fit. Tick
the part's checklist as each file group and proof lands; the owner reads it, never a transcript.
A planted red that needs a database runs on `heliogrid_test`; no task creates a database of its
own.

Before any helper runs, drive one happy path yourself on the surface you
changed.

## 5. QA — helpers once, on one stack

Start or reuse the stack (step 0). Set both `.env.local` database names to
`heliogrid_test`, run `pnpm db:migrate`, restart only the api, and verify both names before QA.
Standing accounts, one helper each: `…901` web, `…902` iOS, `…903` Android (`DEV_OTP_PHONES`); a
missing standing company is created once through the app before QA; API tests never use them.

Give every helper the same context packet and nothing else: the AC lines, its rows, the interface
and file map, the diff summary, the commands already run, the runtime identities and log paths.
Start `qa-web`, `qa-ios` and `qa-android` together — an omitted surface starts no helper — and
`reviewer` beside them with the finished diff. Fix the reviewer's findings, then CONTINUE the same
reviewer (`SendMessage`) with only the fixed files; never a fresh instance. A third pass happens
only when a fix touched a money, tenancy or permission rule. `evaluator` starts only after every
surface helper has returned and the review fixes are in; it runs `pnpm check:all` once, and what
it regenerates (OpenAPI, catalogs) is yours to read and commit. A code change after that gate
reruns `pnpm check` and the one command that proves the change, by you, and the evaluator is
continued with that output; it is never re-spawned.

Fix only an evidenced failure; rerun only the owning row — a surface row by its helper. The third
failure of the same row stops for the owner. A check's proof is its full output read to the end;
a grep for one line is never the proof.

## 6. Pre-commit card

Show, and stop: the AC proof summary (the evaluator's rows), the review result, every planted-red
line, the changed files in three lists (planned and built · built but not planned, each with its
reason · planned but not built), the exact commit message (the task's `Status:` or the part's row
turns `shipped` in this commit), mistakes found and the rule that now prevents each, unresolved
blockers, the runtime cleanup state, and the measurements — tool-call turns, tokens, helper runs,
planned versus built — written under the task's `#### Runtime` in the same commit.

Commit only on the owner's yes to THIS card; a `go`, a green
check or an earlier yes never counts (`CLAUDE.md` §4). Never `--no-verify`, never force-push.

## 7. Draft PR and CI

Push, open a DRAFT PR whose body carries the proof and the mistakes record. A failed required job
goes to `ci-investigator` for that job only; show a CI-fix card (cause, files, proof, message);
the owner's `fix` approves that card and the same-PR push, nothing unshown. Judge only the latest
run of the head SHA. Mark ready when every required lane has passed; the owner merges.

## 8. Teardown — on success, block, cancellation or failure

Restore both `.env.local` database names to their initial values, restarting the api only if you
restarted it; stop every `started_by_task` resource by its exact identity (`preview_stop`,
`xcrun simctl shutdown <udid>`, `adb -s <serial> emu kill`, `tabs_close`); run `pnpm infra:down`
only if this task ran `pnpm infra:up`; leave every `pre_existing` resource alone; keep the logs
and proof. Report `resource → initial state → final state`. `DONE` is refused while a
task-owned process lives or the database routing differs from its initial state. The next task
starts in a fresh session.

## Helpers — `.claude/agents/`

| helper | model · effort | when | returns |
|---|---|---|---|
| `design-check` | opus · medium | step 3 | `READY` · `NEEDS_CHANGE` · `NOT_DRAWN`, findings, one prompt |
| `qa-web` · `qa-ios` · `qa-android` | sonnet · medium | step 5, together | `PASS` · `FAIL` · `BLOCKED`, `row → action → observed → measurements → new log range` |
| `reviewer` | opus · medium | step 5, with QA | `blocker` · `should-fix` · `note`, `row → file:line → evidence → smallest fix` |
| `evaluator` | sonnet · medium | step 5, after QA | `AC → owner → proof → result → evidence`, the gate, regenerated paths |
| `ci-investigator` | sonnet · high | step 7, one failed job | cause, evidence, smallest fix, proof |

Helpers hold no `Agent`, `Write` or `Edit` tool and start no helper of their own. Only you read
Claude Design (`DesignSync` is Main-only). Each helper receives the packet and its contract — never
a copy of the laws. A rerun continues the same helper with the delta, never a fresh instance.
