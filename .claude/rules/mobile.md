# Rules — apps/mobile (bare React Native, iOS + Android)

NO Expo anywhere: no expo packages, no EAS. We own `ios/` and `android/` natively.

## Non-negotiable wiring (verified July 2026 — see docs/research/verify-bareRn.md)
- **PowerSync**: `@powersync/react-native` + `@op-engineering/op-sqlite` (pod install;
  New Architecture OK). metro.config.js MUST blockList inline requires for
  `@powersync/react-native`; use the WebSocket transport. Async-iterator watched queries
  need `@babel/plugin-transform-async-generator-functions` + core-asynciterator-polyfill.
- **Auth**: framework-agnostic Better Auth client + custom `storage` adapter over
  `react-native-keychain` (it tolerates Better Auth's colon-separated keys). Never
  AsyncStorage for tokens. Cookie header attached manually per the bare-RN pattern.
- **Push**: Notifee + @react-native-firebase/messaging (FCM) + APNs. Register tokens via
  `PushPort` contract.
- **i18n**: Lingui metro transformer (`babelTransformerPath` + po/pot sourceExts) +
  @formatjs Intl polyfills (intl-locale, intl-pluralrules).

## App scope (field-first)
My Day · leads + quick-add (offline dedupe check degrades gracefully) · surveys (fully
offline: guided capture, inline camera, photo queue) · visits · notifications · profile
(per-user language). The Design Studio opens as an authenticated WebView of the web
studio (session handoff via one-time token) — full parity lives in the responsive web
app; native canvas editing is NOT rebuilt. No screen may block on connectivity: queue
writes, show sync status ("3 surveys waiting · will upload on Wi-Fi"), never a spinner wall.

## Offline discipline
- All reads through PowerSync SQLite; all writes through the mutation queue → NestJS
  backend connector. No direct API calls for data that has a synced table.
- Photos: capture → local file → PowerSync attachment queue → Tigris presigned upload.
  Deleting local copies only after server-ack.
- Conflict rules are product rules: surveys append versions; a revisit NEVER overwrites v1.

## Platform hygiene
- Theme/typography from `packages/tokens` RN theme object (same semantic names as web).
- Touch targets ≥44pt, arc-bar nav per design system, safe-area insets everywhere.
- iOS + Android built and smoke-run in CI (macOS lane for iOS). A change isn't done until
  it runs on both simulators.
