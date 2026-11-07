import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
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
}
