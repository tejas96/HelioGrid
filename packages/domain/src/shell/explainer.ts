/**
 * The ask (`F7-46`): the one information control whose popover holds a screen's teaching. What it
 * may hold and how a reader pages through it are decided here, once, so the web half and the
 * native half page the same way. The words are `packages/i18n`'s; the drawing is `packages/ui`'s.
 */

/** Content needing a fourth page belongs on the screen, in an expandable section, or on a help surface. */
export const EXPLAINER_MAX_PAGES = 3;

/** One page given alone, or one to three — a fourth is a type error before it is a runtime cap. */
export type ExplainerPages<P> = P | readonly [P] | readonly [P, P] | readonly [P, P, P];

/** The words a paged ask shows, always the caller's, so a Hindi reader never meets "Next". */
export interface ExplainerPagerWords {
  nextLabel: string;
  backLabel: string;
  /** `(2, 3)` → "2 of 3", in the reader's language. */
  positionLabel: (page: number, total: number) => string;
}

/** A single page needs no pager words; two or three pages cannot be written without them. */
export type ExplainerPaging<P> =
  | ({ pages: P | readonly [P] } & Partial<ExplainerPagerWords>)
  | ({ pages: readonly [P, P] | readonly [P, P, P] } & ExplainerPagerWords);

/**
 * The pages that will be shown, and how many past the cap were dropped. An untyped caller can still
 * hand over four; they are cut here and the count lets the component say so, rather than hiding it.
 */
export function capExplainerPages<P>(pages: P | readonly P[]): { kept: P[]; dropped: number } {
  const given = (Array.isArray(pages) ? pages : [pages]) as readonly P[];
  const present = given.filter(
    (page) => page !== null && page !== undefined && page !== false && page !== '',
  );
  return {
    kept: present.slice(0, EXPLAINER_MAX_PAGES),
    dropped: Math.max(0, present.length - EXPLAINER_MAX_PAGES),
  };
}

export type ExplainerMove = 'next' | 'back' | 'close';

/** The zero-based page after `move`. Closing returns to the first page, so a reopened ask starts over. */
export function explainerPageAfter(page: number, move: ExplainerMove, total: number): number {
  if (move === 'close') return 0;
  const last = Math.max(0, total - 1);
  return Math.min(Math.max(0, page + (move === 'next' ? 1 : -1)), last);
}

export interface ExplainerView {
  /**
   * Null for a single page. Otherwise Back and Next are BOTH offered on every page, one of them
   * disabled at an edge — a swipe may move pages too, but it cannot be announced.
   */
  pager: { page: number; total: number; canBack: boolean; canNext: boolean } | null;
  /** The one action waits for the last page, so nobody acts before reading what it teaches. An
   *  ask with no page offers nothing. */
  showsAction: boolean;
}

export function explainerView(page: number, total: number): ExplainerView {
  const last = total > 0 && page >= total - 1;
  return {
    pager: total > 1 ? { page: page + 1, total, canBack: page > 0, canNext: !last } : null,
    showsAction: last,
  };
}
