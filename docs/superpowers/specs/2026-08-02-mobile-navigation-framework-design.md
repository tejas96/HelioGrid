# Mobile navigation framework + splash — design

**Date:** 2026-08-02 · **Status:** approved in brainstorming, pending owner review of this doc
**Goal:** every mobile module that lands from tomorrow onward adds its screens by editing
ONE file, with the route's param type, deep link, and auth gate following from that single
edit. The framework ships with no placeholder screens — machinery only.

## Scope

The RN app's navigation layer and its boot surface:

1. **Route definition** moves to React Navigation 7's static config API — the route map
   becomes one composed config object and `RootStackParamList` stops being hand-written.
2. **Bottom tab shell** exists as a nested navigator with the `tabBar` slot wired, carrying
   its one real member today.
3. **Splash** — a native launch screen coloured from generated tokens, and a JS boot screen,
   with no visible seam between them.
4. **Deep-link plumbing** — `heliogrid://` registered natively and the container wired, so a
   future route needs only a `linking:` line.

**Out of scope, decided during brainstorming:**

- **Placeholder screens for unbuilt modules.** Owner ruling this session: machinery only, no
  stubs. Only Login, Home, Gallery and the new Boot screen are registered. Every other route
  is authored by its owning module's slice (Law 9).
- **The arc tab bar chrome** (My Day · Leads · ⊕ · Projects · More, per `design/mockups/MyDay.dc.html`).
  Its centre FAB targets Quick Add, a CRM-slice screen — building it now would require the
  stub this spec excludes. It drops into the same `tabBar` slot when the CRM slice lands.
- **Universal links** (`https://`, iOS associated domains, Android App Links). They need a
  live domain serving `apple-app-site-association` / `assetlinks.json` plus store team IDs,
  which `docs/ops/company-registration-blockers.md` records as owner-blocked.
- **Role- and entitlement-gated navigation.** The `groups` mechanism this spec establishes is
  what will carry it, under the capability-keyed rule in **§2.2.1** — which is a correctness
  constraint, not a preference. The conditions themselves land with the auth rebuild that
  owns roles.

## 1. Why static, and what it costs

**Decision: React Navigation 7's static config API.** Verified against the installed
`@react-navigation/core@7.21.11` and `@react-navigation/native@7.3.14`, not against docs.

Three product facts drove it:

- **Deep links are load-bearing here.** The follow-up loop — voice agent completes a call →
  notification → tap → the lead timeline — is the product, and notifications + global search
  are a Track C slice. Under the dynamic API the linking map is a second file keyed by route
  names, where a wrong path fails no typecheck and simply never opens. Static puts
  `linking: 'leads/:leadId'` on the route entry itself.
- **Role-gated navigation is certain.** Six role presets, OR-across widest visibility; the
  engineer's home screen is the sign-off queue (docs/13 UXG-06), surveyors get Visits, owners
  get dashboards. Static expresses that as one `group` per **capability** (§2.2.1 — per role
  is a crash, not a style choice). The dynamic API expresses it as conditional JSX inside the
  navigator — already a ternary today with two states, and the place bugs would live at six
  stackable roles crossed with entitlements.
- **The two API shapes are mutually exclusive in the type system**, which is what makes the
  pattern self-enforcing for AI-assisted work:

  ```ts
  TypedNavigator<Bag, Config> = undefined extends Config
    ? TypedNavigatorInternal<…>   // { Navigator, Screen, Group }  ← dynamic
    : TypedNavigatorStatic<…>     // { config, getComponent, with } ← static
  ```

  Passing a config means `.Screen` does not exist. Reaching for `<Stack.Screen>` out of
  muscle memory is a compile error, not a silent half-migration.

**The costs, stated plainly:**

| Cost | Mitigation |
|---|---|
| Screens receive **no `navigation` prop** — the renderer passes `{ route }` only | Screens use `useNavigation()`. This moves *toward* `ui-adherence.md`, which already forbids navigation in presentational components and puts logic in `use-<thing>.ts` |
| `navigate()` typing depends on a global module augmentation that nothing requires | A type assertion pinned beside it (§2.3). Stops accidental deletion, not deliberate |
| `if` takes zero arguments — no `if: useHasRole('surveyor')` | One named hook per condition, bundled at group level rather than per screen |
| Every `if` hook runs on every navigator render, unconditionally and in fixed order | Accepted. Trivial per hook; a floor that rises with route count |
| Import mixups and a bad `initialRouteName` throw at **runtime**, not compile time | Accepted. Both surface on first boot, which `/qa` covers |
| `StaticParamList` is recursive conditional-type machinery — `tsc` slows and error messages degrade as the tree grows | Accepted. The roadmap projects ~35–45 mobile routes; the effect bites at deep nesting × hundreds |

