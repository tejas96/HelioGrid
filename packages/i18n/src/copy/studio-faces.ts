import type { TranslatedText } from '@heliogrid/contracts';
import { type HandFaceRows, type HandFacesDrawn, ROOF_HAND_FACES_MAX } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { compassWord } from './studio-sheet';

type T = Translator['t'];

/**
 * An Any-shape roof's faces drawn by hand (`T-M05-002`, part e, E082, board 5.10): the pill's
 * name for the face being drawn, why a face may not close, the line once the roof stands in its
 * faces, the roof's Faces row, and one face's own sheet.
 */
const FACE = {
  drawing: /*i18n*/ { id: 'Face {number}' },
  outsideTitle: /*i18n*/ { id: 'Off the roof' },
  outsideLine: /*i18n*/ { id: 'A face stays on its roof. Tap inside the roof or on its edge.' },
  overTitle: /*i18n*/ { id: 'Over another face' },
  overLine: /*i18n*/ {
    id: 'Faces meet at their edges, never over each other. Move a corner, or tap Undo.',
  },
  manyTitle: /*i18n*/ { id: 'At most {max} faces' },
  manyLine: /*i18n*/ {
    id: 'A roof holds at most this many. Tap Undo, and draw fewer, bigger faces.',
  },
  drawn: /*i18n*/ {
    id: '{count, plural, one {# face drawn · tap it in 3D to set its slope} other {# faces drawn · tap one in 3D to set its slope}}',
  },
  row: /*i18n*/ { id: 'Faces' },
  none: /*i18n*/ { id: 'Not drawn yet' },
  part: /*i18n*/ {
    id: '{count, plural, one {# face · draw the rest} other {# faces · draw the rest}}',
  },
  whole: /*i18n*/ { id: '{count, plural, one {# face} other {# faces}}' },
  draw: /*i18n*/ { id: 'Draw the faces' },
  drawAgain: /*i18n*/ { id: 'Draw again' },
  slopesDown: /*i18n*/ { id: 'Slopes down' },
  toward: /*i18n*/ { id: 'Toward {way}' },
  towardAt: /*i18n*/ { id: 'Toward {way} · {degrees}°' },
} as const;

/** The faces' words, part of the studio canvas's (`studioCanvasWords`). */
export function studioFacesWords(t: T) {
  return {
    /** "Face 2": the face being drawn, in the slim pill. */
    faceDrawing: (number: number) => t(FACE.drawing, { number }),
    /** Why a face may not close, as a refusal's title and line. */
    faceOutside: { title: t(FACE.outsideTitle), line: t(FACE.outsideLine) },
    faceOver: { title: t(FACE.overTitle), line: t(FACE.overLine) },
    facesMany: {
      title: t(FACE.manyTitle, { max: ROOF_HAND_FACES_MAX }),
      line: t(FACE.manyLine),
    },
    /** The line once the faces cover the roof. */
    facesDrawn: (count: number) => t(FACE.drawn, { count }),
    rowFaces: t(FACE.row),
    /** The Faces row's value: how far the faces are drawn. */
    facesValue: (drawn: HandFacesDrawn, count: number): TranslatedText =>
      drawn === 'none'
        ? t(FACE.none)
        : drawn === 'part'
          ? t(FACE.part, { count })
          : t(FACE.whole, { count }),
    /** The Faces row's act: the faces drawn on from where they stopped, or drawn again. */
    facesDraw: (drawn: HandFacesDrawn) => (drawn === 'whole' ? t(FACE.drawAgain) : t(FACE.draw)),
    faceSlopesDown: t(FACE.slopesDown),
    /**
     * Each side a face may slope down to, by the way it looks: "Toward south"; two sides that look
     * the same way are told apart by their degrees.
     */
    faceSides: (rows: HandFaceRows) =>
      rows.sides.map((each) => {
        const way = compassWord(t, each.faces);
        const twin = rows.sides.some((other) => other !== each && other.faces === each.faces);
        return {
          side: each.side,
          label: twin ? t(FACE.towardAt, { way, degrees: each.bearing }) : t(FACE.toward, { way }),
        };
      }),
  };
}
