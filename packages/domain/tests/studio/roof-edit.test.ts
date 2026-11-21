import { describe, expect, it } from 'vitest';
import type { Roof, RoofEdgeTrust, StudioDocument } from '../../src/studio/document';
import { EMPTY_STUDIO_DOCUMENT } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import {
  cornerAdded,
  cornerDragged,
  cornerNearest,
  cornerRemoved,
  roofMoved,
  roofTurned,
} from '../../src/studio/roof-edit';
import { lengthAsks, lengthIsFirst, lengthSet } from '../../src/studio/roof-length';
import { edgeLengths, roofArea } from '../../src/studio/roof-shape';

const p = (east: number, north: number): GroundPoint => ({ east, north });
const near = (a: readonly GroundPoint[], b: readonly GroundPoint[]) => {
  expect(a).toHaveLength(b.length);
  a.forEach((point, i) => {
    expect(point.east).toBeCloseTo((b[i] as GroundPoint).east, 6);
    expect(point.north).toBeCloseTo((b[i] as GroundPoint).north, 6);
  });
};
const RECT = [p(0, 0), p(8, 0), p(8, 6), p(0, 6)];
const roofOf = (
  corners: readonly GroundPoint[],
  edges: readonly RoofEdgeTrust[] = corners.map(() => 'traced'),
): Roof => ({ id: 'r', corners, edges, tracedOn: 'sky', height: null });
const designOf = (...roofs: Roof[]): StudioDocument => ({ ...EMPTY_STUDIO_DOCUMENT, roofs });
const SHED = roofOf([p(8, 0), p(12, 0), p(12, 6), p(8, 6)]);
const done = (result: { kind: string; document?: StudioDocument }) => {
  if (result.kind !== 'done' || result.document === undefined) throw new Error('refused');
  return result.document;
};

describe('the first true length sizes the picture and every roof', () => {
  it('is first while no length is typed or measured', () => {
    expect(lengthIsFirst(designOf(roofOf(RECT)))).toBe(true);
    expect(lengthIsFirst(designOf(roofOf(RECT, ['typed', 'traced', 'traced', 'traced'])))).toBe(
      false,
    );
  });

  it('8 m traced, 10 m typed: every corner of every roof × 1.25 about the pin, the picture too', () => {
    const after = done(lengthSet(designOf(roofOf(RECT), SHED), 0, 0, 10, 'typed'));
    expect(after.pictureScale).toBeCloseTo(1.25);
    near(after.roofs[0]?.corners ?? [], [p(0, 0), p(10, 0), p(10, 7.5), p(0, 7.5)]);
    near(after.roofs[1]?.corners ?? [], [p(10, 0), p(15, 0), p(15, 7.5), p(10, 7.5)]);
    expect(after.roofs[0]?.edges).toEqual(['typed', 'traced', 'traced', 'traced']);
  });

  it('measured on site marks the edge measured', () => {
    const after = done(lengthSet(designOf(roofOf(RECT)), 0, 1, 6, 'measured'));
    expect(after.roofs[0]?.edges[1]).toBe('measured');
  });

  it('is refused when it would carry another roof past the site’s reach', () => {
    const far = roofOf([p(450, 0), p(454, 0), p(454, 4), p(450, 4)]);
    expect(lengthSet(designOf(roofOf(RECT), far), 0, 0, 39, 'typed')).toEqual({
      kind: 'refused',
      refusal: 'too_far',
    });
  });

  it.each([
    ['stretches the picture past 5×', 40.1],
    ['shrinks it past 1/5', 1.59],
  ])('is refused when it %s', (_name, metres) => {
    expect(lengthSet(designOf(roofOf(RECT)), 0, 0, metres, 'typed')).toEqual({
      kind: 'refused',
      refusal: 'scale_out_of_range',
    });
  });
});

