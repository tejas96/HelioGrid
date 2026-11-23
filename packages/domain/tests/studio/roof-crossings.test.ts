import { describe, expect, it } from 'vitest';
import { roofCrossingsOf } from '../../src/studio/roof-crossings';
import { roofNumberSet } from '../../src/studio/roof-values-set';
import { box, designOf, FACTS, roofOf, stairOn, TERRACE } from './roof-meet-support';
import { shaped } from './roof-sheet-support';

/**
 * What a roof crosses as it is changed (`T-M05-002`, part e, E131): each crossing is named and
 * marked to check, and nothing is refused.
 */
const kinds = (design: ReturnType<typeof designOf>, index: number) =>
  roofCrossingsOf(design, index, FACTS).map((each) => `${each.kind} ${each.roof}`);

describe('what a roof crosses', () => {
  const house = designOf(TERRACE, stairOn(box(1, 1, 3, 3)));

  it('a terrace with its usual parapet and a stair room on it crosses nothing', () => {
    expect(kinds(house, 0)).toEqual([]);
    expect(kinds(house, 1)).toEqual([]);
  });

  it('a parapet raised above the stair room’s top crosses it', () => {
    const low = { ...stairOn(box(1, 1, 3, 3)), height: { metres: 2.2, setBy: 'person' as const } };
    const tall = roofNumberSet(
      designOf(TERRACE, low),
      { roof: 0, key: 'parapet_height' },
      2.5,
      FACTS,
    );
    expect(kinds(tall, 0)).toEqual(['wall_above 1']);
  });

  it('a stair room lowered below its roof’s parapet top is sunk in it', () => {
    const low = {
      ...house,
      roofs: [
        TERRACE,
        { ...stairOn(box(1, 1, 3, 3)), height: { metres: 0.6, setBy: 'person' as const } },
      ],
    };
    expect(kinds(low, 1)).toEqual(['sunk 0']);
  });

  it('a stair room dragged half off its roof is past its edge', () => {
    const out = designOf(TERRACE, stairOn(box(8, 1, 4, 3)));
    expect(kinds(out, 1)).toContain('past_edge 0');
  });

  it('a lean-to’s ridge raised through the higher roof it meets crosses it', () => {
    const lean = {
      ...shaped('gable'),
      id: 'lean',
      corners: box(10, 0, 4, 8),
      height: { metres: 2.4, setBy: 'person' as const },
    };
    const steep = roofNumberSet(designOf(TERRACE, lean), { roof: 1, key: 'slope' }, 50, FACTS);
    expect(kinds(steep, 1)).toEqual(['ridge_through 0']);
    const shallow = roofNumberSet(designOf(TERRACE, lean), { roof: 1, key: 'slope' }, 5, FACTS);
    expect(kinds(shallow, 1)).toEqual([]);
  });

  it('a roof that is not there crosses nothing', () => {
    expect(kinds(designOf(roofOf('only', box(0, 0, 4, 4))), 3)).toEqual([]);
  });
});
