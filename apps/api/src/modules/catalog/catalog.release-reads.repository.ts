import {
  catalogItem,
  catalogRelease,
  catalogReleaseLine,
  type TenantPool,
  type TenantScopedDb,
  tenantCatalogItem,
} from '@heliogrid/db';
import type {
  CatalogReleaseSnapshot,
  ComponentKind,
  ReleaseChangeKind,
  ResolvedCatalogItem,
} from '@heliogrid/domain';
import { readReleaseSnapshot } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { TENANT_DB } from '../../common/db/tenant.token';

export interface ReleaseHead {
  readonly id: string;
  readonly label: string;
  readonly publishedAt: Date;
  readonly counts: Readonly<Record<ReleaseChangeKind, number>>;
}

/** One line read back: its item named as it is now, its two sides as they were (c8). */
export interface ReleaseLine {
  readonly item: {
    readonly id: string;
    readonly source: ResolvedCatalogItem['source'];
    readonly kind: ComponentKind;
    readonly brand: string;
    readonly model: string;
  };
  readonly changeKind: ReleaseChangeKind;
  readonly before: CatalogReleaseSnapshot | null;
  readonly after: CatalogReleaseSnapshot;
}

const HEAD_COLUMNS = {
  id: catalogRelease.id,
  label: catalogRelease.label,
  publishedAt: catalogRelease.publishedAt,
};

/**
 * The tenant's releases read back on the runtime pool (`M01-43`): the list, newest first, and one
 * release's before-and-after lines. Every stored side is read through domain's one schema (c4).
 */
@Injectable()
export class CatalogReleaseReadsRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** A page of releases, newest first, each with its lines counted by kind (c9). */
  async heads(
    tenantId: string,
    page: { readonly limit: number; readonly offset: number },
  ): Promise<{ readonly heads: readonly ReleaseHead[]; readonly totalCount: number }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const where = eq(catalogRelease.tenantId, tenantId);
      const rows = await tx
        .select(HEAD_COLUMNS)
        .from(catalogRelease)
        .where(where)
        .orderBy(desc(catalogRelease.publishedAt), desc(catalogRelease.id))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx.select({ value: count() }).from(catalogRelease).where(where);
      return { heads: await countedHeads(tx, tenantId, rows), totalCount: total?.value ?? 0 };
    });
  }

  /** One release's head, or null when this tenant has no such release. */
  async head(tenantId: string, id: string): Promise<ReleaseHead | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => headOf(tx, tenantId, id));
  }

  /** One release and a page of its lines, or null when this tenant has no such release. */
  async release(
    tenantId: string,
    id: string,
    page: { readonly limit: number; readonly offset: number },
  ): Promise<{
    readonly head: ReleaseHead;
    readonly lines: readonly ReleaseLine[];
    readonly totalCount: number;
  } | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const head = await headOf(tx, tenantId, id);
      if (head === null) return null;
      const where = and(
        eq(catalogReleaseLine.tenantId, tenantId),
        eq(catalogReleaseLine.catalogReleaseId, id),
      );
      const kind = sql<ComponentKind>`coalesce(${catalogItem.componentKind}, ${tenantCatalogItem.componentKind})`;
      const brand = sql<string>`coalesce(${catalogItem.brand}, ${tenantCatalogItem.brand})`;
      const model = sql<string>`coalesce(${catalogItem.model}, ${tenantCatalogItem.model})`;
      const lines = await tx
        .select({
          catalogItemId: catalogReleaseLine.catalogItemId,
          tenantCatalogItemId: catalogReleaseLine.tenantCatalogItemId,
          kind,
          brand,
          model,
          changeKind: catalogReleaseLine.changeKind,
          before: catalogReleaseLine.before,
          after: catalogReleaseLine.after,
        })
        .from(catalogReleaseLine)
        .leftJoin(catalogItem, eq(catalogItem.id, catalogReleaseLine.catalogItemId))
        .leftJoin(
          tenantCatalogItem,
          eq(tenantCatalogItem.id, catalogReleaseLine.tenantCatalogItemId),
        )
        .where(where)
        .orderBy(asc(kind), asc(brand), asc(model), asc(catalogReleaseLine.id))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx.select({ value: count() }).from(catalogReleaseLine).where(where);
      return { head, lines: lines.map(lineOf), totalCount: total?.value ?? 0 };
    });
  }
}

async function headOf(
  tx: TenantScopedDb,
  tenantId: string,
  id: string,
): Promise<ReleaseHead | null> {
  const rows = await tx
    .select(HEAD_COLUMNS)
    .from(catalogRelease)
    .where(and(eq(catalogRelease.tenantId, tenantId), eq(catalogRelease.id, id)));
  const [head] = await countedHeads(tx, tenantId, rows);
  return head ?? null;
}

/** A stored line read whole; CHECK `catalog_release_line_one_item` sets exactly one reference. */
function lineOf(row: {
  readonly catalogItemId: string | null;
  readonly tenantCatalogItemId: string | null;
  readonly kind: ComponentKind;
  readonly brand: string;
  readonly model: string;
  readonly changeKind: ReleaseChangeKind;
  readonly before: unknown;
  readonly after: unknown;
}): ReleaseLine {
  const id = row.catalogItemId ?? row.tenantCatalogItemId;
  if (id === null) throw new Error('a catalog release line names no item');
  return {
    item: {
      id,
      source: row.catalogItemId === null ? 'own_item' : 'platform_item',
      kind: row.kind,
      brand: row.brand,
      model: row.model,
    },
    changeKind: row.changeKind,
    before: row.before === null ? null : readReleaseSnapshot(row.before),
    after: readReleaseSnapshot(row.after),
  };
}

/** The heads with their lines counted by kind, in ONE grouped read for the page. */
async function countedHeads(
  tx: TenantScopedDb,
  tenantId: string,
  rows: readonly { readonly id: string; readonly label: string; readonly publishedAt: Date }[],
): Promise<ReleaseHead[]> {
  if (rows.length === 0) return [];
  const tallies = await tx
    .select({
      releaseId: catalogReleaseLine.catalogReleaseId,
      changeKind: catalogReleaseLine.changeKind,
      value: count(),
    })
    .from(catalogReleaseLine)
    .where(
      and(
        eq(catalogReleaseLine.tenantId, tenantId),
        inArray(
          catalogReleaseLine.catalogReleaseId,
          rows.map((row) => row.id),
        ),
      ),
    )
    .groupBy(catalogReleaseLine.catalogReleaseId, catalogReleaseLine.changeKind);
  return rows.map((row) => {
    const counts = { added: 0, changed: 0, archived: 0 };
    for (const tally of tallies) {
      if (tally.releaseId === row.id) counts[tally.changeKind] = tally.value;
    }
    return { ...row, counts };
  });
}
