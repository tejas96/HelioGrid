import { Pressable } from '../../primitives/Pressable';
import { UnavailableNote } from '../UnavailableNote';
import type { KanbanBoardState } from './Kanban.logic';

const SKELETON_BARS = ['a', 'b', 'c'];
const SKELETONS = ['a', 'b', 'c', 'd'];

/**
 * A column-shaped placeholder. Never a value presented as a real one — three empty bars where
 * three cards will be, in the same footprint the column will occupy.
 */
export function ColumnSkeleton({ stacked }: { stacked: boolean }) {
  return (
    <div
      className="hg-kanban-skeleton"
      data-stacked={stacked ? 'true' : undefined}
      role="status"
      aria-label="Loading board"
    >
      <div className="hg-kanban-skeleton-bar hg-kanban-skeleton-head" />
      <div className="hg-kanban-skeleton-bars">
        {SKELETON_BARS.map((k) => (
          <div key={k} className="hg-kanban-skeleton-bar hg-kanban-skeleton-card" />
        ))}
      </div>
    </div>
  );
}

interface BoardMessageProps {
  tone?: 'warning';
  title: string;
  message?: string;
  onRetry?: () => void;
}

/** The board's own empty and error surfaces. `unavailable` is `UnavailableNote`'s, never this. */
export function BoardMessage({ tone, title, message, onRetry }: BoardMessageProps) {
  return (
    <div className="hg-kanban-message">
      <span className="hg-kanban-message-mark" data-tone={tone}>
        <svg
          width="22"
          height="22"
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
            <>
              <rect x="3" y="4" width="5" height="16" rx="1.5" />
              <rect x="10" y="4" width="5" height="10" rx="1.5" />
              <rect x="17" y="4" width="4" height="7" rx="1.5" />
            </>
          )}
        </svg>
      </span>
      <div className="hg-kanban-message-title">{title}</div>
      {message ? <div className="hg-kanban-message-text">{message}</div> : null}
      {onRetry ? (
        <Pressable className="hg-kanban-message-retry" onPress={onRetry}>
          Try again
        </Pressable>
      ) : null}
    </div>
  );
}

export interface BoardStateViewProps {
  state: KanbanBoardState;
  stacked: boolean;
  errorTitle: string;
  errorMessage: string;
  onRetry?: () => void;
  unavailableTitle: string;
  unavailableMessage?: string;
  emptyTitle: string;
  emptyDescription?: string;
}

/**
 * The face the board shows instead of its columns. `loading` holds the columns' own footprint so
 * nothing reflows when the board lands; `unavailable` is `UnavailableNote`'s — no such board here
 * at all — while `error` and `empty` are the board's own surfaces.
 */
export function BoardStateView({
  state,
  stacked,
  errorTitle,
  errorMessage,
  onRetry,
  unavailableTitle,
  unavailableMessage,
  emptyTitle,
  emptyDescription,
}: BoardStateViewProps) {
  if (state === 'error') {
    return (
      <BoardMessage tone="warning" title={errorTitle} message={errorMessage} onRetry={onRetry} />
    );
  }
  if (state === 'unavailable') {
    return (
      <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
    );
  }
  if (state === 'loading') {
    return (
      <>
        {(stacked ? SKELETONS.slice(0, 1) : SKELETONS).map((k) => (
          <ColumnSkeleton key={k} stacked={stacked} />
        ))}
      </>
    );
  }
  return <BoardMessage title={emptyTitle} message={emptyDescription} />;
}
