import type { LeadDetail, MemberRef } from '@heliogrid/contracts';
import { lead, leadAssignment } from '@heliogrid/db';
import { asc, eq } from 'drizzle-orm';
import type { Reply } from '../support/http';
import { aCapture, aPhone, type Caller, type CrmWorld, captured } from './support';

/** An assign refusal as the wire carries it: its code, the facts or the fields it names. */
interface AssignRefusal {
  readonly error: {
    readonly code: string;
    readonly facts?: { readonly owner?: MemberRef | null; readonly refusal?: string };
    readonly details?: readonly { readonly path: string }[];
  };
}

export const refusalOf = (reply: Reply<unknown>) => (reply.body as AssignRefusal).error;

/** One assign as a screen sends it: to whom, and the owner the screen showed. */
export function assignOne(
  caller: Caller,
  leadId: string,
  assigneeId: string,
  expectedOwnerId: string | null,
  reason?: string,
) {
  return caller.call<LeadDetail | AssignRefusal>('POST', `/leads/${leadId}/assign`, {
    assigneeId,
    expectedOwnerId,
    ...(reason === undefined ? {} : { reason }),
  });
}

/** A fresh unassigned lead captured by `caller`, by its id. */
export async function aLeadBy(caller: Caller, name: string): Promise<string> {
  return (await captured(caller, aCapture(aPhone(), { name }))).lead.id;
}

/** Sets a lead's columns on the admin path — an owner, a stage, a state — as a case needs. */
export function shapeLead(
  world: CrmWorld,
  leadId: string,
  shape: Partial<typeof lead.$inferInsert>,
) {
  return world.pools.admin.db.update(lead).set(shape).where(eq(lead.id, leadId));
}

/** A junk close, whole, as the table's close check requires. */
export const binnedBy = (closedBy: string) =>
  ({ lifecycleState: 'junk', closedAs: 'junk', closedAt: new Date(), closedBy }) as const;

/** The lead's owner as stored, on the admin path. */
export async function ownerOf(world: CrmWorld, leadId: string): Promise<string | null> {
  const [row] = await world.pools.admin.db
    .select({ ownerId: lead.ownerUserId })
    .from(lead)
    .where(eq(lead.id, leadId));
  if (row === undefined) throw new Error(`no lead ${leadId}`);
  return row.ownerId;
}

/** The lead's assignment trail, oldest first, on the admin path. */
export function trailOf(world: CrmWorld, leadId: string) {
  return world.pools.admin.db
    .select()
    .from(leadAssignment)
    .where(eq(leadAssignment.leadId, leadId))
    .orderBy(asc(leadAssignment.assignedAt), asc(leadAssignment.id));
}
