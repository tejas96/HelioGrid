import {
  catalogItem,
  catalogItemCertification,
  catalogItemMarketAvailability,
} from '@heliogrid/db';
import { parseCatalogSpec } from '@heliogrid/domain';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IN_PLATFORM_ITEMS } from '../../src/modules/catalog/catalog.public';
import { openPools, skipWithoutDatabase } from '../support/fixture';
import { publishIndiaPack } from '../support/market';
import { catalogPlatformServiceOf } from './support';

/**
 * The first India list and the publish that lands it (`T-M01-027` AC-5): every POC panel, inverter
 * and battery parses through its kind's gates, carries `representative`, is available in `IN`
 * alone, holds its DCR row and never a price; the publish writes it once and then nothing, writes
 * a changed spec once, and refuses a claim the market does not hold.
 */

interface SeedEntry {
  readonly brand: string;
  readonly model: string;
  readonly spec: { readonly kind: string };
  readonly provenance: string;
  readonly markets: readonly string[];
  readonly certifications: readonly {
    readonly scheme: string;
    readonly reference: string | null;
  }[];
}

const SEED = IN_PLATFORM_ITEMS as readonly SeedEntry[];
/** The POC's three data files, as counted there (`panels.ts`, `inverters.ts`, `batteries.ts`). */
const POC_PANELS = 15;
const POC_INVERTERS = 12;
const POC_BATTERIES = 5;
const WAAREE = SEED.find(
  (entry) => entry.brand === 'Waaree' && entry.model === 'Bi-55-550 Bifacial',
);
if (WAAREE === undefined) throw new Error('the seed lost the Waaree 550');

describe('the India platform list, as authored', () => {
  it('holds the POC panels, inverters and batteries', () => {
    const kinds = SEED.map((entry) => entry.spec.kind);
    expect(kinds.filter((kind) => kind === 'panel')).toHaveLength(POC_PANELS);
    expect(kinds.filter((kind) => kind === 'inverter')).toHaveLength(POC_INVERTERS);
    expect(kinds.filter((kind) => kind === 'battery')).toHaveLength(POC_BATTERIES);
  });

  it.each(SEED.map((entry) => [`${entry.brand} ${entry.model}`, entry] as const))(
    "every seeded item parses through its kind's gates (%s)",
    (_name, entry) => {
      const parsed = parseCatalogSpec(entry.spec);
      expect(parsed).toEqual({
        ok: true,
        spec: expect.objectContaining({ kind: entry.spec.kind }),
      });
    },
  );

  it("no seeded item carries a price or an own-SKU label, and every one is India's", () => {
    expect(JSON.stringify(SEED).toLowerCase()).not.toContain('price');
    expect(new Set(SEED.map((entry) => entry.provenance))).toEqual(new Set(['representative']));
    expect(new Set(SEED.map((entry) => entry.markets.join(',')))).toEqual(new Set(['IN']));
  });

  it('a DCR row is a flag with no reference, and no ALMM row is claimed without its list entry', () => {
    const claims = SEED.flatMap((entry) => entry.certifications);
    expect(claims.length).toBeGreaterThan(0);
    expect(new Set(claims.map((claim) => `${claim.scheme}:${claim.reference}`))).toEqual(
      new Set(['DCR:null']),
    );
  });
});

const skip = skipWithoutDatabase(
  'PLATFORM PUBLISH PROOF',
  'The platform publish is UNPROVEN in this run — only the list it publishes is.',
);

describe.skipIf(skip)('the platform publish, against a migrated database', () => {
  let pools: ReturnType<typeof openPools>;
  let publish: ReturnType<typeof catalogPlatformServiceOf>;

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
    publish = catalogPlatformServiceOf(pools);
  });

  afterAll(async () => {
    await pools.close();
  });

  const waareeRow = async () => {
    const [row] = await pools.admin.db
      .select({
        id: catalogItem.id,
        spec: catalogItem.spec,
        provenance: catalogItem.provenanceLabel,
        availability: catalogItem.availability,
        archived: catalogItem.archived,
      })
      .from(catalogItem)
      .where(and(eq(catalogItem.brand, WAAREE.brand), eq(catalogItem.model, WAAREE.model)))
      .limit(1);
    if (!row) throw new Error('the Waaree 550 was not published');
    return row;
  };

  it('publishes the list once, and the second publish writes nothing', async () => {
    await publish.publish(IN_PLATFORM_ITEMS, Date.now());
    const again = await publish.publish(IN_PLATFORM_ITEMS, Date.now());
    expect(again).toEqual({ items: 0, availabilities: 0, certifications: 0 });
    const row = await waareeRow();
    expect(row.spec).toEqual(WAAREE.spec);
    expect(row.provenance).toBe('representative');
    expect(row.archived).toBe(false);
    const markets = await pools.admin.db
      .select({ marketCode: catalogItemMarketAvailability.marketCode })
      .from(catalogItemMarketAvailability)
      .where(eq(catalogItemMarketAvailability.catalogItemId, row.id));
    expect(markets.map((market) => market.marketCode)).toEqual(['IN']);
    const held = await pools.admin.db
      .select({
        scheme: catalogItemCertification.schemeKey,
        reference: catalogItemCertification.reference,
      })
      .from(catalogItemCertification)
      .where(eq(catalogItemCertification.catalogItemId, row.id));
    expect(held).toEqual([{ scheme: 'DCR', reference: null }]);
  });

  it('writes a changed spec once, and the list restored once, then nothing', async () => {
    const changed = { ...WAAREE, spec: { ...WAAREE.spec, watt: 551 } };
    expect((await publish.publish([changed], Date.now())).items).toBe(1);
    expect((await waareeRow()).spec).toEqual(changed.spec);
    expect((await publish.publish([WAAREE], Date.now())).items).toBe(1);
    expect((await publish.publish([WAAREE], Date.now())).items).toBe(0);
    expect((await waareeRow()).spec).toEqual(WAAREE.spec);
  });

  it.each([
    [
      'a scheme the market does not declare',
      [{ scheme: 'UL', reference: null }],
      /UL is undeclared/,
    ],
    [
      'an ALMM claim with no list reference',
      [{ scheme: 'ALMM', reference: null }],
      /ALMM is reference_missing/,
    ],
  ])('refuses %s and writes nothing', async (_what, certifications, message) => {
    const refused = { ...WAAREE, model: 'Bi-55-550 Refused', certifications };
    await expect(publish.publish([refused], Date.now())).rejects.toThrow(message);
    const rows = await pools.admin.db
      .select({ id: catalogItem.id })
      .from(catalogItem)
      .where(and(eq(catalogItem.brand, refused.brand), eq(catalogItem.model, refused.model)));
    expect(rows).toEqual([]);
  });

  it('refuses a spec that fails its gate, at the field that failed', async () => {
    const gated = { ...WAAREE, model: 'Gated', spec: { ...WAAREE.spec, vocV: 40, vmpV: 41.9 } };
    await expect(publish.publish([gated], Date.now())).rejects.toThrow(/spec\.vocV/);
  });
});
