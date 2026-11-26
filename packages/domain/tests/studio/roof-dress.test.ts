import { describe, expect, it } from 'vitest';
import type { Rgb } from '../../src/format/hex-colour';
import type { Roof } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { type PhotoReader, roofDressesOf } from '../../src/studio/roof-dress';
import { ROOF_SWATCHES, type RoofSwatch } from '../../src/studio/roof-look-kinds';
import { roofSceneOf } from '../../src/studio/roof-scene-build';
import { designOf, FACTS, SHED, TERRACE } from './roof-meet-support';

/**
 * What each roof wears (`T-M05-002`, part e, roof looks): the photo where it is true and covers
 * the roof whole, else the material in a person's colour, the photo's own, or the material's first.
 * The terrace lies 0–10 m east, the shed 10–14 m.
 */
const GREY = '#808080';
const COLOURS = {
  ...Object.fromEntries(ROOF_SWATCHES.map((swatch) => [swatch, GREY])),
  white: '#E9E9E4',
  blue: '#3F6F9F',
  charcoal: '#4A5058',
} as Record<RoofSwatch, string>;

/** A picture that lies from the pin east to `eastM`, and reads one colour everywhere. */
const pictureTo = (
  eastM: number,
  colour: Rgb | null = { r: 229, g: 229, b: 220 },
): PhotoReader => ({
  covers: (point: GroundPoint) => point.east <= eastM,
  read: (points) => (points.length === 0 ? null : colour),
});
const dressesOf = (roofs: Roof[], picture: PhotoReader | null, coming = false) =>
  roofDressesOf(roofSceneOf(designOf(...roofs), FACTS), picture, coming, COLOURS).roofs;
const facesOf = (roof: Roof, picture: PhotoReader | null) =>
  roofDressesOf(roofSceneOf(designOf(roof), FACTS), picture, false, COLOURS).facesWearPhoto;
const person = { setBy: 'person' } as const;

describe('a roof the photo shows true', () => {
  it.each([
    ['the picture covers it whole: the photo', pictureTo(20), false, true],
    ['the picture stops inside it: its material', pictureTo(6), false, false],
    ['no picture, one on its way: the photo, plain until it comes', null, true, true],
    ['no picture at all: its material', null, false, false],
  ] as const)('%s', (_why, picture, coming, photo) => {
    expect(dressesOf([TERRACE], picture, coming)[0]?.photo).toBe(photo);
  });

  it('wearing its material, RCC is concrete', () => {
    expect(dressesOf([TERRACE], null)[0]).toMatchObject({ family: 'concrete', swatch: 'concrete' });
  });
});

describe('a metal shed’s colour', () => {
  it.each([
    ['the photo reads near-white: white', pictureTo(20), 'white'],
    ['the photo reads a faded blue: blue', pictureTo(20, { r: 90, g: 120, b: 150 }), 'blue'],
    ['the photo cannot be read: the sheet’s first colour', pictureTo(20, null), 'blue'],
    ['the picture stops short of it: the sheet’s first colour', pictureTo(12), 'blue'],
    ['no picture: the sheet’s first colour', null, 'blue'],
  ] as const)('%s', (_why, picture, swatch) => {
    const [, shed] = dressesOf([TERRACE, SHED], picture);
    expect(shed).toMatchObject({ photo: false, family: 'trapezoidal', swatch });
  });

  it('a person’s pick wins over the photo', () => {
    const picked = { ...SHED, colour: { swatch: 'charcoal', ...person } } as Roof;
    expect(dressesOf([picked], pictureTo(20))[0]?.swatch).toBe('charcoal');
  });

  it('it carries its pattern’s size and its cap', () => {
    expect(dressesOf([SHED], null)[0]).toMatchObject({
      repeatM: [1, 1],
      cap: 'folded',
      seeThrough: false,
    });
  });
});

describe('a sloped RCC roof’s faces', () => {
  const sloped = (slopeDeg: number) =>
    ({
      ...TERRACE,
      shape: { is: 'gable', ...person },
      slope: { degrees: slopeDeg, ...person },
    }) as Roof;

  it.each([
    ['a 30° gable wears the photo on both faces', 30, true],
    ['a 45° gable still does', 45, true],
    ['a 50° gable is too steep: both faces wear concrete', 50, false],
  ] as const)('%s', (_why, slopeDeg, photo) => {
    const faces = facesOf(sloped(slopeDeg), pictureTo(20));
    expect(faces.length).toBeGreaterThan(0);
    expect(faces.every((wears) => wears === photo)).toBe(true);
  });

  it('with no picture, no face wears the photo', () => {
    expect(facesOf(sloped(30), null).some(Boolean)).toBe(false);
  });

  it('a metal shed’s faces never wear the photo', () => {
    expect(
      facesOf({ ...SHED, shape: { is: 'gable', ...person } } as Roof, pictureTo(20)).some(Boolean),
    ).toBe(false);
  });
});