**What would reverse this decision:** a requirement for tenant-configurable navigation —
white-label, screens defined per tenant from the server. Static's one hard ceiling is that
route names must be statically known object keys. The constitution rules this out (§7: "No
feature flags — entitlements are the only gating"), and entitlements gate a closed,
code-defined set. If such a requirement appears, this decision is the one to revisit.

## 2. Structure

```
apps/mobile/src/navigation/
├── index.ts          the only export app code touches — <AppNavigation/>
├── root.tsx          root static stack: groups + the type augmentation
├── route-typing.ts   asserts the augmentation landed (§2.3) — imported by nothing
├── phase.tsx         NavigationPhase provider — the single dwell/session value (§2.2)
├── tabs.tsx          bottom-tab navigator config + the tabBar slot
├── guards.ts         the `if` hooks — pure comparisons against the phase
├── linking.ts        URL prefixes + container linking options
└── routes/
    ├── auth.ts       Login
    ├── app.ts        Tabs, and future authenticated stack routes
    └── dev.ts        Gallery
```

`index.ts` exports one component, `<AppNavigation/>`, composing the phase provider around
`<Navigation/>` — so `App.tsx` renders a single element and the provider can never be
forgotten by a caller.

`src/screens/boot/BootScreen.tsx` is added under the existing screen-folder convention.
`src/`'s closed set `{auth,lib,navigation,push,screens,ui}` is unchanged — no new category.

### 2.1 The root config

```tsx
const RootStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: { Boot: { screen: BootScreen, if: useIsBooting } },
  groups: {
    Auth: { if: useIsSignedOut, screens: authScreens },
    App:  { if: useIsSignedIn,  screens: appScreens  },
    Dev:  { if: useIsDevBuild,  screens: devScreens  },
  },
});

export const Navigation = createStaticNavigation(RootStack);
```

`Boot` sits ungrouped deliberately: when every group's `if` is false, the navigator has no
screens and React Navigation throws. Boot is what guarantees a non-empty tree while
`status === 'checking'`.

The `Dev` group makes **Gallery unreachable in release builds**, where today it is a normal
route reachable from Home. To be precise about what this does and does not do: the group's
`if` returns false so the route never mounts, but `routes/dev.ts` still statically imports
`GalleryScreen`, so its code remains in the release bundle. Excluding the code as well would
need a conditional import or a Metro resolver rule — out of scope here, and not required by
anything.

### 2.2 Guards

`guards.ts` holds the `if` hooks, each reading the shared session store — no fetch of its own,
no callback threaded down. `SessionStatus` is `'checking' | 'anonymous' | 'authenticated'`
(`packages/data/src/session/types.ts`), and the three session guards partition it exactly:

| Guard | True when |
|---|---|
| `useIsBooting()` | `status === 'checking'` |
| `useIsSignedOut()` | `status === 'anonymous'`, **or** `authenticated` and still inside the dwell |
| `useIsSignedIn()` | `status === 'authenticated'` **and** `DONE_DWELL_MS` elapsed |

Mutually exclusive and exhaustive — exactly one is true for any session state, so the
navigator always has exactly one group's screens plus (or minus) Boot. `useIsSignedOut()`
covering the dwell window is deliberate, not an overlap: it keeps the login screen mounted
while its done step plays, which is the current behaviour of `RootNavigator`.

`useIsDevBuild()` — `__DEV__` — is independent of the three and gates the `Dev` group alone.

**The dwell is ONE value, held above the navigator — not a timer inside each guard.** This is
a correctness constraint, not a preference. Two of the three guards depend on whether the
dwell has elapsed; if each owned its own `useState` + `setTimeout`, the two timers could
disagree for a frame. Both landing false while `Boot` is also false leaves the navigator with
zero screens, which throws:

> `Couldn't find any screens for the navigator`
> — `useNavigationBuilder.tsx:405`

So a single `NavigationPhase` value — `'booting' | 'signedOut' | 'signedIn'` — is computed
once in a provider above `<Navigation/>`, and each guard is a pure comparison against it. The
partition is then exhaustive by construction rather than by three hooks agreeing.

The `DONE_DWELL_MS` timer moves into that provider from `RootNavigator`, with its rationale
comment intact: authentication is instant, but the login screen's done step has to be visible
for the design to survive. Timing and navigation are the app's job; the store only decides
authentication.

The session-swap invariant is preserved by construction — a false `if` returns `null`, so the
screen never enters navigation state, and a signed-out user has no authenticated screen left
in history.

### 2.2.1 Forward compatibility with RBAC — group by capability, never by role

Roles are `role_preset[]` — **stackable, OR-across-roles, widest visibility** (docs/04 §users,
docs/00 §55, ruling D27). A user can hold `sales_rep` **and** `owner` at once.

**A group per role is therefore a defect, not a style choice.** `Leads` is visible to
sales_rep and owner alike, so a role-keyed model would declare it in two groups; groups
flatten into one navigator's children, and a duplicate route name is a hard throw:

> `A navigator cannot contain multiple 'Screen' components with the same name`
> — `useNavigationBuilder.tsx:425`

Any user holding two roles that share a screen would crash on boot.

**The rule: one group per capability, one screen in exactly one group.** The hook ORs across
the user's roles internally.

```ts
groups: {
  Crm:     { if: useCanWorkLeads,   screens: crmScreens },
  Survey:  { if: useCanRunSurveys,  screens: surveyScreens },
  SignOff: { if: useCanSignOff,     screens: signOffScreens },
}
```

The OR-across-roles resolution itself belongs in `@heliogrid/domain` as one function, not
re-derived per group — "widest visibility" is a single business rule and CLAUDE.md §1 gives
it one definition.

Three consequences the RBAC slice must handle, recorded here so they are not rediscovered:

1. **A capability-gated tab navigator can end up empty**, which throws
   (`useNavigationBuilder.tsx:405`, "Couldn't find any screens for the navigator"). At least
   one tab must be unconditional — the same guarantee `Boot` gives the root stack.
2. **Deep-linking to a screen the user's capabilities exclude** falls through to the initial
   route, because the route does not exist. Safe, but silent; whether it should instead
   surface a "no access" message is a product decision for that slice.
3. **Roles changing mid-session** re-evaluate the hooks and add or remove screens live; a user
   standing on a removed screen is popped off it.

**Navigation gating is UX, never security.** The API guard and the RLS backstop are the
enforcement. A hidden route must never be read as a denied one.

Entitlement gating composes the same way — another capability hook, no structural change.

### 2.3 Type registration and its guard

`root.tsx` carries the augmentation:

```ts
declare module '@react-navigation/core' {
  interface RootNavigator extends RootStackType {}
}
```

The assertion that it landed lives in a **separate file**, `src/navigation/route-typing.ts`,
copying the idiom already proven in `apps/mobile/src/ui/api-parity.ts`:

```ts
declare const rootParamList: ReactNavigation.RootParamList;

// Fails if root.tsx's augmentation is removed: RootParamList collapses to {} and Boot vanishes.
rootParamList satisfies { Boot: undefined };
```

Three reasons this exact shape:

- **`declare const` carries a type without a value**, so it emits no JavaScript and survives
  `noUnusedVariables: "error"` — which an earlier draft's `const _routesAreTyped = true` would
  not have. `satisfies` on the next line is what consumes it, exactly as `api-parity.ts` does.
- **A separate file means deleting the augmentation breaks a different file**, so the failure
  cannot be made to disappear by deleting one adjacent line.
- **`Boot` is the anchor** because it is the one route guaranteed to exist in every session
  state, so this assertion does not churn as routes come and go.

Nothing imports it; `tsc` checks every file under `src/`, so it runs on typecheck regardless.
It therefore needs a knip `ignore` entry alongside the existing
`apps/mobile/src/ui/api-parity.ts` — same reason, already precedented in `knip.jsonc`.

Without the augmentation, `ReactNavigation.RootParamList` is empty and every
`navigate('typo')` compiles — strictly worse than today's per-screen
`NativeStackScreenProps`. This is what makes that failure loud.

**Honest limit:** deleting the augmentation *and* `route-typing.ts` together still produces no
error. Two files in two places is as far as a type mechanism reaches here, and nothing more is
claimed.

### 2.4 Adding a screen

Two files, one of them new:

```ts
// src/navigation/routes/app.ts — the only existing file touched
export const appScreens = {
  Tabs: { screen: Tabs },
  LeadDetail: {
    screen: LeadDetailScreen,
    linking: 'leads/:leadId',
  },
};
```

```tsx
// src/screens/lead-detail/LeadDetailScreen.tsx — new
type Props = StaticScreenProps<{ leadId: string }>;
export function LeadDetailScreen({ route }: Props) { … }
```

The param type, the deep-link path, the auth gate, and `navigate('LeadDetail', { leadId })`
typing at every call site all follow. Nothing else is edited and nothing is kept in sync.

Per-module route files exist so a module owns its routes in its own file — the ≲450-line law
holds without a `*-part2` split as the app grows. `createNativeStackScreen`
(`@react-navigation/native-stack`) is available for entries needing full typing in isolation;
whether the spread or the factory form gives cleaner inference is settled at implementation
time by whichever typechecks, not asserted here.

### 2.5 Tab shell

`tabs.tsx` nests `createBottomTabNavigator` under the root stack with `HomeScreen` as its one
member and the `tabBar` slot pointed at React Navigation's default bar.

What this proves today: nesting, param inference through the nest, deep-link paths resolving
into a tab, and safe-area inset behaviour. What it defers: the arc chrome, which is a
`tabBar` swap in the CRM slice.

`@react-navigation/bottom-tabs` is a new dependency, pinned to the 7.x line matching the
installed core, and verified not to resolve a second copy of `@react-navigation/core` —
the failure mode `apps/mobile`'s zod pin exists to prevent.

**The tab bar lives in `src/navigation/`, never `src/ui/` (Law 7).** `src/ui/index.ts` is
checked against `@heliogrid/ui-api`, and `UncoveredComponents` fails this app's typecheck for
any component the shared contract does not name. A bottom tab bar is RN-only and has no web
counterpart, so exporting it from the component index breaks the build. It is app chrome, not
a design-system primitive. This applies to the default bar's wrapper today and to the arc bar
whenever it lands.

**Tab labels are user-visible copy and go through i18n.** The default bar labels a tab from
its route name, which would ship a hardcoded, untranslated "Home". `tabBarLabel` accepts a
render function, so it returns `<Trans id="…"/>` — locale-reactive, and consistent with the
runtime-`<Trans>` convention `.claude/rules/i18n.md` sets for both platforms. When the four
real tabs land, their labels are copy both platforms need and belong in
`packages/i18n/src/copy/`, per `apps/mobile/CLAUDE.md` — not authored per screen.

## 3. Splash

Two distinct surfaces, engineered so the seam between them is invisible.

### 3.1 Native launch screen — canvas colour, no text

Shown from app-icon tap until the JS bundle mounts. Cannot be React.

**iOS:** `LaunchScreen.storyboard`'s background references a named colour in
`Images.xcassets`. The RN default labels ("HelioGridMobile", "Powered by React Native") are
removed. Result: plain canvas.

**Android — and this is not symmetric with iOS.** `targetSdkVersion = 36` (`minSdkVersion = 24`),
so from **API 31 the system owns the splash** and `android:windowBackground` no longer
controls it. Two theme files are required, not one:

| File | Applies to | Sets |
|---|---|---|
| `res/values/styles.xml` | API 24–30 | `android:windowBackground` |
| `res/values-v31/styles.xml` | API 31+ | `android:windowSplashScreenBackground` |

No new Gradle dependency: setting the v31 attributes directly avoids
`androidx.core:core-splashscreen`.

**On API 31+ the system also centres the launcher icon, and that is accepted** (owner ruling,
this session). Android shows icon-on-canvas; iOS shows plain canvas. The platforms differ
deliberately — this is what every Android 12+ app does, and forcing parity means a transparent
`windowSplashScreenAnimatedIcon`, which fights the OS and is the kind of trick that breaks on
an Android update. Recorded as an intentional divergence in the docs/13 row (§3.4).

**While here: `AppTheme` currently parents `Theme.AppCompat.DayNight.NoActionBar` on a
light-only v1 product.** No `values-night` resources exist, so it is almost certainly inert
today, but it is wrong by declaration and this is the one change that touches the theme.
Corrected to the non-DayNight parent in the same edit.

**No text on either platform.** Rendering Geist in a storyboard and in an Android drawable are
two different problems with two different failure modes; skipping both makes the handoff
seamless, because native canvas gives way to JS canvas with nothing to flash.

### 3.2 The colour is generated, never transcribed

`ui-adherence.md` forbids hand-transcribed token values, but a storyboard and an Android
theme cannot import `@heliogrid/tokens` at runtime. Resolution: **`packages/tokens/build.ts`
emits both native colour files** from the `design/ds-source` parse it already performs. They
are committed, and CI re-runs the generator and diffs them — the pattern
`packages/contracts/openapi/openapi.json` uses at `.github/workflows/ci.yml:83` and the i18n
catalogs use at line 91.

No new checker script is introduced, which §8's mechanism order would have required an owner
ruling to permit. `--canvas` remains one definition.

### 3.3 JS boot screen

`src/screens/boot/BootScreen.tsx` replaces the inline `Spinner` block in `RootNavigator`:
canvas plus the existing `Wordmark` composite from `src/ui`. That is the one branded element
docs/10 sanctions — no mark is invented, because none exists.

It holds while the session resolves and is reached as the `Boot` route (§2.1).

### 3.4 Recording the spec gap

Splash appears in no product document. Per `.claude/rules/00-laws.md`, a product-shaped
finding is recorded before it is built to: a docs/13 UXG row lands in the same change, stating
that the boot surface had no specification and what was decided here.

## 4. Deep-link plumbing

- `heliogrid://` registered in `Info.plist` (`CFBundleURLTypes`) and `AndroidManifest.xml`
  (intent filter).
- `linking.ts` holds prefixes and container options; `AppNavigation` passes them to
  `<Navigation/>`, so `App.tsx` neither knows nor can forget them.
- Paths are declared per route, only where a route is real: `login`, `gallery`.

**What this does NOT give Track C for free.** Notifee/FCM notification taps do not emit a URL,
so a `linking:` line alone will not route them. An earlier draft of this spec claimed
otherwise and was wrong. What this work does provide is the seam, verified against
`createStaticNavigation`:

- it forwards a `ref` (`NavigationContainerRef`), so navigating from outside React — a push
  handler — is available; and
- it accepts every `LinkingOptions` field except `config.screens` (which it generates from the
  route tree), so `getInitialURL` and `subscribe` can be extended to translate a notification
  payload into a URL and reuse the same route table.

Bridging notification payloads to URLs is Track C's work. It is small and it has a defined
place to go; it is not zero.

Note also that `linking.enabled: 'auto'` exists, auto-generating kebab-case paths for every
leaf screen. It is deliberately **not** used: deep-link paths are a contract that outlives
route renames, so each is declared explicitly.

## 5. What changes in existing code

**Deleted:** `src/navigation/RootNavigator.tsx`; `src/navigation/routes.ts` — both
`RootStackParamList` and `ROUTES` become inferred.

**Rewritten:**

- `App.tsx` renders `<AppNavigation/>` in place of `<RootNavigator/>` and stays thin. The
  `mobile-app-entry-thin` dep-cruiser rule is unaffected — verified as a direct-dependency
  rule (`apps/mobile/App.tsx` → `^apps/mobile/src/screens/`), and `App.tsx` imports only
  `src/navigation/index.ts`.
- `HomeScreen.tsx` swaps its `navigation` prop for `useNavigation()`.
- `apps/mobile/CLAUDE.md` — the two navigation convention lines describing `routes.ts` and
  `RootNavigator` are rewritten in the same commit (Law 8). The **capability-not-role grouping
  rule (§2.2.1)** lands here as a §Landmines entry in the same edit: it is a crash the type
  system cannot catch, specs get archived, and CLAUDE.md is what an agent reads every turn.
- `packages/tokens/CLAUDE.md` — the new emit target is documented alongside the existing ones.

- `knip.jsonc` — `src/navigation/route-typing.ts` joins the `ignore` list beside
  `apps/mobile/src/ui/api-parity.ts`, for the identical reason (checked by tsc, imported by
  nothing).

**Added:** `@react-navigation/bottom-tabs` (and the lockfile); the native scheme
registrations; the two generated colour files; the `values-v31` theme; the CI freshness step.

**Blast radius, honestly: ~33 files.** Counted, not estimated — and up from the ~25 in this
spec's first draft, because the production review added the phase provider, the separate
assertion file, the Android v31 theme, the knip entry and the i18n catalogs:

| Group | Files | Unavoidable? |
|---|---|---|
| Navigation layer — 10 new under `src/navigation/`, `BootScreen.tsx`, 2 deleted, plus `App.tsx`, `HomeScreen.tsx`, `package.json`, `apps/mobile/CLAUDE.md`, `knip.jsonc`, lockfile | 19 | Yes — this is the work |
| Native splash + deep-link registration — storyboard, `Info.plist`, `AndroidManifest.xml`, `values/styles.xml`, `values-v31/styles.xml` | 5 | Yes |
| Token generation of the native colour — `colors.xml`, the iOS colorset, `packages/tokens/build.ts`, its CLAUDE.md, `ci.yml` | 5 | **No — this is the chosen cost** |
| i18n catalogs — one new msgid (the tab label) across EN/HI/MR | 3 | Yes |
| docs/13 UXG row | 1 | Yes (00-laws) |

Five of the thirty-three exist *because* the native colour is generated rather than
transcribed, and they are the ones reaching outside `apps/mobile` into `packages/tokens` and
CI. That was the right call for drift; it is also what widened the diff. The alternative —
hardcoding `#F6F7F9` in the native files — would have cost 5 fewer files and bought a token
value that silently desyncs.

Thirty-three files is large for one change, and 00-laws treats sprawl as an architecture
smell. It is accepted here because a navigation foundation legitimately touches the app entry,
every route, both native projects, the generator and the copy catalog — not because unrelated
modules needed edits. **If the count grows again during implementation, that is the signal to
stop and re-scope rather than push through.**

## 6. Success criteria

No unit tests (§8). Every criterion is something run, through `/qa`:

1. **Cold boot, both simulators** → no white flash between native and JS splash. On Android
   this is checked on an **API 31+ emulator specifically**, since API 24–30 and 31+ take
   different theme paths (§3.1); the icon-on-canvas is expected there, not a defect.
2. **Deep link resolves** → `xcrun simctl openurl booted heliogrid://gallery` and
   `adb shell am start -W -a android.intent.action.VIEW -d "heliogrid://gallery"` both open
   the Gallery screen.
3. **Session flow** → signed-out shows Login; verify → dwell → Tabs; sign out returns to
   Login with no authenticated screen reachable by back gesture on either platform. Watched
   across the dwell boundary specifically: the navigator is never momentarily empty (§2.2).
4. **Tab shell** → the tab bar renders with correct safe-area insets at 375px, and its label
   is translated — switch locale to HI and confirm the label follows without a remount.
5. **Typecheck** → `pnpm turbo typecheck` green, **and** the augmentation block in `root.tsx`
   is deleted once, `route-typing.ts` watched failing, then restored.
   `.dependency-cruiser.cjs`'s own standard: a guard is not real until the violation it names
   has been injected and seen to fail.
6. **Token freshness** → `--canvas` changed in `ds-source`, generator rerun, both native
   colour files observed to move; a deliberately stale commit observed failing the CI diff.
7. **Gallery unreachable outside dev** → in a non-`__DEV__` build, no Gallery route resolves,
   including via `heliogrid://gallery`. (Reachability, not bundle exclusion — see §2.1.)
8. **i18n catalogs fresh** → `pnpm --filter @heliogrid/i18n extract` run and its diff
   committed; CI fails on stale catalogs (`.claude/rules/i18n.md`).
9. `pnpm verify` green.

## 7. Open questions

None. Every fork was decided by the owner this session: static API, machinery-only route
scope, default tab bar, tokens-generated splash colour, scheme-level deep linking, and
accepting Android 12+'s launcher icon on the splash rather than fighting the platform.

## 8. Production review — findings folded in

A review pass on 2026-08-02 against the installed packages, the native projects and the repo's
own gates found nine issues in this spec's first draft. All are resolved above; recorded here
so the reasoning is not lost.

| # | Finding | Resolution |
|---|---|---|
| 1 | Android splash approach fails on API 31+ (`targetSdk 36`) | §3.1 — `values-v31` theme; launcher icon accepted |
| 2 | The type guard `const _routesAreTyped = true` violates `noUnusedVariables: "error"` | §2.3 — `declare const` + `satisfies`, the `api-parity.ts` idiom, in its own file |
| 3 | Per-guard dwell timers can race → empty navigator → throw | §2.2 — one `NavigationPhase` value above the navigator |
| 4 | "Notification tap needs no plumbing" was overclaimed | §4 — the seam is `ref` + `getInitialURL`/`subscribe`; bridging is Track C work |
| 5 | Tab labels would ship untranslated | §2.5 — `tabBarLabel` render function returning `<Trans>` |
| 6 | i18n extract before commit was missing from criteria | §6.8 |
| 7 | Law 7 / `ui-api` parity constraint on the tab bar was unstated | §2.5 |
| 8 | `Theme.AppCompat.DayNight` on a light-only product | §3.1 — corrected in the same theme edit |
| 9 | knip would report the new assertion file as dead code | §5 — `ignore` entry beside `api-parity.ts` |
