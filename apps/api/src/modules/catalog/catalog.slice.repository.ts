import {
  catalogItemCertification,
  type TenantPool,
  type TenantScopedDb,
  tenant,
} from '@heliogrid/db';
import type {
  CatalogAvailability,
  CatalogProvenanceLabel,
  Certification,
  ComponentKind,
  PanelTechnology,
  ResolvedCatalogItem,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, inArray, type SQL, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { ratesInForce, type StoredRate } from './catalog.rates.repository';

/** The tenant facts every catalog read and write is scoped and stamped by. */
export interface CatalogTenant {
  readonly marketCode: string;
  readonly currencyCode: string;
  readonly timezone: string;
}

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

/** One row of the slice as stored; `internal/resolve-input.ts` turns it into the resolver's input. */
export interface SliceRow {
  readonly source: ResolvedCatalogItem['source'];
  readonly id: string;
  readonly brand: string;
  readonly model: string;
  /** The envelope as stored; domain parses it whole before anything reads it. */
  readonly spec: unknown;
  readonly provenance: CatalogProvenanceLabel;
  readonly availability: CatalogAvailability | null;
  readonly archived: boolean;
  readonly hidden: boolean;
  readonly preferred: boolean;
  /** The tenant's override on this platform item, when it has one. */
  readonly overrideId: string | null;
  /** The override's tax as `numeric(5,2)` text; null is unset. */
  readonly taxPct: string | null;
  readonly certifications: readonly Certification[];
  readonly rate: StoredRate | null;
}

type UnionRow = Omit<SliceRow, 'certifications' | 'rate'> & {
  readonly certifications: Certification[] | null;
};

/**
 * The tenant's market slice on the runtime pool (`M01-33`, b3): its market's platform items —
 * joined through the availability row, so no other market's item is ever read — with the
 * tenant's override, and the tenant's own SKUs, in ONE `UNION ALL` (decision 17). `app_user`
 * reads the platform tables and RLS pins the tenant's.
 */
@Injectable()
export class CatalogSliceRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async tenantOf(tenantId: string): Promise<CatalogTenant | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          marketCode: tenant.marketCode,
          currencyCode: tenant.currencyCode,
          timezone: tenant.timezone,
        })
        .from(tenant)
        .where(eq(tenant.id, tenantId));
      return row ?? null;
    });
  }

  /** A page of the list: hidden rows left out, preferred first, then text rank, then the name. */
  async page(
    tenantId: string,
    marketCode: string,
    filter: SliceFilter,
    page: { readonly limit: number; readonly offset: number; readonly pricedOn: string },
  ): Promise<{ readonly rows: readonly SliceRow[]; readonly totalCount: number }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const slice = unionOf(tenantId, marketCode, { filter });
      const rows = await tx.execute<UnionRow>(sql`
        select source, id, brand, model, spec, provenance, availability, archived, hidden,
          preferred, "overrideId", "taxPct", certifications
        from (${slice}) as slice
        order by preferred desc, rank desc, brand, model, id
        limit ${page.limit} offset ${page.offset}`);
      const [total] = await tx.execute<{ value: number }>(
        sql`select count(*)::int as value from (${slice}) as slice`,
      );
      return {
        rows: await completed(tx, tenantId, rows, page.pricedOn),
        totalCount: total?.value ?? 0,
      };
    });
  }

  /** One item by id, hidden or archived — history resolves every item it ever named (`M01-42`). */
  async item(
    tenantId: string,
    marketCode: string,
    id: string,
    pricedOn: string,
  ): Promise<SliceRow | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const rows = await tx.execute<UnionRow>(unionOf(tenantId, marketCode, { id }));
      const [row] = await completed(tx, tenantId, rows, pricedOn);
      return row ?? null;
    });
  }
}

