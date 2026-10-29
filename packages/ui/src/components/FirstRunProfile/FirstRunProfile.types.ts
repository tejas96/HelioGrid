import type { TranslatedText } from '@heliogrid/contracts';
import type { ExplainerPagerWords, FirstRunProfileFrame } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { PickedFile } from '../Dropzone/Dropzone.types';

/** Every word the screen draws, already translated: `@heliogrid/i18n`'s `firstRunProfileWords`. */
export interface FirstRunProfileWords {
  readonly heading: TranslatedText;
  readonly about: {
    readonly label: TranslatedText;
    readonly title: TranslatedText;
    readonly pages: readonly [TranslatedText, TranslatedText, TranslatedText];
  } & ExplainerPagerWords;
  readonly reasons: readonly [TranslatedText, TranslatedText, TranslatedText];
  readonly name: {
    readonly label: TranslatedText;
    readonly loading: TranslatedText;
    readonly helper: TranslatedText;
    readonly error: TranslatedText | null;
    readonly success: TranslatedText | null;
  };
  readonly photo: {
    readonly label: TranslatedText;
    readonly choosePhone: TranslatedText;
    readonly chooseWide: TranslatedText;
    readonly replace: TranslatedText;
    readonly remove: TranslatedText;
    readonly helper: TranslatedText;
    readonly error: {
      readonly title: TranslatedText;
      readonly phone: TranslatedText;
      readonly wide: TranslatedText;
    } | null;
  };
  readonly act: TranslatedText;
  readonly actReason: TranslatedText | null;
  readonly saveFailed: { readonly title: TranslatedText; readonly line: TranslatedText } | null;
}

/**
 * First-Run Profile (`SCR-M01-09`, `M01-14`): the name the inviter typed, an optional photo, and
 * one act. No shell, no step counter, no back (brief decision 5). At 375 one column with the
 * heading's ask; from the door's breakpoint the onboarding two panes, the three reasons in the
 * brand pane and the task one centred column (rulings 12, 14).
 */
export interface FirstRunProfileProps {
  /** The header row's language control (`DoorLanguage`, brief decision 6). */
  language: ReactNode;
  words: FirstRunProfileWords;
  frame: FirstRunProfileFrame;
  /** The name in the field. */
  name: string;
  /** The chosen photo's picture, once one is chosen. */
  picture?: string;
  onName: (name: string) => void;
  /** Opens the platform's picker. */
  onChoosePhoto: () => void;
  /** A photo dropped onto the circle — from the door's breakpoint, on the web only. */
  onDropPhoto?: (file: PickedFile) => void;
  onRemovePhoto: () => void;
  /** *Try the photo again*: the photo alone, sent again. */
  onRetryPhoto: () => void;
  /** The one act: *Save and continue*, or *Continue without a photo*. */
  onSave: () => void;
}
