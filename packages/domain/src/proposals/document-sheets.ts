import type { ProposalFieldSet } from './field-set';
import { priceSheetsOf, timelineSheetsOf } from './list-sheets';
import type { ProposalPage } from './steps';
import { termsPagesOf } from './terms-pages';

/** What decides how many sheets a page takes: the terms, the timeline and the price page's lists. */
export type SheetFields = Pick<
  ProposalFieldSet,
  'terms' | 'timeline' | 'system' | 'components' | 'payment'
>;

/** How many sheets a page prints: the terms, the timeline and the price run on; the rest are one. */
function sheetsOfPage(page: ProposalPage, fields: SheetFields): number {
  switch (page) {
    case 'terms':
      return termsPagesOf(fields.terms).length;
    case 'timeline':
      return timelineSheetsOf(fields.timeline).length;
    case 'price':
      return priceSheetsOf(fields).length;
    default:
      return 1;
  }
}

/**
 * One sheet of the document: a page, and which of its sheets this is. The terms (`M06-15`), the
 * timeline and the price page run over more than one when their lists are long; every other page
 * is one sheet.
 */
export interface ProposalSheet {
  readonly page: ProposalPage;
  /** From 0. */
  readonly part: number;
}

/**
 * The document's sheets in print order — the one page plan every reader draws: the builder's
 * preview, the document reader, the print page and its PDF, Proposal defaults' wall. A sheet's
 * number is its place here, and the count every page's foot states is this list's length.
 */
export function proposalSheetsOf(
  pages: readonly ProposalPage[],
  fields: SheetFields,
): readonly ProposalSheet[] {
  return pages.flatMap((page): ProposalSheet[] =>
    Array.from({ length: sheetsOfPage(page, fields) }, (_, part) => ({ page, part })),
  );
}

/** A sheet's number among the sheets that print, from 1; 0 for a sheet that does not print. */
export function sheetNumber(
  sheets: readonly ProposalSheet[],
  page: ProposalPage,
  part: number,
): number {
  return sheets.findIndex((sheet) => sheet.page === page && sheet.part === part) + 1;
}

/** A sheet's key among its document's sheets — `terms-1` for the terms' second sheet. */
export function sheetKey({ page, part }: ProposalSheet): string {
  return part === 0 ? page : `${page}-${part}`;
}
