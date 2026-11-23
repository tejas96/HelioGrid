import type { StudioDocument } from './document';
import type { GroundPoint } from './ground';
import { cutInto, facesHeightAt, facesWithout } from './roof-cuts';
import type { BuiltFace } from './roof-faces';
import { roofKindOf, standsOn } from './roof-kind';
import type { RoofScene, SceneFace, SceneWall } from './roof-scene';
import type { RoofsWorked } from './roof-worked';

/**
 * The sloped roofs of the 3D model (`T-M05-002`, part e): each one's faces above its low edge, cut
 * round its holes; a dormer cut into the roof it sits on, where the two meet in a valley; and the
 * walls that stand in a roof — under a gable end, against a step, a sawtooth's glass.
 */

/** A dormer's ridge stands this far below the ridge of the roof it sits on, in metres. */
export const DORMER_UNDER_RIDGE_M = 0.3;
/** Heights this close are one, in metres. */
const SAME_M = 1e-3;

export interface SlopedTop {
  readonly faces: readonly SceneFace[];
  readonly walls: readonly SceneWall[];
  /** How far the roof's low edge stands above the level it is counted from: a dormer's lift. */
  readonly liftM: number;
}

/** The walls under a face's gable ends and against a step: from the roof's low edge up to the face. */
function wallsUnder(index: number, eaveM: number, faces: readonly BuiltFace[]): SceneWall[] {
  return faces.flatMap((face) =>
    face.edges.flatMap((kind, i): SceneWall[] => {
      const from = face.corners[i];
      const to = face.corners[(i + 1) % face.corners.length];
      const stands = kind === 'gable_end' || kind === 'wall';
      if (!stands || from === undefined || to === undefined) return [];
      if (from.up < SAME_M && to.up < SAME_M) return [];
      return [
        { roof: index, from, to, footM: eaveM, fromTopM: eaveM + from.up, toTopM: eaveM + to.up },
      ];
    }),
  );
}

/**
 * How far a dormer's low edge stands above its roof's: so its ridge is 0.3 m under the main ridge,
 * and never so low that the roof under it would cover it — on a shallow roof it stands on the
 * highest point of the roof under its outline.
 */
function dormerLift(
  main: readonly BuiltFace[],
  mainTopM: number,
  ownTopM: number,
  outline: readonly GroundPoint[],
): number {
  const under = Math.max(0, ...outline.map((corner) => facesHeightAt(main, corner) ?? 0));
  return Math.max(mainTopM - ownTopM - DORMER_UNDER_RIDGE_M, under);
}

/** Each sloped roof's faces as they show, above its own low edge, and each dormer's lift. */
function facesShown(document: StudioDocument, worked: RoofsWorked) {
  const faces = worked.built.map((built) => built?.faces ?? null);
  const lifts = document.roofs.map(() => 0);
  document.roofs.forEach((roof, index) => {
    const built = worked.built[index];
    if (built == null || roofKindOf(roof) === 'dormer') return;
    // A hole is cut out of the faces it lies in.
    let main = document.roofs
      .filter((other) => roofKindOf(other) === 'hole' && other.partOf === roof.id)
      .reduce<readonly BuiltFace[]>((left, hole) => facesWithout(left, hole.corners), built.faces);
    document.roofs.forEach((other, dormer) => {
      const own = worked.built[dormer];
      if (roofKindOf(other) !== 'dormer' || standsOn(document, other) !== index || own == null) {
        return;
      }
      const liftM = dormerLift(built.faces, built.topM, own.topM, other.corners);
      const cut = cutInto(main, own.faces, liftM);
      main = cut.higher;
      faces[dormer] = cut.lower;
      lifts[dormer] = liftM;
    });
    faces[index] = main;
  });
  return { faces, lifts };
}

/** Every sloped roof's top, in the order of the design's roofs; `null` for a flat roof and a hole. */
export function slopedTops(
  document: StudioDocument,
  worked: RoofsWorked,
  levels: RoofScene['levels'],
): readonly (SlopedTop | null)[] {
  const { faces, lifts } = facesShown(document, worked);
  return document.roofs.map((_, index): SlopedTop | null => {
    const shown = faces[index];
    const built = worked.built[index];
    if (shown == null || built == null) return null;
    const liftM = lifts[index] ?? 0;
    const eaveM = (levels[index]?.topM ?? 0) + liftM;
    const lifted = <P extends { readonly up: number }>(corner: P) => ({
      ...corner,
      up: eaveM + corner.up,
    });
    const strips = built.walls.map(
      (wall): SceneWall => ({
        roof: index,
        from: wall.from,
        to: wall.to,
        footM: eaveM + wall.lowM,
        fromTopM: eaveM + wall.highM,
        toTopM: eaveM + wall.highM,
      }),
    );
    return {
      faces: shown.map((face) => ({
        roof: index,
        corners: face.corners.map(lifted),
        holes: (face.holes ?? []).map((hole) => hole.map(lifted)),
      })),
      walls: [...wallsUnder(index, eaveM, shown), ...strips],
      liftM,
    };
  });
}
