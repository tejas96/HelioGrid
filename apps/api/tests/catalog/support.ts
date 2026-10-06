import { randomUUID } from 'node:crypto';
import { type CatalogItemWire, rolePresetSchema } from '@heliogrid/contracts';
import {
  auditLogEntry,
  catalogItem,
  catalogItemCertification,
  catalogItemMarketAvailability,
  catalogRateEntry,
  marketPack,
} from '@heliogrid/db';
import type { Certification, PanelSpec } from '@heliogrid/domain';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import type { Act } from '../../src/common/auth/session-context';
import { CreationReplies } from '../../src/common/creation-key';
import { CatalogAdminRepository } from '../../src/modules/catalog/catalog.admin.repository';
import { CatalogPlatformService } from '../../src/modules/catalog/catalog.platform.service';
import { CatalogPricesRepository } from '../../src/modules/catalog/catalog.prices.repository';
import { CatalogRatesRepository } from '../../src/modules/catalog/catalog.rates.repository';
import { CatalogRepository } from '../../src/modules/catalog/catalog.repository';
import { CatalogService } from '../../src/modules/catalog/catalog.service';
import { CatalogSliceRepository } from '../../src/modules/catalog/catalog.slice.repository';
import type { openPools } from '../support/fixture';
import { marketsOf } from '../support/market';

export { publishIndiaPack } from '../support/market';

type Pools = ReturnType<typeof openPools>;

/** The publish service as `catalog.module.ts` composes it, over the real admin repository and the real pack read. */
export function catalogPlatformServiceOf(pools: Pools): CatalogPlatformService {
  return new CatalogPlatformService(new CatalogAdminRepository(pools.admin.db), marketsOf(pools));
}

/** The tenant-facing service as `catalog.module.ts` composes it, over the real repositories. */
export function catalogServiceOf(pools: Pools): CatalogService {
  return new CatalogService(
    new CatalogSliceRepository(pools.tenants),
    new CatalogRepository(pools.tenants),
    new CatalogPricesRepository(pools.tenants),
    new CatalogRatesRepository(pools.tenants),
    marketsOf(pools),
    new CreationReplies(new PinoLogger({ pinoHttp: { level: 'silent' } })),
  );
}

/** A panel that passes its kind's gates; `watt` and `technology` are the picker's two filters. */
export const aPanelSpec = (overrides: Partial<PanelSpec> = {}): PanelSpec => ({
  kind: 'panel',
  watt: 550,
  technology: 'topcon',
  lengthMm: 2278,
  widthMm: 1134,
  vocV: 49.6,
  vmpV: 41.8,
  iscA: 14,
  impA: 13.2,
  tempCoeffVocPct: -0.25,
  warrantyYears: 30,
  weightKg: 27,
  ...overrides,
});

/** Short enough to type into a search, unique enough that no other run's rows share it. */
const RUN_TAG_LENGTH = 8;
export const aRunTag = (): string => randomUUID().slice(0, RUN_TAG_LENGTH);

/** The one market a slice proof needs that is not the tenant's: its items must never be seen. */
export const OTHER_MARKET = 'ZZ';

/**
 * Platform items written straight on the admin path — the curation tooling's place, which no
 * tenant route reaches — each under a brand unique to the run, so no other suite's book moves
 * them. Removed by `removePlatformItems` after the tenant rows that name them.
 */
export async function aPlatformItem(
  pools: Pools,
  item: {
    readonly model: string;
    readonly markets: readonly string[];
    readonly spec?: PanelSpec;
    readonly certifications?: readonly Certification[];
    readonly archived?: boolean;
  },
): Promise<string> {
  const db = pools.admin.db;
  if (item.markets.includes(OTHER_MARKET)) {
    await db.insert(marketPack).values({ marketCode: OTHER_MARKET }).onConflictDoNothing();
  }
  const now = new Date();
  const [row] = await db
    .insert(catalogItem)
    .values({
      componentKind: 'panel',
      brand: `Proof ${aRunTag()}`,
      model: item.model,
      spec: item.spec ?? aPanelSpec(),
      provenanceLabel: 'representative',
      availability: 'available',
      archived: item.archived ?? false,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: catalogItem.id });
  if (!row) throw new Error('catalog_item insert returned no row');
  await db
    .insert(catalogItemMarketAvailability)
    .values(item.markets.map((marketCode) => ({ catalogItemId: row.id, marketCode })));
  const claims = item.certifications ?? [];
  if (claims.length > 0) {
    await db.insert(catalogItemCertification).values(
      claims.map((claim) => ({
        catalogItemId: row.id,
        schemeKey: claim.scheme,
        reference: claim.reference,
      })),
    );
  }
  return row.id;
}

/** After `unseed`, which removes every tenant row naming them. */
export async function removePlatformItems(pools: Pools, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = pools.admin.db;
  await db
    .delete(catalogItemCertification)
    .where(inArray(catalogItemCertification.catalogItemId, [...ids]));
  await db
    .delete(catalogItemMarketAvailability)
    .where(inArray(catalogItemMarketAvailability.catalogItemId, [...ids]));
  await db.delete(catalogItem).where(inArray(catalogItem.id, [...ids]));
}

/** The entries one act left on a subject, oldest first — on the admin path. */
export function entriesOf(pools: Pools, tenantId: string, eventType: string, subjectRef: string) {
  return pools.admin.db
    .select({ subjectKind: auditLogEntry.subjectKind, actorRef: auditLogEntry.actorRef })
    .from(auditLogEntry)
    .where(
      and(
        eq(auditLogEntry.tenantId, tenantId),
        eq(auditLogEntry.subjectRef, subjectRef),
        sql`${auditLogEntry.eventType}::text = ${eventType}`,
      ),
    )
    .orderBy(auditLogEntry.occurredAt, auditLogEntry.id);
}

/** Every ledger row of a tenant, oldest first, read raw on the admin path. */
export function ledgerOf(pools: Pools, tenantId: string) {
  return pools.admin.db
    .select()
    .from(catalogRateEntry)
    .where(eq(catalogRateEntry.tenantId, tenantId))
    .orderBy(catalogRateEntry.sequence);
}

/** A person's act now — or on a given instant, to stand on another day of the tenant's clock. */
export const actBy = (userId: string, now: number = Date.now()): Act => ({
  actorUserId: userId,
  now,
});

/** The presets by name, read from the permission model rather than typed. */
export const preset = rolePresetSchema.enum;

/** No retry key: a send from an app that has not updated. */
export const noKey = {};

export const ids = (items: readonly Pick<CatalogItemWire, 'id'>[]) => items.map((item) => item.id);
