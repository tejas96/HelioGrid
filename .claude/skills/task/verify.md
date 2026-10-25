# /task · the verify and ship phase — steps 6 to 9

Read `SKILL.md` first; it holds the rules every phase keeps. This session starts on `feat/<id>`
with a `**Build note:**` under the RFC, and ends when the PR is open. Read the RFC and its Build
note by their line range, once.

## 6. Code review

Give `code-reviewer` the RFC pasted whole (its Build note included), the changed-file list —
`git diff --name-only origin/main` and the new files of `git ls-files -o --exclude-standard` — and,
for a screen task, every locked board path of each screen it builds. It reads the diff itself. Fix
every confirmed Critical, High and Medium finding. A Low finding is fixed when it sits in a file the
diff already changes, else listed in the PR body. `pnpm check` after the fixes. The reviewer is
continued ONCE, at the end of step 7, with every file fixed since its report (a review fix or a QA
fix) and the findings they answer; a finding still open after that stops for the owner.

## 7. QA

Pick the surfaces from what changed, never more:

| surface | runs when |
|---|---|
| `qa-api` | `apps/api`, `apps/worker`, `packages/contracts`, `packages/db`, `packages/env`, `infra/postgres`, or a `packages/domain` file the api uses, changed |
| `qa-web` | `apps/web`, or a `packages/ui`, `theme`, `forms`, `i18n`, `data` or `domain` file a web screen draws, changed — or an api route a built web screen calls changed, or the screen is the twin of a changed phone screen (then one live row on that screen) |
| `qa-ios` | `apps/mobile`, or a shared file a phone screen draws, changed — or an api route a built phone screen calls changed, or the screen is the twin of a changed web screen (then one live row on that screen) |
| `qa-android` | a row the rule below gives Android; and always when `apps/mobile/android/**`, a `.android.*` file, a native module or the app config changed. CI's `android` lane still drives each screen's flow under `tests/e2e/mobile/`; a new phone screen adds one. |

**Which phone runs a row.** One phone per row. A phone row runs on iOS, unless it covers the
keyboard, Back, a deep link, a restart, a system setting (text size, reduced motion), a permission,
native code (the camera, files, notifications, a native module, the app config) or a `.android.*`
file: those run on Android as well, and a row for a `.ios.*` file runs on iOS alone. The Hindi
layout row runs on iOS and the Marathi one on Android when both phones run, else both on the one
phone. The same code still acts differently on each phone, so a row in doubt runs on both. The
rows are few: the ones that prove each AC, plus the checks every agent makes on every screen it
reaches (`.claude/agents/qa-*.md`).

The api refused is proven by `packages/data`'s refused-connection test (`packages/data/CLAUDE.md`,
*Done means*) and, on the web, by a `tests/e2e/web` spec where a PRD row asks (`tests/e2e/CLAUDE.md`).
Only a PRD row that names what a phone shows with the api down keeps a live row, marked
`api stopped` in the RFC: its agent runs it last and returns it `BLOCKED: api stopped`; once every
agent has returned, Main stops the api once, continues each agent that has such a row, then starts
the api again.

No surface changed (a pure domain or docs task): no server starts and no phone boots; the unit
tests, the review and the gate are the proof.

**Prepare,** in this order, so no phone idles before its rows. Only once step 6's reviewer has
returned and its fixes are in. First write down what is running — listeners on 3002, 8084, 8081 and
3100, booted phones (`xcrun simctl list devices booted`, `adb devices`), `docker ps` — so step 8
stops only what this task started. A phone booted then is the owner's — another product may use
it — so it is named here and never shut down by this task; if it stops and this task boots it
again, it is this task's from then on.

