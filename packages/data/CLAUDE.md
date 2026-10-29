# @heliogrid/data — the frontend SDK, the ONLY data path for web and RN

## What lives here / what must never live here

- NEVER: UI, navigation or business logic (that is `@heliogrid/domain`); `baseUrl` is passed in.
  Entries: `.` (framework-free), `./react` (React Query adapter), `./server` (one request-scoped
  Next context).

## Local conventions

- **Repositories are interfaces with factories, and their types are INFERRED from the contract,**
  never hand-written. That is what makes a data-source swap one change for both platforms.
- **Every hook, feature hooks included, lives in `src/react/`** (`use-health.ts`, not
  `health/hooks.ts`).
- **A new repository is one edit**: add it to `createRepositoryRegistry` (`src/composition.ts`);
  apps construct only through `createDataLayer` and `createServerDataContext`.
- **Every failure leaves this package as a `DataError`.** A repository normalises in its own
  `catch`; raw `ZodError`s and ts-rest classes never reach a screen.
- **Retry is `DataError.retryable`, not a count**, set where the failure is classified:
  network, timeout and 5xx yes (max 2, reads only); cancellation and a declared 4xx no. Mutations
  never retry. Never re-add a bare `retry: N`.
- **Read methods take an `AbortSignal` and forward it.** A repository that ignores it makes
  cancellation a lie all the way up.
- `server` mode forwards only `cookie`, `authorization` and `REQUEST_ID_HEADER` (`transport.ts`),
  never a spread and never a tenant header. A spread leaks one caller's identity into another's
  request.
- **`session/store.ts` is the one session store for both platforms**: a `subscribe`/`getSnapshot`
  store read via `useSyncExternalStore`. It never holds a credential (the transport carries the
  cookies), and every move goes through domain's `sessionAfter`, which the store only calls. A
  device changing hands consults `HeldWork` (`F4-37`) before the new user's data loads.

## Done means

Consumed by both platforms; transport, error and retry behaviour proven by driving the real client
against a controllable origin (malformed body, unknown status, non-envelope, timeout, cancellation,
refused connection). A hook's answers are tested the same way, in `tests/react/<hook>.test.ts`:
`renderHook` inside the real `DataProvider` over `createDataLayer`, an origin (`node:http`) that
answers each case in the contract's shapes and reads every write body through
`tests/react/origin-wire.ts`'s `writeBodyOf`, which refuses what the route's contract refuses (no
mock: `.claude/rules/testing.md`), and
`// @vitest-environment happy-dom` at the top
(`tests/react/use-assign-roles.test.ts` is the pattern).

## Traps

- ts-rest runs client response validation INSIDE the fetcher, so a contract mismatch reaches the transport's own `catch` as a raw `ZodError` that looks exactly like a failed request, and classified as network it becomes retryable → the transport rethrows `ZodError` untouched.
- `createServerDataContext` hoisted to a module constant serves the next visitor the previous visitor's session and cache, because both fields are request-bound → call it INSIDE the render and let it fall out of scope.
- `lib: ["ES2023", "DOM"]` in this package's tsconfig is load-bearing: without DOM, `Headers` is unknown and ts-rest's `FetchOptions` collapses to `never`, typing every fetch option `undefined` → keep the lib entry.
- React Native suspends timers in the background → a countdown or elapsed time is wall-clock timestamp maths, never an interval decrement.
- iOS CFNetwork merges its own cookie copy into our header and the server answers 401 → React Native sends `credentials: 'omit'`, set in the transport, never per client.
- A step's answer is a write that replaces the one before, so a second way out pressed while the first answer is out stores the wrong answer (a skip over a sent invite) → hold the answer in flight and hand it to every other way out (`use-setup-invite.ts`).
- A phone switch reports the opposite of its drawn value, so a second tap that lands before the redraw asks for the same value again and the switch ends reversed → a hook that writes a toggle flips from the last value it asked for, held in a ref, never from a value the control hands back (`use-push-preferences.ts`).
- A settings page's `read` (`pageRead`) is `ready` once its own reads answer, while its other reads still fill parts of it, so a test that reads such a part (a cover, a count) the moment the page is ready reads `null` on a slow runner → `waitFor` the part itself (`tests/react/use-proposal-template.test.ts`).
