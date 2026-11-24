import type { ShellDoor, StandingDestination } from '@heliogrid/domain';

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
  'people',
  'campaigns',
  'start_survey',
] as const satisfies readonly ShellDoor[];

export type PlaceholderDoor = (typeof PLACEHOLDER_DOORS)[number];
export type PlaceholderRoute = (typeof doorRoute)[PlaceholderDoor];

/**
 * One route row per placeholder door of `doors`, each made by `entryOf` from its door: the pill's
 * destinations are tabs (`navigation/routes/tabs.ts`), an action is a page of the stack (`app.ts`).
 */
export function placeholderRoutes<Door extends PlaceholderDoor, Entry>(
  doors: readonly Door[],
  entryOf: (door: Door) => Entry,
): Readonly<Record<(typeof doorRoute)[Door], Entry>> {
  /* `fromEntries` widens its keys to string; every door of the list gives its own route. */
  return Object.fromEntries(doors.map((door) => [doorRoute[door], entryOf(door)])) as Record<
    (typeof doorRoute)[Door],
    Entry
  >;
}

/**
 * The pill's destinations, each a tab of the `Main` group (`navigation/routes/tabs.ts`): a tab
 * opened once stays drawn, so going back to it shows it at once, where it was left.
 */
export const tabRoute = {
  home: 'Shell',
  leads: doorRoute.leads,
  proposals: doorRoute.proposals,
  projects: doorRoute.projects,
  people: doorRoute.people,
  campaigns: doorRoute.campaigns,
  more: doorRoute.more,
} as const satisfies Record<StandingDestination, string>;

export type TabRoute = (typeof tabRoute)[StandingDestination];

const isTabDoor = (door: PlaceholderDoor): door is Extract<PlaceholderDoor, StandingDestination> =>
  door in tabRoute;

/** The placeholder doors the pill names, each a tab; the rest open as pages over the tabs. */
export const TAB_PLACEHOLDER_DOORS = PLACEHOLDER_DOORS.filter(isTabDoor);
export const PAGE_PLACEHOLDER_DOORS = PLACEHOLDER_DOORS.filter(
  (door): door is Exclude<PlaceholderDoor, StandingDestination> => !isTabDoor(door),
);

/** The door a placeholder route draws: the table read backwards. */
const DOOR_OF_PLACEHOLDER = placeholderRoutes(PLACEHOLDER_DOORS, (door) => door);

export function placeholderDoorOf(route: PlaceholderRoute): PlaceholderDoor {
  return DOOR_OF_PLACEHOLDER[route];
}
