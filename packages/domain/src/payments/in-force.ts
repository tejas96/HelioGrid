import { proportionOf } from '../money/basis-points';
import { type MinorUnits, minorUnits, sumMinorUnits } from '../money/minor-units';
import type { SchedulePart, ScheduleTerm } from './schedule';

/**
 * A project's schedule once a newer accepted version is put in force (`M08-50`, `M11-14`): the
 * parts already paid stay as they are, the unpaid ones are replaced by the new version's plan for
 * what remains, and money collected past the new total is stated as a surplus — never hidden. One
 * arithmetic, on the server, so the sheet's preview and the schedule it writes can only agree.
 */

/** A part that stays: paid, part-paid or waived. Nothing here ever touches its receipts. */
export interface KeptPart {
  readonly amount: MinorUnits;
  /**
   * The least its amount may become: what it has received for a part-paid part, its whole amount
   * for a paid or waived one. A part-paid part is lowered only when the new total is smaller than
   * what the kept parts already ask — so the plan never asks past the price the customer agreed.
   */
  readonly floor: MinorUnits;
}

export interface ScheduleInForce {
  /** Each kept part's amount, in the order given. */
  readonly kept: readonly MinorUnits[];
  /** The new version's parts for what remains; none where nothing remains to ask. */
  readonly parts: readonly SchedulePart[];
  /** What is still to collect: the new total less everything collected, never below zero. */
  readonly remaining: MinorUnits;
  /** Collected past the new total; `null` where there is none. */
  readonly surplus: MinorUnits | null;
}

/** The kept parts lowered, last first and never under their floor, until they fit the total. */
function fitted(newTotal: MinorUnits, kept: readonly KeptPart[]): MinorUnits[] {
  let over = sumMinorUnits(kept.map((part) => part.amount)) - newTotal;
  return [...kept]
    .reverse()
    .map((part) => {
      const cut = Math.max(0, Math.min(over, part.amount - part.floor));
      over -= cut;
      return minorUnits(part.amount - cut);
    })
    .reverse();
}

/**
 * The plan for what is left: the new version's parts that follow the kept ones — the kept parts
 * stand in for its first ones — each taking its share of the rest in proportion, the last taking
 * the left-over minor units. Where the new plan has no part left, its last part takes it all.
 */
function restOf(
  toSplit: MinorUnits,
  terms: readonly ScheduleTerm[],
  keptCount: number,
): readonly SchedulePart[] {
  if (toSplit <= 0) return [];
  const ahead = terms.slice(keptCount).length > 0 ? terms.slice(keptCount) : terms.slice(-1);
  if (ahead.length === 0) {
    throw new RangeError('a version in force needs a payment plan to share out what remains');
  }
  const ofParts = ahead.reduce((sum, term) => sum + term.share, 0);
  const parts = ahead.map((term) => ({
    ...term,
    amount: ofParts === 0 ? minorUnits(0) : proportionOf(toSplit, { parts: term.share, ofParts }),
  }));
  const left = minorUnits(toSplit - sumMinorUnits(parts.map((part) => part.amount)));
  return parts.map((part, index) =>
    index === parts.length - 1 ? { ...part, amount: minorUnits(part.amount + left) } : part,
  );
}

/**
 * `newTotal` is the new version's payable, `terms` its whole payment plan, `kept` the parts that
 * stay and `collected` everything the ledger holds for the project, reversals taken off.
 */
export function scheduleInForce(
  newTotal: MinorUnits,
  terms: readonly ScheduleTerm[],
  kept: readonly KeptPart[],
  collected: MinorUnits,
): ScheduleInForce {
  const amounts = fitted(newTotal, kept);
  const toSplit = minorUnits(Math.max(0, newTotal - sumMinorUnits(amounts)));
  return {
    kept: amounts,
    parts: restOf(toSplit, terms, kept.length),
    remaining: minorUnits(Math.max(0, newTotal - collected)),
    surplus: collected > newTotal ? minorUnits(collected - newTotal) : null,
  };
}
