import type { Notification, Paginated } from '@heliogrid/contracts';
import { leadVisitBooking } from '@heliogrid/db';
import { FOUNDER_ROLE, MS_PER_DAY, subjectAddressOf } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  noticesOf,
  openCrmWorld,
  ownLead,
  preset,
  retryKey,
} from '../crm/support';
import { skipWithoutDatabase } from '../support/fixture';

/**
 * The recipient rules resolved once (T-FPLAT-066, `F6-05`): a notice goes to each person a rule
 * names who may read its subject, once, and to the EPC Owner when no one remains — so its words
 * never hand a lead to someone whose scope withholds it. A notice whose lead later left the
 * reader's scope still lists, and opening it lands on the lead's 404: the honest landing.
 */

const here = aStaffedCompany('Recipients EPC', {
  owner: [FOUNDER_ROLE],
  surveyor: [preset.survey_engineer],
  rep: [preset.sales_executive],
  otherRep: [preset.sales_executive],
});

const skip = skipWithoutDatabase(
  'RECIPIENTS PROOF',
  'Notice recipients are UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('notice recipients, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const enquireOn = (leadId: string, phone: string) =>
    owner().call('POST', `/leads/${leadId}/enquiries`, aCapture(phone), retryKey());

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a notice carries only what its recipient may read', async () => {
    const phone = aPhone();
    const made = await captured(owner(), aCapture(phone, { name: 'Lata Gokhale' }));
    // The lead names the surveyor as its owner, but their scope reaches only leads whose booked
    // visit names them — and none does yet.
    await ownLead(world, made.lead.id, here.people.surveyor.userId);
    expect((await enquireOn(made.lead.id, phone)).status).toBe(HttpStatus.CREATED);
    expect(await noticesOf(world, here.people.surveyor.userId, made.lead.id)).toHaveLength(0);
    const [toOwner] = await noticesOf(world, here.people.owner.userId, made.lead.id);
    expect(toOwner).toMatchObject({ type: 'lead_enquiry', subjectKind: 'lead' });
    expect(toOwner?.title).toContain('Lata Gokhale');

    await world.pools.admin.db.insert(leadVisitBooking).values({
      tenantId: here.company.tenantId,
      leadId: made.lead.id,
      scheduledAt: new Date(Date.now() + MS_PER_DAY),
      surveyorUserId: here.people.surveyor.userId,
      address: '12 Lake Road, Pune',
      createdAt: new Date(),
      createdBy: here.people.owner.userId,
    });
    expect((await enquireOn(made.lead.id, phone)).status).toBe(HttpStatus.CREATED);
    const toSurveyor = await noticesOf(world, here.people.surveyor.userId, made.lead.id);
    expect(toSurveyor).toHaveLength(1);
    expect(toSurveyor[0]?.title).toContain('Lata Gokhale');
    expect(await noticesOf(world, here.people.owner.userId, made.lead.id)).toHaveLength(1);
  });

  it("a notice whose subject left the reader's scope opens the honest landing", async () => {
    const phone = aPhone();
    const made = await captured(owner(), aCapture(phone, { name: 'Nilesh Shinde' }));
    await ownLead(world, made.lead.id, here.people.rep.userId);
    expect((await enquireOn(made.lead.id, phone)).status).toBe(HttpStatus.CREATED);
    await ownLead(world, made.lead.id, here.people.otherRep.userId);

    const rep = world.as(here.members.rep);
    const inbox = await rep.call<Paginated<Notification>>('GET', '/notifications');
    const notice = inbox.body.items.find((one) => one.subjectRef === made.lead.id);
    expect(notice).toMatchObject({ type: 'lead_enquiry', subjectKind: 'lead' });
    expect(subjectAddressOf(notice?.subjectKind, notice?.subjectRef)).toBe(`leads/${made.lead.id}`);
    const opened = await rep.call('GET', `/leads/${made.lead.id}`);
    expect(opened).toMatchObject({
      status: HttpStatus.NOT_FOUND,
      body: { error: { code: 'NOT_FOUND' } },
    });
  });
});
