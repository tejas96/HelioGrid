import type { BookVisit, CallOutcome, LeadDetail } from '@heliogrid/contracts';
import { leadVisitBooking, task } from '@heliogrid/db';
import {
  type CalendarDate,
  clockTime,
  localDate,
  localInstant,
  MS_PER_DAY,
} from '@heliogrid/domain';
import { HttpStatus } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { CrmDailySweepService } from '../../src/modules/crm/crm.daily-sweep.service';
import { type Caller, type CrmWorld, retryKey } from './support';

/*
 * The lead's life after capture as its proofs drive it: the calls, visits and sweeps of
 * T-M02-010, 013, 014 and 015, on the clock every seeded company keeps.
 */

/** Every seeded company's zone (`support/fixture.ts`). */
export const KOLKATA = 'Asia/Kolkata';

/** The company's day `days` from today. */
export function dayFromToday(days: number, now: number = Date.now()): CalendarDate {
  return localDate(now + days * MS_PER_DAY, KOLKATA);
}

/** The instant the company's clock reads `hhmm` on `day`. */
export function onTheClock(day: CalendarDate, hhmm: string): number {
  return localInstant(day, clockTime(hhmm), KOLKATA);
}

/** A call logged on a lead as it must save: its 201 body. */
export async function logged(
  caller: Caller,
  leadId: string,
  outcome: CallOutcome,
): Promise<LeadDetail> {
  const reply = await caller.call<LeadDetail>(
    'POST',
    `/leads/${leadId}/calls`,
    { outcome, capturedAt: new Date().toISOString() },
    retryKey(),
  );
  if (reply.status !== HttpStatus.CREATED) {
    throw new Error(`log call: expected 201, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.body;
}

/** A visit's body: two days out at 10:30 on the company's clock, unless the case says otherwise. */
export const aVisit = (surveyorId: string, slot: Partial<BookVisit> = {}): BookVisit => ({
  date: dayFromToday(2),
  time: '10:30',
  surveyorId,
  address: '14 Shivaji Nagar, Pune',
  capturedAt: new Date().toISOString(),
  ...slot,
});

/** A visit booked as it must save: the lead as it then stands. */
export async function booked(
  caller: Caller,
  leadId: string,
  visit: BookVisit,
): Promise<LeadDetail> {
  const reply = await caller.call<LeadDetail>('POST', `/leads/${leadId}/visits`, visit, retryKey());
  if (reply.status !== HttpStatus.CREATED) {
    throw new Error(`book visit: expected 201, got ${reply.status} ${JSON.stringify(reply.body)}`);
  }
  return reply.body;
}

/** Every task on one lead, oldest first, on the admin path. */
export function tasksOf(world: CrmWorld, leadId: string) {
  return world.pools.admin.db
    .select()
    .from(task)
    .where(eq(task.leadId, leadId))
    .orderBy(asc(task.createdAt), asc(task.id));
}

/** Every visit booked on one lead, oldest first, on the admin path. */
export function visitsOf(world: CrmWorld, leadId: string) {
  return world.pools.admin.db
    .select()
    .from(leadVisitBooking)
    .where(eq(leadVisitBooking.leadId, leadId))
    .orderBy(asc(leadVisitBooking.createdAt));
}

/** The sweep as the api composes it, driven on an injected clock for one company. */
export function sweepAt(world: CrmWorld, tenantId: string, at: number): Promise<boolean> {
  return world.http.app.get(CrmDailySweepService).sweepTenant(tenantId, at);
}
