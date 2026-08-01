/**
 * The route map — the single source of truth for RN navigation.
 *
 * `RootStackParamList` makes a wrong route name or wrong params a COMPILE ERROR, which is
 * what replaces the prop-callback chain the app used before. A screen's props are its route
 * params. Navigation between screens is by route name, never by prop callback. The one
 * sanctioned exception is the session boundary: `RootNavigator` passes `onSignedIn` to
 * `LoginScreen` because the auth stack is SWAPPED (not navigated) once a session exists.
 */
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  /** Dev-only component gallery (packages/ui mirror check — see docs/10 §6 · packages/ui/CLAUDE.md §Definition of done here). */
  Gallery: undefined;
};

export type RouteName = keyof RootStackParamList;

/**
 * Route names as values. Iterating or referencing a name goes through this map so a rename
 * is a compile error at every call site rather than a silent runtime miss.
 */
export const ROUTES = {
  Login: 'Login',
  Home: 'Home',
  Gallery: 'Gallery',
} as const satisfies Record<RouteName, RouteName>;
