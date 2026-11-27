import { type ShadeCut, shadeCasterOf, shadeCatcherOf } from '@heliogrid/data/react/studio';
import type { HeightGrid, SiteLineUp } from '@heliogrid/domain';
import { BufferAttribute, BufferGeometry } from 'three';

const XYZ = 3;

/**
 * The height map as a shadow caster (`T-M05-002`, part g): the cells `shadeCasterOf` keeps, as one
 * mesh the scene casts from and never draws.
 */
export function siteShadeGeometry(
  grid: HeightGrid,
  cuts: readonly ShadeCut[],
  lineUp: SiteLineUp,
): BufferGeometry {
  const made = new BufferGeometry();
  made.setAttribute('position', new BufferAttribute(shadeCasterOf(grid, cuts, lineUp), XYZ));
  return made;
}

/** A flat square of ground `[west, south, east, north]`, as two triangles' corners. */
function groundSquare([west, south, east, north]: readonly [number, number, number, number]) {
  return [
    [west, south],
    [east, south],
    [east, north],
    [west, south],
    [east, north],
    [west, north],
  ].flatMap(([e, n]) => [e as number, 0, -(n as number)]);
}

/**
 * The shadows' catcher (`T-M05-002`, part g): the height maps' cells where the maps read them, and
 * the bare ground round them out to `reachM` from the pin, with the normals the shadow's bias
 * leans on.
 */
export function siteCatcherGeometry(
  grids: readonly HeightGrid[],
  lineUp: SiteLineUp,
  reachM: number,
): BufferGeometry {
  const maps = grids.map((grid) => shadeCatcherOf(grid, lineUp));
  // The ground round the maps' box: south and north of it right across, either side between.
  const west = Math.min(...grids.map((grid) => grid.west + lineUp.east));
  const south = Math.min(...grids.map((grid) => grid.south + lineUp.north));
  const east = Math.max(...grids.map((grid) => grid.west + lineUp.east + grid.cols * grid.stepM));
  const north = Math.max(
    ...grids.map((grid) => grid.south + lineUp.north + grid.rows * grid.stepM),
  );
  const round: readonly (readonly [number, number, number, number])[] =
    grids.length === 0
      ? [[-reachM, -reachM, reachM, reachM]]
      : [
          [-reachM, -reachM, reachM, south],
          [-reachM, north, reachM, reachM],
          [-reachM, south, west, north],
          [east, south, reachM, north],
        ];
  const ground = round
    .filter(([w, s, e, n]) => e > w && n > s)
    .flatMap((square) => groundSquare(square));
  const positions = new Float32Array(
    maps.reduce((sum, map) => sum + map.length, 0) + ground.length,
  );
  let at = 0;
  for (const map of maps) {
    positions.set(map, at);
    at += map.length;
  }
  positions.set(ground, at);
  const made = new BufferGeometry();
  made.setAttribute('position', new BufferAttribute(positions, XYZ));
  made.computeVertexNormals();
  return made;
}
