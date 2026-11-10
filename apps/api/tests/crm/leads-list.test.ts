import type { LeadDetail, LeadList } from '@heliogrid/contracts';
import { lead } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { dayFromToday, logged } from './lead-work';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  openCrmWorld,
  ownLead,
  preset,
} from './support';

/**
 * The Leads list (`M02-40`, `SCR-M02-03`): the monthly bill sorts and bounds the list in the
 * tenant's currency; a lead whose bill is unknown sorts last and falls outside every bound.
 */

const here = aStaffedCompany('Bills EPC', { owner: [FOUNDER_ROLE] });
/** A snooze's wake day, far enough ahead that no sweep in the run wakes it. */
const DAYS_SNOOZED = 3;
const piped = aStaffedCompany('Pipeline EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'LEADS LIST PROOF',
  'The leads list is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('the leads list, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const named: Record<string, string> = {};

  beforeAll(async () => {
    world = await openCrmWorld([here, piped]);
    for (const [name, bill] of [
      ['Low', '1500'],
      ['Middle', '4200.50'],
      ['High', '12000'],
      ['Unknown', null],
    ] as const) {
      const made = await captured(owner(), aCapture(aPhone(), { name }));
      named[made.lead.id] = name;
      if (bill === null) continue;
      const edit = await owner().call<LeadDetail>('PATCH', `/leads/${made.lead.id}`, {
        monthlyBill: bill,
        capturedAt: new Date().toISOString(),
      });
      expect(edit.status).toBe(HttpStatus.OK);
    }
  });

  afterAll(async () => {
    await world.close();
  });

  const namesOf = (list: LeadList) => list.items.map((one) => named[one.id]);

  it("the leads list sorts and filters by the monthly bill in the tenant's currency", async () => {
    const largest = await owner().call<LeadList>('GET', '/leads?sort=monthly_bill&order=desc');
    expect(largest.status).toBe(HttpStatus.OK);
    expect(largest.body.currencyCode).toBe('INR');
    expect(namesOf(largest.body)).toEqual(['High', 'Middle', 'Low', 'Unknown']);
    expect(largest.body.items.map((one) => one.monthlyBill)).toEqual([
      { amount: '12000.00', tier: 'assumed' },
      { amount: '4200.50', tier: 'assumed' },
      { amount: '1500.00', tier: 'assumed' },
      null,
    ]);

    const smallest = await owner().call<LeadList>('GET', '/leads?sort=monthly_bill&order=asc');
    expect(namesOf(smallest.body)).toEqual(['Low', 'Middle', 'High', 'Unknown']);

    const bounded = await owner().call<LeadList>(
      'GET',
      '/leads?sort=monthly_bill&order=asc&billMin=1500.01&billMax=12000',
    );
    expect(namesOf(bounded.body)).toEqual(['Middle', 'High']);
    expect(bounded.body.totalCount).toBe(2);

    const atTheEdge = await owner().call<LeadList>('GET', '/leads?billMin=1500&billMax=1500');
    expect(namesOf(atTheEdge.body)).toEqual(['Low']);
  });

  it('a bound finer than the smallest unit of the currency is refused on its field', async () => {
    const reply = await owner().call('GET', '/leads?billMin=10.005');
    expect(reply).toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      body: { error: { code: 'VALIDATION_FAILED', details: [{ path: 'billMin' }] } },
    });
  });

  it('a page holds its limit and the count is the whole match', async () => {
    const page = await owner().call<LeadList>(
      'GET',
      '/leads?sort=monthly_bill&order=desc&limit=2&page=2',
    );
    expect(namesOf(page.body)).toEqual(['Low', 'Unknown']);
    expect(page.body.totalCount).toBe(Object.keys(named).length);
  });

  it('a name or a begun number finds its lead', async () => {
    const byName = await owner().call<LeadList>('GET', '/leads?q=midd');
    expect(namesOf(byName.body)).toEqual(['Middle']);
  });

  it('the list carries its pipeline whatever else is filtered, and each row its wake day, tries and next step', async () => {
    const boss = () => world.as(piped.members.owner);
    const rep = piped.people.rep.userId;
    const [called, snoozed, quiet, waiting] = await Promise.all(
      ['Called', 'Snoozed', 'Quiet', 'Waiting'].map((name) =>
        captured(boss(), aCapture(aPhone(), { name })),
      ),
    );
    if (!called || !snoozed || !quiet || !waiting) throw new Error('four leads were captured');
    await ownLead(world, called.lead.id, rep);
    await ownLead(world, snoozed.lead.id, rep);
    await logged(boss(), called.lead.id, 'no_answer');
    const wakeOn = dayFromToday(DAYS_SNOOZED);
    const snooze = await boss().call('POST', `/leads/${snoozed.lead.id}/snooze`, {
      wakeOn,
      capturedAt: new Date().toISOString(),
    });
    expect(snooze.status).toBe(HttpStatus.OK);
    await world.pools.admin.db
      .update(lead)
      .set({ lifecycleState: 'dormant' })
      .where(eq(lead.id, quiet.lead.id));

    const everyone = await boss().call<LeadList>('GET', '/leads');
    const open = [called, snoozed, waiting];
    expect(everyone.body.pipeline).toEqual({
      byStage: [{ stage: 'new', count: open.length }],
      dormant: [quiet].length,
    });
    const rowOf = (id: string) => everyone.body.items.find((one) => one.id === id);
    expect(rowOf(called.lead.id)).toMatchObject({
      unansweredCalls: 1,
      wakeOn: null,
      nextTask: { kind: 'call', title: null },
    });
    expect(rowOf(snoozed.lead.id)).toMatchObject({ state: 'snoozed', wakeOn, unansweredCalls: 0 });
    expect(rowOf(quiet.lead.id)).toBeUndefined();

    const filtered = await boss().call<LeadList>('GET', '/leads?stage=qualified&source=import');
    expect(filtered.body).toMatchObject({ items: [], totalCount: 0 });
    expect(filtered.body.pipeline).toEqual(everyone.body.pipeline);

    const theRep = await boss().call<LeadList>('GET', `/leads?ownerId=${rep}`);
    expect(theRep.body.pipeline).toEqual({
      byStage: [{ stage: 'new', count: [called, snoozed].length }],
      dormant: 0,
    });
  });
});
