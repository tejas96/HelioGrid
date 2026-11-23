import { describe, expect, it } from 'vitest';
import { ringAreaM2 } from '../../src/studio/roof-polygons';
import type { SceneFace } from '../../src/studio/roof-scene';
import { roofSceneOf } from '../../src/studio/roof-scene-build';
import { box, designOf, FACTS, kindOf, roofOf } from './roof-meet-support';

/**
 * Two sloped roofs that meet (`T-M05-002`, part e, E083): a lower one run into a higher one is cut
 * into its faces, and over the ground both cover the higher surface is the roof.
 */
const sheet = {
  material: { type: 'trapezoidal_sheet', setBy: 'system', confirmed: false },
} as const;
const HOUSE = roofOf('house', box(0, 0, 12, 8), sheet);
const planArea = (faces: readonly SceneFace[]) =>
  faces.reduce(
    (sum, face) =>
      sum + ringAreaM2(face.corners) - face.holes.reduce((cut, hole) => cut + ringAreaM2(hole), 0),
    0,
  );

describe('two sloped roofs that meet', () => {
  it('a lower porch gable run into the house roof is cut into it: the two cover their ground once', () => {
    // A 3 × 5 m porch, 1 m of it under the house's south slope, half a metre lower.
    const porch = roofOf('porch', box(4, -4, 3, 5), {
      ...sheet,
      shape: { is: 'gable', setBy: 'person' },
      height: { metres: 2.5, setBy: 'person' },
    });
    const scene = roofSceneOf(designOf(HOUSE, porch), FACTS);
    const of = (roof: number) => planArea(scene.faces.filter((face) => face.roof === roof));
    // The house's 96 m² and the porch's 12 m² outside it: the 3 m² both cover is counted once.
    expect(of(0) + of(1)).toBeCloseTo(96 + 12, 6);
    expect(of(1)).toBeLessThan(15);
  });

  it('a sloped open shed standing on the house roof leaves the house roof whole under it', () => {
    const shed = kindOf('shed', 'open_shed', box(2, 2, 4, 4), {
      ...sheet,
      on: 'house',
      shape: { is: 'gable', setBy: 'person' },
    });
    const scene = roofSceneOf(designOf(HOUSE, shed), FACTS);
    expect(planArea(scene.faces.filter((face) => face.roof === 0))).toBeCloseTo(96, 6);
  });

  it('two sloped roofs that only touch are left whole', () => {
    const next = roofOf('next', box(12, 0, 6, 8), sheet);
    const scene = roofSceneOf(designOf(HOUSE, next), FACTS);
    const of = (roof: number) => planArea(scene.faces.filter((face) => face.roof === roof));
    expect(of(0)).toBeCloseTo(96, 6);
    expect(of(1)).toBeCloseTo(48, 6);
  });
});
