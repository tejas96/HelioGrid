import { describe, expect, it } from 'vitest';
import { entryMetres } from '../../src/studio/roof-entry';
import type { RoofStepEvent } from '../../src/studio/roof-step-state';
import { run } from './roof-step-run';

/** The size card's numbers as metres or feet change in the view menu (`T-M05-002c`). */

const OPEN: RoofStepEvent = {
  kind: 'type_size',
  start: { length: 10, width: 8 },
  system: 'metric',
};
const m = (main: string) => ({ main, inches: '', measured: false });
const size = (length: string, width: string): RoofStepEvent => ({
  kind: 'type_entry',
  length: m(length),
  width: m(width),
});

describe('the size card when the units change', () => {
  it('metres to feet while the card is open writes the same lengths in feet', () => {
    const { state } = run([
      OPEN,
      size('13.2', '8.6'),
      { kind: 'type_units', from: 'metric', to: 'imperial' },
    ]);
    if (state.kind !== 'typing') throw new Error(state.kind);
    expect(state.length).toMatchObject({ main: '43', inches: '4' });
    // Feet are written to the inch: 43 ft 4 in is 13.208 m.
    expect(entryMetres(state.length, 'imperial')).toBeCloseTo(13.2, 1);
  });

  it('metres to feet and back, nothing typed between: the boxes hold what was typed', () => {
    const { state } = run([
      OPEN,
      { kind: 'type_pair', text: '13.2x' },
      { kind: 'type_units', from: 'metric', to: 'imperial' },
      { kind: 'type_units', from: 'imperial', to: 'metric' },
    ]);
    if (state.kind !== 'typing') throw new Error(state.kind);
    expect(state.pair).toBe('13.2x');
    const exact = run([
      OPEN,
      size('13.2', '8.6'),
      { kind: 'type_units', from: 'metric', to: 'imperial' },
      { kind: 'type_units', from: 'imperial', to: 'metric' },
    ]).state;
    if (exact.kind !== 'typing') throw new Error(exact.kind);
    expect(entryMetres(exact.length, 'metric')).toBe(13.2);
  });
});
