import type { TranslatedText } from '@heliogrid/contracts';
import type { ProposalPage, ProposalVersionSnapshot, Read } from '@heliogrid/domain';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { ProposalPageFacts, ProposalPagesWords } from '../ProposalPages/ProposalPages.types';

/** The reader's own words — `proposalReaderWords`, by shape. */
export interface ProposalReaderWords {
  /** "3 / 9 · Price and payment" — where the reader is. */
  readonly pagePill: (number: number, count: number, title: TranslatedText) => TranslatedText;
  /** A thumbnail's spoken name — "Page 3, Price and payment". */
  readonly goToPage: (number: number, title: TranslatedText) => TranslatedText;
  /** A thumbnail's name under it, where the room is wide — "1 · Cover". */
  readonly thumbName: (number: number, title: TranslatedText) => TranslatedText;
  /** The thumbnails' name — "Pages". */
  readonly pagesName: TranslatedText;
  /** The scrolling pages' own name — "The document". */
  readonly documentName: TranslatedText;
  readonly newVersion: TranslatedText;
  readonly pdf: TranslatedText;
  readonly share: TranslatedText;
  readonly opening: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
}

/** What the reader draws: one version's frozen snapshot, and the words its pages say. */
export interface ProposalReaderDocument {
  readonly snapshot: ProposalVersionSnapshot;
  readonly facts: ProposalPageFacts;
  readonly words: ProposalPagesWords;
}

/** Which act is out. */
export type ProposalReaderAct = 'new_version' | 'pdf' | 'share';

/**
 * **The proposal document, read in the app** (`SCR-M06-17`, `M06-50`): the same pages, at their
 * real ratio, that the PDF prints and the customer's link shows — one renderer, so they cannot
 * differ. Phone: the pages one under the other, a pill that says which page is in view, and a dock
 * with New version and Share. Desktop: the acts, a column of thumbnails and the pages beside it.
 */
export interface ProposalReaderProps {
  readonly read: Exclude<Read<ProposalReaderDocument>, { readonly kind: 'empty' }>;
  readonly words: ProposalReaderWords;
  /** `wide` draws the thumbnail column and the acts in a row; `narrow` the pill and the dock. */
  readonly room: 'wide' | 'narrow';
  /** How wide a page is drawn, in px — the caller measures its own room. */
  readonly pageWidth: number;
  readonly pending: ProposalReaderAct | null;
  /** Absent for a reader who may not: the act is then not drawn. */
  readonly onNewVersion?: () => void;
  readonly onShare?: () => void;
  /** Absent where the screen's own bar carries the download (the phone's bar holds only icons). */
  readonly onPdf?: () => void;
  readonly focusAfter: FocusAfter;
}

/** The pages a snapshot prints, in order. */
export type ReaderPages = readonly ProposalPage[];
