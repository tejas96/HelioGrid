import type { PriceBookPublish, PriceBookRateWire } from '@heliogrid/contracts';
import { priceBookRate, priceBookVersion } from '@heliogrid/db';
import { asc, eq } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { CreationReplies } from '../../src/common/creation-key';
import { CatalogPriceBookRepository } from '../../src/modules/catalog/catalog.price-book.repository';
import { CatalogPriceBookService } from '../../src/modules/catalog/catalog.price-book.service';
import { catalogServiceOf } from '../catalog/support';
import type { openPools } from '../support/fixture';

export { actBy, entriesOf, noKey, preset, publishIndiaPack } from '../catalog/support';

type Pools = ReturnType<typeof openPools>;

/** The price-book service as `catalog.module.ts` composes it, over the real repositories. */
export function priceBookServiceOf(pools: Pools): CatalogPriceBookService {
  return new CatalogPriceBookService(
    new CatalogPriceBookRepository(pools.tenants),
    catalogServiceOf(pools),
    new CreationReplies(new PinoLogger({ pinoHttp: { level: 'silent' } })),
  );
}

/** One rate the contract accepts, per kW. */
export const aRate = (overrides: Partial<PriceBookRateWire> = {}): PriceBookRateWire => ({
  name: { en: 'Standard installation, above 10 kW' },
  basis: 'per_kw',
  amount: '1450',
  ...overrides,
});

/** A publish body the contract accepts: two rates of two bases, and the note that says why. */
export const aRateSet = (overrides: Partial<PriceBookPublish> = {}): PriceBookPublish => ({
  note: 'Installation above 10 kW moved to a per-kW rate.',
  defaultMarginPct: '18.00',
  rates: [
    aRate(),
    aRate({ name: { en: 'DISCOM liaison and net metering' }, basis: 'per_job', amount: '9000' }),
  ],
  ...overrides,
});

/** Every row of one version — its head and its rates — read raw on the admin path. */
export async function storedVersion(pools: Pools, versionId: string) {
  const db = pools.admin.db;
  const [head] = await db.select().from(priceBookVersion).where(eq(priceBookVersion.id, versionId));
  const rates = await db
    .select()
    .from(priceBookRate)
    .where(eq(priceBookRate.priceBookVersionId, versionId))
    .orderBy(asc(priceBookRate.position));
  return { head, rates };
}

/** How many versions a tenant holds, counted raw on the admin path. */
export async function versionCount(pools: Pools, tenantId: string): Promise<number> {
  const rows = await pools.admin.db
    .select({ id: priceBookVersion.id })
    .from(priceBookVersion)
    .where(eq(priceBookVersion.tenantId, tenantId));
  return rows.length;
}
