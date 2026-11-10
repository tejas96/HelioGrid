import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import type { LottieMomentName } from '../LottieMoment/LottieMoment.types';

/**
 * Centred empty/error state — a soft brand bloom behind a circular icon, a headline, an
 * encouraging description and a primary action. Never leave a screen blank.
 *
 * For an error state pass a danger-tinted icon and an action labelled "Try again".
 */
export interface EmptyStateProps {
  /** line-drawing icon or large glyph */
  icon?: ReactNode;
  /**
   * An original Lottie moment drawn as the art instead of the icon disc — a calm list with nothing
   * in it yet (`empty`, or a list's own empty moment). It plays once and rests on its last frame.
   */
  moment?: LottieMomentName;
  title: TranslatedText;
  /** centred, text-secondary, max ~2 lines */
  description?: TranslatedText;
  /** primary pill button */
  action?: ReactNode;
  /** soft brand glow bloom behind the icon (default on) */
  glow?: boolean;
  /**
   * Where the block sits: `center` on a page of its own (the default); `start` in a list, where the
   * rows it stands for would begin — a list's empty block is left-aligned.
   */
  align?: EmptyStateAlign;
}

export type EmptyStateAlign = 'center' | 'start';

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