1. **The database.** QA runs on `heliogrid_test`, never on the owner's `heliogrid_dev`
   (`infra/README.md`). `pnpm infra:up` when the stack is down. When `.env.local` names
   `heliogrid_dev`, switch both database lines (`sed -i '' 's/heliogrid_dev/heliogrid_test/' .env.local`)
   and switch them back at step 8's clean-up. Migrate it before the api starts (the test-database
   prefix, then `pnpm db:migrate`), then run `pnpm --filter @heliogrid/api pack:publish`, which
   changes nothing when the pack is there. Then seed the QA companies of *Run*; the seed adds what
   is missing and puts back roles a QA row changed. It needs port 8084 free (an api running at the
   start of this session is stopped by its preview id now and starts again at item 2) and the worker
   up (the `worker` launch configuration, after the `.env.local` switch above):
   `pnpm turbo build --filter=@heliogrid/api > .qa/build-api.log 2>&1`, then
   `<the test-database prefix> pnpm --filter @heliogrid/e2e test:web --project qa-seed > .qa/seed.log 2>&1`.
2. **The api,** through `.claude/launch.json` with `preview_start`; reuse a healthy HelioGrid one. A
   running api restarts only when this task switched the database, added a migration or changed api
   code it does not hot-reload.
3. **The data** each row needs beyond the QA companies, through the api, before any phone boots.
   A row that deactivates a person invites one of its own first: a QA company's people are kept,
   and the api cannot switch a person back on.
4. **Together, in one message:** the other servers the rows need (web, Metro) and the phones the
   rows need, booted in the background — a phone already running is used as it is; the simulator
   that holds the newest `com.heliogrid.app`; the emulator through the `android-emulator` launch
   configuration, which boots it with its cores and memory, switches Gboard's stylus handwriting
   off for the run and back at its stop, and reverses port 9000 for uploads. While they come up,
   write the agents' prompts. Rebuild native code only when native files changed or the app is
   missing.
5. **Cold-start each app** once its phone has booted and Metro serves (a new `BUNDLE` line in
   `.qa/metro.log`; Fast Refresh can drop silently). Then start the agents in the next message.

**Run.** Start every QA agent in one message. Each gets what its own file lists under "Your prompt
gives you". Each agent signs in as its surface's QA company (`tests/e2e/support/qa-accounts.ts`
holds who is in it), signing out first when the app holds anyone else — a phone keeps an earlier
task's sign-in; a second owner's act during a row is yours to make, through the api, signed in as
that person. A QA company keeps what every earlier task's rows made, so a row that needs an empty
list or counts rows uses a new company. A row that must walk setup as a new company, or join as a
person with no account, takes a fresh number of its own, one per agent, so no two agents share a
one-time step and all start together; its code is the newest `Message for <number> via` line in
`.qa/api.log`, and it never joins `DEV_OTP_PHONES`. An agent returns once; a `BLOCKED` row names
what Main must do (a restart, Metro, a build, an install, a setting): do it, then continue that
agent once with those rows.

