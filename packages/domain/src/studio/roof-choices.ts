import type { Roof, StudioDocument } from './document';
import { roofSidesOf } from './roof-kind';
import { type RoofFacts, roofShapeNow } from './roof-levels';
import type { RoofShape } from './roof-material';
import type { LengthsMeasured, ParapetBuild, RoofShapeSet, RoofSide, SideEnd } from './roof-parts';
import { parapetRecordOf, roofSettled, roofWithSide, tidy } from './roof-values-set';

/**
 * What a person chooses on a roof's sheet and a side's (`T-M05-002`, part e): the shape, whether
 * the parapet runs all round, wall or railing, where the lengths were measured to, and what one
 * side is — the low side, the glass side, a gable end or a hip. Each is the person's from then on.
 * A choice that is the studio's own start is not stored, so the roof still follows its material.
 */

const withRoof = (document: StudioDocument, index: number, roof: Roof): StudioDocument => ({
  ...document,
  roofs: document.roofs.map((each, i) => (i === index ? roof : each)),
});

/** What each shape keeps of a shape record beyond its name: the rest belongs to another shape. */
const KEEPS: Partial<Record<RoofShape, readonly (keyof RoofShapeSet)[]>> = {
  gable: ['turned'],
  gambrel: ['turned', 'upperSlope', 'breakIn'],
  mansard: ['upperSlope', 'breakIn'],
  sawtooth: ['teeth'],
  monitor: ['raisedHeight', 'raisedWidth'],
  butterfly: ['valleyAt'],
};

/**
 * A person picks the roof's shape. The shape it reads as already, picked, makes the studio's
 * guess theirs. The new shape keeps what it uses of the old one's own values — a gambrel takes a
 * mansard's two slopes — and drops the rest.
 */
export function roofShapePicked(
  document: StudioDocument,
  index: number,
  shape: RoofShape,
  facts: RoofFacts,
): StudioDocument {
  const roof = document.roofs[index];
  if (roof === undefined) return document;
  const stored = roof.shape;
  if (roofShapeNow(roof, facts) === shape && stored?.setBy === 'person') return document;
  const kept = Object.fromEntries(
    (KEEPS[shape] ?? []).flatMap((key) =>
      stored?.[key] === undefined ? [] : [[key, stored[key]]],
    ),
  );
  return withRoof(document, index, { ...roof, shape: { ...kept, is: shape, setBy: 'person' } });
}

/** One change to the roof's parapet record; a record left holding only the studio's own goes. */
function withParapet(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
  change: Partial<ReturnType<typeof parapetRecordOf>>,
): StudioDocument {
  const roof = document.roofs[index];
  if (roof === undefined) return document;
  const parapet = { ...parapetRecordOf(document, roof, facts), ...change };
  return withRoof(document, index, roofSettled(document, { ...roof, parapet }, facts));
}

/** Parapet all round, switched on or off by a person. A side a person tapped keeps its own. */
export function roofParapetAllRound(
  document: StudioDocument,
  index: number,
  allRound: boolean,
  facts: RoofFacts,
): StudioDocument {
  return withParapet(document, index, facts, { allRound });
}

/** Wall or railing. A wall is what a parapet is with no word on it: only a railing is stored. */
export function roofParapetBuilt(
  document: StudioDocument,
  index: number,
  build: ParapetBuild,
  facts: RoofFacts,
): StudioDocument {
  return withParapet(document, index, facts, { build: build === 'wall' ? undefined : build });
}

/** Where the roof's lengths were measured to. Outside is the start: only inside is stored. */
export function roofLengthsMeasuredTo(
  document: StudioDocument,
  index: number,
  measured: LengthsMeasured,
  facts: RoofFacts,
): StudioDocument {
  const lengthsMeasured = measured === 'outside' ? undefined : measured;
  return withParapet(document, index, facts, { lengthsMeasured });
}

/** One side changed; `null` where the roof has no such side. */
function withSideOf(
  document: StudioDocument,
  index: number,
  side: number,
  change: (roof: Roof) => Roof,
): StudioDocument {
  const roof = document.roofs[index];
  if (roof === undefined || side < 0 || side >= roof.corners.length) return document;
  return withRoof(document, index, change(roof));
}

/** A side's parapet handed back to the studio: it follows the roof's, and what stands beside it. */
export function roofSideWallFollows(
  document: StudioDocument,
  index: number,
  side: number,
): StudioDocument {
  return withSideOf(document, index, side, (roof) =>
    roofWithSide(roof, side, (held) => tidy({ ...held, parapet: undefined })),
  );
}

/**
 * A person marks one side: a shed's low side, or the side a sawtooth's glass faces. A roof has one
 * such side: the mark leaves every other side.
 */
export function roofSideMarked(
  document: StudioDocument,
  index: number,
  side: number,
  mark: 'low' | 'glass',
): StudioDocument {
  return withSideOf(document, index, side, (roof) => ({
    ...roof,
    sides: roofSidesOf(roof).map((held, i): RoofSide => {
      const { low: _low, glass: _glass, ...rest } = held;
      return i === side ? { ...rest, [mark]: 'person' } : rest;
    }),
  }));
}

/** A person makes one end of a sloped roof a gable end or a hip; the roof's other ends stand. */
export function roofSideEnded(
  document: StudioDocument,
  index: number,
  side: number,
  end: Extract<SideEnd, 'gable' | 'hip'>,
): StudioDocument {
  return withSideOf(document, index, side, (roof) =>
    roofWithSide(roof, side, (held) => ({ ...held, end })),
  );
}

/** A gable's ridge turned 90°, or turned back: its gable ends and its eaves swap. */
export function roofRidgeTurned(
  document: StudioDocument,
  index: number,
  facts: RoofFacts,
  /** The way the ridge runs now where the roof stores none (`gableTurnedFor`). */
  turnedNow: boolean,
): StudioDocument {
  const roof = document.roofs[index];
  if (roof === undefined) return document;
  const shape: RoofShapeSet = roof.shape ?? { is: roofShapeNow(roof, facts), setBy: 'system' };
  const turned = !(shape.turned ?? turnedNow);
  // The ends a person set were ends of the ridge as it ran: turned, they are sides of it.
  const sides = roofSidesOf(roof).map(({ end: _end, ...rest }) => rest);
  const cleared = roof.sides === undefined ? {} : { sides };
  return withRoof(document, index, { ...roof, ...cleared, shape: { ...shape, turned } });
}
