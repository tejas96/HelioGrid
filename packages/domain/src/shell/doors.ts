import type { CentreVerb } from './centre-verb';
import type { ShellView } from './shell-view';
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

/**
 * The doors a person's shell may open (`F7-48`): each standing destination but the home, the
 * home's verb, search and the bell. A door outside this list is not this person's, so a screen
 * that opens doors by address answers it as not found.
 */
export function offeredDoors(
  view: Pick<ShellView, 'destinations' | 'centreVerb'>,
): readonly ShellDoor[] {
  const doors: ShellDoor[] = [];
  for (const destination of view.destinations ?? []) {
    if (destination !== 'home') doors.push(destination);
  }
  if (view.centreVerb !== null) doors.push(view.centreVerb);
  doors.push('search', 'notifications');
  return doors;
}
