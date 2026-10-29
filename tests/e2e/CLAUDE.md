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
- Never a shared account: every flow signs up its own fresh number (`support/phone.ts`), so no spec
  reads another's data or the developer's, and no count or empty state is asserted.
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
pnpm --filter @heliogrid/e2e test:web [<spec files>]  # the web flows — locally only on heliogrid_test, after the gate (`/task`); all of them in CI
pnpm --filter @heliogrid/e2e test:ct [<spec files>]   # the component tests (port 3100)
pnpm --filter @heliogrid/e2e test:web --project qa-seed  # the QA companies (support/qa-accounts.ts), off CI, with the worker and Temporal up
pnpm --filter @heliogrid/e2e test:mobile <udid>      # the phone flows by hand, only to repeat a CI failure
```

The phone flows run in CI on Android only; no one runs them on iOS, and `/task` runs none locally.
`test:mobile` needs Metro, the api and the app installed on the device, and drives one device per
call; one call per phone may run at the same time. An emulator gets 2 cores, 4 GB and the host GPU on the
command line (the `android-emulator` launch configuration does it; the AVD's `hw.ramSize` is
ignored): at 2 GB Maestro's on-device server dies mid-suite (`DeviceServerDiedException`) while the
app shows no fault, and 4 cores only doubles the CPU peak for the same run time.

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

- A list row's open button is a 1×1 px button for screen readers under the visible row, so a `click()` on it is caught by the row's cover and opens nothing at 1536 → focus that named button and press Enter, as a keyboard user does (`web/more-roles.spec.ts`).
- A choice that draws at once and saves after (a language, a unit, a switch) is on screen before its request answers, so a `page.reload()` right after the click can stop the save and the reload reads the old value — a flake only on a slow runner → wait for the save's response (`page.waitForResponse`) before the reload (`web/more-profile.spec.ts`).
