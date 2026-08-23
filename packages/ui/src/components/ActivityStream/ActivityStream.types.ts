import type { ReactNode } from 'react';
import type { ActorClassName } from '../ActorClass';
import type { ProvenanceProps, ProvenanceTierSpec } from '../Provenance';
import type { SurfaceState } from '../UnavailableNote';

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
   * an unknown kind renders with a neutral mark and a humanised label. Extend it through `kinds`
   * rather than editing the component.
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
  provenance?: ProvenanceProps | ProvenanceTierSpec | ReactNode;
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
  label: string;
  tone?: ActivityTone;
  /**
   * A glyph name from the built-in set: note, phone, flag, user, doc, link, clipboard, grid, check,
   * rupee, cog, bell, undo, dot.
   */
  glyph?: string;
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
  /** The noun in the count line. Default "entries". */
  countLabel?: string;
  /** Copy, not market-pack data: the day headings for today and yesterday. */
  todayLabel?: string;
  yesterdayLabel?: string;
  state?: SurfaceState;
  emptyTitle?: string;
  emptyDescription?: string;
  filteredEmptyTitle?: string;
  filteredEmptyDescription?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  unavailableTitle?: string;
  unavailableMessage?: string;
  density?: 'expressive' | 'functional';
}
