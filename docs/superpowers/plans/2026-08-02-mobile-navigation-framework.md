# Mobile Navigation Framework + Splash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-typed RN navigator with React Navigation 7's static config, add a
bottom-tab shell, a seamless native+JS splash, and deep-link plumbing — so every module from
here adds a screen with one edit.

**Architecture:** One static config tree composes groups gated by a single `NavigationPhase`
value held above the navigator. Route param types, deep-link paths and auth gates all derive
from that tree; nothing is hand-declared twice. The native splash colour is generated from
`design/ds-source` by the existing tokens build, so `--canvas` stays one definition.

**Tech Stack:** React Navigation 7 static API (`@react-navigation/native` 7.3.14,
`native-stack` 7.18.6, core 7.21.11), `@react-navigation/bottom-tabs` (new), Lingui runtime
`<Trans>`, `packages/tokens` generator, bare RN 0.86 on iOS + Android.

**Spec:** `docs/superpowers/specs/2026-08-02-mobile-navigation-framework-design.md`

## Global Constraints

- **OWNER GATE: pause after every task.** Present the diff and the verification output, then
  wait for explicit approval before starting the next task. Do not chain tasks.
- **Git is manual** (CLAUDE.md §8). Commit steps below are written but **owner-gated** — run
  them only when the owner asks for a commit in those words. Otherwise leave the work in the
  tree and say what is there.
- **No unit tests, ever.** No `.test.*` / `.spec.*` file — dep-cruiser rule `no-tests-in-apps`
  makes one an error. Verification is running the thing (§5).
- **Zero Biome warnings, zero typecheck errors, repo-wide.** `pnpm lint` runs with
  `--error-on-warnings`. Never commit with `--no-verify`.
- **No raw visual values.** Colours, spacing and type come from `@heliogrid/tokens`.
- **Screens import UI only from `apps/mobile/src/ui`** — never `react-native`'s `Text`,
  `Pressable`, `Button`, `TouchableOpacity`, `Switch` (Biome `noRestrictedImports`).
- **The tab bar lives in `src/navigation/`, never `src/ui/`** — `src/ui/index.ts` is checked
  against `@heliogrid/ui-api` and an RN-only component fails typecheck (Law 7).
- **Groups are keyed by capability, never by role** — see spec §2.2.1. Duplicate route names
  across groups are a hard runtime throw.
- **`pod install` needs `LANG=en_US.UTF-8`** or it fails on ASCII-8BIT normalization.
- **Deleted a source file? `pnpm turbo build --force`** — stale `tsc -b` output makes
  `boundaries` and `knip` fail on a module you removed.

---

### Task 1: Add `@react-navigation/bottom-tabs`, prove a single core

De-risks the one unknown the spec could not verify without installing: whether bottom-tabs
resolves a second copy of `@react-navigation/core`. That failure mode is exactly what
`apps/mobile`'s explicit `zod` pin exists to prevent, and it would surface as collapsed types
rather than an error.

**Files:**
- Modify: `apps/mobile/package.json` (dependencies)
- Modify: `pnpm-lock.yaml` (generated)

**Interfaces:**
- Consumes: nothing.
- Produces: `createBottomTabNavigator` from `@react-navigation/bottom-tabs`, available to
  Task 3.

- [ ] **Step 1: Check the version that pairs with the installed core**

```bash
pnpm view @react-navigation/bottom-tabs versions --json | tail -20
```

Pick the highest `7.x`. The installed peers are `@react-navigation/native@7.3.14` and
`@react-navigation/core@7.21.11`.

- [ ] **Step 2: Install it, pinned exactly (no `^`) like every other dep in this manifest**

```bash
pnpm --filter @heliogrid/mobile add @react-navigation/bottom-tabs@<version> --save-exact
```

- [ ] **Step 3: Prove there is exactly ONE `@react-navigation/core`**

```bash
pnpm why @react-navigation/core --filter @heliogrid/mobile
```

Expected: every path resolves to `@react-navigation/core@7.21.11`. If a second version
appears, STOP and report — do not continue. A duplicate core silently degrades navigation
types to `never`, the same shape as the 2026-07-27 zod-4 incident.

- [ ] **Step 4: Confirm no native linking is needed**

bottom-tabs is JavaScript-only; it relies on `react-native-screens`, already installed. No
`pod install` required. Verify nothing new appeared:

```bash
git diff --stat apps/mobile/ios apps/mobile/android
```

Expected: no output.

- [ ] **Step 5: Confirm the app is unchanged**

```bash
pnpm turbo typecheck --filter @heliogrid/mobile
```

Expected: PASS. Then boot both simulators via `/qa` and confirm login → Home still works
exactly as before. Nothing should look different — this task adds a dependency and no code.

- [ ] **Step 6: Commit — OWNER-GATED**

