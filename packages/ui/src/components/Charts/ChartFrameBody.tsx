import type { ReactNode } from 'react';
import { Icon } from '../../primitives/Icon';
import { Pressable } from '../../primitives/Pressable';
import { UnavailableNote } from '../UnavailableNote';
import type { ChartNote, ChartSurfaceState } from './chart-state';
import { CHART_LOADING_LABEL, CHART_RETRY_LABEL, CHART_UNAVAILABLE_TITLE } from './chart-state';

interface ChartFrameBodyProps {
  state: ChartSurfaceState;
  height: number;
  note: ChartNote | null;
  onRetry?: () => void;
  children?: ReactNode;
}

/* The exclamation-in-a-circle `error` and `empty` share. The fourth state's slashed circle is
   NOT drawn here — `UnavailableNote` owns that mark, and this frame composes it. */
const AlertGlyph = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 9v4M12 17h.01" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

/**
 * The plot area, or the state that replaces it. Loading shimmers, `unavailable` states the
 * absence with no retry, and error / empty / not-enough-data share one note.
 */
export function ChartFrameBody({ state, height, note, onRetry, children }: ChartFrameBodyProps) {
  if (state === 'loading') {
    return (
      <div
        role="status"
        aria-label={CHART_LOADING_LABEL}
        className="hg-charts-skeleton"
        style={{ height }}
      />
    );
  }

  if (state === 'unavailable') {
    /* The fourth state: no such series here — no provider, no coverage, a market that declares
       none. Neutral, and never a retry. Rendered by `UnavailableNote`, the system's ONE renderer
       of it, exactly as the design system's ChartFrame composes it. */
    return (
      <div className="hg-charts-region" style={{ height }}>
        <UnavailableNote
          variant="region"
          title={CHART_UNAVAILABLE_TITLE}
          className="hg-charts-unavailable"
        />
      </div>
    );
  }

  if (note !== null) {
    return (
      <div className="hg-charts-note" style={{ height }}>
        <span className="hg-charts-mark" data-tone={note.tone}>
          <Icon size="md">{AlertGlyph}</Icon>
        </span>
        <div className="hg-charts-note-title">{note.title}</div>
        {note.message === undefined ? null : (
          <div className="hg-charts-note-message">{note.message}</div>
        )}
        {state === 'error' && onRetry !== undefined ? (
          <Pressable className="hg-charts-retry" onPress={onRetry}>
            {CHART_RETRY_LABEL}
          </Pressable>
        ) : null}
      </div>
    );
  }

  return children ?? null;
}
