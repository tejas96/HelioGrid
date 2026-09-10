import { type BasisPoints, basisPoints } from '../money/basis-points';

/** The whole contract value: a template's lines total exactly this (`M01-54`). */
export const WHOLE_ALLOCATION: BasisPoints = basisPoints(10_000);

/**
 * The ONE allocation verdict (`M01-54`): the `AllocationMeter` shows it and the save reads it,
 * never computed twice. Exact — whole basis points, no tolerance: 33.33 × 3 leaves 0.01 unplaced
 * and stays unsaveable. `remainder` is what is still unallocated, in basis points; negative when
 * the lines overshoot.
 */
export interface AllocationVerdict {
  readonly allocated: number;
  readonly remainder: number;
  readonly state: 'under' | 'met' | 'over';
}

export function allocationVerdict(lines: readonly BasisPoints[]): AllocationVerdict {
  const allocated = lines.reduce<number>((sum, line) => sum + line, 0);
  const remainder = WHOLE_ALLOCATION - allocated;
  if (remainder === 0) return { allocated, remainder, state: 'met' };
  return { allocated, remainder, state: remainder > 0 ? 'under' : 'over' };
}
