import { describe, expect, it } from 'vitest';
import {
  type CurrentInputs,
  type Freshness,
  freshnessOf,
  type InputPins,
  issueBlockedBy,
  UNCHECKED,
} from '../../src/format/freshness';
import { envelopeOf, type PackEnvelope } from '../../src/market/envelope';
import { IN_PACK } from '../../src/market/pack';

/**
 * `F8-13` and `F8-14` — an output records what it was computed from, and whether it is current is
 * decided by comparing that record with what is current now, never by a flag. `F8-17` — a
 * recompute in flight holds the output provisional and blocks issue for the whole window.
 */

const REVISION_1 = envelopeOf(IN_PACK, '2026-09-01T00:00:00.000Z');

/** Revision 2 with one key's interior changed, as a later publish would leave it. */
function revisedAt(key: keyof PackEnvelope['pack'], change: object): PackEnvelope {
  return {
    ...REVISION_1,
    revision: 2,
    publishedAt: '2026-09-08T00:00:00.000Z',
    pack: { ...REVISION_1.pack, [key]: { ...(REVISION_1.pack[key] as object), ...change } },
  };
}

const PINS: InputPins = {
  design: 'fp-7a1c',
  catalogRelease: 'r2026-08',
  tenantPriceBook: 3,
  marketPack: { version: IN_PACK.version, keysRead: ['tax', 'formats'] },
  engines: { shading: '2.1.0', bom: '1.4.0' },
};

const NOW: CurrentInputs = {
  design: 'fp-7a1c',
  catalogRelease: 'r2026-08',
  tenantPriceBook: 3,
  pinnedPack: REVISION_1,
  currentPack: REVISION_1,
  engines: { shading: '2.1.0', bom: '1.4.0' },
  recomputeInFlight: false,
};

describe('freshnessOf — staleness is a comparison (F8-13)', () => {
  it('an output whose pins all match is current', () => {
    expect(freshnessOf(PINS, NOW).kind).toBe('current');
  });

  it.each([
    { input: 'design', now: { ...NOW, design: 'fp-90e2' } },
    { input: 'catalogRelease', now: { ...NOW, catalogRelease: 'r2026-09' } },
    { input: 'tenantPriceBook', now: { ...NOW, tenantPriceBook: 4 } },
    { input: 'marketPack', now: { ...NOW, currentPack: revisedAt('tax', { scheme: 'VAT' }) } },
    { input: 'engines', now: { ...NOW, engines: { shading: '2.2.0', bom: '1.4.0' } } },
  ] as const)('each pinned input stales the output on its own (F8-14)', ({ input, now }) => {
    const freshness = freshnessOf(PINS, now);
    expect(freshness.kind).toBe('stale');
    expect(freshness.kind === 'stale' && freshness.moved).toEqual([input]);
  });

  it('a pack revision to a key the output never read leaves it current (F8-13)', () => {
    const repriced = revisedAt('priceBook', { priceProtectionMonths: 36 });
    expect(freshnessOf(PINS, { ...NOW, currentPack: repriced }).kind).toBe('current');
  });

  it('compares a price-book version of zero like any other', () => {
    expect(freshnessOf({ tenantPriceBook: 0 }, { ...NOW, tenantPriceBook: 0 }).kind).toBe(
      'current',
    );
    const moved = freshnessOf({ tenantPriceBook: 0 }, { ...NOW, tenantPriceBook: 1 });
    expect(moved.kind === 'stale' && moved.moved).toEqual(['tenantPriceBook']);
  });

  it('only the engines an output pinned are compared', () => {
    const added = { ...NOW, engines: { shading: '2.1.0', bom: '1.4.0', yield: '1.0.0' } };
    expect(freshnessOf(PINS, added).kind).toBe('current');
    const retired = freshnessOf(PINS, { ...NOW, engines: { shading: '2.1.0' } });
    expect(retired.kind === 'stale' && retired.moved).toEqual(['engines']);
    const noneNow = freshnessOf(PINS, { ...NOW, engines: {} });
    expect(noneNow.kind === 'stale' && noneNow.moved).toEqual(['engines']);
  });

  /* LITERAL lists: reordering either tuple turns this red rather than moving with it. */
  it('names every input and pack key that moved, once, in order', () => {
    const retaxedAndReformatted: PackEnvelope = {
      ...revisedAt('tax', { scheme: 'VAT' }),
      pack: {
        ...revisedAt('tax', { scheme: 'VAT' }).pack,
        formats: { ...(REVISION_1.pack.formats as object), clock: '12h' },
      },
    };
    const freshness = freshnessOf(PINS, {
      ...NOW,
      engines: { shading: '9.0.0', bom: '9.0.0' },
      currentPack: retaxedAndReformatted,
      tenantPriceBook: 5,
      design: 'fp-90e2',
    });
    expect(freshness).toMatchObject({
      kind: 'stale',
      moved: ['design', 'tenantPriceBook', 'marketPack', 'engines'],
      movedPackKeys: ['tax', 'formats'],
    });
  });

  it('carries no pack keys when the pack did not move', () => {
    const freshness = freshnessOf(PINS, { ...NOW, tenantPriceBook: 4 });
    expect(freshness).toMatchObject({ kind: 'stale', movedPackKeys: [] });
  });
});

