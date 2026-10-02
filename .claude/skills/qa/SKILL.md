---
name: qa
description: Run a task's QA plan after the build — the regression suites first, then one QA agent per surface the change reaches, in parallel — merge one QA report, fix every in-scope issue at once, and re-check only what failed. Use after `pnpm check:all` passes, before /ship.
---

# /qa — run the plan, report, fix, re-check

The QA plan was written at `/start`, before the code, so it tests what should happen rather than what
was built; run it as written after the refresh in step 1. No probes, no rounds. Everything a run writes lives in
the git-ignored workspace `.qa/<T-id>/` — `report.md`, each agent's results, `evidence/` — and the
report's final copy goes into the PR body at `/ship`.

## 1. Surfaces

Take the plan's `Surfaces:` line and check it against what the diff reaches:
`pnpm turbo ls --filter='...[origin/main]'` — `@heliogrid/web` is web, `@heliogrid/mobile` is iOS and
Android, `@heliogrid/api` is api, `@heliogrid/worker` is the worker. A surface the plan does not
cover is a scope change: stop and ask the owner. No surface reached means no agents; the suites in
step 3 are the QA.

**Refresh the plan — one pass, before anything runs:**

- Fill each expected text with the exact words from its `packages/i18n` file, now that they exist —
  every `new copy — filled at /qa step 1` among them.
- **Apply the `when` lines again**, to the whole built diff (`git diff --stat origin/main`): a
  standard check whose `when` the diff now meets joins the plan with its `why:`; a check on the
  `Not in:` line stays out only while its reason still holds.
- **Add** a check for anything the build added that the plan does not cover — a new state, a new
  error message, a new route or screen — in the plan's own format, and list it in the report.
- Never remove or weaken a check. A check that no longer fits the code is a scope change: stop and
  ask the owner.

## 2. Prepare — the main session owns every server and device

1. Load `SendMessage` and `TaskStop` with `ToolSearch`; they are deferred tools.
2. Start the servers the surfaces need with `preview_start`: `api`, `web`, `mobile-metro`, `worker`.
   One instance of each serves every surface — the iOS simulator reaches the api at
   `localhost:8084`, the Android emulator at `10.0.2.2:8084`. Note each server id. The api writes
   its log to `.qa/api.log`.
3. Boot each device: the simulator (`xcrun simctl boot <udid>`, then the simulator tool's
   `attach`) and the Android emulator with its window. Open the app once on each, and the browser
   tab once, so every bundle is warm.
4. **Standing accounts — one per surface:** `QA web`, `QA ios`, `QA android`, `QA api`, each its
   own person and its own company, on the development numbers in `.env.local` (`DEV_OTP_PHONES`,
   the one fixed code `DEV_OTP_CODE`, no caps). `.qa/accounts.md` names each surface's number; the
   main session's curl session for each lives in `.qa/accounts/<surface>.jar`. No `accounts.md` →
   write it, giving each surface its own number from `DEV_OTP_PHONES` — the last four; fewer than
   five numbers there → stop and ask the owner to add them. Every run, for each surface the plan
   reaches:
   - **Alive?** `curl -i http://localhost:8084/tenants/me -b .qa/accounts/<surface>.jar -c
     .qa/accounts/<surface>.jar` answers 200 with `"companyName":"QA <surface>"`. A 401 → `POST
     /auth/refresh` with `{"foreground":true}` first (the token lives ten minutes); still 401 → sign
     in again with the fixed code (`POST /auth/otp/request`, then `POST /auth/otp/verify`); no
     company → `POST /tenants` `{"companyName":"QA <surface>", …}`. This remakes an account an
     `infra:reset` or a new machine lost.
   - **Baseline:** `PATCH /users/me` `{"interfaceLanguage":"en"}`; each phone at the normal text size
     and in light appearance (the commands in step 9).
   - **Language:** a check in Hindi or Marathi has its language set here by `PATCH /users/me` in the
     default phase, and the agent relaunches the app. A language change mid-flow, and a signed-out
     screen, use the app's own control.
   - **One device's session:** S6 ends only that device's session — the app's own sign-out, or a
     keychain reset on iOS. Never `POST /auth/sign-out-everywhere` on a standing account: it ends
     every session that person holds, the main session's jar included.
   - **Fresh account** — `QA <T-id> <surface>`, made by curl, removed by `/start` — only when the
     plan's Setup says why: sign-up, sign-in, onboarding or the session is under test; any seeded
     data; H11's first-time user; S2's empty list or one row; a count or a uniqueness; a first-run
     element; S9's other roles. A fresh `+91` number signs in with its code from the api log
     (`grep 'via sms'`), then `POST /tenants`. A standing company never gets a seeded row.
