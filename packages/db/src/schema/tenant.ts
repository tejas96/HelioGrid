import { TENANT_SEGMENTS, UI_LANGUAGES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import { index, numeric, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { marketPack } from './market';

/** pgEnums hand-mirror domain's tuples (`M17` proves the two equal). */
export const tenantSegment = pgEnum('tenant_segment', TENANT_SEGMENTS);
export const uiLanguage = pgEnum('ui_language', UI_LANGUAGES);

/**
 * One EPC company's isolated workspace (`M01-01`): the root scope for data, market, currency
 * and team. One market and one currency, fixed at creation from the owner's phone and the
 * market's pack (`F1-07`); every market fact resolves from the versioned pack, never a stored
 * constant. ARMED, not tenant-scoped: it carries no `tenant_id`, and a member reads its own
 * row through the SELECT policy on `id`; INSERT is never granted to `app_user`, because signup
 * crosses tenancy and runs on the admin path. Columns owed to other modules — quiet hours,
 * tracking, geofence, the custom domain — arrive with their migrations (Law 9).
 */
export const tenant = pgTable(
  'tenant',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    companyName: text('company_name').notNull(),
    city: text('city').notNull(),
    marketCode: text('market_code')
      .notNull()
      .references(() => marketPack.marketCode),
    /** ISO 4217, server-assigned from the pack's `formats.currency` at creation. */
    currencyCode: text('currency_code').notNull(),
    /** Governs customer-document and new-invite defaults only; the interface language is per user. */
    defaultLanguage: uiLanguage('default_language').notNull(),
    /** IANA zone. The pack supplies the market's default; this is the tenant's own (`F1-10`). */
    timezone: text('timezone').notNull(),
    segment: tenantSegment('segment'),
    /** Declared in kWp (`M01-23`); null until the setup step that asks. */
    typicalSystemKwp: numeric('typical_system_kwp', { precision: 8, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    /** Likely-existing-workspace detection at signup (`M01-09`). */
    // The M01-09 steer matches case-insensitively, so the index is on the lowered pair.
    index('tenant_company_name_city_idx').on(
      sql`lower(${table.companyName})`,
      sql`lower(${table.city})`,
    ),
  ],
);
