---
name: task
description: Use when the owner asks for HelioGrid's next build-order task, asks to start or continue a specific task, or asks to prepare a module's design (`design-track.md`). Never starts on its own.
user-invocable: true
disable-model-invocation: true
---

# /task — one task, from the build order to its pull request

You are Main: you decide, build, fix and clean up. Agents in `.claude/agents/` read and report; only
you, the step 5 build agents and the Design track's drawing and fix agents (in the scratchpad only)
edit files. The laws are `CLAUDE.md`, cited and never copied. One
task runs in one session and ends in one pull request. The owner says yes to the RFC and to every
commit, and merges the PR.

**The test-database prefix** points a command at `heliogrid_test` without touching `.env.local`;
steps 5, 7 and 8 put it in front of their command:

```bash
export $(grep -E '^DATABASE_(ADMIN_)?URL=' .env.local | sed 's/heliogrid_dev/heliogrid_test/' | xargs) &&
```

## 1. Pick the task

Nothing but reads runs before it — the only files it writes are boards, the support files they load
and a canvas's `project/canvas.json`, read into the scratchpad.
Every `git`, `gh` or Artifact read must succeed: a failed read stops the step with the command
and its error, and a failed `gh pr list` never reads as "no open PR".

1. `git fetch origin`, then read `docs/build-order.md` with `git show origin/main:docs/build-order.md`.
2. Walk its blocks from 0. Inside a block, take the task files in the order its row writes them;
   inside a file, its backend tasks (engine, policy, integration, port) before its screens, each in
   file order; a `Depends on:` in the same block pulls that task ahead, and its own `Depends on:`
   pulls in turn — the first task with nothing open under it is the one taken. Read each task's header
   lines from `origin/main`. Skip a task that is `shipped` or `struck`, carries `**Parked:**`, or
   serves only V2 screens (`docs/prd/registers/screens.md` §2, column `V`).
3. A task with a `#### Parts` table is taken by its first row that is not `shipped` and has no open
   PR, by its own id (`T-SHELL-003a`).
4. Read the open pull requests once:
   `gh pr list --state open --json number,headRefName,files,statusCheckRollup,reviewDecision`.
5. Two cases skip the walk. A task's open PR has a red CI job or review comments: take it on its
   own branch, at step 9's CI loop. The owner names a task: take that task, still classified by
   the table below.

Classify the first task left, and say one line with the file and line that decided it:

| the task | the step |
|---|---|
| any open PR adds a migration (a file under `packages/db/migrations/`), or is the `design/<module>` PR of a module this task builds or serves | `owner merges #<n>` — the shared local database and the `DESIGN:` lines read from `origin/main` are only right after it merges. Stop. |
| an earlier part of the same task has an open PR | `owner merges #<n>` — this part builds on that code. Stop. |
| the task itself has an open PR (`feat/<id>`) | in review: skip it and walk on — its `shipped` reaches `origin/main` when the owner merges. |
| a task it depends on has an open PR | `owner merges #<n>` — this task builds on that code. Stop. |
| carries `**Blocked:**`, waits on a parked task or on an open task of a later block | `owner clears <id>` — the blocker and at most two ways to clear it, recommended first. Stop. |
| an owner-named task that serves only V2 screens (`docs/prd/registers/screens.md` §2) | `owner rules <screen>` — draw it ahead of V1, or not now; the Design track draws only V1 screens. Stop. |
| a screen it builds or serves reads `PENDING` on its `DESIGN:` line — or its older `**Design:**` line names another task's canvas whose `DESIGN:` reads `PENDING` | `design <module>` — run `design-track.md` on `design/<module>`, cut from `origin/main` on a clean tree; its step 1 draws the missing boards. |
| a screen it builds or serves, whose own task is not `shipped`, has boards that are not locked (`design-track.md`, *Is a board locked?*), or its brief has a `## Redesign owed` section | `design <module>` — run `design-track.md` on `design/<module>`, cut from `origin/main` on a clean tree, then walk again. |
| a task it depends on is not `shipped` and has no PR (an owner-named task) | take that task instead, walked the same way, and say so |
| otherwise | `build <id>` |

A studio screen reads `ported from the POC`: it has no board, and the POC
(`/Volumes/works-space/Solar-App-POC`) is its reference.

