---
paths:
  - "apps/mobile/**"
---

# apps/mobile — React Native

Architecture: `docs/engineering/architecture.md` §2 apps/mobile, §3. App shape, commands and
conventions: `apps/mobile/CLAUDE.md`. Traps: `docs/engineering/landmines.md`.

## Where files go

`src/` is a CLOSED set — `{auth, navigation, screens}` plus root `env.ts`, `i18n.ts` and
`react-query-host.tsx`. A new category is a plan-time call.

```
src/screens/<name>/         same shape as web's feature, in RN's location
  <Name>Screen.tsx          composes; holds no state; ≤80 lines
  components/<Part>.tsx     one file per component or coherent group
  hooks/use-<thing>.ts      state, network, timers
  styles.ts                 screen-level layout; component geometry stays with its component
  types.ts                  when two files here share a type
src/navigation/             React Navigation static config
src/auth/                   native adapters — one folder per capability
src/react-query-host.tsx    the ONE host-lifecycle adapter (AppState → focus, NetInfo → online)
```

## Rules

- **Interactive primitives come from `@heliogrid/ui`, never `react-native`** — its RN half is the
  `.native.tsx` file in the same component folder. `View`, `ScrollView`, `StyleSheet` and
  `Platform` are layout and stay allowed.
- **No web-only dependency.** Anything reaching for `document`, `window` or a DOM library fails at
  runtime on device, not at build (Law 10).
- **Native capability** — camera, storage, notifications, keychain — is isolated in its own module
  under `src/`, never called inline from a screen.
- **Host lifecycle is installed once, at the root.** `ReactQueryHost` refcounts its install and
  cleanup so a Strict Mode double-mount produces ONE listener set and a remount leaks none. A
  screen must never call `focusManager` or `onlineManager` itself. This is focus and reconnect
  only: there is no offline persistence and no mutation queue.
- **Bare RN, not Expo.** No `expo-*` package, no EAS: the build is Gradle and Xcode directly.
  Adding an Expo module is a plan-time decision.
- **RN suspends timers when backgrounded** — any countdown or elapsed-time calculation is
  wall-clock timestamp maths, never an interval decrement.
- `apps/mobile` deliberately skips `@heliogrid/config` and extends
  `@react-native/typescript-config`, hand-mirroring the base strictness flags — a new flag in
  `tsconfig.base.json` must be copied here by hand or it silently does not apply.
