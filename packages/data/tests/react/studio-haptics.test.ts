import { describe, expect, it } from 'vitest';
import { type StudioMoments, studioHapticOf } from '../../src/react/studio-haptics';

/** The phone's taps (`T-M05-002`, part b): each a change of what the studio shows, never a repeat. */
const REST: StudioMoments = {
  snap: null,
  refused: null,
  closed: null,
  lengthSide: null,
  heightSide: null,
};
const CLOSED = {};

describe('what a change of the studio taps on a phone', () => {
  it.each([
    ['nothing new', REST, REST, null],
    ['a snap caught', REST, { ...REST, snap: 'square' }, 'selection'],
    ['the same snap held', { ...REST, snap: 'square' }, { ...REST, snap: 'square' }, null],
    ['another snap', { ...REST, snap: 'square' }, { ...REST, snap: 'lines_up' }, 'selection'],
    ['a roof closed', REST, { ...REST, closed: CLOSED }, 'selection'],
    ['the same close seen again', { ...REST, closed: CLOSED }, { ...REST, closed: CLOSED }, null],
    [
      'a slider across its tick',
      { ...REST, lengthSide: -1 },
      { ...REST, lengthSide: 1 },
      'selection',
    ],
    ['a slider onto its tick', { ...REST, heightSide: 1 }, { ...REST, heightSide: 0 }, 'selection'],
    ['a slider off its tick', { ...REST, heightSide: 0 }, { ...REST, heightSide: 1 }, null],
    ['a slider on one side', { ...REST, lengthSide: 1 }, { ...REST, lengthSide: 1 }, null],
    ['a slider just opened', REST, { ...REST, lengthSide: 1 }, null],
    ['a refusal', REST, { ...REST, refused: 'would_cross' }, 'impact'],
    ['a refusal over a snap', REST, { ...REST, snap: 'square', refused: 'too_close' }, 'impact'],
    [
      'the same refusal held',
      { ...REST, refused: 'too_close' },
      { ...REST, refused: 'too_close' },
      null,
    ],
  ] as const)('%s: %s', (_why, was, now, tap) => {
    expect(studioHapticOf(was, now)).toBe(tap);
  });
});
