import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';

/** One page above this one: its name and how to go there. */
export interface PageCrumb {
  /** A page's words, or a record's own name as the catalog hands a fact on — a proposal's number, a person. */
  readonly label: TranslatedText;
  readonly onOpen: () => void;
}

/**
 * **The desktop's way back** (`CLAUDE.md` §10): the trail of pages above this one, then this
 * page's name, above the title — and no back button. On a phone the same facts feed the shell: the
 * last crumb is the top bar's back (`backCrumbOf`), and the large title moves into the bar as the
 * page scrolls (`LargeTitle`, `MobileTopBar`); the trail itself is not drawn there.
 */
export interface PageTrailProps {
  readonly trail: readonly PageCrumb[];
  /** This page, as the trail names it: its words, or the record's own name. */
  readonly here: string;
  /** The trail's spoken name — "Breadcrumb". */
  readonly label: TranslatedText;
  /**
   * Below the desktop's room on the web, where no phone bar holds the back: the last crumb alone,
   * as one way back with its chevron. The phone half never takes it — its bar is the shell's.
   */
  readonly narrow?: boolean;
  /** What stands at the row's other end: the page's own acts, as the phone's bar holds them. */
  readonly acts?: ReactNode;
}
