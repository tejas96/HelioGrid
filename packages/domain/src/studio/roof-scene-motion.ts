import type { Roof, StudioDocument } from './document';
import { roofKindOf, standsOn } from './roof-kind';
import type { ModelPoint, RoofScene, ScenePrism } from './roof-scene';
import { roofMiddle } from './roof-shape';

/**
 * How the 3D model moves into a change (`T-M05-002`, part e, plan step S18): a new roof rises from
 * the roof it stands on, or grows from the ground; a deleted roof shrinks away, and Undo grows it
 * back; a kind changed fades one into the other; faces fold up from a flat roof; a gable's ridge
 * turned rotates; a parapet taken off sinks, and one put on rises. A roof whose outline moved —
 * a drag, a length — moves with the hand and has no motion of its own.
 */

export type SceneMoveKind =
  | 'rise'
  | 'grow'
  | 'shrink'
  | 'fold'
  | 'turn'
  | 'fade_in'
  | 'fade_out'
  | 'sink'
  | 'lift';

export interface SceneMove {
  readonly kind: SceneMoveKind;
  /** What moves: parts of the model after the change, or — leaving — of the model before it. */
  readonly parts: RoofScene;
  /** The point it scales from or turns about. */
  readonly pivot: ModelPoint;
}

export interface SceneMotion {
  readonly moves: readonly SceneMove[];
  /** The model after the change, less what moves into it: drawn still while the moves play. */
  readonly still: RoofScene;
}

/** A model drawn, with the design it was drawn from. */
export interface SceneDrawn {
  readonly document: StudioDocument;
  readonly scene: RoofScene;
}

type Pick = 'all' | 'top' | 'parapets';

const isParapet = (prism: ScenePrism) => prism.part === 'parapet' || prism.part === 'rail';

/** One roof's parts of a model: all of them, its sloped top alone, or its parapets. */
function partsOf(scene: RoofScene, roof: number, pick: Pick): RoofScene {
  const top = pick !== 'parapets';
  return {
    prisms: scene.prisms.filter(
      (prism) =>
        prism.roof === roof && (pick === 'all' || (pick === 'parapets' && isParapet(prism))),
    ),
    faces: top ? scene.faces.filter((face) => face.roof === roof) : [],
    walls: top ? scene.walls.filter((wall) => wall.roof === roof) : [],
    levels: [],
    skins: scene.skins,
  };
}

/** A model less the parts that move into it. */
function without(scene: RoofScene, moving: readonly { roof: number; pick: Pick }[]): RoofScene {
  const picked = (roof: number, pick: Pick) =>
    moving.some((each) => each.roof === roof && (each.pick === 'all' || each.pick === pick));
  return {
    ...scene,
    prisms: scene.prisms.filter(
      (prism) =>
        !picked(prism.roof, 'all') && !(isParapet(prism) && picked(prism.roof, 'parapets')),
    ),
    faces: scene.faces.filter((face) => !picked(face.roof, 'all') && !picked(face.roof, 'top')),
    walls: scene.walls.filter((wall) => !picked(wall.roof, 'all') && !picked(wall.roof, 'top')),
  };
}

const sameCorners = (a: Roof, b: Roof) =>
  a.corners.length === b.corners.length &&
  a.corners.every((corner, i) => {
    const other = b.corners[i];
    return other !== undefined && other.east === corner.east && other.north === corner.north;
  });

/** Where a roof stands in a model: its middle, at its foot or at its eave. */
function pivotOf(drawn: SceneDrawn, roof: number, at: 'foot' | 'eave'): ModelPoint {
  const middle = roofMiddle((drawn.document.roofs[roof] as Roof).corners);
  const level = drawn.scene.levels[roof] ?? { footM: 0, topM: 0 };
  return { ...middle, up: at === 'foot' ? level.footM : level.topM };
}

interface Found {
  readonly move: SceneMove;
  /** The parts of the model after the change that it draws instead: `null` for a leaving part. */
  readonly holds: { readonly roof: number; readonly pick: Pick } | null;
}

