import { MY_DAY_BANDS, MY_DAY_ITEMS_MAX } from '@heliogrid/domain';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { currencyCodeSchema } from '../common';
import { unauthenticatedEnvelope } from '../error';
import { calendarDateSchema } from '../tenant-settings';
import { leadSummarySchema, taskSchema } from './schemas';

const c = initContract();

/** One open task of mine on My Day (`M07-01`), with the lead it is on. */
export const myDayItemSchema = z.object({
  task: taskSchema,
  band: z.enum(MY_DAY_BANDS),
  lead: leadSummarySchema,
  /** False when the customer is do-not-call or a wrong number: no call is offered (`M02-44`). */
  canDial: z.boolean(),
  /** A booked visit's place, for directions; `null` for every other task. */
  visitPlace: z.string().nullable(),
});
export type MyDayItem = z.infer<typeof myDayItemSchema>;

/**
 * My Day (`SCR-M07-01`, `M07-01`…`M07-04`): my open tasks on the leads I can see that are active —
 * overdue, today, then the seven days after today — oldest first. A snoozed, dormant or closed
 * lead's tasks are absent until the lead returns (`M02-58`). `nextTaskId` is the one thing to do now
 * (`nextUpOf`). The counts are whole; `items` holds the first `MY_DAY_ITEMS_MAX`, oldest first.
 */
export const myDaySchema = z.object({
  today: calendarDateSchema,
  /** The tenant's zone, so the screen moves a task to "tomorrow" on the company's clock. */
  timeZone: z.string().min(1),
  currencyCode: currencyCodeSchema,
  nextTaskId: z.string().uuid().nullable(),
  items: z.array(myDayItemSchema).max(MY_DAY_ITEMS_MAX),
  counts: z.object({
    overdue: z.number().int().nonnegative(),
    today: z.number().int().nonnegative(),
    week: z.number().int().nonnegative(),
    /** What I ticked done today — the day's progress. */
    doneToday: z.number().int().nonnegative(),
  }),
});
export type MyDay = z.infer<typeof myDaySchema>;

export const myDayContract = c.router({
  read: {
    method: 'GET',
    path: '/my-day',
    summary:
      'My Day — my open tasks on active leads I can see: overdue, today, then the next seven days, with the one to do now',
    responses: { 200: myDaySchema, 401: unauthenticatedEnvelope },
  },
});
