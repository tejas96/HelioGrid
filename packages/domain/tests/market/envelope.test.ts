import { describe, expect, it } from 'vitest';
import {
  envelopeOf,
  nextEnvelope,
  type PackEnvelope,
  packFromEnvelope,
} from '../../src/market/envelope';
import { PACK_KEYS } from '../../src/market/keys';
import { unauthoredKeys } from '../../src/market/launch';
import { IN_PACK } from '../../src/market/pack';
import { tenantReadablePayload } from '../../src/market/payload';

const PUBLISHED_AT = '2026-09-08T09:00:00.000Z';

/** What comes back from a `jsonb` column: the same data, every object's keys in another order. */
function asStored(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(asStored);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .reverse()
        .map(([key, held]) => [key, asStored(held)]),
    );
  }
  return value;
}

/** A round trip through the store: serialised, reordered, parsed. */
function stored(envelope: PackEnvelope): PackEnvelope {
  return {
    ...envelope,
    pack: asStored(JSON.parse(JSON.stringify(envelope.pack))) as PackEnvelope['pack'],
  };
}

describe('envelopeOf — a pack as a row holds it (F1-11, F1-05)', () => {
  const envelope = envelopeOf(IN_PACK, PUBLISHED_AT);

  it('carries the market, the revision the pack names, and the instant it was given', () => {
    expect(envelope.market).toBe('IN');
    expect(envelope.revision).toBe(1);
    expect(envelope.publishedAt).toBe(PUBLISHED_AT);
  });

  it('OMITS the unauthored key rather than storing a null for it', () => {
    expect(Object.hasOwn(envelope.pack, 'dataRights')).toBe(false);
    expect(Object.keys(envelope.pack)).toEqual(
      PACK_KEYS.filter((key) => !unauthoredKeys(IN_PACK).includes(key)),
    );
  });

  it('holds nothing but pack keys — the market and the version are row columns, not payload', () => {
    const foreign = Object.keys(envelope.pack).filter((key) => !PACK_KEYS.some((k) => k === key));
    expect(foreign).toEqual([]);
  });
});

describe('packFromEnvelope — the envelope check, then the brands re-minted (F1-05, F1-11)', () => {
  const envelope = envelopeOf(IN_PACK, PUBLISHED_AT);

  it('reports the same unauthored keys for a stored pack as for the literal', () => {
    expect(unauthoredKeys(packFromEnvelope(stored(envelope)))).toEqual(unauthoredKeys(IN_PACK));
  });

  it('gives the India pack back whole after the store reorders and re-parses it', () => {
    expect(packFromEnvelope(stored(envelope))).toEqual(IN_PACK);
  });

  it('re-mints the version from the row, so revision 3 reads IN.3 whatever the literal said', () => {
    expect(packFromEnvelope({ ...envelope, revision: 3 }).version).toBe('IN.3');
  });

  it('refuses a top-level property that is not a pack key, naming it', () => {
    const withStranger = { ...envelope, pack: { ...envelope.pack, demoProject: {} } };
    expect(() => packFromEnvelope(withStranger)).toThrow(/demoProject/);
  });

  it('refuses a market nobody authored', () => {
    expect(() => packFromEnvelope({ ...envelope, market: 'XX' })).toThrow(RangeError);
  });

  it('refuses revision 0 through the version constructor itself', () => {
    expect(() => packFromEnvelope({ ...envelope, revision: 0 })).toThrow(RangeError);
  });
});

describe('nextEnvelope — what a publish writes (F1-11)', () => {
  const seed = envelopeOf(IN_PACK, '2026-09-01T00:00:00.000Z');

  it('seeds revision 1 for a market with no version', () => {
    expect(nextEnvelope(IN_PACK, null, PUBLISHED_AT)).toEqual({
      ...seed,
      publishedAt: PUBLISHED_AT,
    });
  });

  it('writes nothing when the literal matches the stored row, whatever order jsonb kept', () => {
    expect(nextEnvelope(IN_PACK, stored(seed), PUBLISHED_AT)).toBeNull();
  });

  it('takes the next revision when a key changed — a tax fact edited in the literal', () => {
    const edited = { ...IN_PACK, tax: { ...IN_PACK.tax, recordRetentionYears: 8 } };
    const next = nextEnvelope(edited, stored({ ...seed, revision: 4 }), PUBLISHED_AT);
    expect(next?.revision).toBe(5);
    expect(next?.publishedAt).toBe(PUBLISHED_AT);
    expect(next?.pack.tax).toEqual(edited.tax);
  });

  it('numbers from the store, not from the literal — a literal saying IN.1 still becomes 2', () => {
    const edited = { ...IN_PACK, tax: { ...IN_PACK.tax, recordRetentionYears: 8 } };
    expect(nextEnvelope(edited, seed, PUBLISHED_AT)?.revision).toBe(2);
  });

  it('refuses to revise another market’s row', () => {
    expect(() => nextEnvelope(IN_PACK, { ...seed, market: 'XX' }, PUBLISHED_AT)).toThrow(
      RangeError,
    );
  });
});

describe('tenantReadablePayload — what a tenant read serves (F1-25, BM-17)', () => {
  const payload = envelopeOf(IN_PACK, PUBLISHED_AT).pack;

  it('serves every authored key but the book', () => {
    const served = tenantReadablePayload(payload);
    expect(Object.hasOwn(served, 'priceBook')).toBe(false);
    expect(Object.keys(served)).toEqual([
      'tax',
      'subsidy',
      'callingRules',
      'paymentRails',
      'certificationSchemes',
      'formats',
    ]);
  });

  it('leaves an unauthored key absent rather than serving it as null', () => {
    expect(Object.hasOwn(tenantReadablePayload(payload), 'dataRights')).toBe(false);
  });
});
