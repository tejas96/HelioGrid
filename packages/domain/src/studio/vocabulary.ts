/**
 * The design studio's own words. The studio is a box other products can use (`docs/tasks/
 * M05-design-studio.md`, *The wall*): nothing in this folder names a lead, a customer, a proposal
 * or a project, and dependency-cruiser refuses the import.
 */

/** Where the panels go: on a building, or on open land. A site can carry a design of each. */
export const DESIGN_MOUNTS = ['roof', 'ground'] as const;
export type DesignMount = (typeof DESIGN_MOUNTS)[number];

/**
 * Where a design stands. Only a draft exists until the sign-off step is built; its statuses join
 * this list then, so a reader keeps a fallback for a status it does not know.
 */
export const DESIGN_STATUSES = ['draft'] as const;
export type DesignStatus = (typeof DESIGN_STATUSES)[number];

/**
 * Why the studio refuses an act. `host_closed`: the record the host hangs the design on takes no
 * new work — in HelioGrid, a closed lead. `roofs_off_site`: the pin moved to another site, which
 * leaves the roofs drawn behind; the save waits until the person agrees they go (`site-moved.ts`).
 */
export const DESIGN_ACT_REFUSALS = ['host_closed', 'roofs_off_site'] as const;
export type DesignActRefusal = (typeof DESIGN_ACT_REFUSALS)[number];

/** A site name is a short label a person reads on a card and in the studio's top bar. */
export const SITE_NAME_MAX = 40;

/**
 * The helpers that guide a corner while a roof is drawn or changed (`T-M05-002`, part b): Square
 * (square corners and parallel edges), Line up (guides to earlier corners) and Buildings (snaps to
 * building edges and the design's other roofs). Each is on at first; a person turns one off, and
 * the pick follows them to every device.
 */
export const STUDIO_HELPERS = ['square', 'line_up', 'buildings'] as const;
export type StudioHelper = (typeof STUDIO_HELPERS)[number];

/** Whether a helper name is one this build knows: an unknown one is kept, and helps nothing. */
export function isStudioHelper(name: string): name is StudioHelper {
  return (STUDIO_HELPERS as readonly string[]).includes(name);
}

/**
 * How a person sets a number (`T-M05-002`, *Values*): by the slider first, or in a box to type.
 * The pick is the person's and follows them to every device.
 */
export const NUMBER_ENTRIES = ['slider', 'box'] as const;
export type NumberEntry = (typeof NUMBER_ENTRIES)[number];
