# ADR-0011: Mobile — bare React Native (no Expo), iOS + Android from day one

Date: 2026-07-24

## Context

The product owner issued a binding directive: **pure/bare React Native, no Expo, both platforms from day one.** The research corpus was originally written Expo-first (PowerSync, Better Auth and Lingui guidance all referenced Expo); a dedicated verification pass confirmed the full stack works on bare RN.

## Decision

**Bare React Native for `apps/mobile`** — field-first app (My Day, leads, quick-add, offline surveys, visits, notifications); the studio opens as an authenticated WebView (ADR-0017). Verified stack on bare RN:

- **PowerSync**: supported via `@op-engineering/op-sqlite` (New Architecture OK); requires the metro inline-requires blockList and WebSocket transport (ADR-0009).
- **Better Auth**: framework-agnostic client + custom `react-native-keychain` storage adapter (ADR-0010).
- **Lingui v5**: `@lingui/metro-transformer` works without Expo on RN ≥0.73 (ADR-0015).
- **Push**: Notifee + react-native-firebase, FCM/APNs direct (no Expo Push).

## Consequences

Honest costs, all accepted with the directive:

- **We own the native projects** — Xcode/Gradle upgrades, pod churn, signing, every native-module linking decision Expo CNG would have automated.
- **macOS CI lane is mandatory** for iOS builds.
- **No OTA-updates story in v1** — without expo-updates, every JS fix rides a store review cycle. This is a real operational constraint on mobile hotfixes; a self-hosted OTA solution is a post-launch evaluation, not a v1 commitment.
- No Expo Go for quick iteration; dev builds only.
- Store-review lead time affects only the **public store listing** — TestFlight/Play-internal distribution from Day 5 is the Day-20 launch reality (lockstep directive 2026-07-24: mobile ships in the same slices as web, never as a follow-up).
- Upside: no Expo SDK version treadmill, no config-plugin abstraction between us and native code, smaller dependency surface for an agent to reason about.

## Alternatives rejected

- **Expo (managed)** — excluded outright by directive; also incompatible with our native-module set without CNG anyway.
- **Expo CNG / dev builds** — the pragmatic middle the research assumed; rejected by directive. Recorded consequence: we re-implement by hand what its config plugins automate.
- **Flutter / native twins** — forks the TypeScript domain and contracts story; never in contention.

## Sources

- `../research/verify-bareRn.md` (the enabling verification) · `../research/sync.md` · `../research/auth.md` (Expo-assumption superseded)
- https://docs.powersync.com/client-sdk-references/react-native-and-expo/react-native-web-support · https://www.npmjs.com/package/@op-engineering/op-sqlite
- https://lingui.dev/ref/metro-transformer
- BLUEPRINT.md — Final-review directive 3 (user-confirmed, binding)
