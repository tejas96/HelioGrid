import type { ProposalFieldSet, ProposalPhase } from './field-set';
import { includedInPrice } from './narrative';

/**
 * How the timeline and the price page flow over the document's sheets: at the paper's own size,
 * never shrunk, a list that runs past its page carried on the next sheet of the same page, as the
 * terms are (`terms-pages.ts`). A company may fill 20 timeline steps and 12 payment parts, which
 * one sheet cannot hold.
 *
 * It measures by counts and characters, not by drawing, so the phone, the web and the print page
 * agree on the same sheets. Each measure is the paper's own at 794 × 1123 (the timeline's body has
 * 761 px under its title and lead, the price page's 809 px), set a little high, so a sheet planned
 * here is never fuller than the paper. Lowering one lets a planned sheet run past its foot.
 */
const LIST_PAGE = {
  /** The timeline's body under its title and lead, px. */
  timelineRoom: 740,
  /** The price page's body under its title, px. */
  priceRoom: 790,
  /** A timeline step's padding and rule, px. */
  stepBase: 30,
  /** A step's title line (19 px × 26) and how many characters it holds. */
  titleLine: 26,
  titleChars: 44,
  /** A step's sentence line (15 px × 22) and how many characters it holds. */
  noteLine: 22,
  noteChars: 68,
  /** The space between two blocks of the price page, px. */
  blockGap: 22,
  /** The price block with its tax line, incentive pair and basis line, px. */
  price: 300,
  /** The payment plan's head, its verdict and its bar, px. */
  splitHead: 80,
  /** One part of the payment plan with a one-line name: its share, name, stage and amount, px. */
  splitRow: 64,
  /** Each further line of a part's name (16 px × 24), and how many characters a line holds. */
  splitNameLine: 24,
  splitNameChars: 40,
  /** The EMI example with its projection line, px. */
  emi: 140,
  /** "Included in the price" and one row of its two columns, px. */
  includedHead: 30,
  includedRow: 24,
} as const;

/** One sheet's share of a list: the items from `from` up to, not including, `to`. */
export interface ListSlice {
  readonly from: number;
  readonly to: number;
}

const lines = (text: string, perLine: number) => Math.max(1, Math.ceil(text.length / perLine));

function stepHeight(phase: ProposalPhase): number {
  return (
    LIST_PAGE.stepBase +
    lines(phase.name, LIST_PAGE.titleChars) * LIST_PAGE.titleLine +
    (phase.description.trim() === '' ? 0 : lines(phase.description, LIST_PAGE.noteChars)) *
      LIST_PAGE.noteLine
  );
}

/** The timeline's steps cut into sheets — always one sheet, even with no step. */
export function timelineSheetsOf(phases: readonly ProposalPhase[]): readonly ListSlice[] {
  const sheets: ListSlice[] = [];
  let from = 0;
  let used = 0;
  phases.forEach((phase, index) => {
    const height = stepHeight(phase);
    if (index > from && used + height > LIST_PAGE.timelineRoom) {
      sheets.push({ from, to: index });
      from = index;
      used = 0;
    }
    used += height;
  });
  sheets.push({ from, to: phases.length });
  return sheets;
}

/**
 * What one sheet of the price page prints: the price block, a run of the payment plan's parts —
 * its head and bar only where the plan starts — the EMI example, and what the price includes.
 */
export interface PriceSheet {
  readonly price: boolean;
  readonly split: (ListSlice & { readonly head: boolean }) | null;
  readonly emi: boolean;
  readonly included: boolean;
}

type PriceItem =
  | { readonly kind: 'price' | 'emi' | 'included'; readonly height: number }
  | { readonly kind: 'row'; readonly index: number; readonly height: number };

export type PriceSheetFields = Pick<ProposalFieldSet, 'system' | 'components' | 'payment'>;

function priceItems(fields: PriceSheetFields): PriceItem[] {
  const parts = fields.payment.tranches.length;
  const included = includedInPrice(fields).length;
  return [
    { kind: 'price', height: LIST_PAGE.price },
    ...fields.payment.tranches.map((tranche, index) => ({
      kind: 'row' as const,
      index,
      height:
        LIST_PAGE.splitRow +
        (lines(tranche.label, LIST_PAGE.splitNameChars) - 1) * LIST_PAGE.splitNameLine +
        (index === 0 ? LIST_PAGE.splitHead + LIST_PAGE.blockGap : 0),
    })),
    ...(parts === 0
      ? [{ kind: 'row' as const, index: 0, height: LIST_PAGE.splitHead + LIST_PAGE.blockGap }]
      : []),
    ...(fields.system.emi === null
      ? []
      : [{ kind: 'emi' as const, height: LIST_PAGE.emi + LIST_PAGE.blockGap }]),
    ...(included === 0
      ? []
      : [
          {
            kind: 'included' as const,
            height:
              LIST_PAGE.includedHead +
              Math.ceil(included / 2) * LIST_PAGE.includedRow +
              LIST_PAGE.blockGap,
          },
        ]),
  ];
}

function sheetOf(items: readonly PriceItem[], parts: number): PriceSheet {
  const rows = items.flatMap((item) => (item.kind === 'row' ? [item.index] : []));
  const [first] = rows;
  return {
    price: items.some((item) => item.kind === 'price'),
    split:
      first === undefined
        ? null
        : { from: first, to: Math.min(parts, (rows.at(-1) ?? first) + 1), head: first === 0 },
    emi: items.some((item) => item.kind === 'emi'),
    included: items.some((item) => item.kind === 'included'),
  };
}

/** The price page cut into sheets — always one, the price block always on the first. */
export function priceSheetsOf(fields: PriceSheetFields): readonly PriceSheet[] {
  const groups: PriceItem[][] = [[]];
  let used = 0;
  for (const item of priceItems(fields)) {
    const current = groups[groups.length - 1] ?? [];
    if (current.length > 0 && used + item.height > LIST_PAGE.priceRoom) {
      groups.push([item]);
      used = item.height;
    } else {
      current.push(item);
      used += item.height;
    }
  }
  return groups.map((items) => sheetOf(items, fields.payment.tranches.length));
}
