# Runtime ownership

Read this file after the walk returns `build <id>` and before any runtime mutation.

## Ledger

On a clean tree, continue `feat/<id>` when it exists or create it from `origin/main`, or from the
open PR head of the task's earlier part when `references/walk.md` names one. The directory is
shared: a tree dirty on any branch but this task's own `feat/<id>` belongs to its owner, is never
discarded or overwritten, and ends the step with its files named; on `feat/<id>` it is this task's
work, resumed. Record every
resource the task may touch under its `#### Runtime` as `pre_existing` or `started_by_task`, with
the exact identity that stops or restores it:

| resource | inspect | identity |
|---|---|---|
| web `3002`, api `8084`, Metro `8081`, component tests `3100` | `lsof -nP -iTCP:<port> -sTCP:LISTEN`; api `/health/ready` | pid, launch name, preview server id |
| worker (no port) | the preview tool's server list | launch name, preview server id |
| Postgres `5544`, object store `9000`, Temporal `7233` | `docker ps` | container name |
| simulators and emulators | `xcrun simctl list devices booted`; `adb devices` | UDID or serial, host pid |
| browser tabs | browser tab context | tab id |
| database routing | the two `DATABASE_(ADMIN_)?URL` lines in `.env.local` | both initial database names |
| runtime logs | byte counts of `.qa/api.log`, `web.log`, `metro.log` | initial byte marks |
| a standing account's language, when a row sets it | its `interfaceLanguage` in `GET /auth/session`, signed in as it | its initial language |

## Reuse and start

- Reuse a healthy HelioGrid server whose pid command names this repository and whose health check
  passes. Record source (`api`, `web`, `mobile-metro`) or built (`api-built`, `web-built`) mode and
  start time.
- Reuse a built server only when it started after the newest file in `apps/api/dist` or
  `apps/web/.next`; otherwise restart it through its launch configuration when task-owned.
- A pre-existing stale server is an owner blocker. A foreign listener is freed by the owner
  through the `clean-dev-ports` launch configuration; never kill by port or process name.
- Start web, api, Metro and worker only through `.claude/launch.json` with the preview tool.
- Boot the simulator that holds the newest `com.heliogrid.app` install and the emulator
  `Pixel_8_API_36` (Android 16, the app's own target; the Android 14 image is CI's alone), each
  only when a proof row runs on it; a shut phone keeps its install and its sign-in. Rebuild native
  code only when native files changed after that install or the app is absent. JavaScript reloads
  through the one shared Metro.

## Teardown

Before the commit card on success (`/task` step 6), and on a blocker, cancellation or failure:

1. Restore both database URLs to their initial values; restart the api only if the task restarted it.
   Set each standing account whose language a row changed back to its initial language.
2. Stop each `started_by_task` server, tab and phone by exact identity: preview stop, tab id,
   `xcrun simctl shutdown <udid>`, `adb -s <serial> emu kill`. An idle phone burns the battery; the
   next part boots it again in a minute with the app and the sign-in still in place. A phone found
   booted is `pre_existing` and is left as found. Run `pnpm infra:down` only when the stack was
   down at the start; a container that stopped mid-task is started again with `pnpm infra:up` and
   left running when it ran at the start. Docker Desktop itself is left running, even when it was
   off at the start: quitting it after `pnpm infra:down` has left the Postgres container unable to
   start, which costs the owner a rebuild.
3. Leave every `pre_existing` resource and standing test company alone. Keep logs and proof.
4. Confirm no task-owned `tsx ... watch` process survives; a watcher can outlive its listener. A
   survivor is named to the owner with its pid, who stops it: the agent is denied `kill`.
5. Report it in a block starting `Teardown:`, one line per resource, `resource → initial state →
   final state`; the task guard checks the listeners, phones and routing behind that line.

The next task starts in a fresh session; this one stays bound to its PR for CI (`/task` step 7).
