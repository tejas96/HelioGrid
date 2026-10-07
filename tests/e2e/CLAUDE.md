# @heliogrid/e2e — the regression suite

Deps: `architecture.md` §2 tests/e2e.

## What lives here / what must never live here

- `web/<route>.spec.ts` — one per web route, named as `e2e-flow-per-screen` names it (`/login` →
  `login.spec.ts`, `/` → `root.spec.ts`, a `(group)` folder dropped).
- `components/<Name>.spec.tsx` — the real `@heliogrid/ui` web halves, mounted with the app's
  stylesheets (`playwright/index.tsx`). A mounted component is imported from the `@heliogrid/ui`
  index; a plain value from `@heliogrid/ui` is read through `support/`, since the component
  transform refuses a value imported beside a component.
- `components/<Name>.story.tsx` — a wrapper a spec mounts when a prop is a function the component
  calls while it renders: a function handed to `mount` answers from the test process as a promise,
  so the story binds it in the browser. Never a spec itself (`testMatch` is `*.spec.tsx`).
- `mobile/<screen>.yaml` — one Maestro flow per phone screen, run in order by `mobile/run.sh`;
  `mobile/steps/` holds a step two flows share and is not a screen. A flow `run.sh` does not run,
  or a step nothing calls, fails `e2e-flow-per-screen`.
- Never a typed word or colour: words come from `@heliogrid/i18n`, colours from the page's own
  tokens (`support/token.ts`), the touch floor from `@heliogrid/ui`.
- Never a shared account: every flow signs up its own fresh number (`support/phone.ts`), so no spec
  reads another's data or the developer's, and no count or empty state is asserted.
- A flow names its company `E2E <its 10-digit number>`.
- Never a retry: a flake is a bug and is fixed.
- Every web spec ends its landing with `support/axe.ts`'s `expectNoSeriousViolations` once the
  landing's words are visible: a `serious` or `critical` violation fails the suite (`F7-26`).
- Network loss and aborted requests are tested here and nowhere else —
  `page.context().setOffline(true)`, `page.route(<path>, (r) => r.abort())` (`F8-36`).

## Commands

```
pnpm --filter @heliogrid/e2e test:web                 # the web flows; starts the BUILT api and web, or reuses running ones
pnpm --filter @heliogrid/e2e test:ct [<spec files>]   # the component tests (port 3100)
pnpm --filter @heliogrid/e2e test:mobile <udid>      # the phone flows by hand, one device per call
```

The web and component suites run in CI (`e2e-web`); the phone flows run in CI on Android
(`android`; `.github/workflows/ci.yml` says how, and how the repository variable `PHONE_E2E=off`
switches them off) and on iOS by hand or by the `qa-ios` helper, never in CI — a macOS runner
spends 20 minutes on the Xcode build alone. `test:mobile` runs the flows on a device by hand; it
needs Metro, the api and the app installed on the device. An emulator a local run uses matches CI's:
API 34, 4 cores and 4 GB of RAM, given on the command line (`emulator -avd <name> -memory 4096`;
the emulator ignores `hw.ramSize` in the AVD's file) — at 2 GB and below Maestro's on-device
server dies mid-suite (`DeviceServerDiedException`) while the app shows no fault.
Maestro drives one device per `run.sh` (two at once lose the first keys typed), but the three QA
helpers may drive web, iPhone and Android at once on one stack: proven on one api, one Metro and
two phones — three helpers each typing their own number and reading only their own code, then the
same keys sent to all three surfaces in one instant, with no key lost or crossed.

## Local conventions

- `test:ct` clears its component cache only when a `packages/ui` stylesheet is newer than the
  cache, so a stylesheet restored by moving an older copy back keeps the stale build: restore by
  editing the file, or touch it before the next run.
- A new number's code is read from the api's log, `.qa/api.log`, which the `api`
  launch configurations, `playwright.config.ts` and CI's `android` job write
  (`support/api-log.ts`). A running api is reused as it is, so it must be one of those: an api
  started any other way writes no log here.
- Maestro types faster than the phone's fields take keys: a flow waits for the tap to settle before
  typing, gives each code box its own digit, and presses Return to close the keyboard before the
  next tap — while it is up, the form spends a tap on closing it.
