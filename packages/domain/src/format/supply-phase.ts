/**
 * The supply a site meets (`M06-09`, `M06-23`): one phase or three. A fact of the site, read by the
 * lead, the proposal and the studio alike, so it lives beside the market's utility directory and
 * in no module's own folder.
 */
export const SUPPLY_PHASES = ['single', 'three'] as const;
export type SupplyPhase = (typeof SUPPLY_PHASES)[number];

/** How many phases a supply of this kind carries — the figure an inverter's own is compared with. */
export const PHASE_COUNT: Readonly<Record<SupplyPhase, 1 | 3>> = { single: 1, three: 3 };
