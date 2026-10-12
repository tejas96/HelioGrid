/**
 * The logo's words on the company profile (`SCR-M01-05`, `logo-invalid-limits-stated`): the capture
 * area, the limits stated before any upload, and what a refused image is told — authored once for
 * both platforms (Law 11). Every number is the limits' or the image's own; none is typed here.
 * `MB` and `px` are units and read the same in every language.
 */
import {
  type CompanyLogoLimits,
  type CompanyLogoMiss,
  type CompanyLogoRefusal,
  megabytesShown,
} from '@heliogrid/domain';
import type { MessageRef, Translator } from '../runtime';

export const COMPANY_LOGO = {
  add: /*i18n*/ { id: 'Add your logo' },
  held: /*i18n*/ { id: 'Your logo' },
  hintTouch: /*i18n*/ { id: 'Tap to choose a file' },
  hintDrop: /*i18n*/ { id: 'Choose a file or drop one here' },
  /** Names the two types `COMPANY_LOGO_LIMITS` holds; a third type needs new words. */
  limits: /*i18n*/ { id: 'PNG or JPG, up to {maxMegabytes} MB, at least {minWidth} px wide' },
  refusedSizeAndWidth: /*i18n*/ {
    id: '{megabytes} MB, {width} px wide · needs {maxMegabytes} MB or less, at least {minWidth} px',
  },
};

/** A refusal for one limit missed. Whole messages, never joined pieces: word order differs by language. */
const REFUSED_FOR: Record<CompanyLogoMiss, MessageRef> = {
  type: /*i18n*/ { id: 'Needs a PNG or JPG' },
  size: /*i18n*/ { id: '{megabytes} MB · needs {maxMegabytes} MB or less' },
  width: /*i18n*/ { id: '{width} px wide · needs at least {minWidth} px' },
};

export interface CompanyLogoWords {
  readonly add: string;
  /** The capture area's name once it holds a logo. */
  readonly held: string;
  /** How to choose a file where a finger does it, and where a pointer can also drop one. */
  readonly hintTouch: string;
  readonly hintDrop: string;
  readonly limits: string;
  /** The chosen image's own size and width against every limit it missed; `null` when none was refused. */
  readonly refusal: string | null;
}

export interface CompanyLogoWordFacts {
  readonly limits: CompanyLogoLimits;
  /** Domain's `companyLogoRefusal` for the image last chosen. */
  readonly refusal: CompanyLogoRefusal | null;
}

export function companyLogoWords(
  translate: Translator['t'],
  { limits, refusal }: CompanyLogoWordFacts,
): CompanyLogoWords {
  const stated = { maxMegabytes: megabytesShown(limits.maxBytes), minWidth: limits.minWidthPx };
  return {
    add: translate(COMPANY_LOGO.add),
    held: translate(COMPANY_LOGO.held),
    hintTouch: translate(COMPANY_LOGO.hintTouch),
    hintDrop: translate(COMPANY_LOGO.hintDrop),
    limits: translate(COMPANY_LOGO.limits, stated),
    refusal:
      refusal === null
        ? null
        : translate(refusalMessage(refusal.missed), {
            ...stated,
            megabytes: refusal.megabytes,
            width: refusal.widthPx,
          }),
  };
}

function refusalMessage(missed: CompanyLogoRefusal['missed']): MessageRef {
  return missed.length === 2 ? COMPANY_LOGO.refusedSizeAndWidth : REFUSED_FOR[missed[0]];
}
