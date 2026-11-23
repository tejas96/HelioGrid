import { describe, expect, it } from 'vitest';
import { REQUEST_BODY_MAX_BYTES, saveDocumentSchema, studioDocumentSchema } from '../src';

/**
 * What part e stores on a roof (`T-M05-002`, part e), read one release before any studio writes
 * it: a design that carries the new fields reads back as sent, so a studio of this release saves
 * them as it found them; a design from before them carries none; and a link that cannot hold is
 * never stored.
 */
const OLD = { schemaVersion: 1, picture: null, drawnOn: null, pictureScale: 1 };
const ID = (n: number) => `6f1e8c2a-0b7d-4c35-9a51-${String(n).padStart(12, '0')}`;
const square = (west: number, south: number, side: number) => [
  { east: west, north: south },
  { east: west + side, north: south },
  { east: west + side, north: south + side },
  { east: west, north: south + side },
];
const roofAt = (n: number, west = 0, south = 0, side = 8) => ({
  id: ID(n),
  corners: square(west, south, side),
  edges: ['traced', 'traced', 'traced', 'traced'],
  tracedOn: 'sky',
  height: null,
});
const PERSON = { setBy: 'person' };
const SYSTEM = { setBy: 'system' };

/** Everything one side can hold of its own. */
const FULL_SIDE = {
  parapet: true,
  parapetM: 1.55,
  parapetBuild: 'railing',
  setbackM: 0.25,
  slopeDeg: 22.5,
  eaveM: 3.25,
  end: 'hip',
  overhangM: 0.45,
  tier: 'measured',
  low: 'system',
  glass: 'person',
  stairsAt: 1.25,
  stairsBy: 'system',
};

/** A roof holding every field part e stores. */
const fullRoof = (n: number, on: number) => ({
  ...roofAt(n, 2, 2, 3),
  height: { metres: 3, ...SYSTEM, tier: 'derived' },
  kind: { is: 'stair_room', ...SYSTEM },
  on: ID(on),
  partOf: ID(on),
  material: {
    type: 'other',
    name: 'Kota stone on steel',
    fixedLike: 'metal',
    ...PERSON,
    confirmed: true,
  },
  shape: {
    is: 'mansard',
    ...PERSON,
    turned: true,
    teeth: { count: 4, ...PERSON },
    upperSlope: { degrees: 25, ...PERSON },
    breakIn: { metres: 0.6, ...SYSTEM },
    raisedHeight: { metres: 1.2, ...SYSTEM },
    raisedWidth: { metres: 2, ...SYSTEM },
    valleyAt: { share: 0.5, ...SYSTEM },
  },
  slope: { degrees: 60, ...PERSON },
  overhang: { metres: 0.5, ...SYSTEM },
  parapet: {
    allRound: true,
    metres: 1,
    ...SYSTEM,
    build: 'wall',
    thickness: { metres: 0.23, ...SYSTEM },
    lengthsMeasured: 'inside',
  },
  setback: { metres: 0.5, ...SYSTEM },
  sides: [FULL_SIDE, {}, {}, { parapet: false }],
});

const withRoofs = (...roofs: unknown[]) => ({ ...OLD, roofs });
const reads = (document: unknown) => studioDocumentSchema.safeParse(document).success;

