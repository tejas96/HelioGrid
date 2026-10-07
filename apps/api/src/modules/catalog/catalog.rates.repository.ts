import {
  catalogRateEntry,
  type TenantPool,
  type TenantScopedDb,
  tenantCatalogOverride,
} from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gt, inArray, lte } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import type { CreationKey } from '../../common/creation-key';
import { TENANT_DB } from '../../common/db/tenant.token';

/** What a rate is recorded on (`M01-44`): an own SKU, or the tenant's override on a platform item. */
export type RateParent =
  | { readonly on: 'own_item'; readonly id: string }
  | { readonly on: 'override'; readonly id: string };

/** A ledger row as stored: the amount is the column's decimal text, `null` a cleared rate. */
export interface StoredRate {
  readonly amount: string | null;
  readonly currency: string;
  readonly effectiveOn: string;
  readonly sequence: number;
}

export interface RecordedRate extends Omit<StoredRate, 'sequence'> {
  readonly recordedAt: Date;
}

export type RateToAppend = Omit<StoredRate, 'sequence'>;

/**
 * Appends one dated entry ON THE CALLER'S TRANSACTION — the one write behind every price change
 * (`M01-44`): never an UPDATE, so every earlier entry stays byte-identical. The caller holds the
 * catalog lock and has resolved the parent inside this tenant first: a foreign key ignores RLS.
 * Answers the entry's id, which an import's row keeps as the price it applied.
 */
export async function appendRate(
  tx: TenantScopedDb,
  tenantId: string,
  parent: RateParent,
  entry: RateToAppend,
  act: Act,
  key: CreationKey | null,
): Promise<string> {
  const [appended] = await tx
    .insert(catalogRateEntry)
    .values({
      tenantId,
      tenantCatalogItemId: parent.on === 'own_item' ? parent.id : null,
      tenantCatalogOverrideId: parent.on === 'override' ? parent.id : null,
      rateAmount: entry.amount,
      currencyCode: entry.currency,
      entryDate: entry.effectiveOn,
      enteredBy: act.actorUserId,
      recordedAt: new Date(act.now),
      creationKey: key?.key,
      creationFingerprint: key?.fingerprint,
    })
    .returning({ id: catalogRateEntry.id });
  if (!appended) throw new Error('catalog_rate_entry insert returned no row');
  return appended.id;
}

/** The entry an earlier send with this key appended, and the request it answered (`F4-07`). */
export async function rateMadeWith(
  tx: TenantScopedDb,
  tenantId: string,
  key: CreationKey,
): Promise<{ readonly fingerprint: string | null } | null> {
  const [made] = await tx
    .select({ fingerprint: catalogRateEntry.creationFingerprint })
    .from(catalogRateEntry)
    .where(and(eq(catalogRateEntry.tenantId, tenantId), eq(catalogRateEntry.creationKey, key.key)))
    .limit(1);
  return made ?? null;
}

/**
 * The entry in force on a day for each parent — one row per parent (decision 16): the newest
 * date on or before it, then the newest sequence. A list page never loads a whole ledger.
 */
export async function ratesInForce(
  tx: TenantScopedDb,
  tenantId: string,
  parents: { readonly ownItems: readonly string[]; readonly overrides: readonly string[] },
  pricedOn: string,
): Promise<Map<string, StoredRate>> {
  const inForce = new Map<string, StoredRate>();
  const stored = {
    amount: catalogRateEntry.rateAmount,
    currency: catalogRateEntry.currencyCode,
    effectiveOn: catalogRateEntry.entryDate,
    sequence: catalogRateEntry.sequence,
  };
  const onOrBefore = lte(catalogRateEntry.entryDate, pricedOn);
  const newestFirst = [desc(catalogRateEntry.entryDate), desc(catalogRateEntry.sequence)];
  if (parents.ownItems.length > 0) {
    const rows = await tx
      .selectDistinctOn([catalogRateEntry.tenantCatalogItemId], {
        parentId: catalogRateEntry.tenantCatalogItemId,
        ...stored,
      })
      .from(catalogRateEntry)
      .where(
        and(
          eq(catalogRateEntry.tenantId, tenantId),
          inArray(catalogRateEntry.tenantCatalogItemId, [...parents.ownItems]),
          onOrBefore,
        ),
      )
      .orderBy(catalogRateEntry.tenantCatalogItemId, ...newestFirst);
    for (const { parentId, ...rate } of rows) if (parentId) inForce.set(parentId, rate);
  }
  if (parents.overrides.length > 0) {
    const rows = await tx
      .selectDistinctOn([catalogRateEntry.tenantCatalogOverrideId], {
        parentId: catalogRateEntry.tenantCatalogOverrideId,
        ...stored,
      })
      .from(catalogRateEntry)
      .where(
        and(
          eq(catalogRateEntry.tenantId, tenantId),
          inArray(catalogRateEntry.tenantCatalogOverrideId, [...parents.overrides]),
          onOrBefore,
        ),
      )
      .orderBy(catalogRateEntry.tenantCatalogOverrideId, ...newestFirst);
    for (const { parentId, ...rate } of rows) if (parentId) inForce.set(parentId, rate);
  }
  return inForce;
}

