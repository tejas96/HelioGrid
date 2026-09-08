import { describe, expect, it } from 'vitest';
import { envelopeOf, type PackEnvelope } from '../../src/market/envelope';
import { IN_PACK } from '../../src/market/pack';
import { type PackPin, stalePinnedKeys } from '../../src/market/staleness';

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

const design: PackPin = { version: IN_PACK.version, keysRead: ['formats', 'tax'] };

describe('stalePinnedKeys — staleness is per key read (F8-13, F8-14, F1-11)', () => {
  it('keeps a design fresh across a revision that only repriced the book', () => {
    const repriced = revisedAt('priceBook', { priceProtectionMonths: 36 });
    expect(stalePinnedKeys(design, REVISION_1, repriced)).toEqual([]);
  });

  it('names tax when the tax key the design read changed', () => {
    const retaxed = revisedAt('tax', { recordRetentionYears: 8 });
    expect(stalePinnedKeys(design, REVISION_1, retaxed)).toEqual(['tax']);
  });

  it('reports in PRD order however the pin listed its keys', () => {
    const both: PackEnvelope = {
      ...revisedAt('tax', { recordRetentionYears: 8 }),
      pack: {
        ...revisedAt('tax', { recordRetentionYears: 8 }).pack,
        formats: { ...(REVISION_1.pack.formats as object), clock: '12h' },
      },
    };
    const pin: PackPin = { version: IN_PACK.version, keysRead: ['formats', 'tax'] };
    expect(stalePinnedKeys(pin, REVISION_1, both)).toEqual(['tax', 'formats']);
  });

  it('is fresh against its own revision, and against a pin that read nothing', () => {
    expect(stalePinnedKeys(design, REVISION_1, REVISION_1)).toEqual([]);
    const readNothing: PackPin = { version: IN_PACK.version, keysRead: [] };
    expect(stalePinnedKeys(readNothing, REVISION_1, revisedAt('tax', { scheme: 'VAT' }))).toEqual(
      [],
    );
  });

  it('counts a key authored since the pin as changed — absent then, present now', () => {
    const withRights: PackEnvelope = {
      ...REVISION_1,
      revision: 2,
      pack: { ...REVISION_1.pack, dataRights: { residency: 'IN' } },
    };
    const readRights: PackPin = { version: IN_PACK.version, keysRead: ['dataRights'] };
    expect(stalePinnedKeys(readRights, REVISION_1, withRights)).toEqual(['dataRights']);
    expect(stalePinnedKeys(readRights, REVISION_1, REVISION_1)).toEqual([]);
  });

  it('never touches the pinned pack’s own values', () => {
    const before = JSON.stringify(REVISION_1);
    stalePinnedKeys(design, REVISION_1, revisedAt('tax', { recordRetentionYears: 8 }));
    expect(JSON.stringify(REVISION_1)).toBe(before);
  });
});
