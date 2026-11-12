import { type MinorUnits, minorUnits, sumMinorUnits } from '../money/minor-units';
import type { TrancheState } from './vocabulary';

/**
 * Where a part stands (`M11-10`, `M11-36`, `M11-48`, `M11-49`), read from its facts and never
 * typed: the money the ledger holds against it (payments less reversals), whether it is due,
 * whether it was waived. A payment above what the part asks for is kept and stated as extra —
 * never moved to another part by itself.
 */

export interface TrancheFacts {
  readonly amount: MinorUnits;
  /** Payments less reversals against this part. */
  readonly received: MinorUnits;
  readonly due: boolean;
  readonly waived: boolean;
}

export interface TrancheStanding {
  readonly state: TrancheState;
  /** What the customer still owes on this part; nothing once it is waived. */
  readonly outstanding: MinorUnits;
  /** What arrived above the part's amount. */
  readonly extra: MinorUnits;
}

export function trancheStandingOf(facts: TrancheFacts): TrancheStanding {
  const extra = minorUnits(Math.max(0, facts.received - facts.amount));
  const owed = minorUnits(Math.max(0, facts.amount - facts.received));
  const outstanding = facts.waived ? minorUnits(0) : owed;
  return { state: stateOf(facts, owed), outstanding, extra };
}

function stateOf(facts: TrancheFacts, owed: MinorUnits): TrancheState {
  if (facts.waived) return 'waived';
  if (owed === 0) return 'received';
  if (facts.received > 0) return 'part_received';
  return facts.due ? 'due' : 'upcoming';
}

/** One part, with what its standing says — the input to a project's money. */
export interface PartMoney {
  readonly amount: MinorUnits;
  readonly received: MinorUnits;
  readonly due: boolean;
  readonly standing: TrancheStanding;
}

/**
 * A project's money (`M11-43`): one figure each, so the card, the payments screen, the board and
 * the home all show the same numbers. `toCollect` is what is owed on parts already due; `next`
 * is what the parts not yet due will ask for.
 */
export interface ProjectMoney {
  readonly total: MinorUnits;
  readonly collected: MinorUnits;
  readonly toCollect: MinorUnits;
  readonly next: MinorUnits;
}

export function projectMoneyOf(parts: readonly PartMoney[]): ProjectMoney {
  const owed = (due: boolean) =>
    sumMinorUnits(
      parts.filter((part) => part.due === due).map((part) => part.standing.outstanding),
    );
  return {
    total: sumMinorUnits(parts.map((part) => part.amount)),
    collected: sumMinorUnits(parts.map((part) => part.received)),
    toCollect: owed(true),
    next: owed(false),
  };
}
