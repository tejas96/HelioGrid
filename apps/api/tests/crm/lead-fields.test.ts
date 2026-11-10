import type { Activity, LeadDetail } from '@heliogrid/contracts';
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
  HOUR_MS,
  MINUTE_MS,
  openCrmWorld,
  ownLead,
  preset,
  timelineOf,
} from './support';

/**
 * Lead edits (`M02-36`, `M02-39`, `F4-16`): each field saves alone, per-field last writer wins by
 * the server's apply order — never the device clock — and every applied change writes one
 * `field_change` entry with field, old, new, actor and capture time; a value sent as stored writes
 * nothing.
 */

const here = aStaffedCompany('Lead Fields EPC', {
  owner: [FOUNDER_ROLE],
  rep: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'LEAD FIELDS PROOF',
  'Lead edits are UNPROVEN on the wire in this run.',
);

/** How far behind each person's device clock runs, in this proof. */
const REP_MINUTES_BEHIND = 5;
const OWNER_MINUTES_BEHIND = 2;

async function edited(
  caller: Caller,
  leadId: string,
  fields: Record<string, unknown>,
  capturedAt = new Date(),
) {
  const reply = await caller.call<LeadDetail>('PATCH', `/leads/${leadId}`, {
    ...fields,
    capturedAt: capturedAt.toISOString(),
  });
  if (reply.status !== HttpStatus.OK) {
    throw new Error(`edit: expected 200, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.body;
}

/** The lead's field changes, oldest first, as `[field, from, to]`. */
async function changesOf(caller: Caller, leadId: string) {
  const { items } = await timelineOf(caller, leadId);
  return items
    .filter(
      (one): one is Extract<Activity, { kind: 'field_change' }> => one.kind === 'field_change',
    )
    .reverse();
}

describe.skipIf(skip)('lead edits, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const rep = () => world.as(here.members.rep);
  const aLead = () => captured(owner(), aCapture(aPhone(), { name: 'Field Lead' }));

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('each qualifying answer saves alone and a partial set stays saved', async () => {
    const made = await aLead();
    await edited(owner(), made.lead.id, { roofOwnership: 'own' });
    await edited(owner(), made.lead.id, { roofType: 'rcc_flat' });
    const last = await edited(owner(), made.lead.id, { monthlyBill: '2400' });
    expect(last.qualify).toEqual({
      roofOwnership: 'own',
      roofType: 'rcc_flat',
      shading: null,
      timeline: null,
      decisionMaker: null,
    });
    expect(last.lead.monthlyBill).toEqual({ amount: '2400.00', tier: 'assumed' });
    const read = await owner().call<LeadDetail>('GET', `/leads/${made.lead.id}`);
    expect(read.body.qualify).toEqual(last.qualify);
    const changes = await changesOf(owner(), made.lead.id);
    expect(changes.map((one) => one.body)).toEqual([
      { field: 'roofOwnership', from: null, to: 'own' },
      { field: 'roofType', from: null, to: 'rcc_flat' },
      { field: 'monthlyBill', from: null, to: '2400.00' },
    ]);
    // The same answers again — the bill written another way — change nothing and write nothing.
    await edited(owner(), made.lead.id, { roofType: 'rcc_flat', monthlyBill: '2400.00' });
    expect(await changesOf(owner(), made.lead.id)).toHaveLength(changes.length);
  });

  it('two edits to one field both reach the timeline and the later apply wins', async () => {
    const made = await aLead();
    await edited(owner(), made.lead.id, { city: 'Nashik' });
    const last = await edited(owner(), made.lead.id, { city: 'Pune' });
    expect(last.lead.city).toBe('Pune');
    expect((await changesOf(owner(), made.lead.id)).map((one) => one.body)).toEqual([
      { field: 'city', from: null, to: 'Nashik' },
      { field: 'city', from: 'Nashik', to: 'Pune' },
    ]);
  });

  it('edits to two fields both apply, each with field, old, new, actor and capture time', async () => {
    const made = await aLead();
    await ownLead(world, made.lead.id, here.people.rep.userId);
    const repAt = new Date(Date.now() - REP_MINUTES_BEHIND * MINUTE_MS);
    const ownerAt = new Date(Date.now() - OWNER_MINUTES_BEHIND * MINUTE_MS);
    await edited(rep(), made.lead.id, { shading: 'partial' }, repAt);
    const last = await edited(owner(), made.lead.id, { timeline: 'within_month' }, ownerAt);
    expect(last.qualify).toMatchObject({ shading: 'partial', timeline: 'within_month' });
    const changes = await changesOf(owner(), made.lead.id);
    expect(
      changes.map((one) => [
        one.body,
        one.actor.kind,
        one.actor.id,
        one.actor.name,
        one.capturedAt,
      ]),
    ).toEqual([
      [
        { field: 'shading', from: null, to: 'partial' },
        'person',
        here.people.rep.userId,
        here.people.rep.name,
        repAt.toISOString(),
      ],
      [
        { field: 'timeline', from: null, to: 'within_month' },
        'person',
        here.people.owner.userId,
        here.people.owner.name,
        ownerAt.toISOString(),
      ],
    ]);
  });

  it('the overwritten value is recoverable from the timeline', async () => {
    const made = await aLead();
    await edited(owner(), made.lead.id, { name: 'Ramesh Pawar' });
    const last = await edited(owner(), made.lead.id, { name: 'Ramesh K. Pawar' });
    expect(last.lead.name).toBe('Ramesh K. Pawar');
    const [overwrite] = (await changesOf(owner(), made.lead.id)).filter(
      (one) => one.body.to === 'Ramesh K. Pawar',
    );
    expect(overwrite?.body).toEqual({ field: 'name', from: 'Ramesh Pawar', to: 'Ramesh K. Pawar' });
  });

  it('server apply order decides, not the device clock', async () => {
    const made = await aLead();
    const now = Date.now();
    await edited(owner(), made.lead.id, { decisionMaker: 'this_person' }, new Date(now));
    // A second device whose clock runs an hour behind applies after the first.
    const last = await edited(
      owner(),
      made.lead.id,
      { decisionMaker: 'someone_else' },
      new Date(now - HOUR_MS),
    );
    expect(last.qualify.decisionMaker).toBe('someone_else');
    const { items } = await timelineOf(owner(), made.lead.id);
    const decisions = items.filter((one) => one.kind === 'field_change');
    expect(decisions.map((one) => [one.body, one.capturedAt])).toEqual([
      [
        { field: 'decisionMaker', from: 'this_person', to: 'someone_else' },
        new Date(now - HOUR_MS).toISOString(),
      ],
      [{ field: 'decisionMaker', from: null, to: 'this_person' }, new Date(now).toISOString()],
    ]);
  });

  it('a bill finer than the currency is refused on its field and nothing changes', async () => {
    const made = await aLead();
    const reply = await owner().call('PATCH', `/leads/${made.lead.id}`, {
      monthlyBill: '100.005',
      capturedAt: new Date().toISOString(),
    });
    expect(reply).toMatchObject({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      body: { error: { code: 'DOMAIN_RULE_VIOLATION', details: [{ path: 'monthlyBill' }] } },
    });
    expect(await changesOf(owner(), made.lead.id)).toHaveLength(0);
  });
});
