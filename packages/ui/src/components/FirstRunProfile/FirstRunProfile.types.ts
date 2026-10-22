import type { ExplainerPagerWords, FirstRunProfileFrame } from '@heliogrid/domain';
import type { ReactNode } from 'react';
import type { PickedFile } from '../Dropzone/Dropzone.types';

/** Every word the screen draws, already translated: `@heliogrid/i18n`'s `firstRunProfileWords`. */
export interface FirstRunProfileWords {
  readonly heading: string;
  readonly about: {
    readonly label: string;
    readonly title: string;
    readonly pages: readonly [string, string, string];
  } & ExplainerPagerWords;
  readonly reasons: readonly [string, string, string];
  readonly name: {
    readonly label: string;
    readonly loading: string;
    readonly helper: string;
    readonly error: string | null;
    readonly success: string | null;
  };
  readonly photo: {
    readonly label: string;
    readonly choosePhone: string;
    readonly chooseWide: string;
    readonly replace: string;
    readonly remove: string;
    readonly helper: string;
    readonly error: {
      readonly title: string;
      readonly phone: string;
      readonly wide: string;
    } | null;
  };
  readonly act: string;
  readonly actReason: string | null;
  readonly saveFailed: { readonly title: string; readonly line: string } | null;
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
