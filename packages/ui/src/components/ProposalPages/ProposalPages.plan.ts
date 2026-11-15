import type { TranslatedText } from '@heliogrid/contracts';
import {
  type PriceSheet,
  priceSheetsOf,
  requiredCategories,
  termsPagesOf,
  timelineSheetsOf,
} from '@heliogrid/domain';
import type {
  ProposalBankBlockProps,
  ProposalEmiBlockProps,
  ProposalGenerationBlockProps,
  ProposalPartsBlockProps,
  ProposalPriceBlockProps,
  ProposalSavingsBlockProps,
  ProposalSplitBlockProps,
  ProposalTermsBlockProps,
  ProposalTimelineBlockProps,
  ProposalTrackRecordBlockProps,
} from '../ProposalBlocks/ProposalBlocks.types';
import type { ProposalPictureName } from '../ProposalPicture/ProposalPicture.types';
import type { ProposalPageProps } from './ProposalPages.types';

/**
 * What each page of the document holds, authored once for both platform halves (Law 11): the frame
 * a page takes and the facts each of its blocks reads out of the version. A half only draws — so
 * the web page, the phone's page and the PDF cannot put a different fact on the same page.
 */

type Page = Pick<ProposalPageProps, 'page' | 'part' | 'snapshot' | 'facts' | 'words'>;

export interface PageFrame {
  /** The line under the title; absent where the page has none to say. */
  readonly lead?: TranslatedText | string | null;
  /** A picture band across the page's top. */
  readonly band?: ProposalPictureName;
  /** The full-colour page: light words on the deep ground. */
  readonly tone?: 'deep';
}

export function pageFrame({ page, snapshot, words }: Page): PageFrame {
  switch (page) {
    case 'about':
      return { lead: snapshot.fields.achievements.aboutCompany };
    case 'system':
      return { band: 'panels', lead: words.systemLead };
    case 'savings':
      return { tone: 'deep' };
    case 'timeline':
      return { lead: words.timelineLead };
    case 'bank':
      return { lead: snapshot.company.bankDetails === null ? undefined : words.bankLead };
    default:
      return {};
  }
}

/** What this sheet of the price page prints, as the page plan cut it; the first sheet past the end. */
export function priceSheetOf(snapshot: Page['snapshot'], part: number): PriceSheet {
  const sheets = priceSheetsOf(snapshot.fields);
  return sheets[part] ?? sheets[0] ?? { price: true, split: null, emi: true, included: true };
}

/** Each block as the paper draws it. A block whose fact the version does not hold is `null`. */
export const paperBlock = {
  record: ({ snapshot, words }: Page): ProposalTrackRecordBlockProps => ({
    mode: 'paper',
    record: snapshot.fields.achievements,
    words: words.blocks.record,
  }),
  parts: ({ snapshot, words }: Page): ProposalPartsBlockProps => ({
    mode: 'paper',
    categories: requiredCategories(snapshot.fields),
    components: snapshot.fields.components,
    words: words.blocks.parts,
  }),
  generation: ({ snapshot, facts, words }: Page): ProposalGenerationBlockProps | null =>
    snapshot.generation === null
      ? null
      : {
          mode: 'paper',
          generation: snapshot.generation,
          tier: facts.generationTier,
          words: words.blocks.generation,
        },
  savings: ({ snapshot, words }: Page): ProposalSavingsBlockProps | null =>
    snapshot.savings === null
      ? null
      : {
          mode: 'paper',
          savings: snapshot.savings,
          money: snapshot.money,
          monthlyBill: snapshot.deal.monthlyBill,
          words: words.blocks.savings,
        },
  price: ({ snapshot, words }: Page): ProposalPriceBlockProps => ({
    mode: 'paper',
    money: snapshot.money,
    words: words.blocks.price,
  }),
  /** The run of the plan this sheet prints, as the page plan cut it; `null` on a sheet with none. */
  split: ({ snapshot, part = 0, words }: Page): ProposalSplitBlockProps | null => {
    const slice = priceSheetOf(snapshot, part).split;
    return slice === null
      ? null
      : {
          mode: 'paper',
          tranches: snapshot.fields.payment.tranches,
          amounts: snapshot.money.tranches,
          tier: snapshot.money.figures.payable.tier,
          slice,
          words: words.blocks.split,
        };
  },
  emi: ({ snapshot, part = 0, words }: Page): ProposalEmiBlockProps | null =>
    snapshot.emi === null || !priceSheetOf(snapshot, part).emi
      ? null
      : { mode: 'paper', emi: snapshot.emi, savings: snapshot.savings, words: words.blocks.emi },
  /** The steps this sheet prints, as the page plan cut them, numbered on from the sheets before. */
  timeline: ({ snapshot, part = 0, words }: Page): ProposalTimelineBlockProps => {
    const phases = snapshot.fields.timeline;
    const slice = timelineSheetsOf(phases)[part] ?? { from: 0, to: phases.length };
    return {
      mode: 'paper',
      phases: phases.slice(slice.from, slice.to),
      before: slice.from,
      words: words.blocks.timeline,
    };
  },
  /** The share of the terms this sheet prints, as the page plan cut them. */
  terms: ({ snapshot, part = 0, facts, words }: Page): ProposalTermsBlockProps => ({
    mode: 'paper',
    terms: termsPagesOf(snapshot.fields.terms)[part] ?? snapshot.fields.terms,
    logoSrc: facts.logoSrc,
    words: words.blocks.terms,
  }),
  bank: ({ snapshot, words }: Page): ProposalBankBlockProps | null =>
    snapshot.company.bankDetails === null
      ? null
      : { mode: 'paper', bank: snapshot.company.bankDetails, words: words.blocks.bank },
};
