import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { historyAfter, historyOf, historyUndone } from '../../src/studio/history';
import { roofHeightReset, roofHeightSet } from '../../src/studio/roof-height';
import type { SiteDataStamp } from '../../src/studio/site-data';
import {
  historyWithSiteHeights,
  type RoofDataRead,
  type SiteFit,
  siteFitLineOf,
  siteFitOf,
  siteHeightOf,
  withSiteHeights,
} from '../../src/studio/site-heights';
import { box, designOf, FACTS, roofOf, stairOn, TERRACE } from './roof-meet-support';

/**
 * A drawn roof stands at its real height (`T-M05-002`, part g, *Values*): the data sets the
 * system's value, `derived`; a person's is never replaced; a reset hands it back to the data; a
 * stair room counts from its roof; an old "Yes, it changed" no longer sets the data aside.
 */

const STAMP: SiteDataStamp = { source: 'google_solar', quality: 'base', dataOn: '2025-10-17' };
const flat = (heightM: number): RoofDataRead => ({
  kind: 'roof',
  heightM,
  slopeDeg: 0,
  facingDeg: null,
  clear: true,
});
const STAIR = stairOn(box(2, 2, 3, 3));
const HOLE = roofOf('hole', box(1, 1, 1, 1), {
  kind: { is: 'hole', setBy: 'system' },
  partOf: 'terrace',
});
/** Reads made at the corners the roofs stand at, unless `at` names others. */
const readsOf = (
  roofs: Record<string, RoofDataRead>,
  at: readonly Roof[] = [TERRACE, STAIR, HOLE],
) => ({
  stamp: STAMP,
  roofs,
  shape: at.map(({ id, corners }) => ({ id, corners })),
});

describe('the data’s heights on the design’s roofs', () => {
  it('a roof with no height stands at the data’s, derived, and the design names the data', () => {
    const read = withSiteHeights(designOf(TERRACE), readsOf({ terrace: flat(9.1) }), FACTS);
    expect(read.roofs[0]?.height).toEqual({ metres: 9.1, setBy: 'system', tier: 'derived' });
    expect(read.site?.dataStamp).toEqual(STAMP);
  });

  it('a height a person set is never replaced', () => {
    const set = roofHeightSet(designOf(TERRACE), 0, 7.5);
    if (set.kind !== 'done') throw new Error('refused');
    const read = withSiteHeights(set.document, readsOf({ terrace: flat(9.1) }), FACTS);
    expect(read.roofs[0]?.height).toEqual({ metres: 7.5, setBy: 'person' });
  });

  it('a reset hands the roof back to the data', () => {
    const set = roofHeightSet(designOf(TERRACE), 0, 7.5);
    if (set.kind !== 'done') throw new Error('refused');
    const reset = roofHeightReset(set.document, 0);
    expect(
      withSiteHeights(reset, readsOf({ terrace: flat(9.1) }), FACTS).roofs[0]?.height?.metres,
    ).toBe(9.1);
  });

  it.each([
    ['a stair room read at its own top stands its top less its roof', 11.5, 2.4],
    ['one read at its roof’s deck keeps its own height', 9.2, null],
  ])('%s', (_, stairTop, own) => {
    const read = withSiteHeights(
      designOf(TERRACE, STAIR),
      readsOf({ terrace: flat(9.1), stair: flat(stairTop) }),
      FACTS,
    );
    expect(read.roofs[1]?.height?.metres ?? null).toBe(own);
  });

  it('a stair room drawn before its roof still counts from the roof’s new height', () => {
    const stairFirst = designOf(STAIR, TERRACE);
    const read = withSiteHeights(
      stairFirst,
      readsOf({ terrace: flat(9.1), stair: flat(11.5) }),
      FACTS,
    );
    expect(read.roofs[0]?.height?.metres).toBe(2.4);
  });

  it.each([
    ['no data', null],
    ['no building under the roof', readsOf({ terrace: { kind: 'no_building' } })],
  ])('%s: the roof keeps its height', (_, reads) => {
    const design = designOf(TERRACE);
    expect(withSiteHeights(design, reads, FACTS).roofs[0]?.height).toBeNull();
  });

  it('a hole and a dormer take no height from the map', () => {
    const read = withSiteHeights(designOf(TERRACE, HOLE), readsOf({ hole: flat(3) }), FACTS);
    expect(read.roofs[1]?.height).toBeNull();
  });

  it.each([
    ['an old "Yes, it changed" for this data: the data still stands', '2025-10-17', true, 9.1],
    ['an old "Yes" for older data: the data stands', '2024-01-01', true, 9.1],
    ['an old "No": the data stands', '2025-10-17', false, 9.1],
  ])('%s', (_, dataOn, changed, height) => {
    const design = { ...designOf(TERRACE), site: { changed: { dataOn, changed } } };
    const read = withSiteHeights(design, readsOf({ terrace: flat(9.1) }), FACTS);
    expect(read.roofs[0]?.height?.metres ?? null).toBe(height);
  });

  it.each([
    ['21.22 m reads 21.2 m', 21.22, 21.2],
    ['21.25 m reads 21.3 m', 21.25, 21.3],
    ['9.1 m stays', 9.1, 9.1],
  ])('a height from the map is kept to the slider’s 10 cm step: %s', (_, mapM, kept) => {
    const read = withSiteHeights(designOf(TERRACE), readsOf({ terrace: flat(mapM) }), FACTS);
    expect(read.roofs[0]?.height?.metres).toBe(kept);
  });

  it('a read twice changes nothing the second time: the same design comes back', () => {
    const once = withSiteHeights(designOf(TERRACE), readsOf({ terrace: flat(9.1) }), FACTS);
    expect(withSiteHeights(once, readsOf({ terrace: flat(9.1) }), FACTS)).toBe(once);
  });

  it('every state of the history takes the heights; with nothing to change it comes back as it was', () => {
    const history = historyAfter(historyOf(designOf()), designOf(TERRACE));
    const read = historyWithSiteHeights(history, readsOf({ terrace: flat(9.1) }), FACTS);
    expect(read.present.roofs[0]?.height?.metres).toBe(9.1);
    expect(read.past[0]?.site?.dataStamp).toEqual(STAMP);
    expect(historyWithSiteHeights(read, readsOf({ terrace: flat(9.1) }), FACTS)).toBe(read);
  });

  const MOVED = { ...TERRACE, corners: box(6, 0, 10, 8).map((p) => p) };
  it('a read made at the moved roof’s corners leaves the state before the move as it was: Undo brings back its height', () => {
    const before = withSiteHeights(designOf(TERRACE), readsOf({ terrace: flat(9.1) }), FACTS);
    const history = historyAfter(historyOf(before), designOf({ ...MOVED, height: null }));
    const read = historyWithSiteHeights(history, readsOf({ terrace: flat(4.2) }, [MOVED]), FACTS);
    expect(read.present.roofs[0]?.height?.metres).toBe(4.2);
    expect(read.past[0]?.roofs[0]?.height?.metres).toBe(9.1);
    expect(historyUndone(read).present.roofs[0]?.height?.metres).toBe(9.1);
  });

  it('a read made before the roof moved sets nothing on the moved roof', () => {
    const moved = designOf({ ...MOVED, height: null });
    expect(
      withSiteHeights(moved, readsOf({ terrace: flat(9.1) }), FACTS).roofs[0]?.height,
    ).toBeNull();
  });

  it.each([
    ['a height the data set stands down', { metres: 9.1, setBy: 'system', tier: 'derived' }, null],
    ['a person’s height stays', { metres: 7.5, setBy: 'person' }, { metres: 7.5, setBy: 'person' }],
  ] as const)('no building under the roof where it now stands: %s', (_, height, after) => {
    const design = designOf({ ...TERRACE, height });
    const read = withSiteHeights(design, readsOf({ terrace: { kind: 'no_building' } }), FACTS);
    expect(read.roofs[0]?.height).toEqual(after);
  });
});

