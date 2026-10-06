import type { OwnCatalogItemWrite } from '@heliogrid/contracts';
import { type TenantPool, tenantCatalogItem } from '@heliogrid/db';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type CreationKey, type Keyed, replayOf } from '../../common/creation-key';
import { lockCreationKey } from '../../common/db/creation-key-lock';
import { TENANT_DB } from '../../common/db/tenant.token';
import { recordAuditEntry } from '../audit/audit.public';
import { appendRate, type RateToAppend } from './catalog.rates.repository';
import {
  catalogAct,
  lockCatalog,
  ownItem,
  type Refusal,
  refusalFor,
  standingOf,
} from './catalog.standing.repository';

/**
 * A tenant's own SKUs on the runtime pool (`M01-36`, `M01-39`, `M01-42`): created from the single
 * form, edited whole, archived and brought back — never deleted. Each write holds the catalog lock
 * and records its one audit entry in its own transaction (b7).
 */
@Injectable()
export class CatalogRepository {
  // Explicit token: tsx (esbuild) emits no decorator metadata (apps/api/CLAUDE.md landmine).
  constructor(@Inject(TENANT_DB) private readonly db: TenantPool) {}

  async createOwnItem(
    tenantId: string,
    item: OwnCatalogItemWrite,
    rate: RateToAppend | null,
    act: Act,
    key: CreationKey | null,
  ): Promise<Keyed<string>> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      if (key !== null) {
        await lockCreationKey(tx, key);
        const [made] = await tx
          .select({ id: tenantCatalogItem.id, fingerprint: tenantCatalogItem.creationFingerprint })
          .from(tenantCatalogItem)
          .where(
            and(
              eq(tenantCatalogItem.tenantId, tenantId),
              eq(tenantCatalogItem.creationKey, key.key),
            ),
          )
          .limit(1);
        if (made) return replayOf(made.id, made.fingerprint, key);
      }
      await lockCatalog(tx, tenantId);
      const [row] = await tx
        .insert(tenantCatalogItem)
        .values({
          tenantId,
          componentKind: item.spec.kind,
          ...item,
          archived: false,
          createdAt: new Date(act.now),
          updatedAt: new Date(act.now),
          creationKey: key?.key,
          creationFingerprint: key?.fingerprint,
        })
        .returning({ id: tenantCatalogItem.id });
      if (!row) throw new Error('tenant_catalog_item insert returned no row');
      if (rate !== null) await appendRate(tx, tenantId, ownItem(row.id), rate, act, null);
      await recordAuditEntry(
        tx,
        catalogAct('catalog.item_created', tenantId, ownItem(row.id), act),
      );
      return { outcome: 'created', row: row.id };
    });
  }

  /** The whole form replaced; the kind is the SKU's for life, so a spec of another kind is refused. */
  async saveOwnItem(
    tenantId: string,
    marketCode: string,
    id: string,
    item: OwnCatalogItemWrite,
    act: Act,
  ): Promise<Refusal | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      await lockCatalog(tx, tenantId);
      const standing = await standingOf(tx, tenantId, marketCode, id);
      if (standing?.is !== 'own_item') return refusalFor(standing);
      if (standing.kind !== item.spec.kind) return { outcome: 'kind-changed' };
      await tx
        .update(tenantCatalogItem)
        .set({ ...item, updatedAt: new Date(act.now) })
        .where(and(eq(tenantCatalogItem.tenantId, tenantId), eq(tenantCatalogItem.id, id)));
      await recordAuditEntry(tx, catalogAct('catalog.item_changed', tenantId, ownItem(id), act));
      return null;
    });
  }

  /** Archive or bring back; asking for the state it is already in writes nothing. */
  async setArchived(
    tenantId: string,
    marketCode: string,
    id: string,
    archived: boolean,
    act: Act,
  ): Promise<Refusal | null> {
    return this.db.withTenantTransaction(tenantId, async (tx) => {
      await lockCatalog(tx, tenantId);
      const standing = await standingOf(tx, tenantId, marketCode, id);
      if (standing?.is !== 'own_item') return refusalFor(standing);
      if (standing.archived === archived) return null;
      await tx
        .update(tenantCatalogItem)
        .set({ archived, updatedAt: new Date(act.now) })
        .where(and(eq(tenantCatalogItem.tenantId, tenantId), eq(tenantCatalogItem.id, id)));
      const event = archived ? 'catalog.item_archived' : 'catalog.item_unarchived';
      await recordAuditEntry(tx, catalogAct(event, tenantId, ownItem(id), act));
      return null;
    });
  }
}
