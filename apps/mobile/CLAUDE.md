# @heliogrid/mobile — bare React Native (iOS + Android), NO Expo anywhere

Deps: `architecture.md` §2 apps/mobile · platform rules: §3.

## What lives here / what must never live here

- A module's screen lands in `src/screens/` and replaces its shell placeholder in
  `src/navigation/routes/app.ts`.
- NEVER: an expo package, EAS, AsyncStorage for tokens, `@heliogrid/db`, or a web-only dependency.

## Where files go

`src/` is `{auth, navigation, push, screens}` plus root `env.ts`, `i18n.ts` and `react-query-host.tsx`.

```
src/screens/<name>/       same shape as web's feature, in RN's location
  <Name>Screen.tsx        composes; holds only visual state
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
- **`src/i18n.ts` is the one importer of `@heliogrid/i18n/rn`** (it installs the Hermes Intl
  polyfills). `App.tsx` builds the runtime (one per mount: `packages/i18n/CLAUDE.md`). A screen
  takes language from `@heliogrid/i18n/react` and never calls `i18n.activate`.
- **Native capability** — camera, storage, notifications, keychain — is isolated in its own module
  under `src/`, never called inline from a screen. Auth tokens go through
  `src/auth/keychain-storage.ts` and nowhere else.
- Focus and reconnect are wired once in `src/react-query-host.tsx`; there is no offline
  persistence and no mutation queue.
- **Navigation is React Navigation 7 static config.** Add a screen with ONE entry in
  `src/navigation/routes/app.ts` (signed in) or `auth.ts` (signed out); its param type (inferred),
  deep link and gate follow. Screens get `route` only and navigate with `useNavigation()`.
  Navigation chrome lives here, never in `@heliogrid/ui` — the shell takes items as props.
- Protocol constants (`OTP_LENGTH`, `OTP_EXPIRY_SECONDS`) come from `@heliogrid/domain`; the dial
  code and number length are market facts in the format pack's `phone`.
- A screen's `useState` holds only a visual fact (an open sheet, a focused field); its flow is a
  `@heliogrid/domain` reducer driven by a `@heliogrid/data` hook.
- Paginated screens: `FlatList` + `usePaginatedList`, never inside a `ScrollView`.
- An API failure's words come from `@heliogrid/i18n`; the first screen that renders one builds
  `ApiErrorText` in `packages/ui` (deferred D68).

## Done means

Runs on BOTH simulators · the per-screen DoD in `docs/prd/foundations/F7-design-language.md`
`F7-43`.

## Traps

- `import()` cannot lazy-load: against the dev server it goes through `__loadBundleAsync` and throws `LoadBundleFromServerError`, while a release build inlines it → a `.native.ts` half with static imports, as `packages/i18n/src/catalog-loader.native.ts` does.
- The root navigator must never be empty: every group is `if`-gated, and per-guard timers can disagree for a frame → keep the ungrouped `Boot` route, and drive the guards from ONE phase value in `src/navigation/phase.tsx`.
- A navigation group keyed by ROLE declares a shared screen twice, because roles are stackable, and a duplicate route name throws → key groups by CAPABILITY.
- react-native-firebase needs `use_modular_headers!` in the Podfile → keep it.
- A library imported by BOTH this app and a workspace package loads twice under Metro (the package's CommonJS build beside the app's ES build), so React contexts and singletons split — `useQueryClient()` throws inside `QueryClientProvider`, and nothing fails a check → import the library only through the workspace package that owns it (`followHostLifecycle` in `@heliogrid/data/react`); never add it to this app's dependencies.
- Port 8081 may be held by another React Native project's Metro, and the preview tool will not start over it → stop that Metro by hand.
- The native splash colour (android `splash_canvas` in `res/values/colors.xml`, and its iOS launch screen) has no generator → never hand-edit it.
