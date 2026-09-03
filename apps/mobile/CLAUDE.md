# @heliogrid/mobile — bare React Native (iOS + Android), NO Expo anywhere

Traps: `docs/engineering/landmines.md` · deps and platform rules: `architecture.md` §2
apps/mobile, §3 · screen-authoring rules: `.claude/rules/mobile-platform.md`.

## What lives here / what must never live here

- Field-first RN app: My Day, leads, quick-add, surveys, visits, notifications, profile, signup,
  invite accept. Screens land per module from the same contract as web; which platform ships a
  screen first is a plan decision, but the prop contract stays in parity (Law 7).
- NEVER: an expo package, EAS, AsyncStorage for tokens, a `packages/db` import, or authored
  domain logic — import it (Law 11).

## Folder shape — a closed set; never invent a folder

```
src/{auth,navigation,screens}
src/screens/<name>/   <Name>Screen.tsx composes · components/ one per component ·
                      hooks/use-<thing>.ts the logic · styles.ts · types.ts
env.ts · i18n.ts · react-query-host.tsx    root; the ONE host-lifecycle adapter
```

Web and mobile use the SAME shape: `src/screens/<name>/` is web's `features/<capability>/`. Only
the path and a few filenames differ. A new folder category is a plan-time call, and it changes
this line and `.claude/rules/mobile-platform.md` together.

## Commands

```
pnpm --filter @heliogrid/mobile start                 # metro
pnpm --filter @heliogrid/mobile ios | android | typecheck
cd apps/mobile/ios && LANG=en_US.UTF-8 pod install    # after a native dep change
```

## Local conventions

- Where UI, data, forms, shared copy and shared types come from is
  `.claude/rules/cross-platform.md`, not restated here. RN specifics: theme ONLY from
  `@heliogrid/theme`, UI ONLY from `@heliogrid/ui`, and `src/i18n.ts` FIRST — it imports
  `@heliogrid/i18n/rn`, whose side effects install the Intl polyfills.
- **Language comes from `@heliogrid/i18n/react`**, never `@lingui/react`, which this app does not
  declare. `App.tsx` builds ONE runtime per mount; a screen never calls `i18n.activate` itself,
  because it cannot know whether that catalog is loaded.
- **Styling layers:** components own pixels (`@heliogrid/ui`); screens own layout in the screen
  folder (StyleSheet + `theme.*`); no inline style object for a visual value.
- **Navigation is React Navigation 7 STATIC config.** `src/navigation/root.tsx` holds the one
  route map and the param list is INFERRED — there is no `RootStackParamList` to write. Adding a
  screen is ONE entry in `src/navigation/routes/<module>.ts`; its param type, deep link and auth
  gate follow. Screens receive `route` only; navigation comes from `useNavigation()`.
- **Navigation chrome lives in `src/navigation/`, never in `@heliogrid/ui`** — a component that
  knows route names is not a design-system component. The shell takes items as PROPS.
- Auth tokens go through `src/auth/keychain-storage.ts`, never anywhere else.
- Repository types are INFERRED from contracts, never re-declared: import the exported schema
  type. Protocol constants (`OTP_LENGTH`, `OTP_EXPIRY_SECONDS`) come from `@heliogrid/domain`;
  the calling code and national-number length do NOT — those are market facts in `pack.formats`.
- A screen component body is capped at 80 lines. **Never a `components.tsx` or `hooks.ts`
  grab-bag** — a file named for its layer instead of its job is the same defect as `*-part2`.
- Paginated screens: `FlatList` + `usePaginatedList`, never inside a `ScrollView`.
- API failures render a shared error component, never a hand-written string. `ApiErrorText` is
  owed to `packages/ui` so both platforms share one.
- Firebase is LIVE (`google-services.json` + `GoogleService-Info.plist` committed). Geist and
  Noto TTFs are bundled; verify Devanagari on BOTH simulators.

## Done means

Runs on BOTH simulators · typecheck green · the per-screen DoD in
`docs/prd/foundations/F7-design-language.md` `F7-43`.
