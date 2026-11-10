import { isUnassignedOverdue, UNASSIGNED_ESCALATES_AFTER_MS } from '@heliogrid/domain';
import type { LeadAgeStanding } from './LeadAge.types';

/**
 * The share of domain's escalation window after which the clock turns to the warning ink — a
 * heads-up drawn six hours before the owner is told, never a rule anything acts on.
 */
const NEARING_SHARE = 0.75;

/** Where a lead that has waited `elapsedMs` stands against the escalation (`M02-50`). */
export function leadAgeStandingOf(elapsedMs: number): LeadAgeStanding {
  if (isUnassignedOverdue(0, elapsedMs)) return 'past';
  if (elapsedMs >= UNASSIGNED_ESCALATES_AFTER_MS * NEARING_SHARE) return 'nearing';
  return 'fresh';
}
