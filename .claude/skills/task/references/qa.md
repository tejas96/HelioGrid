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

A part whose proof matrix names no web, phone or api surface prepares no stack: its proofs are
unit tests, the component suite on `3100`, `qa-web` on the component page, the reviewer and the
Evaluator's gate. The RFC's `##### Readiness and dependencies` says `light cycle` and why.

Start or reuse the runtime already recorded by Main. Point both `.env.local` database URLs at
`heliogrid_test`, export that file into the shell, run `pnpm db:migrate`, and publish the market
pack only when the test database has none. Restart only the api and verify both database names.
The test database uses the existing Postgres container; never create another.

Standing accounts are reused: `…901` web, `…902` iOS, `…903` Android, and `…904` plus `…905`
for `qa-api` tenant-isolation rows. All are in `DEV_OTP_PHONES`. Create a missing standing company
once through the app, never per run. API tests use their own fixtures, not these accounts.

## Packets and mutation guard

Give each QA helper only its proof rows, the AC lines they prove, runtime identity, log paths and
its URL/device/account. A screen row carries the board pictures of the frames it covers and, as
ruled differences, every open `docs/tasks/deferred.md` row that names its screen or one of those
frames and every open `docs/tasks/UI.md` row of a component those frames draw; after QA returns,
Main sets each board frame beside the web's and iOS's screenshot of it, one image per frame, and
the commit card shows them. `qa-android` rows name no board frame. `qa-api` receives
`http://localhost:8084`, both API numbers and the api log. The reviewer receives the approved RFC,
changed-file list, diff and named protection rows. The Evaluator receives the RFC proof section
verbatim, every report, Main's proof and commands.

Before helpers start, hash the tracked status and diff, untracked-file hashes, and the two database
URL lines. Compare after they return. A changed hash is a blocker named by file. Helpers have Bash,
so repository writes are detected, not prevented; database and device writes are governed by each
helper contract and are not hash-detected.

## Review first, then QA

Start `reviewer` alone on the finished diff. Fix each evidenced finding and continue the same
reviewer with the fixes until it returns clean. Only then start the helpers for changed surfaces
together: `qa-web`, `qa-ios`, `qa-android`, and `qa-api` when the proof matrix has live API rows.
Each uses its own account on the one stack. Omit an unchanged surface. A row touching global state
such as the platform catalog or a market pack runs after surface helpers return, and the RFC names
that serialization. Main changes no checked file until every surface helper has returned.

Main performs readiness checks only — health, route/app launch, database routing, accounts and log
paths — and never duplicates a helper's journey.

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
retry, the Evaluator's two gate runs — and the Runtime record says `lost to a restart` beside its
tokens.

## Evaluator gate

Before the Evaluator starts, Main runs the freshness check of each register the diff touched, so
the first gate run is not spent on a known rule: `pnpm check:catalogs` after a change to copy a
catalog sweeps, `pnpm check:openapi` after a contract change, and
`pnpm --filter @heliogrid/invariants test` after a change to a `docs/tasks/` register such as
`deferred.md`.

Start `evaluator` only after QA returns, review fixes land, and touched rows pass again. Stop a web
dev server the task started before the gate. If a checked-file change after that run requires QA,
restart only the task-owned runtimes those rows need, then stop the web dev server again before the
final run. A pre-existing server is an owner prerequisite: state what the gate would affect and
wait before touching it.

Return to the step 5 spine for the full-gate failure policy. A check's proof is its complete output
read to the end, never one grepped line.
