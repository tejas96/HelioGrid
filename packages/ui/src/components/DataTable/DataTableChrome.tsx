import type { ReactNode } from 'react';

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
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <span className="hg-dt-selection-count">{count} selected</span>
      <span className="hg-dt-selection-actions">{actions}</span>
    </section>
  );
}

export function Pagination({
  page,
  pageSize,
  rowCount,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  rowCount: number;
  onPageChange?: (page: number) => void;
}) {
  const from = rowCount === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(rowCount, (page + 1) * pageSize);
  const last = Math.max(0, Math.ceil(rowCount / pageSize) - 1);
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
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
  return (
    <div className="hg-dt-pagination">
      <span className="hg-dt-pagination-readout">
        {from}–{to} of {rowCount}
      </span>
      <span className="hg-dt-pagination-steps">
        {step(-1, 'Previous page', page <= 0)}
        {step(1, 'Next page', page >= last)}
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
  action,
}: {
  tone?: 'warning';
  title: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
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
          {tone === 'warning' ? (
            <>
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </>
          ) : (
            <path d="M3 6h18M3 12h18M3 18h10" />
          )}
        </svg>
      </span>
      <div className="hg-dt-message-title">{title}</div>
      {message === undefined ? null : <div className="hg-dt-message-body">{message}</div>}
      {onRetry === undefined ? null : (
        <button type="button" className="hg-dt-retry" onClick={onRetry}>
          Try again
        </button>
      )}
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
          {warn ? (
            <>
              <path d="M12 9v4M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </>
          ) : (
            <path d="m5 13 4 4L19 7" />
          )}
        </svg>
      </span>
      <span className="hg-dt-row-note-text">{text}</span>
      {action === undefined || action === null ? null : (
        <span className="hg-dt-row-note-action">{action}</span>
      )}
    </div>
  );
}
