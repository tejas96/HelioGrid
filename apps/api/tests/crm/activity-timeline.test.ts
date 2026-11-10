import type { ActivityPage, LeadDetail } from '@heliogrid/contracts';
import { activity, customer, lead, leadStageTransition } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  openCrmWorld,
  retryKey,
  timelineOf,
} from './support';

/**
 * The timeline (`M02-35`, T-M02-012): one append-only stream the api role can only add to, each
 * entry naming its kind and actor, newest first by the server's apply order; a customer's stream
 * reads through the merge tombstone; and work on a dormant lead returns it to its stage (`M02-52`).
 */

const here = aStaffedCompany('Timeline EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'TIMELINE PROOF',
  'The timeline is UNPROVEN on the wire in this run.',
);

/** Postgres's refusal of an act the role holds no grant for. */
const INSUFFICIENT_PRIVILEGE = '42501';

describe.skipIf(skip)('the timeline, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('the api role cannot update or delete an activity', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const runtime = world.pools.tenants;
    const tenantId = here.company.tenantId;
    const update = runtime.withTenantTransaction(tenantId, (tx) =>
      tx
        .update(activity)
        .set({ body: { rewritten: true } })
        .where(eq(activity.leadId, made.lead.id)),
    );
    await expect(update).rejects.toMatchObject({ cause: { code: INSUFFICIENT_PRIVILEGE } });
    const remove = runtime.withTenantTransaction(tenantId, (tx) =>
      tx.delete(activity).where(eq(activity.leadId, made.lead.id)),
    );
    await expect(remove).rejects.toMatchObject({ cause: { code: INSUFFICIENT_PRIVILEGE } });
    expect((await timelineOf(owner(), made.lead.id)).totalCount).toBe(1);
  });

  it('every lead event appends one entry naming its kind and actor', async () => {
    const phone = aPhone();
    const made = await captured(owner(), aCapture(phone, { name: 'Gita Rane' }));
    await owner().call('PATCH', `/leads/${made.lead.id}`, {
      city: 'Satara',
      capturedAt: new Date().toISOString(),
    });
    await owner().call('POST', `/leads/${made.lead.id}/enquiries`, aCapture(phone), retryKey());
    const { items, totalCount } = await timelineOf(owner(), made.lead.id);
    expect(totalCount).toBe(items.length);
    expect(items.map((one) => [one.kind, one.actor])).toEqual([
      ['enquiry', { kind: 'person', id: here.people.owner.userId, name: here.people.owner.name }],
      [
        'field_change',
        { kind: 'person', id: here.people.owner.userId, name: here.people.owner.name },
      ],
      [
        'lead_created',
        { kind: 'person', id: here.people.owner.userId, name: here.people.owner.name },
      ],
    ]);
    // The retry key the enquiry was sent with is the server's, never the reader's.
    expect(items[0]?.body).not.toHaveProperty('creationKey');
    expect(items[0]?.body).not.toHaveProperty('creationFingerprint');
  });

  it('a customer stream reads every customer merged into it', async () => {
    const survivor = await captured(owner(), aCapture(aPhone(), { name: 'Survivor' }));
    const merged = await captured(owner(), aCapture(aPhone(), { name: 'Merged' }));
    await world.pools.admin.db
      .update(customer)
      .set({
        mergedInto: survivor.customer.id,
        mergedAt: new Date(),
        mergedBy: here.people.owner.userId,
      })
      .where(eq(customer.id, merged.customer.id));
    // The merge slice re-points the loser's leads; this proof re-points the one it made.
    await world.pools.admin.db
      .update(lead)
      .set({ customerId: survivor.customer.id })
      .where(eq(lead.id, merged.lead.id));
    const stream = await owner().call<ActivityPage>(
      'GET',
      `/customers/${survivor.customer.id}/activities`,
    );
    expect(stream.status).toBe(HttpStatus.OK);
    expect(stream.body.items.map((one) => one.leadId).sort()).toEqual(
      [survivor.lead.id, merged.lead.id].sort(),
    );
    const gone = await owner().call('GET', `/customers/${merged.customer.id}/activities`);
    expect(gone.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('work on a dormant lead returns it to its stage, the system naming the move', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await world.pools.admin.db
      .update(lead)
      .set({ lifecycleState: 'dormant' })
      .where(eq(lead.id, made.lead.id));
    const edited = await owner().call<LeadDetail>('PATCH', `/leads/${made.lead.id}`, {
      name: 'Awake',
      capturedAt: new Date().toISOString(),
    });
    expect(edited.body.lead).toMatchObject({ state: null, stage: 'new' });
    const [latest] = (await timelineOf(owner(), made.lead.id)).items;
    expect(latest).toMatchObject({
      kind: 'state_change',
      actor: { kind: 'system', id: null },
      body: { from: 'dormant', to: null, cause: 'automation' },
    });
    const moves = await world.pools.admin.db
      .select()
      .from(leadStageTransition)
      .where(eq(leadStageTransition.leadId, made.lead.id));
    expect(moves).toMatchObject([
      { moveKind: 'lifecycle_state', fromState: 'dormant', toState: null, movedBy: null },
    ]);
  });
});
