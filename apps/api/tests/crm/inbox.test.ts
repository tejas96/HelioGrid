import type { LeadInbox } from '@heliogrid/contracts';
import { customer, lead } from '@heliogrid/db';
import { FOUNDER_ROLE, MS_PER_DAY } from '@heliogrid/domain';
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
  ownLead,
} from './support';

/**
 * The Lead Inbox (`M02-23`, `SCR-M02-02`): one queue of unassigned active leads from every source,
 * newest first, with the head's counts — an assigned or parked lead is not in it.
 */

const here = aStaffedCompany('Inbox EPC', { owner: [FOUNDER_ROLE] });

const skip = skipWithoutDatabase(
  'LEAD INBOX PROOF',
  'The inbox is UNPROVEN on the wire in this run.',
);

/** How long ago the import slice's rows landed, in this proof. */
const IMPORTED_DAYS_AGO = 2;

/** The leads the first case leaves waiting: one from each source. */
const WAITING = 3;

/** Of those, the ones waiting more than a day: the import's alone. */
const WAITING_PAST_A_DAY = 1;

describe.skipIf(skip)('the lead inbox, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('the inbox lists unassigned active leads from every source, newest first', async () => {
    const quick = await captured(owner(), aCapture(aPhone(), { name: 'Quick' }));
    const referred = await captured(
      owner(),
      aCapture(aPhone(), { referredBy: { name: 'Neighbour' } }),
    );
    const imported = await captured(owner(), aCapture(aPhone(), { name: 'Imported' }));
    const assigned = await captured(owner(), aCapture(aPhone(), { name: 'Assigned' }));
    const snoozed = await captured(owner(), aCapture(aPhone(), { name: 'Snoozed' }));
    const admin = world.pools.admin.db;
    // The import slice lands its rows as `import` and two days old; the lifecycle slice snoozes.
    await admin
      .update(lead)
      .set({ source: 'import', createdAt: new Date(Date.now() - IMPORTED_DAYS_AGO * MS_PER_DAY) })
      .where(eq(lead.id, imported.lead.id));
    await ownLead(world, assigned.lead.id, here.people.owner.userId);
    await admin
      .update(lead)
      .set({ lifecycleState: 'snoozed', snoozeWakeOn: '2099-01-01' })
      .where(eq(lead.id, snoozed.lead.id));

    const reply = await owner().call<LeadInbox>('GET', '/lead-inbox?limit=100');
    expect(reply.status).toBe(HttpStatus.OK);
    expect(reply.body.items.map((one) => one.id)).toEqual([
      referred.lead.id,
      quick.lead.id,
      imported.lead.id,
    ]);
    expect(reply.body.items.map((one) => [one.source, one.owner, one.state])).toEqual([
      ['referral', null, null],
      ['quick_add', null, null],
      ['import', null, null],
    ]);
    expect(reply.body).toMatchObject({
      totalCount: WAITING,
      past24Hours: WAITING_PAST_A_DAY,
      currencyCode: 'INR',
    });
    expect(new Map(reply.body.bySource.map((one) => [one.source, one.count]))).toEqual(
      new Map([
        ['import', 1],
        ['quick_add', 1],
        ['referral', 1],
      ]),
    );
    const [oldest] = await admin
      .select({ at: lead.createdAt })
      .from(lead)
      .where(eq(lead.id, imported.lead.id));
    expect(reply.body.oldestAt).toBe(oldest?.at.toISOString());
    const [named] = await admin
      .select({ name: customer.name })
      .from(customer)
      .where(eq(customer.id, quick.customer.id));
    expect(reply.body.items[1]?.name).toBe(named?.name);
  });

  it('a page of the inbox holds its limit and counts every waiting lead', async () => {
    const reply = await owner().call<LeadInbox>('GET', '/lead-inbox?limit=1&page=2');
    expect(reply.body.items).toHaveLength(1);
    expect(reply.body.totalCount).toBe(WAITING);
  });
});
