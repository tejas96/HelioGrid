import { DOOR_SEGMENT } from '@heliogrid/domain';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { StaticParamList } from '@react-navigation/native';
import { LeadsListScreen } from '../../screens/leads-list';
import { ProjectsBoardScreen } from '../../screens/projects-board';
import { ProposalsListScreen } from '../../screens/proposals-list';
import { SettingsScreen } from '../../screens/settings';
import { PlaceholderScreen, ShellScreen } from '../../screens/shell';
import {
  placeholderRoutes,
  TAB_PLACEHOLDER_DOORS,
  type TabRoute,
  tabRoute,
} from '../../screens/shell/doors';
import { useHasHome } from '../guards';

/**
 * The pill's destinations as tabs (`SCR-SHELL-01`): Home, the work lists and More. A tab opened once
 * stays drawn under the others, so going back to it shows it at once and where it was left; a tab
 * out of view is frozen, so it does no work while hidden. The pill is not this navigator's bar: it
 * is the one `PillHost` over every page (`screens/shell/components/PillHost.tsx`), because a page
 * opened from a list keeps it too. Back on a tab goes to the home, and from the home leaves the
 * app — also for a tab a link or a push opened, which has no other tab under it.
 *
 * Each tab keeps its own address, the web's, so a link and a push open it as before.
 */
export const MainTabs = createBottomTabNavigator({
  tabBar: () => null,
  backBehavior: 'firstRoute',
  screenOptions: {
    headerShown: false,
    lazy: true,
    freezeOnBlur: true,
    animation: 'none',
  },
  screens: {
    [tabRoute.home]: { screen: ShellScreen },
    /** The Leads list (`SCR-M02-03`), the pill's Leads door. */
    [tabRoute.leads]: { screen: LeadsListScreen, if: useHasHome, linking: DOOR_SEGMENT.leads },
    /** The Proposals list (`SCR-M06-19`), the pill's Proposals door. */
    [tabRoute.proposals]: {
      screen: ProposalsListScreen,
      if: useHasHome,
      linking: DOOR_SEGMENT.proposals,
    },
    /** The Projects board (`SCR-M08-01`), the pill's Projects door. */
    [tabRoute.projects]: {
      screen: ProjectsBoardScreen,
      if: useHasHome,
      linking: DOOR_SEGMENT.projects,
    },
    /** The doors the pill names whose module has not landed (`screens/shell/doors.ts`). */
    ...placeholderRoutes(TAB_PLACEHOLDER_DOORS, (door) => ({
      screen: PlaceholderScreen,
      if: useHasHome,
      linking: DOOR_SEGMENT[door],
    })),
    /** `More` opens the settings list (`SCR-SHELL-01`, *More: the settings list*). */
    [tabRoute.more]: { screen: SettingsScreen, if: useHasHome, linking: DOOR_SEGMENT.more },
  },
});

/** The tabs' params, inferred from the config above. */
export type MainTabParamList = StaticParamList<typeof MainTabs>;

/** Every tab's route is a key of the group: a destination with no tab fails to compile here. */
export type MainTabRoute = keyof MainTabParamList & TabRoute;
