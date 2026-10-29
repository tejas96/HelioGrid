import type { TranslatedText } from '@heliogrid/contracts';
import type { ReactNode } from 'react';
import { RetryButton } from '../Button/RetryButton';
import type { BlockBodyProps } from './Block.types';

function Shimmer({ width }: { width: '72' | '94' | '58' }) {
  return <span className="hg-block-shimmer" data-w={width} />;
}

export function BlockMessage({
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
    <div className="hg-block-message">
      <p className="hg-block-message-text" data-tone={tone}>
        {title !== undefined ? (
          <strong className="hg-block-message-title">
            {title}
            {message !== undefined ? ' — ' : ''}
          </strong>
        ) : null}
        {message}
      </p>
      {action}
    </div>
  );
}

/** The body is the only part that moves between states; the header and the frame stay put. */
export function BlockBody({
  children,
  state,
  loadingLabel,
  emptyMessage,
  emptyTitle,
  emptyAction,
  errorTitle,
  errorMessage,
  onRetry,
  retryLabel,
  focusAfter,
  unavailableTitle,
  unavailableMessage,
}: BlockBodyProps) {
  if (state === 'loading') {
    return (
      <div className="hg-block-loading" role="status" aria-label={loadingLabel}>
        <Shimmer width="72" />
        <Shimmer width="94" />
        <Shimmer width="58" />
      </div>
    );
  }
  if (state === 'error') {
    return (
      <BlockMessage
        tone="warning"
        title={errorTitle}
        message={errorMessage}
        action={<RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />}
      />
    );
  }
  if (state === 'unavailable') {
    return <BlockMessage title={unavailableTitle} message={unavailableMessage} />;
  }
  if (state === 'empty') {
    /* Says so and stays. No icon, no bloom, no 48px of air — the screen around it is full. */
    return <BlockMessage title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }
  return <>{children}</>;
}