/** The moves of one roof found in both models. */
/** Each roof's parapet pieces in a model, counted once. */
function parapetsOf(scene: RoofScene): Map<number, number> {
  const counts = new Map<number, number>();
  for (const prism of scene.prisms) {
    if (isParapet(prism)) counts.set(prism.roof, (counts.get(prism.roof) ?? 0) + 1);
  }
  return counts;
}

interface Counts {
  readonly before: Map<number, number>;
  readonly after: Map<number, number>;
}

function changed(
  before: SceneDrawn,
  after: SceneDrawn,
  was: number,
  now: number,
  counts: Counts,
): Found[] {
  const old = before.document.roofs[was] as Roof;
  const roof = after.document.roofs[now] as Roof;
  if (!sameCorners(old, roof)) return [];
  if (roofKindOf(old) !== roofKindOf(roof)) {
    return [
      {
        move: {
          kind: 'fade_out',
          parts: partsOf(before.scene, was, 'all'),
          pivot: pivotOf(before, was, 'foot'),
        },
        holds: null,
      },
      {
        move: {
          kind: 'fade_in',
          parts: partsOf(after.scene, now, 'all'),
          pivot: pivotOf(after, now, 'foot'),
        },
        holds: { roof: now, pick: 'all' },
      },
    ];
  }
  const found: Found[] = [];
  const facesWere = before.scene.faces.some((face) => face.roof === was);
  const facesNow = after.scene.faces.some((face) => face.roof === now);
  const top = (kind: SceneMoveKind): Found => ({
    move: { kind, parts: partsOf(after.scene, now, 'top'), pivot: pivotOf(after, now, 'eave') },
    holds: { roof: now, pick: 'top' },
  });
  if (!facesWere && facesNow) found.push(top('fold'));
  else if (facesNow && old.shape?.turned !== roof.shape?.turned) {
    found.push(top('turn'));
  }
  const wallsWere = counts.before.get(was) ?? 0;
  const wallsNow = counts.after.get(now) ?? 0;
  if (wallsNow < wallsWere) {
    found.push({
      move: {
        kind: 'sink',
        parts: partsOf(before.scene, was, 'parapets'),
        pivot: pivotOf(before, was, 'eave'),
      },
      holds: null,
    });
  } else if (wallsNow > wallsWere) {
    found.push({
      move: {
        kind: 'lift',
        parts: partsOf(after.scene, now, 'parapets'),
        pivot: pivotOf(after, now, 'eave'),
      },
      holds: { roof: now, pick: 'parapets' },
    });
  }
  return found;
}

/** How the model moves from one design drawn to the next; `null` with nothing to move. */
export function sceneMotionOf(before: SceneDrawn, after: SceneDrawn): SceneMotion | null {
  const wasAt = new Map(before.document.roofs.map((roof, index) => [roof.id, index]));
  const nowIds = new Set(after.document.roofs.map((roof) => roof.id));
  const counts = { before: parapetsOf(before.scene), after: parapetsOf(after.scene) };
  const found: Found[] = after.document.roofs.flatMap((roof, now): Found[] => {
    const was = wasAt.get(roof.id);
    if (was !== undefined) return changed(before, after, was, now, counts);
    // A new roof — or one Undo brings back — rises from the roof it stands on, or grows from the ground.
    const kind = standsOn(after.document, roof) === null ? 'grow' : 'rise';
    return [
      {
        move: { kind, parts: partsOf(after.scene, now, 'all'), pivot: pivotOf(after, now, 'foot') },
        holds: { roof: now, pick: 'all' },
      },
    ];
  });
  before.document.roofs.forEach((roof, was) => {
    if (nowIds.has(roof.id)) return;
    found.push({
      move: {
        kind: 'shrink',
        parts: partsOf(before.scene, was, 'all'),
        pivot: pivotOf(before, was, 'foot'),
      },
      holds: null,
    });
  });
  if (found.length === 0) return null;
  const held = found.flatMap((each) => (each.holds === null ? [] : [each.holds]));
  return { moves: found.map((each) => each.move), still: without(after.scene, held) };
}
