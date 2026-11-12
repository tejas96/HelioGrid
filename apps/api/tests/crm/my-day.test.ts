import type { MyDay, Task } from '@heliogrid/contracts';
import { customer, lead } from '@heliogrid/db';
import { FOUNDER_ROLE, MS_PER_DAY } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { aVisit, booked, dayFromToday, onTheClock } from './lead-work';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  HOUR_MS,
  MINUTE_MS,
  openCrmWorld,
  ownLead,
  preset,
  retryKey,
} from './support';

/**
 * My Day on the wire (`M07-01`…`M07-04`): the reader's own open tasks on active leads their scope
 * reaches — overdue, today, then the seven days after today, oldest first — with the one to do now
 * and whole counts. A parked lead's task, another person's task and a lead out of scope are absent.
 */

const here = aStaffedCompany('My Day EPC', {
  owner: [FOUNDER_ROLE],
  ana: [preset.sales_executive],
  ben: [preset.sales_executive],
  cara: [preset.sales_executive],
  sam: [preset.survey_engineer],
  idle: [preset.sales_executive],
});

const skip = skipWithoutDatabase('MY DAY PROOF', 'My Day is UNPROVEN on the wire in this run.');

type Name = keyof typeof here.members;

/** The last day of "this week": the seventh after today (ruling 31). */
const LAST_DAY_OF_WEEK = 7;
/** A snooze's wake day, any day ahead. */
const WAKES_IN_DAYS = 3;

describe.skipIf(skip)('My Day, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const myDayOf = async (who: Name) => {
    const reply = await world.as(here.members[who]).call<MyDay>('GET', '/my-day');
    expect(reply.status).toBe(HttpStatus.OK);
    return reply.body;
  };
  /** A lead captured by the owner and handed to `who`. */
  const aLeadOf = async (who: Name) => {
    const made = await captured(owner(), aCapture(aPhone()));
    await ownLead(world, made.lead.id, here.people[who].userId);
    return made;
  };
  const aTask = async (leadId: string, who: Name, dueAt: number) => {
    const reply = await owner().call<Task>(
      'POST',
      `/leads/${leadId}/tasks`,
      {
        kind: 'follow_up',
        dueAt: new Date(dueAt).toISOString(),
        assigneeId: here.people[who].userId,
      },
      retryKey(),
    );
    expect(reply.status).toBe(HttpStatus.CREATED);
    return reply.body.id;
  };

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('bands run overdue, today, then the week, oldest first, and next up is the most overdue', async () => {
    const made = await aLeadOf('ana');
    const now = Date.now();
    const todayEnds = onTheClock(dayFromToday(1), '00:00');
    const weekEnds = onTheClock(dayFromToday(LAST_DAY_OF_WEEK + 1), '00:00');
    const later = await aTask(made.lead.id, 'ana', now - HOUR_MS);
    const oldest = await aTask(made.lead.id, 'ana', now - 2 * MS_PER_DAY);
    const today = await aTask(made.lead.id, 'ana', now + (todayEnds - now) / 2);
    const lastOfWeek = await aTask(made.lead.id, 'ana', weekEnds - MINUTE_MS);
    const inWeek = await aTask(
      made.lead.id,
      'ana',
      onTheClock(dayFromToday(LAST_DAY_OF_WEEK), '10:00'),
    );
    await aTask(made.lead.id, 'ana', weekEnds);
    const day = await myDayOf('ana');
    expect(day.items.map((item) => [item.task.id, item.band])).toEqual([
      [oldest, 'overdue'],
      [later, 'overdue'],
      [today, 'today'],
      [inWeek, 'week'],
      [lastOfWeek, 'week'],
    ]);
    expect(day.nextTaskId).toBe(oldest);
    expect(day.counts).toEqual({ overdue: 2, today: 1, week: 2, doneToday: 0 });
    expect(day).toMatchObject({ today: dayFromToday(0), timeZone: 'Asia/Kolkata' });
    expect(day.items[0]).toMatchObject({
      lead: { id: made.lead.id, owner: { userId: here.people.ana.userId } },
      task: { assignee: { userId: here.people.ana.userId, name: here.people.ana.name } },
      canDial: true,
      visitPlace: null,
    });
  });

  it('a task ticked done today leaves the list and counts as done today', async () => {
    const made = await aLeadOf('cara');
    const id = await aTask(made.lead.id, 'cara', Date.now() + HOUR_MS);
    const done = await world
      .as(here.members.cara)
      .call('POST', `/tasks/${id}/done`, { capturedAt: new Date().toISOString() });
    expect(done.status).toBe(HttpStatus.OK);
    const day = await myDayOf('cara');
    expect(day.items.map((item) => item.task.id)).not.toContain(id);
    expect(day.counts.doneToday).toBe(1);
  });

  it('a parked lead’s task, another person’s task and a lead out of scope are absent', async () => {
    const visible = await aLeadOf('ben');
    const mine = await aTask(visible.lead.id, 'ben', Date.now() - HOUR_MS);
    await aTask(visible.lead.id, 'cara', Date.now() - HOUR_MS);
    const snoozed = await aLeadOf('ben');
    await aTask(snoozed.lead.id, 'ben', Date.now() - HOUR_MS);
    const parked = await owner().call('POST', `/leads/${snoozed.lead.id}/snooze`, {
      capturedAt: new Date().toISOString(),
      wakeOn: dayFromToday(WAKES_IN_DAYS),
    });
    expect(parked.status).toBe(HttpStatus.OK);
    const dormant = await aLeadOf('ben');
    await aTask(dormant.lead.id, 'ben', Date.now() - HOUR_MS);
    await world.pools.admin.db
      .update(lead)
      .set({ lifecycleState: 'dormant' })
      .where(eq(lead.id, dormant.lead.id));
    const caras = await aLeadOf('cara');
    await aTask(caras.lead.id, 'ben', Date.now() - HOUR_MS);
    const day = await myDayOf('ben');
    expect(day.items.map((item) => item.task.id)).toEqual([mine]);
    expect(day.counts).toEqual({ overdue: 1, today: 0, week: 0, doneToday: 0 });
  });

  it('a number no one may dial offers no call; a site visit carries its place', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    await booked(owner(), made.lead.id, aVisit(here.people.sam.userId));
    await world.pools.admin.db
      .update(customer)
      .set({ wrongNumberAt: new Date() })
      .where(eq(customer.id, made.customer.id));
    const day = await myDayOf('sam');
    expect(day.items).toMatchObject([
      {
        task: { kind: 'site_visit' },
        band: 'week',
        canDial: false,
        visitPlace: '14 Shivaji Nagar, Pune',
      },
    ]);
    expect(day.nextTaskId).toBeNull();
  });

  it('a person with no tasks reads an empty day in the company’s currency', async () => {
    const day = await myDayOf('idle');
    expect(day).toMatchObject({
      items: [],
      nextTaskId: null,
      currencyCode: 'INR',
      counts: { overdue: 0, today: 0, week: 0, doneToday: 0 },
    });
  });
});
