# Local QA orchestration

Read this file before `/task` step 5. CI end-to-end flows stay in CI; local QA drives the changed
behavior like a person on the running API and changed surfaces.

No web flow of the `test:web` suite runs locally, not even a spec this task adds or changes. CI's
`e2e-web` lane runs the whole suite and is each spec's one proof; a web flow is the one check
exempt from the planted-red rule, by the owner's ruling. Edge cases are proven by live QA on the
running app, never by a local flow run. Every web journey row belongs to `qa-web`; a `ci` owner on
a web journey row is a finding. The component suite (`test:ct`, port `3100`) is a local proof like
a unit test and keeps the planted-red rule.

## Prepare one stack

A part whose proof matrix names no web, phone or api surface starts no server and boots no phone: its proofs are
unit tests, the component suite, whose spec saves each drawn frame's picture, a `qa-web` row that
compares those files with the board pictures and drives no browser, the reviewer and the
Evaluator's gate. The RFC's `##### Readiness and dependencies` says `light cycle` and why. A light
cycle whose proofs include `apps/api/tests` still points both `.env.local` database URLs at
`heliogrid_test` and migrates it in one command (`packages/db/CLAUDE.md`) before the gate, with
the local Postgres up (`pnpm infra:up`), so those tests are collected (`.claude/rules/testing.md`);
the tests bring their own fixtures, so no market pack is published. It restores the URLs at
teardown.

Start or reuse the runtime already recorded by Main, and only the surfaces the proof rows name:
no web server for a part with no web row, no phone for a part with no row on it. A phone is booted
for the rows that need it and shut at teardown; its install and sign-in survive, so no reinstall
and no new sign-in is owed unless native files changed (`references/runtime.md`). Point both
`.env.local` database URLs at `heliogrid_test`, then export that file and run `pnpm db:migrate` in one
command (`packages/db/CLAUDE.md`) and read the database it prints, and publish the market
pack only when the test database has none. Restart only the api and verify both database names.
Only a task-owned api is restarted or stopped: an api recorded `pre_existing` that this switch or
the api-down window would restart is an owner blocker (`references/runtime.md`, Reuse and start):
name what the restart needs and end the step.
The test database uses the existing Postgres container; never create another.

Standing accounts are reused: `…901` web, `…902` iOS, `…903` Android, and `…904` plus `…905`
for `qa-api` tenant-isolation rows. All are in `DEV_OTP_PHONES`. Create a missing standing company
once through the app, never per run. API tests use their own fixtures, not these accounts.

## Packets and mutation guard

Give each helper exactly what its own file's "Your prompt gives you" lists, and nothing it does not
list; the session's `tool-results` folder is in the scratchpad path. Main decides three of those
things:

- A screen row's **ruled differences** are every open `docs/tasks/deferred.md` row that names its
  screen or one of its frames, and every open `docs/tasks/UI.md` row of a component those frames
  draw.
- A row run in Hindi or Marathi has its standing account's language set before it: in the app
  where a built screen sets it, otherwise by Main through `PATCH /users/me` signed in as that
  account the way `qa-api` signs in (`.claude/agents/qa-api.md`) — setup, never proof — and set
  back after it. The row says which.
- The `android · Hindi` row is the one `docs/tasks/README.md` names under its proof owners.

After QA returns, Main composes each board frame beside the web's and iOS's screenshot of it by
file name with a script, one image per frame, never reading a picture, and the commit card
attaches them.

The task guard (`.claude/hooks/guard.mjs`) watches every helper's Bash command on a task branch:
it refuses git, `gh`, install and in-place edit commands, and records any repository file another
command changed — outside the helpers' `.qa/` and the gate's own rewrites — which stops the commit
until the owner has seen it. Main changes no file while a helper's command runs, or the record
names Main's change as the helper's. Database and device writes stay held by each helper's contract.

## Review first, then QA

Start `reviewer` alone on the finished diff. Fix each evidenced `blocker` and `should-fix`; a
`note` is fixed only when it sits in a file the diff already changes, and is otherwise listed in
the PR body. Continue the same reviewer with the fixes; every continuation, after a review fix, a QA fix or
a gate fix alike, counts, and it reads at most twice more. The cap reached with a finding still
open stops for the owner, and so does a fix the cap leaves unread. Only then start the helpers for changed surfaces
together: `qa-web`, `qa-ios`, `qa-android`, and `qa-api` when the proof matrix has live API rows.
Each uses its own account on the one stack. Omit an unchanged surface. A row touching global state
such as the platform catalog or a market pack runs after surface helpers return, and the RFC names
that serialization. Main changes no checked file until every surface helper has returned.

Main performs readiness checks only — health, route/app launch, database routing, accounts, a
row's language setup and log paths — and never duplicates a helper's journey.

Nobody waits turn by turn. A wait — a boot, a page, a screen, a log line — is one command that
polls with its own timeout and returns when the condition holds, never a `sleep` in its own turn.
Browser steps a helper can foresee go into one `browser_batch`.

A task has one api-down window. Each helper's packet holds its `api stopped` rows as a second group
after its api-up rows, with the order written in. When every helper has returned from its api-up
rows, Main stops the api once, continues every helper with its api-down group together, then starts
the api once and verifies `/health/ready`. A rerun after a fix repeats only the group its touched
rows belong to, and an api-down rerun opens the window once more for every helper that needs it.

Fix only evidenced failures. After each fix round, review-found or QA-found, continue the same
reviewer with every changed file since its report. A QA row runs once and gets one evidenced
retry. Its third failure stops.
Any checked-file change after a pass reruns every row whose surface, route or file the change
touched, with the same continued helper. Start that rerun only after the continued reviewer
returns clean on the fixes, so one rerun covers them all: a review finding fixed after a rerun
costs another.

## A helper lost to a restart

A helper whose id no longer answers after an app restart is started anew with every report it and
Main produced since the task began. Its earlier runs still count toward its limits — a QA row's one
retry, the Evaluator's two gate runs — and the Runtime record says `lost to a restart` for it.

## Evaluator gate

Before the Evaluator starts, Main runs the freshness check of each register the diff touched, so
the first gate run is not spent on a known rule: `pnpm check:catalogs` after a change to copy a
catalog sweeps, `pnpm check:openapi` after a contract change, and
`pnpm --filter @heliogrid/invariants test` after a change to a `docs/tasks/` register such as
`deferred.md`.

Start `evaluator` only after QA returns, review fixes land, and touched rows pass again. Stop a web
dev server the task started before the gate. If a checked-file change after that run requires QA,
restart only the task-owned runtimes those rows need, then stop the web dev server again before the
final run. A pre-existing server is an owner blocker (`references/runtime.md`, Reuse and start):
name what the gate would affect and end the step.

The full-gate failure policy is the Evaluator's Rules (`.claude/agents/evaluator.md`). A check's proof is its complete output
read to the end, never one grepped line.
