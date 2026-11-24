import type { Roof, StudioDocument } from './document';
import { belongsTo, roofKindOf, standsOn } from './roof-kind';
import { roofMaterialNow } from './roof-levels';
import type { RoofFixedLike, RoofMaterial } from './roof-material';
import { MATERIAL_NAME_MAX, type RoofKind, type RoofMaterialSet } from './roof-parts';

/**
 * What a roof is made of, as a person sets it (`T-M05-002`, part e): a tap on a type's picture is
 * their pick; Confirm keeps the studio's guess as it is. Either way the roof no longer waits. The
 * roof's first shape, slope and parapet follow its material where no one has set them: they are
 * read from it, never stored beside it.
 */

/** A person's pick: a type from the list, or a type of their own with its name and what it is fixed like. */
export interface MaterialPick {
  readonly type: RoofMaterial;
  /** For `other`: the name on the drawings, and the family its mounting follows. */
  readonly name?: string;
  readonly fixedLike?: RoofFixedLike;
}

const withRoof = (document: StudioDocument, index: number, roof: Roof): StudioDocument => ({
  ...document,
  roofs: document.roofs.map((each, i) => (i === index ? roof : each)),
});

/** A hole is made of nothing: it takes no material. */
const takesMaterial = (roof: Roof | undefined): roof is Roof =>
  roof !== undefined && roofKindOf(roof) !== 'hole';

/**
 * A person picks what the roof is made of: it is theirs, and confirmed. A type of their own needs
 * a name and what it is fixed like; without them nothing changes.
 */
export function roofMaterialPicked(
  document: StudioDocument,
  index: number,
  pick: MaterialPick,
): StudioDocument {
  const roof = document.roofs[index];
  if (!takesMaterial(roof)) return document;
  const name = pick.name?.trim() ?? '';
  const own = pick.type === 'other';
  if (own && (name === '' || name.length > MATERIAL_NAME_MAX || pick.fixedLike === undefined)) {
    return document;
  }
  const material: RoofMaterialSet = {
    type: pick.type,
    ...(own ? { name, fixedLike: pick.fixedLike } : {}),
    setBy: 'person',
    confirmed: true,
  };
  return withRoof(document, index, { ...roof, material });
}

/** The kinds that take the material of the roof they sit on, and are confirmed with it. */
const WITH_ITS_ROOF: readonly RoofKind[] = ['stair_room', 'upper_floor'];

/** A roof's material as it stands, confirmed: what is stored, or the type it reads as, kept as the studio's. */
function confirmedOf(roof: Roof): RoofMaterialSet {
  const stored = roof.material;
  return stored === undefined
    ? { type: roofMaterialNow(roof), setBy: 'system', confirmed: true }
    : { ...stored, confirmed: true };
}

/**
 * Confirm: the guess is kept as it is and waits no more — for this roof, and in the same tap for
 * a stair room or an upper floor on it that is made of the same thing and still waits. Whose
 * value it is does not change. Nothing changes where all of them are confirmed already.
 */
export function roofMaterialConfirmed(document: StudioDocument, index: number): StudioDocument {
  const roof = document.roofs[index];
  if (!takesMaterial(roof)) return document;
  const type = roofMaterialNow(roof);
  const waits = (each: Roof) => each.material?.confirmed !== true;
  const withIt = (each: Roof) =>
    WITH_ITS_ROOF.includes(roofKindOf(each)) &&
    (standsOn(document, each) ?? belongsTo(document, each)) === index &&
    roofMaterialNow(each) === type;
  const roofs = document.roofs.map((each, i) =>
    waits(each) && (i === index || withIt(each)) ? { ...each, material: confirmedOf(each) } : each,
  );
  return roofs.every((each, i) => each === document.roofs[i]) ? document : { ...document, roofs };
}
