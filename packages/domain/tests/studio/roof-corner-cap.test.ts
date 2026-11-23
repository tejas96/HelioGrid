import { describe, expect, it } from 'vitest';
import {
  CORNERS_TOTAL_MAX,
  cornerRoom,
  EMPTY_STUDIO_DOCUMENT,
  type Roof,
  type StudioDocument,
} from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { draftClose } from '../../src/studio/roof-draw';
import { cornerAdded } from '../../src/studio/roof-edit';
import { typedResult, typedStart } from '../../src/studio/roof-type';

/**
 * A studio lets a design's roofs hold 2,000 corners in all (`T-M05-002`, part e): with the roof cap
 * that keeps a design that holds all it can under the save's size limit. A stored design may hold
 * more — every design from before the cap still reads — but no studio adds to one that is full.
 */
const p = (east: number, north: number): GroundPoint => ({ east, north });
/** A ring of `count` corners round a circle, 30 m from the last one's middle. */
const ring = (n: number, count: number): Roof => ({
  id: `ring-${n}`,
  corners: Array.from({ length: count }, (_, i) =>
    p(n * 30 + 10 * Math.cos((2 * Math.PI * i) / count), 10 * Math.sin((2 * Math.PI * i) / count)),
  ),
  edges: Array.from({ length: count }, () => 'traced' as const),
  tracedOn: 'none',
  height: null,
});
const designOf = (corners: number): StudioDocument => ({
  ...EMPTY_STUDIO_DOCUMENT,
  roofs: [...Array.from({ length: 19 }, (_, i) => ring(i, 100)), ring(19, corners - 1_900)],
});
const DRAFT = [p(-100, 0), p(-90, 0), p(-90, 10), p(-100, 10)];

describe('the studio’s cap on a design’s corners', () => {
  it.each([
    [CORNERS_TOTAL_MAX - 5, 5],
    [CORNERS_TOTAL_MAX, 0],
  ])('a design of %s corners has room for %s more', (corners, room) => {
    expect(cornerRoom(designOf(corners).roofs)).toBe(room);
  });

  it.each([
    ['one corner short of full: a corner is added', CORNERS_TOTAL_MAX - 1, 'done'],
    ['full: no corner is added', CORNERS_TOTAL_MAX, 'refused'],
  ])('%s', (_why, corners, kind) => {
    const added = cornerAdded(designOf(corners), 19, 0);
    expect(added.kind).toBe(kind);
    if (added.kind === 'refused') expect(added.refusal).toBe('too_many_corners');
  });

  it.each([
    ['room for its four corners: the roof closes', CORNERS_TOTAL_MAX - 4, 'closed'],
    ['room for three: it is refused', CORNERS_TOTAL_MAX - 3, 'refused'],
  ])('a roof drawn with %s', (_why, corners, kind) => {
    const closed = draftClose(DRAFT, designOf(corners).roofs, 'new', 'none', false);
    expect(closed.kind).toBe(kind);
    if (closed.kind === 'refused') expect(closed.refusal).toBe('too_many_corners');
  });

  it.each([
    ['room for a rectangle: the size is ready', CORNERS_TOTAL_MAX - 4, 'ready'],
    ['room for three corners: the design is full', CORNERS_TOTAL_MAX - 3, 'refused'],
  ])('a typed roof with %s', (_why, corners, kind) => {
    const design = designOf(corners);
    const size = typedStart(design.roofs, { length: 10, width: 8 }, 'metric');
    expect(typedResult(size, design, 'metric').kind).toBe(kind);
  });
});
