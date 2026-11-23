import type { TranslatedText } from '@heliogrid/contracts';
import type {
  CompassWay,
  HeightFrom,
  LengthsMeasured,
  ParapetBuild,
  RoofCrossing,
  RoofKind,
  RoofName,
  RoofNumber,
  RoofShape,
  SideWallWhy,
  SlopeWay,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { roofKindWord, roofNameWord } from './studio-roof-kinds';

type T = Translator['t'];

/**
 * A roof's sheet and a side's sheet (`T-M05-002`, part e, board section 6): one row per value,
 * the way a roof slopes in words, its floors, the shapes, the parapet's details, and the resets.
 * Each value sits inside its message, as Hindi and Marathi put their words after a figure.
 */
const SHEET = {
  kind: /*i18n*/ { id: 'What it is' },
  madeOf: /*i18n*/ { id: 'Made of' },
  shape: /*i18n*/ { id: 'Shape' },
  heightGround: /*i18n*/ { id: 'Height from ground' },
  heightAbove: /*i18n*/ { id: 'Height above {roof}' },
  heightLowEdge: /*i18n*/ { id: 'Height of low edge' },
  slope: /*i18n*/ { id: 'Slope' },
  lowerSlope: /*i18n*/ { id: 'Lower slope' },
  parapet: /*i18n*/ { id: 'Parapet' },
  parapetAllRound: /*i18n*/ { id: 'Parapet all round' },
  parapetRoundValue: /*i18n*/ { id: 'All round · {height}' },
  parapetNone: /*i18n*/ { id: 'None' },
  setback: /*i18n*/ { id: 'Setback' },
  details: /*i18n*/ { id: 'Parapet details' },
  detailsValue: /*i18n*/ { id: '{thickness} · {measured}' },
  thickness: /*i18n*/ { id: 'Thickness' },
  built: /*i18n*/ { id: 'Built as' },
  measuredTitle: /*i18n*/ { id: 'The lengths are measured' },
  measuredOutside: /*i18n*/ { id: 'Outside the parapet' },
  measuredInside: /*i18n*/ { id: 'Inside the parapet' },
  measuredOutsideShort: /*i18n*/ { id: 'outside' },
  measuredInsideShort: /*i18n*/ { id: 'inside' },
  checkOnSite: /*i18n*/ { id: 'Check it on site.' },
  floorG: /*i18n*/ { id: 'G' },
  floorUp: /*i18n*/ { id: 'G+{floor}' },
  heightOnFloor: /*i18n*/ { id: '{height} · {floor}' },
  slopesDown: /*i18n*/ { id: 'Slopes down to the {way}' },
  facesTwo: /*i18n*/ { id: 'Faces {first} and {second}' },
  facesThree: /*i18n*/ { id: 'Faces {first}, {second} and {third}' },
  facesFour: /*i18n*/ { id: 'Faces {first}, {second}, {third} and {fourth}' },
  facesMany: /*i18n*/ { id: 'Faces {count} ways' },
  ridgeAbove: /*i18n*/ { id: '{way} · the ridge is {height} above the low edge' },
  lowAgainst: /*i18n*/ { id: 'Low side against {roof}’s wall · rain runs into it' },
  reset: /*i18n*/ { id: 'Back to {value}' },
  resetSide: /*i18n*/ { id: 'Back to {value}, as the other sides' },
  typeIt: /*i18n*/ { id: 'Type {name}' },
  slideIt: /*i18n*/ { id: 'Slide {name}' },
  moreShapes: /*i18n*/ { id: 'More shapes' },
  fewerShapes: /*i18n*/ { id: 'Fewer shapes' },
  back: /*i18n*/ { id: 'Back' },
  thisSide: /*i18n*/ { id: 'This side' },
  sideOf: /*i18n*/ { id: '{roof} · faces {way}' },
  sideOn: /*i18n*/ { id: 'Has a parapet' },
  sideOff: /*i18n*/ { id: 'No parapet' },
  parapetHeight: /*i18n*/ { id: 'Parapet height' },
  followRoof: /*i18n*/ { id: 'Back to the roof’s parapet' },
  sharedNoWall: /*i18n*/ { id: 'Shared with {roof} · no parapet' },
  underWall: /*i18n*/ { id: 'No parapet where {roof}’s wall stands' },
  lowSide: /*i18n*/ { id: 'Low side' },
  lowHere: /*i18n*/ { id: 'This is the low side' },
  makeLow: /*i18n*/ { id: 'Make this the low side' },
  glassSide: /*i18n*/ { id: 'Glass' },
  glassHere: /*i18n*/ { id: 'The glass faces this way' },
  makeGlass: /*i18n*/ { id: 'Make the glass face this way' },
  endTitle: /*i18n*/ { id: 'This end' },
  gableEnd: /*i18n*/ { id: 'Gable end' },
  hipEnd: /*i18n*/ { id: 'Hip' },
  crossWall: /*i18n*/ { id: 'Above {roof} · to check' },
  crossRidge: /*i18n*/ { id: 'Ridge through {roof} · to check' },
  crossSunk: /*i18n*/ { id: 'Below {roof}’s parapet · to check' },
  crossEdge: /*i18n*/ { id: 'Past {roof}’s edge · to check' },
  pickRoof: /*i18n*/ { id: 'Pick {roof}' },
  wallArrow: /*i18n*/ { id: 'Drag to change this side’s parapet height' },
  ridgeArrow: /*i18n*/ { id: 'Drag to change the ridge’s height' },
} as const;

const NUMBER: Record<RoofNumber, (typeof SHEET)[keyof typeof SHEET] | { readonly id: string }> = {
  slope: SHEET.slope,
  upper_slope: /*i18n*/ { id: 'Upper slope' },
  break_in: /*i18n*/ { id: 'Where the slope breaks' },
  teeth: /*i18n*/ { id: 'Teeth' },
  raised_height: /*i18n*/ { id: 'Raised middle’s height' },
  raised_width: /*i18n*/ { id: 'Raised middle’s width' },
  valley: /*i18n*/ { id: 'Where the valley sits' },
  overhang: /*i18n*/ { id: 'Overhang' },
  parapet_height: SHEET.parapetHeight,
  setback: SHEET.setback,
  thickness: SHEET.thickness,
};

const CROSS: Record<RoofCrossing['kind'], { readonly id: string }> = {
  wall_above: SHEET.crossWall,
  ridge_through: SHEET.crossRidge,
  sunk: SHEET.crossSunk,
  past_edge: SHEET.crossEdge,
};

const SHAPE: Record<RoofShape, { readonly id: string }> = {
  flat: /*i18n*/ { id: 'Flat' },
  shed: /*i18n*/ { id: 'Shed' },
  gable: /*i18n*/ { id: 'Gable' },
  hip: /*i18n*/ { id: 'Hip' },
  any: /*i18n*/ { id: 'Any shape' },
  sawtooth: /*i18n*/ { id: 'Sawtooth' },
  monitor: /*i18n*/ { id: 'Monitor' },
  curved: /*i18n*/ { id: 'Curved' },
  butterfly: /*i18n*/ { id: 'Butterfly' },
  mansard: /*i18n*/ { id: 'Mansard' },
  gambrel: /*i18n*/ { id: 'Gambrel' },
};

const WAY: Record<CompassWay, { readonly id: string }> = {
  north: /*i18n*/ { id: 'north' },
  north_east: /*i18n*/ { id: 'north-east' },
  east: /*i18n*/ { id: 'east' },
  south_east: /*i18n*/ { id: 'south-east' },
  south: /*i18n*/ { id: 'south' },
  south_west: /*i18n*/ { id: 'south-west' },
  west: /*i18n*/ { id: 'west' },
  north_west: /*i18n*/ { id: 'north-west' },
};

const BUILD: Record<ParapetBuild, { readonly id: string }> = {
  wall: /*i18n*/ { id: 'Wall' },
  railing: /*i18n*/ { id: 'Railing' },
};

const SHORT_MEASURED: Record<LengthsMeasured, { readonly id: string }> = {
  outside: SHEET.measuredOutsideShort,
  inside: SHEET.measuredInsideShort,
};

function waysWord(t: T, way: SlopeWay): TranslatedText {
  if (way.kind === 'down') return t(SHEET.slopesDown, { way: t(WAY[way.way]) });
  const [first, second, third, fourth] = way.ways.map((each) => t(WAY[each]));
  switch (way.ways.length) {
    case 2:
      return t(SHEET.facesTwo, { first, second });
    case 3:
      return t(SHEET.facesThree, { first, second, third });
    case 4:
      return t(SHEET.facesFour, { first, second, third, fourth });
    default:
      return t(SHEET.facesMany, { count: way.ways.length });
  }
}

/** The sheets' words, part of the studio canvas's (`studioCanvasWords`). */
export function studioSheetWords(t: T) {
  return {
    rowKind: t(SHEET.kind),
    /** What a roof is: "Stair room", "Open shed". */
    kindWord: (kind: RoofKind) => roofKindWord(t, kind),
    rowMadeOfTitle: t(SHEET.madeOf),
    rowShape: t(SHEET.shape),
    /** The height row's name: from the ground, above the roof it stands on, or of its low edge. */
    rowHeight: (from: HeightFrom) =>
      from.kind === 'above'
        ? t(SHEET.heightAbove, { roof: roofNameWord(t, from.roof) })
        : t(from.kind === 'low_edge' ? SHEET.heightLowEdge : SHEET.heightGround),
    /** A number's row name; a mansard's or a gambrel's slope is its lower one. */
    rowNumber: (key: RoofNumber, lower = false) =>
      lower && key === 'slope' ? t(SHEET.lowerSlope) : t(NUMBER[key]),
    rowParapet: t(SHEET.parapet),
    parapetAllRound: t(SHEET.parapetAllRound),
    /** The parapet row's value: "All round · 1.0 m", or None; the height already formatted. */
    parapetValue: (allRound: boolean, height: string) =>
      allRound ? t(SHEET.parapetRoundValue, { height }) : t(SHEET.parapetNone),
    rowDetails: t(SHEET.details),
    /** Parapet details' value: "0.23 m · outside"; the thickness already formatted. */
    detailsValue: (thickness: string, measured: LengthsMeasured) =>
      t(SHEET.detailsValue, { thickness, measured: t(SHORT_MEASURED[measured]) }),
    builtTitle: t(SHEET.built),
    built: (build: ParapetBuild) => t(BUILD[build]),
    measuredTitle: t(SHEET.measuredTitle),
    measured: (to: LengthsMeasured) =>
      t(to === 'outside' ? SHEET.measuredOutside : SHEET.measuredInside),
    checkOnSite: t(SHEET.checkOnSite),
    /** A floor under the height slider: G, G+1, … */
    floor: (floor: number) => (floor === 0 ? t(SHEET.floorG) : t(SHEET.floorUp, { floor })),
    /** A height on a floor: "3.0 m · G"; the height already formatted. */
    heightOnFloor: (height: string, floor: string) => t(SHEET.heightOnFloor, { height, floor }),
    /** Which way a roof slopes, and how high its ridge stands; the height already formatted. */
    slopeWay: (way: SlopeWay, ridge: string | null) =>
      ridge === null
        ? waysWord(t, way)
        : t(SHEET.ridgeAbove, { way: waysWord(t, way), height: ridge }),
    lowAgainst: (roof: RoofName) => t(SHEET.lowAgainst, { roof: roofNameWord(t, roof) }),
    /** A reset: back to the studio's value, or on a side to the roof's; the value formatted. */
    reset: (value: string, onSide = false) => t(onSide ? SHEET.resetSide : SHEET.reset, { value }),
    /** The small switch beside a number, spoken: to the box, or back to the slider. */
    typeIt: (name: TranslatedText) => t(SHEET.typeIt, { name }),
    slideIt: (name: TranslatedText) => t(SHEET.slideIt, { name }),
    shape: (shape: RoofShape) => t(SHAPE[shape]),
    moreShapes: t(SHEET.moreShapes),
    fewerShapes: t(SHEET.fewerShapes),
    sheetBack: t(SHEET.back),
    thisSide: t(SHEET.thisSide),
    /** A side's sheet's line: "Roof 1 · faces south-west". */
    sideOf: (roof: RoofName, way: CompassWay) =>
      t(SHEET.sideOf, { roof: roofNameWord(t, roof), way: t(WAY[way]) }),
    sideWall: (on: boolean) => t(on ? SHEET.sideOn : SHEET.sideOff),
    /** Why a side has no parapet where another roof takes it; `null` where nothing needs saying. */
    sideWallWhy: (why: SideWallWhy): TranslatedText | null => {
      if (why.kind === 'shared') return t(SHEET.sharedNoWall, { roof: roofNameWord(t, why.with) });
      if (why.kind === 'under') return t(SHEET.underWall, { roof: roofNameWord(t, why.with) });
      return null;
    },
    followRoof: t(SHEET.followRoof),
    lowSide: t(SHEET.lowSide),
    lowHere: t(SHEET.lowHere),
    makeLow: t(SHEET.makeLow),
    glassSide: t(SHEET.glassSide),
    glassHere: t(SHEET.glassHere),
    makeGlass: t(SHEET.makeGlass),
    endTitle: t(SHEET.endTitle),
    end: (end: 'gable' | 'hip') => t(end === 'gable' ? SHEET.gableEnd : SHEET.hipEnd),
    /** A roof's keyboard stop in the top view, spoken: Enter picks it. */
    pickRoof: (roof: RoofName) => t(SHEET.pickRoof, { roof: roofNameWord(t, roof) }),
    wallArrow: t(SHEET.wallArrow),
    /** What a changed roof crosses, on the roof it crosses: allowed, and to check. */
    crossing: (crossing: RoofCrossing) =>
      t(CROSS[crossing.kind], { roof: roofNameWord(t, crossing.name) }),
    ridgeArrow: t(SHEET.ridgeArrow),
  };
}
