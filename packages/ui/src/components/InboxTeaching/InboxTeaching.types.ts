import type { TranslatedText } from '@heliogrid/contracts';
import type { LeadSource } from '@heliogrid/domain';
import type { Ref } from 'react';
import type { FocusHandle } from '../../primitives/FocusAfter/FocusAfter.types';

/** Every word the teaching inbox says, built in `@heliogrid/i18n` (`leadInboxWords`). */
export interface InboxTeachingWords {
  /** "New leads wait here". */
  title: TranslatedText;
  /** What will appear here, and how it leaves. */
  body: TranslatedText;
  /** "Add a lead". */
  add: TranslatedText;
  /** Over the ways — "How a lead arrives". */
  waysTitle: TranslatedText;
  /** Each way a lead arrives, by its source: its name and one line on how. */
  ways: Readonly<
    Record<LeadSource, { readonly title: TranslatedText; readonly line: TranslatedText }>
  >;
}

/**
 * **The empty inbox teaches** (`M02-25`): with nothing waiting it says what will appear here and
 * the ways a lead arrives — quick add, an import, a referral — with *Add a lead* first. The first
 * door out of onboarding lands on it.
 */
export interface InboxTeachingProps {
  onAdd: () => void;
  /** The ways this reader may take, in order — an import only for those who may import. */
  ways: readonly LeadSource[];
  /** Opens the way a lead arrives by that source. */
  onWay: (way: LeadSource) => void;
  words: InboxTeachingWords;
  /**
   * The heading — where focus lands when the last waiting lead has left, so the keyboard and the
   * screen reader start on what replaced the deck. Web: the keyboard's focus. Native: the screen
   * reader's.
   */
  headingRef?: Ref<FocusHandle>;
}
