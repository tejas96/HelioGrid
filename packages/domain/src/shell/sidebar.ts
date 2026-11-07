import type { WorkDestination } from './standing-destinations';

/**
 * The work lists whose module has landed. A list not here still opens the shell's placeholder
 * door, so the desktop sidebar marks it *Soon* rather than promise a page; a module adds its list
 * when its slice ships.
 */
const LANDED_WORK_LISTS: ReadonlySet<WorkDestination> = new Set<WorkDestination>();

/** Whether a work list opens its own page yet, or the placeholder (`sidebarMarksSoon`). */
export function workListLanded(destination: WorkDestination): boolean {
  return LANDED_WORK_LISTS.has(destination);
}
