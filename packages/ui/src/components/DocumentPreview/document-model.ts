import type { TranslatedText } from '@heliogrid/contracts';
import { compliantShades, type MinorUnits, normaliseHexColour } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import { asWordOnPaper, bestTextOn, NEAR_BLACK, WHITE } from '../../utils/color-contrast';
import type { MarketFormat } from '../../utils/format';
import { IN_FORMAT } from '../../utils/format';
import { NO_IDENTITY, NO_MONEY, SAMPLE_IDENTITY, SAMPLE_MONEY } from './DocumentPreview.sample';
import type {
  DocumentFigures,
  DocumentLetterhead,
  DocumentMoney,
  DocumentPart,
  DocumentPreviewProps,
  DocumentSection,
  DocumentSectionInput,
} from './DocumentPreview.types';
import { A4_RATIO, DOCUMENT_DESIGN_WIDTH } from './DocumentPreview.types';

/** The system accent, and the fallback whenever `brandColor` will not parse. */
const FALLBACK_BRAND: string = theme.colors.accent;

export interface ResolvedDocument {
  /** The specimen draws a labelled logo slot; a real cover (`sample={false}`) never does. */
  sample: boolean;
  companyName: string;
  address: string;
  phone: string;
  taxId: string;
  // biome-ignore lint/plugin/copy-prop-type: the market pack's name for the tax number
  taxLabel: string;
  logoSrc: string | undefined;
  logoLabel: TranslatedText;
  customerName: string;
  customerMeta: string;
  docTitle: TranslatedText | undefined;
  docNumber: string;
  docDateText: string;
  parts: DocumentPart[];
  lineItems: {
    // biome-ignore lint/plugin/copy-prop-type: a line of the figures, as the server's lines name it
    description: string;
    amountText: string;
  }[];
  totalText: string;
  preparedForLabel: TranslatedText | undefined;
  totalLabel: TranslatedText | undefined;
  bandFailsNote: TranslatedText | undefined;
  termsEmptyText: TranslatedText | undefined;
  subsidyNote: TranslatedText | undefined;
  sections: DocumentSection[];
  sectionsTitle: TranslatedText | undefined;
  tranches: {
    // biome-ignore lint/plugin/copy-prop-type: the tranche's name, as the company named it
    label: string;
    when?: string;
    share?: string;
    amountText: string;
  }[];
  tranchesTitle: TranslatedText | undefined;
  termsTitle: TranslatedText | undefined;
  /** The letterhead as a spec object, when the caller passed one rather than a node. */
  letterhead: DocumentLetterhead | null;
  /** The letterhead as a ready node, when the caller owns the markup. */
  letterheadNode: ReactNode | null;
  brandHex: string;
  /** The header takes the brand fill only if SOMETHING can be read on it. */
  bandOk: boolean;
  /** The text colour that sits on the band — only meaningful when `bandOk`. */
  bandTextColor: string;
  /** The derived ink — the brand, or its darkened shade, wherever it is a word (`compliantShades`). */
  ink: string;
  /** Whether the brand rule clears the non-text mark floor at full opacity. */
  ruleOpaque: boolean;
  width: number;
  scale: number;
  /** The sheet's design-space height, or undefined when `fit="content"`. */
  sheetHeight: number | undefined;
  caption: TranslatedText | undefined;
}

function normaliseSections(sections: DocumentSectionInput[]): DocumentSection[] {
  return sections
    .map((entry) => (typeof entry === 'string' ? { label: entry } : entry))
    .filter((entry) => entry.included ?? true);
}

/** A letterhead spec, or null when the caller passed a node (or nothing). */
function letterheadSpec(value: DocumentLetterhead | ReactNode): DocumentLetterhead | null {
  if (value === null || value === undefined || typeof value !== 'object') {
    return null;
  }
  if (isValidElement(value)) {
    return null;
  }
  return value as DocumentLetterhead;
}

/**
 * The caller's figures, or — when it passed none — the whole sample, never a part of it. A real
 * cover with no figures draws no money band.
 */
