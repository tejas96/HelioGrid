import type { CentreVerb } from './centre-verb';
import type { StandingDestination } from './standing-destinations';

/**
 * Every door the shell opens (`SCR-SHELL-01`): a standing destination other than the home the
 * shell already is, the add action's verb, search and the bell. Both shells title a door from
 * this one list, so a door added here is a door each app must route.
 */
export type ShellDoor =
  | Exclude<StandingDestination, 'home'>
  | CentreVerb
  | 'search'
  | 'notifications';
