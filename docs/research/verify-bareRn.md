VERDICT SUMMARY (bare RN / no Expo, July 2026):
1. PowerSync — SUPPORTED (with required Metro config).
2. Better Auth — WORKS WITH CAVEATS (custom keychain/AsyncStorage adapter OK; expoClient plugin still pulls Expo deps).
3. Lingui v5 Metro transformer — SUPPORTED.

---

### 1. @powersync/react-native on bare RN — VERDICT: YES

Officially supports bare React Native CLI, not just Expo. Requirements/evidence:
- Native SQLite peer dep `@op-engineering/op-sqlite` (v1.17.0+ per PowerSync docs), a native module needing `pod install`. op-sqlite 17.x lists **New Architecture (Fabric/TurboModule) support for iOS+Android** on React Native Directory; New Arch is default in RN 0.76+, so PowerSync runs on New Arch through op-sqlite.
- **Critical bare-RN caveat:** `@powersync/react-native` "does not work well with inline requires." You must disable inline requires in `metro.config.js` via a `getTransformOptions` blockList for `require.resolve('@powersync/react-native')`.
- On RN without Expo, use the **WebSocket transport** (not the default) per docs.
- Optional: `@babel/plugin-transform-async-generator-functions` + `@azure/core-asynciterator-polyfill` for async-iterator watched queries.

Sources: [npm](https://www.npmjs.com/package/@powersync/react-native) · [PowerSync RN docs](https://docs.powersync.com/client-sdk-references/react-native-and-expo/react-native-web-support) · [op-sqlite RN Directory](https://reactnative.directory/package/@op-engineering/op-sqlite/versions) · [op-sqlite npm](https://www.npmjs.com/package/@op-engineering/op-sqlite)

### 2. Better Auth client on bare RN (no expo plugin) — VERDICT: WORKS, WITH CAVEATS

- Core `createAuthClient` (`better-auth/react`) is framework-agnostic and runs on bare RN. Token/cookie persistence is pluggable: the client `storage` option only needs an object implementing **`getItem`/`setItem`**, so a thin wrapper over `react-native-keychain` (secure, recommended for tokens) or `AsyncStorage` works. Session cookie is read via `getCookie()`; disable caching with `disableCache`.
- **Caveat 1:** The documented path is the `@better-auth/expo` plugin, which depends on `expo-secure-store` and `expo-network`. A pure bare-RN path (zero Expo packages) is **not officially documented** — you either install the `expo` modules or hand-roll cookie handling (attach the `Cookie`/`Set-Cookie` header yourself and persist via keychain).
- **Caveat 2 (known issue):** Better Auth generates storage keys with **colon separators** (`prefix:cookie`). `expo-secure-store` rejects colons; `react-native-keychain`/`AsyncStorage` tolerate them, so a custom adapter is actually cleaner. See GitHub issues [#6810](https://github.com/better-auth/better-auth/issues/6810), [#5426](https://github.com/better-auth/better-auth/issues/5426), [#1551 (node:buffer polyfill)](https://github.com/better-auth/better-auth/issues/1551).

Sources: [Better Auth Expo docs](https://better-auth.com/docs/integrations/expo) · [@better-auth/expo npm](https://www.npmjs.com/package/@better-auth/expo) · [LogRocket guide](https://blog.logrocket.com/react-native-authentication-with-better-auth-and-expo/)

### 3. Lingui v5 Metro transformer on bare RN — VERDICT: YES

- `@lingui/metro-transformer` works without Expo. In `metro.config.js` set `transformer.babelTransformerPath = require.resolve("@lingui/metro-transformer/react-native")` and add `"po","pot"` to `resolver.sourceExts` (merge with `@react-native/metro-config`).
- Supports **RN ≥ 0.73** (and Expo SDK 50+). After config, run `npx react-native start --reset-cache`.
- Also install `@lingui/core` + `@lingui/react`; add Intl polyfills `@formatjs/intl-locale` and `@formatjs/intl-pluralrules`. Docs flag the transformer as relatively new/"beta" and `.po/.pot`-only.

Sources: [Lingui Metro transformer](https://lingui.dev/ref/metro-transformer) · [Lingui RN tutorial](https://lingui.dev/tutorials/react-native) · [Lingui 5.0 announcement](https://lingui.dev/blog/2024/11/28/announcing-lingui-5.0)