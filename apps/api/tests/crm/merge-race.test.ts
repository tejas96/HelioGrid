import type { CreateLead, LeadDetail } from '@heliogrid/contracts';
import { contact, customer, duplicateLink, referral } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq, or, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { holdLock } from '../support/held-lock';
import { aPair, mergeOf } from './merge-support';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  openCrmWorld,
  retryKey,
} from './support';

/**
 * A write that names a customer at the moment that customer is merged away (`M02-60`): it queues
 * behind the merge and then meets the tombstone as gone, so no contact, primary, referral or
 * kept-both link ever lands on a merged customer. A write on one of the loser's leads queues behind
 * the merge too and then finds the lead on the survivor — never a deadlock, never a false 404 —
 * because every write locks leads first, then customers. Each case FORCES the overlap: the loser's
 * row is held until the merge and the write are both seen waiting on it, the merge first.
 */

const here = aStaffedCompany('Merge Race EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'MERGE RACE PROOF',
  'Writes racing a merge are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('writes racing a merge, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  /** Merges the loser into the survivor while `write` waits behind it; answers both replies. */
  async function racingTheMerge<T>(
    pair: { readonly survivor: LeadDetail; readonly loser: LeadDetail },
    write: () => Promise<T>,
  ) {
    const loserId = pair.loser.customer.id;
    const held = await holdLock(sql`select id from customer where id = ${loserId} for update`);
    const merging = mergeOf(owner(), pair.survivor.customer.id, loserId);
    await held.waitForWaiters(1);
    const writing = write();
    await held.waitForWaiters(2);
    await held.release();
    return Promise.all([merging, writing]);
  }

  it('a contact added while its customer is merged away is refused, never left on the tombstone', async () => {
    const pair = await aPair(owner());
    const loserId = pair.loser.customer.id;
    const [merged, added] = await racingTheMerge(pair, () =>
      owner().call(
        'POST',
        `/customers/${loserId}/contacts`,
        { name: 'Rakesh Sharma', phoneE164: aPhone(), roleLabelId: null },
        retryKey(),
      ),
    );
    expect([merged.status, added.status]).toEqual([HttpStatus.OK, HttpStatus.NOT_FOUND]);
    const onTombstone = await world.pools.admin.db
      .select({ id: contact.id })
      .from(contact)
      .where(eq(contact.customerId, loserId));
    expect(onTombstone).toEqual([]);
  });

  it('a primary named while its customer is merged away is refused, and the tombstone names none', async () => {
    const pair = await aPair(owner());
    const loserId = pair.loser.customer.id;
    const husband = await owner().call<{ id: string }>(
      'POST',
      `/customers/${loserId}/contacts`,
      { name: 'Rakesh Sharma', phoneE164: aPhone(), roleLabelId: null },
      retryKey(),
    );
    const [merged, named] = await racingTheMerge(pair, () =>
      owner().call('PUT', `/customers/${loserId}/primary-contact`, { contactId: husband.body.id }),
    );
    expect([merged.status, named.status]).toEqual([HttpStatus.OK, HttpStatus.NOT_FOUND]);
    const [tombstone] = await world.pools.admin.db
      .select({ primaryContactId: customer.primaryContactId })
      .from(customer)
      .where(eq(customer.id, loserId));
    expect(tombstone).toEqual({ primaryContactId: null });
  });

  it('a field edit made while its lead is merged over waits for the merge and lands on the survivor', async () => {
    const pair = await aPair(owner());
    const [merged, edited] = await racingTheMerge(pair, () =>
      owner().call<LeadDetail>('PATCH', `/leads/${pair.loser.lead.id}`, {
        city: 'Pune',
        capturedAt: new Date().toISOString(),
      }),
    );
    expect([merged.status, edited.status]).toEqual([HttpStatus.OK, HttpStatus.OK]);
    expect(edited.body.customer).toMatchObject({ id: pair.survivor.customer.id, city: 'Pune' });
  });

  it('a wrong number marked while its lead is merged over waits for the merge and blocks the survivor', async () => {
    const pair = await aPair(owner());
    const [merged, marked] = await racingTheMerge(pair, () =>
      owner().call<LeadDetail>('POST', `/leads/${pair.loser.lead.id}/disqualify`, {
        reason: 'wrong_number',
        capturedAt: new Date().toISOString(),
      }),
    );
    expect([merged.status, marked.status]).toEqual([HttpStatus.OK, HttpStatus.OK]);
    expect(marked.body.customer.id).toBe(pair.survivor.customer.id);
    expect([marked.body.lead.state, marked.body.canDial]).toEqual(['disqualified', false]);
  });

  it.each([
    {
      naming: 'referred by',
      body: (loser: LeadDetail): CreateLead =>
        aCapture(aPhone(), { referredBy: { customerId: loser.customer.id } }),
      // The referrer is gone: the capture is refused as one naming a customer the reader lacks.
      refusal: HttpStatus.NOT_FOUND,
    },
    {
      naming: 'kept beside',
      body: (loser: LeadDetail): CreateLead =>
        aCapture(loser.customer.phoneE164, {
          keepBoth: { otherCustomerId: loser.customer.id, reason: 'Two roofs, two bills' },
        }),
      // The number now belongs to the survivor, so the capture meets the sheet again.
      refusal: HttpStatus.CONFLICT,
    },
  ])(
    'a capture $naming a customer merged away at that moment is refused, never linked to the tombstone',
    async ({ body, refusal }) => {
      const pair = await aPair(owner());
      const loserId = pair.loser.customer.id;
      const [merged, made] = await racingTheMerge(pair, () =>
        owner().call('POST', '/leads', body(pair.loser), retryKey()),
      );
      expect([merged.status, made.status]).toEqual([HttpStatus.OK, refusal]);
      const admin = world.pools.admin.db;
      const referrals = await admin
        .select({ id: referral.id })
        .from(referral)
        .where(eq(referral.referringCustomerId, loserId));
      const links = await admin
        .select({ id: duplicateLink.id })
        .from(duplicateLink)
        .where(or(eq(duplicateLink.customerAId, loserId), eq(duplicateLink.customerBId, loserId)));
      expect([referrals, links]).toEqual([[], []]);
    },
  );

  it('a merge whose loser just took another merge’s leads holds them too, so an edit on one waits', async () => {
    const pair = await aPair(owner());
    const [first, folded] = [pair.survivor, pair.loser];
    const then = await captured(owner(), aCapture(aPhone(), { name: 'Priya T', city: 'Pune' }));
    const helper = await owner().call<{ id: string }>(
      'POST',
      `/customers/${first.customer.id}/contacts`,
      { name: 'Suresh Sharma', phoneE164: aPhone(), roleLabelId: null },
      retryKey(),
    );
    // The first merge folds a lead into `first` while the second, merging `first` away, waits on it;
    // the second is then held at `first`'s contact, past its locks, while an edit of that lead runs.
    const atLoser = await holdLock(
      sql`select id from customer where id = ${folded.customer.id} for update`,
    );
    const atContact = await holdLock(
      sql`select id from contact where id = ${helper.body.id} for update`,
    );
    const merging = mergeOf(owner(), first.customer.id, folded.customer.id);
    await atLoser.waitForWaiters(1);
    const mergingOn = mergeOf(owner(), then.customer.id, first.customer.id);
    await atLoser.waitForWaiters(2);
    await atLoser.release();
    expect((await merging).status).toBe(HttpStatus.OK);
    await atContact.waitForWaiters(1);
    const editing = owner().call<LeadDetail>('PATCH', `/leads/${folded.lead.id}`, {
      city: 'Pune',
      capturedAt: new Date().toISOString(),
    });
    await atContact.waitForWaiters(2);
    await atContact.release();
    const [merged, edited] = await Promise.all([mergingOn, editing]);
    expect([merged.status, edited.status]).toEqual([HttpStatus.OK, HttpStatus.OK]);
    expect(edited.body.customer).toMatchObject({ id: then.customer.id, city: 'Pune' });
  });
});