**Branch.** Continue `feat/<id>` when it exists — a dirty tree on it is this task's work, resumed —
else cut it from `origin/main` on a clean tree. A dirty tree on another branch belongs to its
owner: name its files and stop. An RFC that already carries `**RFC approved:**` resumes where its
branch stands — build, review, QA or gate — and is not asked again.
Write down what is running before you start anything — listeners on 3002, 8084, 8081 and 3100, booted phones (`xcrun simctl list devices booted`, `adb devices`), `docker ps` — so step 8
stops only what this task started. A phone booted then is the owner's — another product may use it —
so it is named in this step's note and never shut down by this task; if it stops and this task boots
it again, it is this task's from then on.

## 2. Analyse

Read, in one batch: the task's header lines and `DONE WHEN`; every PRD row it cites, whole; its
brief (`docs/ux/briefs/`); for a screen task, every `.design/<module>/<screen id>-*.dc.html` of each screen it builds or serves; every
`docs/tasks/deferred.md` row it meets (`T-<this> starts`, `T-<x> ships` where x has shipped, and
`touches <path>` where a planned file sits under that path), and also every row naming a screen it
builds whatever its trigger — a `Depends on:` can pull this task ahead of the one the row names, and
a row whose change this task draws joins it; `docs/engineering/architecture.md`
§4; and the `CLAUDE.md` of every package the change will touch. Search the code for what already
exists before planning anything new (Law 5) — an `Explore` agent on Opus for a broad sweep.

A planned file that an open PR adds or changes, or an export only an open PR adds, stops the
task: `owner merges #<n>`. `docs/tasks/` files are excepted: step 9 merges them.

Test every line the task carries, once, quickly:

- **Wrong** — it contradicts a higher source (`CLAUDE.md` §7) or the code as it stands.
- **Missing** — a state, an edge case from the list in `rfc-template.md`, or a role is not covered.
- **Over-built** — a simpler way meets the same PRD row, or the line builds for a future no row asks for.

A higher source corrects the task. Silence or ambiguity goes to the owner as a decision in the RFC,
at most two options, recommended first; the ruling lands in the PRD row or brief first, then in the
task. The build invents nothing.

## 3. Write the RFC

Write it under the task's header lines as `#### RFC` (a part: `#### Part <x> · RFC`), in the shape
of `rfc-template.md`. It is the one plan every agent works from: nobody downstream invents a
requirement it does not hold.

Before the review, walk `rfc-template.md` against the RFC line by line — its rule for reading code,
its Proof rules and its edge-case table: a plan written from a types file is the first review's most
common blocker.

**A task is one PR, whatever its size.** It splits into parts only when the owner asks for it: each
part is then end to end and holds the web and phone halves of its flow together, and the task gets a
`#### Parts` table (`part | what | AC | depends on | status`).

## 4. Review the RFC, then ask once

Give `rfc-reviewer` the RFC, the task, its PRD rows, its brief and every locked board path. Fix every
finding it confirms in the RFC. A finding you reject gets one line of reason in the RFC.

Then show the owner the short view, never the whole RFC: the title; a link to the `#### RFC`
heading by file and line; the user impact; the diagram, always, drawn in the inline widget — the RFC's Mermaid
block, or, when it says `No boundary change`, the user's flow: open, read, screen, each act and its
outcome (show the block as it is only where the chat cannot draw); the size on one line; what the review
changed, one line each; then:

- `Motion:` one line — each moment the RFC chose, by name; one that moves what a built screen did not
  move before is also a line of `Decisions for you`.
- `Decisions for you:` each open decision on one line — options, recommended first — or `none`.
- `Simplest build:` one line — what is reused, what is left out.
- `Decision required: approve RFC / request changes`

Stop. Nothing is built before the owner's yes. On the yes, write `**RFC approved:** <date>` as the
first line under the RFC heading just approved (a part: `#### Part <x> · RFC`). A part with no open
decision inside the approved task RFC needs no new yes (`CLAUDE.md` §3) and gets the line too,
citing the task RFC's approval; a part with one asks. Before that, the part's screens are held to
the current `rfc-template.md`, which may have changed since the task RFC was approved: a motion row
the task RFC lacks for a change those screens' frames show is filled (§5), `rfc-reviewer` reads it
(check 9), and the part shows its `Motion:` line; a moment that moves what a built screen did not
move before is an open decision, so the part asks. A change request is answered with one line per
changed section, then the same four lines.

## 5. Build

