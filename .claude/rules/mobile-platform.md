---
paths:
  - "apps/mobile/**"
---

# apps/mobile — React Native platform boundary

Platform law: `docs/architecture.md` §3. This file is what that law means at edit time.

- **Interactive primitives come from `apps/mobile/src/ui`, never `react-native`** —
  AppText, Input, OtpInput, Button, IconButton, Switch, Checkbox, Radio. `View`,
  `ScrollView`, `StyleSheet` and `Platform` are layout and stay allowed. Biome enforces this
  under `src/screens/**`; the rule binds everywhere in `src/`, including `src/lib` and
  `src/navigation`, which lint does not reach (docs/17 §5 records the gap).
- **No web-only dependency.** Anything reaching for `document`, `window` or a DOM library
  fails at runtime on device, not at build (Law 10).
- **Native capability (camera, storage, notifications, keychain) is isolated** in its own
  module under `src/` — today `push/` and `auth/` — never called inline from a screen.
- **Bare RN, not Expo.** No `expo-*` package, no EAS config: the build is Gradle/Xcode
  directly. Adding an Expo module is a plan-time decision, not an implementation one.
- **RN suspends timers when backgrounded** — any countdown or elapsed-time calculation is
  wall-clock (timestamp math), never an interval decrement.
- `src/` is a CLOSED set of folder categories (`docs/architecture.md` §2 apps/mobile); a new
  one is a plan-time call.
- apps/mobile deliberately skips `@heliogrid/config` and extends
  `@react-native/typescript-config`, hand-mirroring the base strictness flags — a new flag in
  `tsconfig.base.json` must be copied here by hand or it silently does not apply.
