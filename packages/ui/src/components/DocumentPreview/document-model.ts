import { type MinorUnits, minorUnits, normaliseHexColour } from '@heliogrid/domain';
import { theme } from '@heliogrid/theme';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import { asWordOnPaper, bestTextOn, NEAR_BLACK } from '../../utils/color-contrast';
import type { MarketFormat } from '../../utils/format';
import { IN_FORMAT } from '../../utils/format';
import type {
  DocumentFigures,
  DocumentLetterhead,
  DocumentMoney,
  DocumentPart,
  DocumentPreviewProps,
  DocumentSection,
  DocumentSectionInput,
  DocumentSubsidy,
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

/* The sample a settings screen previews its letterhead on. Its total and payable are STATED
   beside its lines, like any server's figures — the part sums nothing (`F4-04`). */
const SAMPLE_MONEY: DocumentFigures & DocumentSubsidy = {
  lineItems: [
    ['Mono PERC modules 545 W × 16', minorUnits(26_160_000)],
    ['String inverter 8 kW', minorUnits(6_840_000)],
    ['Mounting structure & BOS', minorUnits(7_420_000)],
    ['Installation & commissioning', minorUnits(4_827_100)],
  ],
  total: minorUnits(45_247_100),
  subsidyAmount: minorUnits(7_800_000),
  payable: minorUnits(37_447_100),
};

/* The sample's identity travels with the sample's figures and never beside real ones: a real
   document missing a tax number prints none rather than a made-up one (`F4-04` — no device assigns
   a business identifier). */
interface DocumentIdentity {
  companyName: string;
  taxId: string;
  address: string;
  phone: string;
  customerName: string;
  customerMeta: string;
  docNumber: string;
  docDate: string | undefined;
}
const SAMPLE_IDENTITY: DocumentIdentity = {
  companyName: 'Suryodaya Solar Pvt Ltd',
  taxId: '27AABCS1429P1ZQ',
  address: 'Shop 14, Laxmi Complex, Baner Road, Pune 411045',
  phone: '+91 98200 41123',
  customerName: 'Rajesh Kumar',
  customerMeta: 'Kothrud, Pune · 8.4 kWp rooftop',
  docNumber: 'PRO-2026-0418',
  docDate: '2026-08-16',
};
const NO_IDENTITY: DocumentIdentity = {
  companyName: '',
  taxId: '',
  address: '',
  phone: '',
  customerName: '',
  customerMeta: '',
  docNumber: '',
  docDate: undefined,
};

/** The caller's figures, or — when it passed none — the whole sample, never a part of it. */
function moneyOf(money: DocumentMoney): DocumentFigures & Partial<DocumentSubsidy> {
  return money.lineItems === undefined ? SAMPLE_MONEY : money;
}

function subsidySentence(
  subsidyNote: string | undefined,
  money: Partial<DocumentSubsidy>,
  subsidyLabel: string,
  format: MarketFormat['amount'],
): string | null {
  if (subsidyNote !== undefined) {
    return subsidyNote;
  }
  if (money.subsidyAmount === undefined || money.payable === undefined) {
    return null;
  }
  return `Less ${subsidyLabel} ${format(money.subsidyAmount)} · payable ${format(money.payable)}`;
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
  const sample = props.lineItems === undefined ? SAMPLE_IDENTITY : NO_IDENTITY;
  const {
    brandColor = FALLBACK_BRAND,
    companyName = sample.companyName,
    logoSrc,
    logoLabel = 'tenant logo',
    taxId = sample.taxId,
    taxIdLabel,
    address = sample.address,
    phone = sample.phone,
    letterhead,
    customerName = sample.customerName,
    customerMeta = sample.customerMeta,
    docTitle = 'Solar proposal',
    docNumber = sample.docNumber,
    docDate = sample.docDate,
    parts = ['cover', 'items'],
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
  const amountText = (value: MinorUnits | string): string =>
    typeof value === 'string' ? value : format.amount(value);

  const money = moneyOf(props);

  const hex = normaliseHexColour(brandColor) ?? FALLBACK_BRAND;
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
    docDateText: docDate === undefined ? '' : format.date(docDate),
    parts,
    lineItems: money.lineItems.map(([description, amount]) => ({
      description,
      amountText: amountText(amount),
    })),
    totalText: amountText(money.total),
    subsidyLine: subsidySentence(subsidyNote, money, subsidyLabel, format.amount),
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
  const on = bestTextOn(normaliseHexColour(brandColor) ?? FALLBACK_BRAND);
  return on === null || !on.passes;
}
