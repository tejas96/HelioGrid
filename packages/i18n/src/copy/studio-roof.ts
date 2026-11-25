import type { TranslatedText } from '@heliogrid/contracts';
import {
  type EditRefusal,
  type KindLine,
  LENGTH_MAX_M,
  LENGTH_MIN_M,
  ROOF_CORNERS_MAX,
  type RoofSaid,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { studioFacesWords } from './studio-faces';
import { historyLine } from './studio-history';
import { drawRefusalOf, studioRoofDrawWords } from './studio-roof-draw';
import { kindLineWords, roofPlaceLine, roofTopWords } from './studio-roof-kinds';
import {
  type DragFacts,
  type RoofTag,
  type SpotFacts,
  snapName,
  tagWord,
} from './studio-roof-tags';

type T = Translator['t'];

/** The roof step's words (`T-M05-002`, part b): drawing, the bar, the snaps, the length box, the marks. */
const ROOF = {
  deleteRoof: /*i18n*/ { id: 'Delete roof' },
  roofDeleted: /*i18n*/ { id: 'Roof deleted. Undo brings it back.' },

  roofClosed: /*i18n*/ {
    id: 'Height {height} is the usual storey here. Drag a corner to fix the shape.',
  },
  roofSizing: /*i18n*/ { id: 'Set the true length of the marked edge.' },
  roofSized: /*i18n*/ { id: 'All lengths sized from the one length you set.' },
  roofSet: /*i18n*/ { id: 'Edge set to {length}.' },
  roofSetMeasured: /*i18n*/ { id: 'Edge set to {length} · measured on site.' },
  cornerMoved: /*i18n*/ { id: 'Corner moved. Undo puts it back.' },
  cornerMovedSnap: /*i18n*/ { id: 'Corner moved · {snap}. Undo puts it back.' },
  cornerHeld: /*i18n*/ { id: 'Corner moved. The length you set held.' },
  cornerAdded: /*i18n*/ { id: 'Corner added. Drag it into place.' },
  cornerPicked: /*i18n*/ { id: 'Corner picked. Tap × to remove it.' },
  cornerRemoved: /*i18n*/ { id: 'Corner removed. Undo puts it back.' },
  roofMoved: /*i18n*/ { id: 'Roof moved. Undo puts it back.' },
  roofTurned: /*i18n*/ { id: 'Roof turned {degrees}°. Undo puts it back.' },
  wentBackCross: /*i18n*/ { id: 'Those edges would cross. The roof went back.' },
  wentBackFar: /*i18n*/ {
    id: 'Past {reach} from the pin · this is another site. The roof went back.',
  },
  wentBackClose: /*i18n*/ { id: 'That corner was too close to another. The roof went back.' },
  editCross: /*i18n*/ { id: 'Those edges would cross.' },
  editClose: /*i18n*/ { id: 'That corner would be too close to another.' },
  dragCrowded: /*i18n*/ { id: 'Drag the corner. Zoom in for more room.' },
  editShort: /*i18n*/ { id: 'A length is at least {length}.' },
  editLong: /*i18n*/ { id: 'A length is at most {length}.' },
  editHeld: /*i18n*/ { id: 'A length you set would change. Change that length first.' },
  editHeldLength: /*i18n*/ {
    id: 'The {length} you set would change. Change that length first.',
  },
  editTwoHeld: /*i18n*/ { id: 'Both lengths at this corner are set. Tap a length to change it.' },
  editThree: /*i18n*/ { id: 'A roof keeps at least 3 corners.' },
  editManyCorners: /*i18n*/ { id: 'A roof has at most {max} corners.' },
  editScale: /*i18n*/ { id: 'That length is far from the picture. Check the number.' },
  placedOnPicture: /*i18n*/ { id: 'Placed on the pin. Drag it onto the house.' },
  placedOnGrid: /*i18n*/ { id: 'Every length is yours. Drag a + out for an L.' },
  placedBeside: /*i18n*/ { id: 'Placed beside Roof {number}. Drag it onto the house.' },

  cornerName: /*i18n*/ { id: 'Corner {number}' },
  cornerFirst: /*i18n*/ { id: 'Corner 1: close the shape' },
  cornerAdd: /*i18n*/ { id: 'Add a corner on this edge' },
  cornerRemove: /*i18n*/ { id: 'Remove corner {number}' },
  edgeLength: /*i18n*/ { id: 'Edge {number}: {length}. Change it' },
  moveRoof: /*i18n*/ { id: 'Move the roof' },
  turnRoof: /*i18n*/ { id: 'Turn the roof' },
} as const;

/** Lengths a sentence names, already formatted in the reader's units by the screen. */
export interface RoofWordsShown {
  /** A length in metres, formatted. */
  readonly length: (metres: number) => string;
  /** The storey height a new roof stands at, formatted. */
  readonly height: string;
  /** A roof's own height in metres, formatted. */
  readonly heightOf: (metres: number) => string;
  /** How far from the pin one site reaches, formatted: a roof past it is another site. */
  readonly reach: string;
}

function editRefusalLine(
  t: T,
  refusal: EditRefusal,
  shown: RoofWordsShown,
  /** The set length that holds, in metres, for `held_length`. */
  held: number | null = null,
): TranslatedText {
  switch (refusal) {
    case 'would_cross':
      return t(ROOF.editCross);
    case 'too_far':
      return drawRefusalOf(t, 'too_far', shown).line;
    case 'too_close':
      return t(ROOF.editClose);
    case 'too_short':
      return t(ROOF.editShort, { length: shown.length(LENGTH_MIN_M) });
    case 'too_long':
      return t(ROOF.editLong, { length: shown.length(LENGTH_MAX_M) });
    case 'held_length':
      return held === null
        ? t(ROOF.editHeld)
        : t(ROOF.editHeldLength, { length: shown.length(held) });
    case 'two_held':
      return t(ROOF.editTwoHeld);
    case 'keeps_three':
      return t(ROOF.editThree);
    case 'too_many_corners':
      return t(ROOF.editManyCorners, { max: ROOF_CORNERS_MAX });
    case 'scale_out_of_range':
      return t(ROOF.editScale);
  }
}

/** After Place roof: on the grid, how to make an L; on the picture, where it went and what next. */
function placedLine(t: T, said: Extract<RoofSaid, { kind: 'placed' }>): TranslatedText {
  if (!said.onPicture) return t(ROOF.placedOnGrid);
  return said.beside === null
    ? t(ROOF.placedOnPicture)
    : t(ROOF.placedBeside, { number: said.beside + 1 });
}

/** What an act just did, in a line; `null` for an act that has no more to say than the model shows. */
function roofSaidLine(t: T, said: RoofSaid, shown: RoofWordsShown): TranslatedText | null {
  switch (said.kind) {
    case 'closed':
      // A roof placed among others says what it became; a first roof, where its height came from.
      return roofPlaceLine(t, said, shown.heightOf) ?? t(ROOF.roofClosed, { height: shown.height });
    case 'cut':
    case 'made':
    case 'joined':
    case 'copied':
    case 'sticks_out':
    case 'set_free':
    case 'notched':
    case 'side_wall':
    case 'material_set':
      return roofPlaceLine(t, said, shown.heightOf);
    case 'faces_drawn':
      return studioFacesWords(t).facesDrawn(said.count);
    case 'sized':
      return t(ROOF.roofSized);
    case 'set':
      return said.measured
        ? t(ROOF.roofSetMeasured, { length: shown.length(said.metres) })
        : t(ROOF.roofSet, { length: shown.length(said.metres) });
    case 'corner_moved':
      if (said.snap === null) return t(ROOF.cornerMoved);
      if (said.snap.kind === 'held') return t(ROOF.cornerHeld);
      return t(ROOF.cornerMovedSnap, { snap: snapName(t, said.snap, shown) });
    case 'corner_added':
      return t(ROOF.cornerAdded);
    case 'corner_picked':
      return t(ROOF.cornerPicked);
    case 'corner_removed':
      return t(ROOF.cornerRemoved);
    case 'roof_moved':
      return t(ROOF.roofMoved);
    case 'roof_turned':
      // A turn is said by its size: which way it went is on the screen.
      return t(ROOF.roofTurned, { degrees: Math.abs(said.degrees) });
    case 'undone':
      return historyLine(t, true, said.change);
    case 'redone':
      return historyLine(t, false, said.change);
    case 'roof_picked':
      // The picked roof is ringed on the model, and Roofs and its sheet name it.
      return null;
    case 'roof_deleted':
      return roofPlaceLine(t, said, shown.heightOf) ?? t(ROOF.roofDeleted);
    case 'went_back':
      if (said.fault === 'too_far') return t(ROOF.wentBackFar, { reach: shown.reach });
      if (said.fault === 'too_close') return t(ROOF.wentBackClose);
      return t(ROOF.wentBackCross);
    case 'refused':
      return editRefusalLine(t, said.refusal, shown);
    case 'placed':
      return placedLine(t, said);
  }
}

/** The roof step's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioRoofWords(t: T) {
  return {
    ...studioRoofDrawWords(t),
    /** The trash on a picked roof. */
    deleteRoof: t(ROOF.deleteRoof),
    /**
     * A moment's words in the bar: what an act just did, or what a length in the box waits for;
     * `null` at rest, where the bar holds the next step alone.
     */
    roofLine: (
      said: RoofSaid | null,
      sizing: boolean,
      shown: RoofWordsShown,
    ): TranslatedText | null => {
      if (sizing) return t(ROOF.roofSizing);
      return said === null ? null : roofSaidLine(t, said, shown);
    },
    ...roofTopWords(t),
    /** The line after a roof closes: what it became, why, and its chips. */
    kindLine: (line: KindLine, shown: RoofWordsShown) => kindLineWords(t, line, shown.heightOf),
    /** Why an edit is refused, said in the bar: the limits already formatted. */
    editRefusal: (
      refusal: EditRefusal,
      shown: RoofWordsShown,
      held: number | null = null,
    ): TranslatedText => editRefusalLine(t, refusal, shown, held),
    /** A corner held among crowded dots: a closer look gives it room. */
    dragCrowded: t(ROOF.dragCrowded),
    /** The tag beside the spot while drawing: why it cannot go there, its snap, or its angle. */
    spotTag: (spot: SpotFacts, shown: RoofWordsShown): RoofTag | null => {
      if (spot.refusal === 'would_cross') return { text: tagWord(t, 'cross'), bad: true };
      if (spot.refusal !== null)
        return { text: drawRefusalOf(t, spot.refusal, shown).title, bad: true };
      if (spot.snap !== null) return { text: snapName(t, spot.snap, shown), bad: false };
      // The angle the next corner makes: digits and the degree sign, never translated.
      return spot.angle === null ? null : { text: shownAsSent(`${spot.angle}°`), bad: false };
    },
    /** The tag beside the drag in hand: why it would go back, its turn, a new corner, or its snap. */
    dragTag: (drag: DragFacts, shown: RoofWordsShown): RoofTag | null => {
      if (drag.fault === 'would_cross') return { text: tagWord(t, 'cross'), bad: true };
      if (drag.fault === 'too_close')
        return { text: drawRefusalOf(t, 'too_close', shown).title, bad: true };
      // Any other refusal is a sentence: the bar says it; the tag beside the finger stays short.
      if (drag.fault !== null) return null;
      if (drag.grip === 'turn') return { text: tagWord(t, 'turned', drag.degrees), bad: false };
      if (drag.grip === 'plus' && drag.snap === null)
        return { text: tagWord(t, 'new'), bad: false };
      return drag.snap === null ? null : { text: snapName(t, drag.snap, shown), bad: false };
    },
    cornerName: (number: number) => t(ROOF.cornerName, { number }),
    cornerFirst: t(ROOF.cornerFirst),
    cornerAdd: t(ROOF.cornerAdd),
    cornerRemove: (number: number) => t(ROOF.cornerRemove, { number }),
    edgeLength: (number: number, length: string) => t(ROOF.edgeLength, { number, length }),
    moveRoof: t(ROOF.moveRoof),
    turnRoof: t(ROOF.turnRoof),
  };
}
