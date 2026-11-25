import {
  type EditRefusal,
  ROOF_HEIGHT_MAX_M,
  ROOF_HEIGHT_MIN_M,
  type RoofName,
} from '@heliogrid/domain';
import type { Translator } from '../runtime';
import { roofNameWord } from './studio-roof-kinds';

type T = Translator['t'];

/**
 * A roof's sheet (`T-M05-002`, parts b and e): its height, the blue arrow and the slider that
 * change it, Done.
 */
const HEIGHT = {
  sheetDone: /*i18n*/ { id: 'Done' },
  sheetClose: /*i18n*/ { id: 'Close' },
  heightArrow: /*i18n*/ { id: 'Drag to change the height of {name}' },
  heightLow: /*i18n*/ { id: 'A height is at least {height}.' },
  heightHigh: /*i18n*/ { id: 'A height is at most {height}.' },
} as const;

/** The height sheet's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioHeightWords(t: T) {
  return {
    /** The sheet's title: what the roof is called. */
    sheetRoof: (name: RoofName) => roofNameWord(t, name),
    sheetDone: t(HEIGHT.sheetDone),
    sheetClose: t(HEIGHT.sheetClose),
    heightArrow: (name: RoofName) => t(HEIGHT.heightArrow, { name: roofNameWord(t, name) }),
    /** Why a typed height is not kept: its limit already formatted by `heightOf`. */
    heightRefusal: (refusal: EditRefusal, heightOf: (metres: number) => string) =>
      refusal === 'too_long'
        ? t(HEIGHT.heightHigh, { height: heightOf(ROOF_HEIGHT_MAX_M) })
        : t(HEIGHT.heightLow, { height: heightOf(ROOF_HEIGHT_MIN_M) }),
  };
}
