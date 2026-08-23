import type { CSSProperties, KeyboardEvent } from 'react';
import { classNames } from '../../primitives/class-names';
import type { CardProps, IconCircleProps } from './Card.types';
import { CardBody } from './CardBody';

interface WebCardProps extends CardProps {
  className?: string;
  style?: CSSProperties;
}

interface WebIconCircleProps extends IconCircleProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Floating white card. No border — e2 at rest, e3 + a -1px lift on hover, the accent ring when
 * selected. Ships loading / empty / error / unavailable, like every other surface (law 1).
 */
export function Card({
  children,
  density = 'expressive',
  interactive = false,
  selected = false,
  state = 'ready',
  emptyTitle,
  emptyMessage = 'Nothing here yet.',
  emptyAction,
  errorTitle = "Couldn't load this",
  errorMessage = 'Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  unavailableTitle = 'Not available here',
  unavailableMessage,
  onClick,
  className,
  style,
}: WebCardProps) {
  const body = (
    <CardBody
      state={state}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      emptyAction={emptyAction}
      errorTitle={errorTitle}
      errorMessage={errorMessage}
      onRetry={onRetry}
      unavailableTitle={unavailableTitle}
      unavailableMessage={unavailableMessage}
    >
      {children}
    </CardBody>
  );

  const frame = {
    className: classNames('hg-card', className),
    'data-density': density,
    'data-interactive': interactive ? 'true' : undefined,
    'data-selected': selected ? 'true' : undefined,
    style,
  };

  /* The DS reference is a bare div with onClick. A clickable surface in this repo has to be
     keyboard reachable (ui-adherence, "Done means"), so a card WITH a handler takes button
     semantics; without one it stays a plain div and nothing is announced. */
  if (onClick !== undefined) {
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    };
    return (
      // biome-ignore lint/a11y/useSemanticElements: a button cannot hold interactive content.
      <div {...frame} role="button" tabIndex={0} onClick={onClick} onKeyDown={onKeyDown}>
        {body}
      </div>
    );
  }
  return <div {...frame}>{body}</div>;
}

/** Signature circular icon container — a soft 6% tint of a semantic/brand colour. */
export function IconCircle({
  children,
  color = 'var(--accent)',
  size = 40,
  className,
  style,
}: WebIconCircleProps) {
  const vars = {
    '--hg-icon-circle-size': `${size}px`,
    '--hg-icon-circle-color': color,
  } as CSSProperties;
  return (
    <span className={classNames('hg-icon-circle', className)} style={{ ...vars, ...style }}>
      {children}
    </span>
  );
}
