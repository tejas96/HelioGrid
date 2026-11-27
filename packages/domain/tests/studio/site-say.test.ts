import { describe, expect, it } from 'vitest';
import { roofHeightSet } from '../../src/studio/roof-height';
import { floorsSet, siteSayOf } from '../../src/studio/site-say';
import { box, designOf, FACTS, roofOf, stairOn, TERRACE } from './roof-meet-support';

/**
 * What the bar says of the site's data (`T-M05-002`, part g): the data's date once, however old;
 * that a roof has no building under it, to set by hand; the floors where there is no data; nothing
 * before a roof. Nothing is asked: the data's heights stand, and a person changes any of them.
 */

const STAMP = { source: 'google_solar', quality: 'base', dataOn: '2025-10-17' } as const;
const google = (
  document = designOf(TERRACE),
  dataOn: string | null = '2025-10-17',
  noBuilding = false,
) =>
  siteSayOf({
    document,
    source: 'google_solar',
    dataOn,
    gaps: [],
    reads: {
      stamp: STAMP,
      roofs: noBuilding ? { terrace: { kind: 'no_building' } } : {},
      shape: [],
    },
  });

describe('what the bar says of the site’s data', () => {
  it('nothing before a roof is drawn', () => {
    expect(google(designOf())).toBeNull();
  });

  it.each([
    ['new data: the date it came from, said once', '2025-12-01', false, 'from_data'],
    ['data a year old: only its date, nothing asked', '2025-10-17', false, 'from_data'],
    ['a roof with no building under it: said, nothing asked', '2025-12-01', true, 'no_building'],
  ])('%s', (_, dataOn, noBuilding, kind) => {
    expect(google(designOf(TERRACE), dataOn, noBuilding)?.kind).toBe(kind);
  });

  it('an old answer that the building changed no longer sets the data aside', () => {
    const answered = {
      ...designOf(TERRACE),
      site: { changed: { dataOn: '2025-10-17', changed: true } },
    };
    expect(google(answered)).toEqual({ kind: 'from_data', dataOn: '2025-10-17' });
  });

  it.each([
    ['no data here: the floors are asked', [], { kind: 'floors' }],
    [
      'the height service did not answer: said, with Try again',
      ['heights_not_answered'],
      { kind: 'not_answered' },
    ],
    ['the person’s calls were capped: the same', ['capped'], { kind: 'not_answered' }],
  ] as const)('%s', (_, gaps, say) => {
    const read = siteSayOf({
      document: designOf(TERRACE),
      source: 'openstreetmap',
      dataOn: null,
      gaps,
      reads: null,
    });
    expect(read).toEqual(say);
  });

  it.each([
    ['data newer than the heights were made from: updated', '2025-12-01', '2025-11-01', 'updated'],
    ['the same data: its date', '2025-12-01', '2025-12-01', 'from_data'],
  ])('%s', (_, dataOn, before, kind) => {
    const say = siteSayOf({
      document: designOf(TERRACE),
      source: 'google_solar',
      dataOn,
      gaps: [],
      reads: null,
      stampBefore: { ...STAMP, dataOn: before },
    });
    expect(say?.kind).toBe(kind);
  });

  it('every roof’s height set by a person: the floors are not asked', () => {
    const set = roofHeightSet(designOf(TERRACE), 0, 6);
    if (set.kind !== 'done') throw new Error('refused');
    expect(
      siteSayOf({
        document: set.document,
        source: 'none',
        dataOn: null,
        gaps: [],
        reads: null,
      }),
    ).toBeNull();
  });
});

describe('a floors tap', () => {
  it.each([
    ['G: the plinth and a storey', 0, FACTS.plinthHeightM + FACTS.storeyHeightM],
    ['G+2', 2, FACTS.plinthHeightM + 3 * FACTS.storeyHeightM],
  ])(
    '%s, on every roof on the ground, the person’s; a stair room keeps its own',
    (_, floors, metres) => {
      const set = floorsSet(
        designOf(TERRACE, stairOn(box(1, 1, 2, 2)), roofOf('shed', box(20, 0, 4, 4))),
        floors,
        FACTS,
      );
      expect(set.roofs[0]?.height).toEqual({
        metres: Math.round(metres * 100) / 100,
        setBy: 'person',
        tier: 'estimated',
      });
      expect(set.roofs[1]?.height).toBeNull();
      expect(set.roofs[2]?.height?.setBy).toBe('person');
      expect(set.site?.floors).toBe(floors);
    },
  );
});