Inside the approved RFC only, slice by slice in the order of its *Build steps*. Contracts and
shared types land first (Law 3). After that, the slices the RFC marks parallel — disjoint files —
may go to `general-purpose` agents on Opus at once, each with its slice, the RFC and the `CLAUDE.md` of
its package. They edit only their slice's files and run nothing — no `pnpm`, no test, no
formatter. A slice that holds a money, tenancy or permission rule is never parallel. Main reads
every diff they made, runs their tests on the test database, then `pnpm check` once. For each
slice Main builds:

1. Read the package's `CLAUDE.md` before its first edit (an edit from the shell loads nothing).
2. Tests first: each AC's test before its code (`.claude/rules/testing.md`). A money, tenancy or
   permission test, and a check you add or change, is seen red once, as `.claude/rules/testing.md`
   says; note each for the PR body.
   An `apps/api/tests` file runs with the test-database prefix: `pnpm db:migrate && pnpm exec vitest run <file>`.
   A component spec runs with `pnpm --filter @heliogrid/e2e test:ct <spec>`. A `tests/e2e/web` spec
   runs as step 8 item 4 runs it — the test-database prefix, after `pnpm turbo build`, with nothing
   listening on 3002 or 8084 — and its red is seen there.
3. The smallest code that meets the line. Reuse what step 2 found.
4. `pnpm check` after each slice, and again after every later edit — a review fix, a QA fix, a
   word changed — so the gate meets no lint, catalog or coverage failure the fast check could have
   shown. Biome on the one file (`pnpm exec biome check --error-on-warnings <file>`) right after an edit catches a
   complexity or role-literal error before the slice ends.
5. One step gets two attempts. After both fail, stop with the evidence and at most two ways forward.

A new route, table, contract, package, affected package or behaviour voids the approval: update the RFC, show what
changed, and wait for a yes again. One asked for after QA is offered as its own PR first: added here,
it costs another round of review, QA and the gate. A file outside the RFC's file table is added to it with its
reason as it lands.

When the build is done, one tidy pass over the whole diff: reuse, names, dead code, files over 300
lines, comments that explain code instead of a constraint. Then delete each `deferred.md` row the
RFC lists as `**Deleted:**`, and give a `starts` row that stays its new `reopens when` — the gate's
invariant `rfc-proofs-hold` holds the list.

## 6. Code review

Give `code-reviewer` the RFC, the changed-file list — `git diff --name-only origin/main` and the new
files of `git ls-files -o --exclude-standard` — and `git diff origin/main`. Fix every confirmed
Critical, High and Medium finding. A Low finding is fixed when it sits in a file the diff already
changes, else listed in the PR body. Continue the same reviewer with only the fixed files; it reads
at most twice more. A finding still open after that stops for the owner.

## 7. QA, in parallel

Pick the surfaces from what changed, never more:

| surface | runs when |
|---|---|
| `qa-api` | `apps/api`, `apps/worker`, `packages/contracts`, `packages/db`, `packages/env`, `infra/postgres`, or a `packages/domain` file the api uses, changed |
| `qa-web` | `apps/web`, or a `packages/ui`, `theme`, `forms`, `i18n`, `data` or `domain` file a web screen draws, changed — or an api route a built web screen calls changed, or the screen is the twin of a changed phone screen (then one live row on that screen) |
| `qa-ios` | `apps/mobile`, or a shared file a phone screen draws, changed — or an api route a built phone screen calls changed, or the screen is the twin of a changed web screen (then one live row on that screen) |
| `qa-android` | whenever `qa-ios` runs — the same phone rows on the emulator, started in the same message as the other surfaces — and also when `apps/mobile/android/**`, a `.android.*` file, a native module or the app config changed. CI's `android` lane still drives each screen's flow under `tests/e2e/mobile/`; a new phone screen adds one. |

No surface changed (a pure domain or docs task): no server starts and no phone boots; the unit
tests, the review and the gate are the proof.

**Prepare,** in this order, so no phone idles before its rows. Only once step 6's reviewer has
returned clean and its fixes are in — never while it reads: a server or a phone started then idles
through the review and its fixes.