describe('what part e stores on a roof, on the wire', () => {
  it('a roof with every new field reads back as sent, so a save keeps what it found', () => {
    const sent = { ...withRoofs(roofAt(1), fullRoof(2, 1)), stairsSkipped: true };
    expect(studioDocumentSchema.parse(sent)).toEqual(sent);
  });

  it('a design saved before part e reads with none of its fields', () => {
    const read = studioDocumentSchema.parse(withRoofs(roofAt(1)));
    expect(Object.keys(read)).not.toContain('stairsSkipped');
    expect(Object.keys(read.roofs[0] ?? {}).sort()).toEqual(
      ['corners', 'edges', 'height', 'id', 'tracedOn'].sort(),
    );
  });

  it.each([
    ['a kind a later studio adds', { kind: { is: 'carport', ...PERSON } }],
    [
      'a material a later studio adds',
      { material: { type: 'bamboo_mat', ...SYSTEM, confirmed: false } },
    ],
    ['a shape a later studio adds', { shape: { is: 'barrel_vault', ...SYSTEM } }],
  ])('%s is kept as it came', (_why, later) => {
    const sent = withRoofs({ ...roofAt(1), ...later });
    expect(studioDocumentSchema.parse(sent)).toEqual(sent);
  });

  it.each([
    ['a kind that is not a plain word', { kind: { is: 'Stair Room', ...PERSON } }],
    ['a kind with no setter', { kind: { is: 'hole' } }],
    [
      'a material with no word on whether it was confirmed',
      { material: { type: 'rcc', ...SYSTEM } },
    ],
    [
      'a typed material name past 60 letters',
      { material: { type: 'other', name: 'x'.repeat(61), ...PERSON, confirmed: true } },
    ],
    [
      'a value of a tier it does not know',
      { setback: { metres: 0.5, ...SYSTEM, tier: 'guessed' } },
    ],
    ['a setback below zero', { setback: { metres: -0.01, ...PERSON } }],
    ['a slope of 90°', { slope: { degrees: 90, ...PERSON } }],
    ['a side list shorter than the corners', { sides: [{}, {}, {}] }],
    ['a side list longer than the corners', { sides: [{}, {}, {}, {}, {}] }],
    ['a side with a field it does not know', { sides: [{ gutter: true }, {}, {}, {}] }],
    ['a roof standing on itself', { on: ID(1) }],
    ['a roof that is part of itself', { partOf: ID(1) }],
    ['a roof standing on a roof the design does not hold', { on: ID(9) }],
    ['a roof that is part of a roof the design does not hold', { partOf: ID(9) }],
  ])('refuses %s', (_why, bad) => {
    expect(reads(withRoofs({ ...roofAt(1), ...bad }))).toBe(false);
  });

  it.each([
    ['a parapet of 0.09 m', 0.09, false],
    ['a low band of 0.1 m', 0.1, true],
    ['a wall of 3 m', 3, true],
    ['a wall of 3.01 m', 3.01, false],
  ])('%s reads: %s', (_why, metres, ok) => {
    const parapet = { allRound: true, metres, ...PERSON };
    expect(reads(withRoofs({ ...roofAt(1), parapet }))).toBe(ok);
  });

  it.each([
    ['two roofs standing on each other', 'on'],
    ['two roofs each part of the other', 'partOf'],
  ] as const)('refuses %s', (_why, link) => {
    const ring = withRoofs({ ...roofAt(1), [link]: ID(2) }, { ...roofAt(2), [link]: ID(1) });
    expect(reads(ring)).toBe(false);
  });

  it('refuses a ring of three, and reads the same three standing in a row', () => {
    const row = [roofAt(1), { ...roofAt(2), on: ID(1) }, { ...roofAt(3), on: ID(2) }];
    expect(reads(withRoofs(...row))).toBe(true);
    expect(reads(withRoofs({ ...roofAt(1), on: ID(3) }, row[1], row[2]))).toBe(false);
  });

  it.each([
    [200, true],
    [201, false],
  ])('a design of %s roofs reads: %s', (count, ok) => {
    const roofs = Array.from({ length: count }, (_, i) =>
      roofAt(i + 1, (i % 20) * 10, Math.floor(i / 20) * 10),
    );
    expect(reads(withRoofs(...roofs))).toBe(ok);
  });

  /** A ring of corners round a circle, in order: its edges never cross. */
  const ring = (n: number, count: number, sides: unknown) => ({
    id: ID(n),
    corners: Array.from({ length: count }, (_, i) => ({
      // To the centimetre, at the far edge of the site's reach: the longest a corner is written.
      east: -1_900 + Math.round(1_000 * Math.cos((2 * Math.PI * i) / count)) / 100 - 0.01,
      north: -1_900 + Math.round(1_000 * Math.sin((2 * Math.PI * i) / count)) / 100 - 0.01,
    })),
    edges: Array.from({ length: count }, () => 'measured'),
    tracedOn: 'none',
    height: null,
    ...(sides === null ? {} : { sides: Array.from({ length: count }, () => sides) }),
  });

  it.each([
    [2_000, true],
    [2_001, false],
  ])('a design of %s corners in all reads: %s', (corners, ok) => {
    const roofs = Array.from({ length: 19 }, (_, i) => ring(i + 1, 100, null));
    const last = ring(21, corners - 2_000 + 3, null);
    expect(reads(withRoofs(...roofs, ring(20, 97, null), last))).toBe(ok);
  });

  it('a design at every cap at once — 200 roofs, 2,000 corners, every roof and every side holding all it can — is a save the api reads', () => {
    const {
      corners: _c,
      edges: _e,
      sides: _s,
      id: _i,
      tracedOn: _t,
      height,
      shape,
      ...full
    } = fullRoof(2, 1);
    const roofs = Array.from({ length: 200 }, (_, i) => ({
      ...ring(i + 1, 10, FULL_SIDE),
      ...full,
      height,
      shape,
      material: { ...full.material, name: 'x'.repeat(60) },
      on: ID(i === 0 ? 2 : 1),
      partOf: ID(i === 0 ? 3 : 1),
    }));
    // Roof 1 cannot stand on a roof that stands on it: it stands on the ground here.
    const { on: _on, partOf: _part, ...first } = roofs[0] as (typeof roofs)[number];
    const body = { baseVersion: 0, opening: ID(0), document: withRoofs(first, ...roofs.slice(1)) };
    expect(saveDocumentSchema.safeParse(body).success).toBe(true);
    expect(new TextEncoder().encode(JSON.stringify(body)).length).toBeLessThan(
      REQUEST_BODY_MAX_BYTES,
    );
  });
});
