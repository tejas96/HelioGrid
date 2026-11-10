import type {
  ActivityPage,
  Contact,
  LeadDetail,
  Merged,
  MergePicksWire,
  MergePreview,
} from '@heliogrid/contracts';
import { file, leadVisitBooking, task } from '@heliogrid/db';
import { eq } from 'drizzle-orm';
import { aCapture, aPhone, type Caller, type CrmWorld, captured, retryKey } from './support';

/** The merge proofs' pieces: the two routes, a pair to merge, and a loser with everything. */

/** A side for every field the pair below disagrees on. */
export const everyPick: MergePicksWire = {
  name: 'survivor',
  city: 'loser',
  primary_contact: 'loser',
};

const now = () => new Date().toISOString();

export const previewOf = (caller: Caller, survivorId: string, loserId: string) =>
  caller.call<MergePreview>(
    'GET',
    `/customers/merge-preview?survivorId=${survivorId}&loserId=${loserId}`,
  );

/** The merge as sent; a refusal's envelope rides the same body type for the assertions. */
export const mergeOf = (
  caller: Caller,
  survivorId: string,
  loserId: string,
  picks: MergePicksWire = everyPick,
) =>
  caller.call<Merged & { error: { code: string; facts?: unknown } }>('POST', '/customers/merge', {
    survivorId,
    loserId,
    picks,
    capturedAt: now(),
  });

/** Priya entered twice: once in Nashik, once as "Priya S." in Nasik, each with one lead. */
export async function aPair(caller: Caller) {
  return {
    survivor: await captured(caller, aCapture(aPhone(), { name: 'Priya Sharma', city: 'Nashik' })),
    loser: await captured(caller, aCapture(aPhone(), { name: 'Priya S.', city: 'Nasik' })),
  };
}

/** A customer's one stream, newest first, as the caller reads it. */
export async function streamOf(caller: Caller, customerId: string) {
  const reply = await caller.call<ActivityPage>(
    'GET',
    `/customers/${customerId}/activities?limit=100`,
  );
  return reply.body.items;
}

/**
 * Everything a merge moves, on the loser: a husband as their primary contact, a lead they referred,
 * and a booking, a task and a photo on their lead — the last three on the admin path, as the slices
 * that write them are proven elsewhere.
 */
export async function furnishLoser(
  world: CrmWorld,
  caller: Caller,
  loser: LeadDetail,
  by: { readonly tenantId: string; readonly userId: string },
) {
  const { tenantId, userId: byUserId } = by;
  const husband = await caller.call<Contact>(
    'POST',
    `/customers/${loser.customer.id}/contacts`,
    { name: 'Rakesh Sharma', phoneE164: aPhone(), roleLabelId: null },
    retryKey(),
  );
  await caller.call('PUT', `/customers/${loser.customer.id}/primary-contact`, {
    contactId: husband.body.id,
  });
  const referred = await captured(
    caller,
    aCapture(aPhone(), { name: 'Ashok Patil', referredBy: { customerId: loser.customer.id } }),
  );
  const on = { tenantId, leadId: loser.lead.id, createdAt: new Date(), createdBy: byUserId };
  const admin = world.pools.admin.db;
  const [visit] = await admin
    .insert(leadVisitBooking)
    .values({ ...on, scheduledAt: new Date(), surveyorUserId: byUserId, address: 'Nasik' })
    .returning({ id: leadVisitBooking.id });
  const [followUp] = await admin
    .insert(task)
    .values({
      ...on,
      assigneeUserId: byUserId,
      kind: 'follow_up',
      dueAt: new Date(),
      status: 'open',
      provenance: 'manual',
    })
    .returning({ id: task.id });
  const [photo] = await admin
    .insert(file)
    .values({
      tenantId,
      subjectKind: 'lead',
      subjectRef: loser.lead.id,
      provider: 'local',
      externalId: `merge-proof/${loser.lead.id}`,
      contentType: 'image/png',
      byteSize: 1,
      checksumSha256: 'merge-proof',
      uploadedBy: byUserId,
      declaredAt: new Date(),
    })
    .returning({ id: file.id });
  if (visit === undefined || followUp === undefined || photo === undefined) {
    throw new Error('the loser was not furnished');
  }
  return {
    husband: husband.body,
    referred,
    visitId: visit.id,
    taskId: followUp.id,
    fileId: photo.id,
  };
}

/** The lead each furnished row now hangs on, on the admin path. */
export async function leadsHoldingFurnished(
  world: CrmWorld,
  furnished: { readonly visitId: string; readonly taskId: string; readonly fileId: string },
) {
  const admin = world.pools.admin.db;
  const [visit] = await admin
    .select({ leadId: leadVisitBooking.leadId })
    .from(leadVisitBooking)
    .where(eq(leadVisitBooking.id, furnished.visitId));
  const [followUp] = await admin
    .select({ leadId: task.leadId })
    .from(task)
    .where(eq(task.id, furnished.taskId));
  const [photo] = await admin
    .select({ leadId: file.subjectRef })
    .from(file)
    .where(eq(file.id, furnished.fileId));
  return [visit?.leadId, followUp?.leadId, photo?.leadId];
}
