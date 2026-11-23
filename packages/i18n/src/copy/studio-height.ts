import {
  type EditRefusal,
  ROOF_HEIGHT_MAX_M,
  ROOF_HEIGHT_MIN_M,
  type RoofName,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';
import { roofNameWord } from './studio-roof-kinds';

type T = Translator['t'];

/**
 * A roof's sheet in 3D (`T-M05-002`, part b): its area and height, the blue arrow and the slider
 * that change the height, Reset, Edit outline in 2D, Done; and the side views, the 3D tool.
 */
const HEIGHT = {
  heightLabel: /*i18n*/ { id: 'Height' },
  heightSystem: /*i18n*/ { id: 'The usual storey height. Set the true height if you know it.' },
  heightSetByYou: /*i18n*/ { id: 'Set by you.' },
  heightReset: /*i18n*/ { id: 'Reset to {height}' },
  editOutline: /*i18n*/ { id: 'Edit outline in 2D' },
  sheetDone: /*i18n*/ { id: 'Done' },
  sheetClose: /*i18n*/ { id: 'Close' },
  slideHeight: /*i18n*/ { id: 'Slide the height' },
  typeHeight: /*i18n*/ { id: 'Type the height' },
  heightArrow: /*i18n*/ { id: 'Drag to change the height of {name}' },
  heightOf: /*i18n*/ { id: '{name} height: {height}' },
  sideViews: /*i18n*/ { id: 'Side views' },
  heightLow: /*i18n*/ { id: 'A height is at least {height}.' },
  heightHigh: /*i18n*/ { id: 'A height is at most {height}.' },
} as const;

/** The height sheet's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioHeightWords(t: T) {
  return {
    /** The sheet's title: what the roof is called. */
    sheetRoof: (name: RoofName) => roofNameWord(t, name),
    heightLabel: t(HEIGHT.heightLabel),
    /** The sheet's hint: the system's height, or one the person set; `height` already formatted. */
    heightHint: (byPerson: boolean) =>
      byPerson ? t(HEIGHT.heightSetByYou) : t(HEIGHT.heightSystem),
    heightReset: (height: string) => t(HEIGHT.heightReset, { height }),
    editOutline: t(HEIGHT.editOutline),
    sheetDone: t(HEIGHT.sheetDone),
    sheetClose: t(HEIGHT.sheetClose),
    slideHeight: t(HEIGHT.slideHeight),
    typeHeight: t(HEIGHT.typeHeight),
    heightArrow: (name: RoofName) => t(HEIGHT.heightArrow, { name: roofNameWord(t, name) }),
    /** A roof's height spoken: the pill on its top shows the arrow and the number alone. */
    heightOf: (name: RoofName, height: string) =>
      t(HEIGHT.heightOf, { name: roofNameWord(t, name), height }),
    /** The pill on a roof's top: an up arrow and the height, never translated. */
    heightPill: (height: string) => shownAsSent(`↑ ${height}`),
    sideViews: t(HEIGHT.sideViews),
    /** Why a typed height is not kept: its limit already formatted by `heightOf`. */
    heightRefusal: (refusal: EditRefusal, heightOf: (metres: number) => string) =>
      refusal === 'too_long'
        ? t(HEIGHT.heightHigh, { height: heightOf(ROOF_HEIGHT_MAX_M) })
        : t(HEIGHT.heightLow, { height: heightOf(ROOF_HEIGHT_MIN_M) }),
  };
}
