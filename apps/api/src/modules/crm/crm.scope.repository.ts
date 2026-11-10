import { type DbTransaction, lead, leadAssignment, leadVisitBooking } from '@heliogrid/db';
import { type LeadReach, type LeadScope, leadScopeOf } from '@heliogrid/domain';
import { and, eq, type SQL, sql } from 'drizzle-orm';
import type { MayRead } from '../notification/notification.public';

/**
 * Each reach as its SQL clause over `lead`, given the lead's owner. A `Record`, so a reach domain
 * adds fails to compile here until it says what it reaches. A booked visit names its surveyor
 * until a reschedule replaces it: the visit moved to someone else takes the lead with it.
 */
const REACH_CLAUSE: Readonly<Record<LeadReach, (actorId: string, ownerId: SQL) => SQL>> = {
  owned_by_me: (actorId, ownerId) => sql`${ownerId} = ${actorId}`,
  unassigned_queue: (_actorId, ownerId) => sql`${ownerId} is null`,
  my_unassigned_captures: (actorId, ownerId) =>
    sql`(${ownerId} is null and ${lead.createdBy} = ${actorId})`,
  my_booked_visits: (actorId) =>
    sql`exists (select 1 from ${leadVisitBooking} where ${leadVisitBooking.tenantId} = ${lead.tenantId} and ${leadVisitBooking.leadId} = ${lead.id} and ${leadVisitBooking.surveyorUserId} = ${actorId} and not exists (select 1 from ${leadVisitBooking} replacing where replacing.tenant_id = ${leadVisitBooking.tenantId} and replacing.rescheduled_from_id = ${leadVisitBooking.id}))`,
};

function scopeWhere(scope: LeadScope, actorId: string, ownerId: SQL): SQL {
  if (scope.kind === 'all') return sql`true`;
  if (scope.reaches.length === 0) return sql`false`;
  const clauses = scope.reaches.map((reach) => REACH_CLAUSE[reach](actorId, ownerId));
  return sql`(${sql.join(clauses, sql` or `)})`;
}

/**
 * The ONE visibility predicate every lead read and act applies: every lead at
 * `all`, else the OR of the reaches — and no lead at all when the presets reach none, so a scope
 * fails closed. It names `lead` unaliased, so a query applying it reads `from lead`.
 */
export function leadScopeWhere(scope: LeadScope, actorId: string): SQL {
  return scopeWhere(scope, actorId, sql`${lead.ownerUserId}`);
}

/**
 * The lead left the queue once, straight to the owner it has now: its one and only assignment
 * names that owner. A screen that showed it unassigned lost exactly that race (`M02-67`); a lead
 * reassigned since is not what that screen showed.
 */
const wentFromTheQueueToItsOwner = sql`(select array_agg(${leadAssignment.assignedTo}) from ${leadAssignment} where ${leadAssignment.tenantId} = ${lead.tenantId} and ${leadAssignment.leadId} = ${lead.id}) = array[${lead.ownerUserId}]`;

/** A `lead_assignment` row once gave the lead to this person. */
const onceAssignedTo = (ownerId: string) =>
  sql`exists (select 1 from ${leadAssignment} where ${leadAssignment.tenantId} = ${lead.tenantId} and ${leadAssignment.leadId} = ${lead.id} and ${leadAssignment.assignedTo} = ${ownerId})`;

/**
 * The same predicate over the lead as the person's screen showed it, held by `seenOwnerId` — and
 * only when the lead truly was: unassigned until it went straight to its owner now, or given to
 * that owner by a `lead_assignment` row. A lead this alone reaches may answer only who holds it
 * now (`M02-67`): a manager's assign that loses the race learns who won, though the winning
 * assign took the lead out of the manager's scope; an owner the lead never had, or an unassigned
 * screen of a lead reassigned since, reaches nothing.
 */
export function leadScopeAsSeenWhere(
  scope: LeadScope,
  actorId: string,
  seenOwnerId: string | null,
): SQL {
  const heldAsShown =
    seenOwnerId === null ? wentFromTheQueueToItsOwner : onceAssignedTo(seenOwnerId);
  return sql`(${heldAsShown} and ${scopeWhere(scope, actorId, sql`${seenOwnerId}::uuid`)})`;
}

/**
 * Whether a notice's recipient may open the lead it names — the same predicate their own lead
 * reads apply, so a notice never carries a lead its recipient's scope withholds.
 */
export function leadReadableBy(tx: DbTransaction, tenantId: string, leadId: string): MayRead {
  return async (candidate) => {
    const [found] = await tx
      .select({ id: lead.id })
      .from(lead)
      .where(
        and(
          eq(lead.tenantId, tenantId),
          eq(lead.id, leadId),
          leadScopeWhere(leadScopeOf(candidate.roles), candidate.userId),
        ),
      );
    return found !== undefined;
  };
}
