import type { Roof } from './document';
import { type FormedRoof, type RoofForm, roofFormed, type SideOwn } from './roof-forms';
import { roofSidesOf } from './roof-kind';
import { type RoofFacts, roofMaterialNow, roofShapeNow } from './roof-levels';
import { materialSlopeDeg } from './roof-material';
import { type RoofSide, SIDE_ENDS, type SideEnd } from './roof-parts';

/**
 * A stored roof as the kernel builds it (`T-M05-002`, part e): its shape and one slope, and all it
 * stores beyond them — the ridge turned, the low or the glass side, the teeth, an upper slope and
 * its break, a raised middle, a valley's place, and each side's own end, slope and eave. One place
 * reads the roof, so its faces, its surface and its setback are built from the same form.
 */

/** A roof's one slope in degrees: what is stored, else its material's first slope; 0 when flat. */
export function roofSlopeDeg(roof: Roof, facts: RoofFacts): number {
  if (roofShapeNow(roof, facts) === 'flat') return 0;
  return roof.slope?.degrees ?? materialSlopeDeg(roofMaterialNow(roof), facts);
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
 * The form a stored roof is built in. `side` is the side a shed's low edge is, a sawtooth's glass
 * faces or a strip roof is measured from, where the roof stores none (`roof-slope-way.ts` finds
 * it). A roof of faces drawn by hand is built flat until its faces are stored.
 */
export function roofFormOf(roof: Roof, facts: RoofFacts, side?: number): RoofForm {
  const shape = roofShapeNow(roof, facts);
  if (shape === 'flat' || shape === 'any') return { shape: 'flat', slopeDeg: 0 };
  const sides = roofSidesOf(roof);
  const marked = sides.findIndex((each) => each.low !== undefined || each.glass !== undefined);
  const owns = sides.map(ownOf);
  const stored = roof.shape;
  const from = marked >= 0 ? marked : side;
  return {
    shape,
    slopeDeg: roofSlopeDeg(roof, facts),
    ...(stored?.turned === undefined ? {} : { turned: stored.turned }),
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
export function roofBuilt(roof: Roof, facts: RoofFacts, side?: number): FormedRoof {
  return roofFormed(roof.corners, roofFormOf(roof, facts, side));
}
