import type { ShellDoor, StandingDestination } from '@heliogrid/domain';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { doorRoute, type TabRoute, tabRoute } from './doors';

/** Every place the pill or a page opens: a destination of the pill, or any door the shell names. */
export type PillDoor = ShellDoor | StandingDestination;

const isTabDoor = (door: PillDoor): door is StandingDestination => door in tabRoute;

/**
 * Where a door opens: a destination's tab in `Main` (`navigation/routes/tabs.ts`), or an action's
 * own page over the tabs. A tab opens with `pop`, so from a page over the tabs the pages above them
 * close and the tabs already drawn come back — never a second set of tabs; a tab shows where it was
 * left.
 */
export function doorTarget(door: PillDoor): {
  name: string;
  params?: { screen: TabRoute };
  options?: { pop: true };
} {
  /* Only the tabs are gone back to: an action's page opens new each time, never an old one left
     in the stack (quick add after a save). */
  return isTabDoor(door)
    ? { name: 'Main', params: { screen: tabRoute[door] }, options: { pop: true } }
    : { name: doorRoute[door] };
}

/** Opens one of the pill's destinations: its tab, wherever the person is. */
export function useOpenTab(): (tab: TabRoute) => void {
  const navigation = useNavigation();
  return useCallback(
    (tab: TabRoute) => navigation.navigate('Main', { screen: tab }, { pop: true }),
    [navigation],
  );
}

/** Opens any door the shell names: a destination's tab, or an action's own page. */
export function useOpenDoor(): (door: PillDoor) => void {
  const navigation = useNavigation();
  return useCallback(
    (door: PillDoor) => {
      const target = doorTarget(door);
      navigation.dispatch(CommonActions.navigate(target.name, target.params, target.options));
    },
    [navigation],
  );
}
