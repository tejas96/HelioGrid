import { type MouseEvent, useImperativeHandle, useRef } from 'react';
import { classNames } from '../../primitives/class-names';
import type { CardRowOpen, CardRowProps, CardRowsProps } from './CardRows.types';
import './CardRows.css';

/** The one glass card (Ground's tiles list) that holds a list's rows. It rises once; its rows never arrive one by one. */
export function CardRows({ children }: CardRowsProps) {
  return <ul className="hg-card-rows">{children}</ul>;
}

/**
 * One row of the card. `className` lays out the caller's body; the row owns its frame, its open
 * target under the body and its press, so every list of rows answers a tap the same way.
 */
export function CardRow({
  children,
  first,
  open,
  aside,
  after,
  highlighted = false,
  muted = false,
  busy = false,
  targetRef,
  className,
}: CardRowProps & { className?: string }) {
  return (
    <li
      className="hg-card-row"
      data-first={first ? 'true' : undefined}
      data-highlighted={highlighted ? 'true' : undefined}
      data-muted={muted ? 'true' : undefined}
      aria-busy={busy ? true : undefined}
    >
      {open === undefined ? null : <CardRowTarget open={open} targetRef={targetRef} />}
      <div
        className={classNames('hg-card-row-body', className)}
        data-inert={open === undefined ? undefined : 'true'}
      >
        {children}
        {aside === undefined || aside === null ? null : (
          <span className="hg-card-row-aside">{aside}</span>
        )}
      </div>
      {after === undefined || after === null ? null : (
        <div className="hg-card-row-after">{after}</div>
      )}
    </li>
  );
}

/**
 * The row's whole-width target under its body: a link when the record has an address — its name
 * its words, spoken and never drawn — else a button.
 */
function CardRowTarget({
  open,
  targetRef,
}: Pick<CardRowProps, 'targetRef'> & { open: CardRowOpen }) {
  const target = useRef<HTMLElement | null>(null);
  useImperativeHandle(
    targetRef,
    () => ({ focus: (options) => target.current?.focus(options) }),
    [],
  );
  const hold = (element: HTMLElement | null) => {
    target.current = element;
  };
  if (open.href === undefined) {
    return (
      <button
        ref={hold}
        type="button"
        className="hg-card-row-target"
        aria-label={open.name}
        aria-current={open.current ? 'true' : undefined}
        onClick={open.onOpen}
      />
    );
  }
  return (
    <a
      ref={hold}
      href={open.href}
      className="hg-card-row-target"
      aria-current={open.current ? 'true' : undefined}
      onClick={(event) => openInPlace(event, open)}
    >
      <span className="hg-spoken-only">{open.name}</span>
    </a>
  );
}

/** A plain click opens in place; one with a modifier, or not the main button, is the browser's. */
function openInPlace(event: MouseEvent<HTMLAnchorElement>, open: CardRowOpen): void {
  const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (modified || event.button !== 0) return;
  event.preventDefault();
  open.onOpen();
}
