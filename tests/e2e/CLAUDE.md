# @heliogrid/e2e — the regression suite

Deps: `architecture.md` §2 tests/e2e.

## What lives here / what must never live here

- `web/<route>.spec.ts` — one per web route, named as `e2e-flow-per-screen` names it (`/login` →
  `login.spec.ts`, `/` → `root.spec.ts`, a `(group)` folder dropped); a route may add a feature
  spec beside it (`company-profile-logo.spec.ts`).
- `web/qa-seed.setup.ts` is no flow: the seed of the QA companies `qa-live` signs in as
  (`support/qa-accounts.ts`), run only as project `qa-seed`, never in CI.
- No screenshot baselines: a flow asserts words, roles, states and measured values, never a
  whole-page picture.
- `components/<Name>.spec.tsx` (or `<Name>.<facet>.spec.tsx`) — the real `@heliogrid/ui` web halves, mounted with the app's
  stylesheets (`playwright/index.tsx`). A mounted component is imported from the `@heliogrid/ui`
  index; a plain value from `@heliogrid/ui` is read through `support/`, since the component
  transform refuses a value imported beside a component.
- `components/<Name>.story.tsx` — a wrapper a spec mounts when a prop is a function the component
  calls while it renders: a function handed to `mount` answers from the test process as a promise,
  so the story binds it in the browser. Never a spec itself (`testMatch` is `*.spec.tsx`).
- `mobile/<screen>.yaml` — one Maestro flow per phone screen, save the screens
  `e2e-flow-per-screen` holds, each with its reason; run in order by `mobile/run.sh`; `mobile/steps/`
  holds a step two flows share and is not a screen. A flow `run.sh` does not run,
  or a step nothing calls, fails `e2e-flow-per-screen`.
- Never a typed word or colour: words come from `@heliogrid/i18n`, colours from the page's own
  tokens (`support/token.ts`), the touch floor from `@heliogrid/ui`.
- Never a shared account: every web flow signs up its own fresh number (`support/phone.ts`); the
  phone suite signs up its fresh numbers once per run and its flows share them (`mobile/run.sh`). No
  flow reads another run's data or the developer's, and no count or empty state is asserted.
- A flow names its company `E2E <its 10-digit number>`. A web flow names its owner
  `support/door.ts`'s `OWNER_NAME`, one fixed name, so the owner's words never carry the run's
  number; the phone flow names it `Owner <number>` (`mobile/run.sh`).
- A flake is a bug and is fixed; there are no retries.
- Every route's spec ends its landing with `support/axe.ts`'s `expectNoSeriousViolations` once
  the landing's words are visible: a `serious` or `critical` violation fails the suite (`F7-26`).
- A screen's handling of network loss and aborted requests is tested here —
  `page.context().setOffline(true)`, `page.route(<path>, (r) => r.abort())` (`F8-36`).

## Commands

```
pnpm --filter @heliogrid/e2e test:web [<spec files>]  # the web flows — locally only on heliogrid_test, after `pnpm check:all` (it builds the api and web they start); all of them in CI
pnpm --filter @heliogrid/e2e test:ct [<spec files>]   # the component tests (port 3100)
pnpm --filter @heliogrid/e2e test:web --project qa-seed  # the QA companies (support/qa-accounts.ts), off CI, with the worker and Temporal up
pnpm --filter @heliogrid/e2e test:mobile <serial>    # the phone flows on one Android device
```

The phone flows run on Android; no one runs them on iOS. When a change touches a phone screen, a
`mobile/*.yaml` or a `.native.tsx`, the session runs the whole phone suite once on the local
emulator (`pnpm --filter @heliogrid/e2e test:mobile emulator-5554`, in the background, output to
`.qa/`) after the Android `qa-live` round (they share the emulator) and before the push; the local
image differs from CI's, so CI's `android` lane stays the proof. `test:mobile` needs Metro, the api
and the app installed on the device, and drives one device per call; calls on different phones may
run at once. Start the emulator only through the `android-emulator` launch configuration (2 cores,
4 GB, host GPU; the AVD's `hw.ramSize` is ignored, and at 2 GB Maestro's on-device server dies
mid-suite).

## Running the app for QA

`qa-live` checks a running app and starts nothing; the session runs it on `heliogrid_test` this way.
A change no screen shows and no route serves (worker or database only) is proven by its tests and
skips this.

