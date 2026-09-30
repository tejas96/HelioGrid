# @heliogrid/e2e — the regression suite

Deps: `architecture.md` §2 tests/e2e. The law is `.claude/rules/testing.md`; the coverage gate is `M152`.

## What lives here / what must never live here

- `web/<route>.spec.ts` — one per web route, named as gate 33 names it (`/login` → `login.spec.ts`,
  `/` → `root.spec.ts`, a `(group)` folder dropped). Each runs at 375 and 1536 (`F7-43` item 1).
- `components/<Name>.spec.tsx` — the real `@heliogrid/ui` web halves, mounted with the app's
  stylesheets (`playwright/index.tsx`). A mounted component is imported from the `@heliogrid/ui`
  index; a plain value from `@heliogrid/ui` is read through `support/`, since the component
  transform refuses a value imported beside a component.
- `components/<Name>.story.tsx` — a wrapper a spec mounts when a prop is a function the component
  calls while it renders: a function handed to `mount` answers from the test process as a promise,
  so the story binds it in the browser. Never a spec itself (`testMatch` is `*.spec.tsx`).
- `mobile/<screen>.yaml` — one Maestro flow per phone screen, run in order by `mobile/run.sh`;
  `mobile/steps/` holds a step two flows share and is not a screen.
- Never a typed word or colour: words come from `@heliogrid/i18n`, colours from the page's own
  tokens (`support/token.ts`), the touch floor from `@heliogrid/ui`.
- Never a shared account: every flow signs up its own fresh number (`support/phone.ts`), so no spec
  reads another's data or the developer's, and no count or empty state is asserted.
- Never a retry: a flake is a bug and is fixed.
- Every web spec ends its landing with `support/axe.ts`'s `expectNoSeriousViolations` once the
  landing's words are visible: a `serious` or `critical` violation fails the suite (`F7-26`).
- The web's network dropped or a request aborted is driven here and nowhere else —
  `page.context().setOffline(true)`, `page.route(<path>, (route) => route.abort())` (`F8-36`); a QA
  agent cannot drop the browser pane's network.

## Commands

```
pnpm --filter @heliogrid/e2e test:web                 # the web flows; starts the BUILT api and web, or reuses running ones
pnpm --filter @heliogrid/e2e test:ct [<spec files>]   # the component tests (port 3100)
pnpm --filter @heliogrid/e2e test:mobile <udid>      # the phone flows, one device per call
pnpm --filter @heliogrid/e2e exec playwright show-trace <trace.zip>   # replay a failure
```

The web suite and the whole component suite run in CI (`e2e-web`). The phone suite runs in
`/verify`: CI has no simulator. It needs Metro, the api and the app installed on each device.

## Local conventions

- A new number's code is read from the api's log, `.git/heliogrid-harness/api.log`, which the `api`
  launch configurations and `playwright.config.ts` both write (`support/api-log.ts`). A running api
  is reused as it is, so it must be one of those: an api started any other way writes no log here.
- Maestro types faster than the phone's fields take keys: a flow waits for the tap to settle before
  typing, gives each code box its own digit, and presses Return to close the keyboard before the
  next tap — while it is up, the form spends a tap on closing it.
