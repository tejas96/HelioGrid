import type { CatalogOverrideWrite } from '@heliogrid/contracts';
import { type TenantPool, type TenantScopedDb, tenantCatalogOverride } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { recordAuditEntry } from '../audit/audit.public';
import {
  appendRate,
  pricedDaysFrom,
  type RateParent,
  type RateToAppend,
  rateMadeWith,
} from './catalog.rates.repository';
import {
  catalogAct,
  lockCatalog,
  ownItem,
  platform,
  type Refusal,
  refusalFor,
  standingOf,
} from './catalog.standing.repository';

/** Only what was sent: an absent field keeps its value, `taxPct: null` unsets the tax. */
export type OverridePatch = Omit<CatalogOverrideWrite, 'rate'>;

/**
 * The tenant's prices and overrides on platform items, on the runtime pool (`M01-37`, `M01-44`):
 * the sparse override set and cleared, and the dated rate appended — on an own SKU or on a
 * platform item's override. A retried send with its key appends nothing twice (b8, `F4-07`).
 */
@Injectable()
export class CatalogPricesRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  /** The sparse fields set, and a rate appended through the one ledger write when one was sent. */
  async saveOverride(
    tenantId: string,
    marketCode: string,
    id: string,
    patch: OverridePatch,
    rate: RateToAppend | null,
    act: Act,
    key: CreationKey | null,
  ): Promise<Refusal | Keyed<string>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      // The key guards the one row a retry could double, the rate entry; the fields are set, not added.
      const rateKey = rate === null ? null : key;
      const replay = await replayedRate(tx, tenantId, id, rateKey);
      if (replay !== null) return replay;
      await lockCatalog(tx, tenantId);
      const standing = await standingOf(tx, tenantId, marketCode, id);
      if (standing?.is !== 'platform_item') return refusalFor(standing);
      const overrideId = await upsertOverride(tx, tenantId, id, patch, act);
      if (rate !== null) {
        await appendRate(tx, tenantId, { on: 'override', id: overrideId }, rate, act, rateKey);
      }
      await recordAuditEntry(
        tx,
        catalogAct('catalog.override_changed', tenantId, platform(id), act),
      );
      return { outcome: 'created', row: id };
    });
  }

  /**
   * Every sparse field reset, and every price from today on ended by a dated absence (b11): the
   * rate in force today, and each later-dated one, which would otherwise come back on its day.
   * The history stays. No override means nothing to clear, and nothing is written.
   */
  async clearOverride(
    tenantId: string,
    marketCode: string,
    id: string,
    today: { readonly effectiveOn: string; readonly currency: string },
    act: Act,
  ): Promise<Refusal | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      await lockCatalog(tx, tenantId);
      const standing = await standingOf(tx, tenantId, marketCode, id);
      if (standing?.is !== 'platform_item') return refusalFor(standing);
      if (standing.overrideId === null) return null;
      const overrideId = standing.overrideId;
      await tx
        .update(tenantCatalogOverride)
        .set({ taxPct: null, hidden: false, preferred: false, updatedAt: new Date(act.now) })
        .where(
          and(
            eq(tenantCatalogOverride.tenantId, tenantId),
            eq(tenantCatalogOverride.id, overrideId),
          ),
        );
      const priced = await pricedDaysFrom(tx, tenantId, overrideId, today.effectiveOn);
      for (const effectiveOn of priced) {
        const cleared = { amount: null, currency: today.currency, effectiveOn };
        await appendRate(tx, tenantId, { on: 'override', id: overrideId }, cleared, act, null);
      }
      await recordAuditEntry(
        tx,
        catalogAct('catalog.override_cleared', tenantId, platform(id), act),
      );
      return null;
    });
  }

  /** One dated entry on an own SKU, or on a platform item's override — made bare if none exists. */
  async recordRate(
    tenantId: string,
    marketCode: string,
    id: string,
    rate: RateToAppend,
    act: Act,
    key: CreationKey | null,
  ): Promise<Refusal | Keyed<string>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const replay = await replayedRate(tx, tenantId, id, key);
      if (replay !== null) return replay;
      await lockCatalog(tx, tenantId);
      const standing = await standingOf(tx, tenantId, marketCode, id);
      if (standing === null) return { outcome: 'not-found' };
      const parent: RateParent =
        standing.is === 'own_item'
          ? ownItem(id)
          : {
              on: 'override',
              id: standing.overrideId ?? (await upsertOverride(tx, tenantId, id, {}, act)),
            };
      await appendRate(tx, tenantId, parent, rate, act, key);
      const subject = standing.is === 'own_item' ? ownItem(id) : platform(id);
      await recordAuditEntry(tx, catalogAct('catalog.rate_recorded', tenantId, subject, act));
      return { outcome: 'created', row: id };
    });
  }

  /** The ledger behind an item id, for the history read — `null` for a platform item never priced. */
  async rateParentOf(
    tenantId: string,
    marketCode: string,
    id: string,
  ): Promise<{ readonly outcome: 'not-found' } | { readonly parent: RateParent | null }> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      const standing = await standingOf(tx, tenantId, marketCode, id);
      if (standing === null) return { outcome: 'not-found' };
      if (standing.is === 'own_item') return { parent: ownItem(id) };
      const { overrideId } = standing;
      return { parent: overrideId === null ? null : { on: 'override', id: overrideId } };
    });
  }
}

/** The item a rate entry with this key was appended for, when this send is a retry of it. */
async function replayedRate(
  tx: TenantScopedDb,
  tenantId: string,
  id: string,
  key: CreationKey | null,
): Promise<Keyed<string> | null> {
  if (key === null) return null;
  await lockCreationKey(tx, key);
  const made = await rateMadeWith(tx, tenantId, key);
  return made === null ? null : replayOf(id, made.fingerprint, key);
}

async function upsertOverride(
  tx: TenantScopedDb,
  tenantId: string,
  catalogItemId: string,
  patch: OverridePatch,
  act: Act,
): Promise<string> {
  const now = new Date(act.now);
  const [row] = await tx
    .insert(tenantCatalogOverride)
    .values({
      tenantId,
      catalogItemId,
      taxPct: patch.taxPct ?? null,
      hidden: patch.hidden ?? false,
      preferred: patch.preferred ?? false,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [tenantCatalogOverride.tenantId, tenantCatalogOverride.catalogItemId],
      set: { ...patch, updatedAt: now },
    })
    .returning({ id: tenantCatalogOverride.id });
  if (!row) throw new Error('tenant_catalog_override upsert returned no row');
  return row.id;
}
