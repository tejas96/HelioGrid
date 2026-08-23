import type { ReactNode } from 'react';
import { Pressable } from '../../primitives/Pressable';
import type { BlockProps } from './Block.types';

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
  title?: string;
  message?: string;
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

export type BlockBodyProps = Required<
  Pick<BlockProps, 'state' | 'emptyMessage' | 'errorTitle' | 'errorMessage' | 'unavailableTitle'>
> &
  Pick<
    BlockProps,
    'children' | 'title' | 'emptyTitle' | 'emptyAction' | 'onRetry' | 'unavailableMessage'
  >;

/** The body is the only part that moves between states; the header and the frame stay put. */
export function BlockBody({
  children,
  title,
  state,
  emptyMessage,
  emptyTitle,
  emptyAction,
  errorTitle,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
}: BlockBodyProps) {
  if (state === 'loading') {
    return (
      <div
        className="hg-block-loading"
        role="status"
        aria-label={title !== undefined ? `Loading ${title}` : 'Loading'}
      >
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
        action={
          onRetry !== undefined ? (
            <Pressable className="hg-block-retry" onPress={onRetry}>
              Try again
            </Pressable>
          ) : null
        }
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