**Fix.** Fix only evidenced failures. `pnpm check` after each fix. Before a re-run, build each
workspace package the fix changed that ships from `dist/` with
`pnpm --filter <package> build > .qa/build-<package>.log 2>&1` — both apps read `data`, `domain`,
`i18n` and `contracts` from it (their `package.json` `exports`; `apps/web/CLAUDE.md`), and never
`turbo build` while `next dev` runs — then have `qa-web` reload its page, and cold-start, as Prepare
item 5 does, each phone app that has rows to re-run when the fix changed a file its bundle holds (a
native file first needs Prepare item 4's rebuild). Then continue the same QA agent with only the
rows the fix touched. A row gets one retry after a fix; a second failure stops for the owner. A
`PASS (flake)` on a row this diff touches is a `FAIL`, unless you match its symptom to an open
`harness` row in `deferred.md` (D278's short swipe): that row is then the proof beside it. A flake on
a row outside the diff — on a screen or route the diff does not change, such as a twin-screen row —
gets a `deferred.md` row. When every fix is in, continue `code-reviewer` once (step 6).

## 8. Proof, clean up, gate

1. **Proof.** Write the PR body's `Acceptance criteria → proof` table yourself, from the Proof
   table, the QA reports and the test logs in `.qa/`: for each AC, its owner and its evidence — a
   test by file and name in a passing log, a QA row reported `PASS`, a planted red seen failing by
   name; a `PASS (flake)` is proof only beside the `deferred.md` row step 7 names. A row owned by
   `ci` is `pending CI`. An AC with no evidence, or with failing evidence, stops here: the stack is
   still up, so its row runs at once. An AC added after this table gets its own line before the
   gate runs. A row proven by a `tests/e2e/web` spec, and its planted red, are filled in after
   item 4.
2. **Clean up,** once every AC has its evidence — before the gate and before the commit is shown:
   the gate needs only the local stack, no server and no phone, and nothing may idle through it and
   the owner's answer. Switch `.env.local` back if step 7 switched it; an api running at the start
   of this session is stopped now and started again after item 4, so it reads `heliogrid_dev`
   again. Stop every server this task started — web, api, Metro, worker — every phone it booted or
   booted again (`xcrun simctl shutdown <udid>`; the emulator by its preview id, which restores
   Gboard's setting) and every browser tab it opened. Leave alone what was running at Prepare,
   except an api (above) and a web dev server: `next dev` breaks while the build runs, so one
   running then is stopped by its preview id and started again after item 4 (after
   `rm -rf apps/web/.next`), and one the owner started outside the preview tool is the owner's to
   stop — ask. Never quit Docker. Delete the trees and temporary files this task wrote under
   `.qa/` and the scratchpad; keep the logs. A watcher that survives (`tsx … watch`) is named to the
   owner with its pid. A fault the owner reports before the commit yes, or a gate fix that touches
   a screen, starts again only what it needs (step 7, on the test database; the phones keep their
   sign-ins) and is cleaned up again before the commit is shown.
3. Run the gate once, on the test database, without touching `.env.local`; `pnpm infra:up` when the
   stack is down:

   ```bash
   <the test-database prefix> pnpm db:migrate && pnpm check:all > .qa/gate.log 2>&1; grep -nE 'error|fail|FAIL|ERR|SKIP' .qa/gate.log | head -40
   ```

   Read the failures, not the exit code; a `SKIP ` line or the warning `apps/api/tests are skipped`
   fails the gate. A fix goes back through `pnpm check` and the QA rows it touched, then one more
   gate run. A second failure that is not environmental stops for the owner — except a failure the
   check repairs itself (stale catalogs or OpenAPI, whose check has just rewritten them): read the
   rewritten files, then run once more without asking. A stale `dist/` after a delete: `CLAUDE.md` §3.
4. Once the gate passes, run every `tests/e2e/web` spec the task added or changed — the gate has
   built the api and web, and the clean-up freed ports 3002 and 8084, so Playwright starts both on the
   test database itself and stops them after:

   ```bash
   <the test-database prefix> pnpm --filter @heliogrid/e2e test:web <spec files> > .qa/e2e-web.log 2>&1; grep -nE 'passed|failed|✘|Error' .qa/e2e-web.log | head -40
   ```

   Playwright reads each path as a pattern, so a route's brackets (`more-[row].spec.ts`) match one
   letter and that spec silently does not run: escape them (`'web/more-\[row\]'`), and check the
   log names every spec. A failure goes back as a gate failure does; a task that changed no web
   spec has no run here.

   Then start again what item 2 stopped from Prepare, and run `pnpm infra:down` only when the stack
   was down at Prepare.

## 9. Commit and PR

One commit holds the change and the task's `Status:` turned `shipped` (a part: its Parts row; the
task turns `shipped` with its last part). The same commit moves the task's RFC, Build note included,
out of the task file into the PR body — a part's RFC goes; the task RFC stays until the last part
ships. The rows it joined left `deferred.md` at the end of the build (step 5).

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
  `.github/pull_request_template.md` lays it out. Its `## Cost` line comes from the meter:
  `python3 -I ~/.claude/projects/-Volumes-works-space-heliogrid/harness-meter.py <id>` sums every
  session of the task. Bind the PR to the session (the `ccd_pr` tools).
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
