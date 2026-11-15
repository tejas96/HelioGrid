import { LINK_CEILINGS } from '@heliogrid/domain';
import { describe, expect, it } from 'vitest';
import { PublicCeiling } from '../../src/modules/customer-link/internal/public-ceiling';

const MINUTE_MS = 60_000;
const T0 = 1_800_000_000_000;

/**
 * The public ceiling's address map (`F5-29`, `F5-78`): an address is held for its minute and its
 * wait and no longer, and the map never holds more than its cap — past it a new address is
 * counted by the backstop alone.
 */
describe('the public ceiling holds each address for its minute only', () => {
  it.each([
    ['still inside its minute', MINUTE_MS - 1, 2],
    ['a minute on', MINUTE_MS, 1],
  ])('an address asked once is %s', (_, later, held) => {
    const ceiling = new PublicCeiling();
    ceiling.admits('203.0.113.1', T0);
    ceiling.admits('203.0.113.2', T0 + later);
    expect(ceiling.addressesHeld).toBe(held);
  });

  it('an address made to wait is held past its minute until its wait is over, then swept', () => {
    const ceiling = new PublicCeiling();
    const halfway = T0 + MINUTE_MS / 2;
    ceiling.admits('203.0.113.9', T0);
    for (let ask = 1; ask < LINK_CEILINGS.publicRequestsPerAddressPerMinute; ask += 1) {
      ceiling.admits('203.0.113.9', halfway);
    }
    expect(ceiling.admits('203.0.113.9', halfway)).toBe(false);
    // Its minute is over, its wait is not: still held, still refused.
    ceiling.admits('203.0.113.1', T0 + MINUTE_MS);
    expect(ceiling.addressesHeld).toBe(2);
    ceiling.admits('203.0.113.2', T0 + 2 * MINUTE_MS);
    expect(ceiling.addressesHeld).toBe(1);
  });

  it('past its cap a new address is not held: the backstop alone counts it', () => {
    const ceiling = new PublicCeiling();
    for (let address = 0; address < ceiling.addressCap; address += 1) {
      ceiling.admits(`a${address}`, T0);
    }
    expect(ceiling.addressesHeld).toBe(ceiling.addressCap);
    ceiling.admits('one more', T0);
    expect(ceiling.addressesHeld).toBe(ceiling.addressCap);
  });
});
