import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofSceneOf } from '../../src/studio/roof-scene-build';
import { box, designOf, FACTS, roofOf, SHED, stairOn, TERRACE } from './roof-meet-support';

/**
 * What each part of the 3D model is made of (`T-M05-002`, part e, roof looks): a sawtooth's or a
 * monitor's glass stands apart from the plaster walls, each roof carries its material's look, and
 * a sloped face says which of its edges is a ridge or a hip, for the caps along them.
 */
const person = { setBy: 'person' } as const;
const shaped = (is: string, more: object = {}) =>
  ({ ...SHED, shape: { is, ...person, ...more } }) as Roof;

describe('the glass and the walls of a sloped roof', () => {
  it('a sawtooth’s glass stands as glass, one pane between each two teeth', () => {
    const scene = roofSceneOf(
      designOf(shaped('sawtooth', { teeth: { count: 3, ...person } })),
      FACTS,
    );
    const glass = scene.walls.filter((wall) => wall.kind === 'glass');
    expect(glass.length).toBeGreaterThanOrEqual(2);
  });

  it('a monitor’s raised sides stand as glass', () => {
    const scene = roofSceneOf(designOf(shaped('monitor')), FACTS);
    expect(scene.walls.some((wall) => wall.kind === 'glass')).toBe(true);
  });

  it('a gable’s end walls are plaster ends, never glass', () => {
    const scene = roofSceneOf(designOf(shaped('gable')), FACTS);
    const ends = scene.walls.filter((wall) => wall.roof === 0);
    expect(ends.length).toBeGreaterThan(0);
    expect(ends.every((wall) => wall.kind === 'end')).toBe(true);
  });
});

describe('each roof’s skin', () => {
  it('a terrace of RCC wears the photo’s family; a metal shed its sheet', () => {
    const scene = roofSceneOf(designOf(TERRACE, SHED), FACTS);
    expect(scene.skins[0]).toMatchObject({ family: 'concrete', photo: true, swatch: null });
    expect(scene.skins[1]).toMatchObject({ family: 'trapezoidal', photo: false, swatch: null });
  });

  it('a design whose flat roofs wear their material has no roof wearing the photo', () => {
    const scene = roofSceneOf({ ...designOf(TERRACE, SHED), flatRoofs: 'material' }, FACTS);
    expect(scene.skins.map((skin) => skin.photo)).toEqual([false, false]);
    expect(scene.skins[0]?.family).toBe('concrete');
  });

  it('a colour a person picked travels with the roof', () => {
    const blue = { ...SHED, colour: { swatch: 'blue', ...person } } as Roof;
    const scene = roofSceneOf(designOf(blue), FACTS);
    expect(scene.skins[0]?.swatch).toBe('blue');
  });

  it('a colour the material is not sold in is left for the system’s', () => {
    const odd = { ...SHED, colour: { swatch: 'terracotta', ...person } } as Roof;
    expect(roofSceneOf(designOf(odd), FACTS).skins[0]?.swatch).toBeNull();
  });

  it('a stair room on the terrace has a skin of its own, in the scene’s roof order', () => {
    const scene = roofSceneOf(designOf(TERRACE, stairOn(box(1, 1, 2, 2))), FACTS);
    expect(scene.skins).toHaveLength(2);
  });
});

describe('a sloped face’s edges', () => {
  it('a gable’s two faces each name the ridge they share', () => {
    const scene = roofSceneOf(designOf(shaped('gable')), FACTS);
    const ridged = scene.faces.filter((face) => face.edges.includes('ridge'));
    expect(ridged).toHaveLength(2);
  });

  it('a hip’s faces name their hips', () => {
    const scene = roofSceneOf(designOf(shaped('hip')), FACTS);
    expect(scene.faces.some((face) => face.edges.includes('hip'))).toBe(true);
  });

  it('a flat roof has no faces to cap', () => {
    const scene = roofSceneOf(designOf(roofOf('flat', box(0, 0, 6, 6))), FACTS);
    expect(scene.faces).toHaveLength(0);
  });
});