5. **Seed only through the module's own writer**, into that surface's fresh company — never SQL by
   hand, never a file added to the repo. A check over an empty list proves nothing. The shape:
   ```bash
   pnpm --filter @heliogrid/api exec tsx --env-file-if-exists=<repo>/.env.local -e "(async () => {
     const { <writer> } = await import('./src/modules/<module>/<module>.repository.ts');
     const { openPools } = await import('./tests/support/fixture.ts');
     const pools = openPools();
     await pools.admin.db.transaction((tx) => <writer>(tx, { /* one row */ }));
     await pools.close();
   })()"
   ```
   No writer exists → the check is `not run: no writer`, named in the report.
6. **Your own curl** — always `curl -i http://localhost:8084/<path> …`, the URL first and every flag
   after it, a jar under `.qa/`.
7. **Phases** — note `shasum .env.local` now; step 9 proves the file is back to it.

## 3. The regression suites — machine first

Run what the plan's `Regression` lines name, on the servers and devices just started:

- web specs for the changed routes: `pnpm --filter @heliogrid/e2e test:web <spec files>`
- component specs for changed `ui` parts: `pnpm --filter @heliogrid/e2e test:ct <spec files>`
- phone flows, ONE device after the other — two at once lose key presses:
  `bash tests/e2e/mobile/run.sh <udid>`, then `bash tests/e2e/mobile/run.sh <serial>`

A failure here is fixed before any agent starts. The phone suite clears the app and its keychain
(`tests/e2e/mobile/boot.yaml`), so after it the main session signs each phone in to its standing
account with the fixed code.

## 4. Dispatch — one agent per surface, all in ONE message, in the background, one phase at a time

The plan's Setup lists the phases; the default comes first. For each phase after it, the main session
sets the phase's values in `.env.local`, copies `.qa/api.log` to
`.qa/<T-id>/evidence/api-phase<n>.log` (a start empties the log), restarts the api once, and sends
each agent that phase's checks by `SendMessage`. No agent restarts the api.

`qa-api`, `qa-web`, `qa-mobile` (ios) and `qa-mobile` (android) — only the surfaces reached. Each
prompt holds: the plan's checks that name its surface for this phase, with their ids; its standing
account (number, fixed code, `QA <surface>`) or its fresh one; the server ids,
**only to read logs**; its device (udid or serial); its results file,
`.qa/<T-id>/<surface>.md`, with screenshots under `.qa/<T-id>/evidence/`; the path of the api log; and the common rules below, word for
word. A surface with more than about 15 checks gets them in batches of about 15, grouped by screen:
the first batch at dispatch, each next one by `SendMessage` to the SAME agent when it returns — one
agent run stops at its turn limit, and a check it never reached is lost. Then tell the owner: "QA is running — please do not click in the browser pane, the simulator
or the emulator."

### The common rules — paste these into every QA agent's prompt

1. Never edit source. Never start, restart or stop a server or a device. Never write to the
   database.
2. Use only the account you are given.
3. For each check: do the action → read the result as TEXT (the page tree, the view tree, the
   response or the database value) → compare it with the exact expected text → pass or fail.
4. A screenshot is evidence, never the verdict — except a Look check, where you measure.
5. A check fails when, during it, your account caused a console error, a failed request, or a line
   in the api log with `"statusCode":5xx` or `"level":50`/`60` — even when the screen looks right.
   Note the log's line count (`wc -l`) before the check and read only the new lines after it; a new
   error line you cannot tie to your account is written into the result as "unplaced".
6. A check you cannot do or cannot see is `not run`, with the reason. Never guess.
7. A workaround — a retry, a second sign-in, a step out of order — is a finding, not a pass.
8. Write each result to your results file the moment the check ends, one row:
   `| G1.1 | pass/fail/not run | expected "…" | observed "…" | evidence |`
9. Run only your checks, in the order that keeps state flowing.
10. When done, return your results file's path and the counts: pass, fail, not run.

## 5. Watch

Tell the owner where the run is, one line each:
- each step as it starts — `QA step 3 of 9 — phone suite on iPhone 16`;
- each agent as it returns — `qa-mobile ios: 12 pass · 0 fail · 1 not run`;
- while agents run, at each look: every results file's row count, with the time.

