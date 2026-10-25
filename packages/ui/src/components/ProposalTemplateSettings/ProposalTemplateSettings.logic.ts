import { TEMPLATE_PARTS } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import {
  BRANDING_SHEET,
  BRANDING_STAGE,
  brandingCoverProps,
} from '../BrandingSettings/BrandingSettings.logic';
import type { DocumentPreviewProps } from '../DocumentPreview/DocumentPreview.types';
import { estimatePages } from '../PagedDocument/page-geometry';
import { measure } from '../RichText/RichText.model';
import type { RichTextValue } from '../RichText/RichText.types';
import type {
  ProposalTemplateSettingsWords,
  TemplateCoverCount,
  TemplateDocument,
  TemplatePartName,
} from './ProposalTemplateSettings.types';

/**
 * The kW figure's unit. A unit symbol, never translated (`CLAUDE.md` §9: kW/kWh/kWp are never
 * translated), so it is not a catalog word — moving it into a language would print *किलोवॉट*
 * beside a figure the document prints as kW.
 */
export const KW = 'kW';

/** The cover's two plain counts, side by side under the kW figure; neither carries a tier (`F8-01`). */
export const TEMPLATE_PLAIN_COUNTS: readonly TemplateCoverCount[] = [
  'happyCustomers',
  'citiesServed',
];

/** The *About* text's limit and its rows: 3 in the 375 column, 5 in the 420 card (m19-a, m19-i). */
export const TEMPLATE_ABOUT = { maxLength: 2000, rows: { narrow: 3, wide: 5 } } as const;

/** The phase's sentence (m19-g): three rows, the contract's paragraph limit. */
export const TEMPLATE_PHASE_WHAT = { maxLength: 2000, rows: 3 } as const;

/** The terms editor's floor (`rtTerms`): room for a page of terms before it grows. */
export const TEMPLATE_TERMS_MIN_HEIGHT = 200;

/** The editor card at width (`Editor 1536`): 420 wide. */
export const TEMPLATE_EDITOR_WIDTH = 420;

/**
 * The room from which the page stands as the board's 1536 pair: the stage holding the whole
 * 480-wide sheet inside its `--sp-8` sides, the `--sp-8` gap and the 420 card (996). Below it the
 * stage would scale the sheet, so the page is the 375 column.
 */
export const TEMPLATE_WIDE_FROM =
  BRANDING_SHEET.width + theme.spacing['sp-8'] * 3 + TEMPLATE_EDITOR_WIDTH;

/**
 * The sample proposal's number the stage prints (`docPreview`): an identifier, never a word, so
 * it is the same in every language. The customer beside it is the catalog's sample.
 */
export const TEMPLATE_SAMPLE = { docNumber: 'PRO-2026-0431' } as const;

/** The phase editor's side panel at width (m19-l): 480 wide, non-modal. */
export const TEMPLATE_PHASE_PANEL = 480;

/** The editor's four parts, in the switch's order (*Cover · Sections · Terms · Timeline*) — domain's list. */
export { TEMPLATE_PARTS };

/**
 * The 375 stage's window (`pfStage`, `pfStageShort`): the cover cut at 186 while Cover or Sections
 * is open, at 120 while Terms or Timeline is, whose fields need the room below it.
 */
export function templateStageHeight(part: TemplatePartName): number {
  return part === 'cover' || part === 'sections'
    ? BRANDING_STAGE.maxHeight
    : BRANDING_STAGE.shortHeight;
}

export const TEMPLATE_STAGE_MIN_SCALE = BRANDING_STAGE.minScale;

/** The switch reports a string; only the four parts it offers come back from it. */
export function templatePartOf(value: string): TemplatePartName | undefined {
  return TEMPLATE_PARTS.find((part) => part === value);
}

/**
 * The document the stage and an app's full-size reader both draw (`docPreview`): the cover from
 * Branding's facts (`brandingCoverProps`, so the two covers cannot differ), the sample customer and
 * number, the sections in document order and the terms in the strip's language.
 */
export function templateDocumentProps(
  document: TemplateDocument,
  words: Pick<
    ProposalTemplateSettingsWords,
    | 'proposal'
    | 'sampleCustomer'
    | 'sampleCustomerPlace'
    | 'sectionsTitle'
    | 'termsTitle'
    | 'logoAlt'
  >,
  width: number,
): DocumentPreviewProps {
  return {
    /* No logo slot word: a real cover draws the logo or the name alone, and the terms carry none. */
    ...brandingCoverProps(document.facts, document.colour, {
      documentTitle: words.proposal,
      logoAlt: words.logoAlt(document.facts.companyName),
    }),
    parts: ['cover', 'sections', 'terms'],
    fit: 'content',
    customerName: words.sampleCustomer,
    customerMeta: words.sampleCustomerPlace,
    docNumber: document.docNumber,
    docDate: document.docDate,
    sections: document.sections.map(({ label, included }) => ({ label, included })),
    sectionsTitle: words.sectionsTitle,
    terms: document.terms,
    termsTitle: words.termsTitle,
    width,
  };
}

/**
 * How many pages the terms take, against `PagedDocument`'s own page (`estimatePages`), so the
 * editor's count and the printed pages come from one idea of a page; 0 while they are empty.
 */
export function termsPageCount(value: RichTextValue): number {
  return estimatePages(measure(value)).pages;
}
