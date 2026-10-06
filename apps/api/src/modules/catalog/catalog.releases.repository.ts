import {
  catalogRelease,
  catalogReleaseLine,
  type TenantPool,
  type TenantScopedDb,
  tenantCatalogItem,
  tenantCatalogOverride,
} from '@heliogrid/db';
import { type CatalogReleaseSnapshot, changeKindOf } from '@heliogrid/domain';
import { minorUnitsOfDecimal, readReleaseSnapshot } from '@heliogrid/domain/server';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { memberAct, recordAuditEntry } from '../audit/audit.public';
import { ratesInForce } from './catalog.rates.repository';
import { lockCatalog } from './catalog.standing.repository';

/** The day a publish snapshots and the digits its currency keeps (c2). */
export interface PublishDay {
  readonly pricedOn: string;
  readonly minorUnitDigits: number;
}

export type PublishOutcome =
  | Keyed<string>
  | { readonly outcome: 'label-taken' | 'nothing-changed' };

/** Which item a line is about: exactly one of the two references is set. */
interface LineItem {
  readonly catalogItemId: string | null;
  readonly tenantCatalogItemId: string | null;
}

interface Snapshotted {
  readonly item: LineItem;
  readonly snapshot: CatalogReleaseSnapshot;
}

const keyOf = (item: LineItem): string =>
  item.catalogItemId === null
    ? `own:${item.tenantCatalogItemId}`
    : `platform:${item.catalogItemId}`;

/**
 * The tenant's releases on the runtime pool (`M01-43`). A publish holds the catalog lock every
 * write takes (decision 10), snapshots every own SKU and override as it stands on the publish day,
 * and compares each with its last line (c1) — so a rate dated ahead is named on its day, with no
 * write to find it by. Lines and releases are append-only; nothing here updates or deletes.
 */
@Injectable()
export class CatalogReleasesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async publish(
    tenantId: string,
    label: string,
    day: PublishDay,
    act: Act,
    key: CreationKey | null,
  ): Promise<PublishOutcome> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      // The key before the label (c7): a replay answers the release it made, not 409 on its name.
      if (key !== null) {
        await lockCreationKey(tx, key);
        const [made] = await tx
          .select({ id: catalogRelease.id, fingerprint: catalogRelease.creationFingerprint })
          .from(catalogRelease)
          .where(
            and(eq(catalogRelease.tenantId, tenantId), eq(catalogRelease.creationKey, key.key)),
          )
          .limit(1);
        if (made) return replayOf(made.id, made.fingerprint, key);
      }
      await lockCatalog(tx, tenantId);
      const [taken] = await tx
        .select({ id: catalogRelease.id })
        .from(catalogRelease)
        .where(and(eq(catalogRelease.tenantId, tenantId), eq(catalogRelease.label, label)))
        .limit(1);
      if (taken) return { outcome: 'label-taken' };
      const snapshots = await snapshotsOn(tx, tenantId, day);
      const earlier = await lastLinesOf(
        tx,
        tenantId,
        snapshots.map(({ item }) => item),
      );
      const changed = snapshots.flatMap(({ item, snapshot }) => {
        const before = earlier.get(keyOf(item)) ?? null;
        const changeKind = changeKindOf(before, snapshot);
        return changeKind === null ? [] : [{ ...item, changeKind, before, after: snapshot }];
      });
      if (changed.length === 0) return { outcome: 'nothing-changed' };
      const publishedAt = await nextPublishedAt(tx, tenantId, act.now);
      const [release] = await tx
        .insert(catalogRelease)
        .values({
          tenantId,
          label,
          publishedAt,
          publishedBy: act.actorUserId,
          creationKey: key?.key,
          creationFingerprint: key?.fingerprint,
        })
        .returning({ id: catalogRelease.id });
      if (!release) throw new Error('catalog_release insert returned no row');
      await tx
        .insert(catalogReleaseLine)
        .values(changed.map((line) => ({ tenantId, catalogReleaseId: release.id, ...line })));
      await recordAuditEntry(
        tx,
        memberAct(
          'catalog.release_published',
          tenantId,
          { kind: 'catalog_release', ref: release.id },
          act,
        ),
      );
      return { outcome: 'created', row: release.id };
    });
  }
}

