# Local QA orchestration

Read this file before `/task` step 5. CI end-to-end flows stay in CI; local QA drives the changed
behavior like a person on the running API and changed surfaces.

## Prepare one stack

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
Main sets each board frame beside every surface's screenshot of it, one image per frame, and the
commit card shows them. `qa-api` receives `http://localhost:8084`, both API
numbers and the api log. The reviewer receives the approved RFC, changed-file list, diff and named
protection rows. The Evaluator receives the RFC proof section verbatim, every report, Main's proof
and commands.

Before helpers start, hash the tracked status and diff, untracked-file hashes, and the two database
URL lines. Compare after they return. A changed hash is a blocker named by file. Helpers have Bash,
so repository writes are detected, not prevented; database and device writes are governed by each
helper contract and are not hash-detected.

## Parallel run

Start the helpers for changed surfaces together: `qa-web`, `qa-ios`, `qa-android`, and `qa-api`
when the proof matrix has live API rows. Each uses its own account on the one stack. Omit an
unchanged surface. A row touching global state such as the platform catalog or a market pack runs
after surface helpers return, and the RFC names that serialization. Start `reviewer` beside QA on
the finished diff. Main changes no checked file until every surface helper has returned.

Main performs readiness checks only — health, route/app launch, database routing, accounts and log
paths — and never duplicates a helper's journey.

Fix only evidenced failures. Continue the same reviewer with every changed file since its report;
use a third review pass only after a money, tenancy or permission fix, or a checked-file change
after a full-gate run. A QA row runs once and gets one evidenced retry. Its third failure stops.
Any checked-file change after a pass reruns every row whose surface, route or file the change
touched, with the same continued helper. Start that rerun only after the continued reviewer
returns clean on the fixes, so one rerun covers them all: a review finding fixed after a rerun
costs another.

## Evaluator gate

Start `evaluator` only after QA returns, review fixes land, and touched rows pass again. Stop a web
dev server the task started before the gate. If a checked-file change after that run requires QA,
restart only the task-owned runtimes those rows need, then stop the web dev server again before the
final run. A pre-existing server is an owner prerequisite: state what the gate would affect and
wait before touching it.

Return to the step 5 spine for the full-gate failure policy. A check's proof is its complete output
read to the end, never one grepped line.
