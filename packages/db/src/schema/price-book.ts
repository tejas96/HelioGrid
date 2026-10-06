import type { AuthoredPerLanguage } from '@heliogrid/domain';
import { PRICE_BOOK_RATE_BASES } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { creationKeyColumns } from './creation-key';
import { userAccount } from './identity';
import { tenant } from './tenant';

/** pgEnum hand-mirrors domain's tuple (invariant `enum-parity`). */
export const priceBookRateBasis = pgEnum('price_book_rate_basis', PRICE_BOOK_RATE_BASES);

const id = () =>
  uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7());

const tenantId = () =>
  uuid('tenant_id')
    .notNull()
    .references(() => tenant.id);

/**
 * The price book (`T-M01-031`): both tables tenant-scoped, all four always, and append-only —
 * SELECT and INSERT alone for every role under `app_user` — because a version is immutable and a
 * rate change is a new version (`M01-48`). A sent proposal pins a version forever (`M01-49`).
 *
 * One immutable set of a tenant's non-catalog rates. The version in force is the tenant's highest
 * `version_number` — derived by the read, never a stored flag, which would need the UPDATE this
 * table must not grant (`F8-13`). The unique key is also the index that read walks backwards.
 */
export const priceBookVersion = pgTable(
  'price_book_version',
  {
    id: id(),
    tenantId: tenantId(),
    versionNumber: integer('version_number').notNull(),
    defaultMarginPct: numeric('default_margin_pct', { precision: 5, scale: 2 }).notNull(),
    currencyCode: text('currency_code').notNull(),
    /** The publisher's sentence on what changed (§M01.5) — a record, never translated. */
    note: text('note').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }).notNull(),
    publishedBy: uuid('published_by')
      .notNull()
      .references(() => userAccount.id),
    ...creationKeyColumns(),
  },
  (table) => [
    uniqueIndex('price_book_version_tenant_number_key').on(table.tenantId, table.versionNumber),
    uniqueIndex('price_book_version_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
  ],
);

/** One rate of a version, in the version's currency. Immutable with its version. */
export const priceBookRate = pgTable(
  'price_book_rate',
  {
    id: id(),
    tenantId: tenantId(),
    priceBookVersionId: uuid('price_book_version_id')
      .notNull()
      .references(() => priceBookVersion.id),
    position: integer('position').notNull(),
    /** Tenant content per language (`F3-10`): `en` required, read through `authoredIn`. */
    name: jsonb('name').$type<AuthoredPerLanguage<string>>().notNull(),
    basis: priceBookRateBasis('basis').notNull(),
    amount: numeric('amount', { precision: 14, scale: 3 }).notNull(),
  },
  (table) => [
    index('price_book_rate_tenant_version_idx').on(table.tenantId, table.priceBookVersionId),
  ],
);
