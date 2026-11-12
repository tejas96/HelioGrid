import type { TranslatedText } from '@heliogrid/contracts';
import type { Ref } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter/FocusAfter.types';

/**
 * A phone page's large title (`CLAUDE.md` §10): the page's name in Newsreader under an icon-only
 * top bar, with one summary line under it. It scrolls away with the page; the bar then shows the
 * name small.
 */
export interface LargeTitleProps {
  readonly title: TranslatedText;
  readonly summary?: TranslatedText;
  /** Where a page lands the screen reader after its *Try again*. */
  readonly titleRef?: Ref<FocusHandle>;
  /**
   * The title is a record's own name — a fact typed at any length, a lead's — so it keeps to two
   * lines and the page's work stays in view. A page's translated name never sets it.
   */
  readonly nameTitle?: boolean;
}
