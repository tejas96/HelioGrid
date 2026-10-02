# @heliogrid/mobile — bare React Native (iOS + Android), NO Expo anywhere

Deps: `architecture.md` §2 apps/mobile. Platform rules: `architecture.md` §3 · what both apps
share: `CLAUDE.md` §6 · UI law: `.claude/rules/ui-adherence.md`.

## What lives here / what must never live here

- Field-first RN app. A module's screen lands in `src/screens/` and replaces its shell placeholder
  in `src/navigation/routes/app.ts`. Screens land from the same contract as web; which platform
  ships a screen first is a plan decision, but the prop contract stays in parity (Law 7). A part
  both platforms draw is authored once — `.claude/rules/screen-parts.md`, loaded with this folder.
- NEVER: an expo package, EAS, AsyncStorage for tokens, a `packages/db` import, a web-only
  dependency, or authored domain logic — import it (Law 11).

## Where files go — a closed set; never invent a folder

`src/` is `{auth, navigation, push, screens}` plus root `env.ts`, `i18n.ts` and `react-query-host.tsx`.
A new category is a plan-time call, and it changes this line.

```
src/screens/<name>/       same shape as web's feature, in RN's location
  <Name>Screen.tsx        composes; holds no state; ≤80 lines
  components/<Part>.tsx   one file per component or coherent group
  hooks/use-<thing>.ts    the platform adapter only — keyboard, focus, clipboard, navigation
  styles.ts               screen-level layout; component geometry stays with its component
  types.ts                when two files here share a type
src/screens/shared/       parts two screens here share, until web draws them (`screen-parts.md`)
src/navigation/           React Navigation static config
src/auth/ · src/push/     native adapters, one per capability; push isolates Firebase/Notifee
src/react-query-host.tsx  the ONE host-lifecycle adapter (AppState → focus, NetInfo → online)
```

## Commands

```
pnpm --filter @heliogrid/mobile start | ios | android | typecheck
cd apps/mobile/ios && LANG=en_US.UTF-8 bundle exec pod install
    # after a native dep change; without the UTF-8 locale it fails on Unicode Normalization
```

## Rules

- **Push can never crash the app.** Every call in `src/push/` answers "no" rather than throwing;
  `FirebaseApp.configure()` runs in `AppDelegate.swift`, never from JavaScript.

- **Interactive primitives come from `@heliogrid/ui`, never `react-native`** — its RN half is the
  `.native.tsx` file in the same component folder. `View`, `ScrollView`, `StyleSheet` and
  `Platform` are layout and stay allowed.
- **`src/i18n.ts` is imported FIRST** — it pulls `@heliogrid/i18n/rn`, whose side effects install
  the Hermes Intl polyfills. Language comes from `@heliogrid/i18n/react`. `App.tsx` builds the
  runtime (one per mount: `packages/i18n/CLAUDE.md`); a screen never calls `i18n.activate`
  itself, because it cannot know whether that catalog is loaded.
- **Native capability** — camera, storage, notifications, keychain — is isolated in its own module
  under `src/`, never called inline from a screen. Auth tokens go through
  `src/auth/keychain-storage.ts` and nowhere else.
- **Host lifecycle is installed once, at the root.** `ReactQueryHost` refcounts its install and
  cleanup, so a Strict Mode double-mount produces ONE listener set and a remount leaks none. A
  screen must never call `focusManager` or `onlineManager`. This is focus and reconnect only:
  there is no offline persistence and no mutation queue.
- **RN suspends timers when backgrounded** — a countdown or elapsed-time calculation is wall-clock
  timestamp maths, never an interval decrement.
- **Navigation is React Navigation 7 STATIC config.** `src/navigation/root.tsx` holds the one
  route map and the param list is INFERRED. Adding a screen is ONE entry in
  `src/navigation/routes/app.ts` (signed in) or `auth.ts` (signed out); its param type, deep link
  and auth gate follow. Screens
  receive `route` only; navigation comes from `useNavigation()`. **Navigation chrome lives here,
  never in `@heliogrid/ui`** — a component that knows route names is not a design-system
  component; the shell takes items as PROPS.
- **Styling layers:** components own pixels (`@heliogrid/ui`); screens own layout in the screen
  folder (`StyleSheet` + `theme.*`).
- Repository types are INFERRED from contracts, never re-declared. Protocol constants
  (`OTP_LENGTH`, `OTP_EXPIRY_SECONDS`) come from `@heliogrid/domain`; the calling code and
  national-number length do NOT — those are market facts in `pack.formats`.
- **A screen owns no flow.** Its state machine is a `@heliogrid/domain` reducer and its round trips
  and timers a `@heliogrid/data` hook, both imported (Law 11); a `useState` here holds a
  purely visual fact — an open sheet, a focused field.
- A screen component body is capped at 80 lines. **Never a `components.tsx` or `hooks.ts`
  grab-bag** — a file named for its layer instead of its job is the same defect as `*-part2`.
- Paginated screens: `FlatList` + `usePaginatedList`, never inside a `ScrollView`. API failures
  render a shared error component; `ApiErrorText` is owed to `packages/ui`.

## Done means

Runs on BOTH simulators · typecheck green · the per-screen DoD in
`docs/prd/foundations/F7-design-language.md` `F7-43`.

## Traps

- `import()` cannot lazy-load: against the dev server it goes through `__loadBundleAsync` and throws `LoadBundleFromServerError`, while a release build inlines it → a `.native.ts` half with static imports, as `packages/i18n/src/catalog-loader.native.ts` does.
- The root navigator must never be empty: every group is `if`-gated, and per-guard timers can disagree for a frame → keep the ungrouped `Boot` route, and drive the guards from ONE phase value in `src/navigation/phase.tsx`.
- A navigation group keyed by ROLE declares a shared screen twice, because roles are stackable, and a duplicate route name throws → key groups by CAPABILITY.
- iOS CFNetwork merges its own cookie copy into our header, and the server answers 401 → `credentials: 'omit'` on React Native, set in `@heliogrid/data`'s transport, never in the client.
- react-native-firebase needs `use_modular_headers!` in the Podfile → keep it.
- A library imported by BOTH this app and a workspace package loads twice under Metro (the package's CommonJS build beside the app's ES build), so React contexts and singletons split — `useQueryClient()` throws inside `QueryClientProvider`, and nothing fails a check → import the library only through the workspace package that owns it (`followHostLifecycle` in `@heliogrid/data/react`); never add it to this app's dependencies.
- Port 8081 is Metro's default for every React Native project on this machine, and the preview tool refuses to start over another project's Metro → stop that Metro by hand before mobile QA; never fall back to another port.
- The native splash colour has no generator: both artifacts came from a deleted package and are frozen, and a build does not refresh them → never hand-edit them; re-emitting them is owed by the mobile slice.
