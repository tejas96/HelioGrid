import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { roofBuilt } from './roof-built';
import { HEIGHT_PULL_M, type HeightLevel, type HeightPull } from './roof-height-pull';
import { roofKindOf, roofWithItsParts } from './roof-kind';
import { type RoofFacts, roofSloped, roofTopsM } from './roof-levels';
import { roofNameOf } from './roof-names';
import { edgesOf } from './roof-open-edges';
import { roofMiddle } from './roof-shape';

/**
 * The magnet for a wall's and a ridge's arrow in 3D (`T-M05-002`, part e, E130): a wall's height
 * pulls to the roof's other sides, to the parapet top of a roof beside it, and to round values; a
 * ridge pulls to a nearby roof's ridge — a joined wing's — and to a higher roof's eave, and to
 * round values. What exists goes first. Each pull names what it pulled to, for its tag.
 */

/** Only a roof this near pulls, in metres. */
const NEAR_M = 15;
/** A round value: a half metre for a ridge, a tenth less for a wall, whose usual heights are 0.9 to 1.5. */
const ROUND_RIDGE_M = 0.5;
const ROUND_WALL_M = 0.1;

interface Level {
  readonly levelM: number;
  readonly to: HeightLevel;
  readonly along: readonly GroundPoint[];
}

const between = (a: GroundPoint, b: GroundPoint) => Math.hypot(a.east - b.east, a.north - b.north);

function sideEnds(roof: Roof, side: number): GroundPoint[] {
  const from = roof.corners[side];
  const to = roof.corners[(side + 1) % roof.corners.length];
  return from === undefined || to === undefined ? [] : [from, to];
}

function nearestOf(levels: readonly Level[], levelM: number, reachM: number): Level | null {
  let best: Level | null = null;
  for (const level of levels) {
    const off = Math.abs(level.levelM - levelM);
    if (off > reachM + 1e-9) continue;
    if (best === null || off < Math.abs(best.levelM - levelM)) best = level;
  }
  return best;
}

/** The roofs near `index` that are not its own parts, with their names and tops. */
function neighbours(document: StudioDocument, index: number, facts: RoofFacts) {
  const roof = document.roofs[index] as Roof;
  const own = new Set(roofWithItsParts(document, index));
  const at = roofMiddle(roof.corners);
  const tops = roofTopsM(document, facts);
  return document.roofs.flatMap((other, i) => {
    if (own.has(i) || roofKindOf(other) === 'hole') return [];
    if (Math.min(...other.corners.map((corner) => between(corner, at))) > NEAR_M) return [];
    const name = roofNameOf(document, i) ?? { kind: 'roof' as const, number: i + 1 };
    return [{ roof: other, index: i, name, topM: tops[i] ?? 0 }];
  });
}

/**
 * Where one side's parapet height pulls to when dragged to `metres` above the roof's floor; `null`
 * when nothing is within `reachM`.
 */
export function wallPullOf(
  document: StudioDocument,
  index: number,
  side: number,
  facts: RoofFacts,
  metres: number,
  reachM: number = HEIGHT_PULL_M,
): HeightPull | null {
  const roof = document.roofs[index];
  if (roof === undefined) return null;
  const floorM = roofTopsM(document, facts)[index] ?? 0;
  const edges = edgesOf(document, index, facts);
  const own = sideEnds(roof, side);
  // The roof's other sides with a wall: the height most of them stand at.
  const others = edges.flatMap((stretches, i) =>
    i === side
      ? []
      : stretches.filter((s) => s.wall).map(() => ({ i, metres: stretches[0]?.metres ?? 0 })),
  );
  const sides: Level[] = others.map(({ i, metres: at }) => ({
    levelM: floorM + at,
    to: { kind: 'other_sides' },
    along: sideEnds(roof, i),
  }));
  const beside: Level[] = neighbours(document, index, facts).flatMap(
    ({ index: i, name, roof: other, topM }) => {
      const walls = edgesOf(document, i, facts)
        .flat()
        .filter((s) => s.wall)
        .map((s) => s.metres);
      if (walls.length === 0) return [];
      const at = roofMiddle(roof.corners);
      const near = other.corners.reduce((best, corner) =>
        between(corner, at) < between(best, at) ? corner : best,
      );
      return [
        {
          levelM: topM + Math.max(...walls),
          to: { kind: 'parapet_top', roof: i, name },
          along: [near],
        },
      ];
    },
  );
  const levelM = floorM + metres;
  const round: Level = {
    levelM: floorM + Math.round(metres / ROUND_WALL_M) * ROUND_WALL_M,
    to: { kind: 'round' },
    along: [],
  };
  const pulled =
    nearestOf(sides, levelM, reachM) ??
    nearestOf(beside, levelM, reachM) ??
    nearestOf([round], levelM, reachM);
  if (pulled === null || pulled.levelM - floorM <= 0) return null;
  return {
    metres: pulled.levelM - floorM,
    levelM: pulled.levelM,
    to: pulled.to,
    line: [...pulled.along, ...own],
  };
}

/**
 * Where a sloped roof's ridge pulls to when dragged to `riseM` above its low edge: a nearby
 * roof's ridge, a higher roof's eave, a round value; `null` when nothing is within `reachM`.
 */
export function ridgePullOf(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
  riseM: number,
  reachM: number = HEIGHT_PULL_M,
): HeightPull | null {
  const roof = document.roofs[index];
  if (roof === undefined) return null;
  const lowM = roofTopsM(document, facts)[index] ?? 0;
  const levels: Level[] = neighbours(document, index, facts).flatMap(
    ({ index: i, name, roof: other, topM }) => {
      const along = [roofMiddle(other.corners)];
      const eave: Level[] =
        topM > lowM ? [{ levelM: topM, to: { kind: 'roof_top', roof: i, name }, along }] : [];
      if (!roofSloped(other, facts)) return eave;
      const ridge: Level = {
        levelM: topM + roofBuilt(other, facts).topM,
        to: { kind: 'ridge', roof: i, name },
        along,
      };
      return [ridge, ...eave];
    },
  );
  const levelM = lowM + riseM;
  const round: Level = {
    levelM: lowM + Math.round(riseM / ROUND_RIDGE_M) * ROUND_RIDGE_M,
    to: { kind: 'round' },
    along: [],
  };
  const pulled = nearestOf(levels, levelM, reachM) ?? nearestOf([round], levelM, reachM);
  if (pulled === null || pulled.levelM - lowM <= 0) return null;
  return {
    metres: pulled.levelM - lowM,
    levelM: pulled.levelM,
    to: pulled.to,
    line: [...pulled.along, roofMiddle(roof.corners)],
  };
}
