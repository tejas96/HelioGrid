import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { EmptySceneName } from '../EmptyScene/EmptyScene.types';

/**
 * Centred empty/error state — a calm line drawing (`scene`) for a place with nothing in it, or a
 * soft brand bloom behind a circular icon for an error or a status; a headline, an encouraging
 * description and a primary action. Never leave a screen blank.
 *
 * For an error state pass a danger-tinted icon and an action labelled "Try again".
 */
export interface EmptyStateProps {
  /** line-drawing icon or large glyph */
  icon?: ReactNode;
  /**
   * A calm grey line drawing (`EmptyScene`) as the art instead of the icon disc, for a place with
   * nothing in it. It draws in once and rests; with a scene there is no glow behind it.
   */
  scene?: EmptySceneName;
  title: TranslatedText;
  /** centred, text-secondary, max ~2 lines */
  description?: TranslatedText;
  /** primary pill button */
  action?: ReactNode;
  /** soft brand glow bloom behind the icon (default on; never behind a scene) */
  glow?: boolean;
}

/**
 * **A read that failed**, in place of what it could not read: the warning mark, what happened and
 * the one *Try again* (`RetryButton`). The retry leaves with the failure, so focus moves to
 * `focusAfter` — the frame that stays while the read is out again.
 */
export interface FailedReadProps {
  title: TranslatedText;
  message: TranslatedText;
  retryLabel: TranslatedText;
  onRetry: () => void;
  focusAfter: FocusAfter;
}
