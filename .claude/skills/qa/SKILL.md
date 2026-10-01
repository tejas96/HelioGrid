---
name: qa
description: Run a task's QA plan after the build — the regression suites first, then one QA agent per surface the change reaches, in parallel — merge one QA report, fix every in-scope issue at once, and re-check only what failed. Use after `pnpm check:all` passes, before /ship.
---

# /qa — run the plan, report, fix, re-check

The QA plan was written at `/start`, before the code, so it tests what should happen rather than what
was built; run it as written after the refresh in step 1. No probes, no rounds. The report lives in the
session scratchpad, `qa-<T-id>.md`, and its final copy goes into the PR body at `/ship`.

## 1. Surfaces

Take the plan's `Surfaces:` line and check it against what the diff reaches:
`pnpm turbo ls --filter='...[origin/main]'` — `@heliogrid/web` is web, `@heliogrid/mobile` is iOS and
Android, `@heliogrid/api` is api, `@heliogrid/worker` is the worker. A surface the plan does not
cover is a scope change: stop and ask the owner. No surface reached means no agents; the suites in
step 3 are the QA.

**Refresh the plan — one pass, before anything runs:**

- Fill each expected text with the exact words from its `packages/i18n` file, now that they exist.
- **Add** a check for anything the build added that the plan does not cover — a new state, a new
  error message, a new route or screen — in the plan's own format, and list it in the report.
- Never remove or weaken a check. A check that no longer fits the code is a scope change: stop and
  ask the owner.

## 2. Prepare — the main session owns every server and device

1. Load `SendMessage` and `TaskStop` with `ToolSearch`; they are deferred tools.
2. Start the servers the surfaces need with `preview_start`: `api`, `web`, `mobile-metro`, `worker`.
   One instance of each serves every surface — the iOS simulator reaches the api at
   `localhost:8084`, the Android emulator at `10.0.2.2:8084`. Note each server id. The api writes
   its log to `$(git rev-parse --git-common-dir)/heliogrid-harness/api.log`.
3. Boot each device: the simulator (`xcrun simctl boot <udid>`, then the simulator tool's
   `attach`) and the Android emulator with its window. Open the app once on each, and the browser
   tab once, so every bundle is warm.
4. **Each surface gets its own account and its own company.** One sign-out ends every session of
   that person, so two surfaces on one account sign each other out. The development number in
   `.env.local` (`DEV_OTP_PHONE`, code `DEV_OTP_CODE`) goes to ONE surface; every other signs up a
   fresh `+91` number, reading its code from the api log (`grep 'via sms'`), then creates its company
   with `POST /tenants`. Every QA company is named `QA <T-id> <surface>` (for example
   `QA T-M02-001 web`), so the test records it leaves in the local database can be found later.
5. **Seed only through the module's own writer**, into that surface's own company — never SQL by
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

## 3. The regression suites — machine first

Run what the plan's `Regression` lines name, on the servers and devices just started:

- web specs for the changed routes: `pnpm --filter @heliogrid/e2e test:web <spec files>`
- component specs for changed `ui` parts: `pnpm --filter @heliogrid/e2e test:ct <spec files>`
- phone flows, ONE device after the other — two at once lose key presses:
  `bash tests/e2e/mobile/run.sh <udid>`, then `bash tests/e2e/mobile/run.sh <serial>`

A failure here is fixed before any agent starts.

## 4. Dispatch — one agent per surface, all in ONE message, in the background

`qa-api`, `qa-web`, `qa-mobile` (ios) and `qa-mobile` (android) — only the surfaces reached. Each
prompt holds: the plan's checks that name its surface, with their ids; its account and its company
name; the server ids,
**only to read logs**; its device (udid or serial); its results file,
`<scratchpad>/qa-<T-id>/<surface>.md`; the path of the api log; and the common rules below, word for
word. Then tell the owner: "QA is running — please do not click in the browser pane, the simulator
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

No file is edited while any agent runs — the dev servers reload under a running check. A results
file with no new row for 15 minutes is a stuck agent: `TaskStop` it; its unfinished checks are
`not run: agent stopped`.

## 6. Read

Read every results file in full. Read each pass's evidence for a workaround — a retry, a second
sign-in, a precondition the agent made for itself. Spot-check two passes against their evidence; a
spot-check that contradicts its row makes that surface's run untrusted, and it runs again.

## 7. The QA report — `<scratchpad>/qa-<T-id>.md`

```
# QA report — T-M02-001 · Quick Add Lead
Suites: web 12/12 ✓ · components 4/4 ✓ · phone ios 3/3 ✓ android 3/3 ✓ · unit ✓

## Results
| check                          | web | ios | android | api |
|--------------------------------|-----|-----|---------|-----|
| S1 sign in → "Leads"           | ✓   | ✓   | ✓       | —   |
| G1.1 empty → "Enter a phone…"  | ✓   | ✓   | ✗ I1    | —   |

## Issues
| # | check · platform | expected | observed | evidence | cause | fix | re-check |
| I1 | G1.1 · android | "Enter a phone number" | "Required" | android-G1.1.png | … | file:line | ✓ |

## Not run
- G2.3 · ios — the iPhone's network cannot be dropped; Android covers it

## Deferred
- <out-of-scope issue> → its `deferred.md` row, `D<n>`
```

The web and phone columns side by side are the parity check: a check that differs between them is
an issue.

## 8. Fix and re-check

Wait until every agent has returned. Then sort each failure:

- **bug in scope** → fix it now.
- **bug out of scope** → a row in `docs/tasks/deferred.md`, listed in the report.
- **product question** → two readings the PRD allows: rule it into the row; a new feature or number:
  ask the owner.
- **wrong expectation** → correct it; the agent runs the check again. A verdict changes only by a new
  run, never by editing a row.
- **environment** → fix it; the agent runs the check again.

Re-check with `SendMessage` to the SAME agent — only the failed checks — and run the suites from
step 3 again. A check that still fails after its third fix → stop and ask the owner: fix the code
another way, or change the plan.

## 9. Close

Whoever started a thing stops it: `preview_stop` each server; turn Android's airplane mode off
(`adb -s <serial> shell cmd connectivity airplane-mode disable`); set each phone's text size and
appearance back (`xcrun simctl ui <udid> content_size large`, `xcrun simctl ui <udid> appearance
light`, `adb -s <serial> shell settings put system font_scale 1.0`, `adb -s <serial> shell cmd uimode
night no`); shut each device
(`xcrun simctl shutdown <udid>`, `adb -s <serial> emu kill`). Then prove it — each prints nothing:
`lsof -nP -iTCP:3002 -iTCP:8084 -iTCP:8081 -sTCP:LISTEN -t` · `pgrep -f '@heliogrid/worker'` ·
`xcrun simctl list devices booted | grep -F <udid>` · `adb devices | grep emulator`.
