import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import { asWordOnPaper, bestTextOn, NEAR_BLACK, normaliseHex } from '../../utils/color-contrast';
import type { MarketFormat } from '../../utils/format';
import { IN_FORMAT } from '../../utils/format';
import type { ResolvedMoney } from '../../utils/money-lines';
import { reconcileAmounts, resolveMoneySummary } from '../../utils/money-lines';
import type {
  DocumentLetterhead,
  DocumentPart,
  DocumentPreviewProps,
  DocumentSection,
  DocumentSectionInput,
} from './DocumentPreview.types';
import { A4_RATIO, DOCUMENT_DESIGN_WIDTH } from './DocumentPreview.types';

/** The system accent, and the fallback whenever `brandColor` will not parse. */
const FALLBACK_BRAND: string = theme.colors.accent;

export interface ResolvedDocument {
  companyName: string;
  address: string;
  phone: string;
  taxId: string;
  taxLabel: string;
  logoSrc: string | undefined;
  logoLabel: string;
  customerName: string;
  customerMeta: string;
  docTitle: string;
  docNumber: string;
  docDateText: string;
  parts: DocumentPart[];
  lineItems: { description: string; amountText: string }[];
  totalText: string;
  subsidyLine: string | null;
  sections: DocumentSection[];
  sectionsTitle: string;
  tranches: { label: string; when?: string; share?: string; amountText: string }[];
  tranchesTitle: string;
  termsTitle: string;
  /** The letterhead as a spec object, when the caller passed one rather than a node. */
  letterhead: DocumentLetterhead | null;
  /** The letterhead as a ready node, when the caller owns the markup. */
  letterheadNode: ReactNode | null;
  brandHex: string;
  /** The header takes the brand fill only if SOMETHING can be read on it. */
  bandOk: boolean;
  /** The text colour that sits on the band — only meaningful when `bandOk`. */
  bandTextColor: string;
  /** The brand colour where it may carry words, near-black where it may not. */
  ink: string;
  /** Whether the brand rule clears the non-text mark floor at full opacity. */
  ruleOpaque: boolean;
  width: number;
  scale: number;
  /** The sheet's design-space height, or undefined when `fit="content"`. */
  sheetHeight: number | undefined;
  caption: string;
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

function equationFor(
  lineItems: [string, number | string][],
  subsidyAmount: number | undefined,
  subsidyLabel: string,
): ResolvedMoney | null {
  const numeric =
    lineItems.length > 0 && lineItems.every(([, amount]) => typeof amount === 'number');
  if (!numeric) {
    return null;
  }
  return resolveMoneySummary({
    lines: [
      ...lineItems.map(([label, amount], index) => ({
        key: `l${index}`,
        label,
        amount: Number(amount),
      })),
      ...(subsidyAmount
        ? [{ key: 'subsidy', kind: 'deduct' as const, label: subsidyLabel, amount: subsidyAmount }]
        : []),
    ],
  });
}

function subsidySentence(
  subsidyNote: string | undefined,
  equation: ResolvedMoney | null,
  subsidyAmount: number | undefined,
  subsidyLabel: string,
  money: MarketFormat['money'],
): string | null {
  if (subsidyNote !== undefined) {
    return subsidyNote;
  }
  if (equation === null || !subsidyAmount) {
    return null;
  }
  return `Less ${subsidyLabel} ${money(subsidyAmount)} · payable ${money(equation.payable)}`;
}

/**
 * Every default, every derived figure and every contrast verdict, resolved once for both
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
  const {
    brandColor = FALLBACK_BRAND,
    companyName = 'Suryodaya Solar Pvt Ltd',
    logoSrc,
    logoLabel = 'tenant logo',
    taxId = '27AABCS1429P1ZQ',
    taxIdLabel,
    address = 'Shop 14, Laxmi Complex, Baner Road, Pune 411045',
    phone = '+91 98200 41123',
    letterhead,
    customerName = 'Rajesh Kumar',
    customerMeta = 'Kothrud, Pune · 8.4 kWp rooftop',
    docTitle = 'Solar proposal',
    docNumber = 'PRO-2026-0418',
    docDate = '2026-08-16',
    parts = ['cover', 'items'],
    lineItems = [
      ['Mono PERC modules 545 W × 16', 261600],
      ['String inverter 8 kW', 68400],
      ['Mounting structure & BOS', 74200],
      ['Installation & commissioning', 48271],
    ],
    total,
    subsidyAmount = 78000,
    subsidyLabel = 'PM Surya Ghar subsidy',
    subsidyNote,
    sections = [],
    sectionsTitle = 'What this proposal covers',
    tranches = [],
    tranchesTitle = 'Payment schedule',
    termsTitle = 'Terms & conditions',
    fit = 'a4',
    width = 420,
    caption = 'Preview · customer proposal',
  } = props;

  /* A line amount may legitimately be a WORD — "Included", "At cost" — so the string spelling
     passes through. That is a call-site distinction, not a second money formatter. */
  const amountText = (value: number | string): string =>
    typeof value === 'string' ? value : format.money(value);

  const equation = equationFor(lineItems, subsidyAmount, subsidyLabel);
  if (
    equation !== null &&
    typeof total === 'number' &&
    !reconcileAmounts(total, equation.gross).agrees
  ) {
    console.warn(
      `DocumentPreview: total={${total}} disagrees with the line items, which sum to ${equation.gross}. A disagreement is a defect (SCR-M06-14) — printing the sum of the lines.`,
    );
  }
  const shownTotal = equation !== null ? equation.gross : total;

  const hex = normaliseHex(brandColor) ?? FALLBACK_BRAND;
  const onBand = bestTextOn(hex);
  const word = asWordOnPaper(hex);
  const bandOk = onBand?.passes === true;

  return {
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
    docDateText: format.date(docDate),
    parts,
    lineItems: lineItems.map(([description, amount]) => ({
      description,
      amountText: amountText(amount),
    })),
    totalText: shownTotal === undefined ? '' : amountText(shownTotal),
    subsidyLine: subsidySentence(subsidyNote, equation, subsidyAmount, subsidyLabel, format.money),
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
    bandTextColor: onBand === null ? NEAR_BLACK : onBand.color,
    ink: word?.passesText === true ? hex : NEAR_BLACK,
    ruleOpaque: word?.passesMark === true,
    width,
    scale: width / DOCUMENT_DESIGN_WIDTH,
    sheetHeight: fit === 'a4' ? DOCUMENT_DESIGN_WIDTH * A4_RATIO : undefined,
    caption,
  };
}

/** Does this colour force the white-header consequence? A frame's `note` can say so. */
export function bandFails(brandColor: string): boolean {
  const on = bestTextOn(normaliseHex(brandColor) ?? FALLBACK_BRAND);
  return on === null || !on.passes;
}
