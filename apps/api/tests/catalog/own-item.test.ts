import type { CatalogItemWire, SessionProjection } from '@heliogrid/contracts';
import { catalogRateEntry, tenantCatalogItem } from '@heliogrid/db';
import { HttpStatus } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { openPools } from '../support/fixture';
import { bootHttp, type Http, skipWithoutHarness } from '../support/http';
import {
  aPanelSpec,
  aPlatformItem,
  aRunTag,
  entriesOf,
  publishIndiaPack,
  removePlatformItems,
} from './support';

/**
 * An own SKU from the single form, on the wire (`M01-36`, `M01-39`, `M01-42`; AC-2, AC-7, AC-10):
 * a spec failing its kind's gate is 400 at the field with nothing written; a claim the market
 * does not hold is 422 at its path; a body pre-filled from a platform item carries only what it
 * names; archive and unarchive keep the row and every rate entry; each act records one entry.
 */

const skip = skipWithoutHarness(
  'OWN-SKU WIRE PROOF',
  'The own-SKU create, its refusals and its archive are UNPROVEN on the wire in this run.',
);

const ITEMS = '/catalog/items';
const form = (model: string, overrides: Record<string, unknown> = {}) => ({
  brand: 'Own Panels',
  model,
  spec: aPanelSpec(),
  certifications: [],
  preferred: false,
  ...overrides,
});

describe.skipIf(skip)('an own SKU, over HTTP', () => {
  let pools: ReturnType<typeof openPools>;
  let http: Http;
  let here: SessionProjection;
  let tenantId: string;
  let listed: string;
  const run = aRunTag();

  const create = (body: unknown) => http.call<CatalogItemWire>('POST', ITEMS, body);
  const skusNamed = async (model: string) =>
    (
      await pools.admin.db
        .select({ model: tenantCatalogItem.model })
        .from(tenantCatalogItem)
        .where(eq(tenantCatalogItem.tenantId, tenantId))
    ).filter((row) => row.model === model).length;

  beforeAll(async () => {
    pools = openPools();
    await publishIndiaPack(pools);
    http = await bootHttp();
    await http.signIn();
    here = await http.createCompany('Own SKU EPC');
    tenantId = here.membership?.tenantId ?? '';
    listed = await aPlatformItem(pools, {
      model: `${run} Listed`,
      markets: ['IN'],
      certifications: [{ scheme: 'DCR', reference: null }],
    });
  });

  // The company stays standing: every HTTP suite shares one development number (apps/api/CLAUDE.md).
  afterAll(async () => {
    await http.close();
    await removePlatformItems(pools, [listed]);
    await pools.close();
  });

  it('a gate failure answers the field path and writes nothing', async () => {
    const model = `${run} Voc below Vmp`;
    const reply = await create(form(model, { spec: aPanelSpec({ vocV: 40, vmpV: 41.8 }) }));
    expect(reply.status).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({
      error: {
        code: 'VALIDATION_FAILED',
        details: [expect.objectContaining({ path: 'spec.vocV' })],
      },
    });
    expect(await skusNamed(model)).toBe(0);
  });

  it.each([
    [
      'an undeclared scheme is refused at its path',
      { scheme: 'BIS', reference: null },
      'certifications.0.scheme',
    ],
    [
      'an ALMM claim with no list reference is refused at its reference',
      { scheme: 'ALMM', reference: null },
      'certifications.0.reference',
    ],
    [
      'a DCR flag carrying a reference is refused at its reference',
      { scheme: 'DCR', reference: 'X-1' },
      'certifications.0.reference',
    ],
  ])('%s', async (_, claim, path) => {
    const model = `${run} ${claim.scheme} ${path}`;
    const reply = await create(form(model, { certifications: [claim] }));
    expect(reply.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(reply.body).toMatchObject({
      error: { code: 'DOMAIN_RULE_VIOLATION', details: [expect.objectContaining({ path })] },
    });
    expect(await skusNamed(model)).toBe(0);
  });

  it('a pre-filled body copies no certification and no rate', async () => {
    const picked = await http.call<CatalogItemWire>('GET', `${ITEMS}/${listed}`);
    expect(picked.body.certifications).toEqual([{ scheme: 'DCR', reference: null }]);
    const { brand, model, spec } = picked.body;
    const made = await create({ brand, model, spec, certifications: [], preferred: false });
    expect(made.status).toBe(HttpStatus.CREATED);
    expect(made.body).toMatchObject({
      source: 'own_item',
      provenance: 'tenant_provided',
      certifications: [],
      badges: [],
      rate: null,
    });
  });

  it('archive and unarchive keep the row and every rate entry, and record each act once', async () => {
    const made = await create(form(`${run} Archived`, { rate: { amount: '12000' } }));
    const id = made.body.id;
    const ledger = () =>
      pools.admin.db
        .select()
        .from(catalogRateEntry)
        .where(eq(catalogRateEntry.tenantCatalogItemId, id));
    const before = await ledger();
    const archived = await http.call<CatalogItemWire>('POST', `${ITEMS}/${id}/archive`);
    expect([archived.status, archived.body.archived, archived.body.openDraftCount]).toEqual([
      HttpStatus.OK,
      true,
      0,
    ]);
    expect(archived.body.rate?.amount).toBe('12000.00');
    const back = await http.call<CatalogItemWire>('POST', `${ITEMS}/${id}/unarchive`);
    expect(back.body.archived).toBe(false);
    expect(await ledger()).toEqual(before);
    for (const event of [
      'catalog.item_created',
      'catalog.item_archived',
      'catalog.item_unarchived',
    ]) {
      expect(await entriesOf(pools, tenantId, event, id)).toHaveLength(1);
    }
  });

  it('an edit replaces the form and records it; another kind is refused at spec.kind', async () => {
    const made = await create(form(`${run} Edited`));
    const id = made.body.id;
    const saved = await http.call<CatalogItemWire>(
      'PUT',
      `${ITEMS}/${id}`,
      form(`${run} Edited`, { preferred: true }),
    );
    expect([saved.status, saved.body.preferred]).toEqual([HttpStatus.OK, true]);
    expect(await entriesOf(pools, tenantId, 'catalog.item_changed', id)).toHaveLength(1);
    const battery = {
      kind: 'battery',
      usableKwh: 5.12,
      nominalV: 51.2,
      chemistry: 'lfp',
      powerKw: 2.5,
      cycleLife: 6000,
      widthMm: 480,
      depthMm: 250,
      heightMm: 620,
      weightKg: 48,
      warrantyYears: 10,
    };
    const refused = await http.call(
      'PUT',
      `${ITEMS}/${id}`,
      form(`${run} Edited`, { spec: battery }),
    );
    expect(refused.status).toBe(HttpStatus.BAD_REQUEST);
    expect(refused.body).toMatchObject({
      error: { details: [expect.objectContaining({ path: 'spec.kind' })] },
    });
  });

  it('a platform item is read-only to every own-SKU write', async () => {
    const replies = await Promise.all([
      http.call('PUT', `${ITEMS}/${listed}`, form(`${run} Listed`)),
      http.call('POST', `${ITEMS}/${listed}/archive`),
    ]);
    expect(replies.map((reply) => reply.status)).toEqual([
      HttpStatus.CONFLICT,
      HttpStatus.CONFLICT,
    ]);
  });
});
