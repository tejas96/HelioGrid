import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { RetryButton } from '../Button/RetryButton';
import { StateRegion } from '../StateBody';

/** Six shimmer bars — the loading form. Never a placeholder value presented as a real one. */
export function CompareSkeleton({ label }: { label: TranslatedText }) {
  return (
    <div className="hg-compare-skeleton" role="status" aria-label={label}>
      {['title', 'a', 'b', 'c', 'd', 'e'].map((row) => (
        <span
          className="hg-compare-shimmer hg-skeleton"
          data-lead={row === 'title' ? 'true' : undefined}
          key={row}
        />
      ))}
    </div>
  );
}

/**
 * The centred body of a blocked surface.
 *
 * `tone="warning"` is the **error** form and carries the retry. The neutral form is both `empty`
 * ("none yet") and `unavailable` ("this was never going to be here") — and `unavailable` never
 * gets a retry, because trying again cannot change the answer.
 */
export function CompareMessage({
  tone,
  title,
  message,
  onRetry,
  retryLabel,
  focusAfter,
}: {
  tone?: 'warning';
  title: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  /** Where focus lands once *Try again* has gone with this message. */
  focusAfter: FocusAfter;
}) {
  return (
    <StateRegion
      tone={tone}
      glyph="columns"
      title={title}
      message={message}
      action={<RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />}
    />
  );
}
