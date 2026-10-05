import type { CatalogReleaseSnapshotEnvelope, CatalogSpec, Certification } from '@heliogrid/domain';
import { RELEASE_CHANGE_KINDS } from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  date,
  index,
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
import { catalogItem, componentKind } from './catalog-platform';
import { creationKeyColumns } from './creation-key';
import { file } from './file';
import { userAccount } from './identity';
import { tenant } from './tenant';

/** pgEnum hand-mirrors domain's tuple (invariant `enum-parity`). */
export const releaseChangeKind = pgEnum('release_change_kind', RELEASE_CHANGE_KINDS);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

const id = () =>
  uuid('id')
    .primaryKey()
    .$defaultFn(() => uuidv7());

const tenantId = () =>
  uuid('tenant_id')
    .notNull()
    .references(() => tenant.id);

/**
 * The tenant's half of the catalog (`T-M01-027`): every table tenant-scoped, all four always.
 * The ledger and the release pair are append-only — SELECT and INSERT alone for every role under
 * `app_user`; the owning admin role is the one exception, and it writes here only on the admin
 * path — and no catalog table grants DELETE: a product is archived, never deleted (`M01-42`).
 */

/**
 * A tenant's own full SKU (`M01-36`, `M01-39`): usable everywhere a platform item is, invisible
 * to every other tenant, labelled `tenant_provided` by the resolver — the label is not stored.
 * No natural key: a spec-edited variant keeps the listed brand and model (`M01-39`).
 * `certifications` is the scheme-keyed array the tenant entered, never inherited (`M01-39`).
 */
export const tenantCatalogItem = pgTable(
  'tenant_catalog_item',
  {
    id: id(),
    tenantId: tenantId(),
    componentKind: componentKind('component_kind').notNull(),
    brand: text('brand').notNull(),
    model: text('model').notNull(),
    spec: jsonb('spec').$type<CatalogSpec>().notNull(),
    certifications: jsonb('certifications').$type<readonly Certification[]>().notNull(),
    /** The datasheet the SKU was read from (`M01-40`), one `file` row; null for a typed SKU. */
    sourceDatasheetId: uuid('source_datasheet_id').references(() => file.id),
    preferred: boolean('preferred').notNull(),
    archived: boolean('archived').notNull(),
    createdAt: instant('created_at').notNull(),
    /** Moves on every write; a release reads what changed after its predecessor by it. */
    updatedAt: instant('updated_at').notNull(),
    ...creationKeyColumns(),
  },
  (table) => [
    check(
      'tenant_catalog_item_spec_kind_matches',
      sql`(${table.spec}->>'kind') = ${table.componentKind}::text`,
    ),
    index('tenant_catalog_item_tenant_kind_archived_idx').on(
      table.tenantId,
      table.componentKind,
      table.archived,
    ),
    uniqueIndex('tenant_catalog_item_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    index('tenant_catalog_item_text_idx').using(
      'gin',
      sql`to_tsvector('simple', ${table.brand} || ' ' || ${table.model})`,
    ),
    /** The scheme-badge filter over the tenant's own entries (`M01-38`). */
    index('tenant_catalog_item_certifications_idx').using(
      'gin',
      table.certifications.op('jsonb_path_ops'),
    ),
    index('tenant_catalog_item_panel_watt_idx')
      .on(table.tenantId, sql`((${table.spec}->>'watt')::numeric)`)
      .where(sql`${table.componentKind} = 'panel'`),
    index('tenant_catalog_item_panel_technology_idx')
      .on(table.tenantId, sql`(${table.spec}->>'technology')`)
      .where(sql`${table.componentKind} = 'panel'`),
  ],
);

/**
 * A tenant's sparse override on one platform item (`M01-37`): only the changed fields, at most
 * one per item. An unset field falls through in the resolver; a cleared override keeps its row
 * with every field reset, and its price lives in the ledger alone.
 */
export const tenantCatalogOverride = pgTable(
  'tenant_catalog_override',
  {
    id: id(),
    tenantId: tenantId(),
    catalogItemId: uuid('catalog_item_id')
      .notNull()
      .references(() => catalogItem.id),
    /** Two-decimal percent text, `18.00`; `0.00` is a rate and null is unset. */
    taxPct: numeric('tax_pct', { precision: 5, scale: 2 }),
    hidden: boolean('hidden').notNull(),
    preferred: boolean('preferred').notNull(),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('tenant_catalog_override_tenant_item_key').on(table.tenantId, table.catalogItemId),
  ],
);

