import type { BasisPoints } from '../money/basis-points';
import type { MinorUnits } from '../money/minor-units';

/** What a projection may rest on (`F8-23`, `M06-40`), in the order a label lists them. */
export const PROJECTION_ASSUMPTIONS = [
  'horizonYears',
  'escalationRate',
  'interestRate',
  'margin',
  'incentive',
] as const;
export type ProjectionAssumption = (typeof PROJECTION_ASSUMPTIONS)[number];

/**
 * The fixed assumptions a projection travels with. The horizon is required: every projection
 * `F8-23` names runs over one, and one resting on nothing stated is not labelled honestly. Rates
 * are `BasisPoints` and the incentive `MinorUnits`, the brands the money path already reads, so a
 * bare `6` cannot stand where `600` is due.
 */
export interface ProjectionAssumptions {
  /** Years, fractions allowed — an 18-month EMI is `1.5`. */
  readonly horizonYears: number;
  readonly escalationRate?: BasisPoints;
  readonly interestRate?: BasisPoints;
  readonly margin?: BasisPoints;
  readonly incentive?: MinorUnits;
}

/** One stated assumption, its value in the unit its key names — money stays `MinorUnits`. */
export type StatedAssumption = {
  [K in ProjectionAssumption]: {
    readonly kind: K;
    readonly value: NonNullable<ProjectionAssumptions[K]>;
  };
}[ProjectionAssumption];

/**
 * The assumptions a projection states, each once, in `PROJECTION_ASSUMPTIONS` order — the one order
 * every label prints them, so one projection reads one way wherever it is read (`F8-24`).
 */
export function statedAssumptions(assumptions: ProjectionAssumptions): StatedAssumption[] {
  return PROJECTION_ASSUMPTIONS.flatMap((kind) => {
    const value = assumptions[kind];
    /* The key and its value were read together, so each pair is the member its key names. */
    return value === undefined ? [] : [{ kind, value } as StatedAssumption];
  });
}
