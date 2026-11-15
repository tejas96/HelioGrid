import type { ProvenanceTier, TranslatedText } from '@heliogrid/contracts';
import { proposalSheetsOf, sheetNumber } from '@heliogrid/domain';
import type { MarketFormat } from '../../utils/format';
import {
  PROPOSAL_PAGE_SIZE,
  type ProposalCoverProps,
  type ProposalPageProps,
} from './ProposalPages.types';

/**
 * A sheet's place in its document — its number from 1, and how many sheets print — read from the
 * domain's one page plan, so the terms' second sheet counts and every foot states the same total.
 */
export function sheetPlace({
  page,
  part = 0,
  snapshot,
}: Pick<ProposalPageProps, 'page' | 'part'> & {
  snapshot: Pick<ProposalPageProps['snapshot'], 'pages' | 'fields'>;
}): {
  readonly number: number;
  readonly count: number;
} {
  const sheets = proposalSheetsOf(snapshot.pages, snapshot.fields);
  return { number: sheetNumber(sheets, page, part), count: sheets.length };
}

/** The page fitted to a width: its scale, and the height the paper's ratio gives it. */
export function fittedPage(width: number): { readonly scale: number; readonly height: number } {
  const scale = width / PROPOSAL_PAGE_SIZE.width;
  return { scale, height: PROPOSAL_PAGE_SIZE.height * scale };
}

/** A fitted body never shrinks its words below this share of their size: 16 px reads as 12. */
const SMALLEST_BODY_FIT = 0.75;

/**
 * How much a page's body is scaled to fit its room: `1` while it fits, else the room over the
 * body's natural height, held at the smallest fit a reader can still read.
 */
export function bodyFit(room: number, natural: number): number {
  if (!(room > 0) || !(natural > room)) return 1;
  return Math.max(room / natural, SMALLEST_BODY_FIT);
}

/** A count as the cover prints it: a whole number in the market's grouping. */
export function wholeNumber(format: MarketFormat, value: number): string {
  return format.number(value, { maximumFractionDigits: 0 });
}

/** Years as the cover prints them: to one decimal. */
export function oneDecimal(format: MarketFormat, value: number): string {
  return format.number(value, { maximumFractionDigits: 1 });
}

/** One figure on the cover's glass: its value, the words under it and its tier (`F8-01`). */
export interface CoverFigure {
  readonly key: 'payable' | 'generation' | 'payback';
  readonly value: string;
  readonly label: TranslatedText;
  readonly tier: ProvenanceTier;
}

/**
 * The cover's figures, each only where the value set holds it — a draft with no price has none
 * of the money, and a cover with no figure draws no glass (`M06-51`). Both halves draw this list.
 */
export function coverFiguresOf(
  { snapshot, facts, words }: Pick<ProposalCoverProps, 'snapshot' | 'facts' | 'words'>,
  format: MarketFormat,
): readonly CoverFigure[] {
  const { money, generation, savings } = snapshot;
  const { cover } = words;
  const payback = savings?.paybackYears ?? null;
  return [
    ...(money === null
      ? []
      : [
          {
            key: 'payable' as const,
            value: format.moneyPlain(money.figures.payable.value),
            label: cover.payableLabel,
            tier: money.figures.payable.tier,
          },
        ]),
    ...(generation === null
      ? []
      : [
          {
            key: 'generation' as const,
            value: cover.generationValue(wholeNumber(format, generation.yearlyKwh)),
            label: cover.generationLabel,
            tier: facts.generationTier,
          },
        ]),
    ...(savings === null || payback === null
      ? []
      : [
          {
            key: 'payback' as const,
            value: cover.paybackValue(oneDecimal(format, payback)),
            label: cover.paybackLabel,
            tier: savings.figures.yearly.tier,
          },
        ]),
  ];
}
