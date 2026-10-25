import type {
  CatalogSort,
  ComponentKind,
  ImportProductName,
  PanelTechnology,
  ResolvedCatalogItem,
} from '@heliogrid/domain';
import { type SQL, sql } from 'drizzle-orm';
import { rateAmountInForce } from './catalog.rates.repository';

// The predicates the market slice's union narrows by (`catalog.slice.repository.ts`), one table at
// a time: `ci` is the platform's item table, `t` the tenant's own.

/** What narrows the list (`M01-38`, `MS4-10`); `terms` is already a `to_tsquery` text. */
export interface SliceFilter {
  readonly terms: string | null;
  readonly source?: ResolvedCatalogItem['source'];
  readonly kind?: ComponentKind;
  /** Any of these kinds; wins over `kind`. */
  readonly kinds?: readonly ComponentKind[];
  /** Keep what the tenant hid from its pickers — Catalog settings lists it (`M01-37`). */
  readonly includeHidden?: boolean;
  /** Only what this tenant changed: its own SKUs, and platform items its override sets something on. */
  readonly changed?: boolean;
  /** The reader sees money, so a price or a tax counts as a change; else only hide and prefer do. */
  readonly moneyVisible?: boolean;
  readonly wattMin?: number;
  readonly wattMax?: number;
  readonly technology?: PanelTechnology;
  readonly schemes?: readonly string[];
  readonly preferred?: boolean;
  readonly archived: boolean;
  /** The list's order; `preferred` when unset. */
  readonly sort?: CatalogSort;
}

/**
 * What a list read narrows by, on one table: a platform row's hide and prefer flags are its
 * override's. `schemes` keeps an item holding every one listed (b6).
 */
export function listConditions(filter: SliceFilter, table: 'platform' | 'own'): SQL[] {
  const alias = table === 'platform' ? sql`ci` : sql`t`;
  const conditions = [
    sql`${alias}.archived = ${filter.archived}`,
    ...panelSpecConditions(alias, filter),
  ];
  if (table === 'platform' && filter.includeHidden !== true && filter.changed !== true) {
    conditions.push(sql`coalesce(o.hidden, false) = false`);
  }
  const kinds = filter.kinds ?? (filter.kind === undefined ? [] : [filter.kind]);
  if (kinds.length > 0) conditions.push(kindIn(alias, kinds));
  if (filter.terms !== null) {
    conditions.push(sql`${textOf(alias)} @@ to_tsquery('simple', ${filter.terms})`);
  }
  if (filter.preferred !== undefined) {
    const preferred = table === 'platform' ? sql`coalesce(o.preferred, false)` : sql`t.preferred`;
    conditions.push(sql`${preferred} = ${filter.preferred}`);
  }
  if (filter.schemes !== undefined && filter.schemes.length > 0) {
    conditions.push(
      table === 'platform' ? platformHolds(filter.schemes) : ownHolds(filter.schemes),
    );
  }
  return conditions;
}

/**
 * A platform item this tenant changed: its override sets *hidden* or *preferred*, and — for a
 * reader who sees money — a price in force or a tax rate. A reader the wire hides money from must
 * not learn which items were priced by which come back. An override record that sets nothing is
 * not a change. Every own SKU is one already.
 */
export function overrideSetsSomething(tenantId: string, pricedOn: string, money: boolean): SQL {
  const flags = sql`coalesce(o.hidden, false) or coalesce(o.preferred, false)`;
  if (!money) return sql`(${flags})`;
  return sql`(${flags} or o.tax_pct is not null
    or ${rateAmountInForce(tenantId, 'override', sql`o.id`, pricedOn)} is not null)`;
}

/** One kind or several, as one array parameter the kind index still serves. */
function kindIn(alias: SQL, kinds: readonly ComponentKind[]): SQL {
  return sql`${alias}.component_kind = any(${`{${kinds.join(',')}}`}::component_kind[])`;
}

function platformHolds(schemes: readonly string[]): SQL {
  const wanted = sql.join(
    schemes.map((scheme) => sql`${scheme}`),
    sql`, `,
  );
  return sql`array[${wanted}]::text[] <@ array(select c.scheme_key from catalog_item_certification c where c.catalog_item_id = ci.id)`;
}

/** Containment over the claims array, which the GIN index serves (`jsonb_path_ops`). */
function ownHolds(schemes: readonly string[]): SQL {
  return sql`t.certifications @> ${JSON.stringify(schemes.map((scheme) => ({ scheme })))}::jsonb`;
}

/**
 * Brand and model in the list, sent as one JSON parameter however long the file. The platform's
 * natural key leads with the kind, so every kind is listed for the index to serve the read.
 */
export function namedConditions(
  alias: SQL,
  names: readonly ImportProductName[],
  byKind: boolean,
): SQL[] {
  const named = sql`(${alias}.brand, ${alias}.model) in (select brand, model from jsonb_to_recordset(${JSON.stringify(names)}::jsonb) as named(brand text, model text))`;
  if (!byKind) return [named];
  return [sql`${alias}.component_kind = any(enum_range(null::component_kind))`, named];
}

/** The text the GIN index is built over — the expression must match it to be index-backed. */
export function textOf(alias: SQL): SQL {
  return sql`to_tsvector('simple', ${alias}.brand || ' ' || ${alias}.model)`;
}

/** A watt window or a technology keeps panels only: no other kind carries either (b6). */
function panelSpecConditions(alias: SQL, filter: SliceFilter): SQL[] {
  const panel = sql`${alias}.component_kind = 'panel'`;
  const conditions: SQL[] = [];
  if (filter.wattMin !== undefined) {
    conditions.push(panel, sql`(${alias}.spec->>'watt')::numeric >= ${filter.wattMin}`);
  }
  if (filter.wattMax !== undefined) {
    conditions.push(panel, sql`(${alias}.spec->>'watt')::numeric <= ${filter.wattMax}`);
  }
  if (filter.technology !== undefined) {
    conditions.push(panel, sql`${alias}.spec->>'technology' = ${filter.technology}`);
  }
  return conditions;
}
