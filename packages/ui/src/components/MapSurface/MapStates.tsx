import { RetryButton } from '../Button/RetryButton';
import { StateRegion } from '../StateBody';
import { UnavailableNote } from '../UnavailableNote';
import { mapNoteOf } from './MapSurface.logic';
import type { MapNoteProps, MapStateLayerProps, MapUnavailableProps } from './MapSurface.types';

/**
 * A failed tile fetch is `error` and offers a retry; nothing to show yet is `empty` and does
 * not. Neither ever leaves blank space that reads as "no sites".
 */
export function MapNote({ kind, title, message, onRetry, retry }: MapNoteProps) {
  return (
    <StateRegion
      tone={kind === 'empty' ? undefined : 'warning'}
      glyph="map"
      title={title}
      message={message}
      action={
        retry === undefined ? null : (
          <RetryButton onRetry={onRetry} label={retry.label} focusAfter={retry.focusAfter} />
        )
      }
      className="hg-map-surface-note"
    />
  );
}

/** Every state that replaces the tiles, in one place. `ready` draws nothing here. */
export function MapStateLayer(props: MapStateLayerProps) {
  if (props.state === 'loading') {
    return (
      <div
        role="status"
        aria-label={props.words.loading}
        className="hg-map-surface-skeleton hg-skeleton"
      />
    );
  }
  if (props.state === 'unavailable') {
    return <MapUnavailable title={props.unavailableTitle} message={props.unavailableMessage} />;
  }
  const note = mapNoteOf(props);
  return note === null ? null : <MapNote {...note} />;
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
