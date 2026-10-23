import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { APP_ENTRY_ROUTES } from '../../navigation/guards';

/**
 * Leaves a step after a join for good: the stack becomes `route` alone — or, when it is not mounted
 * or none is named, the App group's first screen, which the session decides (`landingFor`) — so
 * back never returns.
 */
export function useGoInside(): (route?: string) => void {
  const navigation = useNavigation();
  return useCallback(
    (route?: string) => {
      const names: readonly string[] = navigation.getState()?.routeNames ?? [];
      const next =
        route !== undefined && names.includes(route)
          ? route
          : APP_ENTRY_ROUTES.find((entry) => names.includes(entry));
      if (next !== undefined) {
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: next }] }));
      }
    },
    [navigation],
  );
}
