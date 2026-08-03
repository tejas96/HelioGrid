---
paths:
  - "apps/mobile/**"
---

# apps/mobile — React Native

Architecture: `docs/architecture.md` §2 apps/mobile · §3 platform rules.

## Where files go

`src/` is a CLOSED set — `{auth, lib, navigation, push, screens, ui}` plus root `env.ts` and
`i18n.ts`.

```
src/screens/<name>/         same shape as web's feature, in RN's location
  <Name>Screen.tsx          composes; holds no state; ≤80 lines (Biome)
  components/<Part>.tsx     one file per component or coherent group
  hooks/use-<thing>.ts      state, network, timers
  styles.ts                 screen-level layout; component geometry stays with its component
  types.ts                  when two files here share a type
src/ui/                     the RN design-system half, parity-locked to @heliogrid/ui-api
src/navigation/             React Navigation static config
src/auth/ · src/push/       native adapters — one folder per capability
src/lib/                    app-level helpers that are NOT design-system primitives; no copy
```

## Rules

- **Interactive primitives come from `apps/mobile/src/ui`, never `react-native`** —
  AppText, Input, OtpInput, Button, IconButton, Switch, Checkbox, Radio. `View`,
  `ScrollView`, `StyleSheet` and `Platform` are layout and stay allowed. Biome enforces this
  under `src/screens/**`; the rule binds everywhere in `src/`, including `src/lib` and
  `src/navigation`, which lint does not reach.
- **No web-only dependency.** Anything reaching for `document`, `window` or a DOM library
  fails at runtime on device, not at build (Law 10).
- **Native capability (camera, storage, notifications, keychain) is isolated** in its own
  module under `src/`, never called inline from a screen.
- **Bare RN, not Expo.** No `expo-*` package, no EAS config: the build is Gradle/Xcode
  directly. Adding an Expo module is a plan-time decision, not an implementation one.
- **RN suspends timers when backgrounded** — any countdown or elapsed-time calculation is
  wall-clock (timestamp math), never an interval decrement.
- apps/mobile deliberately skips `@heliogrid/config` and extends
  `@react-native/typescript-config`, hand-mirroring the base strictness flags — a new flag in
  `tsconfig.base.json` must be copied here by hand or it silently does not apply.
