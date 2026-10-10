import {
  CommonActions,
  createStaticNavigation,
  type NavigationAction,
  type NavigationState,
  type StaticParamList,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BootScreen } from '../screens/boot';
import { useIsBooting, useIsSignedIn, useIsSignedOut } from './guards';
import { appScreens } from './routes/app';
import { authScreens } from './routes/auth';

/** The home's route name, held to the route map: a renamed home fails to compile here. */
const HOME: keyof typeof appScreens = 'Shell';

/**
 * The home goes under a screen that opened alone. A link followed after sign-in is restored as the
 * stack's only route (`lastUnhandled` below), and Back from it would leave the app; with the home
 * first, Back reaches the home. Only where the home exists: the Auth group and the company step
 * hold no `Shell`.
 */
function homeUnderALoneScreen(state: NavigationState) {
  if (!state.routeNames.includes(HOME) || state.routes[0]?.name === HOME) return undefined;
  return CommonActions.reset({
    ...state,
    routes: [{ name: HOME }, ...state.routes],
    index: state.routes.length,
  });
}

/**
 * What a dev build says of an action no navigator took, in place of React Navigation's own report.
 * A link opened signed out names a screen only the App group holds: the navigator keeps it and
 * opens it after sign-in (`lastUnhandled` below), so it is no fault and nothing is said. Any other
 * unhandled action is a wrong route name and is still an error.
 */
export function reportUnhandledAction(action: NavigationAction) {
  if (!__DEV__ || namesAnAppScreen(action)) return;
  console.error(
    `The action '${action.type}' with payload ${JSON.stringify(action.payload)} was not handled by any navigator.`,
  );
}

/** A `NAVIGATE` to a screen of the App group: unhandled only while that group is not mounted. */
function namesAnAppScreen(action: NavigationAction): boolean {
  const { type, payload } = action;
  if (type !== 'NAVIGATE' || payload === undefined || !('name' in payload)) return false;
  return typeof payload.name === 'string' && Object.keys(appScreens).includes(payload.name);
}

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
 *
 * `lastUnhandled` is what returns a person to a link they opened signed out (`M01-61`): the link
 * names a screen the Auth group does not hold, and the navigator opens it once the App group mounts.
 * Without it the link is dropped and sign-in lands on the home.
 */
const RootStack = createNativeStackNavigator({
  UNSTABLE_routeNamesChangeBehavior: 'lastUnhandled',
  screenListeners: ({ navigation }) => ({
    state: (event) => {
      const reset = homeUnderALoneScreen(event.data.state);
      if (reset !== undefined) navigation.dispatch(reset);
    },
  }),
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
