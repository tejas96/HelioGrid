import type { TranslatedText } from '@heliogrid/contracts';
import type { ActivityKind, Read } from '@heliogrid/domain';
import type { ActivityEntry, ActivityStreamProps } from '../ActivityStream/ActivityStream.types';

/** How an entry writes a day, a time and an amount: on the tenant's clock, in its currency. */
export interface LeadTimelineFormats {
  readonly day: (date: string) => string;
  readonly time: (hhmm: string) => string;
  readonly money: (amount: string) => string;
  /** A project's market word — a stage, a party, a reason, a row, a step (`format.word`). */
  readonly word: (kind: 'stage' | 'party' | 'reason' | 'row' | 'step', key: string) => string;
}

/**
 * The timeline as its data hook reads it (`useLeadDetailScreen`'s `timeline`), named by shape
 * because this package may not import `packages/data`; `Entry` is the hook's entry, which only the
 * words read.
 */
export interface LeadTimelineFacts<Entry> {
  readonly read: Read<readonly Entry[]>;
  readonly total: number;
  readonly hasMore: boolean;
  readonly loadingMore: boolean;
  loadMore(): void;
}

/** The stream's own words: its count noun, its day heads and what each state of the read says. */
export type LeadTimelineStreamWords = Pick<
  ActivityStreamProps,
  | 'countLabel'
  | 'todayLabel'
  | 'yesterdayLabel'
  | 'emptyTitle'
  | 'emptyDescription'
  | 'filteredEmptyTitle'
  | 'filteredEmptyDescription'
  | 'errorTitle'
  | 'errorMessage'
  | 'retryLabel'
  | 'unavailableTitle'
  | 'words'
>;

/** Every word the timeline says, built in `@heliogrid/i18n` (`leadTimelineWords`). */
export interface LeadTimelineWords<Entry> {
  /** Each entry's line, second line and actor, its days, times and amounts in `formats`. */
  readonly entries: (entries: readonly Entry[], formats: LeadTimelineFormats) => ActivityEntry[];
  /** Each CRM kind's name, as the stream's filter offers it. */
  readonly kind: Readonly<Record<ActivityKind, TranslatedText>>;
  readonly stream: LeadTimelineStreamWords;
}

/**
 * **The lead's Timeline section** (`M02-35`), both platforms: the lead's one stream, newest first
 * by the server's apply order, a page at a time, every entry with its actor — a kind a newer server
 * learned as a plain system entry. Its wait, its failure with *Try again* and its empty line are
 * the stream's.
 */
export interface LeadTimelineProps<Entry> {
  readonly timeline: LeadTimelineFacts<Entry>;
  readonly words: LeadTimelineWords<Entry>;
}
