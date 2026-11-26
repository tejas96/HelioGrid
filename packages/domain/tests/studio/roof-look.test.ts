import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofSkinOf } from '../../src/studio/roof-look';
import {
  nearestSwatch,
  PHOTO_READ_MOST,
  PHOTO_RIM_M,
  photoReadPoints,
} from '../../src/studio/roof-look-colour';
import type { RoofSwatch } from '../../src/studio/roof-look-kinds';
import { box, roofOf } from './roof-meet-support';

/**
 * A roof's look (`T-M05-002`, part e, roof looks): which roofs wear the sky photo, what an `other`
 * roof looks like, when a person's colour holds, and which colour a photo's reading lands on.
 */
const person = { setBy: 'person' } as const;
const system = { setBy: 'system' } as const;
const made = (type: string, more: object = {}): Roof =>
  roofOf('r', box(0, 0, 6, 6), { material: { type, ...system, confirmed: false, ...more } });

describe('which roofs wear the photo', () => {
  it.each([
    ['rcc', true],
    ['brick_terrace', true],
    ['stone_slab', true],
    ['membrane', true],
    ['gravel_built_up', true],
    ['roof_garden', true],
    ['tiles_on_rcc', false],
    ['trapezoidal_sheet', false],
    ['clay_tile', false],
    ['glass', false],
    ['other', false],
  ] as const)('%s → %s', (type, photo) => {
    expect(roofSkinOf(made(type)).photo).toBe(photo);
  });

  it('a roof with no material stored is RCC: it wears the photo', () => {
    expect(roofSkinOf(roofOf('r', box(0, 0, 6, 6)))).toMatchObject({
      family: 'concrete',
      photo: true,
    });
  });

  it('a material name from a later build is read as `other`: a plain cover', () => {
    expect(roofSkinOf(made('bamboo_mat')).family).toBe('membrane');
  });
});

describe('an `other` roof looks like what it is fixed like', () => {
  it.each([
    ['concrete', 'concrete', true],
    ['metal', 'trapezoidal', false],
    ['tile', 'tile', false],
    ['cement', 'cement_sheet', false],
    ['cover', 'membrane', false],
  ] as const)('fixed like %s → %s', (fixedLike, family, photo) => {
    expect(roofSkinOf(made('other', { fixedLike }))).toMatchObject({ family, photo });
  });

  it('fixed like nothing this build knows → a plain cover', () => {
    expect(roofSkinOf(made('other', { fixedLike: 'rope' })).family).toBe('membrane');
  });
});

describe('a person’s colour', () => {
  it.each([
    ['a colour the sheet is sold in holds', 'trapezoidal_sheet', 'green', person, 'green'],
    ['a colour the tile is not sold in is left', 'clay_tile', 'blue', person, null],
    ['a colour this build does not know is left', 'trapezoidal_sheet', 'teal', person, null],
    ['a colour the system set is never a pick', 'trapezoidal_sheet', 'green', system, null],
  ] as const)('%s', (_why, type, swatch, by, held) => {
    const roof = { ...made(type), colour: { swatch, ...by } } as Roof;
    expect(roofSkinOf(roof).swatch).toBe(held);
  });

  it('with none picked, the look’s start is its colour where there is no photo', () => {
    expect(roofSkinOf(made('corrugated_gi'))).toMatchObject({ swatch: null, start: 'galvanised' });
  });
});

describe('the colour a photo’s reading lands on', () => {
  const sheet: { swatch: RoofSwatch; hex: string }[] = [
    { swatch: 'white', hex: '#E9E9E4' },
    { swatch: 'blue', hex: '#3F6F9F' },
    { swatch: 'charcoal', hex: '#4A5058' },
  ];
  it.each([
    ['a near-white roof (the Sangli shed)', { r: 229, g: 229, b: 220 }, 'white'],
    ['a faded blue', { r: 90, g: 120, b: 150 }, 'blue'],
    ['a dark roof in shade', { r: 60, g: 62, b: 66 }, 'charcoal'],
    ['pure black lands on the darkest', { r: 0, g: 0, b: 0 }, 'charcoal'],
  ] as const)('%s → %s', (_why, read, swatch) => {
    expect(nearestSwatch(read, sheet)).toBe(swatch);
  });

  it('with no colours to pick from, none', () => {
    expect(nearestSwatch({ r: 128, g: 128, b: 128 }, [])).toBeNull();
  });
});

describe('where a roof’s colour is read off the photo', () => {
  const nearestSide = (point: { east: number; north: number }, side: number) =>
    Math.min(point.east, point.north, side - point.east, side - point.north);

  it.each([
    ['a 6 m square keeps its rim clear', 6, true],
    ['a 1.2 m square keeps its rim clear', 1.2, true],
    ['a roof narrower than its rim is read across its whole inside', 0.8, false],
  ] as const)('%s', (_why, side, rimmed) => {
    const points = photoReadPoints(box(0, 0, side, side));
    expect(points.length).toBeGreaterThan(0);
    const rimKept = points.every((point) => nearestSide(point, side) >= PHOTO_RIM_M - 1e-9);
    expect(rimKept).toBe(rimmed);
  });

  it.each([
    ['a house', 10],
    ['a 120 m factory shed', 120],
  ])('%s is read at no more than the most points', (_why, side) => {
    expect(photoReadPoints(box(0, 0, side, side)).length).toBeLessThanOrEqual(PHOTO_READ_MOST);
  });

  it('an outline of fewer than three corners has nowhere to read', () => {
    expect(photoReadPoints(box(0, 0, 4, 4).slice(0, 2))).toEqual([]);
  });

  it('an L reads inside its own arms only', () => {
    const ell = [
      { east: 0, north: 0 },
      { east: 6, north: 0 },
      { east: 6, north: 2 },
      { east: 2, north: 2 },
      { east: 2, north: 6 },
      { east: 0, north: 6 },
    ];
    const points = photoReadPoints(ell);
    expect(points.some((point) => point.east > 2 && point.north > 2)).toBe(false);
  });
});
