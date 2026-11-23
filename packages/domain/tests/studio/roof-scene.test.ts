import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import type { SceneFace, ScenePrism } from '../../src/studio/roof-scene';
import { roofSceneOf } from '../../src/studio/roof-scene-build';
import {
  box,
  designOf,
  FACTS,
  kindOf,
  p,
  roofOf,
  SHED,
  stairOn,
  TERRACE,
} from './roof-meet-support';

/**
 * The 3D model of many roofs (`T-M05-002`, part e): every height is counted from the ground, so a
 * roof on another stands on its top; a hole is open down to the floor below; an open shed stands
 * on posts; a sloped roof wears faces; parapets stand only where a side has a wall.
 */
const STAIR = stairOn(box(0, 0, 3, 3));
const partsOf = (prisms: readonly ScenePrism[], roof: number, part: ScenePrism['part']) =>
  prisms.filter((prism) => prism.roof === roof && prism.part === part);
const person = { setBy: 'person' } as const;

describe('where each roof stands', () => {
  const scene = roofSceneOf(designOf(TERRACE, STAIR), FACTS);

  it('the terrace stands on the ground, a storey high', () => {
    expect(scene.levels[0]).toEqual({ footM: 0, topM: 3 });
    expect(partsOf(scene.prisms, 0, 'body')).toMatchObject([{ footM: 0, topM: 3, top: 'roof' }]);
  });

  it('the stair room stands on the terrace’s top, not on the ground: it is not stretched', () => {
    expect(scene.levels[1]).toEqual({ footM: 3, topM: 6 });
    expect(partsOf(scene.prisms, 1, 'body')).toMatchObject([{ footM: 3, topM: 6 }]);
  });

  it('a taller terrace lifts the stair room with it', () => {
    const tall = { ...TERRACE, height: { metres: 6, ...person } } as Roof;
    expect(roofSceneOf(designOf(tall, STAIR), FACTS).levels[1]).toEqual({ footM: 6, topM: 9 });
  });

  it('a room on the stair room stands on the stair room', () => {
    const tank = kindOf('tank', 'upper_floor', box(1, 1, 1, 1), { on: 'stair' });
    expect(roofSceneOf(designOf(TERRACE, STAIR, tank), FACTS).levels[2]?.footM).toBe(6);
  });
});

describe('a hole', () => {
  const duct = kindOf('duct', 'hole', box(4, 3, 1, 1), { partOf: 'terrace' });

  it('is cut through the roof’s top and walls, open down to the ground under a one-storey roof', () => {
    const scene = roofSceneOf(designOf(TERRACE, duct), FACTS);
    const [body] = partsOf(scene.prisms, 0, 'body');
    expect(body?.holes).toHaveLength(1);
    expect(body?.holes[0]).toHaveLength(4);
    expect(partsOf(scene.prisms, 0, 'floor')).toEqual([]);
    expect(partsOf(scene.prisms, 1, 'body')).toEqual([]);
  });

  it('in a two-storey roof it is open down to the floor a storey below, which is drawn', () => {
    const tall = { ...TERRACE, height: { metres: 6, ...person } } as Roof;
    const scene = roofSceneOf(designOf(tall, duct), FACTS);
    expect(partsOf(scene.prisms, 0, 'floor')).toMatchObject([{ footM: 0, topM: 3 }]);
    expect(scene.levels[1]).toEqual({ footM: 6, topM: 6 });
  });

  it('its parapet follows the roof’s and stands round it on the roof, at the roof’s top', () => {
    const scene = roofSceneOf(designOf(TERRACE, duct), FACTS);
    const walls = partsOf(scene.prisms, 1, 'parapet');
    expect(walls).toHaveLength(4);
    expect(walls.every((wall) => wall.footM === 3 && wall.topM === 4)).toBe(true);
    // On the roof, never over the opening: no wall's middle lies inside the hole.
    const middleOf = (wall: ScenePrism) => ({
      east: wall.outer.reduce((sum, at) => sum + at.east, 0) / wall.outer.length,
      north: wall.outer.reduce((sum, at) => sum + at.north, 0) / wall.outer.length,
    });
    const inHole = (at: { east: number; north: number }) =>
      at.east > 4 && at.east < 5 && at.north > 3 && at.north < 4;
    expect(walls.map(middleOf).some(inHole)).toBe(false);
  });
});

