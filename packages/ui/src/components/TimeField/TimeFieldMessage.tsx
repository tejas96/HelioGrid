import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { hasCallerError } from './TimeField.logic';

interface TimeFieldMessageProps {
  /** Id the box's `aria-describedby` points at. It rides BOTH danger sentences: a range's two
   *  halves are described by the pair's own refusal, and a ring with `aria-invalid` pointing at
   *  nothing is "invalid" with no why. */
  errorId: string;
  error?: ReactNode;
  helper?: TranslatedText;
  refused: TranslatedText | null;
}

/**
 * Precedence: refusal → error → helper.
 *
 * A refusal happened just now and is ANNOUNCED (`role="alert"`); an `error` is the gate's verdict,
 * already true when the jump landed here, so it is described rather than announced. Neither is a
 * helper.
 */
export function TimeFieldMessage({ errorId, error, helper, refused }: TimeFieldMessageProps) {
  if (refused !== null) {
    return (
      <p className="hg-time-field-message" data-danger="true" id={errorId} role="alert">
        {refused}
      </p>
    );
  }
  if (hasCallerError(error)) {
    return (
      <p className="hg-time-field-message" data-danger="true" id={errorId}>
        {error}
      </p>
    );
  }
  if (helper !== undefined) {
    return <p className="hg-time-field-message">{helper}</p>;
  }
  return null;
}
