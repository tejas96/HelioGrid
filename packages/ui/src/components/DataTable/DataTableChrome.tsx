import type { ReactNode } from 'react';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { RetryButton } from '../Button/RetryButton';
import { pageWindow } from './DataTable.logic';
import type { PaginationProps } from './DataTable.types';

/* THE TICK IS THE SYSTEM `Checkbox` (see `DataTableHead`, `DataTableBodyRow`, `DataTableCard`).
   A private `SelectBox` lived here behind the note "until the forms Checkbox folder lands"; the
   folder is there, complete, and `FilterPanel` already consumes it, so the table was carrying a
   second `<input type="checkbox">` with its own box, its own radius and its own focus ring. */

/**
 * Selection sits at the TOP of the table, above the column headers — an accent-tinted band that
 * pushes the rows down instead of covering them. It is never a floating overlay, and its clear
 * control is a full 44×44: the in-row exception never reached it, and clearing a 40-row selection
 * by mistake is expensive.
 */
export function SelectionBar({
  count,
  actions,
  onClear,
}: {
  count: number;
  actions: ReactNode;
  onClear: () => void;
}) {
  return (
    <section className="hg-dt-selection" aria-label={`${count} selected`}>
      <button
        type="button"
        aria-label="Clear selection"
        className="hg-dt-selection-clear"
        onClick={onClear}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <ShellGlyphMarks name="close" />
        </svg>
      </button>
      <span className="hg-dt-selection-count">{count} selected</span>
      <span className="hg-dt-selection-actions">{actions}</span>
    </section>
  );
}

/** The pager: the span shown, then a step back and a step forward, each disabled at its end. */
export function Pagination({
  page,
  pageSize,
  rowCount,
  onPageChange,
  previousLabel,
  nextLabel,
  readout,
}: PaginationProps) {
  const { range, last } = pageWindow(page, pageSize, rowCount);
  const step = (direction: number, label: string, disabled: boolean) => (
    <button
      type="button"
      className="hg-dt-page"
      disabled={disabled}
      aria-label={label}
      onClick={() => onPageChange?.(page + direction)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={direction < 0 ? { transform: 'rotate(180deg)' } : undefined}
      >
        <ShellGlyphMarks name="chevron-right" />
      </svg>
    </button>
  );
  return (
    <div className="hg-dt-pagination">
      <span className="hg-dt-pagination-readout">{readout(range)}</span>
      <span className="hg-dt-pagination-steps">
        {step(-1, previousLabel, page <= 0)}
        {step(1, nextLabel, page >= last)}
      </span>
    </div>
  );
}

export function TableSkeleton({ stacked }: { stacked: boolean }) {
  return (
    <div
      className="hg-dt-skeleton"
      role="status"
      aria-label="Loading records"
      data-stacked={stacked ? 'true' : undefined}
    >
      {!stacked ? <div className="hg-dt-skeleton-head" /> : null}
      {['a', 'b', 'c', 'd', 'e'].map((row) => (
        <div className="hg-dt-skeleton-row" key={row}>
          <span className="hg-dt-shimmer" data-w="lead" />
          <span className="hg-dt-shimmer" data-w="mid" />
          <span className="hg-dt-skeleton-spacer" />
          <span className="hg-dt-shimmer" data-w="tail" />
        </div>
      ))}
    </div>
  );
}

/** The centred body of a blocked surface. `warning` is the error form and carries the retry. */
export function TableMessage({
  tone,
  title,
  message,
  onRetry,
  retryLabel,
  action,
}: {
  tone?: 'warning';
  title: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
}) {
  return (
    <div className="hg-dt-message">
      <span className="hg-dt-message-mark" data-tone={tone}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <ShellGlyphMarks name={tone === 'warning' ? 'alert-circle' : 'lines-wide'} />
        </svg>
      </span>
      <div className="hg-dt-message-title">{title}</div>
      {message === undefined ? null : <div className="hg-dt-message-body">{message}</div>}
      <RetryButton onRetry={onRetry} label={retryLabel} />
      {action === undefined ? null : <div className="hg-dt-message-action">{action}</div>}
    </div>
  );
}

/** The row's own line: what is wrong, in words, under the cells it is about. */
export function RowNote({
  issue,
  fixed,
  action,
}: {
  issue: string | null;
  fixed: boolean | string | null;
  action: ReactNode;
}) {
  const warn = issue !== null;
  const text = warn ? issue : typeof fixed === 'string' ? fixed : 'Fixed.';
  return (
    <div className="hg-dt-row-note" data-tone={warn ? 'warning' : 'success'}>
      <span className="hg-dt-row-note-mark" aria-hidden="true">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <ShellGlyphMarks name={warn ? 'alert-circle' : 'tick'} />
        </svg>
      </span>
      <span className="hg-dt-row-note-text">{text}</span>
      {action === undefined || action === null ? null : (
        <span className="hg-dt-row-note-action">{action}</span>
      )}
    </div>
  );
}
