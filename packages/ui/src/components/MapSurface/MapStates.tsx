import { Icon } from '../../primitives/Icon';
import { ShellGlyphMarks } from '../AppShell/ShellGlyphMarks';
import { RetryButton } from '../Button/RetryButton';
import { UnavailableNote } from '../UnavailableNote';

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
    <ShellGlyphMarks name="alert-circle" />
  </svg>
);

const EmptyGlyph = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ShellGlyphMarks name="map" />
  </svg>
);

interface MapNoteProps {
  kind: 'error' | 'empty';
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * A failed tile fetch is `error` and offers a retry; nothing to show yet is `empty` and does
 * not. Neither ever leaves blank space that reads as "no sites".
 */
export function MapNote({ kind, title, message, onRetry, retryLabel }: MapNoteProps) {
  return (
    <div className="hg-map-surface-note">
      <span className="hg-map-surface-mark" data-tone={kind === 'empty' ? 'neutral' : 'warning'}>
        <Icon size="lg">{kind === 'empty' ? EmptyGlyph : AlertGlyph}</Icon>
      </span>
      <div className="hg-map-surface-note-title">{title}</div>
      <div className="hg-map-surface-note-message">{message}</div>
      {kind === 'error' ? <RetryButton onRetry={onRetry} label={retryLabel} /> : null}
    </div>
  );
}

interface MapUnavailableProps {
  title: string;
  message: string;
}

export interface MapStateLayerProps {
  state: 'ready' | 'loading' | 'empty' | 'error' | 'unavailable';
  emptyTitle: string;
  emptyMessage: string;
  unavailableTitle: string;
  unavailableMessage: string;
  errorTitle: string;
  errorMessage: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Every state that replaces the tiles, in one place. `ready` draws nothing here. */
export function MapStateLayer(props: MapStateLayerProps) {
  if (props.state === 'loading') {
    return <div role="status" aria-label="Loading map" className="hg-map-surface-skeleton" />;
  }
  if (props.state === 'unavailable') {
    return <MapUnavailable title={props.unavailableTitle} message={props.unavailableMessage} />;
  }
  if (props.state === 'error') {
    return (
      <MapNote
        kind="error"
        title={props.errorTitle}
        message={props.errorMessage}
        onRetry={props.onRetry}
        retryLabel={props.retryLabel}
      />
    );
  }
  if (props.state === 'empty') {
    return <MapNote kind="empty" title={props.emptyTitle} message={props.emptyMessage} />;
  }
  return null;
}

/**
 * The fourth state. `UnavailableNote` is the system's ONE renderer of it — this layer supplies
 * only the full-bleed plate the note is centred on, exactly as the design system's MapSurface
 * composes it. No retry ever grows here: retrying cannot conjure tile coverage.
 */
export function MapUnavailable({ title, message }: MapUnavailableProps) {
  return (
    <div className="hg-map-surface-region">
      <UnavailableNote variant="region" title={title} message={message} />
    </div>
  );
}
