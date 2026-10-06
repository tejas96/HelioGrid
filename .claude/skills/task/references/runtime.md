# Runtime ownership

Read this file after the walk returns `build <id>` and before any runtime mutation.

## Ledger

On a clean tree, continue `feat/<id>` when it exists or create it from `origin/main`. Record every
resource the task may touch under its `#### Runtime` as `pre_existing` or `started_by_task`, with
the exact identity that stops or restores it:

| resource | inspect | identity |
|---|---|---|
| web `3002`, api `8084`, Metro `8081` | `lsof -nP -iTCP:<port> -sTCP:LISTEN`; api `/health/ready` | pid, launch name, preview server id |
| Postgres `5544`, object store `9000`, Temporal `7233` | `docker ps` | container name |
| simulators and emulators | `xcrun simctl list devices booted`; `adb devices` | UDID or serial, host pid |
| browser tabs | browser tab context | tab id |
| database routing | the two `DATABASE_(ADMIN_)?URL` lines in `.env.local` | both initial database names |
| runtime logs | byte counts of `.qa/api.log`, `web.log`, `metro.log` | initial byte marks |

The directory is shared. A dirty tree that predates this task belongs to its owner and is never
discarded or overwritten.

## Reuse and start

- Reuse a healthy HelioGrid server whose pid command names this repository and whose health check
  passes. Record source (`api`, `web`, `mobile-metro`) or built (`api-built`, `web-built`) mode and
  start time.
- Reuse a built server only when it started after the newest file in `apps/api/dist` or
  `apps/web/.next`; otherwise restart it through its launch configuration when task-owned.
- A pre-existing stale server is an owner blocker. A foreign listener is freed by the owner
  through the `clean-dev-ports` launch configuration; never kill by port or process name.
- Start web, api, Metro and worker only through `.claude/launch.json` with the preview tool.
- Choose the booted simulator with the newest `com.heliogrid.app` install. Rebuild native code only
  when native files changed after that install or the app is absent. JavaScript reloads through
  the one shared Metro.

## Teardown

On success, blocker, cancellation or failure:

1. Restore both database URLs to their initial values; restart the api only if the task restarted it.
2. Stop each `started_by_task` resource by exact identity: preview stop, simulator UDID, emulator
   serial, or tab id. Run `pnpm infra:down` only when this task ran `pnpm infra:up`.
3. Leave every `pre_existing` resource and standing test company alone. Keep logs and proof.
4. Confirm no task-owned `tsx ... watch` process survives; a watcher can outlive its listener.
5. Report `resource → initial state → final state`.

The next task starts in a fresh session.
