# @heliogrid/mobile — bare React Native (iOS + Android), NO Expo anywhere

## What lives here / what must never live here
- Field-first RN app: My Day, leads, quick-add, surveys, visits, notifications, profile,
  signup (Law 7 lockstep with web), invite accept. Screens land per-module in LOCKSTEP
  with web — same slice, same contract.
- ALL data access behind `src/data/repositories.ts` — screens never see fetch/SQLite/sync.
- NEVER: expo packages, EAS, AsyncStorage for tokens, direct packages/db imports,
  domain logic (webview studio + contracts only).

## Commands
pnpm --filter @heliogrid/mobile start                 # metro
pnpm --filter @heliogrid/mobile ios | android         # run on simulator/emulator
pnpm --filter @heliogrid/mobile typecheck
cd apps/mobile/ios && LANG=en_US.UTF-8 pod install    # after native dep changes

## Depends on / depended on by
uses: @heliogrid/tokens (theme), @heliogrid/contracts, @heliogrid/i18n
nav: @react-navigation/native + native-stack + react-native-screens (ADR-0020)
used by: nobody
RN UI components: `src/ui` (mirror of packages/ui — Law 7)

## Local conventions
- Theme ONLY from `@heliogrid/tokens/theme`. Import UI ONLY from `src/ui` index.
- **Styling layers:** components own pixels (`src/ui` index only); screens own layout in the
  screen folder (StyleSheet + `theme.*`); no inline style objects for visual values.
- i18n: `@heliogrid/i18n` + runtime `<Trans id="...">` (macros banned). Intl polyfills
  in `src/i18n.ts` FIRST.
- Auth tokens via `src/auth/keychain-storage.ts` — never anywhere else.
- Screen folders: CLAUDE.md §Structure (`<Name>Screen.tsx` + satellites). `src/` is the closed
  set `{auth,data,hooks,navigation,push,screens,ui}` + `i18n.ts`.
- Navigation by typed route name from `src/navigation/routes.ts` — never prop callbacks.
  `App.tsx` renders `RootNavigator` and never imports a screen (dep-cruiser
  `mobile-app-entry-thin`, severity `error` since ADR-0020's navigation slice landed).

## Landmines
- **Repository types are INFERRED from contracts, never re-declared.** `HealthStatus` was a
  hand-written interface duplicating the liveness 200 schema; a contract gaining a field
  drifted silently. Import the exported schema type (`Liveness`) instead.
- **Protocol constants come from contracts** (`OTP_LENGTH`, `PHONE_NSN_LENGTH`,
  `COUNTRY_CALLING_CODE`). This screen used to define its own `OTP_LEN`/`PHONE_LEN`, so a
  server-side OTP-length change would leave the boxes rendering the old count.
- `pod install` fails with `Unicode Normalization not appropriate for ASCII-8BIT` unless the
  shell locale is UTF-8 — prefix `LANG=en_US.UTF-8` (hit 2026-07-27 adding react-native-screens).
- **apps/mobile pins `zod` explicitly (3.25.76)** like api/worker. Without it pnpm resolved
  `@ts-rest/core`'s zod peer to the transitive **zod 4** in the store and the typed client
  collapsed to `never` — every `api.*` call became a type error (hit 2026-07-27).
- Biome `a11y/useValidAriaRole` is OFF for this app (biome.json override): `AppText`'s
  `role` is a TYPOGRAPHY role (`body`/`h2`/`overline`), not an ARIA role, and RN is not the
  DOM — real RN a11y goes through `accessibilityRole`, which the components already set.
  The rule only fired on static literals, so it flagged correct code inconsistently.
- Cookies: EVERY fetch `credentials: 'omit'` — keychain jar is the only cookie path.
  iOS CFNetwork merges stored cookies → 401 without `absorbSetCookies` (getSetCookie).
- metro.config.js: monorepo + Lingui transformer + PowerSync blockList — do not remove.
- Firebase LIVE (google-services.json + GoogleService-Info.plist committed).
- Geist/Noto TTFs 400/500/600/700 bundled (`assets/fonts/`, react-native.config.js).
  Devanagari via `<AppText>` run-splitting — verify on BOTH simulators.
- pnpm symlinked node_modules: do not hoist by hand. Direct devDeps on mobile for
  `@react-native/gradle-plugin`, `@react-native/codegen`, `@react-native/metro-config`.
- Podfile `use_modular_headers!` required for react-native-firebase.
- babel: `@babel/plugin-transform-class-static-block` for formatjs polyfills.

## Definition of done here
Runs on BOTH simulators · typecheck green · CLAUDE.md §Definition of done for screens.
