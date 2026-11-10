import type { ActivityPage, LeadDetail } from '@heliogrid/contracts';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type Caller,
  type CrmWorld,
  captured,
  openCrmWorld,
  ownLead,
  preset,
} from './support';

/**
 * The customer record's calling compliance (`M02-37`, V1 ruling): do-not-call and preferred
 * language, and nothing voice-only — do-not-call removes every dial offer (`M02-44`). Another
 * customer the record names — kept beside it, or referred by it — is named only to a reader whose
 * scope reaches that customer.
 */

const here = aStaffedCompany('Customer Record EPC', {
  owner: [FOUNDER_ROLE],
  rajesh: [preset.sales_executive],
  sunita: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'CUSTOMER RECORD PROOF',
  'The customer record is UNPROVEN on the wire in this run.',
);

/** Every fact the customer record carries — a voice-only compliance field would be a new key here. */
const CUSTOMER_FACTS = [
  'city',
  'contacts',
  'doNotCall',
  'id',
  'keptDuplicates',
  'name',
  'phoneE164',
  'preferredLanguage',
  'primaryContactId',
  'referred',
  'wrongNumber',
];

describe.skipIf(skip)('the customer record, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a customer carries do-not-call and preferred language and no voice-only compliance field', async () => {
    const made = await captured(owner(), aCapture(aPhone(), { name: 'Sanjay Deshmukh' }));
    expect(Object.keys(made.customer).sort()).toEqual(CUSTOMER_FACTS);
    expect(made.customer).toMatchObject({ doNotCall: false, preferredLanguage: null });
    expect(made.canDial).toBe(true);

    const edited = await owner().call<LeadDetail>('PATCH', `/leads/${made.lead.id}`, {
      doNotCall: true,
      preferredLanguage: 'mr',
      capturedAt: new Date().toISOString(),
    });
    expect(edited.status).toBe(HttpStatus.OK);
    expect(edited.body.customer).toMatchObject({ doNotCall: true, preferredLanguage: 'mr' });
    expect(edited.body.canDial).toBe(false);
    expect(Object.keys(edited.body.customer).sort()).toEqual(CUSTOMER_FACTS);

    const lifted = await owner().call<LeadDetail>('PATCH', `/leads/${made.lead.id}`, {
      doNotCall: false,
      capturedAt: new Date().toISOString(),
    });
    expect(lifted.body).toMatchObject({ customer: { doNotCall: false }, canDial: true });
  });

  it('a record names another customer only to a reader whose scope reaches them', async () => {
    const [rajesh, sunita] = [world.as(here.members.rajesh), world.as(here.members.sunita)];
    const give = (leadId: string, who: 'rajesh' | 'sunita') =>
      ownLead(world, leadId, here.people[who].userId);
    const phone = aPhone();
    const shopA = await captured(owner(), aCapture(phone, { name: 'Shop A' }));
    const keepBoth = { otherCustomerId: shopA.customer.id, reason: 'Two shops, one line' };
    const shopB = await captured(owner(), aCapture(phone, { name: 'Shop B', keepBoth }));
    const referrer = await captured(owner(), aCapture(aPhone(), { name: 'Sunil Patil' }));
    const referredBy = { customerId: referrer.customer.id };
    const referred = await captured(owner(), aCapture(aPhone(), { name: 'Ashok', referredBy }));
    await give(shopA.lead.id, 'rajesh');
    await give(referrer.lead.id, 'rajesh');
    await give(shopB.lead.id, 'sunita');
    await give(referred.lead.id, 'sunita');

    const namesOn = async (caller: Caller, leadId: string) => {
      const detail = (await caller.call<LeadDetail>('GET', `/leads/${leadId}`)).body;
      const page = await caller.call<ActivityPage>('GET', `/leads/${leadId}/activities`);
      const kept = page.body.items.flatMap((one) =>
        one.kind === 'duplicate_kept' && 'otherName' in one.body ? [one.body.otherName] : [],
      );
      return {
        kept: detail.customer.keptDuplicates.map((one) => one.name),
        timeline: kept,
        referred: detail.customer.referred.map((one) => one.name),
      };
    };
    expect(await namesOn(sunita, shopB.lead.id)).toEqual({
      kept: [null],
      timeline: [null],
      referred: [],
    });
    expect(await namesOn(rajesh, shopA.lead.id)).toEqual({
      kept: [null],
      timeline: [null],
      referred: [],
    });
    expect(await namesOn(rajesh, referrer.lead.id)).toEqual({
      kept: [],
      timeline: [],
      referred: [null],
    });
    expect(await namesOn(owner(), shopB.lead.id)).toEqual({
      kept: ['Shop A'],
      timeline: ['Shop A'],
      referred: [],
    });
    expect((await namesOn(owner(), referrer.lead.id)).referred).toEqual(['Ashok']);
  });
});
