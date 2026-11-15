import { typicalWait, type UtilityDirectory } from '../format/utility';
import type { BlockerReason } from './vocabulary';

/**
 * Where a proposal meets its project after Won (`M07-62`, `M08-50`, `M11-14`): who may put a newer
 * version in force, and why the server refuses a hand-off. The link takes no answer once a deal is
 * won, so a person records the customer's agreement — and only one of the two people the customer
 * deals with may say so.
 */

/** Why Mark won is refused on a lead whose latest shared version the customer accepted (`F4-04`). */
export const MARK_WON_VALUE_REFUSAL = 'value_not_accepted_version';

/** Why *Put version N in force* is refused, beside the project's own refusals. */
export const VERSION_IN_FORCE_REFUSALS = ['version_unknown', 'version_already_in_force'] as const;
export type VersionInForceRefusal = (typeof VERSION_IN_FORCE_REFUSALS)[number];

/** The two people who may record that the customer agreed to a newer version (`T-M06-025`). */
export interface VersionInForceParties {
  readonly managerId: string;
  /** The lead's current owner; `null` for an unassigned lead. */
  readonly leadOwnerId: string | null;
}

/** The lead's owner or the project's manager — nobody else, whatever their role. */
export function mayPutVersionInForce(actorId: string, parties: VersionInForceParties): boolean {
  return actorId === parties.managerId || actorId === parties.leadOwnerId;
}

/** Whether a version can be put in force over the one the project runs on: only a newer one. */
export function versionInForceRefusal(
  inForce: number | null,
  asked: number,
  latest: number | null,
): VersionInForceRefusal | null {
  if (latest === null || asked > latest || asked < 1) return 'version_unknown';
  return inForce !== null && asked <= inForce ? 'version_already_in_force' : null;
}

/** The operator procedure a wait's reason stands for, where the market times one (`M08-26`). */
const WAIT_PROCEDURE: Partial<Record<BlockerReason, string>> = {
  utility_approval: 'net_metering_approval',
};

const DAYS_IN_A_WEEK = 7;

/**
 * How long a wait of this reason typically takes in the market, in days — the longer end of the
 * pack's range, so a customer is never told a shorter wait than is usual — or `null` where the
 * pack declares none: the page then states no length, never an invented one (`F5-66`, `M08-26`).
 */
export function typicalWaitDays(directory: UtilityDirectory, reason: string): number | null {
  const procedure = WAIT_PROCEDURE[reason as BlockerReason];
  const wait = procedure === undefined ? null : typicalWait(directory, procedure);
  return wait === null ? null : wait.typicalWeeks.to * DAYS_IN_A_WEEK;
}
