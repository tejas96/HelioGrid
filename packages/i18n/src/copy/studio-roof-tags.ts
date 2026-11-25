import type { TranslatedText } from '@heliogrid/contracts';
import type {
  DraftRefusal,
  EditRefusal,
  RoofGrip,
  RoofHold,
  RoofSnap,
  SnapOwner,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';

type T = Translator['t'];

/**
 * The small tags beside the spot and the drag in hand (`T-M05-002`, part b): what a snap caught,
 * why a spot or a drag would be refused, a turn's size, a new corner.
 */
const TAG = {
  snapSquare: /*i18n*/ { id: 'Square 90°' },
  snapParallel: /*i18n*/ { id: 'Parallel' },
  snapSquareInLine: /*i18n*/ { id: 'Square 90° · in line' },
  snapParallelInLine: /*i18n*/ { id: 'Parallel · in line' },
  snapSquareCorner: /*i18n*/ { id: 'Square corner' },
  snapRoofCorner: /*i18n*/ { id: 'Roof {number} corner' },
  snapRoofEdge: /*i18n*/ { id: 'Roof {number} edge' },
  snapFaceCorner: /*i18n*/ { id: 'Face {number} corner' },
  snapFaceEdge: /*i18n*/ { id: 'Face {number} edge' },
  snapInsideParapet: /*i18n*/ { id: 'Inside Roof {number}’s parapet' },
  snapLinesUp: /*i18n*/ { id: 'Lines up with corner {number}' },
  snapHeld: /*i18n*/ { id: '{length} held' },
  snapRoofWallLine: /*i18n*/ { id: 'Roof {number} wall line' },
  snapFaceWallLine: /*i18n*/ { id: 'Face {number} line' },
  snapRoofMiddle: /*i18n*/ { id: 'Roof {number} edge middle' },
  snapFaceMiddle: /*i18n*/ { id: 'Face {number} edge middle' },
  snapSquareToRoof: /*i18n*/ { id: 'Square to Roof {number}' },
  snapSquareToFace: /*i18n*/ { id: 'Square to Face {number}' },
  snapParallelToRoof: /*i18n*/ { id: 'Parallel to Roof {number}' },
  snapParallelToFace: /*i18n*/ { id: 'Parallel to Face {number}' },
  snapLinesUpWithRoof: /*i18n*/ { id: 'Lines up with Roof {number} corner' },
  snapLinesUpWithFace: /*i18n*/ { id: 'Lines up with Face {number} corner' },
  snapBoth: /*i18n*/ { id: '{first} · {second}' },
  tagCross: /*i18n*/ { id: 'Would cross' },
  tagNewCorner: /*i18n*/ { id: 'New corner · drag it' },
  tagTurned: /*i18n*/ { id: 'Turned {degrees}°' },
} as const;

/** How the roof words show a length and the storey height: already formatted for the reader. */
interface LengthShown {
  readonly length: (metres: number) => string;
}

/** A tag's words, and whether it says why something cannot be. */
export interface RoofTag {
  readonly text: TranslatedText;
  readonly bad: boolean;
}

/** The spot under the pointer while drawing, as its tag reads it. */
export interface SpotFacts {
  readonly refusal: DraftRefusal | null;
  readonly snap: RoofSnap | null;
  /** The angle the spot makes with the last two corners, in whole degrees. */
  readonly angle: number | null;
}

/** The drag in hand, as its tag reads it. */
export interface DragFacts {
  readonly fault: EditRefusal | null;
  readonly snap: RoofSnap | null;
  readonly grip: RoofGrip['kind'];
  /** A turn's angle so far, in degrees: said by its size. */
  readonly degrees: number;
}

/** A tag that is one fixed word, or a turn by its size. */
export function tagWord(t: T, kind: 'cross' | 'new' | 'turned', degrees = 0): TranslatedText {
  if (kind === 'cross') return t(TAG.tagCross);
  if (kind === 'new') return t(TAG.tagNewCorner);
  return t(TAG.tagTurned, { degrees: Math.round(Math.abs(degrees)) });
}

/** Whose it is, by number: a roof's or a face's. */
const numberOf = (owner: SnapOwner) => ({
  number: owner.kind === 'face' ? owner.face + 1 : owner.roof + 1,
});

/** What a snap caught, as its small label names it; two lines that cross name both. */
export function snapName(t: T, snap: RoofSnap, shown: LengthShown): TranslatedText {
  if (snap.kind === 'cross') {
    return t(TAG.snapBoth, {
      first: holdName(t, snap.first, shown),
      second: holdName(t, snap.second, shown),
    });
  }
  return holdName(t, snap, shown);
}

/** A hold named by whose it is: a roof's words, or a face's. */
const BY_OWNER = {
  corner_of: [TAG.snapRoofCorner, TAG.snapFaceCorner],
  edge_of: [TAG.snapRoofEdge, TAG.snapFaceEdge],
  wall_line: [TAG.snapRoofWallLine, TAG.snapFaceWallLine],
  middle_of: [TAG.snapRoofMiddle, TAG.snapFaceMiddle],
  lines_up_with: [TAG.snapLinesUpWithRoof, TAG.snapLinesUpWithFace],
} as const;

function holdName(t: T, snap: RoofHold, shown: LengthShown): TranslatedText {
  switch (snap.kind) {
    case 'corner_of':
    case 'edge_of':
    case 'wall_line':
    case 'middle_of':
    case 'lines_up_with': {
      const [roof, face] = BY_OWNER[snap.kind];
      return t(snap.owner.kind === 'face' ? face : roof, numberOf(snap.owner));
    }
    case 'frame': {
      const face = snap.owner.kind === 'face';
      if (snap.along === 'square')
        return t(face ? TAG.snapSquareToFace : TAG.snapSquareToRoof, numberOf(snap.owner));
      return t(face ? TAG.snapParallelToFace : TAG.snapParallelToRoof, numberOf(snap.owner));
    }
    case 'square':
      return t(TAG.snapSquare);
    case 'parallel':
      return t(TAG.snapParallel);
    case 'square_corner':
      return t(TAG.snapSquareCorner);
    case 'inside_parapet':
      return t(TAG.snapInsideParapet, { number: snap.owner.roof + 1 });
    case 'lines_up':
      if (snap.along === 'square') return t(TAG.snapSquareInLine);
      if (snap.along === 'parallel') return t(TAG.snapParallelInLine);
      return t(TAG.snapLinesUp, { number: snap.corner + 1 });
    case 'held':
      return t(TAG.snapHeld, { length: shown.length(snap.metres) });
  }
}
