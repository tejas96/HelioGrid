import type { ActivityPage, ComposedMessageWire, LeadDetail } from '@heliogrid/contracts';
import { notification } from '@heliogrid/db';
import { FOUNDER_ROLE, formatDate, formatPhone, formatTime, IN_FORMATS } from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { skipWithoutDatabase } from '../support/fixture';
import { aVisit, booked, dayFromToday, visitsOf } from './lead-work';
import {
  aCapture,
  aPhone,
  aStaffedCompany,
  type CrmWorld,
  captured,
  entriesOfKind,
  openCrmWorld,
  preset,
  retryKey,
} from './support';

/**
 * Customer messages as copy-paste text (`M02-33`, `M02-47`, `M02-48`, T-M02-013): the starter words
 * filled with the lead's facts and handed back to paste; the timeline says a message was copied and
 * never that one was delivered, and a visit is messaged once.
 */

const here = aStaffedCompany('Messages EPC', {
  owner: [FOUNDER_ROLE],
  surveyor: [preset.survey_engineer],
});

const skip = skipWithoutDatabase(
  'MESSAGES PROOF',
  'Composing customer messages is UNPROVEN on the wire in this run.',
);

const now = () => new Date().toISOString();
/** The day a no-show's visit is moved to, and a later day a second reschedule asks for. */
const RESCHEDULED_TO = 4;
const ASKED_AGAIN_FOR = 5;

describe.skipIf(skip)('composing customer messages, over HTTP against a migrated database', () => {
  let world: CrmWorld;
  const owner = () => world.as(here.members.owner);
  const compose = (leadId: string, body: Record<string, unknown>, key = retryKey()) =>
    owner().call<ComposedMessageWire>(
      'POST',
      `/leads/${leadId}/messages`,
      { capturedAt: now(), ...body },
      key,
    );

  beforeAll(async () => {
    world = await openCrmWorld([here]);
  });

  afterAll(async () => {
    await world.close();
  });

  it('compose returns ready-to-paste text and the timeline claims no delivery', async () => {
    const made = await captured(owner(), aCapture(aPhone(), { name: 'Anil Kulkarni' }));
    const reply = await compose(made.lead.id, { templateKey: 'follow_up_nudge' });
    expect(reply.status).toBe(HttpStatus.CREATED);
    const { text } = reply.body;
    expect(text).toContain('Anil Kulkarni');
    expect(text).toContain(here.company.companyName);
    expect(text).toContain(here.people.owner.name);
    expect(text).toContain(formatPhone(IN_FORMATS, here.people.owner.phoneE164));
    expect(text).not.toMatch(/[<>{}]/);
    const timeline = await owner().call<ActivityPage>('GET', `/leads/${made.lead.id}/activities`);
    const copied = timeline.body.items.filter((one) => one.kind === 'message_copied');
    expect(copied).toHaveLength(1);
    // What was copied, and nothing about a send: no delivery state exists on this path.
    expect(copied[0]?.body).toEqual({ templateKey: 'follow_up_nudge', visitId: null });
    const sent = await world.pools.admin.db
      .select()
      .from(notification)
      .where(eq(notification.subjectRef, made.lead.id));
    expect(sent).toEqual([]);
  });

  it('a nudge to a customer with no name yet leaves the name out cleanly', async () => {
    const made = await captured(owner(), aCapture(aPhone()));
    const { text } = (await compose(made.lead.id, { templateKey: 'follow_up_nudge' })).body;
    expect(text.startsWith('Hello, this is')).toBe(true);
  });

  it('the visit confirmation names what, when, who is coming and their number', async () => {
    const made = await captured(owner(), aCapture(aPhone(), { name: 'Sunita Pawar' }));
    const surveyor = here.people.surveyor;
    const detail = await booked(owner(), made.lead.id, aVisit(surveyor.userId));
    const visitId = detail.visit?.id;
    const { text } = (await compose(made.lead.id, { templateKey: 'visit_confirmation', visitId }))
      .body;
    expect(text).toContain('site visit');
    expect(text).toContain(formatDate(IN_FORMATS, dayFromToday(2), 'en'));
    expect(text).toContain(formatTime(IN_FORMATS, '10:30'));
    expect(text).toContain(surveyor.name);
    expect(text).toContain(formatPhone(IN_FORMATS, surveyor.phoneE164));
    expect(text).toContain('14 Shivaji Nagar, Pune');
    expect(text).toContain('Sunita Pawar');
  });

  it('a visit that is not this lead’s is not found', async () => {
    const one = await captured(owner(), aCapture(aPhone()));
    const other = await captured(owner(), aCapture(aPhone()));
    const theirs = await booked(owner(), other.lead.id, aVisit(here.people.surveyor.userId));
    const reply = await compose(one.lead.id, {
      templateKey: 'visit_confirmation',
      visitId: theirs.visit?.id,
    });
    expect(reply.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('a no-show reschedule books a new visit and composes at most one reminder', async () => {
    const made = await captured(owner(), aCapture(aPhone(), { name: 'Kiran More' }));
    const first = await booked(owner(), made.lead.id, aVisit(here.people.surveyor.userId));
    const missed = first.visit?.id as string;
    const rescheduled = await owner().call<LeadDetail>(
      'POST',
      `/visits/${missed}/reschedule`,
      { date: dayFromToday(RESCHEDULED_TO), time: '16:00', capturedAt: now() },
      retryKey(),
    );
    expect(rescheduled.status).toBe(HttpStatus.CREATED);
    const next = rescheduled.body.visit;
    expect(next).toMatchObject({
      rescheduledFromId: missed,
      date: dayFromToday(RESCHEDULED_TO),
      time: '16:00',
    });
    expect(next?.id).not.toBe(missed);
    const visits = await visitsOf(world, made.lead.id);
    expect(visits.find((one) => one.id === missed)?.noShowAt).not.toBeNull();
    const twice = await owner().call(
      'POST',
      `/visits/${missed}/reschedule`,
      { date: dayFromToday(ASKED_AGAIN_FOR), time: '11:00', capturedAt: now() },
      retryKey(),
    );
    expect(twice.status).toBe(HttpStatus.CONFLICT);
    expect(twice.body).toMatchObject({ error: { code: 'VISIT_ALREADY_RESCHEDULED' } });

    const body = { templateKey: 'visit_confirmation', visitId: next?.id };
    const reminder = await compose(made.lead.id, body);
    const again = await compose(made.lead.id, body);
    expect(reminder.status).toBe(HttpStatus.CREATED);
    expect(again.body.text).toBe(reminder.body.text);
    expect(reminder.body.text).toContain(formatTime(IN_FORMATS, '16:00'));
    const copied = await entriesOfKind(world, made.lead.id, 'message_copied');
    expect(copied.filter((one) => one.body.visitId === next?.id)).toHaveLength(1);
    const marked = (await visitsOf(world, made.lead.id)).find((one) => one.id === next?.id);
    expect(marked?.reminderComposedAt).not.toBeNull();
  });
});
