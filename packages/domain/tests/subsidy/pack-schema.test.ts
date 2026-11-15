import { describe, expect, it } from 'vitest';
import { IN_PACK } from '../../src/market/pack';
import { SYSTEM_TYPES } from '../../src/proposals/system-type';
import { subsidyPackOf } from '../../src/subsidy/pack-schema';

const offered = IN_PACK.subsidy;
if (!offered.offered) throw new Error('the India pack offers an incentive');
/** A pack stored before the system types and the receiver were facts of it. */
const { paidTo: _paidTo, ...older } = offered;
const storedBefore = {
  ...older,
  eligibility: { segments: offered.eligibility.segments, requiredSchemes: [] },
};

describe('subsidyPackOf — the incentive as a device reads it off the wire', () => {
  it.each([
    ['the market’s own pack', offered, offered],
    ['a market that offers none', { offered: false }, { offered: false }],
  ])('%s reads as it was sent', (_, sent, read) => {
    expect(subsidyPackOf(sent)).toEqual(read);
  });

  it('a pack stored before the facts existed restricts no system type and pays the customer', () => {
    expect(subsidyPackOf(storedBefore)).toMatchObject({
      eligibility: { systemTypes: [...SYSTEM_TYPES] },
      paidTo: 'customer',
    });
  });

  it.each([
    ['nothing', null],
    ['a word', 'PM Surya Ghar'],
    ['an offer with no slabs', { offered: true, scheme: 'X' }],
  ])('%s is no pack', (_, sent) => {
    expect(subsidyPackOf(sent)).toBeNull();
  });
});
