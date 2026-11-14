import { ENERGY_DATABASES, type MonthlyFigures } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import { check, jsonb, numeric, pgEnum, pgTable, primaryKey, timestamp } from 'drizzle-orm/pg-core';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const energyDatabase = pgEnum('energy_database', ENERGY_DATABASES);

/**
 * What the energy source of record answered for one point (`F8-08`, `T-M06-033`): kWh a month for
 * 1 kWp at zero loss, with the database the answer named. A proposal scales it by its size and
 * applies its efficiency once, so the source is asked once per point, never once per proposal.
 *
 * GLOBAL reference data: a point on the map belongs to no company and holds nothing of one. Every
 * company reads it; only the server's own fill writes it, on the admin path.
 */
export const energyEstimate = pgTable(
  'energy_estimate',
  {
    latitude: numeric('latitude', { precision: 5, scale: 2, mode: 'number' }).notNull(),
    longitude: numeric('longitude', { precision: 6, scale: 2, mode: 'number' }).notNull(),
    database: energyDatabase('database').notNull(),
    yieldPerKwp: jsonb('yield_per_kwp').$type<MonthlyFigures>().notNull(),
    askedAt: timestamp('asked_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    primaryKey({
      name: 'energy_estimate_pkey',
      columns: [table.latitude, table.longitude, table.database],
    }),
    check(
      'energy_estimate_point_on_earth',
      sql`${table.latitude} between -90 and 90 and ${table.longitude} between -180 and 180`,
    ),
    check('energy_estimate_twelve_months', sql`jsonb_array_length(${table.yieldPerKwp}) = 12`),
  ],
);
