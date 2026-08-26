import { createStaticNavigation, type StaticParamList } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BootScreen } from '../screens/boot';
import { useIsBooting, useIsSignedIn, useIsSignedOut } from './guards';
import { appScreens } from './routes/app';
import { authScreens } from './routes/auth';

/**
 * THE route map. One config object; the param list is INFERRED from it, never hand-written —
 * a route name used to be a fact stated in three places (the param type, a ROUTES map and a
 * <Stack.Screen>), and this is what collapses it to one.
 *
 * Boot sits ungrouped on purpose: when every group's `if` is false the navigator has no
 * screens at all, and React Navigation throws. Boot is what guarantees a non-empty tree while
 * the session is still resolving.
 *
 * Swapping GROUPS rather than navigating means a signed-out user has no authenticated screen
 * left in the history to go back to. A false `if` returns null, so the screen never enters
 * navigation state.
 */
const RootStack = createNativeStackNavigator({
  screenOptions: { headerShown: false },
  screens: {
    Boot: { screen: BootScreen, if: useIsBooting },
  },
  groups: {
    Auth: { if: useIsSignedOut, screens: authScreens },
    App: { if: useIsSignedIn, screens: appScreens },
  },
});

/** Inferred from the config above — never hand-written. */
type RootStackParamList = StaticParamList<typeof RootStack>;

/**
 * Registers the route map globally so `useNavigation()` is typed at every call site with no
 * generic argument.
 *
 * Augments the GLOBAL `ReactNavigation` namespace rather than `declare module
 * '@react-navigation/core'`: core is a transitive dependency, and pnpm's strict node_modules
 * only symlinks direct ones, so the module form fails to resolve here with TS2664. The global
 * namespace needs no resolution and is React Navigation's own documented form.
 *
 * WITHOUT this block ReactNavigation.RootParamList is empty and every `navigate('typo')`
 * compiles — strictly worse than the per-screen NativeStackScreenProps this replaced.
 * `route-typing.ts` stops compiling if it is removed; do not delete either.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export const Navigation = createStaticNavigation(RootStack);
