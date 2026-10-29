import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { RetryButton } from '../Button/RetryButton';
import { UnavailableNote } from '../UnavailableNote';
import type { CardBodyProps } from './Card.types';

function Shimmer({ width }: { width: '70' | '92' | '54' }) {
  return <span className="hg-card-shimmer" data-w={width} />;
}

export function CardMessage({
  tone,
  title,
  message,
  action,
}: {
  tone?: 'warning';
  title?: TranslatedText;
  message?: TranslatedText;
  action?: ReactNode;
}) {
  return (
    <div className="hg-card-message">
      <p className="hg-card-message-text" data-tone={tone}>
        {title !== undefined ? (
          <strong className="hg-card-message-title">
            {title}
            {message ? ' — ' : ''}
          </strong>
        ) : null}
        {message}
      </p>
      {action}
    </div>
  );
}

/**
 * The card's frame, padding and radius never move between states — only this body changes.
 * `unavailable` renders through `UnavailableNote`: neutral, and no retry.
 */
export function CardBody({
  children,
  state,
  loadingLabel,
  emptyTitle,
  emptyMessage,
  emptyAction,
  errorTitle,
  errorMessage,
  onRetry,
  retryLabel,
  focusAfter,
  unavailableTitle,
  unavailableMessage,
}: CardBodyProps) {
  if (state === 'loading') {
    return (
      <div className="hg-card-loading" role="status" aria-label={loadingLabel}>
        <Shimmer width="70" />
        <Shimmer width="92" />
        <Shimmer width="54" />
      </div>
    );
  }
  if (state === 'error') {
    return (
      <CardMessage
        tone="warning"
        title={errorTitle}
        message={errorMessage}
        action={<RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />}
      />
    );
  }
  if (state === 'unavailable') {
    /* No retry, no warning tint — the absence is stated, not styled as a fault. Its words are the
       caller's, so an absence it does not name draws nothing. */
    return unavailableTitle === undefined ? null : (
      <UnavailableNote title={unavailableTitle} message={unavailableMessage} />
    );
  }
  if (state === 'empty') {
    return <CardMessage title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }
  return <>{children}</>;
}