```bash
git add apps/mobile/package.json pnpm-lock.yaml
git commit -m "build(mobile): add @react-navigation/bottom-tabs for the tab shell"
```

- [ ] **Step 7: PAUSE — report the `pnpm why` output and wait for approval.**

---

### Task 2: Static navigation core (stack only, no tabs yet)

The whole migration in one task because it cannot be half-done: `createNativeStackNavigator`
returns `{ config, getComponent }` when given a config and `{ Navigator, Screen, Group }`
when not, so the two shapes are mutually exclusive and the app will not compile mid-swap.
Tabs are deliberately deferred to Task 3 so this one ends with a working, reviewable app.

**Files:**
- Create: `apps/mobile/src/navigation/phase.tsx`
- Create: `apps/mobile/src/navigation/guards.ts`
- Create: `apps/mobile/src/navigation/routes/auth.ts`
- Create: `apps/mobile/src/navigation/routes/app.ts`
- Create: `apps/mobile/src/navigation/routes/dev.ts`
- Create: `apps/mobile/src/navigation/root.tsx`
- Create: `apps/mobile/src/navigation/route-typing.ts`
- Create: `apps/mobile/src/navigation/index.tsx`
- Create: `apps/mobile/src/screens/boot/BootScreen.tsx`
- Delete: `apps/mobile/src/navigation/RootNavigator.tsx`
- Delete: `apps/mobile/src/navigation/routes.ts`
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/src/screens/home/HomeScreen.tsx`
- Modify: `apps/mobile/src/screens/gallery/GalleryScreen.tsx`
- Modify: `knip.jsonc`

**Interfaces:**
- Consumes: nothing from Task 1 yet.
- Produces:
  - `NavigationPhase = 'booting' | 'signedOut' | 'signedIn'` and
    `useNavigationPhase(): NavigationPhase` from `./phase`
  - `useIsBooting()`, `useIsSignedOut()`, `useIsSignedIn()`, `useIsDevBuild()` — all
    `() => boolean` — from `./guards`
  - `authScreens`, `appScreens`, `devScreens` from `./routes/*`
  - `RootStackType = typeof RootStack` and the `ReactNavigation.RootNavigator` augmentation
    from `./root`
  - `AppNavigation` (a zero-prop component) from `./index` — Task 3 and Task 4 both extend
    what it renders.

- [ ] **Step 1: Create the phase provider**

`apps/mobile/src/navigation/phase.tsx`:

```tsx
import { useSession } from '@heliogrid/data/react';
import { DONE_DWELL_MS } from '@heliogrid/domain';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

/**
 * ONE session/dwell value for the whole navigator.
 *
 * Deliberately not three hooks each owning a timer: two guards depend on whether the dwell
 * has elapsed, and independent timers can disagree for a frame. Both landing false while
 * Boot is also false leaves the navigator with zero screens, which THROWS
 * ("Couldn't find any screens for the navigator"). Computing one value makes the partition
 * exhaustive by construction.
 */
export type NavigationPhase = 'booting' | 'signedOut' | 'signedIn';

const NavigationPhaseContext = createContext<NavigationPhase>('booting');

/**
 * The dwell is DELIBERATE. Authentication is instant, but the login screen's done step has to
 * be visible for the design to survive — on web the equivalent pause is a `router.push` the
 * login controller schedules. Timing and navigation are the app's job; the store only decides
 * whether the user is authenticated.
 */
type SessionStatus = ReturnType<typeof useSession>['status'];

function resolvePhase(status: SessionStatus, dwellElapsed: boolean): NavigationPhase {
  if (status === 'checking') return 'booting';
  if (status === 'authenticated' && dwellElapsed) return 'signedIn';
  return 'signedOut';
}

export function NavigationPhaseProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [dwellElapsed, setDwellElapsed] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setDwellElapsed(false);
      return;
    }
    const timer = setTimeout(() => setDwellElapsed(true), DONE_DWELL_MS);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <NavigationPhaseContext.Provider value={resolvePhase(status, dwellElapsed)}>
      {children}
    </NavigationPhaseContext.Provider>
  );
}

export function useNavigationPhase() {
  return useContext(NavigationPhaseContext);
}
```

- [ ] **Step 2: Create the guards**

`apps/mobile/src/navigation/guards.ts`:

```ts
import { useNavigationPhase } from './phase';

/**
 * The `if` hooks the static config calls. Each is a pure comparison against the ONE phase
 * value — see phase.tsx for why they must not compute the dwell themselves.
 *
 * React Navigation calls these unconditionally on every navigator render, in fixed order.
 */
export const useIsBooting = () => useNavigationPhase() === 'booting';
export const useIsSignedOut = () => useNavigationPhase() === 'signedOut';
export const useIsSignedIn = () => useNavigationPhase() === 'signedIn';

