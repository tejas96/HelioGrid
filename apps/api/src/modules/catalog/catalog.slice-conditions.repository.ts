import type {
  ComponentKind,
  ImportProductName,
  PanelTechnology,
  ResolvedCatalogItem,
} from '@heliogrid/domain';
import { type SQL, sql } from 'drizzle-orm';

// The predicates the market slice's union narrows by (`catalog.slice.repository.ts`), one table at
// a time: `ci` is the platform's item table, `t` the tenant's own.

/** What narrows the list (`M01-38`, `MS4-10`); `terms` is already a `to_tsquery` text. */
export interface SliceFilter {
  readonly terms: string | null;
  readonly source?: ResolvedCatalogItem['source'];
  readonly kind?: ComponentKind;
  readonly wattMin?: number;
  readonly wattMax?: number;
  readonly technology?: PanelTechnology;
  readonly schemes?: readonly string[];
  readonly preferred?: boolean;
  readonly archived: boolean;
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
  if (table === 'platform') conditions.push(sql`coalesce(o.hidden, false) = false`);
  if (filter.kind !== undefined) {
    conditions.push(sql`${alias}.component_kind = ${filter.kind}::component_kind`);
  }
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
