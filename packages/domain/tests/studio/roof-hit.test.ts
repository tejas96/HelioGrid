import { describe, expect, it } from 'vitest';
import type { StudioDocument } from '../../src/studio/document';
import type { GroundPoint } from '../../src/studio/ground';
import { roofHitOf } from '../../src/studio/roof-hit';
import { roofSceneOf } from '../../src/studio/roof-scene-build';
import { roofsWorked } from '../../src/studio/roof-worked';
import { box, designOf, FACTS, kindOf, stairOn, TERRACE } from './roof-meet-support';
import { shaped } from './roof-sheet-support';

/**
 * A tap on the 3D model (`T-M05-002`, part e): the nearest thing the line of sight meets — a
 * roof's top, a sloped face, a side (its wall, or its edge within reach) or a ridge.
 */
const REACH_M = 0.3;

const hitOf = (
  design: StudioDocument,
  at: (h: number) => GroundPoint | null,
  open: number | null = null,
) => {
  const worked = roofsWorked(design, FACTS, 18.5);
  const scene = roofSceneOf(design, FACTS, worked);
  // The same line of sight a finger's half-width east: the reach, wherever it meets the model.
  const beside = (h: number) => {
    const point = at(h);
    return point === null ? null : { east: point.east + REACH_M, north: point.north };
  };
  return roofHitOf(design, scene, worked, FACTS, at, beside, open);
};
/** A camera this high: a height above it is behind it, and reads nothing. */
const under = (cameraM: number, at: (h: number) => GroundPoint | null) => (h: number) =>
  h > cameraM ? null : at(h);
/** Straight down onto a point. */
const down = (east: number, north: number) => () => ({ east, north });
/** From the south, low, toward the north: the line of sight meets a south wall `rise` m up. */
const fromSouth = (east: number, rise: number) => (h: number) => ({ east, north: rise - h });

describe('a tap on the 3D model', () => {
  it.each([
    ['the middle of a flat roof is the roof', down(5, 4), { kind: 'roof', roof: 0 }],
    ['near its south edge is that side', down(5, 0.2), { kind: 'side', roof: 0, side: 0 }],
    ['near its east edge is that side', down(9.8, 4), { kind: 'side', roof: 0, side: 1 }],
    ['past reach of an edge is the roof', down(5, 0.4), { kind: 'roof', roof: 0 }],
    ['off every roof is nothing', down(20, 20), null],
  ])('%s', (_why, at, hit) => {
    expect(hitOf(designOf(TERRACE), at)).toEqual(hit);
  });

  it('its wall, seen from the south, is its south side', () => {
    expect(hitOf(designOf(TERRACE), fromSouth(5, 1))).toEqual({ kind: 'side', roof: 0, side: 0 });
  });

  it('a stair room standing on the roof is met before the roof under it', () => {
    const design = designOf(TERRACE, stairOn(box(1, 1, 3, 3)));
    expect(hitOf(design, down(2.5, 2.5))).toEqual({ kind: 'roof', roof: 1 });
  });

  it('a gable: a face away from the ridge, the ridge on its line', () => {
    // A 12 × 8 gable: its ridge runs east to west along the middle, north = 4.
    const gable = designOf(shaped('gable'));
    expect(hitOf(gable, down(6, 2))).toEqual({ kind: 'face', roof: 0 });
    expect(hitOf(gable, down(6, 4.1))).toEqual({ kind: 'ridge', roof: 0 });
  });

  it.each([
    ['a camera low over the roofs, as a side view’s, still meets its wall', 8],
    ['a camera just over the tallest roof still meets it', 4],
  ])('%s', (_why, cameraM) => {
    expect(hitOf(designOf(TERRACE), under(cameraM, fromSouth(5, 1)))).toEqual({
      kind: 'side',
      roof: 0,
      side: 0,
    });
  });

  it('a camera below the roof’s top, looking up at its wall, meets that wall', () => {
    // From 1 m up, 3 m south of the terrace, looking up and north: the south wall, 2.5 m up.
    const up = (h: number) => (h < 1 ? null : { east: 5, north: -3 + (h - 1) * 2 });
    expect(hitOf(designOf(TERRACE), up)).toEqual({ kind: 'side', roof: 0, side: 0 });
  });

  it('the reach is a finger’s width where the tap meets the roof, not high above it', () => {
    const design = designOf(TERRACE);
    const worked = roofsWorked(design, FACTS, 18.5);
    const scene = roofSceneOf(design, FACTS, worked);
    // Seen in perspective: a finger spans 0.3 m at the roof, nothing far above it.
    const at = down(5, 0.2);
    const beside = (h: number) => ({ east: 5 + (h < 10 ? REACH_M : 0), north: 0.2 });
    expect(roofHitOf(design, scene, worked, FACTS, at, beside)).toEqual({
      kind: 'side',
      roof: 0,
      side: 0,
    });
  });

  it('a parapet that climbs a gable end is met high up, where it stands', () => {
    const walled = [{ parapet: true }, { parapet: true }, { parapet: true }, { parapet: true }];
    const design = designOf(shaped('gable', { sides: walled }));
    const low = roofSceneOf(design, FACTS, roofsWorked(design, FACTS, 18.5)).levels[0]?.topM ?? 0;
    // From the west, gently down, a quarter along the end: its parapet stands 0.9 to 1.9 m over the
    // low edge there, and is met 1.4 m up, above where a level parapet would stop.
    const level = low + 1.5;
    const hit = hitOf(design, (h) => ({ east: -1 + (level - h) * 10, north: 2.5 }));
    expect(hit).toEqual({ kind: 'side', roof: 0, side: 3 });
  });

  it('a second tap on the open roof’s top picks the roof under it', () => {
    const design = designOf(TERRACE, stairOn(box(1, 1, 3, 3)));
    expect(hitOf(design, down(2.5, 2.5), 1)).toEqual({ kind: 'roof', roof: 0 });
    // With nothing under it, the open roof stays.
    expect(hitOf(designOf(TERRACE), down(5, 4), 0)).toEqual({ kind: 'roof', roof: 0 });
  });

  it('a hole’s wall is the hole’s side, not the roof’s', () => {
    const duct = kindOf('duct', 'hole', box(4, 3, 2, 2), { partOf: 'terrace' });
    // Steep, down through the duct's open top onto its south wall, at north 3.
    const hit = hitOf(designOf(TERRACE, duct), (h) => ({ east: 5, north: 2.9 + 0.2 * h }));
    expect(hit).toMatchObject({ kind: 'side', roof: 1 });
  });

  it('a hole across the roof’s edge: its wall is still the hole’s side', () => {
    const duct = kindOf('duct', 'hole', box(9, 3, 2, 2), { partOf: 'terrace' });
    // Steep, down through the duct's open top onto its west wall, at east 9.
    const hit = hitOf(designOf(TERRACE, duct), (h) => ({ east: 8.9 + 0.2 * h, north: 4 }));
    expect(hit).toEqual({ kind: 'side', roof: 1, side: 3 });
  });

  it('nothing is met behind the camera', () => {
    expect(hitOf(designOf(TERRACE), () => null)).toBeNull();
  });
});
