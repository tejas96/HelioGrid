import type { BuiltInYieldTable } from './built-in-yield';
import recorded from './built-in-yield-in.json';

/**
 * India's recorded answers (`T-M06-033`, `F8-08`). DATA ONLY, in `built-in-yield-in.json`: what
 * PVGIS 5.3 (database ERA5) answered on 2026-11-13 for each district's point in `format/areas-in.json`
 * — 1 kWp of crystalline silicon, zero system loss, facing south at the optimal tilt — and, for a
 * region, the answer at the region's own point. One row per region and per district: change both
 * files together.
 */
export const IN_BUILT_IN_YIELD: BuiltInYieldTable = recorded;
