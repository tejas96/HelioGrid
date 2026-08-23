import type { DayMarker } from './DatePicker.types';

interface CalendarNavProps {
  /** -1 previous, 1 next. The chevron is one path, rotated. */
  dir: -1 | 1;
  label: string;
  onClick: () => void;
}

/** A month arrow. 44px, and drawn only when the month is actually movable. */
export function CalendarNav({ dir, label, onClick }: CalendarNavProps) {
  return (
    <button
      type="button"
      className="hg-calendar-nav"
      data-dir={dir < 0 ? 'prev' : 'next'}
      aria-label={label}
      onClick={onClick}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}

interface CalendarCellProps {
  date: Date;
  selected: boolean;
  between: boolean;
  disabled: boolean;
  locked: boolean;
  today: boolean;
  marker: DayMarker | undefined;
  spokenDate: string;
  onPick: (d: Date) => void;
}

/**
 * One day — the same file the native half keeps its cell in, so the `gridcell` role and the
 * chosen/locked states are declared once per platform in the SAME place.
 *
 * The second channel for a locked member is a BAR, never a tone and never a tooltip.
 */
export function CalendarCell({
  date,
  selected,
  between,
  disabled,
  locked,
  today,
  marker,
  spokenDate,
  onPick,
}: CalendarCellProps) {
  const markerSuffix = marker === undefined ? '' : `, ${marker.label ?? marker.tone ?? ''}`;
  const lockedSuffix = locked ? ', supplied by the market pack, cannot be removed' : '';
  return (
    // biome-ignore lint/a11y/useSemanticElements: the cell is a real button inside a CSS grid, not a table cell — see the grid comment in Calendar.tsx.
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: `aria-pressed` on a gridcell is the DS's own spelling of "this date is chosen"; kept verbatim and reported as a DS defect.
    <button
      type="button"
      role="gridcell"
      className="hg-calendar-cell"
      data-selected={selected ? 'true' : undefined}
      data-between={between ? 'true' : undefined}
      data-today={today ? 'true' : undefined}
      disabled={disabled}
      aria-disabled={locked ? true : undefined}
      aria-pressed={selected}
      aria-label={`${spokenDate}${markerSuffix}${lockedSuffix}`}
      onClick={() => onPick(date)}
    >
      {date.getDate()}
      {locked ? <span aria-hidden="true" className="hg-calendar-lock-bar" /> : null}
      {marker !== undefined && !locked ? (
        <span
          aria-hidden="true"
          className="hg-calendar-marker"
          data-tone={marker.tone ?? 'neutral'}
        />
      ) : null}
    </button>
  );
}

const SKELETON_CELLS = 35;

/** Loading is the grid's own state, not a surface's — five weeks of shimmering cells. */
export function CalendarSkeleton() {
  return (
    <div className="hg-calendar-skeleton" role="status" aria-label="Loading">
      {Array.from({ length: SKELETON_CELLS }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton cells have no identity but their slot.
        <span key={`skeleton-${i}`} className="hg-calendar-skeleton-cell" />
      ))}
    </div>
  );
}
