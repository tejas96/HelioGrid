import { describe, expect, it } from 'vitest';
import type { Roof } from '../../src/studio/document';
import { roofSceneOf } from '../../src/studio/roof-scene-build';
import { box, designOf, FACTS, roofOf, SHED, TERRACE } from './roof-meet-support';

/**
 * A sloped roof's walls stand inside its drip edge (`T-M05-002`, part e): the outline drawn is the
 * drip edge, the overhang is the market's until a person sets it, and a side another roof meets
 * has none.
 */
const person = { setBy: 'person' } as const;
/** The walls of roof `index`: how far they reach, east and north. */
function wallsOf(index: number, ...roofs: Roof[]) {
  const scene = roofSceneOf(designOf(...roofs), FACTS);
  const [body] = scene.prisms.filter((prism) => prism.roof === index && prism.part === 'body');
  const easts = body?.outer.map((at) => at.east) ?? [];
  const norths = body?.outer.map((at) => at.north) ?? [];
  return {
    west: Math.min(...easts),
    east: Math.max(...easts),
    south: Math.min(...norths),
    north: Math.max(...norths),
  };
}
const near = (walls: ReturnType<typeof wallsOf>, to: ReturnType<typeof wallsOf>) => {
  for (const side of ['west', 'east', 'south', 'north'] as const) {
    expect(walls[side], side).toBeCloseTo(to[side], 6);
  }
};

describe('a sloped roof’s walls and its overhang', () => {
  it('with none stored they stand the market’s overhang inside the drip edge', () => {
    near(wallsOf(0, SHED), { west: 10.5, east: 13.5, south: 0.5, north: 7.5 });
  });

  it.each([
    ['none: the walls stand at the outline', 0, { west: 10, east: 14, south: 0, north: 8 }],
    ['a wide one', 1, { west: 11, east: 13, south: 1, north: 7 }],
  ] as const)('a person’s overhang, %s', (_why, metres, walls) => {
    near(wallsOf(0, { ...SHED, overhang: { metres, ...person } }), walls);
  });

  it('a side another roof meets has none: the wall stands against that roof', () => {
    // The shed's west side lies along the terrace's east side.
    near(wallsOf(1, TERRACE, SHED), { west: 10, east: 13.5, south: 0.5, north: 7.5 });
  });

  it('a side with its own overhang keeps it; the others keep the roof’s', () => {
    const deep = { ...SHED, sides: [{}, { overhangM: 1 }, {}, {}] } as Roof;
    near(wallsOf(0, deep), { west: 10.5, east: 13, south: 0.5, north: 7.5 });
  });

  it('a roof too small to keep its overhang keeps its walls at its outline', () => {
    const porch = roofOf('porch', box(20, 0, 0.8, 4), { material: SHED.material });
    near(wallsOf(0, porch), { west: 20, east: 20.8, south: 0, north: 4 });
  });
});