1. **The database.** QA runs on `heliogrid_test`, never on the owner's `heliogrid_dev`
   (`infra/README.md`). `pnpm infra:up` when the stack is down. When `.env.local` names
   `heliogrid_dev`, switch both database lines (`sed -i '' 's/heliogrid_dev/heliogrid_test/' .env.local`)
   and switch them back at step 8's clean-up. Migrate it before the api starts (the test-database
   prefix, then `pnpm db:migrate`), then run `pnpm --filter @heliogrid/api pack:publish`, which
   changes nothing when the pack is there. Then seed the QA companies of *Run*; the seed adds what
   is missing and puts back roles a QA row changed. It needs port 8084 free (an api from step 1 is
   stopped by its preview id now and starts again at item 2) and the worker up (the `worker` launch
   configuration, after the `.env.local` switch above): `pnpm turbo build --filter=@heliogrid/api`,
   then `<the test-database prefix> pnpm --filter @heliogrid/e2e test:web --project qa-seed`.
2. **The api,** through `.claude/launch.json` with `preview_start`; reuse a healthy HelioGrid one. A
   running api restarts only when this task switched the database, added a migration or changed api
   code it does not hot-reload.
3. **The data** each row needs beyond the QA companies, through the api, before any phone boots.
   A row that deactivates a person invites one of its own first: a QA company's people are kept,
   and the api cannot switch a person back on.
4. **Together, in one message:** the other servers the rows need (web, Metro), and the phones the
   rows need, booted in the background (a phone already running is used as it is) — the simulator that holds the newest `com.heliogrid.app`,
   and the emulator with quick boot (`emulator -avd Pixel_8_API_36 -cores 4 -memory 4096`, never
   `-no-snapshot-save`, which makes the next boot a cold one). While they come up, write the
   agents' prompts and the frame map. Rebuild native code only when native files changed or the
   app is missing.
5. **Cold-start each app** once its phone has booted and Metro serves (a new `BUNDLE` line in
   `.qa/metro.log`; Fast Refresh can drop silently), then start the agents in the next message.

**Run.** Start every QA agent in one message. Each gets what its own file lists under "Your prompt
gives you", the RFC's frame map and the known differences included. An agent that returns `NEEDS MAIN: <action>`
(kill, restart or open the app by a link) gets that action done by you and is continued. Each
agent signs in as its surface's QA company (`tests/e2e/support/qa-accounts.ts` holds who is in it);
a second owner's act during a row is yours to make, through the api, signed in as that person. A
QA company keeps what every earlier task's rows made, so a row that needs an empty list or counts
rows uses a new company. A row that must walk setup as a new company, or join as a person with no
account, takes a fresh number of its own, one per agent, so no two agents share a one-time step and
all start together; its code is the newest `Message for <number> via` line in `.qa/api.log`, and
it never joins `DEV_OTP_PHONES`. A row that needs the api
stopped runs last, after every agent has returned: stop the api once, continue each agent that has
such rows, start the api once.

A row that names a frame is a pass only with its board compare: a report that skipped it, or names a movement or overlap it did not judge, is sent back to the same agent, never read as a pass.

**Fix.** Fix only evidenced failures. Continue the same `code-reviewer` on the fixed files — one read
per fix; a finding still open after it stops for the owner — then continue the same QA agent with only the rows the fix touched. A row gets one retry after a fix; a
second failure stops for the owner. A row an agent reports `PASS (flake)` gets a `deferred.md` row. `git status --porcelain` is the same before the agents start and after they
return; any file an agent changed stops the task.

## 8. Proof, clean up, gate

1. **Proof.** Continue `code-reviewer` for its proof pass with the RFC's Proof table, every QA
   report, the output of Main's own test runs and the planted red lines. The stack stays up for it,
   so a row it finds unproven runs at once. An AC that is not `PASS` or `pending CI` stops here. An
   AC added after this pass gets its own proof pass before the gate runs again. A row proven by a
   `tests/e2e/web` spec, and its planted red, are judged after item 4, by continuing the same reviewer
   with that run's output.
2. **Clean up,** once the proof pass holds — before the gate and before the commit is shown: the
   gate needs only the local stack, no server and no phone, and nothing may idle through it and the
   owner's answer. Switch `.env.local` back if step 7 switched it; an api running at step 1 is
   stopped now and started again after item 4, so it reads `heliogrid_dev` again. Stop every server this task started — web, api, Metro,
   worker — every phone it booted or booted again (`xcrun simctl shutdown <udid>`,
   `adb -s <serial> emu kill`) and every browser tab it opened. Leave alone what was running at
   step 1, except an api (above) and a web dev server: `next dev` breaks while the build runs, so one
   running then is stopped by its preview id and started again after item 4 (after
   `rm -rf apps/web/.next`), and
   one the owner started outside the preview tool is the owner's to stop — ask. Never quit Docker.
   Delete the screenshots and temporary files this task made in `.qa/` and the scratchpad; keep the
   logs. A watcher that survives (`tsx … watch`) is named to the owner with its pid. A fault the owner reports before the
   commit yes, or a gate fix that touches a screen, starts again only what it needs (step 7, on the
   test database; the phones keep their sign-ins) and is cleaned up again before the commit is
   shown.
