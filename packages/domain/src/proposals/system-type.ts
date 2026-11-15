/**
 * How a system meets the grid (`M06-09`): it feeds it, it stands apart from it, or it does both
 * with a battery. A readonly tuple, so contracts derives its `z.enum` and the migration mirrors the
 * pgEnum from this one list. A leaf file: the market pack reads it (`subsidy/pack.ts`), so it
 * imports nothing.
 */
export const SYSTEM_TYPES = ['on_grid', 'hybrid', 'off_grid'] as const;
export type SystemType = (typeof SYSTEM_TYPES)[number];

/** The types that cannot work without storage (`M06-30`): the notice at step 3, the block at Generate. */
export function needsBattery(type: SystemType): boolean {
  return type !== 'on_grid';
}
