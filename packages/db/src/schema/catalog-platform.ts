import {
  CATALOG_AVAILABILITY,
  CATALOG_PROVENANCE_LABELS,
  type CatalogSpec,
  COMPONENT_KINDS,
} from '@heliogrid/domain';
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from '../uuid';
import { marketPack } from './market';

/** pgEnums hand-mirror domain's tuples (invariant `enum-parity` proves each pair equal). */
export const componentKind = pgEnum('component_kind', COMPONENT_KINDS);
export const catalogProvenanceLabel = pgEnum('catalog_provenance_label', CATALOG_PROVENANCE_LABELS);
export const catalogAvailability = pgEnum('catalog_availability', CATALOG_AVAILABILITY);

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * The platform master catalog (`T-M01-027`, `M01-33`…`M01-35`, `M01-42`, `M01-45`): READABLE
 * GLOBAL reference data, as the market pack is — no `tenant_id`, no RLS, SELECT for every member
 * of `app_user` and no write privilege; the publish command on the admin path is the only writer
 * (`M01-46`). `GLOBAL_READABLE_TABLES` in the tenancy scan holds that.
 *
 * A platform item carries NO price (`M01-37`): a component's rate is the tenant's dated entry.
 * `spec` is the per-kind envelope, which carries its own `kind` — held equal to the column by a
 * CHECK, so every writer is held to it — and parsed whole in domain, never here. Brand and model
 * are printed as stored in every language (`F3-08`). Archived, never deleted (`M01-42`).
 */
export const catalogItem = pgTable(
  'catalog_item',
  {
    id: uuid('id')
      .primaryKey()
      .$defaultFn(() => uuidv7()),
    componentKind: componentKind('component_kind').notNull(),
    brand: text('brand').notNull(),
    model: text('model').notNull(),
    spec: jsonb('spec').$type<CatalogSpec>().notNull(),
    provenanceLabel: catalogProvenanceLabel('provenance_label').notNull(),
    availability: catalogAvailability('availability').notNull(),
    archived: boolean('archived').notNull(),
    createdAt: instant('created_at').notNull(),
    updatedAt: instant('updated_at').notNull(),
  },
  (table) => [
    check(
      'catalog_item_spec_kind_matches',
      sql`(${table.spec}->>'kind') = ${table.componentKind}::text`,
    ),
    /** `tenant_provided` is every own SKU's label and never a platform item's (`M01-35`). */
    check(
      'catalog_item_provenance_is_platform',
      sql`${table.provenanceLabel} <> 'tenant_provided'`,
    ),
    /** The publish's upsert key: one platform row per listed model. */
    uniqueIndex('catalog_item_natural_key').on(table.componentKind, table.brand, table.model),
    index('catalog_item_kind_archived_idx').on(table.componentKind, table.archived),
    /** The search over brand and model, as per-word prefix terms (`M01-38`). */
    index('catalog_item_text_idx').using(
      'gin',
      sql`to_tsvector('simple', ${table.brand} || ' ' || ${table.model})`,
    ),
    /** The picker's two spec filters (`MS4-10`): a panel's watt window and its technology. */
    index('catalog_item_panel_watt_idx')
      .on(sql`((${table.spec}->>'watt')::numeric)`)
      .where(sql`${table.componentKind} = 'panel'`),
    index('catalog_item_panel_technology_idx')
      .on(sql`(${table.spec}->>'technology')`)
      .where(sql`${table.componentKind} = 'panel'`),
  ],
);

/** One platform item's availability in one market (`M01-33`): every market-scoped list joins here. */
export const catalogItemMarketAvailability = pgTable(
  'catalog_item_market_availability',
  {
    catalogItemId: uuid('catalog_item_id')
      .notNull()
      .references(() => catalogItem.id),
    marketCode: text('market_code')
      .notNull()
      .references(() => marketPack.marketCode),
  },
  (table) => [
    primaryKey({
      name: 'catalog_item_market_availability_pk',
      columns: [table.catalogItemId, table.marketCode],
    }),
    index('catalog_item_market_availability_market_idx').on(table.marketCode, table.catalogItemId),
  ],
);

/**
 * One scheme-keyed certification held by one platform item (`M01-34`, `F1-44`): the row IS the
 * claim. `scheme_key` is the market's own value, validated against its pack, never an enum; a
 * `list_reference` scheme carries its reference, a `flag` scheme carries null.
 */
export const catalogItemCertification = pgTable(
  'catalog_item_certification',
  {
    catalogItemId: uuid('catalog_item_id')
      .notNull()
      .references(() => catalogItem.id),
    schemeKey: text('scheme_key').notNull(),
    reference: text('reference'),
  },
  (table) => [
    primaryKey({
      name: 'catalog_item_certification_pk',
      columns: [table.catalogItemId, table.schemeKey],
    }),
  ],
);
