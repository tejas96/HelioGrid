import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadRowNext, LeadsListLead, LeadsListView, Read } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter/FocusAfter.types';
import type { ListableLead } from '../LeadListRow/LeadListRow.logic';
import type { LeadListRowWords } from '../LeadListRow/LeadListRow.types';

/** A lead as the list reads it; the wire's list row satisfies it. */
export type LeadsListedLead = LeadsListLead & ListableLead;

/** The leads one read holds, each with what comes next. */
export type LeadsListRows = LeadsListView<LeadsListedLead>['rows'];

/** Every word the list's read says, built in `@heliogrid/i18n` (`leadsListWords`). */
export interface LeadsListReadWords {
  loading: TranslatedText;
  failedTitle: TranslatedText;
  failedMessage: TranslatedText;
  retry: TranslatedText;
  /** The first run: no lead this person may see yet, and nothing narrows the list (`M02-25`). */
  firstRun: {
    readonly title: TranslatedText;
    readonly body: TranslatedText;
    readonly add: TranslatedText;
    readonly import: TranslatedText;
  };
  /** Nothing matches the filters, and *Clear filters* brings every lead back. */
  noMatch: {
    readonly title: TranslatedText;
    readonly body: TranslatedText;
    readonly clear: TranslatedText;
  };
  /** The card of rows' head: the lead, and the bill beside its one tier. */
  columns: { readonly lead: TranslatedText; readonly bill: TranslatedText };
  row: LeadListRowWords;
  /** A source's word (`leadSourceWord`). */
  sourceWord: (source: string) => TranslatedText;
  /** What comes next on a row, on the reader's calendar; `null` draws no mark. */
  next: (next: LeadRowNext) => TranslatedText | null;
  showMore: (count: number) => TranslatedText;
  loadingMore: TranslatedText;
}

/**
 * **The Leads list's read** (`SCR-M02-03`), both platforms: the calm wait, the failure with
 * *Try again*, the first run that teaches how a lead arrives (*Add a lead*, *Import a file*), no
 * match with *Clear filters*, or the leads — one card of rows under the column's head, or the
 * screen's own table where it has the room — and *Show more* with its own wait. What it draws is
 * `useLeadsListScreen`'s; the screen supplies its moves.
 */
export interface LeadsListProps {
  read: Read<LeadsListView<LeadsListedLead>>;
  words: LeadsListReadWords;
  /**
   * A filter's re-read is out: the rows on screen stay. The web marks them busy for a screen
   * reader; on the phone the view holding them is no accessibility element, so nothing reads it.
   */
  refreshing: boolean;
  loadingMore: boolean;
  onShowMore: () => void;
  onClearFilters: () => void;
  onAdd: () => void;
  /** *Import a file*, offered only to who may import leads (`crm.import_leads`); null draws none. */
  onImport: (() => void) | null;
  onOpen: (leadId: string) => void;
  /**
   * Where focus lands once *Try again* or *Clear filters* has replaced its part: the page's frame
   * or its title, which stays while the list reads again.
   */
  focusAfter: FocusAfter;
  /** The leads drawn in place of the card of rows where the screen has the room — a table; null for the rows. */
  table: ReactNode | null;
}
