import type { AreaGrain, AreaRef } from '../format/areas';
import type { MonthlyFigures } from './field-set';

/**
 * The built-in estimate (`F8-08`, `F8-10`, `T-M06-033`): what fills a proposal's generation when
 * the source of record does not answer in time. Not a formula — a lookup of the source's own
 * recorded answers, kWh a month for 1 kWp at zero loss, one row per district and one per region for
 * a region-only pick — so it earns the label "Built-in estimate ±10%" by measurement.
 *
 * Server-only: the table is large and a device never needs it (`./server`).
 */
export interface BuiltInYieldTable {
  /** Region code → twelve months, for a site whose district the pack does not hold. */
  readonly areas: Readonly<Record<string, MonthlyFigures>>;
  /** Region code → district name → twelve months. */
  readonly districts: Readonly<Record<string, Readonly<Record<string, MonthlyFigures>>>>;
}

export interface BuiltInYield {
  readonly yieldPerKwp: MonthlyFigures;
  readonly grain: AreaGrain;
}

/**
 * The recorded yield for a site: its district's where the table holds it, else its region's — the
 * coarser estimate, labelled as such — and `null` for a region the table does not hold, where the
 * step says it has no estimate rather than inventing one.
 */
export function builtInMonthlyYield(table: BuiltInYieldTable, ref: AreaRef): BuiltInYield | null {
  const district = ref.district === null ? undefined : table.districts[ref.area]?.[ref.district];
  if (district !== undefined) return { yieldPerKwp: district, grain: 'district' };
  const area = table.areas[ref.area];
  return area === undefined ? null : { yieldPerKwp: area, grain: 'area' };
}
