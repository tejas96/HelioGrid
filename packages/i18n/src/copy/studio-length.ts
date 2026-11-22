import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

/** The length field's words (`T-M05-002`, part b): the true length of an edge, set or measured. */
const LENGTH = {
  lengthLabel: /*i18n*/ { id: 'True length of this edge' },
  lengthTitle: /*i18n*/ { id: 'True length' },
  slideLength: /*i18n*/ { id: 'Slide the length' },
  typeLength: /*i18n*/ { id: 'Type the length' },
  lengthFeet: /*i18n*/ { id: 'Feet' },
  lengthInches: /*i18n*/ { id: 'Inches' },
  lengthUnit: /*i18n*/ { id: 'Unit' },
  measuredOnSite: /*i18n*/ { id: 'Measured on site' },
  setLength: /*i18n*/ { id: 'Set' },
  closeLength: /*i18n*/ { id: 'Close, and keep the old length' },
  lengthFirst: /*i18n*/ { id: 'Drag, or − + for {step}. The first length sizes the whole roof.' },
  lengthFirstTyped: /*i18n*/ { id: 'The first length sizes the whole roof.' },
  lengthLater: /*i18n*/ { id: 'Later lengths fix only their own edge.' },
  lengthAsk: /*i18n*/ { id: 'The picture shows about {traced}. You set {typed}.' },
  lengthUse: /*i18n*/ { id: 'Use {length}' },
  lengthChange: /*i18n*/ { id: 'Change' },
  lengthShorter: /*i18n*/ { id: 'Shorter' },
  lengthLonger: /*i18n*/ { id: 'Longer' },
} as const;

/** The length field's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioLengthWords(t: T) {
  return {
    lengthLabel: t(LENGTH.lengthLabel),
    lengthTitle: t(LENGTH.lengthTitle),
    /** The small switch beside the value: to the box, or back to the slider. */
    slideLength: t(LENGTH.slideLength),
    typeLength: t(LENGTH.typeLength),
    lengthFeet: t(LENGTH.lengthFeet),
    lengthInches: t(LENGTH.lengthInches),
    lengthUnit: t(LENGTH.lengthUnit),
    /** The unit symbols on the length box: never translated (`F3-08`). */
    unitMetres: shownAsSent('m'),
    unitFeet: shownAsSent('ft'),
    unitInches: shownAsSent('in'),
    measuredOnSite: t(LENGTH.measuredOnSite),
    setLength: t(LENGTH.setLength),
    closeLength: t(LENGTH.closeLength),
    /**
     * The field's hint; `step` is one − or + already formatted (`5 cm`, `1 in`), or `null` while
     * the length is typed: no slider to drag.
     */
    lengthHint: (first: boolean, step: string | null) => {
      if (!first) return t(LENGTH.lengthLater);
      return step === null ? t(LENGTH.lengthFirstTyped) : t(LENGTH.lengthFirst, { step });
    },
    /** The box's one question: both lengths already formatted. */
    lengthAsk: (traced: string, typed: string) => t(LENGTH.lengthAsk, { traced, typed }),
    lengthUse: (length: string) => t(LENGTH.lengthUse, { length }),
    lengthChange: t(LENGTH.lengthChange),
    lengthShorter: t(LENGTH.lengthShorter),
    lengthLonger: t(LENGTH.lengthLonger),
  };
}
