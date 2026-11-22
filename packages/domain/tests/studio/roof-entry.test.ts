import { describe, expect, it } from 'vitest';
import { entryOf, handMetres, lengthSlide, sizingResult } from '../../src/studio/roof-entry';
import { edgeLengths } from '../../src/studio/roof-shape';
import { CLOSE, drawn, p, run } from './roof-step-run';

describe('the length slider: the picture’s length ± 30 %, in 5 cm or 1 inch steps (T-M05-002)', () => {
  it.each([
    // traced metres, system → min, max, step
    [7.8, 'metric', 5.45, 10.15, 0.05],
    [10, 'metric', 7, 13, 0.05],
    // A short edge never slides under the shortest edge a roof may have.
    [0.35, 'metric', 0.3, 0.45, 0.05],
    [0.3, 'metric', 0.3, 0.4, 0.05],
    [8.2042, 'imperial', 5.7404, 10.668, 0.0254],
  ] as const)('%s m, %s: %s to %s', (traced, system, min, max, step) => {
    const slide = lengthSlide(traced, system);
    expect(slide.min).toBeCloseTo(min, 4);
    expect(slide.max).toBeCloseTo(max, 4);
    expect(slide.step).toBe(step);
    expect(slide.mark).toBe(traced);
  });
});

describe('a length opened and left as it was changes nothing (T-M05-002)', () => {
  // 8 m reads 26 ft 3 in, which is 8.001 m: the rounding alone must not move the roof — a roof
  // flush against another would be refused before the person did anything.
  it.each(['imperial', 'metric'] as const)('%s: the edge keeps its exact length', (system) => {
    const { state } = run([{ kind: 'pick_length', roof: 0, edge: 0, system }], drawn);
    if (state.kind !== 'sizing') throw new Error('not sizing');
    const result = sizingResult(state, system);
    if (result.kind !== 'done') throw new Error(result.kind);
    expect(edgeLengths(result.document.roofs[0]?.corners ?? [])[0]).toBe(
      edgeLengths(drawn.roofs[0]?.corners ?? [])[0],
    );
  });
});

describe('m or ft alone moves nothing (T-M05-002)', () => {
  // 13.3812 m reads 43 ft 11 in, which is 13.386 m, which reads 13.39 m: switching units must not
  // carry the rounding of one unit into the other.
  const odd = run([
    { kind: 'draw', magnet: false },
    { kind: 'tap', at: p(0, 0), system: 'metric' },
    { kind: 'tap', at: p(13.3812, 0), system: 'metric' },
    { kind: 'tap', at: p(13.3812, 6), system: 'metric' },
    { kind: 'tap', at: p(0, 6), system: 'metric' },
    CLOSE,
  ]).document;
  it('feet, then metres: the box reads the edge as it is', () => {
    const { state } = run([{ kind: 'pick_length', roof: 0, edge: 0, system: 'imperial' }], odd);
    if (state.kind !== 'sizing') throw new Error('not sizing');
    const metres = handMetres(state, 'imperial');
    expect(metres).toBeCloseTo(13.3812, 6);
    expect(entryOf(metres ?? 0, 'metric', false).main).toBe('13.38');
  });
});
