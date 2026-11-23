import type { Roof } from './document';
import { handFaces } from './roof-cuts';
import {
  type FormedRoof,
  MANSARD_LOWER_DEG,
  type RoofForm,
  roofFormed,
  type SideOwn,
} from './roof-forms';
import { roofKindOf, roofSidesOf } from './roof-kind';
import { type RoofFacts, roofMaterialNow, roofShapeNow } from './roof-levels';
import { materialSlopeDeg, type RoofShape } from './roof-material';
import { type RoofSide, SIDE_ENDS, type SideEnd } from './roof-parts';

/**
 * A stored roof as the kernel builds it (`T-M05-002`, part e): its shape and one slope, and all it
 * stores beyond them — the ridge turned, the low or the glass side, the teeth, an upper slope and
 * its break, a raised middle, a valley's place, and each side's own end, slope and eave. One place
 * reads the roof, so its faces, its surface and its setback are built from the same form.
 */

/** The shapes with a steep lower slope and a shallower upper one. */
const TWO_SLOPES: readonly RoofShape[] = ['mansard', 'gambrel'];
export const hasTwoSlopes = (shape: RoofShape) => TWO_SLOPES.includes(shape);

/**
 * The slope a sloped roof starts with, in degrees: a mansard's or a gambrel's steep lower slope,
 * an open shed's the market's for a sheet on posts, any other roof's its material's.
 */
export function roofFirstSlopeDeg(roof: Roof, facts: RoofFacts): number {
  if (hasTwoSlopes(roofShapeNow(roof, facts))) return MANSARD_LOWER_DEG;
  if (roofKindOf(roof) === 'open_shed') return facts.openShedSlopeDeg;
  // A material that starts flat, given a sloped shape by a person, starts as a sloped slab does.
  const material = materialSlopeDeg(roofMaterialNow(roof), facts);
  return material > 0 ? material : SLOPED_SLAB_DEG;
}

/** A sloped concrete slab's first slope, as tiles laid on RCC start. */
export const SLOPED_SLAB_DEG = 20;

/**
 * How far a sloped roof's drip edge lies past its walls: what is stored, else the market's. A
 * dormer starts with none: it is cut into a roof, and its walls stand at its outline.
 */
export function roofOverhangM(roof: Roof, facts: RoofFacts): number {
  if (roof.overhang !== undefined) return roof.overhang.metres;
  return roofKindOf(roof) === 'dormer' ? 0 : facts.overhangM;
}

/** A roof's one slope in degrees: what is stored, else its first slope; 0 when flat. */
export function roofSlopeDeg(roof: Roof, facts: RoofFacts): number {
  if (roofShapeNow(roof, facts) === 'flat') return 0;
  return roof.slope?.degrees ?? roofFirstSlopeDeg(roof, facts);
}

function ownOf(side: RoofSide): SideOwn {
  const end = SIDE_ENDS.find((known: SideEnd) => known === side.end);
  return {
    ...(end === undefined ? {} : { end }),
    ...(side.slopeDeg === undefined ? {} : { slopeDeg: side.slopeDeg }),
    ...(side.eaveM === undefined ? {} : { eaveM: side.eaveM }),
  };
}

/**
 * What the studio picks for a roof's form where no person has (`roof-slope-way.ts`): the side a
 * shed's low edge is, a sawtooth's glass faces or a strip roof is measured from, and whether a
 * gable's ridge is turned.
 */
export interface FormPicks {
  readonly side?: number;
  readonly turned?: boolean;
}

/**
 * The form a stored roof is built in. What the roof stores wins over the studio's picks. A roof of
 * faces drawn by hand is built flat until its faces are stored.
 */
export function roofFormOf(roof: Roof, facts: RoofFacts, picks: FormPicks = {}): RoofForm {
  const shape = roofShapeNow(roof, facts);
  if (shape === 'flat' || shape === 'any') return { shape: 'flat', slopeDeg: 0 };
  const sides = roofSidesOf(roof);
  const marked = sides.findIndex((each) => each.low !== undefined || each.glass !== undefined);
  const owns = sides.map(ownOf);
  const stored = roof.shape;
  const from = marked >= 0 ? marked : picks.side;
  const turned = stored?.turned ?? picks.turned;
  return {
    shape,
    slopeDeg: roofSlopeDeg(roof, facts),
    ...(turned === undefined ? {} : { turned }),
    ...(from === undefined ? {} : { side: from }),
    ...(stored?.teeth === undefined ? {} : { teeth: stored.teeth.count }),
    ...(stored?.upperSlope === undefined ? {} : { upperSlopeDeg: stored.upperSlope.degrees }),
    ...(stored?.breakIn === undefined ? {} : { breakInM: stored.breakIn.metres }),
    ...(stored?.raisedHeight === undefined ? {} : { raisedHeightM: stored.raisedHeight.metres }),
    ...(stored?.raisedWidth === undefined ? {} : { raisedWidthM: stored.raisedWidth.metres }),
    ...(stored?.valleyAt === undefined ? {} : { valleyAt: stored.valleyAt.share }),
    ...(owns.some((own) => Object.keys(own).length > 0) ? { sides: owns } : {}),
  };
}

/** A stored roof's faces. */
export function roofBuilt(roof: Roof, facts: RoofFacts, picks?: FormPicks): FormedRoof {
  const drawn = roof.shape?.faces ?? [];
  // Any shape with faces a person drew: those faces, each at its own slope.
  if (roofShapeNow(roof, facts) === 'any' && drawn.length > 0) {
    const faces = handFaces(
      drawn.map((face) => ({
        corners: face.corners,
        slopeDeg: face.slope.degrees,
        lowSide: face.lowSide,
      })),
    );
    const topM = Math.max(0, ...faces.flatMap((face) => face.corners.map((corner) => corner.up)));
    return { faces, topM, walls: [], built: 'any' };
  }
  return roofFormed(roof.corners, roofFormOf(roof, facts, picks));
}
