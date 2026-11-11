import type { TranslatedText } from '@heliogrid/contracts';
import type { FocusAfter } from '../../primitives/FocusAfter';

/** The project read while it is not ready — `useProjectScreen`'s `read`, by shape. */
export type ProjectNotReady =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed'; readonly retry: () => void }
  | { readonly kind: 'unavailable' };

export interface ProjectDetailStatesWords {
  readonly loading: TranslatedText;
  readonly failedTitle: TranslatedText;
  readonly failedMessage: TranslatedText;
  readonly retry: TranslatedText;
  readonly goneTitle: TranslatedText;
  readonly goneBody: TranslatedText;
}

/**
 * The project page before its project is there (`SCR-M08-02`): loading, a read that failed with its
 * retry, or a project out of reach or gone — never a blank page.
 */
export interface ProjectDetailStatesProps {
  readonly read: ProjectNotReady;
  readonly words: ProjectDetailStatesWords;
  /** Where *Try again* lands the keyboard: the page, which stays while it reads again. */
  readonly focusAfter: FocusAfter;
}