describe('parapets', () => {
  it('a flat concrete roof has one on each side, 1 m high and a wall thick, inside its outline', () => {
    const walls = partsOf(roofSceneOf(designOf(TERRACE), FACTS).prisms, 0, 'parapet');
    expect(walls).toHaveLength(4);
    expect(walls[0]).toMatchObject({ footM: 3, topM: 4, top: 'plain' });
    const norths = walls[0]?.outer.map((at) => at.north) ?? [];
    expect(Math.min(...norths)).toBe(0);
    expect(Math.max(...norths)).toBeCloseTo(FACTS.wallThicknessM, 9);
  });

  it('measured inside the walls, the outline is the wall’s inner face: it stands outside', () => {
    const inside = {
      ...TERRACE,
      parapet: { allRound: true, metres: 1, lengthsMeasured: 'inside', ...person },
    } as Roof;
    const [south] = partsOf(roofSceneOf(designOf(inside), FACTS).prisms, 0, 'parapet');
    expect(Math.min(...(south?.outer.map((at) => at.north) ?? []))).toBeCloseTo(
      -FACTS.wallThicknessM,
      9,
    );
  });

  it('a side a person took the wall off has none; the others keep theirs', () => {
    const open = { ...TERRACE, sides: [{ parapet: false }, {}, { parapetM: 1.5 }, {}] } as Roof;
    const walls = partsOf(roofSceneOf(designOf(open), FACTS).prisms, 0, 'parapet');
    expect(walls.map((wall) => wall.topM)).toEqual([4, 4.5, 4]);
  });

  it('the side under the stair room’s wall is split: a wall only where the roof is open', () => {
    const walls = partsOf(roofSceneOf(designOf(TERRACE, STAIR), FACTS).prisms, 0, 'parapet');
    const south = walls.filter((wall) => wall.outer.every((at) => at.north < 1));
    expect(south).toHaveLength(1);
    expect(Math.min(...(south[0]?.outer.map((at) => at.east) ?? []))).toBe(3);
  });

  it('a railing is posts and a rail, never a wall', () => {
    const railed = {
      ...TERRACE,
      parapet: { allRound: true, metres: 1, build: 'railing', ...person },
    } as Roof;
    const prisms = roofSceneOf(designOf(railed), FACTS).prisms;
    expect(partsOf(prisms, 0, 'parapet')).toEqual([]);
    const rails = partsOf(prisms, 0, 'rail');
    // A post at each end and each 1.5 m at most between: 8 on a 10 m side, 7 on an 8 m one.
    expect(rails.filter((rail) => rail.footM === 3)).toHaveLength(8 + 7 + 8 + 7);
    const tops = rails.filter((rail) => rail.footM > 3);
    expect(tops).toHaveLength(4);
    expect(tops.every((rail) => rail.topM === 4)).toBe(true);
  });

  it('at the inner corner of an L the two walls meet with no notch', () => {
    const l = roofOf('l', [p(0, 0), p(10, 0), p(10, 4), p(4, 4), p(4, 8), p(0, 8)]);
    const walls = partsOf(roofSceneOf(designOf(l), FACTS).prisms, 0, 'parapet');
    // The wall along the side that ends at the inner corner (4, 4) runs on a wall's thickness.
    const into = walls.find((wall) => wall.outer.every((at) => Math.abs(at.north - 4) < 0.5));
    expect(Math.min(...(into?.outer.map((at) => at.east) ?? []))).toBeCloseTo(
      4 - FACTS.wallThicknessM,
      9,
    );
    // And the wall along the side that starts there runs back as far.
    const from = walls.find((wall) => wall.outer.every((at) => Math.abs(at.east - 4) < 0.5));
    expect(Math.min(...(from?.outer.map((at) => at.north) ?? []))).toBeCloseTo(
      4 - FACTS.wallThicknessM,
      9,
    );
  });
});

