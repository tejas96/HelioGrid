import { describe, expect, it } from 'vitest';
import { PACK_KEYS, type PackKey } from '../../src/market/keys';
import { isLaunchable, unauthoredKeys } from '../../src/market/launch';
import { IN_PACK, type MarketPack } from '../../src/market/pack';

/** The keys the pack type has not landed. Each key task removes its own name from this set. */
type PendingKey = Exclude<PackKey, keyof MarketPack>;

const PENDING: readonly PendingKey[] = ['dataRights'];

/** The India pack with the given keys present. The gate reads presence, so content is moot. */
function packWith(pending: readonly PendingKey[]): MarketPack {
  const sections: Partial<Record<PendingKey, object>> = {};
  for (const key of pending) sections[key] = {};
  return { ...IN_PACK, ...sections };
}

/** The India pack with authored keys taken back off, which is what a STORED pack can lose. */
function packWithout(dropped: readonly PackKey[]): MarketPack {
  const pack: Record<string, unknown> = { ...packWith(PENDING) };
  for (const key of dropped) delete pack[key];
  return pack as unknown as MarketPack;
}

describe('unauthoredKeys — which of the eight keys a pack has not authored (F1-02, F1-05)', () => {
  it('reports nothing once every key is present', () => {
    expect(unauthoredKeys(packWith(PENDING))).toEqual([]);
  });

  it('names the one key India still owes — dataRights, parked by Q89', () => {
    expect(unauthoredKeys(IN_PACK)).toEqual(['dataRights']);
  });

  it('lists the missing keys in PRD order, whatever order they went missing in', () => {
    expect(unauthoredKeys(packWithout(['formats', 'tax']))).toEqual(['tax', 'formats']);
    expect(unauthoredKeys(packWithout(['tax', 'formats']))).toEqual(['tax', 'formats']);
  });

  it('reads presence off the object, so a stored pack that lost a key is reported', () => {
    expect(unauthoredKeys(packWithout(['priceBook']))).toEqual(['priceBook']);
  });
});

describe('isLaunchable — the new-market gate (F1-05)', () => {
  it('opens only when no key is unauthored', () => {
    expect(isLaunchable(packWith(PENDING))).toBe(true);
    expect(isLaunchable(packWithout(['subsidy']))).toBe(false);
  });

  it('keeps India shut while dataRights is parked (Q89), the accepted consequence', () => {
    expect(isLaunchable(IN_PACK)).toBe(false);
    expect(PACK_KEYS).toContain('dataRights');
  });
});
