import type { Coordinate, EnergyDatabase } from '@heliogrid/domain';

/**
 * The port the market's energy source of record answers through (`F8-08`, `M06-10`): one point in,
 * what 1 kWp generates there each month at ZERO system loss out, with the database the answer
 * named. A proposal scales it by its size and applies its efficiency once (`T-M06-033`), so the
 * source is asked once per point and never once per proposal.
 *
 * The v1 adapter is PVGIS, a free public service with no account. It is asked with a fixed
 * timeout, and a source that does not answer in time REJECTS: the caller then fills from the
 * built-in estimate and labels it so (`F8-10`) — the step never waits on a third party.
 */
export interface EnergyAnswer {
  readonly database: EnergyDatabase;
  /** Twelve months, January first: kWh for 1 kWp at zero loss. */
  readonly yieldPerKwp: readonly number[];
}

export interface EnergySourceOfRecord {
  /** Rejects when the source does not answer in time, refuses the point, or answers what cannot be read. */
  monthlyYield(point: Coordinate): Promise<EnergyAnswer>;
}

/** A `symbol` on purpose: a string DI token collides silently across modules. */
export const ENERGY_SOURCE_OF_RECORD = Symbol.for('heliogrid.EnergySourceOfRecord');
