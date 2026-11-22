import { type EditRefusal, ROOF_HEIGHT_MAX_M, ROOF_HEIGHT_MIN_M } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

/**
 * A roof's sheet in 3D (`T-M05-002`, part b): its area and height, the blue arrow and the slider
 * that change the height, Reset, Edit outline in 2D, Done; and the side views, the 3D tool.
 */
const HEIGHT = {
  sheetRoof: /*i18n*/ { id: 'Roof {number}' },
  heightLabel: /*i18n*/ { id: 'Height' },
  heightSystem: /*i18n*/ { id: 'The usual storey height. Set the true height if you know it.' },
  heightSetByYou: /*i18n*/ { id: 'Set by you.' },
  heightReset: /*i18n*/ { id: 'Reset to {height}' },
  editOutline: /*i18n*/ { id: 'Edit outline in 2D' },
  sheetDone: /*i18n*/ { id: 'Done' },
  sheetClose: /*i18n*/ { id: 'Close' },
  slideHeight: /*i18n*/ { id: 'Slide the height' },
  typeHeight: /*i18n*/ { id: 'Type the height' },
  heightArrow: /*i18n*/ { id: 'Drag to change the height of roof {number}' },
  heightOf: /*i18n*/ { id: 'Roof {number} height: {height}' },
  sideViews: /*i18n*/ { id: 'Side views' },
  heightLow: /*i18n*/ { id: 'A height is at least {height}.' },
  heightHigh: /*i18n*/ { id: 'A height is at most {height}.' },
} as const;

/** The height sheet's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioHeightWords(t: T) {
  return {
    sheetRoof: (number: number) => t(HEIGHT.sheetRoof, { number }),
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
    heightArrow: (number: number) => t(HEIGHT.heightArrow, { number }),
    /** A roof's height spoken: the pill on its top shows the arrow and the number alone. */
    heightOf: (number: number, height: string) => t(HEIGHT.heightOf, { number, height }),
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
