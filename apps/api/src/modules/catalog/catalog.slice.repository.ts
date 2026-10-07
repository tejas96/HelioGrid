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
  ImportProductName,
  ResolvedCatalogItem,
} from '@heliogrid/domain';
import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, inArray, type SQL, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';
import { itemRatesInForce, type StoredRate } from './catalog.rates.repository';
import {
  listConditions,
  namedConditions,
  type SliceFilter,
  textOf,
} from './catalog.slice-conditions.repository';

/** The tenant facts every catalog read and write is scoped and stamped by. */
export interface CatalogTenant {
  readonly marketCode: string;
  readonly currencyCode: string;
  readonly timezone: string;
}

/** An item as the matching pass compares it; the spec is parsed whole by the caller. */
export type NamedItem = Pick<SliceRow, 'source' | 'id' | 'brand' | 'model' | 'spec'>;

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

  /**
   * The items an import's rows name, by brand and model exactly as given — archived and hidden ones
   * too, since a second SKU for a product the tenant already has is what an import must never make
   * (`T-M01-030d` decision 6). Only what the pass compares: no claims, no rates.
   */
  async named(
    tenantId: string,
    marketCode: string,
    names: readonly ImportProductName[],
  ): Promise<readonly NamedItem[]> {
    if (names.length === 0) return [];
    return this.db.withTenantTransaction(tenantId, (tx) =>
      namedIn(tx, tenantId, marketCode, names),
    );
  }
}

/** `named`, inside the caller's transaction — a fix reads its candidates under its job's lock. */
export async function namedIn(
  tx: TenantScopedDb,
  tenantId: string,
  marketCode: string,
  names: readonly ImportProductName[],
): Promise<readonly NamedItem[]> {
  if (names.length === 0) return [];
  const rows = await tx.execute<UnionRow>(unionOf(tenantId, marketCode, { names }));
  return rows.map(({ source, id, brand, model, spec }) => ({ source, id, brand, model, spec }));
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
  // The union already joined each platform row's override, so no second lookup is needed.
  const rates = await itemRatesInForce(tx, tenantId, rows, pricedOn);
  return rows.map((row) => ({
    ...row,
    certifications:
      row.certifications ??
      claims
        .filter((claim) => claim.itemId === row.id)
        .map(({ scheme, reference }) => ({ scheme, reference })),
    rate: rates.get(row.id) ?? null,
  }));
}

/**
 * Both item tables in one column shape. A list read narrows by `filter` and leaves hidden rows
 * out; a read by `id` takes the one row whatever its flags. Every predicate names the tenant or
 * the market explicitly — RLS is the backstop, never the filter.
 */
function unionOf(
  tenantId: string,
  marketCode: string,
  read:
    | { readonly filter: SliceFilter }
    | { readonly id: string }
    | { readonly names: readonly ImportProductName[] },
): SQL {
  const filter = 'filter' in read ? read.filter : null;
  const platform: SQL[] = [];
  const own: SQL[] = [sql`t.tenant_id = ${tenantId}`];
  if ('id' in read) {
    platform.push(sql`ci.id = ${read.id}`);
    own.push(sql`t.id = ${read.id}`);
  }
  if ('names' in read) platform.push(...namedConditions(sql`ci`, read.names, true));
  if ('names' in read) own.push(...namedConditions(sql`t`, read.names, false));
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