/**
 * The append-only dated ledger of a component's rate on an own SKU or an override (`M01-44`):
 * the rate on a date is the newest entry on or before it, two entries on one date settled by
 * `sequence` — the ledger's insertion order, an identity column and unique. A null amount is a
 * cleared rate: a dated absence. The currency is the tenant's, stamped at the write.
 */
export const catalogRateEntry = pgTable(
  'catalog_rate_entry',
  {
    id: id(),
    tenantId: tenantId(),
    tenantCatalogItemId: uuid('tenant_catalog_item_id').references(() => tenantCatalogItem.id),
    tenantCatalogOverrideId: uuid('tenant_catalog_override_id').references(
      () => tenantCatalogOverride.id,
    ),
    rateAmount: numeric('rate_amount', { precision: 14, scale: 3 }),
    currencyCode: text('currency_code').notNull(),
    /** `YYYY-MM-DD` as text — the one form whose text order is its date order. */
    entryDate: date('entry_date', { mode: 'string' }).notNull(),
    sequence: bigint('sequence', { mode: 'number' }).generatedAlwaysAsIdentity(),
    enteredBy: uuid('entered_by')
      .notNull()
      .references(() => userAccount.id),
    recordedAt: instant('recorded_at').notNull(),
    ...creationKeyColumns(),
  },
  (table) => [
    check(
      'catalog_rate_entry_one_parent',
      sql`(${table.tenantCatalogItemId} is null) <> (${table.tenantCatalogOverrideId} is null)`,
    ),
    uniqueIndex('catalog_rate_entry_sequence_key').on(table.sequence),
    uniqueIndex('catalog_rate_entry_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    /** The rate in force on a date, one row per parent: newest date, then newest sequence. */
    index('catalog_rate_entry_tenant_item_date_idx').on(
      table.tenantId,
      table.tenantCatalogItemId,
      table.entryDate.desc(),
      table.sequence.desc(),
    ),
    index('catalog_rate_entry_tenant_override_date_idx').on(
      table.tenantId,
      table.tenantCatalogOverrideId,
      table.entryDate.desc(),
      table.sequence.desc(),
    ),
  ],
);

/**
 * A labelled, append-only publish of the tenant's catalog changes (`M01-43`): the label rides
 * into every design fingerprint and proposal version that used it, and a publish self-stales
 * older pins by comparison (`F8-13`, `F8-14`). The tenant publishes.
 */
export const catalogRelease = pgTable(
  'catalog_release',
  {
    id: id(),
    tenantId: tenantId(),
    label: text('label').notNull(),
    publishedAt: instant('published_at').notNull(),
    publishedBy: uuid('published_by')
      .notNull()
      .references(() => userAccount.id),
    ...creationKeyColumns(),
  },
  (table) => [
    uniqueIndex('catalog_release_tenant_label_key').on(table.tenantId, table.label),
    uniqueIndex('catalog_release_tenant_creation_key')
      .on(table.tenantId, table.creationKey)
      .where(sql`${table.creationKey} is not null`),
    index('catalog_release_tenant_published_idx').on(table.tenantId, table.publishedAt.desc()),
  ],
);

/**
 * One changed item of a release (`M01-43`), as a before and an after — domain's snapshot
 * ENVELOPE, a plain number at rest and re-minted on read — never a list of names (`SCR-M01-15`
 * decision 4). Exactly one of the two item references is set. Immutable with the release.
 */
export const catalogReleaseLine = pgTable(
  'catalog_release_line',
  {
    id: id(),
    tenantId: tenantId(),
    catalogReleaseId: uuid('catalog_release_id')
      .notNull()
      .references(() => catalogRelease.id),
    catalogItemId: uuid('catalog_item_id').references(() => catalogItem.id),
    tenantCatalogItemId: uuid('tenant_catalog_item_id').references(() => tenantCatalogItem.id),
    changeKind: releaseChangeKind('change_kind').notNull(),
    /** Null on an `added` line: there was nothing before. */
    before: jsonb('before').$type<CatalogReleaseSnapshotEnvelope>(),
    after: jsonb('after').$type<CatalogReleaseSnapshotEnvelope>().notNull(),
  },
  (table) => [
    check(
      'catalog_release_line_one_item',
      sql`(${table.catalogItemId} is null) <> (${table.tenantCatalogItemId} is null)`,
    ),
    index('catalog_release_line_tenant_release_idx').on(table.tenantId, table.catalogReleaseId),
    index('catalog_release_line_tenant_item_idx').on(table.tenantId, table.catalogItemId),
    index('catalog_release_line_tenant_own_item_idx').on(table.tenantId, table.tenantCatalogItemId),
  ],
);
