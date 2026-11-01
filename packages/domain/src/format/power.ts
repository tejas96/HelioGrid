/**
 * A design's rated power in the unit a reader says it in: kW below a megawatt, MW from one up
 * (`BM-12`a speaks the ladder in kW; the pricing page prints `5 MW`). The unit is a symbol and
 * never translated (`F3`). A fraction of a megawatt keeps its kW, so no figure is rounded away.
 */
export type PowerUnit = 'kW' | 'MW';

export interface ScaledPower {
  readonly amount: number;
  readonly unit: PowerUnit;
}

const KW_PER_MW = 1_000;

export function scaledPower(kw: number): ScaledPower {
  if (kw >= KW_PER_MW && kw % KW_PER_MW === 0) return { amount: kw / KW_PER_MW, unit: 'MW' };
  return { amount: kw, unit: 'kW' };
}
