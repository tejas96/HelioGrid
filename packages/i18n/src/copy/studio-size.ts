import type { TranslatedText } from '@heliogrid/contracts';
import { ROOFS_MAX, type TypedRefusal } from '@heliogrid/domain';
import type { Translator } from '../runtime';
import type { RoofWordsShown } from './studio-roof';

type T = Translator['t'];

/** Type the size's words (`T-M05-002`, part c): the card that makes a roof from two numbers. */
const SIZE = {
  typeSize: /*i18n*/ { id: 'Type the size' },
  sizeTitle: /*i18n*/ { id: 'Roof size' },
  sizeLength: /*i18n*/ { id: 'Length' },
  sizeWidth: /*i18n*/ { id: 'Width' },
  sizePair: /*i18n*/ { id: 'Length × width' },
  sizeTypeIt: /*i18n*/ { id: 'Type the numbers' },
  sizeSlideIt: /*i18n*/ { id: 'Slide the numbers' },
  sizeClose: /*i18n*/ { id: 'Close, and place nothing' },
  placeRoof: /*i18n*/ { id: 'Place roof' },
  sizeNotNumber: /*i18n*/ { id: 'Only numbers.' },
  sizeShort: /*i18n*/ { id: 'A length is at least {length}.' },
  sizeLong: /*i18n*/ { id: 'A length is at most {length}.' },
  sizeOverlaps: /*i18n*/ { id: 'It would run into Roof {number}.' },
  sizeFar: /*i18n*/ { id: 'That is too far from the pin.' },
  sizeRoofs: /*i18n*/ { id: 'A design holds at most {max} roofs' },
} as const;

/** Type the size's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioSizeWords(t: T) {
  return {
    typeSize: t(SIZE.typeSize),
    sizeTitle: t(SIZE.sizeTitle),
    sizeLength: t(SIZE.sizeLength),
    sizeWidth: t(SIZE.sizeWidth),
    /** The desktop's one box: both numbers, `13.2x8.6`. */
    sizePair: t(SIZE.sizePair),
    /** The small switch in the card's head: to the boxes, or back to the sliders. */
    sizeTypeIt: t(SIZE.sizeTypeIt),
    sizeSlideIt: t(SIZE.sizeSlideIt),
    sizeClose: t(SIZE.sizeClose),
    placeRoof: t(SIZE.placeRoof),
    /** Why the card cannot place its roof; the limits already formatted in the reader's units. */
    sizeRefusal: (
      refusal: TypedRefusal,
      shown: RoofWordsShown,
      min: number,
      max: number,
    ): TranslatedText => {
      switch (refusal.kind) {
        case 'not_a_number':
          return t(SIZE.sizeNotNumber);
        case 'too_short':
          return t(SIZE.sizeShort, { length: shown.length(min) });
        case 'too_long':
          return t(SIZE.sizeLong, { length: shown.length(max) });
        case 'overlaps':
          return t(SIZE.sizeOverlaps, { number: refusal.roof + 1 });
        case 'too_far':
          return t(SIZE.sizeFar);
        case 'too_many_roofs':
          return t(SIZE.sizeRoofs, { max: ROOFS_MAX });
      }
    },
  };
}