describe('the map against the open roof (board G21, G22)', () => {
  it('the data’s height for a roof stands even where a person set another: Reset brings it back', () => {
    const set = roofHeightSet(designOf(TERRACE), 0, 5.2);
    if (set.kind !== 'done') throw new Error('refused');
    expect(siteHeightOf(set.document, 0, readsOf({ terrace: flat(6.1) }), FACTS)).toBe(6.1);
  });

  it('no data: no height from the map', () => {
    expect(siteHeightOf(designOf(TERRACE), 0, null, FACTS)).toBeNull();
  });

  it('an old answer that the building changed: the map’s height still stands', () => {
    const design = {
      ...designOf(TERRACE),
      site: { changed: { dataOn: '2025-10-17', changed: true } },
    };
    expect(siteHeightOf(design, 0, readsOf({ terrace: flat(6.1) }), FACTS)).toBe(6.1);
  });

  it('a stair room’s map height is its own, above its roof as it stands', () => {
    const reads = readsOf({ terrace: flat(9.1), stair: flat(11.5) });
    const read = withSiteHeights(designOf(TERRACE, STAIR), reads, FACTS);
    expect(siteHeightOf(read, 1, reads, FACTS)).toBe(2.4);
  });

  it('the fit says how far the map sits above the roof at the height in hand', () => {
    const fit = siteFitOf(designOf(TERRACE), 0, 5.2, readsOf({ terrace: flat(6.1) }), FACTS);
    expect(fit).toEqual({ mapM: 6.1, byM: 0.9, clear: true });
  });

  const fitOf = (byM: number, clear = true): SiteFit => ({ mapM: 6, byM, clear });
  it.each([
    ['no read', null, null],
    ['an unclear read', fitOf(0.9, false), 'unclear'],
    ['a clear read: LiDAR shows how far the scan sits', fitOf(0.9), null],
  ] as const)('%s', (_, fit, line) => {
    expect(siteFitLineOf(fit)).toBe(line);
  });
});
