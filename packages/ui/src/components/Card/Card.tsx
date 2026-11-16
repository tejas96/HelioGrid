import type { CSSProperties, RefObject } from 'react';
import { useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import { pressOnEnterOrSpace } from '../../primitives/press-keys';
import { StateBody } from '../StateBody';
import { retryOf, surfaceStateOf } from '../UnavailableNote/UnavailableNote.read';
import type { CardProps, IconCircleProps } from './Card.types';

type WebCardProps = CardProps & {
  className?: string;
  style?: CSSProperties;
  /** A `data-*` attribute a page reads back (the customer page times a section by one). */
  [data: `data-${string}`]: string | undefined;
};

interface WebIconCircleProps extends IconCircleProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * The tile (`F7-49`): one record, the card colour inside a hairline — a summary card is glass
 * (`tile="glass"`); a control inside it takes the fill. A stronger edge under the pointer, the inset
 * accent ring when selected. `surface="raised"`
 * is the white card set on the page instead. Ships loading / empty / error / unavailable, like
 * every other surface (law 1).
 */
export function Card({
  children,
  density = 'expressive',
  interactive = false,
  selected = false,
  surface = 'tile',
  tile = 'solid',
  label,
  read,
  loadingLabel,
  focusAfter,
  emptyTitle,
  emptyMessage,
  emptyAction,
  errorTitle,
  errorMessage,
  retryLabel,
  unavailableTitle,
  unavailableMessage,
  onClick,
  as: Element = 'div',
  className,
  style,
  ...data
}: WebCardProps) {
  const state = surfaceStateOf(read);
  const onRetry = retryOf(read);
  const ref = useRef<HTMLElement>(null);
  const body = (
    <StateBody
      state={state}
      loadingLabel={loadingLabel}
      emptyTitle={emptyTitle}
      emptyMessage={emptyMessage}
      emptyAction={emptyAction}
      errorTitle={errorTitle}
      errorMessage={errorMessage}
      onRetry={onRetry}
      retryLabel={retryLabel}
      focusAfter={focusAfter ?? ref}
      unavailableTitle={unavailableTitle}
      unavailableMessage={unavailableMessage}
    >
      {children}
    </StateBody>
  );

  /* A card that shows a read is where focus lands once its retry has left; a static card is no
     stop at all, so it takes no tabindex. */
  const frame = {
    ...data,
    className: classNames('hg-card', read !== undefined ? 'hg-focus-target' : undefined, className),
    'data-density': density,
    'data-surface': surface === 'raised' ? 'raised' : undefined,
    'data-tile': surface === 'tile' && tile === 'glass' ? 'glass' : undefined,
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
        ref={ref as RefObject<HTMLDivElement>}
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
  return (
    <Element
      ref={ref as RefObject<HTMLDivElement>}
      {...frame}
      tabIndex={read !== undefined ? -1 : undefined}
    >
      {body}
    </Element>
  );
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