describe('an open shed', () => {
  const over = kindOf('over', 'open_shed', box(2, 2, 4, 4), {
    on: 'terrace',
    shape: { is: 'flat', ...person },
  });

  it('is a thin sheet at its top with no walls, on a post at each corner down to the roof under it', () => {
    const scene = roofSceneOf(designOf(TERRACE, over), FACTS);
    expect(partsOf(scene.prisms, 1, 'body')).toEqual([]);
    expect(partsOf(scene.prisms, 1, 'sheet')).toMatchObject([{ topM: 6, top: 'roof' }]);
    const posts = partsOf(scene.prisms, 1, 'post');
    expect(posts).toHaveLength(4);
    expect(posts.every((post) => post.footM === 3 && post.topM === 6)).toBe(true);
  });

  it('a post that stands past the roof’s edge goes down to the ground', () => {
    const wide = kindOf('wide', 'open_shed', box(8, 2, 6, 4), {
      on: 'terrace',
      shape: { is: 'flat', ...person },
    });
    const posts = partsOf(roofSceneOf(designOf(TERRACE, wide), FACTS).prisms, 1, 'post');
    expect(posts.map((post) => post.footM).sort()).toEqual([0, 0, 3, 3]);
  });

  it('in a yard it stands on the ground, a storey high', () => {
    const yard = kindOf('yard', 'open_shed', box(20, 0, 4, 4), {
      shape: { is: 'flat', ...person },
    });
    const posts = partsOf(roofSceneOf(designOf(yard), FACTS).prisms, 0, 'post');
    expect(posts.every((post) => post.footM === 0 && post.topM === 3)).toBe(true);
  });
});

describe('a sloped roof', () => {
  const scene = roofSceneOf(designOf(SHED), FACTS);

  it('has walls up to its low edge with no top of their own, and faces above them', () => {
    expect(partsOf(scene.prisms, 0, 'body')).toMatchObject([{ footM: 0, topM: 3, top: 'none' }]);
    expect(scene.faces.length).toBeGreaterThan(0);
    const ups = scene.faces.flatMap((face) => face.corners.map((corner) => corner.up));
    expect(Math.min(...ups)).toBeCloseTo(3, 6);
    expect(Math.max(...ups)).toBeGreaterThan(3);
  });

  it('a wall stands under each gable end, from the low edge up to the face', () => {
    expect(scene.walls.length).toBeGreaterThan(0);
    expect(scene.walls.every((wall) => wall.footM === 3)).toBe(true);
    expect(scene.walls.some((wall) => wall.fromTopM > 3 || wall.toTopM > 3)).toBe(true);
  });

  it('with an overhang its walls stand inside the drip edge', () => {
    const eaves = { ...SHED, overhang: { metres: 0.5, ...person } } as Roof;
    const [body] = partsOf(roofSceneOf(designOf(eaves), FACTS).prisms, 0, 'body');
    const easts = body?.outer.map((at) => at.east) ?? [];
    expect(Math.min(...easts)).toBeCloseTo(10.5, 6);
    expect(Math.max(...easts)).toBeCloseTo(13.5, 6);
  });

  it('a flat roof has no faces and no standing wall', () => {
    const flat = roofSceneOf(designOf(TERRACE), FACTS);
    expect(flat.faces).toEqual([]);
    expect(flat.walls).toEqual([]);
  });
});