3. Run the gate once, on the test database, without touching `.env.local`; `pnpm infra:up` when the
   stack is down:

   ```bash
   <the test-database prefix> pnpm db:migrate && pnpm check:all
   ```

   Read the failures, not the exit code; a `SKIP ` line or the warning `apps/api/tests are skipped`
   fails the gate. A fix goes back through `pnpm check`, the reviewer on
   the fixed files and the QA rows it touched, then one more gate run. A second failure that is
   not environmental stops for the owner — except a failure the check repairs itself (stale
   catalogs or OpenAPI, whose check has just rewritten them): read the rewritten files, then run
   once more without asking. A stale `dist/` after a delete: `CLAUDE.md` §3.
4. Once the gate passes, run every `tests/e2e/web` spec the task added or changed — the gate has
   built the api and web, and the clean-up freed ports 3002 and 8084, so Playwright starts both on the
   test database itself and stops them after:

   ```bash
   <the test-database prefix> pnpm --filter @heliogrid/e2e test:web <spec files>
   ```

   A failure goes back as a gate failure does; a task that changed no web spec has no run here.

   Then start again what item 2 stopped from step 1, and run `pnpm infra:down` only when the stack
   was down at step 1.

## 9. Commit and PR

One commit holds the change and the task's `Status:` turned `shipped` (a part: its Parts row; the
task turns `shipped` with its last part). The same commit moves the task's RFC out of the task file
into the PR body — a part's RFC goes; the task RFC stays until the last part ships. The rows it
joined left `deferred.md` at the end of the build (step 5).

- Commit message: `feat: <id> — <what the user gets>`, then a short body.
- Show the owner the changed files and the exact message, then stop. Commit only on the owner's
  yes to that list and message (`CLAUDE.md` §4); every later commit — a CI fix, a review fix, a
  merge of `origin/main` — is shown and waits the same way. Ask once for what follows from one
  yes: when the push needs the merge of `origin/main` below and its squash check (the empty
  `git diff`) already holds before the ask, show the change commit, the merge commit's message, the
  push and the PR together, and one yes covers all four; a merge that conflicts beyond keeping this
  branch's side is shown and asked on its own.
- A branch cut from another unmerged branch (an earlier part's) whose PR has since merged opens with
  conflicts, so before the push: `git merge --no-commit origin/main` (never a rebase). When `main`'s squash
  commit holds exactly that branch's last commit (`git diff <its last commit> <the squash commit>`
  is empty), keep this branch's side of every conflict: the merged tree equals the one the gate
  passed (`git write-tree` equals `HEAD^{tree}`), so the gate stands. Otherwise resolve, regenerate
  `pnpm check:catalogs` and `pnpm check:openapi` outputs, rerun the gate, and show the merge commit
  on its own for the owner's yes.
- `git push -u origin feat/<id>`, then `gh pr create --base main --draft`, the body filled in as
  `.github/pull_request_template.md` lays it out. Bind it to the session (the `ccd_pr` tools).
- Mark it ready (`gh pr ready`) only when every job of the head's latest run passed — `success`, or
  `skipped` while `changes` passed — and every lane a `ci` proof row names ran and passed. When the
  `android` job ran and `PHONE_E2E` is not `off`, its step `Phone flows (tests/e2e/mobile) on the
  emulator` must have run too; the PR body says which case applied. The owner merges.
- A failed CI job goes to `ci-investigator`; fix, show the commit, commit on the owner's yes, push.
- Review comments on the PR: read them, fix, continue `code-reviewer` on the fixed files, rerun
  the QA rows they touched, show the commit, commit on the owner's yes, push.
- A PR that conflicts after an earlier PR merged: `git merge origin/main` into the branch (never a
  rebase, never a force-push), resolved and gated as the merge before the push is; show the
  commit, commit on the owner's yes, push.

Close with one line: the next task starts in a new session with `/task`.
