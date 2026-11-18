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
 * new work — in HelioGrid, a closed lead.
 */
export const DESIGN_ACT_REFUSALS = ['host_closed'] as const;
export type DesignActRefusal = (typeof DESIGN_ACT_REFUSALS)[number];

/** A site name is a short label a person reads on a card and in the studio's top bar. */
export const SITE_NAME_MAX = 40;
