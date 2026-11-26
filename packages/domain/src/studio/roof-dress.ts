import type { Rgb } from '../format/hex-colour';
import type { GroundPoint } from './ground';
import { familyFacts, PHOTO_STEEPEST_DEG } from './roof-look';
import { nearestSwatch, photoReadPoints } from './roof-look-colour';
import type { LookCap, LookFamily, RoofSkin, RoofSwatch } from './roof-look-kinds';
import type { ModelPoint, RoofScene } from './roof-scene';

/**
 * What each roof of the 3D model wears (`T-M05-002`, part e, roof looks): the photo where its
 * material is one the photo shows true and the picture covers it whole; else its material's look,
 * in its colour — a person's pick, else the photo's own colour inside the roof landed on the
 * nearest colour the material is sold in, else the material's first colour. The platform reads
 * the picture's pixels and hands them in; the rule is decided here, once, for both.
 */

/** The picture under the roofs, as the platform reads it. */
export interface PhotoReader {
  /** The picture lies under this ground point. */
  covers(point: GroundPoint): boolean;
  /** The middle colour of the picture at these points; `null` where it cannot be read. */
  read(points: readonly GroundPoint[]): Rgb | null;
}

/** What one roof of the model wears. */
export interface RoofDress {
  /** The photo: its tops are laid by their east and north. */
  readonly photo: boolean;
  readonly family: LookFamily;
  readonly swatch: RoofSwatch;
  /** How far the look's pattern runs before it repeats, along the eave and up the slope, in metres. */
  readonly repeatM: readonly [along: number, up: number];
  readonly cap: LookCap | null;
  readonly seeThrough: boolean;
}

/** A roof's outline on the plan: each top it wears, and each face seen from above. */
function outlinesOf(scene: RoofScene, roof: number): (readonly GroundPoint[])[] {
  return [
    ...scene.prisms
      .filter((prism) => prism.roof === roof && prism.top === 'roof')
      .map((prism) => prism.outer),
    ...scene.faces.filter((face) => face.roof === roof).map((face) => face.corners),
  ];
}

/** What the model wears: each roof, and whether each sloped face of it wears the photo. */
export interface RoofDresses {
  readonly roofs: readonly RoofDress[];
  /** In the order of the model's faces: a face of a photo roof that is too steep wears its material. */
  readonly facesWearPhoto: readonly boolean[];
}

const HALF_TURN_DEG = 180;

/**
 * How steep a face is, in degrees, from its corners: the face's normal by Newell's sum, which a
 * face of any number of corners, a sliver or a nearly straight edge, answers alike.
 */
function slopeDegOf(corners: readonly ModelPoint[]): number {
  let [x, y, z] = [0, 0, 0];
  corners.forEach((a, i) => {
    const b = corners[(i + 1) % corners.length] as ModelPoint;
    x += (a.north - b.north) * (a.up + b.up);
    y += (a.up - b.up) * (a.east + b.east);
    z += (a.east - b.east) * (a.north + b.north);
  });
  const length = Math.hypot(x, y, z);
  return length === 0 ? 0 : (Math.acos(Math.abs(z) / length) * HALF_TURN_DEG) / Math.PI;
}

const dressed = (skin: RoofSkin, photo: boolean, swatch: RoofSwatch): RoofDress => {
  const { repeatM, cap, seeThrough } = familyFacts(skin.family);
  return { photo, family: skin.family, swatch, repeatM, cap, seeThrough };
};

export function roofDressesOf(
  scene: RoofScene,
  /** The picture under the roofs; `null` with none, or while it comes. */
  picture: PhotoReader | null,
  /** A picture is on its way: a roof that will wear it stays plain until it comes. */
  pictureComing: boolean,
  /** The theme's colour of each swatch, `#RRGGBB`. */
  colours: Readonly<Record<RoofSwatch, string>>,
): RoofDresses {
  const roofs = scene.skins.map((skin, roof): RoofDress => {
    const outlines = outlinesOf(scene, roof);
    const covered =
      picture !== null &&
      outlines.length > 0 &&
      outlines.every((outline) => outline.every((point) => picture.covers(point)));
    const photo = skin.photo && (picture === null ? pictureComing : covered);
    if (photo || skin.swatch !== null) return dressed(skin, photo, skin.swatch ?? skin.start);
    const read =
      covered && picture !== null ? picture.read(outlines.flatMap(photoReadPoints)) : null;
    const sold = familyFacts(skin.family).swatches.map((swatch) => ({
      swatch,
      hex: colours[swatch],
    }));
    return dressed(skin, photo, (read === null ? null : nearestSwatch(read, sold)) ?? skin.start);
  });
  const facesWearPhoto = scene.faces.map(
    (face) => (roofs[face.roof]?.photo ?? false) && slopeDegOf(face.corners) <= PHOTO_STEEPEST_DEG,
  );
  return { roofs, facesWearPhoto };
}
