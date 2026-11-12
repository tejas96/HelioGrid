import { MONEY_DUE_GROUPS, TRANCHE_STATES } from '@heliogrid/domain';
import { z } from 'zod';
import {
  amountSchema,
  currencyCodeSchema,
  extensibleEnum,
  nonNegativeAmountSchema,
  paginated,
  paginationQuerySchema,
  uuidSchema,
} from '../common';
import { calendarDateSchema } from '../tenant-settings';

/** One part waiting for money, on Money due (`SCR-M11-01`). */
export const moneyDueRowSchema = z.object({
  projectId: uuidSchema,
  number: z.string(),
  name: z.string().nullable(),
  partId: uuidSchema,
  label: z.string(),
  state: extensibleEnum(TRANCHE_STATES),
  outstanding: nonNegativeAmountSchema,
  dueOn: calendarDateSchema,
  /** Late, due today or part paid (`moneyDueGroupOf`). */
  group: z.enum(MONEY_DUE_GROUPS),
});
export type MoneyDueRow = z.infer<typeof moneyDueRowSchema>;

/** One group's tile: how many parts wait in it and what they owe. */
export const moneyDueTileSchema = z.object({
  count: z.number().int().nonnegative(),
  amount: nonNegativeAmountSchema,
});

/**
 * Money due (`SCR-M11-01`, `M11-54`): every part due and not fully paid — late first, then due
 * today, then part paid, each longest waiting first — with the total to collect, each group's tile
 * and what came in this month.
 */
export const moneyDueSchema = z.object({
  today: calendarDateSchema,
  currencyCode: currencyCodeSchema,
  toCollect: nonNegativeAmountSchema,
  groups: z.object({ late: moneyDueTileSchema, due: moneyDueTileSchema, part: moneyDueTileSchema }),
  collectedThisMonth: amountSchema,
  rows: paginated(moneyDueRowSchema),
  /** Whether the reader may share a part's request — the row's *Remind* (`F2.M11.send-request-message`). */
  canRemind: z.boolean(),
});
export type MoneyDue = z.infer<typeof moneyDueSchema>;

/** Money due's page, or one group's rows alone (`group`) — the tiles always count every group. */
export const moneyDueQuerySchema = paginationQuerySchema.extend({
  group: z.enum(MONEY_DUE_GROUPS).optional(),
});
