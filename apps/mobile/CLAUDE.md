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
RN UI components: `src/ui` (mirror of packages/ui — Law 7). Parity with web is a TYPECHECK,
not a gallery comparison: `src/ui/api-parity.ts` asserts this platform against
`@heliogrid/ui-api`. Drift fails THIS app's typecheck and names the component.

## Local conventions
- **RN keeps `src/screens/<name>/` — it is NOT migrating to web's `features/` shape** (ADR-0022
  Consequences). RN has no router-driven `app/` directory, so screen folders already are the
  equivalent. The asymmetry is deliberate; do not "align" one to the other.
- Theme ONLY from `@heliogrid/tokens/theme`. Import UI ONLY from `src/ui` index.
- **Styling layers:** components own pixels (`src/ui` index only); screens own layout in the
  screen folder (StyleSheet + `theme.*`); no inline style objects for visual values.
- i18n: `@heliogrid/i18n` + runtime `<Trans id="...">` (macros banned). Intl polyfills
  in `src/i18n.ts` FIRST.
- Auth tokens via `src/auth/keychain-storage.ts` — never anywhere else.
- **Inside a screen folder, structure follows need** — the same shape as web, in RN's own
  location (ADR-0022): `<Name>Screen.tsx` composes and holds no state · `components/` one file
  per component or coherent group · `hooks/use-<thing>.ts` for state, network and timers ·
  `styles.ts` owns screen-level layout, component-local geometry stays with its component ·
  `types.ts` when two files share a type. A screen component body is capped at
  80 lines (Biome). **Never a `components.tsx` or `hooks.ts` grab-bag** — a file named for its
  layer instead of its job is the same defect as `*-part2`. `src/` is the closed
  set `{auth,data,navigation,push,screens,ui}` + root files `i18n.ts` and `env.ts`
  (`hooks/` is an approved category for app-wide hooks but does not exist yet — screen
  hooks live in their screen folder).
  `env.ts` is the app's ONE configuration decision point: bare RN has no runtime
  `process.env`, so it hands a source to `@heliogrid/env/native`, which owns the schema
  and the validation. There is deliberately no `src/config/` — a new folder category
  would need an ADR (Law 2).
- Navigation by typed route name from `src/navigation/routes.ts` — never prop callbacks.
  `App.tsx` renders `RootNavigator` and never imports a screen (dep-cruiser
  `mobile-app-entry-thin`, severity `error` since ADR-0020's navigation slice landed).

## Landmines
- **A screen that fetches, holds state, renders and styles in one file passes every gate**
  (2026-07-31: LoginScreen hit 446 lines, GalleryScreen 406 — both since split into
  `components/`, `hooks/`, `styles.ts`). Only the 80-line cap catches this shape. When a
  screen grows, extract the hook first — logic is what makes the file unreadable, not markup.
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
Runs on BOTH simulators · typecheck green · CLAUDE.md §Commands + docs/10 §10 (per-screen DoD).
