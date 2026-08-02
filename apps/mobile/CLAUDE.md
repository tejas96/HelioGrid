# @heliogrid/mobile — bare React Native (iOS + Android), NO Expo anywhere

## What lives here / what must never live here
- Field-first RN app: My Day, leads, quick-add, surveys, visits, notifications, profile,
  signup, invite accept. Screens land per-module from the same contract as web; which
  platform ships a screen first is a plan decision, but `src/ui` stays in parity (Law 7).
- ALL data access behind `@heliogrid/data` — this app authors no networking. The repository
  interfaces are shared with web, so the Track E PowerSync swap is one change, not two.
- NEVER: expo packages, EAS, AsyncStorage for tokens, direct packages/db imports, or
  **authoring** domain logic here — shared decisions, policy constants and formatters are
  IMPORTED from `@heliogrid/domain`; writing one inline is the defect.

## Commands
pnpm --filter @heliogrid/mobile start                 # metro
pnpm --filter @heliogrid/mobile ios | android         # run on simulator/emulator
pnpm --filter @heliogrid/mobile typecheck
cd apps/mobile/ios && LANG=en_US.UTF-8 pod install    # after native dep changes

## Dependency policy
docs/architecture.md §2 apps/mobile; platform rules §3 (React Native). `@heliogrid/data` is
THE data path — transport, repositories, session; this app authors none. Shared login
types, policy constants and formatters are imported from `@heliogrid/domain`, never
re-authored (Law 11).
nav: @react-navigation/native + native-stack + bottom-tabs + elements + react-native-screens
RN UI components: `src/ui` (mirror of packages/ui — Law 7). Parity with web is a TYPECHECK,
not a gallery comparison: `src/ui/api-parity.ts` asserts this platform against
`@heliogrid/ui-api`. Drift fails THIS app's typecheck and names the component.

## Local conventions
- **RN keeps `src/screens/<name>/` — it is NOT migrating to web's `features/` shape.** RN has no router-driven `app/` directory, so screen folders already are the
  equivalent. The asymmetry is deliberate; do not "align" one to the other.
- Theme ONLY from `@heliogrid/tokens/theme`. Import UI ONLY from `src/ui` index.
- **Styling layers:** components own pixels (`src/ui` index only); screens own layout in the
  screen folder (StyleSheet + `theme.*`); no inline style objects for visual values.
- i18n: `@heliogrid/i18n` + runtime `<Trans id="...">` (macros banned). Intl polyfills
  in `src/i18n.ts` FIRST.
- Forms: `useZodForm(<contract schema>)` from `@heliogrid/forms`; wire fields with its
  `Controller`; map server rejections with `applyServerErrors`. react-hook-form directly
  is a lint failure. Live example: gallery Patterns sections.
- API failures render `<ApiErrorText error={e} />` (src/lib/ApiErrorText.tsx) — never a
  hand-written failure string. Paginated screens: `FlatList` + `usePaginatedList`
  (`onEndReached={fetchNextPage}`) — never inside a ScrollView.
- Copy BOTH platforms need lives in `packages/i18n/src/copy` (extractor-swept, enum-keyed
  Record). Screen-specific copy stays in its screen. Platform files hold presentation only.
- Auth tokens via `src/auth/keychain-storage.ts` — never anywhere else.
- **Inside a screen folder, structure follows need** — the same shape as web, in RN's own
  location: `<Name>Screen.tsx` composes and holds no state · `components/` one file
  per component or coherent group · `hooks/use-<thing>.ts` for state, network and timers ·
  `styles.ts` owns screen-level layout, component-local geometry stays with its component ·
  `types.ts` when two files share a type. A screen component body is capped at
  80 lines (Biome). **Never a `components.tsx` or `hooks.ts` grab-bag** — a file named for its
  layer instead of its job is the same defect as `*-part2`. `src/` is the closed
  set `{auth,lib,navigation,push,screens,ui}` + root files `i18n.ts` and `env.ts`
  (`lib/` added 2026-08-02, named to match web's: app-level components and helpers that are
  NOT design-system primitives, `ApiErrorText` first. It holds NO copy — copy lives in
  `@heliogrid/i18n`. It was briefly `ui-copy/`, a name that invited the very per-platform
  copy duplication the rule above forbids.)
  (`data` left 2026-08-01 for `@heliogrid/data`; `auth/` holds only the keychain adapter)
  (`hooks/` is an approved category for app-wide hooks but does not exist yet — screen
  hooks live in their screen folder).
  `env.ts` is the app's ONE configuration decision point: bare RN has no runtime
  `process.env`, so it hands a source to `@heliogrid/env/native`, which owns the schema
  and the validation. There is deliberately no `src/config/` — a new folder category is a
  plan-time call, not something to add mid-diff.
