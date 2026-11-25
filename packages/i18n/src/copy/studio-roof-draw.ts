import type { TranslatedText } from '@heliogrid/contracts';
import {
  type DraftRefusal,
  ROOF_CORNERS_MAX,
  ROOFS_MAX,
  type RoofName,
  type SnapOwner,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { studioFacesWords } from './studio-faces';
import { roofNameWord } from './studio-roof-kinds';

type T = Translator['t'];

/** The roof step's words while a roof is drawn (`T-M05-002`, parts b and e): the tools, the pill, why a corner is refused. */
const DRAW = {
  drawHint: /*i18n*/ { id: 'Tap each corner of the roof' },
  stopDrawing: /*i18n*/ { id: 'Stop drawing' },
  wipeCorners: /*i18n*/ { id: 'Clear every corner' },
  magnet: /*i18n*/ { id: 'Magnet' },
  magnetNotSaved: /*i18n*/ { id: 'Your pick was not saved.' },
  drawCrossTitle: /*i18n*/ { id: 'This edge would cross another' },
  drawCrossLine: /*i18n*/ { id: 'Tap a spot where the edges do not cross.' },
  drawFarTitle: /*i18n*/ { id: 'Too far for this site' },
  drawCloseTitle: /*i18n*/ { id: 'Too close to another corner' },
  drawCloseLine: /*i18n*/ { id: 'Tap a little farther from it.' },
  drawFarLine: /*i18n*/ { id: 'Past {reach} from the pin · this is another site' },
  drawManyTitle: /*i18n*/ { id: 'A roof has at most {max} corners' },
  drawFewTitle: /*i18n*/ { id: 'A roof needs at least 3 corners' },
  drawRoofsTitle: /*i18n*/ { id: 'A design holds at most {max} roofs' },
  drawFixLine: /*i18n*/ { id: 'Close the shape, or tap Undo.' },
  closeShape: /*i18n*/ { id: 'Close shape' },
  followRoof: /*i18n*/ { id: 'Follow {roof}' },
  followFace: /*i18n*/ { id: 'Follow Face {number}' },
} as const;

const DRAW_REFUSAL: Record<
  DraftRefusal,
  (t: T, shown: { readonly reach: string }) => { title: TranslatedText; line: TranslatedText }
> = {
  would_cross: (t) => ({ title: t(DRAW.drawCrossTitle), line: t(DRAW.drawCrossLine) }),
  too_far: (t, { reach }) => ({
    title: t(DRAW.drawFarTitle),
    line: t(DRAW.drawFarLine, { reach }),
  }),
  too_close: (t) => ({ title: t(DRAW.drawCloseTitle), line: t(DRAW.drawCloseLine) }),
  too_many_corners: (t) => ({
    title: t(DRAW.drawManyTitle, { max: ROOF_CORNERS_MAX }),
    line: t(DRAW.drawFixLine),
  }),
  too_few_corners: (t) => ({ title: t(DRAW.drawFewTitle), line: t(DRAW.drawFixLine) }),
  too_many_roofs: (t) => ({
    title: t(DRAW.drawRoofsTitle, { max: ROOFS_MAX }),
    line: t(DRAW.drawFixLine),
  }),
  outside_roof: (t) => studioFacesWords(t).faceOutside,
  over_face: (t) => studioFacesWords(t).faceOver,
  too_many_faces: (t) => studioFacesWords(t).facesMany,
};

/** Why a corner or a close is refused: its title for the tag, its line for the bar. */
export function drawRefusalOf(
  t: T,
  refusal: DraftRefusal,
  shown: { readonly reach: string },
): { title: TranslatedText; line: TranslatedText } {
  return DRAW_REFUSAL[refusal](t, shown);
}

/** The words while drawing, part of the roof step's (`studioRoofWords`). */
export function studioRoofDrawWords(t: T) {
  return {
    /** The one line before the first corner: what to do. It goes with the first tap. */
    drawHint: t(DRAW.drawHint),
    /** Why a corner or a close is refused: what the tag by the line says, and what is read out. */
    drawRefusal: (
      refusal: DraftRefusal,
      shown: { readonly reach: string },
    ): { title: TranslatedText; line: TranslatedText } => drawRefusalOf(t, refusal, shown),
    /** The filled pencil's name while drawing: a tap stops. */
    stopDrawing: t(DRAW.stopDrawing),
    /** The trash while drawing: every corner goes, and drawing goes on. */
    wipeCorners: t(DRAW.wipeCorners),
    /** The one drawing aid's switch: it says on or off by being pressed. */
    magnet: t(DRAW.magnet),
    magnetNotSaved: t(DRAW.magnetNotSaved),
    closeShape: t(DRAW.closeShape),
    /** Follow, in the slim pill while drawing: the roof (or face) whose wall it closes along. */
    follow: (owner: SnapOwner, roofName: (index: number) => RoofName): TranslatedText =>
      owner.kind === 'face'
        ? t(DRAW.followFace, { number: owner.face + 1 })
        : t(DRAW.followRoof, { roof: roofNameWord(t, roofName(owner.roof)) }),
  };
}
