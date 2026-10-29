import type { TranslatedText } from '@heliogrid/contracts';
import type { FocusAfter } from '../../primitives/FocusAfter';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { RetryButton } from '../Button/RetryButton';
import { UnavailableNote } from '../UnavailableNote';
import type { KanbanBoardState } from './Kanban.logic';
import { boardMarkOf, KANBAN_SKELETON_BARS, skeletonColumnsOf } from './KanbanStates.logic';

/**
 * A column-shaped placeholder. Never a value presented as a real one — three empty bars where
 * three cards will be, in the same footprint the column will occupy.
 */
export function ColumnSkeleton({ stacked, label }: { stacked: boolean; label: TranslatedText }) {
  return (
    <div
      className="hg-kanban-skeleton"
      data-stacked={stacked ? 'true' : undefined}
      role="status"
      aria-label={label}
    >
      <div className="hg-kanban-skeleton-bar hg-kanban-skeleton-head" />
      <div className="hg-kanban-skeleton-bars">
        {KANBAN_SKELETON_BARS.map((k) => (
          <div key={k} className="hg-kanban-skeleton-bar hg-kanban-skeleton-card" />
        ))}
      </div>
    </div>
  );
}

interface BoardMessageProps {
  tone?: 'warning';
  title?: TranslatedText;
  message?: TranslatedText;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  /** The board's frame, where focus lands once the retry has left. */
  focusAfter: FocusAfter;
}

/** The board's own empty and error surfaces. `unavailable` is `UnavailableNote`'s, never this. */
export function BoardMessage({
  tone,
  title,
  message,
  onRetry,
  retryLabel,
  focusAfter,
}: BoardMessageProps) {
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
          <ShellGlyphMarks name={boardMarkOf(tone)} />
        </svg>
      </span>
      {title ? <div className="hg-kanban-message-title">{title}</div> : null}
      {message ? <div className="hg-kanban-message-text">{message}</div> : null}
      <RetryButton onRetry={onRetry} label={retryLabel} focusAfter={focusAfter} />
    </div>
  );
}

export interface BoardStateViewProps {
  state: KanbanBoardState;
  stacked: boolean;
  loadingLabel: TranslatedText;
  errorTitle?: TranslatedText;
  errorMessage?: TranslatedText;
  onRetry?: () => void;
  retryLabel?: TranslatedText;
  /** The board's frame, where focus lands once the retry has left. */
  focusAfter: FocusAfter;
  unavailableTitle?: TranslatedText;
  unavailableMessage?: TranslatedText;
  emptyTitle?: TranslatedText;
  emptyDescription?: TranslatedText;
}

/**
 * The face the board shows instead of its columns. `loading` holds the columns' own footprint so
 * nothing reflows when the board lands; `unavailable` is `UnavailableNote`'s — no such board here
 * at all — while `error` and `empty` are the board's own surfaces.
 */
export function BoardStateView({
  state,
  stacked,
  loadingLabel,
  errorTitle,
  errorMessage,
  onRetry,
  retryLabel,
  focusAfter,
  unavailableTitle,
  unavailableMessage,
  emptyTitle,
  emptyDescription,
}: BoardStateViewProps) {
  if (state === 'error') {
    return (
      <BoardMessage
        tone="warning"
        title={errorTitle}
        message={errorMessage}
        onRetry={onRetry}
        retryLabel={retryLabel}
        focusAfter={focusAfter}
      />
    );
  }
  if (state === 'unavailable') {
    return unavailableTitle === undefined ? null : (
      <UnavailableNote variant="region" title={unavailableTitle} message={unavailableMessage} />
    );
  }
  if (state === 'loading') {
    return (
      <>
        {skeletonColumnsOf(stacked).map((k) => (
          <ColumnSkeleton key={k} stacked={stacked} label={loadingLabel} />
        ))}
      </>
    );
  }
  return <BoardMessage title={emptyTitle} message={emptyDescription} focusAfter={focusAfter} />;
}
