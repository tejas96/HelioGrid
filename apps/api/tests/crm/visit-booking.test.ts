import type { ActivityPage, LeadDetail, VisitSurveyors } from '@heliogrid/contracts';
import { tenantMembership } from '@heliogrid/db';
import { FOUNDER_ROLE } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { aVisit, booked, dayFromToday, onTheClock, tasksOf } from './lead-work';
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
 * The site-visit booking (`M02-46`, T-M02-014): the lead's record of the visit M04 takes over —
 * date and time on the company's clock, a surveyor who holds survey, the confirmed address — on
 * the timeline, with the lead at `survey` and the surveyor holding a site-visit task.
 */

const here = aStaffedCompany('Visits EPC', {
  owner: [FOUNDER_ROLE],
  surveyor: [preset.survey_engineer],
  accounts: [preset.finance],
  rep: [preset.sales_executive],
  leaver: [preset.survey_engineer],
});

const at = () => new Date().toISOString();
/** The day a visit is moved to, after the two days out it was first booked for. */
const MOVED_TO_DAY = 3;

const skip = skipWithoutDatabase(
  'VISIT BOOKING PROOF',
  'The site-visit booking is UNPROVEN on the wire in this run.',
);

describe.skipIf(skip)('booking a site visit, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const person = (who: keyof typeof here.people) => here.people[who].userId;

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('a booking records date, time, surveyor and confirmed address on the timeline', async () => {
    const made = await captured(owner(), aCapture(aPhone(), { name: 'Meera Joshi' }));
    const surveyor = here.people.surveyor;
    const visit = aVisit(surveyor.userId);
    const detail = await booked(owner(), made.lead.id, visit);
    expect(detail.lead.stage).toBe('survey');
    expect(detail.visit).toMatchObject({
      date: visit.date,
      time: '10:30',
      surveyor: { userId: surveyor.userId, name: surveyor.name },
      address: '14 Shivaji Nagar, Pune',
      rescheduledFromId: null,
    });
    const timeline = await owner().call<ActivityPage>('GET', `/leads/${made.lead.id}/activities`);
    const entry = timeline.body.items.find((one) => one.kind === 'visit_booked');
    expect(entry?.body).toEqual({
      visitId: detail.visit?.id,
      date: visit.date,
      time: '10:30',
      surveyor: { userId: surveyor.userId, name: surveyor.name },
      address: '14 Shivaji Nagar, Pune',
    });
    const siteVisits = (await tasksOf(world, made.lead.id)).filter(
      (one) => one.kind === 'site_visit',
    );
    expect(siteVisits).toHaveLength(1);
    expect(siteVisits[0]).toMatchObject({
      assigneeUserId: surveyor.userId,
      provenance: 'visit_booked',
      status: 'open',
    });
    expect(siteVisits[0]?.dueAt.getTime()).toBe(onTheClock(dayFromToday(2), '10:30'));
  });

  it('a lead holds one visit in force: a second booking answers VISIT_ALREADY_BOOKED', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await booked(owner(), made.lead.id, aVisit(here.people.surveyor.userId));
    const again = await owner().call(
      'POST',
      `/leads/${made.lead.id}/visits`,
      aVisit(here.people.surveyor.userId, { time: '15:00' }),
      retryKey(),
    );
    expect(again.status).toBe(HttpStatus.CONFLICT);
    expect(again.body).toMatchObject({ error: { code: 'VISIT_ALREADY_BOOKED' } });
  });

  it('a surveyor sees the lead while its visit is theirs, and not once it is rescheduled away', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const first = await booked(owner(), made.lead.id, aVisit(person('surveyor')));
    const surveyor = world.as(here.members.surveyor);
    const read = () => surveyor.call('GET', `/leads/${made.lead.id}`);
    expect((await read()).status).toBe(HttpStatus.OK);
    const moved = await owner().call(
      'POST',
      `/visits/${first.visit?.id}/reschedule`,
      {
        date: dayFromToday(MOVED_TO_DAY),
        time: '11:00',
        surveyorId: person('owner'),
        capturedAt: at(),
      },
      retryKey(),
    );
    expect(moved.status).toBe(HttpStatus.CREATED);
    expect((await read()).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('a member who does not hold survey cannot be sent, and nothing is booked', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const reply = await owner().call<LeadDetail>(
      'POST',
      `/leads/${made.lead.id}/visits`,
      aVisit(here.people.accounts.userId),
      retryKey(),
    );
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body).toMatchObject({ error: { code: 'SURVEYOR_UNAVAILABLE' } });
    const read = await owner().call<LeadDetail>('GET', `/leads/${made.lead.id}`);
    expect(read.body).toMatchObject({ visit: null, lead: { stage: 'new' } });
  });

  it('a closed lead takes no visit until it is reopened', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await owner().call('POST', `/leads/${made.lead.id}/junk`, {
      capturedAt: new Date().toISOString(),
    });
    const reply = await owner().call(
      'POST',
      `/leads/${made.lead.id}/visits`,
      aVisit(here.people.surveyor.userId),
      retryKey(),
    );
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body).toMatchObject({
      error: { code: 'LEAD_TRANSITION_REFUSED', facts: { refusal: 'lead_closed' } },
    });
  });

  it('a preset without the booking grant cannot book', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const surveyor = world.as(here.members.surveyor);
    const reply = await surveyor.call(
      'POST',
      `/leads/${made.lead.id}/visits`,
      aVisit(here.people.surveyor.userId),
      retryKey(),
    );
    const offered = await surveyor.call('GET', '/visit-surveyors');
    expect([reply.status, offered.status]).toEqual([HttpStatus.FORBIDDEN, HttpStatus.FORBIDDEN]);
  });

  it('Book visit offers a Sales Executive every active member who holds survey, and no other', async () => {
    const offered = async () => {
      const reply = await world
        .as(here.members.rep)
        .call<VisitSurveyors>('GET', '/visit-surveyors');
      expect(reply.status).toBe(HttpStatus.OK);
      return reply.body.items.map((one) => one.userId).sort();
    };
    const surveying = ['owner', 'surveyor', 'rep', 'leaver'] as const;
    expect(await offered()).toEqual(surveying.map(person).sort());

    await world.pools.admin.db
      .update(tenantMembership)
      .set({ status: 'deactivated' })
      .where(eq(tenantMembership.id, here.members.leaver.membershipId));
    const stillActive = ['owner', 'surveyor', 'rep'] as const;
    expect(await offered()).toEqual(stillActive.map(person).sort());
  });
});