describe('a later length fixes its own edge', () => {
  const sized = designOf(roofOf(RECT, ['traced', 'typed', 'traced', 'traced']));

  it('grows from its middle; a rectangle stays a rectangle and the opposite side follows', () => {
    const after = done(lengthSet(sized, 0, 0, 9, 'typed'));
    near(after.roofs[0]?.corners ?? [], [p(-0.5, 0), p(8.5, 0), p(8.5, 6), p(-0.5, 6)]);
    expect(after.pictureScale).toBe(1);
    expect(after.roofs[0]?.edges).toEqual(['typed', 'typed', 'traced', 'traced']);
  });

  it('a typed length holds: one end stays and the other takes the change', () => {
    // Square at the first corner only; the far edge is typed, so the first corner stays.
    const corners = [p(0, 0), p(8, 0), p(6, 6), p(0, 6)];
    const design = designOf(roofOf(corners, ['traced', 'traced', 'typed', 'typed']));
    const after = done(lengthSet(design, 0, 0, 10, 'typed'));
    near(after.roofs[0]?.corners ?? [], [p(0, 0), p(10, 0), p(6, 6), p(0, 6)]);
  });

  it('refused, naming the typed length that would change', () => {
    const design = designOf(roofOf(RECT, ['traced', 'traced', 'typed', 'traced']));
    expect(lengthSet(design, 0, 0, 9, 'typed')).toEqual({
      kind: 'refused',
      refusal: 'held_length',
      edge: 2,
    });
  });

  it.each([
    [0.29, 'too_short'],
    [999.01, 'too_long'],
  ])('%s m is refused: %s', (metres, refusal) => {
    expect(lengthSet(sized, 0, 0, metres, 'typed')).toEqual({ kind: 'refused', refusal });
  });

  it.each([0.3, 999])('%s m is in range', (metres) => {
    expect(lengthSet(sized, 0, 0, metres, 'typed').kind).toBe('done');
  });

  it('a length whose edges would cross is refused', () => {
    const notch = [p(0, 0), p(8, 0), p(8, 6), p(4, 1), p(0, 6)];
    const design = designOf(roofOf(notch, ['typed', 'traced', 'traced', 'traced', 'traced']));
    expect(lengthSet(design, 0, 2, 9, 'typed')).toEqual({
      kind: 'refused',
      refusal: 'would_cross',
    });
  });

  it('a length that would push the roof over another is refused', () => {
    const design = designOf(roofOf(RECT, ['traced', 'typed', 'traced', 'traced']), SHED);
    expect(lengthSet(design, 0, 0, 9, 'typed')).toEqual({
      kind: 'refused',
      refusal: 'would_overlap',
    });
  });
});

describe('a length far off the picture asks once', () => {
  it.each([
    [8, 10, false],
    [8, 10.01, true],
    [8, 6, false],
    [8, 5.99, true],
  ])('traced %s m, typed %s m: asks is %s', (traced, typed, asks) => {
    expect(lengthAsks(traced, typed)).toBe(asks);
  });
});

describe('dragging a corner', () => {
  const design = designOf(roofOf(RECT));

  it.each([
    ['0.4 m off square: the magnet takes it', p(8.3, 6.25), 'square_corner', p(8, 6)],
    ['0.7 m off: it is let go', p(8.7, 6.7), null, p(8.7, 6.7)],
  ])('%s', (_name, to, snap, at) => {
    const drag = cornerDragged(design, 0, 2, to);
    expect(drag.snap?.kind ?? null).toBe(snap);
    near([drag.document.roofs[0]?.corners[2] as GroundPoint], [at]);
    expect(drag.fault).toBeNull();
  });

  it('snaps to another roof’s corner', () => {
    const shed = roofOf([p(9, 7), p(12, 7), p(12, 10), p(9, 10)]);
    const drag = cornerDragged(designOf(roofOf(RECT), shed), 0, 2, p(8.8, 6.8));
    expect(drag.snap).toEqual({ kind: 'corner_of', owner: { kind: 'roof', roof: 1 } });
    near([drag.document.roofs[0]?.corners[2] as GroundPoint], [p(9, 7)]);
  });

  it('a typed neighbour edge keeps its length: the corner slides round its other end', () => {
    const typed = designOf(roofOf(RECT, ['typed', 'traced', 'traced', 'traced']));
    const drag = cornerDragged(typed, 0, 1, p(8, 2));
    expect(edgeLengths(drag.document.roofs[0]?.corners ?? [])[0]).toBeCloseTo(8);
    expect(drag.snap).toEqual({ kind: 'held', metres: 8, centre: p(0, 0) });
  });

  it('two typed neighbours: the corner stays, and says why', () => {
    const typed = designOf(roofOf(RECT, ['typed', 'typed', 'traced', 'traced']));
    const drag = cornerDragged(typed, 0, 1, p(9, 1));
    expect(drag.document).toBe(typed);
    expect(drag.fault).toBe('two_held');
  });

  it.each([
    ['across the roof: the edges cross', [], p(4, -3), 'would_cross'],
    ['into another roof', [SHED], p(10, 7), 'would_overlap'],
  ])('%s', (_name, others, to, fault) => {
    expect(cornerDragged(designOf(roofOf(RECT), ...others), 0, 2, to).fault).toBe(fault);
  });
});

