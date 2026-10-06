import {
  catalogItem,
  catalogItemMarketAvailability,
  type TenantScopedDb,
  tenantCatalogItem,
  tenantCatalogOverride,
} from '@heliogrid/db';
import type { AuditEventType, ComponentKind } from '@heliogrid/domain';
import { and, eq, sql } from 'drizzle-orm';
import type { Act } from '../../common/auth/session-context';
import { type AuditEntryToWrite, memberAct } from '../audit/audit.public';

/**
 * What every catalog write does first, on the caller's transaction: take the catalog lock
 * (decision 10) — the publish snapshots the catalog under it — and resolve the item id inside
 * this tenant and market, since a foreign key ignores RLS. Nothing here deletes: a product is
 * archived (`M01-42`), a price is appended (`M01-44`).
 */

/** Why a write on an item id did not happen: not this tenant's to see, or the wrong tier for it. */
export type Refusal = { readonly outcome: 'not-found' | 'read-only' | 'own-item' | 'kind-changed' };

export type Standing =
  | { readonly is: 'own_item'; readonly kind: ComponentKind; readonly archived: boolean }
  | { readonly is: 'platform_item'; readonly overrideId: string | null };

/** Every tenant catalog write serialises here, and the release publish takes the same lock. */
export async function lockCatalog(tx: TenantScopedDb, tenantId: string): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`catalog:${tenantId}`}))`);
}

/** An item id as this tenant may see it: its own SKU, or a platform item of its market. */
export async function standingOf(
  tx: TenantScopedDb,
  tenantId: string,
  marketCode: string,
  id: string,
): Promise<Standing | null> {
  const [own] = await tx
    .select({ kind: tenantCatalogItem.componentKind, archived: tenantCatalogItem.archived })
    .from(tenantCatalogItem)
    .where(and(eq(tenantCatalogItem.tenantId, tenantId), eq(tenantCatalogItem.id, id)));
  if (own) return { is: 'own_item', ...own };
  const [listed] = await tx
    .select({ overrideId: tenantCatalogOverride.id })
    .from(catalogItem)
    .innerJoin(
      catalogItemMarketAvailability,
      and(
        eq(catalogItemMarketAvailability.catalogItemId, catalogItem.id),
        eq(catalogItemMarketAvailability.marketCode, marketCode),
      ),
    )
    .leftJoin(
      tenantCatalogOverride,
      and(
        eq(tenantCatalogOverride.catalogItemId, catalogItem.id),
        eq(tenantCatalogOverride.tenantId, tenantId),
      ),
    )
    .where(eq(catalogItem.id, id));
  return listed ? { is: 'platform_item', overrideId: listed.overrideId } : null;
}

export function refusalFor(standing: Standing | null): Refusal {
  if (standing === null) return { outcome: 'not-found' };
  return { outcome: standing.is === 'platform_item' ? 'read-only' : 'own-item' };
}

export const ownItem = (id: string) => ({ on: 'own_item', id }) as const;
export const platform = (id: string) => ({ on: 'platform_item', id }) as const;

/** The entry a catalog act records: its subject is the own SKU, or the platform item overridden. */
export function catalogAct(
  event: AuditEventType,
  tenantId: string,
  subject: { readonly on: 'own_item' | 'platform_item'; readonly id: string },
  act: Act,
): AuditEntryToWrite {
  const kind = subject.on === 'own_item' ? 'tenant_catalog_item' : 'catalog_item';
  return memberAct(event, tenantId, { kind, ref: subject.id }, act);
}