- **Navigation is React Navigation 7's STATIC config.** `src/navigation/root.tsx` holds the
  one route map and the param list is INFERRED — there is no `RootStackParamList` to write.
  Adding a screen is ONE entry in `src/navigation/routes/<module>.ts`; its param type, deep
  link and auth gate all follow. Screens receive `route` ONLY — navigation comes from
  `useNavigation()`, never a prop; params come from the screen's own `StaticScreenProps<…>`.
  `App.tsx` renders `AppNavigation` and never imports a screen (dep-cruiser
  `mobile-app-entry-thin`, severity `error`).

## Landmines
- **Navigation groups are keyed by CAPABILITY, never by role.** Roles are stackable
  (`role_preset[]`, OR-across, widest visibility), so a role-keyed group declares a shared
  screen twice — and a duplicate route name is a hard THROW, not a warning. The OR-across
  resolution belongs in `@heliogrid/domain`, defined once.
- **The tab bar lives in `src/navigation/`, never `src/ui/`.** The component index is checked
  against `@heliogrid/ui-api`; an RN-only component fails `UncoveredComponents` (Law 7).
- **The root navigator must never be empty.** Every group is `if`-gated, so a `Boot` route
  sits ungrouped to guarantee one screen always renders — an empty navigator throws.
  `src/navigation/phase.tsx` computes ONE phase value for this reason: per-guard timers can
  disagree for a frame and leave zero screens mounted.
- **A screen that fetches, holds state, renders and styles in one file passes every gate**
  (2026-07-31: LoginScreen hit 446 lines, GalleryScreen 406 — both since split into
  `components/`, `hooks/`, `styles.ts`). Only the 80-line cap catches this shape. When a
  screen grows, extract the hook first — logic is what makes the file unreadable, not markup.
- **Repository types are INFERRED from contracts, never re-declared** (now enforced in
  `@heliogrid/data`). `HealthStatus` was a hand-written interface duplicating the liveness
  200 schema; a contract gaining a field drifted silently. Import the exported schema type
  (`Liveness`) instead.
- **Protocol constants come from `@heliogrid/domain`** (`OTP_LENGTH`, `PHONE_NSN_LENGTH`,
  `COUNTRY_CALLING_CODE`) — they lived in contracts until 2026-08-01 and moved down a layer
  with the auth teardown, because domain outlives a contract being deleted and rebuilt. The
  phone pair is the IN market's spec and becomes injected market-pack config when packs land
  (global ruling 2026-08-02). This screen used to define its own `OTP_LEN`/`PHONE_LEN`, so a
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
- Cookies: `credentials: 'omit'`, keychain jar only — iOS CFNetwork otherwise merges its
  copy into our header and the server 401s. Enforced in `@heliogrid/data`'s transport;
  recorded here because this is the platform it bites.
- metro.config.js holds monorepo resolution only (`watchFolders` + `nodeModulesPaths` for
  pnpm workspace packages) plus a note that PowerSync (Track E) WILL add an inline-requires
  blockList — do not remove either. There is no Lingui transformer: the runtime
  `<Trans id>` convention needs none.
- Firebase LIVE (google-services.json + GoogleService-Info.plist committed).
- Geist/Noto TTFs 400/500/600/700 bundled (`assets/fonts/`, react-native.config.js).
  Devanagari via `<AppText>` run-splitting — verify on BOTH simulators.
- pnpm symlinked node_modules: do not hoist by hand. Direct devDeps on mobile for
  `@react-native/gradle-plugin`, `@react-native/codegen`, `@react-native/metro-config`.
- Podfile `use_modular_headers!` required for react-native-firebase.
- babel: `@babel/plugin-transform-class-static-block` for formatjs polyfills.

## Definition of done here
Runs on BOTH simulators · typecheck green · CLAUDE.md §Commands + docs/10 §10 (per-screen DoD).
