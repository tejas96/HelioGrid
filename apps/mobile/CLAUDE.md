# @heliogrid/mobile — bare React Native (iOS + Android), NO Expo anywhere

Traps: `docs/engineering/landmines.md` · deps and platform rules: `architecture.md` §2
apps/mobile, §3 · what both apps share: `.claude/rules/cross-platform.md` · UI law:
`.claude/rules/ui-adherence.md`.

## What lives here / what must never live here

- Field-first RN app: My Day, leads, quick-add, surveys, visits, notifications, profile, signup,
  invite accept. Screens land per module from the same contract as web; which platform ships a
  screen first is a plan decision, but the prop contract stays in parity (Law 7).
- NEVER: an expo package, EAS, AsyncStorage for tokens, a `packages/db` import, a web-only
  dependency, or authored domain logic — import it (Law 11).

## Where files go — a closed set; never invent a folder

`src/` is `{auth, navigation, screens}` plus root `env.ts`, `i18n.ts` and `react-query-host.tsx`.
A new category is a plan-time call, and it changes this line and `CLAUDE.md` §6 together.

```
src/screens/<name>/       same shape as web's feature, in RN's location
  <Name>Screen.tsx        composes; holds no state; ≤80 lines
  components/<Part>.tsx   one file per component or coherent group
  hooks/use-<thing>.ts    state, network, timers
  styles.ts               screen-level layout; component geometry stays with its component
  types.ts                when two files here share a type
src/navigation/           React Navigation static config
src/auth/                 native adapters — one folder per capability
src/react-query-host.tsx  the ONE host-lifecycle adapter (AppState → focus, NetInfo → online)
```

## Commands

```
pnpm --filter @heliogrid/mobile start | ios | android | typecheck
cd apps/mobile/ios && LANG=en_US.UTF-8 pod install    # after a native dep change
```

## Rules

- **Interactive primitives come from `@heliogrid/ui`, never `react-native`** — its RN half is the
  `.native.tsx` file in the same component folder. `View`, `ScrollView`, `StyleSheet` and
  `Platform` are layout and stay allowed. Theme values come ONLY from `@heliogrid/theme`.
- **`src/i18n.ts` is imported FIRST** — it pulls `@heliogrid/i18n/rn`, whose side effects install
  the Hermes Intl polyfills. Language comes from `@heliogrid/i18n/react`, never `@lingui/react`.
  `App.tsx` builds ONE runtime per mount; a screen never calls `i18n.activate` itself, because it
  cannot know whether that catalog is loaded.
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
  `src/navigation/routes/<module>.ts`; its param type, deep link and auth gate follow. Screens
  receive `route` only; navigation comes from `useNavigation()`. **Navigation chrome lives here,
  never in `@heliogrid/ui`** — a component that knows route names is not a design-system
  component; the shell takes items as PROPS.
- **Styling layers:** components own pixels (`@heliogrid/ui`); screens own layout in the screen
  folder (`StyleSheet` + `theme.*`); no inline style object for a visual value (ADR-0026).
- Repository types are INFERRED from contracts, never re-declared. Protocol constants
  (`OTP_LENGTH`, `OTP_EXPIRY_SECONDS`) come from `@heliogrid/domain`; the calling code and
  national-number length do NOT — those are market facts in `pack.formats`.
- A screen component body is capped at 80 lines. **Never a `components.tsx` or `hooks.ts`
  grab-bag** — a file named for its layer instead of its job is the same defect as `*-part2`.
- Paginated screens: `FlatList` + `usePaginatedList`, never inside a `ScrollView`. API failures
  render a shared error component; `ApiErrorText` is owed to `packages/ui`.
- This app deliberately skips `@heliogrid/config` and extends `@react-native/typescript-config`,
  hand-mirroring the base strictness flags — a new flag in `tsconfig.base.json` must be copied
  here by hand or it silently does not apply.
- Firebase is LIVE. Geist and Noto TTFs are bundled; verify Devanagari on BOTH simulators.

## Done means

Runs on BOTH simulators · typecheck green · the per-screen DoD in
`docs/prd/foundations/F7-design-language.md` `F7-43`.
