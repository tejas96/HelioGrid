import { classNames } from '../../primitives/class-names';
import type { CardRowProps, CardRowsProps } from './CardRows.types';
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
      {open === undefined ? null : (
        <button
          type="button"
          className="hg-card-row-target"
          aria-label={open.name}
          aria-current={open.current ? 'true' : undefined}
          onClick={open.onOpen}
        />
      )}
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