describe('adding and removing a corner', () => {
  it('+ on an edge adds a corner at its middle; both halves are traced', () => {
    const typed = designOf(roofOf(RECT, ['traced', 'typed', 'traced', 'traced']));
    const after = done(cornerAdded(typed, 0, 1));
    near(after.roofs[0]?.corners ?? [], [p(0, 0), p(8, 0), p(8, 3), p(8, 6), p(0, 6)]);
    expect(after.roofs[0]?.edges).toEqual(['traced', 'traced', 'traced', 'traced', 'traced']);
  });

  it('× removes a corner; its two edges join as one traced edge', () => {
    const five = designOf(
      roofOf(
        [p(0, 0), p(8, 0), p(8, 3), p(8, 6), p(0, 6)],
        ['typed', 'typed', 'typed', 'traced', 'traced'],
      ),
    );
    const after = done(cornerRemoved(five, 0, 2));
    near(after.roofs[0]?.corners ?? [], RECT);
    expect(after.roofs[0]?.edges).toEqual(['typed', 'traced', 'traced', 'traced']);
  });

  it.each([
    ['a roof keeps 3 corners', [p(0, 0), p(8, 0), p(8, 6)], 1, 'keeps_three'],
    ['the edges would cross', [p(0, 0), p(8, 0), p(8, 6), p(4, 1), p(0, 6)], 0, 'would_cross'],
  ])('× is refused: %s', (_name, corners, corner, refusal) => {
    expect(cornerRemoved(designOf(roofOf(corners)), 0, corner)).toEqual({
      kind: 'refused',
      refusal,
    });
  });
});

describe('moving and turning a roof', () => {
  it('the move handle moves the whole roof', () => {
    const drag = roofMoved(designOf(roofOf(RECT)), 0, p(2, -1));
    near(drag.document.roofs[0]?.corners ?? [], [p(2, -1), p(10, -1), p(10, 5), p(2, 5)]);
    expect(drag.fault).toBeNull();
  });

  it('a move onto another roof is a fault', () => {
    expect(roofMoved(designOf(roofOf(RECT), SHED), 0, p(2, 0)).fault).toBe('would_overlap');
  });

  it('turns about its middle and keeps its area', () => {
    const turn = roofTurned(designOf(roofOf(RECT)), 0, 90);
    near(turn.document.roofs[0]?.corners ?? [], [p(7, -1), p(7, 7), p(1, 7), p(1, -1)]);
    expect(roofArea(turn.document.roofs[0]?.corners ?? [])).toBeCloseTo(48);
  });

  it.each([
    ['2.9° from another roof’s edge: lines up with it', 2.9, true, 0],
    ['3.1°: stays as turned', 3.1, false, 3.1],
  ])('%s', (_name, degrees, snapped, applied) => {
    const far = roofOf([p(30, 0), p(34, 0), p(34, 4), p(30, 4)]);
    const turn = roofTurned(designOf(roofOf(RECT), far), 0, degrees);
    expect(turn.snapped).toBe(snapped);
    expect(turn.degrees).toBeCloseTo(applied);
  });
});

describe('no two corners of a roof stand within 0.3 m (T-M05-002)', () => {
  it('a corner dragged onto its neighbour is refused, and one 0.3 m off is kept', () => {
    const design = designOf(roofOf(RECT));
    expect(cornerDragged(design, 0, 2, p(8.1, 0.15)).fault).toBe('too_close');
    expect(cornerDragged(design, 0, 2, p(8.2, 0.3)).fault).toBeNull();
  });
});

describe('a finger on crowded dots holds the corner nearest it (T-M05-002)', () => {
  it('picks the nearest corner', () => {
    const corners = [p(0, 0), p(8, 0), p(8, 0.6), p(0, 6)];
    expect(cornerNearest(corners, p(8.1, 0.5))).toBe(2);
    expect(cornerNearest(corners, p(8.1, 0.1))).toBe(1);
    expect(cornerNearest(corners, p(1, 1))).toBe(0);
  });
});

describe('a + on an edge too short for a corner adds none (T-M05-002)', () => {
  it.each([
    // edge length, metres → added
    [0.59, false],
    [0.6, true],
    [1, true],
  ])('%s m: %s', (metres, added) => {
    const design = designOf(roofOf([p(0, 0), p(8, 0), p(8, metres), p(0, metres)]));
    expect(cornerAdded(design, 0, 1).kind === 'done').toBe(added);
  });
});
