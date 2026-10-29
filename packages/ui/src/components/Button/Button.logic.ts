import type { TranslatedText } from '@heliogrid/contracts';
import { reasonPage } from '../ActionReason/ActionReason.logic';
import type { ActionReasonSentence } from '../ActionReason/ActionReason.types';
import type { ButtonTone, ButtonVariant } from './Button.types';

/**
 * Off WITH a sentence to hear: the control stays reachable and its press opens the reason — a
 * `Button`'s pill or an `IconButton`'s circle alike. A spec with no sentence opens nothing and
 * describes nothing, so the control stays natively disabled.
 */
export function isStatedOff(
  disabled: boolean,
  disabledReason: ActionReasonSentence | undefined,
): boolean {
  return disabled && reasonPage(disabledReason) !== '';
}

/** A tone colours a secondary or ghost pill's words; the filled pills keep their own. */
export function toneOf(
  variant: ButtonVariant,
  tone: ButtonTone | undefined,
): ButtonTone | undefined {
  return variant === 'secondary' || variant === 'ghost' ? tone : undefined;
}

/** A retry the error state can draw: its act and its words. */
export interface RetryAct {
  retry: () => void;
  label: TranslatedText;
}

/**
 * A retry is drawn only with BOTH the act and the words — blank words are no words, since a button
 * with none has no accessible name.
 */
export function retryOf(
  onRetry: (() => void) | undefined,
  label: TranslatedText | undefined,
): RetryAct | null {
  if (onRetry === undefined || label === undefined || label.trim() === '') {
    return null;
  }
  return { retry: onRetry, label };
}
