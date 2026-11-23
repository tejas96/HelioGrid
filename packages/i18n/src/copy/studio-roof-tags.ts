import type { TranslatedText } from '@heliogrid/contracts';
import type { DraftRefusal, EditRefusal, RoofGrip, RoofSnap } from '@heliogrid/domain';
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
  snapInsideParapet: /*i18n*/ { id: 'Inside Roof {number}’s parapet' },
  snapLinesUp: /*i18n*/ { id: 'Lines up with corner {number}' },
  snapHeld: /*i18n*/ { id: '{length} held' },
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

/** What a snap caught, as its small label names it. */
export function snapName(t: T, snap: RoofSnap, shown: LengthShown): TranslatedText {
  switch (snap.kind) {
    case 'square':
      return t(TAG.snapSquare);
    case 'parallel':
      return t(TAG.snapParallel);
    case 'square_corner':
      return t(TAG.snapSquareCorner);
    case 'corner_of':
      return t(TAG.snapRoofCorner, { number: snap.owner.roof + 1 });
    case 'edge_of':
      return t(TAG.snapRoofEdge, { number: snap.owner.roof + 1 });
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
