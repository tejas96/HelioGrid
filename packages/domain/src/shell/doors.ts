import type { CentreVerb } from './centre-verb';
import type { ShellView } from './shell-view';
import type { StandingDestination } from './standing-destinations';

/**
 * Every door the shell opens (`SCR-SHELL-01`): a standing destination other than the home the
 * shell already is, the add action's verb and search. Both shells title a door from this one
 * list, so a door added here is a door each app must route. The bell opens no door: the centre is
 * an overlay over the page in view (`SCR-SHELL-03` decision 1).
 */
export type ShellDoor = Exclude<StandingDestination, 'home'> | CentreVerb | 'search';

/**
 * Each door's address segment, one fact on both apps: the web's `/add-lead` and the phone's
 * `heliogrid://add-lead` are the same link. A segment changed here changes a public address.
 */
export const DOOR_SEGMENT: Record<ShellDoor, string> = {
  leads: 'leads',
  proposals: 'proposals',
  projects: 'projects',
  people: 'people',
  campaigns: 'campaigns',
  more: 'more',
  add_lead: 'add-lead',
  start_survey: 'start-survey',
  search: 'search',
};

/**
 * The doors a person's shell may open (`F7-48`): each standing destination but the home, the
 * home's verb and search. A door outside this list is not this person's, so a screen
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
  doors.push('search');
  return doors;
}

/** Whether this person's shell offers a door — the empty notification centre's way to the leads. */
export function offersDoor(
  view: Pick<ShellView, 'destinations' | 'centreVerb'>,
  door: ShellDoor,
): boolean {
  return offeredDoors(view).includes(door);
}
