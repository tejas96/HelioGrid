import type { Translator } from '../runtime';
import { shownAsSent } from './assembled';

type T = Translator['t'];

/** The length field's words (`T-M05-002`, part b): the true length of an edge, set or measured. */
const LENGTH = {
  lengthLabel: /*i18n*/ { id: 'True length of this edge' },
  lengthFeet: /*i18n*/ { id: 'Feet' },
  lengthInches: /*i18n*/ { id: 'Inches' },
  lengthUnit: /*i18n*/ { id: 'Unit' },
  measuredOnSite: /*i18n*/ { id: 'Measured on site' },
  setLength: /*i18n*/ { id: 'Set' },
  closeLength: /*i18n*/ { id: 'Close, and keep the old length' },
  lengthFirst: /*i18n*/ { id: 'The first length you type sizes the whole roof.' },
  lengthLater: /*i18n*/ { id: 'Later lengths fix only their own edge.' },
  lengthAsk: /*i18n*/ { id: 'The picture shows about {traced}. You typed {typed}.' },
  lengthUse: /*i18n*/ { id: 'Use {length}' },
  lengthChange: /*i18n*/ { id: 'Change' },
  lengthShorter: /*i18n*/ { id: 'Shorter' },
  lengthLonger: /*i18n*/ { id: 'Longer' },
} as const;

/** The length field's words, part of the studio canvas's (`studioCanvasWords`). */
export function studioLengthWords(t: T) {
  return {
    lengthLabel: t(LENGTH.lengthLabel),
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
    lengthHint: (first: boolean) => (first ? t(LENGTH.lengthFirst) : t(LENGTH.lengthLater)),
    /** The box's one question: both lengths already formatted. */
    lengthAsk: (traced: string, typed: string) => t(LENGTH.lengthAsk, { traced, typed }),
    lengthUse: (length: string) => t(LENGTH.lengthUse, { length }),
    lengthChange: t(LENGTH.lengthChange),
    lengthShorter: t(LENGTH.lengthShorter),
    lengthLonger: t(LENGTH.lengthLonger),
  };
}
