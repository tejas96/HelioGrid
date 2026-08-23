import type { ReactNode } from 'react';
import { Pressable } from '../../primitives/Pressable';
import { UnavailableNote } from '../UnavailableNote';
import type { CardProps } from './Card.types';

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
  title?: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="hg-card-message">
      <p className="hg-card-message-text" data-tone={tone}>
        {title !== undefined ? (
          <strong className="hg-card-message-title">
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

/**
 * The card's frame, padding and radius never move between states — only this body changes.
 * `unavailable` renders through `UnavailableNote`: neutral, and no retry.
 */
export function CardBody({
  children,
  state,
  emptyTitle,
  emptyMessage,
  emptyAction,
  errorTitle,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: Required<Pick<CardProps, 'state' | 'emptyMessage' | 'errorTitle' | 'errorMessage'>> &
  Pick<
    CardProps,
    | 'children'
    | 'emptyTitle'
    | 'emptyAction'
    | 'onRetry'
    | 'unavailableTitle'
    | 'unavailableMessage'
  >) {
  if (state === 'loading') {
    return (
      <div className="hg-card-loading" role="status" aria-label="Loading">
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
        action={
          onRetry !== undefined ? (
            <Pressable className="hg-card-retry" onPress={onRetry}>
              Try again
            </Pressable>
          ) : null
        }
      />
    );
  }
  if (state === 'unavailable') {
    /* No retry, no warning tint — the absence is stated, not styled as a fault. */
    return <UnavailableNote title={unavailableTitle} message={unavailableMessage} />;
  }
  if (state === 'empty') {
    return <CardMessage title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }
  return <>{children}</>;
}
