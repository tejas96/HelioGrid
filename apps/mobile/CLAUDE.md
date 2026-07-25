# @heliogrid/mobile — bare React Native (iOS + Android), NO Expo anywhere

## What lives here / what must never live here
- Field-first RN app: My Day, leads, quick-add, surveys, visits, notifications, profile
  (screens land per-module in LOCKSTEP with web — same slice, same contract).
- ALL data access behind `src/data/repositories.ts` interfaces — Track E swaps PowerSync
  in as a data-layer-only change. Screens never see fetch/SQLite/sync.
- NEVER: expo packages, EAS, AsyncStorage for tokens, direct packages/db imports,
  domain logic (webview studio + contracts only).

## Commands
pnpm --filter @heliogrid/mobile start                 # metro
pnpm --filter @heliogrid/mobile ios | android         # run on simulator/emulator
pnpm --filter @heliogrid/mobile typecheck
cd apps/mobile/ios && pod install                     # after native dep changes

## Depends on / depended on by
uses: @heliogrid/tokens (theme), @heliogrid/contracts        used by: nobody

## Local conventions
- Theme ONLY from `@heliogrid/tokens/theme` (same token names as web, px→dp).
- Text through Lingui macros (`<Trans>`, `t`); catalogs `src/locales/*/messages.po`
  (moves to packages/i18n with Track A). Intl polyfills load in `src/i18n.ts` FIRST.
- Auth tokens via `src/auth/keychain-storage.ts` (Better Auth adapter) — never anywhere else.
- Targets ≥44pt, safe-area insets everywhere, arc-bar nav per DS when nav lands.

## Landmines
- metro.config.js carries the monorepo + Lingui transformer wiring AND the note about
  PowerSync's Track-E blockList — runtime breakage if removed, not build errors.
- Firebase is LIVE (project `heliogrid-app`, both apps registered as `com.heliogrid.app`
  — docs/ops/firebase-setup.md): google-services.json + GoogleService-Info.plist are
  committed and wired (gradle plugin 4.5.0 / Xcode Resources phase). RNFB auto-inits.
  iOS REMOTE push still needs the APNs .p8 upload (Apple Developer account paperwork);
  Android FCM + Notifee local notifications work today.
- Geist/Noto static TTFs (400/500/600/700) are NOT bundled yet — system fonts render
  meanwhile; `theme.fonts.staticFamilyByWeight` documents the target names. Devanagari
  needs the `<AppText>` run-splitting primitive when fonts land (docs/10 §7.5) — verify
  rendered output on BOTH simulators, not config.
- pnpm symlinked node_modules: metro resolves via watchFolders/nodeModulesPaths — do not
  hoist or dedupe by hand. Native builds resolve THREE packages from the app's own
  node_modules that pnpm won't hoist — they are direct devDependencies ON PURPOSE:
  `@react-native/gradle-plugin` (settings.gradle includeBuild), `@react-native/codegen`
  (library codegen tasks), `@react-native/metro-config`. Removing any breaks the build.
- iOS Podfile carries `use_modular_headers!` — react-native-firebase's Swift pods
  (FirebaseCoreInternal/GoogleUtilities) fail pod install without it.
- babel.config.js needs `@babel/plugin-transform-class-static-block` — the formatjs Intl
  polyfills use static class blocks and the Lingui metro transformer's babel pass does
  not enable them by default (red screen at runtime, not build time).

## Definition of done here
Change runs on BOTH simulators (iPhone + Pixel) · typecheck green · screens meet the
DS DoD (375-width, states, Hindi render) once real screens land.
