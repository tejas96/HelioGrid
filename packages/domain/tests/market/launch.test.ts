import { describe, expect, it } from 'vitest';
import type { PackKey } from '../../src/market/keys';
import { isLaunchable, unauthoredKeys } from '../../src/market/launch';
import { IN_PACK, type MarketPack } from '../../src/market/pack';

/** The keys the pack type has not landed. Each key task removes its own name from this set. */
type PendingKey = Exclude<PackKey, keyof MarketPack>;

const PENDING: readonly PendingKey[] = ['certificationSchemes', 'dataRights', 'priceBook'];

/** The India pack with the given keys present. The gate reads presence, so content is moot. */
function packWith(pending: readonly PendingKey[]): MarketPack {
  const sections: Partial<Record<PendingKey, object>> = {};
  for (const key of pending) sections[key] = {};
  return { ...IN_PACK, ...sections };
}

describe('unauthoredKeys — which of the eight keys a pack has not authored (F1-02, F1-05)', () => {
  it('reports nothing once every key is present', () => {
    expect(unauthoredKeys(packWith(PENDING))).toEqual([]);
  });

  it('names the one key that is missing', () => {
    expect(
      unauthoredKeys(packWith(PENDING.filter((key) => key !== 'certificationSchemes'))),
    ).toEqual(['certificationSchemes']);
  });

  it('lists the missing keys in PRD order, whatever order they were authored in', () => {
    const missingSchemesAndBook = PENDING.filter(
      (key) => key !== 'priceBook' && key !== 'certificationSchemes',
    );
    expect(unauthoredKeys(packWith(missingSchemesAndBook))).toEqual([
      'certificationSchemes',
      'priceBook',
    ]);
  });
});

describe('isLaunchable — the new-market gate (F1-05)', () => {
  it('opens only when no key is unauthored', () => {
    expect(isLaunchable(packWith(PENDING))).toBe(true);
    expect(isLaunchable(packWith(PENDING.filter((key) => key !== 'dataRights')))).toBe(false);
  });
});
