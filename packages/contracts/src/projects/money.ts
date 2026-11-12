import { z } from 'zod';
import { amountSchema, currencyCodeSchema, nonNegativeAmountSchema, uuidSchema } from '../common';
import { memberRefSchema } from '../crm/schemas';
import { calendarDateSchema } from '../tenant-settings';

/*
 * A project's money at a glance (`M11-43`, `M11-53`): what the project's Money card, the board's
 * money reason and the payments screen all read, one figure each. Its own file, so the project
 * shapes and the payments routes both import it and neither imports the other.
 */

/** One figure each, the same wherever it shows (`M11-43`). */
export const projectMoneySchema = z.object({
  currencyCode: currencyCodeSchema,
  total: nonNegativeAmountSchema,
  collected: amountSchema,
  /** Owed on parts already due. */
  toCollect: nonNegativeAmountSchema,
  /** What the parts not yet due will ask for. */
  next: nonNegativeAmountSchema,
});
export type ProjectMoney = z.infer<typeof projectMoneySchema>;

/** The part to collect now, as the project's Money card and the board show it. */
export const duePartSchema = z.object({
  id: uuidSchema,
  label: z.string(),
  outstanding: nonNegativeAmountSchema,
  /** The company day it fell due; the days figure is counted on the device (`M11-54`). */
  dueOn: calendarDateSchema,
  /** Who last shared its request, and when — so nobody asks twice (ruling 2026-11-10). */
  lastShared: z.object({ by: memberRefSchema, at: z.string().datetime() }).nullable(),
});
export type DuePart = z.infer<typeof duePartSchema>;

/** A project's money at a glance: the card on the project and the money reason on the board. */
export const projectMoneyGlanceSchema = projectMoneySchema.extend({
  duePart: duePartSchema.nullable(),
});
export type ProjectMoneyGlance = z.infer<typeof projectMoneyGlanceSchema>;
