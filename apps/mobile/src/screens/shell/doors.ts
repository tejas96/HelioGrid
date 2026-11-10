import type { ShellDoor } from '@heliogrid/domain';

/**
 * The route that draws each door the shell opens — the ONE table the pill, the add action, the
 * placeholder rows of `navigation/routes/app.ts` and `PlaceholderScreen` read, so a door, its route
 * and its link cannot disagree. Literal, so a route row can name itself by it (`[doorRoute.more]`).
 */
export const doorRoute = {
  leads: 'Leads',
  proposals: 'Proposals',
  projects: 'Projects',
  people: 'People',
  campaigns: 'Campaigns',
  more: 'More',
  add_lead: 'QuickAddLead',
  start_survey: 'StartSurvey',
  search: 'Search',
} as const satisfies Record<ShellDoor, string>;

/**
 * The doors whose module has not landed: `PlaceholderScreen` draws each until its screen lands, and
 * a landing screen takes its door out of this list and its own row into `app.ts`.
 */
export const PLACEHOLDER_DOORS = [
  'proposals',
  'projects',
  'people',
  'campaigns',
  'start_survey',
] as const satisfies readonly ShellDoor[];

export type PlaceholderDoor = (typeof PLACEHOLDER_DOORS)[number];
export type PlaceholderRoute = (typeof doorRoute)[PlaceholderDoor];

/** One route row per placeholder door, each made by `entryOf` from its door (`app.ts`). */
export function placeholderRoutes<Entry>(
  entryOf: (door: PlaceholderDoor) => Entry,
): Readonly<Record<PlaceholderRoute, Entry>> {
  /* `fromEntries` widens its keys to string; every door of the list gives its own route. */
  return Object.fromEntries(
    PLACEHOLDER_DOORS.map((door) => [doorRoute[door], entryOf(door)]),
  ) as Record<PlaceholderRoute, Entry>;
}

/** The door a placeholder route draws: the table read backwards. */
const DOOR_OF_PLACEHOLDER = placeholderRoutes((door) => door);

export function placeholderDoorOf(route: PlaceholderRoute): PlaceholderDoor {
  return DOOR_OF_PLACEHOLDER[route];
}
