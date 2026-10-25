import { asWordOnPaper, bestTextOn, NEAR_BLACK } from '../../utils/color-contrast';
import type { DocumentPreviewProps } from '../DocumentPreview/DocumentPreview.types';
import type {
  BrandingDocumentFacts,
  BrandingPart,
  BrandingSettingsWords,
} from './BrandingSettings.types';

/** The colour drawn while a company has set none — the platform's near-black (s18-k). */
export function brandingColourShown(colour: string | null): string {
  return colour ?? NEAR_BLACK;
}

/** The board's design sheet the stage scales: A4 at 480 wide (`SCR-M01-18`, `pfStageDoc`). */
export const BRANDING_SHEET = { width: 480, height: 679 } as const;

/** The 375 stage's window (`pfStageDoc`): the cover cut at 186, or 120 while the part below must stay in view. */
export const BRANDING_STAGE = { minScale: 0.6, maxHeight: 186, shortHeight: 120 } as const;

/** The link page's mark in its header: the board's 100×28 lockup, at the header's 28. */
export const BRANDING_LINK_MARK = { width: 100, height: 28 } as const;

/** The logo on its white paper: 200×56 in the 375 box; at width 240 across, the box's inside height. */
export const BRANDING_LOGO_MARK = {
  narrow: { width: 200, height: 56 },
  wide: { width: 240, height: 86 },
} as const;

/** *Open full size* (m18-f, d18-i): the cover across a 375 sheet, or in the 720 side panel at width. */
export const BRANDING_FULL_SIZE = { narrow: 343, wide: 560, panel: 720 } as const;

/**
 * The cover as the tenant's customers get it: only the tenant's own values, no sample (`T-M01-029`),
 * the cover band alone. The stage and an app's full-size view draw the same props, so they agree.
 */
export function brandingCoverProps(
  facts: BrandingDocumentFacts,
  colour: string | null,
  words: Pick<BrandingSettingsWords, 'documentTitle' | 'logoAlt'>,
): DocumentPreviewProps {
  return {
    sample: false,
    parts: ['cover'],
    brandColor: brandingColourShown(colour),
    companyName: facts.companyName,
    ...(facts.logoSrc === undefined ? {} : { logoSrc: facts.logoSrc, logoLabel: words.logoAlt }),
    ...(facts.taxId === undefined ? {} : { taxId: facts.taxId }),
    ...(facts.taxIdLabel === undefined ? {} : { taxIdLabel: facts.taxIdLabel }),
    ...(facts.address === undefined ? {} : { address: facts.address }),
    letterhead: facts.letterhead,
    docTitle: words.documentTitle,
    caption: '',
  };
}

/**
 * The facts both previews print, from what the page read: the tax number named by the market's own
 * label (`taxIdLabel`, never typed here); before the reads answer, only the shape, which the
 * loading stage draws over.
 */
export function brandingDocumentOf(
  cover: Omit<BrandingDocumentFacts, 'taxIdLabel'> | null,
  taxIdLabel: string,
): BrandingDocumentFacts {
  if (cover === null) return { companyName: '', letterhead: { lines: [] } };
  return cover.taxId === undefined ? cover : { ...cover, taxIdLabel };
}

/** The colour fails either question — no text can sit on it, or it cannot be a word on paper. */
export function colourFallsShort(hex: string): boolean {
  const on = bestTextOn(hex);
  const word = asWordOnPaper(hex);
  return on !== null && word !== null && (!on.passes || !word.passesText);
}

/**
 * The stage is cut shorter at 375 when the part below must stay in view: the colour's offered ink
 * (s18-n, s18-o, s18-u) or the logo's refusal (s18-p).
 */
export function brandingStageShort(
  part: BrandingPart,
  colour: string | null,
  logoRefusal: string | undefined,
): boolean {
  if (part === 'colour') return colourFallsShort(brandingColourShown(colour));
  return part === 'logo' && logoRefusal !== undefined;
}
