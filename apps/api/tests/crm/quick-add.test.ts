import {
  IDEMPOTENCY_KEY_REUSED,
  type LeadDetail,
  type LeadInbox,
  type LeadList,
} from '@heliogrid/contracts';
import { customer } from '@heliogrid/db';
import { FOUNDER_ROLE, LEAD_SOURCES } from '@heliogrid/domain';
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
} from './support';

/**
 * Quick add over the wire (`M02-01`, `M02-03`, `M02-05`, `M02-13`): a number alone saves a lead
 * whose missing facts read as gaps, the type typed at capture is the segment every read carries,
 * and every read carries a source from the closed set. A retried send makes one lead (`F4-07`).
 */

const here = aStaffedCompany('Quick Add EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'QUICK ADD PROOF',
  'Quick add is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('quick add, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a capture with only a phone number saves a lead with named gaps', async () => {
    const lead = await captured(owner(), aCapture(aPhone()));
    expect(lead.lead).toMatchObject({
      name: null,
      city: null,
      segment: null,
      source: 'quick_add',
      stage: 'new',
      state: null,
      owner: null,
      monthlyBill: null,
      value: null,
    });
    expect(lead.customer).toMatchObject({ name: null, city: null, contacts: [] });
    expect(lead.qualify).toEqual({
      roofOwnership: null,
      roofType: null,
      shading: null,
      timeline: null,
      decisionMaker: null,
    });
    const read = await owner().call<LeadDetail>('GET', `/leads/${lead.lead.id}`);
    expect(read).toMatchObject({
      status: HttpStatus.OK,
      body: { lead: { name: null, city: null } },
    });
  });

  it('the type chosen at capture is the segment on every lead read', async () => {
    const phone = aPhone();
    const made = await captured(
      owner(),
      aCapture(phone, { name: 'Anil Traders', segment: 'commercial' }),
    );
    const detail = await owner().call<LeadDetail>('GET', `/leads/${made.lead.id}`);
    const list = await owner().call<LeadList>('GET', `/leads?q=${encodeURIComponent(phone)}`);
    const inbox = await owner().call<LeadInbox>('GET', '/lead-inbox?limit=100');
    const segments = [
      made.lead.segment,
      detail.body.lead.segment,
      list.body.items.find((one) => one.id === made.lead.id)?.segment,
      inbox.body.items.find((one) => one.id === made.lead.id)?.segment,
    ];
    expect(segments).toEqual(['commercial', 'commercial', 'commercial', 'commercial']);
  });

  it('every lead read carries a source from the closed set', async () => {
    const referrer = await captured(owner(), aCapture(aPhone(), { name: 'Sunil Patil' }));
    await captured(
      owner(),
      aCapture(aPhone(), { referredBy: { customerId: referrer.customer.id } }),
    );
    await captured(owner(), aCapture(aPhone(), { referredBy: { name: 'A neighbour' } }));
    const list = await owner().call<LeadList>('GET', '/leads?limit=100');
    const inbox = await owner().call<LeadInbox>('GET', '/lead-inbox?limit=100');
    const sources = [...list.body.items, ...inbox.body.items].map((one) => one.source);
    expect(new Set(sources)).toEqual(new Set(['quick_add', 'referral']));
    for (const source of sources) expect(LEAD_SOURCES).toContain(source);
  });

  it('a retried send with its key answers the first lead and makes no second', async () => {
    const phone = aPhone();
    const key = retryKey();
    const body = aCapture(phone, { name: 'Ravi' });
    const first = await owner().call<LeadDetail>('POST', '/leads', body, key);
    const again = await owner().call<LeadDetail>('POST', '/leads', body, key);
    const other = await owner().call('POST', '/leads', { ...body, name: 'Ravi K' }, key);
    expect([first.status, again.status]).toEqual([HttpStatus.CREATED, HttpStatus.CREATED]);
    expect(again.body.lead.id).toBe(first.body.lead.id);
    expect(other).toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      body: { error: { code: IDEMPOTENCY_KEY_REUSED } },
    });
    const held = await world.pools.admin.db
      .select({ id: customer.id })
      .from(customer)
      .where(eq(customer.phoneE164, phone));
    expect(held).toHaveLength(1);
  });

  it('a number no market length allows is refused on its field', async () => {
    const reply = await owner().call('POST', '/leads', aCapture('+91984502774'), retryKey());
    expect(reply).toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      body: { error: { code: 'VALIDATION_FAILED', details: [{ path: 'phoneE164' }] } },
    });
  });
});
