/**
 * The paged document's own words (`packages/ui`'s `PagedDocumentWords`, `TitleBlockWords` and
 * `PageEstimateWords`): its sheets' counted numbering and names, the internal marks, the
 * annotation band, its states, its title block's fields, and a page estimate in words — authored
 * once for the print surface, in three languages (`F3-07`).
 */
import type { Translator } from '../runtime';
import { TEMPLATE } from './proposal-template';
import { SHELL } from './shell';
import { SIGN_IN } from './sign-in';

export const PAGED_DOCUMENT = {
  sheetOf: /*i18n*/ { id: 'Sheet {sheet} of {sheets}' },
  sheetName: /*i18n*/ { id: '{document} · sheet {sheet} of {sheets}' },
  internalCopy: /*i18n*/ { id: 'Internal copy' },
  internalStamp: /*i18n*/ { id: 'Internal copy — not for the customer.' },
  internalNote: /*i18n*/ { id: 'Internal note' },
  savedNotPrinted: /*i18n*/ { id: '{note} · saved, not printed' },
  layingOut: /*i18n*/ { id: 'Laying out the document' },
  errorTitle: /*i18n*/ { id: "Couldn't build this document" },
  unavailableTitle: /*i18n*/ { id: 'No document for this proposal' },
  solarProposal: /*i18n*/ { id: 'Solar proposal' },
  noProjectName: /*i18n*/ { id: 'No project name yet' },
  internalName: /*i18n*/ { id: 'Internal design name · {name}' },
  preparedBy: /*i18n*/ { id: 'Prepared by {person}' },
  proposalNumber: /*i18n*/ { id: 'Proposal no.' },
  issued: /*i18n*/ { id: 'Issued' },
  revision: /*i18n*/ { id: 'Revision' },
  validUntil: /*i18n*/ { id: 'Valid until' },
  pages: /*i18n*/ { id: '{count, plural, one {# page} other {# pages}}' },
  overLimit: /*i18n*/ { id: '{over} over the {max}-page limit' },
  basis: /*i18n*/ { id: '{paper} · {points}pt · {column}px column · {lines} lines a page' },
} as const;

/** Every word `PagedDocument` and its `TitleBlock` draw or speak of their own. */
export function pagedDocumentWords(t: Translator['t']) {
  return {
    sheetOf: (sheet: number, sheets: number) => t(PAGED_DOCUMENT.sheetOf, { sheet, sheets }),
    sheetName: (document: string, sheet: number, sheets: number) =>
      t(PAGED_DOCUMENT.sheetName, { document, sheet, sheets }),
    internalCopy: t(PAGED_DOCUMENT.internalCopy),
    internalStamp: t(PAGED_DOCUMENT.internalStamp),
    internalNote: t(PAGED_DOCUMENT.internalNote),
    savedNotPrinted: (note: string) => t(PAGED_DOCUMENT.savedNotPrinted, { note }),
    layingOut: t(PAGED_DOCUMENT.layingOut),
    errorTitle: t(PAGED_DOCUMENT.errorTitle),
    errorMessage: t(SHELL.keepsFailing),
    retry: t(SIGN_IN.tryAgain),
    unavailableTitle: t(PAGED_DOCUMENT.unavailableTitle),
    titleBlock: {
      docTitle: t(PAGED_DOCUMENT.solarProposal),
      noProjectName: t(PAGED_DOCUMENT.noProjectName),
      internalName: (name: string) => t(PAGED_DOCUMENT.internalName, { name }),
      preparedBy: (person: string) => t(PAGED_DOCUMENT.preparedBy, { person }),
      proposalNumber: t(PAGED_DOCUMENT.proposalNumber),
      issued: t(PAGED_DOCUMENT.issued),
      revision: t(PAGED_DOCUMENT.revision),
      validUntil: t(PAGED_DOCUMENT.validUntil),
    },
  };
}

/** `PageEstimate`'s words: a counted or estimated page count, the cap, and its basis spoken. */
export function pageEstimateWords(t: Translator['t']) {
  return {
    pages: (count: number) => t(PAGED_DOCUMENT.pages, { count }),
    aboutPages: (count: number) => t(TEMPLATE.pages, { count }),
    overLimit: (over: number, max: number) => t(PAGED_DOCUMENT.overLimit, { over, max }),
    basis: (paper: string, points: number, column: number, lines: number) =>
      t(PAGED_DOCUMENT.basis, { paper, points, column, lines }),
  };
}
