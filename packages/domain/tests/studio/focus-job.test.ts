import { describe, expect, it } from 'vitest';
import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import { focusJobOf, studioJobOf } from '../../src/studio/focus-job';
import type { RoofGrip, RoofStepState } from '../../src/studio/roof-step-state';

describe('the studio’s job: what is open over the roof step comes first', () => {
  const CLOSED = { roofs: false, sheet: false, picture: false, menu: false };
  it.each([
    ['nothing open: the roof step’s own job', CLOSED, 'drawing'],
    ['a card of your picture’s', { ...CLOSED, picture: true }, 'picture'],
    ['a roof’s sheet, over a card', { ...CLOSED, sheet: true, picture: true }, 'sheet'],
    ['the material picker over a roof’s sheet', { ...CLOSED, roofs: true, sheet: true }, 'roofs'],
    [
      'a menu over everything else',
      { roofs: true, sheet: true, picture: true, menu: true },
      'menu',
    ],
  ] as const)('%s', (_why, open, job) => {
    expect(studioJobOf('drawing', open)).toBe(job);
  });
});

describe('the job a drag holds: a corner the magnet guides, or a whole roof', () => {
  const dragging = (grip: RoofGrip): RoofStepState => ({
    kind: 'dragging',
    grip,
    base: EMPTY_STUDIO_DOCUMENT,
    from: { east: 0, north: 0 },
    drag: { document: EMPTY_STUDIO_DOCUMENT, snap: null, fault: null, guides: [] },
    degrees: 0,
    magnet: true,
  });
  it.each([
    ['a corner', dragging({ kind: 'corner', roof: 0, corner: 1 }), 'dragging'],
    ['a + pulled out', dragging({ kind: 'plus', roof: 0, edge: 1 }), 'dragging'],
    ['the move handle', dragging({ kind: 'move', roof: 0 }), 'moving'],
    ['the turn handle', dragging({ kind: 'turn', roof: 0 }), 'moving'],
    ['nothing in hand', { kind: 'idle', roof: null, picked: null, said: null } as const, 'looking'],
    [
      'a roof being drawn',
      {
        kind: 'drawing',
        corners: [],
        pointer: null,
        spot: null,
        refused: null,
        magnet: true,
        wiped: null,
      } as const,
      'drawing',
    ],
  ])('%s: %s', (_why, step, job) => {
    expect(focusJobOf(step)).toBe(job);
  });
});
