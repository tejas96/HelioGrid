/**
 * The image frame's own words (`packages/ui`'s `ImageWords`): the two kinds of missing — never
 * alike, since nobody taking a photo is not a fetch that failed — the missing face's name with
 * the photo's own, the reference chip and its line (`M05-29`), and the photo's age.
 */
import type { Translator } from '../runtime';

export const IMAGE = {
  notCaptured: /*i18n*/ { id: 'Not captured' },
  notCapturedDetail: /*i18n*/ { id: 'No photo was taken here.' },
  unavailable: /*i18n*/ { id: 'Image unavailable' },
  unavailableDetail: /*i18n*/ { id: "This image didn't load. Try again." },
  missingNamed: /*i18n*/ { id: '{alt} — {missing}' },
  referenceOnly: /*i18n*/ { id: 'Reference only' },
  referenceShort: /*i18n*/ { id: 'Ref' },
  neverMeasured: /*i18n*/ { id: 'Never measured from' },
  asOf: /*i18n*/ { id: 'As of {date}' },
} as const;

/** Every word an image frame says itself, in the reader's language. */
export function imageWords(t: Translator['t']) {
  return {
    missing: {
      'not-captured': { label: t(IMAGE.notCaptured), detail: t(IMAGE.notCapturedDetail) },
      unavailable: { label: t(IMAGE.unavailable), detail: t(IMAGE.unavailableDetail) },
    },
    missingNamed: (alt: string, missing: string) => t(IMAGE.missingNamed, { alt, missing }),
    referenceOnly: t(IMAGE.referenceOnly),
    referenceShort: t(IMAGE.referenceShort),
    neverMeasured: t(IMAGE.neverMeasured),
    asOf: (date: string) => t(IMAGE.asOf, { date }),
  };
}
