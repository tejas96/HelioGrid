import type { ReactNode } from 'react';

interface NumberFieldMessageProps {
  /** id the field points `aria-describedby` at while an error is showing. */
  errId: string;
  refused: ReactNode;
  error: ReactNode;
  correction: string | null;
  hint?: string;
}

/**
 * The one message slot, and the four things that can hold it are not interchangeable.
 * Precedence: refusal → error → correction → hint.
 *
 * - **refusal** — what the field REFUSED to do with your input. Nothing was written and it just
 *   happened, so it is announced: `role="alert"`.
 * - **error** — the caller's gate saying this field is why the send refused. DESCRIBED rather than
 *   announced (it was already true when M06-22's jump landed here) and cleared only by the caller.
 * - **correction** — what the field DID with your input. `role="status"`, cleared on focus.
 * - **hint** — standing guidance.
 */
export function NumberFieldMessage({
  errId,
  refused,
  error,
  correction,
  hint,
}: NumberFieldMessageProps) {
  if (refused !== null) {
    return (
      <p className="hg-number-field-message" data-kind="refusal" role="alert">
        {refused}
      </p>
    );
  }
  if (error !== undefined) {
    return (
      <p className="hg-number-field-message" data-kind="error" id={errId}>
        {error}
      </p>
    );
  }
  if (correction !== null) {
    return (
      <p className="hg-number-field-message" data-kind="correction" role="status">
        {correction}
      </p>
    );
  }
  if (hint !== undefined) {
    return (
      <p className="hg-number-field-message" data-kind="hint">
        {hint}
      </p>
    );
  }
  return null;
}