No file is edited while any agent runs — the dev servers reload under a running check. A results
file with no new row for 15 minutes is a stuck agent: `TaskStop` it; its unfinished checks are
`not run: agent stopped`.

## 6. Read

Read every results file in full. Read each pass's evidence for a workaround — a retry, a second
sign-in, a precondition the agent made for itself. Spot-check two passes against their evidence; a
spot-check that contradicts its row makes that surface's run untrusted, and it runs again.

## 7. The QA report — `.qa/<T-id>/report.md`

```
# QA report — T-M02-001 · Quick Add Lead
Suites: web 12/12 ✓ · components 4/4 ✓ · phone ios 3/3 ✓ android 3/3 ✓ · unit ✓
Run: 38 min · check:all green at a1b2c3d4e5f6 · api starts 3 (phases 2 + 1) · suite runs ios 1
android 1 · accounts made by tapping 0 · blocks 0 · re-runs 2 · agents 3

## Results
| check                          | web | ios | android | api |
|--------------------------------|-----|-----|---------|-----|
| S1 sign in → "Leads"           | ✓   | ✓   | ✓       | —   |
| G1.1 empty → "Enter a phone…"  | ✓   | ✓   | ✗ I1    | —   |

## Issues
| # | check · platform | expected | observed | evidence | cause | fix | re-check |
| I1 | G1.1 · android | "Enter a phone number" | "Required" | android-G1.1.png | … | file:line | ✓ |

## Re-judged
- G1.4 · ios · re-judged · F4-36 · ios-G1.4.png — was "a served request", now "the screen stays"

## Not run
- G2.3 · ios — the iPhone's network cannot be dropped; Android covers it

## Deferred
- <out-of-scope issue> → its `deferred.md` row, `D<n>`
```

The web and phone columns side by side are the parity check: a check that differs between them is
an issue. The Run line is how one task's QA is compared with the next. Its `check:all green at` is
the **tree stamp** of the last green `pnpm check:all` — the commit and every changed or new file, in one
hash; `/ship` step 2 reads it:
```bash
{ git rev-parse HEAD; git diff HEAD; git ls-files -o --exclude-standard -z | xargs -0 shasum; } | shasum | cut -c1-12
```

## 8. Fix and re-check

Wait until every agent has returned. Then sort each failure:

- **bug in scope** → fix it now.
- **bug out of scope** → a row in `docs/tasks/deferred.md`, listed in the report.
- **product question** → two readings the PRD allows: rule it into the row; a new feature or number:
  ask the owner.
- **wrong expectation** → correct it from its PRD row or `packages/i18n`. The agent runs the check
  again — unless the words the agent observed already equal the corrected expected words: then the
  row is re-judged without a run, and listed under Re-judged as `re-judged · <PRD row> · <evidence>`
  with the old expectation beside the new. Never re-judge a look, a screen-health check or a row
  that shows a defect.
- **environment** → fix it; the agent runs the check again. At close it becomes a harness row in
  `docs/tasks/deferred.md`, unless this branch fixed it.

Re-check with `SendMessage` to the SAME agent — only the failed checks. Run again only the suites
the fixes reach. Nothing is committed before `/ship`, so name the packages the fixes changed:
`pnpm turbo ls --filter='...@heliogrid/<each one>'` lists them and every package that imports them —
the web specs of the routes the fixes touch when `@heliogrid/web` is listed; the phone suite, on each
device, only when `@heliogrid/mobile` is. Each file a fix changes that step 1's diff did not hold →
apply the `when` lines to it; a check it now meets joins the re-check. A check that still fails after its third fix → stop and ask the owner: fix the code
another way, or change the plan.

## 9. Close

Whoever started a thing stops it: `preview_stop` each server; turn Android's airplane mode off
(`adb -s <serial> shell cmd connectivity airplane-mode disable`); set each phone's text size and
appearance back (`xcrun simctl ui <udid> content_size large`, `xcrun simctl ui <udid> appearance
light`, `adb -s <serial> shell settings put system font_scale 1.0`, `adb -s <serial> shell cmd uimode
night no`); shut each device
(`xcrun simctl shutdown <udid>`, `adb -s <serial> emu kill`). Then prove it — each prints nothing:
`lsof -nP -iTCP:3002 -iTCP:8084 -iTCP:8081 -sTCP:LISTEN -t` · `pgrep -f '@heliogrid/worker'` ·
`xcrun simctl list devices booted | grep -F <udid>` · `adb devices | grep emulator`. And
`shasum .env.local` equals the value step 2 noted.