1. Stop an `api`, `web` or `worker` started from `.claude/launch.json` by its preview id. A worker
   on `heliogrid_dev` (`pgrep -f '@heliogrid/worker'`; it has no port) would take the seed's
   workflow work into the owner's data; one started outside the preview tool is the owner's: ask
   them to stop it.
2. With 3002 and 8084 free — an `api` in watch mode reloads `.env.local` — point `.env.local` at the
   test database once, never over an existing copy:
   `[ -e .qa/env.local.dev ] || { cp .env.local .qa/env.local.dev && sed -i '' '/^DATABASE_/s/heliogrid_dev/heliogrid_test/' .env.local; }`,
   then `<prefix> pnpm db:migrate > .qa/migrate.log 2>&1 && pnpm --filter @heliogrid/api pack:publish > .qa/pack.log 2>&1`
   (`<prefix>`: the test-database prefix, `CLAUDE.md` §5).
3. Start `worker`, then seed while 8084 is free (the seed starts its own api):
   `pnpm turbo build --filter=@heliogrid/api > .qa/build-api.log 2>&1 && <prefix> pnpm --filter @heliogrid/e2e test:web --project qa-seed > .qa/seed.log 2>&1`.
4. Start `api`, then what the change needs: `web`, `mobile-metro`, an iPhone simulator holding
   `com.heliogrid.app`, and `android-emulator` only when Android is in scope. Rebuild the phone app
   when the device lacks it, the change touches `apps/mobile/ios`, `apps/mobile/android` or a native
   dependency, or it opens on a red error naming a `NativeModule` (`apps/mobile/CLAUDE.md`).
5. One `qa-live` on the api first when a route changed; fix its `FAIL`s before any screen. Then one
   `qa-live` per screen surface, all at once: web for a web change, iOS for any phone change, Android
   only for what CI's `android` lane cannot show — native code or dependency, an `.android.*` file, a
   `Platform.OS` branch, the keyboard, Back, insets, a system picker or a permission. A change to
   one half of a twinned screen brings the other platform in (`.claude/rules/screen-parts.md`).
6. Fix only after every agent of the round has reported (`CLAUDE.md` §5): an edit reloads the app
   under one still checking. Rebuild a changed
   package before the re-check (`apps/web/CLAUDE.md` Traps), then re-check with a fresh agent given
   the fixes.
7. After: stop what you started (never Docker), delete the logs, and
   `mv .qa/env.local.dev .env.local`. Ask the owner to restart what they stopped for you; a web dev
   server needs `rm -rf apps/web/.next` first.

## Local conventions

- `test:ct` clears its component cache only when a `packages/ui` stylesheet is newer than the
  cache, so a stylesheet restored by moving an older copy back keeps the stale build: restore by
  editing the file, or touch it before the next run.
- A new number's code is read from the api's log, `.qa/api.log`, which the `api`
  launch configurations, `playwright.config.ts` and CI's `android` job write
  (`support/api-log.ts`). On CI a running api is reused as it is, so it must be one of those; off CI
  none is (`playwright.config.ts`), and the api it starts appends to that log.
- Maestro types faster than the phone's fields take keys: a flow waits for the tap to settle before
  typing, gives each code box its own digit, and presses Return to close the keyboard before the
  next tap — while it is up, the form spends a tap on closing it.

## Traps

- `test:web <spec>` reads a spec path as a pattern: a route's brackets match nothing and the run reads green with no spec run → escape them (`'web/more-\[row\]'`) and check the log names every spec.
- A list row's open button is a 1×1 px button for screen readers under the visible row, so a `click()` on it is caught by the row's cover and opens nothing at 1536 → focus that named button and press Enter, as a keyboard user does (`web/more-roles.spec.ts`).
- A choice that draws at once and saves after (a language, a unit, a switch) is on screen before its request answers, so a `page.reload()` right after the click can stop the save and the reload reads the old value — a flake only on a slow runner → wait for the save's response (`page.waitForResponse`) before the reload (`web/more-profile.spec.ts`).
- A phone flow's `scrollUntilVisible` stops as soon as the element shows, often at the screen's foot under the floating pill, so the `tapOn` after it lands on the pill and opens nothing → give a scroll whose element is tapped next `centerElement: true` (`mobile/leads-list.yaml`).
- A `page.route` stub set after a page loads misses a read already out: the press's re-read joins that in-flight query and never meets the stub, a race only a loaded runner loses → wait for `networkidle` before stubbing a read the page itself makes (`web/more-profile.spec.ts`).