/** The platform rows' claims and every row's rate in force, read once for the whole page. */
async function completed(
  tx: TenantScopedDb,
  tenantId: string,
  rows: readonly UnionRow[],
  pricedOn: string,
): Promise<SliceRow[]> {
  const platformIds = rows.filter((row) => row.source === 'platform_item').map((row) => row.id);
  const claims =
    platformIds.length === 0
      ? []
      : await tx
          .select({
            itemId: catalogItemCertification.catalogItemId,
            scheme: catalogItemCertification.schemeKey,
            reference: catalogItemCertification.reference,
          })
          .from(catalogItemCertification)
          .where(inArray(catalogItemCertification.catalogItemId, platformIds))
          .orderBy(asc(catalogItemCertification.schemeKey));
  const rates = await ratesInForce(
    tx,
    tenantId,
    {
      ownItems: rows.filter((row) => row.source === 'own_item').map((row) => row.id),
      overrides: rows.flatMap((row) => (row.overrideId === null ? [] : [row.overrideId])),
    },
    pricedOn,
  );
  return rows.map((row) => {
    const ledger = row.source === 'own_item' ? row.id : row.overrideId;
    return {
      ...row,
      certifications:
        row.certifications ??
        claims
          .filter((claim) => claim.itemId === row.id)
          .map(({ scheme, reference }) => ({ scheme, reference })),
      rate: ledger === null ? null : (rates.get(ledger) ?? null),
    };
  });
}

/**
 * Both item tables in one column shape. A list read narrows by `filter` and leaves hidden rows
 * out; a read by `id` takes the one row whatever its flags. Every predicate names the tenant or
 * the market explicitly — RLS is the backstop, never the filter.
 */
function unionOf(
  tenantId: string,
  marketCode: string,
  read: { readonly filter: SliceFilter } | { readonly id: string },
): SQL {
  const filter = 'filter' in read ? read.filter : null;
  const platform: SQL[] = [];
  const own: SQL[] = [sql`t.tenant_id = ${tenantId}`];
  if ('id' in read) {
    platform.push(sql`ci.id = ${read.id}`);
    own.push(sql`t.id = ${read.id}`);
  }
  if (filter !== null) {
    platform.push(...listConditions(filter, 'platform'));
    own.push(...listConditions(filter, 'own'));
  }
  const terms = filter?.terms ?? null;
  const rank = (alias: SQL) =>
    terms === null ? sql`0::real` : sql`ts_rank(${textOf(alias)}, to_tsquery('simple', ${terms}))`;
  const platformSelect = sql`
    select 'platform_item' as source, ci.id, ci.brand, ci.model, ci.spec,
      ci.provenance_label::text as provenance, ci.availability::text as availability, ci.archived,
      coalesce(o.hidden, false) as hidden, coalesce(o.preferred, false) as preferred,
      o.id as "overrideId", o.tax_pct::text as "taxPct", null::jsonb as certifications,
      ${rank(sql`ci`)} as rank
    from catalog_item ci
    join catalog_item_market_availability m
      on m.catalog_item_id = ci.id and m.market_code = ${marketCode}
    left join tenant_catalog_override o
      on o.catalog_item_id = ci.id and o.tenant_id = ${tenantId}
    where ${sql.join(platform, sql` and `)}`;
  const ownSelect = sql`
    select 'own_item' as source, t.id, t.brand, t.model, t.spec,
      'tenant_provided' as provenance, null as availability, t.archived,
      false as hidden, t.preferred, null::uuid as "overrideId", null as "taxPct", t.certifications,
      ${rank(sql`t`)} as rank
    from tenant_catalog_item t
    where ${sql.join(own, sql` and `)}`;
  if (filter?.source === 'platform_item') return platformSelect;
  if (filter?.source === 'own_item') return ownSelect;
  return sql`${platformSelect} union all ${ownSelect}`;
}

/**
 * What a list read narrows by, on one table: a platform row's hide and prefer flags are its
 * override's. `schemes` keeps an item holding every one listed (b6).
 */
function listConditions(filter: SliceFilter, table: 'platform' | 'own'): SQL[] {
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

/** The text the GIN index is built over — the expression must match it to be index-backed. */
function textOf(alias: SQL): SQL {
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
