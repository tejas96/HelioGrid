import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { amountSchema, currencyCodeSchema, nonNegativeAmountSchema, uuidSchema } from './common';
import { leadStageSchema, lostReasonSchema } from './crm/vocabulary';
import { errorEnvelope, unauthenticatedEnvelope } from './error';
import { calendarDateSchema } from './tenant-settings';

const c = initContract();

/** A month on the tenant's clock, `YYYY-MM`. */
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'a month as YYYY-MM');

const countSchema = z.number().int().nonnegative();

/** A lead the attention list names, with what makes it urgent. */
const attentionLeadSchema = z.object({
  leadId: uuidSchema,
  name: z.string().nullable(),
  stage: leadStageSchema,
  /** Whole days in its current funnel stage (`M13-25`'s "in [stage] for 34 days"). */
  days: countSchema,
});

/**
 * "What needs you" (`M13-15`): each item counts what waits and names enough to act on it — leads
 * with no owner past 24 hours, parts paid late, projects blocked on the company itself, the deals
 * waiting longest in their stage, and the reader's own overdue tasks (`M13-10`'s edge case).
 */
export const needsYouSchema = z.object({
  unassigned: z.object({ count: countSchema, oldestHours: countSchema.nullable() }),
  paymentsLate: z.object({
    count: countSchema,
    amount: nonNegativeAmountSchema,
    oldestDays: countSchema.nullable(),
    /** The project whose part is late longest — what *Open* opens; `null` when none is late. */
    oldestProjectId: uuidSchema.nullable(),
  }),
  blockedOnUs: z.object({
    count: countSchema,
    oldest: z
      .object({ projectId: uuidSchema, name: z.string().nullable(), days: countSchema })
      .nullable(),
  }),
  waitingLongest: z.array(attentionLeadSchema).max(3),
  myOverdueTasks: countSchema,
});
export type NeedsYou = z.infer<typeof needsYouSchema>;

/**
 * The owner dashboard (`SCR-M13-01`, `M13-14`): one read, scoped by role — the whole company for
 * the EPC Owner, the team for a Sales Manager (`M13-07`, `M13-30`). Money is figures already
 * recorded: collections from Money due's sums (`M13-16`), won from the projects Mark won started,
 * a cancelled one never counted (`M13-04`). "This month" is so far, never projected (`M13-19`).
 */
export const ownerDashboardSchema = z.object({
  scope: z.enum(['company', 'team']),
  today: calendarDateSchema,
  month: monthSchema,
  currencyCode: currencyCodeSchema,
  needsYou: needsYouSchema,
  cash: z.object({
    collectedThisMonth: amountSchema,
    collectedLastMonth: amountSchema,
    toCollect: nonNegativeAmountSchema,
    late: z.object({ count: countSchema, amount: nonNegativeAmountSchema }),
  }),
  won: z.object({
    thisMonth: z.object({ count: countSchema, amount: nonNegativeAmountSchema }),
    lastMonth: z.object({ count: countSchema, amount: nonNegativeAmountSchema }),
    /** The low median of the last 90 days' won deals and how many it reads (`M13-18`). */
    median: z.object({ amount: nonNegativeAmountSchema, of: countSchema }).nullable(),
  }),
  /** The company's monthly target, `null` when none is set — never a nag (`M13-17`). */
  target: z.object({ amount: nonNegativeAmountSchema }).nullable(),
  /** Whether the reader may set the company target inline. */
  canSetTarget: z.boolean(),
  /** Open leads by funnel stage, before won (`M13-14`'s pipeline: counts until proposals price them). */
  pipeline: z.array(z.object({ stage: leadStageSchema, count: countSchema })),
  /** Closed deals over the last `windowDays` (`M13-23`, `M13-27`). */
  winLoss: z.object({
    windowDays: countSchema,
    won: countSchema,
    lost: countSchema,
    lostReasons: z.array(z.object({ reason: lostReasonSchema, count: countSchema })),
  }),
});
export type OwnerDashboard = z.infer<typeof ownerDashboardSchema>;

/** Set or clear the company target for the current month (`M13-17`); `null` clears it. */
export const setTargetSchema = z
  .object({ month: monthSchema, amount: nonNegativeAmountSchema.nullable() })
  .strict();
export type SetTarget = z.infer<typeof setTargetSchema>;

/** A target for any month but the current one: the dashboard sets this month's only. */
export const TARGET_MONTH_NOT_CURRENT = 'TARGET_MONTH_NOT_CURRENT' as const;

export const dashboardsContract = c.router({
  owner: {
    method: 'GET',
    path: '/dashboards/owner',
    summary:
      'The owner dashboard — what needs you, cash, won, pipeline and win/loss, scoped to the company or the team',
    responses: { 200: ownerDashboardSchema, 401: unauthenticatedEnvelope },
  },
  setTarget: {
    method: 'PUT',
    path: '/dashboards/target',
    body: setTargetSchema,
    summary:
      'Set or clear the company target for this month — the same target again changes nothing',
    responses: {
      200: z.object({ target: z.object({ amount: nonNegativeAmountSchema }).nullable() }),
      401: unauthenticatedEnvelope,
      422: errorEnvelope(z.enum([TARGET_MONTH_NOT_CURRENT])),
    },
  },
});
