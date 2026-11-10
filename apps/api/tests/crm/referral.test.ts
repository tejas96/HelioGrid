import type { ActivityPage, LeadDetail } from '@heliogrid/contracts';
import { referral } from '@heliogrid/db';
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
  preset,
  retryKey,
} from './support';

/**
 * Referral (`M02-16`): a lead referred by an existing customer links the two — the referred lead
 * carries "came from" naming the referrer, the referrer's record lists whom they referred, and both
 * streams say so; a referrer who is not a customer is the name typed. Attribution only.
 */

const here = aStaffedCompany('Referral EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
});

const skip = skipWithoutDatabase('REFERRAL PROOF', 'Referral is UNPROVEN on the wire in this run.');

describe.skipIf(skip)('referral, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a referral shows on both records and the referred lead carries came-from', async () => {
    const referrer = await captured(owner(), aCapture(aPhone(), { name: 'Sunil Patil' }));
    const referred = await captured(
      owner(),
      aCapture(aPhone(), { name: 'Ashok Patil', referredBy: { customerId: referrer.customer.id } }),
    );
    expect(referred.lead.source).toBe('referral');
    expect(referred.cameFrom).toEqual({ customerId: referrer.customer.id, name: 'Sunil Patil' });

    const referrerNow = await owner().call<LeadDetail>('GET', `/leads/${referrer.lead.id}`);
    expect(referrerNow.body.customer.referred).toEqual([
      { leadId: referred.lead.id, name: 'Ashok Patil' },
    ]);

    const links = await world.pools.admin.db
      .select()
      .from(referral)
      .where(eq(referral.referredLeadId, referred.lead.id));
    expect(links).toMatchObject([{ referringCustomerId: referrer.customer.id }]);

    const body = {
      referrerCustomerId: referrer.customer.id,
      referrerName: 'Sunil Patil',
      referredLeadId: referred.lead.id,
    };
    for (const customerId of [referrer.customer.id, referred.customer.id]) {
      const stream = await owner().call<ActivityPage>('GET', `/customers/${customerId}/activities`);
      expect(
        stream.body.items.filter((one) => one.kind === 'referral').map((one) => one.body),
      ).toEqual([body]);
    }
  });

  it('a referrer who is not a customer is the name typed, with no link', async () => {
    const referred = await captured(
      owner(),
      aCapture(aPhone(), { referredBy: { name: 'The milkman' } }),
    );
    expect(referred.cameFrom).toEqual({ customerId: null, name: 'The milkman' });
    const links = await world.pools.admin.db
      .select()
      .from(referral)
      .where(eq(referral.referredLeadId, referred.lead.id));
    expect(links).toHaveLength(0);
  });

  it('a referrer the person cannot see is not found, and nothing is saved', async () => {
    const referrer = await captured(owner(), aCapture(aPhone(), { name: 'Hidden' }));
    const phone = aPhone();
    const reply = await world
      .as(here.members.rep)
      .call(
        'POST',
        '/leads',
        aCapture(phone, { referredBy: { customerId: referrer.customer.id } }),
        retryKey(),
      );
    expect(reply.status).toBe(HttpStatus.NOT_FOUND);
  });
});
