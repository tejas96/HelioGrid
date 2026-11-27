import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofsHeadM2 } from '../../src/studio/roof-list';
import { roofListOf } from '../../src/studio/roof-list-build';
import { roofsWorked } from '../../src/studio/roof-worked';
import { box, designOf, FACTS, kindOf, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';

/**
 * Roofs, the one sheet (`T-M05-002`, part e): a row for each roof, what stands on a roof right
 * under it, every spot of ground counted once, and what waits for a person to check.
 */
const STAIR = stairOn(box(0, 0, 3, 3));
const listOf = (...roofs: Roof[]) => {
  const design = designOf(...roofs);
  return roofListOf(design, FACTS, roofsWorked(design, FACTS));
};
const confirmed = { type: 'rcc', setBy: 'person', confirmed: true } as const;

describe('the rows of Roofs', () => {
  // Drawn in this order: the terrace, the shed, then the stair room on the terrace.
  const list = listOf(TERRACE, SHED, STAIR);

  it('what stands on a roof sits right under that roof’s row, whenever it was drawn', () => {
    expect(list.rows.map((row) => [row.roof, row.child])).toEqual([
      [0, false],
      [2, true],
      [1, false],
    ]);
  });

  it('each row says what the roof is called and where it sits', () => {
    expect(list.rows.map((row) => [row.name, row.sits])).toEqual([
      [{ kind: 'roof', number: 1 }, { kind: 'main' }],
      [
        { kind: 'stair_room', with: 1 },
        { kind: 'above', roof: { kind: 'roof', number: 1 }, metres: 3 },
      ],
      [
        { kind: 'roof', number: 2 },
        { kind: 'beside', roof: { kind: 'roof', number: 1 } },
      ],
    ]);
  });

  it('the head counts the roofs, and their ground once: the stair room’s is the terrace’s', () => {
    expect(list.count).toBe(3);
    expect(list.areaM2).toBeCloseTo(80 + 32, 6);
  });

  it('a flat roof’s row shows its own ground, less what stands on it; a sloped one its surface along the slope', () => {
    const [terrace, stair, shed] = list.rows;
    expect(terrace?.areaM2).toBeCloseTo(80 - 9, 6);
    expect(stair?.areaM2).toBeCloseTo(9, 6);
    expect(shed?.areaM2).toBeGreaterThan(32);
    expect(shed?.areaM2).toBeLessThan(32.5);
  });

  it.each([
    ['its own stair room on its edge is not a roof beside it', [], { kind: 'ground' }],
    [
      'a roof beside it is named, past its own stair room',
      [roofOf('next', box(45, 0, 4, 5))],
      { kind: 'beside', roof: { kind: 'roof', number: 3 } },
    ],
  ] as const)('%s', (_why, more, sits) => {
    const far = roofOf('far', box(40, 0, 5, 5));
    const stair = stairOn(box(40, 0, 2, 2), 'far');
    const rows = listOf(TERRACE, far, ...more, stair).rows;
    expect(rows.find((row) => row.roof === 1)?.sits).toEqual(sits);
  });

  it('a roof apart from every other sits on the ground by itself', () => {
    expect(listOf(TERRACE, roofOf('far', box(40, 0, 5, 5))).rows[1]?.sits).toEqual({
      kind: 'ground',
    });
  });

  it.each([
    ['a hole is in its roof', kindOf('duct', 'hole', box(4, 3, 1, 1), { partOf: 'terrace' }), 'in'],
    [
      'a separate part is part of its roof',
      kindOf('back', 'separate_part', box(5, 0, 5, 8), { partOf: 'terrace' }),
      'part_of',
    ],
  ])('%s', (_why, part, sits) => {
    const row = listOf(TERRACE, part).rows[1];
    expect(row?.sits).toEqual({ kind: sits, roof: { kind: 'roof', number: 1 } });
    expect(row?.child).toBe(true);
  });

  it('a hole is no roof and is made of nothing: it has a row, and the count leaves it out', () => {
    const list = listOf(TERRACE, kindOf('duct', 'hole', box(4, 3, 1, 1), { partOf: 'terrace' }));
    expect(list.count).toBe(1);
    expect(list.rows[1]).toMatchObject({ kind: 'hole', material: null, areaM2: 1 });
  });

  it('a roof whose roof is gone, or a ring of links, still has a row', () => {
    expect(listOf(stairOn(box(0, 0, 3, 3), 'gone')).rows).toHaveLength(1);
    const ring = listOf(
      roofOf('a', box(0, 0, 4, 4), { on: 'b' }),
      roofOf('b', box(0, 0, 6, 6), { on: 'a' }),
    );
    expect(ring.rows.map((row) => row.roof).sort()).toEqual([0, 1]);
  });
});

describe('what waits for a person to check', () => {
  it('a material no person confirmed waits; confirmed, it does not', () => {
    expect(listOf(TERRACE)).toMatchObject({ waiting: 1, rows: [{ waits: true }] });
    const done = listOf({ ...TERRACE, material: confirmed });
    expect(done).toMatchObject({ waiting: 0, rows: [{ waits: false }] });
    expect(done.rows[0]?.material).toEqual({ type: 'rcc', name: null, confirmed: true });
  });

  it('what the studio guessed a roof is waits until a person makes it theirs', () => {
    const made = { ...TERRACE, material: confirmed };
    const guessed = { ...STAIR, material: confirmed } as Roof;
    const mine = { ...guessed, kind: { is: 'stair_room', setBy: 'person' } } as Roof;
    expect(listOf(made, guessed).waiting).toBe(1);
    expect(listOf(made, mine).waiting).toBe(0);
  });

  it('a type a person named keeps its name on the row', () => {
    const named = {
      ...TERRACE,
      material: {
        type: 'other',
        name: 'Kota stone',
        fixedLike: 'concrete',
        setBy: 'person',
        confirmed: true,
      },
    } as Roof;
    expect(listOf(named).rows[0]?.material).toEqual({
      type: 'other',
      name: 'Kota stone',
      confirmed: true,
    });
  });
});

describe('the head’s area against its rows', () => {
  // 80.4 m² and 12.462 m², side by side: the rows read 80 and 12, together 92.862 m².
  const terrace = roofOf('terrace', box(0, 0, 10, 8.04));
  const side = roofOf('side', box(10, 0, 1.55, 8.04));
  it.each([
    ['rows side by side: the head is the rows as shown, 80 + 12', [terrace, side], 92],
    [
      'an open shed over the terrace: every spot once, the rows overlapping',
      [terrace, kindOf('tin', 'open_shed', box(5, 4, 4, 4), { on: 'terrace' })],
      80.4,
    ],
    ['one roof alone: its row', [terrace], 80],
  ])('%s', (_, roofs, head) => {
    expect(roofsHeadM2(listOf(...roofs), 'metric')).toBeCloseTo(head, 6);
  });

  it('a sloped row shows its surface: the head stays every roof from above', () => {
    const list = listOf(TERRACE, SHED);
    expect(roofsHeadM2(list, 'metric')).toBeCloseTo(80 + 32, 6);
  });

  it('in square feet the head is the rows’ square feet as shown', () => {
    const list = listOf(terrace, side);
    const feet = (m2: number) => Math.round(m2 / 0.3048 ** 2);
    expect(Math.round(roofsHeadM2(list, 'imperial') / 0.3048 ** 2)).toBe(feet(80.4) + feet(12.462));
  });
});