describe('holes and dormers in a sloped roof', () => {
  const sheet = {
    material: { type: 'trapezoidal_sheet', setBy: 'system', confirmed: false },
  } as const;
  const MAIN = roofOf('main', box(0, 0, 12, 8), sheet);
  const ringArea = (ring: readonly { east: number; north: number }[]) =>
    Math.abs(
      ring.reduce((part, at, i) => {
        const next = ring[(i + 1) % ring.length] ?? at;
        return part + at.east * next.north - next.east * at.north;
      }, 0),
    ) / 2;
  /** The ground some faces cover, seen from above: each face less what is cut out of it. */
  const planArea = (faces: readonly SceneFace[]) =>
    faces.reduce(
      (sum, face) =>
        sum + ringArea(face.corners) - face.holes.reduce((cut, hole) => cut + ringArea(hole), 0),
      0,
    );

  it('a hole in the middle of one face is cut out of that face alone', () => {
    const duct = kindOf('duct', 'hole', box(5, 1, 1, 1), { partOf: 'main' });
    const scene = roofSceneOf(designOf(MAIN, duct), FACTS);
    const cut = scene.faces.filter((face) => face.holes.length > 0);
    expect(cut).toHaveLength(1);
    expect(cut[0]?.holes[0]).toHaveLength(4);
    // The hole's corners lie in the face's own plane: above the low edge, below the ridge.
    const ups = cut[0]?.holes[0]?.map((corner) => corner.up) ?? [];
    expect(Math.min(...ups)).toBeGreaterThan(3);
    expect(Math.max(...ups)).toBeLessThan(
      Math.max(...scene.faces.flatMap((f) => f.corners.map((c) => c.up))),
    );
  });

  it('a dormer on a steep roof: its ridge 0.3 m under the main ridge, and the main face gives way under it', () => {
    const steep = { ...MAIN, slope: { degrees: 30, setBy: 'person' } } as Roof;
    const dormer = kindOf('dormer', 'dormer', box(5, 0.5, 2, 2), { on: 'main', ...sheet });
    const plain = roofSceneOf(designOf(steep), FACTS);
    const scene = roofSceneOf(designOf(steep, dormer), FACTS);
    const upsOf = (roof: number) =>
      scene.faces
        .filter((face) => face.roof === roof)
        .flatMap((face) => face.corners.map((c) => c.up));
    const mainRidge = Math.max(...plain.faces.flatMap((face) => face.corners.map((c) => c.up)));
    expect(Math.max(...upsOf(1))).toBeCloseTo(mainRidge - 0.3, 6);
    // The main roof has lost the ground the dormer stands over.
    const mainNow = planArea(scene.faces.filter((face) => face.roof === 0));
    expect(mainNow).toBeCloseTo(planArea(plain.faces) - 4, 6);
    // Its walls stand from the main roof's low edge up to its own, lifted, low edge.
    const [walls] = partsOf(scene.prisms, 1, 'body');
    expect(walls?.footM).toBe(3);
    expect(walls?.topM).toBeGreaterThan(3);
    expect(walls?.top).toBe('none');
  });

  it('a dormer on a shallow roof still shows: it stands on the highest point of the roof under it', () => {
    const dormer = kindOf('dormer', 'dormer', box(5, 0.5, 2, 2), { on: 'main', ...sheet });
    const plain = roofSceneOf(designOf(MAIN), FACTS);
    const scene = roofSceneOf(designOf(MAIN, dormer), FACTS);
    const own = scene.faces.filter((face) => face.roof === 1);
    expect(planArea(own)).toBeCloseTo(4, 6);
    // No corner of it is lower than the main roof at its back edge, 2.5 m in from the low edge.
    const mainRidge = Math.max(...plain.faces.flatMap((face) => face.corners.map((c) => c.up)));
    const atBack = 3 + ((mainRidge - 3) * 2.5) / 4;
    const ups = own.flatMap((face) => face.corners.map((c) => c.up));
    expect(Math.min(...ups)).toBeCloseTo(atBack, 6);
  });

  it('a dormer as tall as its roof is not lifted, and has no wall of its own to stand', () => {
    const wide = kindOf('dormer', 'dormer', box(0, 0, 12, 8), { on: 'main', ...sheet });
    const scene = roofSceneOf(designOf(MAIN, wide), FACTS);
    expect(partsOf(scene.prisms, 1, 'body')).toEqual([]);
  });
});
