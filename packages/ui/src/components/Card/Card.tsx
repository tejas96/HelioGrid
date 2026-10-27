import type { CSSProperties } from 'react';
import { classNames } from '../../primitives/class-names';
import { pressOnEnterOrSpace } from '../../primitives/press-keys';
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
 * The tile (`F7-49`): one record, grey on the white page, no shadow — a control inside it turns
 * white. `--fill-hover` under the pointer, the inset accent ring when selected. `surface="raised"`
 * is the white card set on the page instead. Ships loading / empty / error / unavailable, like
 * every other surface (law 1).
 */
export function Card({
  children,
  density = 'expressive',
  interactive = false,
  selected = false,
  surface = 'tile',
  label,
  state = 'ready',
  emptyTitle,
  emptyMessage = 'Nothing here yet.',
  emptyAction,
  errorTitle = "Couldn't load this",
  errorMessage = 'Try again. If it keeps failing, tell your admin what you were doing.',
  onRetry,
  retryLabel,
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
      retryLabel={retryLabel}
      unavailableTitle={unavailableTitle}
      unavailableMessage={unavailableMessage}
    >
      {children}
    </CardBody>
  );

  const frame = {
    className: classNames('hg-card', className),
    'data-density': density,
    'data-surface': surface === 'raised' ? 'raised' : undefined,
    'data-interactive': interactive ? 'true' : undefined,
    'data-selected': selected ? 'true' : undefined,
    style,
  };

  /* A clickable surface in this repo has to be keyboard reachable (ui-adherence, "Done means"),
     so a card WITH a handler takes button semantics; without one it stays a plain div and nothing
     is announced. `label` names it as one control and says which card is current — the DS's
     opt-in; a card with a handler and no label keeps the unnamed button it always drew. */
  if (onClick !== undefined) {
    return (
      // biome-ignore lint/a11y/useSemanticElements: a button cannot hold interactive content.
      <div
        {...frame}
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-current={label !== undefined && selected ? 'true' : undefined}
        onClick={onClick}
        onKeyDown={pressOnEnterOrSpace(onClick)}
      >
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
