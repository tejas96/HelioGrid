import { describe, expect, it } from 'vitest';
import type { RoofStepEvent } from '../../src/studio/roof-step-state';
import { roofAreaTier } from '../../src/studio/roof-trust';
import { run } from './roof-step-run';

/** The size card's start size is the market's: `assumed` until a person sets it (`T-M05-002c`). */

const OPEN: RoofStepEvent = {
  kind: 'type_size',
  start: { length: 10, width: 8 },
  system: 'metric',
};
const PLACE: RoofStepEvent = { kind: 'place', id: 'typed-1', stamp: null, system: 'metric' };
const m = (main: string) => ({ main, inches: '', measured: false });

describe('a placed roof keeps who set each number', () => {
  it.each([
    // what the person did → the edges (length, width, length, width), the area's tier
    [
      'nothing: the market’s start size',
      [],
      ['assumed', 'assumed', 'assumed', 'assumed'],
      'assumed',
    ],
    [
      'the length slid',
      [{ kind: 'type_entry', length: m('12') }],
      ['typed', 'assumed', 'typed', 'assumed'],
      'assumed',
    ],
    [
      'the width typed',
      [{ kind: 'type_entry', width: m('6') }],
      ['assumed', 'typed', 'assumed', 'typed'],
      'assumed',
    ],
    [
      'both in the one box',
      [{ kind: 'type_pair', text: '13.2x8.6' }],
      ['typed', 'typed', 'typed', 'typed'],
      'estimated',
    ],
    [
      'the units changed, nothing set',
      [{ kind: 'type_units', from: 'metric', to: 'imperial' }],
      ['assumed', 'assumed', 'assumed', 'assumed'],
      'assumed',
    ],
  ] as const)('%s', (_why, acts, edges, tier) => {
    const { document } = run([OPEN, ...(acts as readonly RoofStepEvent[]), PLACE]);
    const roof = document.roofs[0];
    expect(roof?.edges).toEqual(edges);
    if (roof !== undefined) expect(roofAreaTier(roof, null)).toBe(tier);
  });
});