/** Every own SKU and override as stored, its rate the one in force on the publish day (c2). */
async function snapshotsOn(
  tx: TenantScopedDb,
  tenantId: string,
  day: PublishDay,
): Promise<readonly Snapshotted[]> {
  const own = await tx
    .select({
      id: tenantCatalogItem.id,
      brand: tenantCatalogItem.brand,
      model: tenantCatalogItem.model,
      spec: tenantCatalogItem.spec,
      certifications: tenantCatalogItem.certifications,
      preferred: tenantCatalogItem.preferred,
      archived: tenantCatalogItem.archived,
    })
    .from(tenantCatalogItem)
    .where(eq(tenantCatalogItem.tenantId, tenantId));
  const overrides = await tx
    .select({
      id: tenantCatalogOverride.id,
      catalogItemId: tenantCatalogOverride.catalogItemId,
      taxPct: tenantCatalogOverride.taxPct,
      hidden: tenantCatalogOverride.hidden,
      preferred: tenantCatalogOverride.preferred,
    })
    .from(tenantCatalogOverride)
    .where(eq(tenantCatalogOverride.tenantId, tenantId));
  const parents = { ownItems: own.map((row) => row.id), overrides: overrides.map((row) => row.id) };
  const inForce = await ratesInForce(tx, tenantId, parents, day.pricedOn);
  const rateOf = (parentId: string) => {
    const rate = inForce.get(parentId);
    if (rate === undefined || rate.amount === null) return null;
    const amount = minorUnitsOfDecimal(rate.amount, day.minorUnitDigits);
    return { amount, currency: rate.currency, effectiveOn: rate.effectiveOn };
  };
  // Read through the stored line's own schema, so both sides of a comparison parse alike (c4).
  return [
    ...own.map(({ id, ...item }) => ({
      item: { catalogItemId: null, tenantCatalogItemId: id },
      snapshot: readReleaseSnapshot({ kind: 'own_item', ...item, rate: rateOf(id) }),
    })),
    ...overrides.map(({ id, catalogItemId, ...override }) => ({
      item: { catalogItemId, tenantCatalogItemId: null },
      snapshot: readReleaseSnapshot({ kind: 'override', ...override, rate: rateOf(id) }),
    })),
  ];
}

/**
 * After every earlier release of the tenant, whatever this machine's clock says: `act.now` is read
 * when the request arrives, before the lock, so a publish that waited could carry an earlier
 * instant than the one it waited on — and "the last line" is the line of the latest instant.
 */
async function nextPublishedAt(tx: TenantScopedDb, tenantId: string, now: number): Promise<Date> {
  const [newest] = await tx
    .select({ at: catalogRelease.publishedAt })
    .from(catalogRelease)
    .where(eq(catalogRelease.tenantId, tenantId))
    .orderBy(desc(catalogRelease.publishedAt))
    .limit(1);
  return new Date(newest === undefined ? now : Math.max(now, newest.at.getTime() + 1));
}

/**
 * Each item's newest line's `after`: the `before` its next line compares with. Read per item
 * through its own index (`catalog_release_line_tenant_item_idx`, `…_own_item_idx`), so the read
 * grows with the releases that changed each item, never with the tenant's whole history.
 */
async function lastLinesOf(
  tx: TenantScopedDb,
  tenantId: string,
  items: readonly LineItem[],
): Promise<Map<string, CatalogReleaseSnapshot>> {
  const lines = new Map<string, CatalogReleaseSnapshot>();
  const byColumn = [
    [catalogReleaseLine.catalogItemId, items.flatMap((item) => item.catalogItemId ?? [])],
    [
      catalogReleaseLine.tenantCatalogItemId,
      items.flatMap((item) => item.tenantCatalogItemId ?? []),
    ],
  ] as const;
  for (const [column, ids] of byColumn) {
    if (ids.length === 0) continue;
    const rows = await tx
      .selectDistinctOn([column], {
        catalogItemId: catalogReleaseLine.catalogItemId,
        tenantCatalogItemId: catalogReleaseLine.tenantCatalogItemId,
        after: catalogReleaseLine.after,
      })
      .from(catalogReleaseLine)
      .innerJoin(catalogRelease, eq(catalogRelease.id, catalogReleaseLine.catalogReleaseId))
      .where(and(eq(catalogReleaseLine.tenantId, tenantId), inArray(column, ids)))
      .orderBy(column, desc(catalogRelease.publishedAt));
    for (const row of rows) lines.set(keyOf(row), readReleaseSnapshot(row.after));
  }
  return lines;
}
