import type { ShellView } from './shell-view';
import {
  type StandingDestination,
  WORK_DESTINATION_DOMAIN,
  WORK_DESTINATIONS,
  type WorkDestination,
} from './standing-destinations';

/**
 * The work lists whose module has landed. A list not here still opens the shell's placeholder
 * door, so the desktop sidebar marks it *Soon* rather than promise a page; a module adds its list
 * when its slice ships.
 */
const LANDED_WORK_LISTS: ReadonlySet<WorkDestination> = new Set<WorkDestination>([
  'leads',
  'proposals',
  'projects',
]);

/** Whether a work list opens its own page yet, or the placeholder (`sidebarMarksSoon`). */
export function workListLanded(destination: WorkDestination): boolean {
  return LANDED_WORK_LISTS.has(destination);
}

/**
 * The desktop sidebar's work lists. The pill keeps `F7-48`'s two slots for the thumb; the sidebar
 * has the room, so after each slot it also lists every landed list read through the same
 * visibility domain — a proposal is read with its lead, so whoever holds Leads sees Proposals
 * beside it. A list is never offered that no slot's grant reads.
 */
export function sidebarWorkLists(
  destinations: readonly StandingDestination[],
): readonly WorkDestination[] {
  const slots = destinations.filter(isWorkDestination);
  const lists: WorkDestination[] = [];
  for (const slot of slots) {
    if (!lists.includes(slot)) lists.push(slot);
    for (const beside of WORK_DESTINATIONS) {
      const readAlike = WORK_DESTINATION_DOMAIN[beside] === WORK_DESTINATION_DOMAIN[slot];
      if (
        readAlike &&
        workListLanded(beside) &&
        !lists.includes(beside) &&
        !slots.includes(beside)
      ) {
        lists.push(beside);
      }
    }
  }
  return lists;
}

/**
 * The sidebar's groups, in order — the way an EPC business works: what it sells, what it delivers,
 * and its people. Home stands above them and Settings at the foot, in no group.
 */
export const SIDEBAR_GROUPS = ['sales', 'delivery', 'team'] as const;
export type SidebarGroup = (typeof SIDEBAR_GROUPS)[number];

/** Which group each work list stands in: a proposal is sold, as its lead and a campaign are. */
export const WORK_DESTINATION_GROUP = {
  leads: 'sales',
  proposals: 'sales',
  campaigns: 'sales',
  projects: 'delivery',
  people: 'team',
} as const satisfies Record<WorkDestination, SidebarGroup>;

export interface SidebarGroupLists {
  readonly group: SidebarGroup;
  readonly lists: readonly WorkDestination[];
}

/**
 * The sidebar's work lists by group, in the groups' order, each keeping the order
 * `sidebarWorkLists` gave it; a group with no list is left out.
 */
export function sidebarGroupsOf(lists: readonly WorkDestination[]): readonly SidebarGroupLists[] {
  return SIDEBAR_GROUPS.map((group) => ({
    group,
    lists: lists.filter((list) => WORK_DESTINATION_GROUP[list] === group),
  })).filter((grouped) => grouped.lists.length > 0);
}

function isWorkDestination(destination: StandingDestination): destination is WorkDestination {
  return destination !== 'home' && destination !== 'more';
}

/**
 * The work lists the phone's More offers first: each landed list the person reads that the pill has
 * no slot for. `F7-48` keeps the pill at its two slots; the lists `sidebarWorkLists` adds beside a
 * slot would otherwise have no way in on a phone. Proposals is left out where the pill's own action
 * opens the proposals list: the pill already holds its way in.
 */
export function moreWorkLists(
  view: Pick<ShellView, 'destinations' | 'centreVerb'>,
): readonly WorkDestination[] {
  const destinations: readonly StandingDestination[] = view.destinations ?? [];
  return sidebarWorkLists(destinations).filter(
    (list) =>
      !destinations.includes(list) && !(list === 'proposals' && view.centreVerb === 'proposals'),
  );
}
