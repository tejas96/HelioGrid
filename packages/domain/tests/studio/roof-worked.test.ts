import { describe, expect, it } from 'vitest';
import type { Roof, StudioDocument } from '../../src/studio/document';
import { cornerDragged } from '../../src/studio/roof-edit';
import { roofMoved } from '../../src/studio/roof-move';
import { roofsWorked } from '../../src/studio/roof-worked';
import {
  box,
  designOf,
  FACTS,
  kindOf,
  p,
  roofOf,
  SHED,
  stairOn,
  TERRACE,
} from './roof-meet-support';

/**
 * What the kernel keeps from one design to the next (`T-M05-002`, part e): after an edit, a roof
 * the edit did not touch keeps its answers, and every answer is the one a fresh look would give.
 */
const FAR = roofOf('far', box(60, 0, 8, 6));
const FAR_STAIR = { ...stairOn(box(60, 0, 3, 3), 'far'), id: 'far-stair' };
const SITE = designOf(TERRACE, stairOn(box(0, 0, 3, 3)), SHED, FAR, FAR_STAIR);
const BEFORE = { document: SITE, worked: roofsWorked(SITE, FACTS) };
const withRoof = (index: number, roof: Roof): StudioDocument => ({
  ...SITE,
  roofs: SITE.roofs.map((each, i) => (i === index ? roof : each)),
});

describe('after an edit, every answer is a fresh look’s', () => {
  it.each([
    ['the stair room moved along its roof’s wall', roofMoved(SITE, 1, p(4, 0)).document],
    ['the stair room moved off the wall', roofMoved(SITE, 1, p(2, 2)).document],
    ['the shed moved clear of the terrace', roofMoved(SITE, 2, p(5, 0)).document],
    ['a corner of the terrace dragged', cornerDragged(SITE, 0, 2, p(10, 9), false).document],
    [
      'the terrace made a storey taller',
      withRoof(0, { ...TERRACE, height: { metres: 6, setBy: 'person' } }),
    ],
    [
      'the shed made taller than the terrace',
      withRoof(2, { ...SHED, height: { metres: 5, setBy: 'person' } }),
    ],
    [
      'the stair room made an open shed, which has no walls',
      withRoof(1, kindOf('stair', 'open_shed', box(0, 0, 3, 3), { on: 'terrace' })),
    ],
    [
      'a side of the terrace given no wall',
      withRoof(0, { ...TERRACE, sides: [{ parapet: false }, {}, {}, {}] }),
    ],
    ['a far roof moved next to the shed', roofMoved(SITE, 3, p(-46, 0)).document],
  ])('%s', (_why, after) => {
    expect(roofsWorked(after, FACTS, 0, BEFORE)).toEqual(roofsWorked(after, FACTS));
  });

  it('a design with another count of roofs is worked out afresh: the last roof gone, its neighbour’s side is open again', () => {
    const pair = designOf(TERRACE, SHED);
    const alone = designOf(TERRACE);
    const before = { document: pair, worked: roofsWorked(pair, FACTS) };
    expect(roofsWorked(alone, FACTS, 0, before)).toEqual(roofsWorked(alone, FACTS));
  });

  it('a roof beside an upper floor that sticks out is looked at again when the roof under that floor is made taller', () => {
    // The upper floor stands on the terrace and sticks out 4 m east; the tall roof stands against
    // its far side, well clear of the terrace itself.
    const upper = kindOf('upper', 'upper_floor', box(8, 0, 6, 4), { on: 'terrace' });
    const tall = roofOf('tall', box(14, 0, 4, 4), { height: { metres: 6, setBy: 'person' } });
    const site = designOf(TERRACE, upper, tall);
    const before = { document: site, worked: roofsWorked(site, FACTS) };
    const after = {
      ...site,
      roofs: [{ ...TERRACE, height: { metres: 6, setBy: 'person' } } as Roof, upper, tall],
    };
    const next = roofsWorked(after, FACTS, 0, before);
    expect(next).toEqual(roofsWorked(after, FACTS));
    // Level with the upper floor before, under its wall now.
    expect(before.worked.edges[2]?.flat().some((stretch) => stretch.state === 'shared')).toBe(true);
    expect(next.edges[2]?.flat().some((stretch) => stretch.state === 'under')).toBe(true);
  });
});

describe('a roof an edit did not touch keeps its answers', () => {
  it('the far house keeps its own, to the very same answer, while the stair room moves', () => {
    const after = roofMoved(SITE, 1, p(4, 0)).document;
    const next = roofsWorked(after, FACTS, 0, BEFORE);
    expect(next.edges[3]).toBe(BEFORE.worked.edges[3]);
    expect(next.edges[4]).toBe(BEFORE.worked.edges[4]);
    // The terrace under the stair room is worked out again: its side is split at a new place.
    expect(next.edges[0]).not.toBe(BEFORE.worked.edges[0]);
  });

  it('nothing changed: every answer is kept', () => {
    const next = roofsWorked({ ...SITE }, FACTS, 0, BEFORE);
    expect(next.edges.every((edges, i) => edges === BEFORE.worked.edges[i])).toBe(true);
  });

  it('a roof made taller is a new look for the roof beside it, though that roof is the same', () => {
    const after = withRoof(0, { ...TERRACE, height: { metres: 6, setBy: 'person' } });
    const next = roofsWorked(after, FACTS, 0, BEFORE);
    // The shed now stands under the terrace's wall.
    expect(next.edges[2]).not.toBe(BEFORE.worked.edges[2]);
    expect(next.edges[2]?.flat().some((stretch) => stretch.state === 'under')).toBe(true);
    // The stair room on the terrace stands higher too, and the far house is untouched.
    expect(next.edges[3]).toBe(BEFORE.worked.edges[3]);
  });
});
