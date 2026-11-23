import type { Roof, StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { ROOF_HEIGHT_MIN_M } from './roof-height';
import { HEIGHT_PULL_M, type HeightLevel, type HeightPull } from './roof-height-pull';
import { roofKindOf, roofWithItsParts } from './roof-kind';
import { type RoofFacts, roofOwnHeightM, roofTopsM } from './roof-levels';
import { roofNameOf } from './roof-names';
import { edgesOf } from './roof-open-edges';
import { roofMiddle } from './roof-shape';

/**
 * The magnet for a roof's height (`T-M05-002`, part e): dragged within reach of the top of a roof
 * near it, of that roof's parapet, of a whole floor or of a round value, the height pulls to it.
 * A roof's own top, and the tops of what stands on it, never pull it.
 */

/** Only a roof this near pulls: one across the site is not what the eye lines it up with, in metres. */
const NEAR_M = 15;
/** A round value is a half metre. */
const ROUND_M = 0.5;
/** A roof a hundred floors high is past any height a person drags. */
const FLOORS_MOST = 100;

interface Level {
  readonly levelM: number;
  readonly to: HeightLevel;
  /** The side of the roof it names, where the line starts; none for a floor or a round value. */
  readonly along: readonly GroundPoint[];
}

const between = (a: GroundPoint, b: GroundPoint) => Math.hypot(a.east - b.east, a.north - b.north);

/** The side of a roof nearest a point: its two ends. */
function nearestSide(roof: Roof, to: GroundPoint): GroundPoint[] {
  const sides = roof.corners.map((from, i) => {
    const end = roof.corners[(i + 1) % roof.corners.length] as GroundPoint;
    const middle = { east: (from.east + end.east) / 2, north: (from.north + end.north) / 2 };
    return { ends: [from, end], far: between(middle, to) };
  });
  return sides.reduce((best, each) => (each.far < best.far ? each : best)).ends;
}

/** The levels the other roofs near the dragged one give: each one's top, and its parapet's top. */
function roofLevels(document: StudioDocument, index: number, facts: RoofFacts): Level[] {
  const dragged = document.roofs[index] as Roof;
  const own = new Set(roofWithItsParts(document, index));
  const at = roofMiddle(dragged.corners);
  const tops = roofTopsM(document, facts);
  return document.roofs.flatMap((roof, other): Level[] => {
    if (own.has(other) || roofKindOf(roof) === 'hole') return [];
    const along = nearestSide(roof, at);
    if (Math.min(...roof.corners.map((corner) => between(corner, at))) > NEAR_M) return [];
    const name = roofNameOf(document, other) ?? { kind: 'roof', number: other + 1 };
    const topM = tops[other] ?? 0;
    const walls = edgesOf(document, other, facts)
      .flat()
      .filter((stretch) => stretch.wall)
      .map((stretch) => stretch.metres);
    const top: Level = { levelM: topM, to: { kind: 'roof_top', roof: other, name }, along };
    if (walls.length === 0) return [top];
    const parapetM = topM + Math.max(...walls);
    return [top, { levelM: parapetM, to: { kind: 'parapet_top', roof: other, name }, along }];
  });
}

/** The whole floors above the roof's foot: the ground's start height, then a storey each. */
function floorLevels(footM: number, facts: RoofFacts, onGround: boolean): Level[] {
  const first = onGround ? facts.plinthHeightM + facts.storeyHeightM : facts.storeyHeightM;
  return Array.from({ length: FLOORS_MOST }, (_, floors) => ({
    levelM: footM + first + floors * facts.storeyHeightM,
    to: { kind: 'floor', floors } as const,
    along: [],
  }));
}

/** The nearest of some levels to a height, within reach; `null` when none is. */
function nearest(levels: readonly Level[], levelM: number, reachM: number): Level | null {
  const within = levels.filter((level) => Math.abs(level.levelM - levelM) <= reachM + 1e-9);
  if (within.length === 0) return null;
  return within.reduce((best, each) =>
    Math.abs(each.levelM - levelM) < Math.abs(best.levelM - levelM) ? each : best,
  );
}

/**
 * Where the height of the roof at `index` pulls to when dragged to `metres` above what it stands
 * on. What exists goes first: a roof's top or its parapet's, then a whole floor, then a round
 * value; `null` when nothing is within `reachM`.
 */
export function heightPullOf(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
  metres: number,
  reachM: number = HEIGHT_PULL_M,
): HeightPull | null {
  const roof = document.roofs[index];
  if (roof === undefined) return null;
  const footM = (roofTopsM(document, facts)[index] ?? 0) - roofOwnHeightM(document, roof, facts);
  const levelM = footM + metres;
  const round: Level = {
    levelM: footM + Math.round(metres / ROUND_M) * ROUND_M,
    to: { kind: 'round' },
    along: [],
  };
  const onGround = roof.on === undefined;
  const pulled =
    nearest(roofLevels(document, index, facts), levelM, reachM) ??
    nearest(floorLevels(footM, facts, onGround), levelM, reachM) ??
    nearest([round], levelM, reachM);
  if (pulled === null || pulled.levelM - footM < ROOF_HEIGHT_MIN_M) return null;
  // The dragged roof's side that faces the side it pulled to; its own first side for a floor.
  const [from, to] = pulled.along;
  const facing =
    from === undefined || to === undefined
      ? roofMiddle(roof.corners)
      : { east: (from.east + to.east) / 2, north: (from.north + to.north) / 2 };
  const own = nearestSide(roof, facing);
  return {
    metres: pulled.levelM - footM,
    levelM: pulled.levelM,
    to: pulled.to,
    line: [...pulled.along, ...own],
  };
}
