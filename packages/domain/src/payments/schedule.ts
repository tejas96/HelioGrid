import { allocationVerdict } from '../commerce/tranche-allocation';
import { applyRate, type BasisPoints } from '../money/basis-points';
import { type MinorUnits, minorUnits, sumMinorUnits } from '../money/minor-units';
import type { ProjectChainStage } from '../projects/stages';

/**
 * A project's schedule (`M11-08`, `M11-09`, `M11-13`): each part's amount is its share of the
 * payable, and the minor units rounding leaves over go to the LAST part — one arithmetic, so
 * the parts always add up to the payable exactly and every reader gets the same figures.
 */

/** One line of the payment terms the schedule is made from. */
export interface ScheduleTerm {
  readonly label: string;
  readonly share: BasisPoints;
  readonly dueOnStage: ProjectChainStage;
}

/** One part of the schedule: its term and its amount. */
export interface SchedulePart extends ScheduleTerm {
  readonly amount: MinorUnits;
}

/**
 * The parts of `payable` under `terms`. The terms' shares must add up to the whole: a schedule
 * that does not is refused here rather than quietly short or over.
 */
export function splitSchedule(
  payable: MinorUnits,
  terms: readonly ScheduleTerm[],
): readonly SchedulePart[] {
  if (terms.length === 0) return [];
  if (allocationVerdict(terms.map((term) => term.share)).state !== 'met') {
    throw new RangeError('payment terms must share out the whole payable to make a schedule');
  }
  const parts = terms.map((term) => ({ ...term, amount: applyRate(payable, term.share) }));
  const left = minorUnits(payable - sumMinorUnits(parts.map((part) => part.amount)));
  return parts.map((part, index) =>
    index === parts.length - 1 ? { ...part, amount: minorUnits(part.amount + left) } : part,
  );
}
