import type { TranslatedText } from '@heliogrid/contracts';
import {
  type DraftRefusal,
  type EditRefusal,
  LENGTH_MAX_M,
  LENGTH_MIN_M,
  ROOF_CORNERS_MAX,
  ROOFS_MAX,
  type RoofSaid,
  type RoofSnap,
  type StudioHelper,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

/** The roof step's words (`T-M05-002`, part b): drawing, the bar, the snaps, the length box, the marks. */
const ROOF = {
  drawFirst: /*i18n*/ { id: 'Tap the first corner of the roof' },
  drawNext: /*i18n*/ { id: 'Tap the next corner' },
  drawGhost: /*i18n*/ { id: 'Tap Close: the 4th corner is ready' },
  drawSnaps: /*i18n*/ { id: 'Corners snap square.' },
  drawSquareOff: /*i18n*/ { id: 'Square is off. Corners go where you tap.' },
  helpers: /*i18n*/ { id: 'Drawing helpers' },
  helperSquare: /*i18n*/ { id: 'Square' },
  helperLineUp: /*i18n*/ { id: 'Line up' },
  helperBuildings: /*i18n*/ { id: 'Buildings' },
  noBuildingData: /*i18n*/ {
    id: 'No building data here yet. Buildings snaps to your other roofs.',
  },
  addRoof: /*i18n*/ { id: 'Draw another roof' },
  helpersNotSaved: /*i18n*/ { id: 'Your pick was not saved.' },
  drawCorners: /*i18n*/ { id: '{count, plural, one {# corner} other {# corners}}' },
  drawCornersLast: /*i18n*/ {
    id: '{count, plural, one {# corner · last edge {length}} other {# corners · last edge {length}}}',
  },
  drawCrossTitle: /*i18n*/ { id: 'This edge would cross another' },
  drawCrossLine: /*i18n*/ { id: 'Tap a spot where the edges do not cross.' },
  drawOverTitle: /*i18n*/ { id: 'This edge would run over another roof' },
  drawOverLine: /*i18n*/ { id: 'Roofs cannot overlap yet. Tap outside the other roof.' },
  drawFarTitle: /*i18n*/ { id: 'That spot is too far from the pin' },
  drawCloseTitle: /*i18n*/ { id: 'Too close to another corner' },
  drawCloseLine: /*i18n*/ { id: 'Tap a little farther from it.' },
  drawFarLine: /*i18n*/ { id: 'Tap nearer the building.' },
  drawManyTitle: /*i18n*/ { id: 'A roof has at most {max} corners' },
  drawFewTitle: /*i18n*/ { id: 'A roof needs at least 3 corners' },
  drawRoofsTitle: /*i18n*/ { id: 'A design holds at most {max} roofs' },
  drawFixLine: /*i18n*/ { id: 'Close the shape, or Cancel.' },
  cancel: /*i18n*/ { id: 'Cancel' },
  closeShape: /*i18n*/ { id: 'Close shape' },

  roofArea: /*i18n*/ { id: 'Roof · {area}' },
  roofClosed: /*i18n*/ { id: 'Height {height} is assumed. Drag a corner to fix the shape.' },
  roofIdle: /*i18n*/ { id: 'Drag a corner to fix the shape.' },
  roofIdle3d: /*i18n*/ { id: 'Tap the roof to change its height.' },
  seeIn3d: /*i18n*/ { id: 'See it in 3D' },
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
  wentBackOver: /*i18n*/ { id: 'Roofs cannot overlap yet. The roof went back.' },
  wentBackFar: /*i18n*/ { id: 'That is too far from the pin. The roof went back.' },
  editCross: /*i18n*/ { id: 'Those edges would cross.' },
  editOver: /*i18n*/ { id: 'Roofs cannot overlap yet.' },
  editFar: /*i18n*/ { id: 'That is too far from the pin.' },
  editShort: /*i18n*/ { id: 'A length is at least {length}.' },
  editLong: /*i18n*/ { id: 'A length is at most {length}.' },
  editHeld: /*i18n*/ { id: 'A length you set would change. Change that length first.' },
  editTwoHeld: /*i18n*/ { id: 'Both lengths at this corner are set. Tap a length to change it.' },
  editThree: /*i18n*/ { id: 'A roof keeps at least 3 corners.' },
  editManyCorners: /*i18n*/ { id: 'A roof has at most {max} corners.' },
  editScale: /*i18n*/ { id: 'That length is far from the picture. Check the number.' },

  snapSquare: /*i18n*/ { id: 'Square' },
  snapSquareCorner: /*i18n*/ { id: 'Square corner' },
  snapRoofCorner: /*i18n*/ { id: 'Roof {number} corner' },
  snapRoofEdge: /*i18n*/ { id: 'Roof {number} edge' },
  snapLinesUp: /*i18n*/ { id: 'Lines up with corner {number}' },
  snapHeld: /*i18n*/ { id: '{length} held' },
  tagCross: /*i18n*/ { id: 'Would cross' },
  tagOver: /*i18n*/ { id: 'Over a roof' },
  tagNewCorner: /*i18n*/ { id: 'New corner · drag it' },
  tagTurned: /*i18n*/ { id: 'Turned {degrees}°' },

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
  /** The roof's height, formatted. */
  readonly height: string;
}

const DRAW_REFUSAL: Record<
  DraftRefusal,
  (t: T) => { title: TranslatedText; line: TranslatedText }
> = {
  would_cross: (t) => ({ title: t(ROOF.drawCrossTitle), line: t(ROOF.drawCrossLine) }),
  would_overlap: (t) => ({ title: t(ROOF.drawOverTitle), line: t(ROOF.drawOverLine) }),
  too_far: (t) => ({ title: t(ROOF.drawFarTitle), line: t(ROOF.drawFarLine) }),
  too_close: (t) => ({ title: t(ROOF.drawCloseTitle), line: t(ROOF.drawCloseLine) }),
  too_many_corners: (t) => ({
    title: t(ROOF.drawManyTitle, { max: ROOF_CORNERS_MAX }),
    line: t(ROOF.drawFixLine),
  }),
  too_few_corners: (t) => ({ title: t(ROOF.drawFewTitle), line: t(ROOF.drawFixLine) }),
  too_many_roofs: (t) => ({
    title: t(ROOF.drawRoofsTitle, { max: ROOFS_MAX }),
    line: t(ROOF.drawFixLine),
  }),
};

function editRefusalLine(t: T, refusal: EditRefusal, shown: RoofWordsShown): TranslatedText {
  switch (refusal) {
    case 'would_cross':
      return t(ROOF.editCross);
    case 'would_overlap':
      return t(ROOF.editOver);
    case 'too_far':
      return t(ROOF.editFar);
    case 'too_short':
      return t(ROOF.editShort, { length: shown.length(LENGTH_MIN_M) });
    case 'too_long':
      return t(ROOF.editLong, { length: shown.length(LENGTH_MAX_M) });
    case 'held_length':
      return t(ROOF.editHeld);
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

function snapName(t: T, snap: RoofSnap, shown: RoofWordsShown): TranslatedText {
  switch (snap.kind) {
    case 'square':
      return t(ROOF.snapSquare);
    case 'square_corner':
      return t(ROOF.snapSquareCorner);
    case 'corner_of':
      return t(ROOF.snapRoofCorner, { number: snap.owner.roof + 1 });
    case 'edge_of':
      return t(ROOF.snapRoofEdge, { number: snap.owner.roof + 1 });
    case 'lines_up':
      return t(ROOF.snapLinesUp, { number: snap.corner + 1 });
    case 'held':
      return t(ROOF.snapHeld, { length: shown.length(snap.metres) });
  }
}

function roofSaidLine(t: T, said: RoofSaid, shown: RoofWordsShown): TranslatedText {
  switch (said.kind) {
    case 'closed':
      return t(ROOF.roofClosed, { height: shown.height });
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
      return t(ROOF.roofTurned, { degrees: said.degrees });
    case 'went_back':
      if (said.fault === 'would_overlap') return t(ROOF.wentBackOver);
      if (said.fault === 'too_far') return t(ROOF.wentBackFar);
      return t(ROOF.wentBackCross);
    case 'refused':
      return editRefusalLine(t, said.refusal, shown);
  }
}

/** The roof step's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioRoofWords(t: T) {
  return {
    /** The bar's title while drawing: what to tap now. */
    drawTitle: (corners: number, ghost: boolean): TranslatedText => {
      if (ghost) return t(ROOF.drawGhost);
      return corners === 0 ? t(ROOF.drawFirst) : t(ROOF.drawNext);
    },
    /**
     * "3 corners · last edge ~7.6 m": the length already formatted. With Square off the bar says so
     * instead, so no one wonders why a corner did not snap.
     */
    drawLine: (corners: number, lastEdge: string | null, square: boolean): TranslatedText => {
      if (!square) return t(ROOF.drawSquareOff);
      if (corners === 0) return t(ROOF.drawSnaps);
      return lastEdge === null
        ? t(ROOF.drawCorners, { count: corners })
        : t(ROOF.drawCornersLast, { count: corners, length: lastEdge });
    },
    /** Why a corner or a close is refused: the bar's title and its line. */
    drawRefusal: (refusal: DraftRefusal): { title: TranslatedText; line: TranslatedText } =>
      DRAW_REFUSAL[refusal](t),
    helpers: t(ROOF.helpers),
    helper: {
      square: t(ROOF.helperSquare),
      line_up: t(ROOF.helperLineUp),
      buildings: t(ROOF.helperBuildings),
    } satisfies Record<StudioHelper, TranslatedText>,
    noBuildingData: t(ROOF.noBuildingData),
    addRoof: t(ROOF.addRoof),
    helpersNotSaved: t(ROOF.helpersNotSaved),
    /** The angle the next corner makes, beside the spot: digits and the degree sign, never translated. */
    angle: (degrees: number) => shownAsSent(`${degrees}°`),
    cancel: t(ROOF.cancel),
    closeShape: t(ROOF.closeShape),
    /** "Roof · 66 m²": the area already formatted. */
    roofArea: (area: string) => t(ROOF.roofArea, { area }),
    /** What the bar says of the roofs: after an act, while a length is in the box, or at rest. */
    roofLine: (said: RoofSaid | null, sizing: boolean, shown: RoofWordsShown): TranslatedText => {
      if (sizing) return t(ROOF.roofSizing);
      if (said === null) return t(ROOF.roofIdle);
      return roofSaidLine(t, said, shown);
    },
    /** Why an edit is refused, said in the bar: the limits already formatted. */
    editRefusal: (refusal: EditRefusal, shown: RoofWordsShown): TranslatedText =>
      editRefusalLine(t, refusal, shown),
    seeIn3d: t(ROOF.seeIn3d),
    /** The bar at rest in 3D, where a roof's height is changed and its outline is not. */
    roofIdle3d: t(ROOF.roofIdle3d),
    /** The small label a snap shows beside the spot. */
    snap: (snap: RoofSnap, shown: RoofWordsShown): TranslatedText => snapName(t, snap, shown),
    tagCross: t(ROOF.tagCross),
    tagOver: t(ROOF.tagOver),
    tagNewCorner: t(ROOF.tagNewCorner),
    tagTurned: (degrees: number) => t(ROOF.tagTurned, { degrees }),
    cornerName: (number: number) => t(ROOF.cornerName, { number }),
    cornerFirst: t(ROOF.cornerFirst),
    cornerAdd: t(ROOF.cornerAdd),
    cornerRemove: (number: number) => t(ROOF.cornerRemove, { number }),
    edgeLength: (number: number, length: string) => t(ROOF.edgeLength, { number, length }),
    moveRoof: t(ROOF.moveRoof),
    turnRoof: t(ROOF.turnRoof),
  };
}
