import { describe, expect, it } from 'vitest';
import { IN_FORMATS } from '../../src/format/pack';
import { FORMAT_PACK_SCHEMA } from '../../src/format/pack-schema';
import { IN_ROOF_FACTS, ROOF_FACTS_DEFAULT } from '../../src/format/roof-facts';

/**
 * `T-M05-002`, part e — the market's roof facts. Each has a default in the code, so a pack stored
 * before them still opens, and one that names only some reads the rest from the code.
 */
/** What the store gives back: the row after a JSON round trip. */
const storedFormats = (): Record<string, unknown> => JSON.parse(JSON.stringify(IN_FORMATS));
const read = (roof: unknown) => {
  const { roof: _stored, ...before } = storedFormats();
  return FORMAT_PACK_SCHEMA.safeParse(roof === undefined ? before : { ...before, roof });
};
const roofOf = (roof: unknown) => {
  const parsed = read(roof);
  if (!parsed.success) throw new Error(parsed.error.message);
  return parsed.data.roof;
};

describe('the market’s roof facts', () => {
  it('a pack stored before them reads the code’s own values', () => {
    expect(roofOf(undefined)).toEqual(ROOF_FACTS_DEFAULT);
  });

  it('a pack that names only some reads the rest from the code', () => {
    expect(roofOf({ stairRoomHeightM: 2.4, materialOrder: ['clay_tile'] })).toEqual({
      ...ROOF_FACTS_DEFAULT,
      stairRoomHeightM: 2.4,
      materialOrder: ['clay_tile'],
    });
  });

  it('India reads its own: the 9-inch wall, its first five roof types, a sheet roof at 6°', () => {
    const roof = roofOf(storedFormats().roof);
    expect(roof).toEqual(IN_ROOF_FACTS);
    expect(roof.wallThicknessM).toBe(0.23);
    expect(roof.materialOrder).toEqual([
      'rcc',
      'trapezoidal_sheet',
      'ac_sheet',
      'clay_tile',
      'puf_panel',
    ]);
    expect(roof.firstSlopeDeg.trapezoidal_sheet).toBe(6);
    expect(roof.openShedSlopeDeg).toBe(6);
    expect(roof.setbackM).toBe(0.5);
    expect(roof.clearPathM).toBe(0.75);
  });

  it('a setback for one kind of edge leaves the others on the market’s one setback', () => {
    expect(roofOf({ setbackByEdge: { ridge: 0.45 } }).setbackByEdge).toEqual({
      eave: null,
      ridge: 0.45,
      hipOrValley: null,
      gableEnd: null,
    });
  });

  it.each([
    ['a setback below zero', { setbackM: -0.1 }],
    ['a parapet under a low band', { parapetHeightM: 0.05 }],
    ['a stair room of no height', { stairRoomHeightM: 0 }],
    ['a slope that is a wall', { firstSlopeDeg: { rcc: 90 } }],
    ['a way of measuring it does not know', { setbackMeasure: 'by_eye' }],
  ])('refuses %s', (_why, roof) => {
    expect(read(roof).success).toBe(false);
  });
});
