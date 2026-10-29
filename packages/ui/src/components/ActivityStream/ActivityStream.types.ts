import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { MarketFormat } from '../../utils/format';
import type { ActorClassName, ActorClassWords } from '../ActorClass';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { SurfaceRead } from '../UnavailableNote';

/**
 * WHO DID IT, AS A CLASS RATHER THAN A NAME — and the vocabulary lives in `ActorClass`, because
 * the law it serves is not about this surface. `Timeline.actor` was a free string, so "the agent",
 * "the system" and "the customer" were indistinguishable from a person's name. Here the class is
 * structural and its word is always rendered, with a distinct glyph as the second channel.
 */
export interface ActivityEntry {
  id?: string | number;
  /**
   * What kind of thing happened. **An open vocabulary** — the default registry covers `SCR-M02-04`'s
   * thirteen (`note`, `call`, `agent-call`, `stage`, `assignment`, `proposal`, `link-open`, `survey`,
   * `design`, `sign-off`, `payment`, `document`, `task`, `system`) plus `dunning` and `reversal`, and
   * an unknown kind renders with a neutral mark and its code as its name until a screen names it.
   * Extend it through `kinds` rather than editing the component.
   */
  kind: string;
  /** When it happened — a `Date`, an ISO string or an epoch. Drives day grouping and the clock. */
  at: string | number | Date;
  actorClass: ActorClassName;
  /** The person's or customer's name; for `agent` / `system`, the specific agent or job. */
  actor?: string;
  /** One line: what happened. The stream's primary text. */
  summary: ReactNode;
  /** A second line where the entry needs one — a note's body, a stage change's reason. */
  detail?: ReactNode;
  /** Facts that are true at the same time, rendered by `MarkRow` (never merged into one badge). */
  marks?: ReactNode | ReactNode[];
  /** A tier for a figure inside the entry — a payment amount, a generation estimate. */
  provenance?: ProvenanceProps | ProvenanceTierSpec;
  /** A node under the entry: a photo strip, a `StatCard` pair, a document row. */
  content?: ReactNode;
  /** Real controls belonging to this entry — "Collect", "Open proposal", "Retry the call". */
  action?: ReactNode;
  /** Makes the summary the target that opens the thing this entry is about. */
  onOpen?: () => void;
}

/** The tone a kind's mark takes. Both channels are certified tokens, never an ad-hoc mix. */
export type ActivityTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

export interface ActivityKindSpec {
  label: TranslatedText;
  tone?: ActivityTone;
  /**
   * A glyph name from the built-in set: note, phone, flag, user, doc, link, clipboard, grid, check,
   * rupee, cog, bell, undo, dot.
   */
  glyph?: string;
}

/** How the default registry draws a kind; its name is the words' `kind`. */
export type ActivityKindLook = Omit<ActivityKindSpec, 'label'>;

/**
 * `@heliogrid/i18n`'s `activityStreamWords`: what the stream draws and speaks of its own — and what
 * `filterDimensions` names its options with.
 */
export interface ActivityStreamWords {
  /** The loading form's name. */
  readonly loading: TranslatedText;
  /** The filtered empty state's act. */
  readonly clearFilters: TranslatedText;
  /** *Show more* while the next page is out. */
  readonly loadingMore: TranslatedText;
  /** *Show more*, with how many it reveals. */
  readonly showMore: (count: number) => TranslatedText;
  /** The count line — the whole, in the pack's figures, with the caller's noun (`countLabel`). */
  readonly count: (total: string, noun: string) => TranslatedText;
  /** The count line of a window: how many are shown of the whole, and whether filters narrowed it. */
  readonly countOf: (
    shown: string,
    total: string,
    noun: string,
    filtered: boolean,
  ) => TranslatedText;
  /** A kind's name: the default registry's, or the code itself for a kind no registry names. */
  readonly kind: (kind: string) => TranslatedText;
  /** Each entry's actor line, and the classes as the filter offers them (`actorClassWords`). */
  readonly actor: ActorClassWords;
  /** Why the actor dimension tells the agent, the system and the customer apart. */
  readonly actorHint: TranslatedText;
}

export interface ActivityStreamProps {
  entries: ActivityEntry[];
  /** Extra or overriding kind specs, keyed by kind. Merged over the default registry. */
  kinds?: Record<string, ActivityKindSpec>;
  /** The unfiltered, unwindowed total. Without it the count states the entries it was given. */
  total?: number;
  /** Newest first by default — an append-only stream is read from the top. */
  order?: 'newest' | 'oldest';
  /** Day grouping is what makes hundreds of entries legible without reading them. `none` to drop it. */
  groupBy?: 'day' | 'none';
  /** How many entries the window starts at. Default 25. Changing it resets the window. */
  visibleCount?: number;
  /** How many more each "Show more" reveals. Default 25. */
  step?: number;
  /**
   * For server paging: there are more entries than were handed over. **Append to `entries` and the
   * window follows the append** — a page arriving raises the window to cover what was handed over, so
   * the caller does not have to raise `visibleCount` too. An `entries` array that gets *shorter* (a
   * filter narrowing the set) resets the window instead.
   */
  hasMore?: boolean;
  /** Called by "Show more" once the local window has run out. */
  onLoadMore?: () => void;
  loadingMore?: boolean;
  /**
   * `SCR-M02-04`'s `timeline-filtered`. It changes the empty sentence: a filtered stream with no
   * matches says *the filters* are narrow, not that the record has no activity, and its action clears
   * the filters rather than offering to add anything.
   */
  filtered?: boolean;
  onClearFilters?: () => void;
  /** Header-right slot — where the screen's `FiltersButton` and `FacetChips` go. */
  toolbar?: ReactNode;
  /** The noun in the count line — "entries". */
  countLabel: TranslatedText;
  /** Copy, not market-pack data: the day headings for today and yesterday. */
  todayLabel: TranslatedText;
  yesterdayLabel: TranslatedText;
  /**
   * **Required:** what this draws always comes from a read. `failed` draws the error with its
   * retry; `unavailable` draws none.
   */
  read: SurfaceRead;
  emptyTitle: TranslatedText;
  emptyDescription?: TranslatedText;
  filteredEmptyTitle: TranslatedText;
  filteredEmptyDescription?: TranslatedText;
  errorTitle: TranslatedText;
  errorMessage?: TranslatedText;
  /** The retry's words, from `packages/i18n` — no retry is drawn without them. */
  retryLabel?: TranslatedText;
  unavailableTitle: TranslatedText;
  unavailableMessage?: TranslatedText;
  density?: 'expressive' | 'functional';
  words: ActivityStreamWords;
}

/* The inner parts' contracts (Law 7): both halves of a part implement the one interface. */

export interface ActivityStreamListProps
  extends Required<
      Pick<
        ActivityStreamProps,
        | 'kinds'
        | 'groupBy'
        | 'step'
        | 'hasMore'
        | 'loadingMore'
        | 'filtered'
        | 'countLabel'
        | 'todayLabel'
        | 'yesterdayLabel'
        | 'density'
      >
    >,
    Pick<ActivityStreamProps, 'total' | 'onLoadMore' | 'toolbar' | 'words'> {
  /** Already sorted; the window is applied here so the count line can state the whole. */
  sorted: ActivityEntry[];
  shown: number;
  reveal: (step: number) => void;
  format: MarketFormat;
}

export interface StreamEntryProps {
  entry: ActivityEntry;
  kinds: Record<string, ActivityKindSpec>;
  /** A kind's name when `kinds` gives none, and the actor line's words. */
  words: ActivityStreamWords;
  density: 'expressive' | 'functional';
  format: MarketFormat;
}