/**
 * An item a rate is read for: an own SKU, or a platform item through the tenant's override. A read
 * that already joined the override passes its id (null when there is none), and no lookup runs.
 */
export interface RatedItem {
  readonly source: 'platform_item' | 'own_item';
  readonly id: string;
  readonly overrideId?: string | null;
}

/** The rate in force on an item, and the ledger it came from. */
export interface ItemRate extends StoredRate {
  readonly on: RateParent['on'];
}

/**
 * Each item's rate in force on `pricedOn`, by item id: an own SKU's own ledger, a platform item's
 * override's (`M01-44`) — the one rule every reader picks the ledger by. At most three statements
 * whatever the count; an item with no rate is absent.
 */
export async function itemRatesInForce(
  tx: TenantScopedDb,
  tenantId: string,
  items: readonly RatedItem[],
  pricedOn: string,
): Promise<Map<string, ItemRate>> {
  const ownItems = items.filter((item) => item.source === 'own_item').map((item) => item.id);
  const platform = items.filter((item) => item.source === 'platform_item');
  const known = platform.flatMap((item) =>
    item.overrideId == null ? [] : [{ id: item.overrideId, itemId: item.id }],
  );
  const unknown = platform.filter((item) => item.overrideId === undefined).map((item) => item.id);
  const looked =
    unknown.length === 0
      ? []
      : await tx
          .select({ id: tenantCatalogOverride.id, itemId: tenantCatalogOverride.catalogItemId })
          .from(tenantCatalogOverride)
          .where(
            and(
              eq(tenantCatalogOverride.tenantId, tenantId),
              inArray(tenantCatalogOverride.catalogItemId, unknown),
            ),
          );
  const overrides = [...known, ...looked];
  const rates = await ratesInForce(
    tx,
    tenantId,
    { ownItems, overrides: overrides.map((override) => override.id) },
    pricedOn,
  );
  const byItem = new Map<string, ItemRate>();
  for (const id of ownItems) {
    const rate = rates.get(id);
    if (rate !== undefined) byItem.set(id, { ...rate, on: 'own_item' });
  }
  for (const { id, itemId } of overrides) {
    const rate = rates.get(id);
    if (rate !== undefined) byItem.set(itemId, { ...rate, on: 'override' });
  }
  return byItem;
}

/**
 * The days from `today` on whose price a clear must end (b11): today when the rate in force is a
 * price, and every later day whose newest entry is one — each would otherwise take over on its
 * day. A null appended on such a day is newer by sequence, so it wins there.
 */
export async function pricedDaysFrom(
  tx: TenantScopedDb,
  tenantId: string,
  overrideId: string,
  today: string,
): Promise<string[]> {
  const inForce = await ratesInForce(
    tx,
    tenantId,
    { ownItems: [], overrides: [overrideId] },
    today,
  );
  const later = await tx
    .selectDistinctOn([catalogRateEntry.entryDate], {
      effectiveOn: catalogRateEntry.entryDate,
      amount: catalogRateEntry.rateAmount,
    })
    .from(catalogRateEntry)
    .where(
      and(
        eq(catalogRateEntry.tenantId, tenantId),
        eq(catalogRateEntry.tenantCatalogOverrideId, overrideId),
        gt(catalogRateEntry.entryDate, today),
      ),
    )
    .orderBy(catalogRateEntry.entryDate, desc(catalogRateEntry.sequence));
  const pricedToday = inForce.get(overrideId)?.amount != null ? [today] : [];
  return [
    ...pricedToday,
    ...later.filter((day) => day.amount !== null).map((day) => day.effectiveOn),
  ];
}

/** The dated history on the runtime pool, newest first; the sequence stays off the wire. */
@Injectable()
export class CatalogRatesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async history(
    tenantId: string,
    parent: RateParent,
    page: { readonly limit: number; readonly offset: number },
  ): Promise<{ readonly entries: readonly RecordedRate[]; readonly totalCount: number }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const where = and(
        eq(catalogRateEntry.tenantId, tenantId),
        parent.on === 'own_item'
          ? eq(catalogRateEntry.tenantCatalogItemId, parent.id)
          : eq(catalogRateEntry.tenantCatalogOverrideId, parent.id),
      );
      const entries = await tx
        .select({
          amount: catalogRateEntry.rateAmount,
          currency: catalogRateEntry.currencyCode,
          effectiveOn: catalogRateEntry.entryDate,
          recordedAt: catalogRateEntry.recordedAt,
        })
        .from(catalogRateEntry)
        .where(where)
        .orderBy(desc(catalogRateEntry.entryDate), desc(catalogRateEntry.sequence))
        .limit(page.limit)
        .offset(page.offset);
      const [total] = await tx.select({ value: count() }).from(catalogRateEntry).where(where);
      return { entries, totalCount: total?.value ?? 0 };
    });
  }
}