/** Gates the Dev group. Independent of session phase. */
export const useIsDevBuild = () => __DEV__;
```

- [ ] **Step 3: Create the boot screen**

`apps/mobile/src/screens/boot/BootScreen.tsx`:

```tsx
import { theme } from '@heliogrid/tokens/theme';
import { StyleSheet, View } from 'react-native';
import { Wordmark } from '../../ui';

/**
 * Held while the session resolves. Matches the native launch screen's canvas exactly, so the
 * native → JS handoff has nothing to flash. The wordmark is the only branded element docs/10
 * sanctions — no logo exists and none is invented here.
 */
export function BootScreen() {
  return (
    <View style={styles.screen}>
      <Wordmark size="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

Confirm `size="lg"` is a valid `WordmarkProps['size']`; if the union is
`'sm' | 'md'` only, drop the prop and take the default.

- [ ] **Step 4: Create the three route files**

`apps/mobile/src/navigation/routes/auth.ts`:

```ts
import { LoginScreen } from '../../screens/login/LoginScreen';

/** Screens visible only while signed out. Gated once, by the Auth group in root.tsx. */
export const authScreens = {
  Login: { screen: LoginScreen },
};
```

`apps/mobile/src/navigation/routes/app.ts`:

```ts
import { HomeScreen } from '../../screens/home/HomeScreen';

/**
 * Authenticated routes. Task 3 replaces Home here with the Tabs navigator.
 *
 * Adding a module's screen is ONE entry in this object: its param type, deep link and auth
 * gate all follow. Group by CAPABILITY when roles land — never by role (spec §2.2.1).
 */
export const appScreens = {
  Home: { screen: HomeScreen },
};
```

`apps/mobile/src/navigation/routes/dev.ts`:

```ts
import { GalleryScreen } from '../../screens/gallery/GalleryScreen';

/** Dev-only. The Dev group's `if` is `__DEV__`, so these never mount in a release build. */
export const devScreens = {
  Gallery: { screen: GalleryScreen },
};
```

- [ ] **Step 5: Create the root config**

`apps/mobile/src/navigation/root.tsx`:

```tsx
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BootScreen } from '../screens/boot/BootScreen';
import { useIsBooting, useIsDevBuild, useIsSignedIn, useIsSignedOut } from './guards';
import { appScreens } from './routes/app';
import { authScreens } from './routes/auth';
import { devScreens } from './routes/dev';

/**
 * THE route map. One config object; `RootStackParamList` is inferred, never written.
 *
 * Boot sits ungrouped on purpose: when every group's `if` is false the navigator has no
 * screens and React Navigation throws. Boot is what guarantees a non-empty tree while the
 * session is resolving.
 *
 * Swapping GROUPS rather than navigating means a signed-out user has no authenticated screen
 * left in the history to go back to.
 */
const RootStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    Boot: { screen: BootScreen, if: useIsBooting },
  },
  groups: {
    Auth: { if: useIsSignedOut, screens: authScreens },
    App: { if: useIsSignedIn, screens: appScreens },
    Dev: { if: useIsDevBuild, screens: devScreens },
  },
});

export type RootStackType = typeof RootStack;

/**
 * Registers the route map globally so `useNavigation()` is typed at every call site with no
 * generic. WITHOUT this block, ReactNavigation.RootParamList is empty and every
 * `navigate('typo')` compiles — strictly worse than the per-screen props this replaced.
 * `route-typing.ts` fails to compile if it is removed.
 */
declare module '@react-navigation/core' {
  interface RootNavigator extends RootStackType {}
}

export const Navigation = createStaticNavigation(RootStack);
```

- [ ] **Step 6: Create the augmentation guard, in its own file**

`apps/mobile/src/navigation/route-typing.ts`:

```ts
/**
 * Proves root.tsx's module augmentation landed. Imported by NOTHING — tsc checks every file
 * under src/, so this runs on typecheck regardless. Same role and same idiom as
 * src/ui/api-parity.ts.
 *
 * Its own file on purpose: deleting the augmentation in root.tsx then breaks a DIFFERENT
 * file, so the failure cannot be made to vanish by deleting one adjacent line.
 *
 * `declare const` carries a type without a value, so it emits no JavaScript and does not trip
 * noUnusedVariables. Boot is the anchor because it is the one route that exists in every
 * session state, so this assertion does not churn as routes come and go.
 */
import './root';

declare const rootParamList: ReactNavigation.RootParamList;

rootParamList satisfies { Boot: undefined };
```

- [ ] **Step 7: Create the barrel**

`apps/mobile/src/navigation/index.tsx` (`.tsx` — it contains JSX):

```tsx
import { NavigationPhaseProvider } from './phase';
import { Navigation } from './root';

/**
 * The ONE thing App.tsx renders. Composing the provider here means a caller cannot forget it
 * — and forgetting it would leave every guard reading the default 'booting' forever.
 */
export function AppNavigation() {
  return (
    <NavigationPhaseProvider>
      <Navigation />
    </NavigationPhaseProvider>
  );
}
```

- [ ] **Step 8: Rewrite App.tsx's render**

In `apps/mobile/App.tsx`, replace the `RootNavigator` import with:

```tsx
import { AppNavigation } from './src/navigation';
```

and `<RootNavigator />` with `<AppNavigation />`. Change nothing else — the provider stack,
`setupI18n`, `installFormsErrorMap` and `createDataLayer` all stay exactly as they are.

- [ ] **Step 9: Migrate HomeScreen off the `navigation` prop**

In `apps/mobile/src/screens/home/HomeScreen.tsx`: delete the `NativeStackScreenProps` import,
the `RootStackParamList` import and the `Props` type; change the signature to
`export function HomeScreen()`; and get navigation from the hook:

```tsx
import { useNavigation } from '@react-navigation/native';

export function HomeScreen() {
  const navigation = useNavigation();
  // …unchanged body; navigation.navigate('Gallery') still typechecks via the augmentation
}
```

- [ ] **Step 10: Migrate GalleryScreen the same way**

`GalleryScreen` also takes `{ navigation }` and imports `RootStackParamList` from the file
being deleted — the spec missed this, so it is easy to skip and then hit a broken build.

Delete these two imports and the `GalleryScreenProps` type:

```tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/routes';

type GalleryScreenProps = NativeStackScreenProps<RootStackParamList, 'Gallery'>;
```

Replace the signature and the first line of the body:

```tsx
import { useNavigation } from '@react-navigation/native';

export function GalleryScreen() {
  const navigation = useNavigation();
  const onBack = () => navigation.goBack();
  // …rest of the body unchanged
```

Keep the existing comment about `navigation.goBack()` giving the native swipe gesture for
free — it is still true and still worth saying.

- [ ] **Step 11: Delete the old navigator and route map**

```bash
git rm apps/mobile/src/navigation/RootNavigator.tsx apps/mobile/src/navigation/routes.ts
pnpm turbo build --force
```

The `--force` is not optional: `tsc -b` leaves stale output that turbo's cache restores, and
`boundaries`/`knip` then fail on modules that no longer exist.

- [ ] **Step 12: Add the knip ignore entry**

In `knip.jsonc`, inside the top-level `"ignore"` array, beside the existing
`apps/mobile/src/ui/api-parity.ts` line:

```jsonc
    // Same role as src/ui/api-parity.ts: asserts root.tsx's module augmentation landed.
    // Checked by tsc, imported by nothing.
    "apps/mobile/src/navigation/route-typing.ts",
```

- [ ] **Step 13: Verify the gates**

```bash
pnpm turbo typecheck --filter @heliogrid/mobile
pnpm lint
```

Expected: both PASS, zero warnings.

- [ ] **Step 14: Prove the augmentation guard is real**

Temporarily delete the `declare module` block from `root.tsx`, then:

```bash
pnpm turbo typecheck --filter @heliogrid/mobile
```

Expected: FAIL, pointing at `route-typing.ts`. Restore the block and confirm it passes again.
`.dependency-cruiser.cjs`'s own standard — a guard is not real until the violation it names
has been injected and watched to fail.

- [ ] **Step 15: Run it on both simulators**

Through `/qa`. Confirm:
- cold start shows BootScreen while the session resolves, then Login;
- completing login holds the done step for the dwell, then swaps to Home;
- Home → "Component gallery" opens Gallery; back gesture returns to Home;
- after sign-out, no authenticated screen is reachable by back gesture.

- [ ] **Step 16: Commit — OWNER-GATED**

```bash
git add apps/mobile/src/navigation apps/mobile/src/screens/boot apps/mobile/App.tsx \
        apps/mobile/src/screens/home/HomeScreen.tsx \
        apps/mobile/src/screens/gallery/GalleryScreen.tsx knip.jsonc
git commit -m "refactor(mobile): route map becomes one static config, types inferred"
```

- [ ] **Step 17: PAUSE — report the injected-violation output from Step 14 and both simulator
  walkthroughs, then wait for approval.**

---

### Task 3: Tab shell with a translated label

**Files:**
- Create: `apps/mobile/src/navigation/tabs.tsx`
- Modify: `apps/mobile/src/navigation/routes/app.ts`
- Modify: `apps/mobile/CLAUDE.md`
- Modify: `packages/i18n/src/locales/*` (generated by extract)

**Interfaces:**
- Consumes: `createBottomTabNavigator` (Task 1); `appScreens` (Task 2).
- Produces: `Tabs` — a static navigation tree — replacing `Home` as the `App` group's entry.

- [ ] **Step 1: Create the tab navigator**

`apps/mobile/src/navigation/tabs.tsx`:

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Trans } from '@lingui/react';
import { HomeScreen } from '../screens/home/HomeScreen';

/**
 * The bottom-tab shell. Lives HERE, never in src/ui — src/ui/index.ts is checked against
 * @heliogrid/ui-api and an RN-only component fails that typecheck (Law 7). A tab bar is app
 * chrome, not a design-system primitive.
 *
 * The default tabBar is deliberate: the arc bar (design/mockups/MyDay.dc.html) has a centre
 * FAB targeting Quick Add, a CRM-slice screen that does not exist. It swaps into the `tabBar`
 * slot in that slice.
 *
 * tabBarLabel is a RENDER FUNCTION, not a string: the default bar would otherwise label the
 * tab from its route name and ship untranslated copy. Returning <Trans> keeps it
 * locale-reactive, matching .claude/rules/i18n.md's runtime convention on both platforms.
 * When the four real tabs land, their labels are copy BOTH platforms need and belong in
 * packages/i18n/src/copy — not authored here.
 */
export const Tabs = createBottomTabNavigator({
  screenOptions: { headerShown: false },
  screens: {
    Home: {
      screen: HomeScreen,
      options: { tabBarLabel: () => <Trans id="My Day" /> },
    },
  },
});
```

- [ ] **Step 2: Confirm the `tabBarLabel` signature against the installed package**

bottom-tabs was not installed when this plan was written. Check the accepted type:

```bash
grep -rn "tabBarLabel" node_modules/@react-navigation/bottom-tabs/src/types.tsx | head
```

If it takes `(props: { focused, color, position, children }) => ReactNode`, the code above is
correct as written. If it is `string`-only in this version, STOP and report — the i18n
approach needs rethinking, not a hardcoded string.

- [ ] **Step 3: Point the App group at the tabs**

`apps/mobile/src/navigation/routes/app.ts` becomes:

```ts
import { Tabs } from '../tabs';

/**
 * Authenticated routes. `Tabs` nests the bottom-tab navigator; stack-level routes that should
 * cover the tab bar (detail screens, modals) are siblings of it here.
 *
 * Adding a module's screen is ONE entry: its param type, deep link and auth gate all follow.
 * Group by CAPABILITY when roles land — never by role (spec §2.2.1).
 */
export const appScreens = {
  Tabs: { screen: Tabs },
};
```

`HomeScreen` is no longer imported here — it is reached through `Tabs`.

- [ ] **Step 4: Extract the new message**

```bash
pnpm --filter @heliogrid/i18n extract
```

CI fails on stale catalogs. Confirm `My Day` appears as a new msgid in all three locales.

- [ ] **Step 5: Update `apps/mobile/CLAUDE.md`**

Under §Local conventions, REPLACE these two lines (they describe files that no longer exist):

```markdown
- Navigation by typed route name from `src/navigation/routes.ts` — never prop callbacks.
  `App.tsx` renders `RootNavigator` and never imports a screen (dep-cruiser
  `mobile-app-entry-thin`, severity `error` since the navigation slice landed).
```

with:

```markdown
- **Navigation is React Navigation 7's STATIC config** — `src/navigation/root.tsx` holds the
  one route map and the param types are INFERRED; there is no `RootStackParamList` to write.
  Adding a screen is ONE entry in `src/navigation/routes/<module>.ts`; its param type, deep
  link and auth gate follow. Screens get `route` only — navigation comes from
  `useNavigation()`, never a prop. `App.tsx` renders `AppNavigation` and never imports a
  screen (dep-cruiser `mobile-app-entry-thin`, severity `error`).
```

And ADD to §Landmines:

```markdown
- **Navigation groups are keyed by CAPABILITY, never by role.** Roles are stackable
  (`role_preset[]`, OR-across, widest visibility), so a role-keyed group would declare a
  shared screen twice — and duplicate route names are a hard throw, not a warning. The
  OR-across resolution belongs in `@heliogrid/domain`, defined once.
- **The tab bar lives in `src/navigation/`, never `src/ui/`.** The component index is checked
  against `@heliogrid/ui-api`; an RN-only component fails `UncoveredComponents` (Law 7).
```

Law 8: this lands in the same commit as the change that made the old lines wrong.

- [ ] **Step 6: Verify the gates**

```bash
pnpm turbo typecheck --filter @heliogrid/mobile
pnpm lint
```

- [ ] **Step 7: Run it on both simulators**

Through `/qa`. Confirm the tab bar renders below Home with correct safe-area insets at 375px;
the label reads "My Day"; switching locale to HI on the Home screen changes the tab label
without a remount; and Gallery still opens and returns.

- [ ] **Step 8: Commit — OWNER-GATED**

```bash
git add apps/mobile/src/navigation apps/mobile/CLAUDE.md packages/i18n/src/locales
git commit -m "feat(mobile): bottom-tab shell with a translated label"
```

- [ ] **Step 9: PAUSE — report the simulator walkthrough and the locale-switch check, then
  wait for approval.**

---

### Task 4: Deep-link plumbing

**Files:**
- Create: `apps/mobile/src/navigation/linking.ts`
- Modify: `apps/mobile/src/navigation/index.tsx`
- Modify: `apps/mobile/src/navigation/routes/dev.ts`
- Modify: `apps/mobile/ios/HelioGridMobile/Info.plist`
- Modify: `apps/mobile/android/app/src/main/AndroidManifest.xml`

**Interfaces:**
- Consumes: `AppNavigation` (Task 2).
- Produces: `linkingOptions` from `./linking`, passed to `<Navigation/>`.

- [ ] **Step 1: Create the linking options**

`apps/mobile/src/navigation/linking.ts`:

```ts
/**
 * Container-level linking. Paths themselves live ON each route entry (`linking: 'gallery'`),
 * so a route and its URL are one edit.
 *
 * `enabled: 'auto'` is deliberately NOT used: it would auto-generate a kebab-case path for
 * every leaf screen, making URLs churn with route renames. Deep-link paths are a contract.
 *
 * Notification taps do NOT arrive as URLs — Notifee/FCM hand back a payload. Bridging that to
 * this route table is Track C's work and goes through `getInitialURL`/`subscribe` here.
 */
export const linkingOptions = {
  prefixes: ['heliogrid://'],
};
```

- [ ] **Step 2: Pass it to the container**

In `apps/mobile/src/navigation/index.tsx`:

```tsx
import { linkingOptions } from './linking';
// …
<Navigation linking={linkingOptions} />
```

- [ ] **Step 3: Give Gallery a path**

`apps/mobile/src/navigation/routes/dev.ts`:

```ts
export const devScreens = {
  Gallery: { screen: GalleryScreen, linking: 'gallery' },
};
```

- [ ] **Step 4: Register the scheme on iOS**

In `apps/mobile/ios/HelioGridMobile/Info.plist`, inside the top-level `<dict>`:

```xml
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLName</key>
			<string>com.heliogridmobile</string>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>heliogrid</string>
			</array>
		</dict>
	</array>
```

- [ ] **Step 5: Register the scheme on Android**

In `apps/mobile/android/app/src/main/AndroidManifest.xml`, inside the existing `<activity>`,
as a sibling of the current `<intent-filter>`:

```xml
        <intent-filter>
          <action android:name="android.intent.action.VIEW" />
          <category android:name="android.intent.category.DEFAULT" />
          <category android:name="android.intent.category.BROWSABLE" />
          <data android:scheme="heliogrid" />
        </intent-filter>
```

- [ ] **Step 6: Rebuild both apps and test the links**

A manifest/plist change needs a native rebuild, not a Metro reload.

```bash
xcrun simctl openurl booted "heliogrid://gallery"
adb shell am start -W -a android.intent.action.VIEW -d "heliogrid://gallery"
```

Expected on both: the app opens directly on the Gallery screen. Test twice — once from cold
(exercises `getInitialURL`) and once with the app backgrounded (exercises `subscribe`).

- [ ] **Step 7: Verify the gates**

```bash
pnpm turbo typecheck --filter @heliogrid/mobile
pnpm lint
```

- [ ] **Step 8: Commit — OWNER-GATED**

```bash
git add apps/mobile/src/navigation apps/mobile/ios apps/mobile/android
git commit -m "feat(mobile): register heliogrid:// and wire container deep linking"
```

- [ ] **Step 9: PAUSE — report both `openurl` results, cold and backgrounded, then wait for
  approval.**

---

### Task 5: Generate the native splash colour from tokens

Recording the product gap comes FIRST: 00-laws requires a product-shaped finding to be filed
before it is built to, and splash appears in no product document.

**Files:**
- Modify: `docs/13-ux-gap-register.md`
- Modify: `packages/tokens/build.ts`
- Modify: `packages/tokens/CLAUDE.md`
- Create: `apps/mobile/android/app/src/main/res/values/colors.xml` (generated)
- Create: `apps/mobile/ios/HelioGridMobile/Images.xcassets/SplashCanvas.colorset/Contents.json` (generated)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the existing `design/ds-source` parse in `build.ts`.
- Produces: `@color/splash_canvas` (Android) and the `SplashCanvas` named colour (iOS), both
  consumed by Task 6.

- [ ] **Step 1: File the UXG row**

`UXG-26` is the next free id (highest existing is UXG-25). Add this row to
`docs/13-ux-gap-register.md` under **`## C · Offline & sync (Stage 4 + global mobile)`** —
the only section scoped to the global mobile shell. Columns are
`| ID | Gap | Stage | Why it matters | Design-at-implementation notes | Blocks |`:

```markdown
| UXG-26 | **App boot surface (splash) has no specification** — no product document names what the app shows between icon tap and first screen | shell | Found 2026-08-02 while building the navigation framework, by review rather than by a gate. The RN default launch screen ("HelioGridMobile · Powered by React Native") was shipping on iOS, and Android had no splash treatment at all. docs/10 constrains the design space almost completely — no logo exists, the wordmark is plain Geist Bold — so this is a missing decision, not a missing design. | Native launch screen is canvas (`--canvas`, generated from tokens into both native projects — never transcribed), no text. JS boot screen is canvas + `Wordmark`, so the native→JS handoff has nothing to flash. **Accepted platform divergence (owner ruling 2026-08-02): from Android 12 the system centres the launcher icon on the splash and iOS shows plain canvas.** Forcing parity needs a transparent `windowSplashScreenAnimatedIcon`, which fights the OS and breaks on Android updates. | — (decided) |
```

If the owner prefers a different section, the row moves as-is — one line.

- [ ] **Step 2: Emit the two native colour files**

In `packages/tokens/build.ts`, after the existing emits, write both files from the already-
resolved `--canvas` token. Do not re-parse and do not hardcode: read the same resolved value
`theme.ts` uses.

Android — `apps/mobile/android/app/src/main/res/values/colors.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<!-- GENERATED by packages/tokens/build.ts from design/ds-source. Do not edit. -->
<resources>
    <color name="splash_canvas">#F6F7F9</color>
</resources>
```

iOS — `.../Images.xcassets/SplashCanvas.colorset/Contents.json`. An asset catalog needs the
hex split into components, so the generator emits the `#RRGGBB` pairs it already resolved:

```json
{
  "colors": [
    {
      "color": {
        "color-space": "srgb",
        "components": { "alpha": "1.000", "blue": "0xF9", "green": "0xF7", "red": "0xF6" }
      },
      "idiom": "universal"
    }
  ],
  "info": { "author": "xcode", "version": 1 }
}
```

The `0xF6/0xF7/0xF9` values above correspond to today's `--canvas` (`#F6F7F9`) and are shown
so the expected output is unambiguous — the generator must SPLIT the resolved token, never
hardcode these.

Both paths are outside `packages/tokens/dist`, so they are committed rather than gitignored —
matching `packages/contracts/openapi/openapi.json`.

- [ ] **Step 3: Run the generator and inspect the output**

```bash
pnpm --filter @heliogrid/tokens build
git status --short apps/mobile/android apps/mobile/ios
```

Expected: both files appear with the canvas value.

- [ ] **Step 4: Confirm the iOS colorset is picked up without an Xcode project edit**

`.xcassets` is a folder reference, so a new `.colorset` directory inside it should compile
without touching `project.pbxproj`. Build the iOS app and confirm. If Xcode does not see it,
STOP and report — adding a pbxproj entry is a different kind of change and needs saying out
loud.

- [ ] **Step 5: Add the CI freshness step**

In `.github/workflows/ci.yml`, beside the existing i18n check (`git diff --exit-code
packages/i18n/src/locales`):

```yaml
      - name: Native colour freshness (generated splash colours match the tokens)
        run: |
          pnpm --filter @heliogrid/tokens build
          git diff --exit-code apps/mobile/android/app/src/main/res/values/colors.xml \
                               apps/mobile/ios/HelioGridMobile/Images.xcassets/SplashCanvas.colorset
```

- [ ] **Step 6: Prove the freshness gate catches drift**

Change `--canvas` in `design/ds-source/tokens/colors.css` to an obviously different value,
rebuild, and confirm both generated files move. Then revert the ds-source change, rebuild, and
confirm both revert. Finally, hand-edit one generated file, run the CI command from Step 5
locally, and confirm it exits non-zero.

- [ ] **Step 7: Document the emit target**

Add the two new outputs to the emit list in `packages/tokens/build.ts`'s header comment and to
`packages/tokens/CLAUDE.md`, noting they are committed (not `dist/`) because native build
systems cannot import the package.

- [ ] **Step 8: Verify the gates**

```bash
pnpm verify
```

- [ ] **Step 9: Commit — OWNER-GATED**

```bash
git add docs/13-ux-gap-register.md packages/tokens .github/workflows/ci.yml \
        apps/mobile/android/app/src/main/res/values/colors.xml \
        apps/mobile/ios/HelioGridMobile/Images.xcassets
git commit -m "feat(tokens): emit the native splash canvas for iOS and Android"
```

- [ ] **Step 10: PAUSE — report the drift test from Step 6, then wait for approval.**

---

### Task 6: Native launch screens

**Files:**
- Modify: `apps/mobile/ios/HelioGridMobile/LaunchScreen.storyboard`
- Modify: `apps/mobile/android/app/src/main/res/values/styles.xml`
- Create: `apps/mobile/android/app/src/main/res/values-v31/styles.xml`

**Interfaces:**
- Consumes: `@color/splash_canvas` and the `SplashCanvas` colorset (Task 5); `BootScreen`
  (Task 2).
- Produces: nothing later tasks depend on. This is the last task.

- [ ] **Step 1: Rewrite the iOS launch screen**

In `LaunchScreen.storyboard`, delete both `<label>` elements ("HelioGridMobile" and "Powered
by React Native") and the constraints referencing them (`OZV-Vh-mqD`, `Q3B-4B-g5h`,
`akx-eg-2ui`, `i1E-0Y-4RG`, `moa-c2-u7t`, `x7j-FC-K8j`). Change the view's background from the
system colour to the named one:

```xml
<color key="backgroundColor" name="SplashCanvas"/>
```

Result: plain canvas, no text.

- [ ] **Step 2: Set the Android background for API 24–30**

`apps/mobile/android/app/src/main/res/values/styles.xml`:

```xml
<resources>

    <!-- Light-only v1: NOT DayNight. There are no values-night resources, so the previous
         Theme.AppCompat.DayNight parent was wrong by declaration rather than in effect. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
        <item name="android:windowBackground">@color/splash_canvas</item>
    </style>

</resources>
```

- [ ] **Step 3: Set the splash for API 31+**

`apps/mobile/android/app/src/main/res/values-v31/styles.xml` — from Android 12 the system owns
the splash and `windowBackground` no longer controls it:

```xml
<resources>

    <!-- API 31+ : the system splash. windowBackground is ignored here, and the launcher icon
         is centred by the OS — an accepted divergence from iOS (docs/13, owner ruling
         2026-08-02). Forcing parity needs a transparent windowSplashScreenAnimatedIcon,
         which fights the platform. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
        <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
        <item name="android:windowSplashScreenBackground">@color/splash_canvas</item>
    </style>

</resources>
```

- [ ] **Step 4: Rebuild natively and check the handoff on iOS**

Cold-launch on the iOS simulator. Expected: plain canvas from icon tap, straight into
BootScreen's canvas + wordmark, then Login. No white frame at any point.

- [ ] **Step 5: Check BOTH Android paths**

This is the step most likely to surface a defect, because the two API ranges take different
code paths:

- An **API 31+** emulator: canvas with the launcher icon centred, then BootScreen. Icon is
  expected, not a bug.
- An **API 30 or lower** emulator: plain canvas via `windowBackground`, then BootScreen.

If no API ≤30 emulator exists, create one — shipping the `values/` file untested means the
fallback path is unverified on `minSdkVersion 24`.

- [ ] **Step 6: Full verification**

```bash
pnpm verify
```

Then a complete `/qa` run across both platforms: cold boot → Login → dwell → Tabs → Gallery →
back → sign out, plus `heliogrid://gallery` from cold and from background.

- [ ] **Step 7: Commit — OWNER-GATED**

```bash
git add apps/mobile/ios/HelioGridMobile/LaunchScreen.storyboard \
        apps/mobile/android/app/src/main/res
git commit -m "feat(mobile): branded native launch screens on both platforms"
```

- [ ] **Step 8: PAUSE — report both Android API ranges and the iOS handoff, then wait for
  approval.**

---

## Spec coverage

| Spec section | Task |
|---|---|
| §1 static API decision | 2 |
| §2 structure, §2.1 root config | 2 |
| §2.2 guards + single phase value | 2 |
| §2.2.1 capability-not-role rule | 3 (CLAUDE.md landmine) |
| §2.3 augmentation + guard | 2 (proved in Step 14) |
| §2.4 adding a screen | 2, 3 (the route files are the pattern) |
| §2.5 tab shell, Law 7, i18n label | 3 |
| §3.1 native launch screens | 6 |
| §3.2 colour generated from tokens | 5 |
| §3.3 JS boot screen | 2 |
| §3.4 docs/13 UXG row | 5 (Step 1) |
| §4 deep-link plumbing | 4 |
| §5 deletions, rewrites, knip | 2, 3, 5 |
| §6 success criteria 1–9 | 6 (1), 4 (2), 2 (3), 3 (4), 2 (5), 5 (6), 6 (7), 3 (8), 5–6 (9) |

**Criterion 7** — "Gallery unreachable outside `__DEV__`" — is checked in Task 6 Step 6 by
running `heliogrid://gallery` against a release build; note the route is unreachable, but its
code still ships (spec §2.1).

## Known unknowns

Two things this plan could not verify without installing or building, each with a STOP
instruction rather than an assumption:

1. The `@react-navigation/bottom-tabs` version pairing with core 7.21.11 — Task 1 Step 3.
2. Whether the iOS colorset needs a `project.pbxproj` entry — Task 5 Step 4.

A third is smaller: `WordmarkProps['size']` may not include `'lg'` — Task 2 Step 3.