function moneyOf(money: DocumentMoney, sample: boolean): DocumentFigures {
  if (money.lineItems !== undefined) return money;
  return sample ? SAMPLE_MONEY : NO_MONEY;
}

/**
 * Every default, every figure it is handed and every contrast verdict, resolved once for both
 * platform halves. Neither half re-answers any of it, so they cannot disagree — which is the
 * same reason the contrast maths is a shared module rather than a local opinion.
 *
 * `format` is the active market's, read from `MarketProvider`'s `useFormat()` by whichever half
 * calls this. It defaults to `IN_FORMAT` — the provider's OWN documented default, called into
 * rather than re-inlined, so a document rendered outside a provider still prints Indian figures.
 */
export function resolveDocument(
  props: DocumentPreviewProps,
  format: MarketFormat = IN_FORMAT,
): ResolvedDocument {
  const isSample = props.sample ?? true;
  const sample = isSample && props.lineItems === undefined ? SAMPLE_IDENTITY : NO_IDENTITY;
  const {
    brandColor = FALLBACK_BRAND,
    companyName = sample.companyName,
    logoSrc,
    logoLabel,
    taxId = sample.taxId,
    taxIdLabel,
    address = sample.address,
    phone = sample.phone,
    letterhead,
    customerName = sample.customerName,
    customerMeta = sample.customerMeta,
    docTitle,
    docNumber = sample.docNumber,
    docDate = sample.docDate,
    parts = ['cover', 'items'],
    subsidyNote,
    sections = [],
    sectionsTitle,
    tranches = [],
    tranchesTitle,
    termsTitle,
    fit = 'a4',
    width = 420,
    caption,
    preparedForLabel,
    totalLabel,
    bandFailsNote,
    termsEmptyText,
  } = props;

  /* A line amount may legitimately be a WORD — "Included", "At cost" — so the string spelling
     passes through. That is a call-site distinction, not a second money formatter. */
  const amountText = (value: MinorUnits | string): string =>
    typeof value === 'string' ? value : format.amount(value);

  const money = moneyOf(props, isSample);

  const hex = normaliseHexColour(brandColor) ?? FALLBACK_BRAND;
  /* One answer for every word the brand colours — the walk the server runs on save and
     `CustomerSurface` reads — so the preview and the saved document cannot differ (D250). */
  const shades = compliantShades(hex);
  const bandOk = bestTextOn(hex)?.passes === true;

  return {
    sample: isSample,
    companyName,
    address,
    phone,
    taxId,
    taxLabel: taxIdLabel ?? format.pack.taxIdLabel,
    logoSrc,
    logoLabel,
    customerName,
    customerMeta,
    docTitle,
    docNumber,
    docDateText: docDate === undefined ? '' : format.date(docDate),
    parts,
    lineItems: money.lineItems.map(([description, amount]) => ({
      description,
      amountText: amountText(amount),
    })),
    totalText: amountText(money.total),
    preparedForLabel,
    totalLabel,
    bandFailsNote,
    termsEmptyText,
    subsidyNote,
    sections: normaliseSections(sections),
    sectionsTitle,
    tranches: tranches.map((tranche) => ({
      label: tranche.label,
      when: tranche.when,
      share: tranche.share,
      amountText: amountText(tranche.amount),
    })),
    tranchesTitle,
    termsTitle,
    letterhead: letterheadSpec(letterhead),
    letterheadNode: isValidElement(letterhead) ? letterhead : null,
    brandHex: hex,
    bandOk,
    bandTextColor: shades.whiteOnBrand ? WHITE : NEAR_BLACK,
    ink: shades.ink,
    ruleOpaque: asWordOnPaper(hex)?.passesMark === true,
    width,
    scale: width / DOCUMENT_DESIGN_WIDTH,
    sheetHeight: fit === 'a4' ? DOCUMENT_DESIGN_WIDTH * A4_RATIO : undefined,
    caption,
  };
}

/** Does this colour force the white-header consequence? A frame's `note` can say so. */
export function bandFails(brandColor: string): boolean {
  const on = bestTextOn(normaliseHexColour(brandColor) ?? FALLBACK_BRAND);
  return on === null || !on.passes;
}
