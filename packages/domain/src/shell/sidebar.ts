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

function isWorkDestination(destination: StandingDestination): destination is WorkDestination {
  return destination !== 'home' && destination !== 'more';
}

/**
 * The work lists the phone's More offers first: each landed list the person reads that the pill has
 * no slot for. `F7-48` keeps the pill at its two slots; the lists `sidebarWorkLists` adds beside a
 * slot would otherwise have no way in on a phone.
 */
export function moreWorkLists(
  destinations: readonly StandingDestination[],
): readonly WorkDestination[] {
  return sidebarWorkLists(destinations).filter((list) => !destinations.includes(list));
}