describe('a comparison that could not be made is never current (F8-13, F8-14)', () => {
  it('a comparison against the wrong pack is unchecked (F8-13)', () => {
    const laterEnvelope = { ...NOW, pinnedPack: revisedAt('tax', { scheme: 'VAT' }) };
    expect(freshnessOf(PINS, laterEnvelope).kind).toBe('unchecked');
    const otherMarket = { ...NOW, currentPack: { ...REVISION_1, market: 'KE' } };
    expect(freshnessOf(PINS, otherMarket).kind).toBe('unchecked');
    const pinnedOtherMarket = { ...NOW, pinnedPack: { ...REVISION_1, market: 'KE' } };
    expect(freshnessOf(PINS, pinnedOtherMarket).kind).toBe('unchecked');
    const KENYA = { ...REVISION_1, market: 'KE' };
    const bothOtherMarket = { ...NOW, pinnedPack: KENYA, currentPack: KENYA };
    expect(freshnessOf(PINS, bothOtherMarket).kind).toBe('unchecked');
  });

  it.each([
    { pins: {} },
    { pins: { engines: {} } },
    { pins: { marketPack: { version: IN_PACK.version, keysRead: [] } } },
    { pins: { design: null, catalogRelease: null, tenantPriceBook: null, engines: null } },
    { pins: { design: '', marketPack: null } },
  ] as const)(
    'an output that pinned nothing, or was not compared, is never current (F8-14)',
    ({ pins }) => {
      expect(freshnessOf(pins, NOW).kind).toBe('unchecked');
    },
  );

  it.each([
    { absent: 'design' },
    { absent: 'catalogRelease' },
    { absent: 'tenantPriceBook' },
    { absent: 'pinnedPack' },
    { absent: 'currentPack' },
    { absent: 'engines' },
  ] as const)(
    'an output that pinned nothing, or was not compared, is never current (F8-14)',
    ({ absent }) => {
      const { [absent]: _dropped, ...now } = NOW;
      expect(freshnessOf(PINS, now).kind).toBe('unchecked');
    },
  );

  it.each([
    { stored: { design: null } },
    { stored: { catalogRelease: '' } },
    { stored: { tenantPriceBook: null } },
    { stored: { pinnedPack: null } },
    { stored: { engines: null } },
  ] as const)(
    'an output that pinned nothing, or was not compared, is never current (F8-14)',
    ({ stored }) => {
      expect(freshnessOf(PINS, { ...NOW, ...stored }).kind).toBe('unchecked');
    },
  );

  it('a pin set stored before an input class existed is compared on what it pinned', () => {
    const { design: _none, ...beforeDesigns } = PINS;
    expect(freshnessOf(beforeDesigns, { ...NOW, design: 'fp-90e2' }).kind).toBe('current');
    const readNoPackKey = {
      tenantPriceBook: 3,
      marketPack: { version: IN_PACK.version, keysRead: [] },
      engines: {},
    };
    expect(freshnessOf(readNoPackKey, { tenantPriceBook: 3, recomputeInFlight: false }).kind).toBe(
      'current',
    );
    const storedBeforeDesigns = { design: null, tenantPriceBook: 3 };
    expect(freshnessOf(storedBeforeDesigns, { ...NOW, design: 'fp-90e2' }).kind).toBe('current');
  });
});

describe('a recompute in flight (F8-17)', () => {
  it('a recompute in flight is recomputing however the pins compare (F8-17)', () => {
    expect(freshnessOf(PINS, { ...NOW, recomputeInFlight: true }).kind).toBe('recomputing');
    const moved = { ...NOW, tenantPriceBook: 4, recomputeInFlight: true };
    expect(freshnessOf(PINS, moved).kind).toBe('recomputing');
    expect(freshnessOf({}, { recomputeInFlight: true }).kind).toBe('recomputing');
  });

  it('issue is blocked unless the output is current (F8-17)', () => {
    expect(issueBlockedBy(freshnessOf(PINS, NOW))).toBeNull();
    expect(issueBlockedBy(freshnessOf(PINS, { ...NOW, tenantPriceBook: 4 }))).toBe('stale');
    expect(issueBlockedBy(freshnessOf(PINS, { ...NOW, recomputeInFlight: true }))).toBe(
      'recomputing',
    );
    expect(issueBlockedBy(UNCHECKED)).toBe('unchecked');
  });
});

describe('only the comparison can say current (F8-13)', () => {
  it('only the comparison can say current', () => {
    // @ts-expect-error — a literal is not a `Freshness`: nothing but `freshnessOf` mints `current`.
    const forged: Freshness = { kind: 'current' };
    expect(forged.kind).toBe('current');
  });

  it('never touches the pins or the envelopes it compares', () => {
    const before = JSON.stringify([PINS, NOW]);
    freshnessOf(PINS, { ...NOW, currentPack: revisedAt('tax', { scheme: 'VAT' }) });
    expect(JSON.stringify([PINS, NOW])).toBe(before);
  });
});
