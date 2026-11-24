import { describe, expect, it } from 'vitest';
import { ringAreaM2 } from '../../src/studio/roof-polygons';
import type { SceneFace, ScenePrism } from '../../src/studio/roof-scene';
import { roofSceneOf } from '../../src/studio/roof-scene-build';
import { box, designOf, FACTS, kindOf, roofOf, TERRACE } from './roof-meet-support';

/**
 * A separate part in 3D (`T-M05-002`, part e, E022): it stands on its own, carved out of the roof
 * round it, so that roof's top never covers it — flat or sloped.
 */
const partsOf = (prisms: readonly ScenePrism[], roof: number, part: ScenePrism['part']) =>
  prisms.filter((prism) => prism.roof === roof && prism.part === part);
/** The ground some faces cover, seen from above: each face less what is cut out of it. */
const planArea = (faces: readonly SceneFace[]) =>
  faces.reduce(
    (sum, face) =>
      sum + ringAreaM2(face.corners) - face.holes.reduce((cut, hole) => cut + ringAreaM2(hole), 0),
    0,
  );

describe('a separate part', () => {
  it('is carved out of a flat roof round it: that roof’s top leaves its ground, with no floor in it', () => {
    const back = kindOf('back', 'separate_part', box(6, 0, 4, 8), {
      partOf: 'terrace',
      height: { metres: 4, setBy: 'person' },
    });
    const scene = roofSceneOf(designOf(TERRACE, back), FACTS);
    const bodies = partsOf(scene.prisms, 0, 'body');
    expect(bodies).toHaveLength(1);
    expect(Math.max(...(bodies[0]?.outer ?? []).map(({ east }) => east))).toBeCloseTo(6, 6);
    expect(partsOf(scene.prisms, 0, 'floor')).toEqual([]);
    expect(partsOf(scene.prisms, 1, 'body')).toMatchObject([{ footM: 0, topM: 4 }]);
  });

  it('is carved out of the sloped faces round it', () => {
    const sheet = { type: 'trapezoidal_sheet', setBy: 'system', confirmed: false } as const;
    const main = roofOf('main', box(0, 0, 12, 8), { material: sheet });
    const part = kindOf('front', 'separate_part', box(5, 0, 2, 2), { partOf: 'main' });
    const plain = roofSceneOf(designOf(main), FACTS);
    const scene = roofSceneOf(designOf(main, part), FACTS);
    const mainNow = planArea(scene.faces.filter((face) => face.roof === 0));
    expect(mainNow).toBeCloseTo(planArea(plain.faces) - 4, 6);
  });
});

describe('a side with its eave raised', () => {
  const gable = (sides?: readonly object[]) =>
    roofOf('house', box(0, 0, 12, 8), {
      material: { type: 'rcc', setBy: 'person', confirmed: true },
      shape: { is: 'gable', setBy: 'person' },
      ...(sides === undefined ? {} : { sides }),
    });

  it('has a wall under it, from the roof’s low edge up to its face, where the walls stand', () => {
    const alongSouth = (scene: typeof raised) =>
      scene.walls.filter((w) => Math.abs(w.from.north - w.to.north) < 1e-6 && w.from.north < 4);
    const plain = roofSceneOf(designOf(gable()), FACTS);
    const raised = roofSceneOf(designOf(gable([{ eaveM: 1 }, {}, {}, {}])), FACTS);
    expect(alongSouth(plain)).toEqual([]);
    const [wall, ...more] = alongSouth(raised);
    expect(more).toEqual([]);
    const lowEdge = raised.levels[0]?.topM ?? 0;
    expect(wall?.footM).toBeCloseTo(lowEdge, 6);
    // The wall line stands the overhang in from the south side, under the face, above the raised eave.
    expect(wall?.from.north).toBeCloseTo(FACTS.overhangM, 6);
    expect(Math.min(wall?.fromTopM ?? 0, wall?.toTopM ?? 0)).toBeGreaterThan(lowEdge + 1);
  });
});
