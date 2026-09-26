/**
 * Which data an energy figure came from (`F8-08`) — the second label an energy figure carries
 * beside its tier. The tier says HOW the figure was produced (a simulated yield is `derived`
 * whichever data fed it); the source says WHAT data, so a yield built on the ±10% fallback can
 * never read like one built on the source of record.
 */

/**
 * The source of record's databases, as the label names them — `"Real · PVGIS (SARAH3)"`. A
 * readonly tuple, so a later wire schema derives from this one list.
 *
 * **The order is the label's order**: a figure fed by both prints them in this order wherever it
 * is read, so one figure renders one way (`F8-24`). It is the v1 ladder's order; the adapter
 * maps the answer's own names (`PVGIS-SARAH3`) onto these.
 */
export const ENERGY_DATABASES = ['SARAH3', 'ERA5'] as const;
export type EnergyDatabase = (typeof ENERGY_DATABASES)[number];

/**
 * The built-in latitude fit's documented accuracy, in percent — printed in its label as
 * `±10%`. The label reads it from here, so no translation can change the tolerance.
 */
export const ESTIMATE_TOLERANCE_PERCENT = 10;

/**
 * The source of record, naming every database that fed the figure — at least one, or the label
 * would print `Real · PVGIS ()` and name nothing (`F8-08`) — or the built-in fallback.
 */
export type EnergySource =
  | {
      readonly kind: 'record';
      readonly databases: readonly [EnergyDatabase, ...EnergyDatabase[]];
    }
  | { readonly kind: 'estimate' };

/**
 * Databases as every label prints them: each once, in `ENERGY_DATABASES` order, whatever order a
 * caller gathered them in — so one figure reads one way wherever it is read (`F8-24`).
 */
export function inLadderOrder(databases: readonly EnergyDatabase[]): EnergyDatabase[] {
  return ENERGY_DATABASES.filter((database) => databases.includes(database));
}

/**
 * The source of a figure computed from several (`F8-10`): the fallback if ANY input came from
 * it — taking the source of record while one input was estimated is the silent switch `F8-09`
 * forbids — else the source of record naming each database once, in `ENERGY_DATABASES` order.
 * `null` when no input drew on irradiance: a shading fraction or a tariff carries no source.
 */
export function energySourceOf(sources: readonly EnergySource[]): EnergySource | null {
  const fed: EnergyDatabase[] = [];
  for (const source of sources) {
    if (source.kind === 'estimate') return source;
    fed.push(...source.databases);
  }
  const [first, ...rest] = inLadderOrder(fed);
  return first === undefined ? null : { kind: 'record', databases: [first, ...rest] };
}
